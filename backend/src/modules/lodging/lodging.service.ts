import { Timestamp } from 'firebase-admin/firestore';
import { LODGING_RULES } from '../../config/constants';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { LodgingConfig, Product, productsRepository } from '../products/products.repository';
import { settingsRepository } from '../settings/settings.repository';
import { culqiService } from '../payments/culqi.service';
import { mercadopagoService } from '../payments/mercadopago.service';
import { addDays, daysInclusive, diffDays, nightsBetween, todayLima } from './lodging.dates';
import {
  Booking,
  BookingDoc,
  BookingNight,
  generateBookingCode,
  isNightTaken,
  lodgingRepository,
} from './lodging.repository';
import {
  BlockNightsInput,
  BookingQuery,
  CalendarQuery,
  CreateBookingInput,
  CreateManualBookingInput,
  SetPricesInput,
  UnblockNightsInput,
  UpdateBookingInput,
  UpdateLodgingConfigInput,
} from './lodging.schema';

const DEFAULT_CONFIG: LodgingConfig = {
  bookable: false,
  nightlyPrice: null,
  maxGuests: 2,
  minNights: 1,
  checkInTime: '14:00',
  checkOutTime: '12:00',
  priceOverrides: {},
};

/** Rango máximo que el admin puede bloquear/editar de una vez (límite de la transacción). */
const MAX_ADMIN_RANGE_DAYS = 180;

const round2 = (n: number) => Math.round(n * 100) / 100;

export const configOf = (product: Product): LodgingConfig => ({
  ...DEFAULT_CONFIG,
  ...(product.lodging ?? {}),
  priceOverrides: product.lodging?.priceOverrides ?? {},
});

/** Un departamento acepta reservas web si está activo, habilitado y con precio. */
const isBookable = (product: Product): boolean => {
  const cfg = configOf(product);
  return (
    product.division === 'HOSPITALIDAD' &&
    product.isActive &&
    cfg.bookable &&
    cfg.nightlyPrice !== null &&
    cfg.nightlyPrice > 0
  );
};

/** Precio de cada noche: el especial de esa fecha o, si no hay, el base. */
const priceNights = (cfg: LodgingConfig, dates: string[]): BookingNight[] =>
  dates.map((date) => {
    const price = cfg.priceOverrides[date] ?? cfg.nightlyPrice;
    if (price === null || price === undefined) {
      throw new ConflictError('El departamento no tiene precio por noche configurado');
    }
    return { date, price };
  });

const assertRange = (from: string, to: string) => {
  if (diffDays(from, to) + 1 > MAX_ADMIN_RANGE_DAYS) {
    throw new ValidationError([
      { path: 'to', message: `Seleccione como máximo ${MAX_ADMIN_RANGE_DAYS} días a la vez` },
    ]);
  }
};

const getLodgingProduct = async (productId: string): Promise<Product> => {
  const product = await productsRepository.findById(productId);
  if (!product || product.division !== 'HOSPITALIDAD') throw new NotFoundError('Departamento');
  return product;
};

/** Pasa a EXPIRADA (y lo guarda) una reserva cuyo apartado venció sin pago. */
const withEffectiveStatus = async (booking: Booking): Promise<Booking> => {
  if (
    booking.status === 'PENDIENTE_PAGO' &&
    booking.holdExpiresAt &&
    booking.holdExpiresAt.toMillis() <= Date.now()
  ) {
    await lodgingRepository.update(booking.id, { status: 'EXPIRADA' });
    return { ...booking, status: 'EXPIRADA' };
  }
  return booking;
};

/** Datos de una reserva que ve el cliente (sin datos internos del pago). */
const publicBooking = (b: Booking) => ({
  code: b.code,
  productTitle: b.productTitle,
  checkIn: b.checkIn,
  checkOut: b.checkOut,
  nights: b.nights,
  guests: b.guests,
  total: b.total,
  status: b.status,
  paymentStatus: b.paymentStatus,
});

export const lodgingService = {
  /* ------------------------------ Público ------------------------------ */

  /** Ficha de reserva: precios, reglas y noches no disponibles del próximo año. */
  async getPublicUnit(slug: string) {
    const product = await productsRepository.findBySlug(slug);
    if (!product || !isBookable(product)) throw new NotFoundError('Departamento');

    const cfg = configOf(product);
    const today = todayLima();
    const maxDate = addDays(today, LODGING_RULES.MAX_ADVANCE_DAYS);
    const now = Timestamp.now();
    const nights = await lodgingRepository.listNights(product.id, today, maxDate);

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      images: product.images,
      lodging: {
        nightlyPrice: cfg.nightlyPrice,
        maxGuests: cfg.maxGuests,
        minNights: cfg.minNights,
        checkInTime: cfg.checkInTime,
        checkOutTime: cfg.checkOutTime,
        priceOverrides: Object.fromEntries(
          Object.entries(cfg.priceOverrides).filter(([d]) => d >= today && d <= maxDate),
        ),
      },
      unavailable: nights.filter((n) => isNightTaken(n, now)).map((n) => n.date),
      today,
      maxDate,
      maxNights: LODGING_RULES.MAX_NIGHTS,
      holdMinutes: LODGING_RULES.HOLD_MINUTES,
    };
  },

  /**
   * Reserva web: valida reglas, calcula el precio en el servidor, aparta las
   * noches y prepara el cobro en la pasarela elegida.
   */
  async createWebBooking(input: CreateBookingInput) {
    const product = await productsRepository.findBySlug(input.productSlug);
    if (!product || !isBookable(product)) throw new NotFoundError('Departamento');
    const cfg = configOf(product);

    const today = todayLima();
    const dates = nightsBetween(input.checkIn, input.checkOut);
    const issues: { path: string; message: string }[] = [];
    if (input.checkIn < today) issues.push({ path: 'checkIn', message: 'La llegada no puede ser en el pasado' });
    if (input.checkOut > addDays(today, LODGING_RULES.MAX_ADVANCE_DAYS + 1)) {
      issues.push({ path: 'checkOut', message: 'Solo se puede reservar hasta con un año de anticipación' });
    }
    if (dates.length < cfg.minNights) {
      issues.push({ path: 'checkOut', message: `La estadía mínima es de ${cfg.minNights} noche(s)` });
    }
    if (dates.length > LODGING_RULES.MAX_NIGHTS) {
      issues.push({
        path: 'checkOut',
        message: `Para estadías de más de ${LODGING_RULES.MAX_NIGHTS} noches escríbanos por WhatsApp`,
      });
    }
    if (input.guests > cfg.maxGuests) {
      issues.push({ path: 'guests', message: `Máximo ${cfg.maxGuests} huésped(es)` });
    }
    if (issues.length) throw new ValidationError(issues);

    const payCfg = await settingsRepository.getPaymentConfig();
    if (input.paymentMethod === 'MERCADOPAGO' && !payCfg.mercadopagoEnabled) {
      throw new ConflictError('MercadoPago no está disponible en este momento');
    }
    if (input.paymentMethod === 'CULQI' && !(payCfg.culqiEnabled && payCfg.culqiPublicKey)) {
      throw new ConflictError('El pago con tarjeta (Culqi) no está disponible en este momento');
    }

    const nightly = priceNights(cfg, dates);
    const total = round2(nightly.reduce((sum, n) => sum + n.price, 0));
    const holdExpiresAt = Timestamp.fromMillis(Date.now() + LODGING_RULES.HOLD_MINUTES * 60_000);
    const code = await generateBookingCode();

    const data: Omit<BookingDoc, 'createdAt' | 'updatedAt'> = {
      code,
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: dates.length,
      guests: input.guests,
      nightly,
      total,
      currency: 'PEN',
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        documentType: input.customer.documentType,
        documentNumber: input.customer.documentNumber,
      },
      notes: input.notes ?? null,
      status: 'PENDIENTE_PAGO',
      source: 'WEB',
      paymentMethod: input.paymentMethod,
      paymentStatus: 'PENDING',
      holdExpiresAt,
      transactionId: null,
      rawPayload: null,
      paidAt: null,
      cancelReason: null,
      cancelledAt: null,
      internalNotes: null,
    };

    const id = await lodgingRepository.createWithNights(data, 'HOLD');
    const booking = { id, ...data } as Booking;

    let paymentInfo: Record<string, unknown> = {};
    if (input.paymentMethod === 'MERCADOPAGO') {
      try {
        const pref = await mercadopagoService.createBookingPreference(booking);
        paymentInfo = { mercadopago: { redirectUrl: pref.initPoint } };
      } catch (err) {
        // Sin link de pago no tiene sentido retener las noches.
        await lodgingRepository.cancel(id, 'No se pudo generar el pago en MercadoPago');
        throw err;
      }
    } else {
      paymentInfo = { culqi: { publicKey: payCfg.culqiPublicKey } };
    }

    return {
      ...publicBooking(booking),
      paymentMethod: input.paymentMethod,
      holdExpiresAt: holdExpiresAt.toDate().toISOString(),
      paymentInfo,
    };
  },

  /** Cobro con Culqi (síncrono). Idempotente: no recobra una reserva pagada. */
  async processCulqiCharge(code: string, token: string) {
    let booking = await lodgingRepository.findByCode(code);
    if (!booking) throw new NotFoundError('Reserva');
    if (booking.paymentMethod !== 'CULQI') throw new ConflictError('Esta reserva no se paga con Culqi');
    if (booking.paymentStatus === 'PAID') {
      return { booking: publicBooking(booking), approved: true, declineMessage: null };
    }

    booking = await withEffectiveStatus(booking);
    if (booking.status !== 'PENDIENTE_PAGO') {
      throw new ConflictError('El tiempo para pagar esta reserva venció. Vuelva a elegir sus fechas.');
    }
    if (!booking.customer.email) throw new ConflictError('La reserva no tiene correo para el cobro');

    const result = await culqiService.createCharge(
      { code: booking.code, total: booking.total, customer: { name: booking.customer.name } },
      token,
      booking.customer.email,
      `Reserva ${booking.code} - ${booking.productTitle}`,
    );

    if (result.approved) {
      await lodgingRepository.confirmPayment(booking.id, {
        transactionId: result.chargeId || null,
        rawPayload: result.raw,
      });
    } else {
      await lodgingRepository.update(booking.id, {
        paymentStatus: 'REJECTED',
        transactionId: result.chargeId || null,
        rawPayload: result.raw,
      });
    }

    const updated = (await lodgingRepository.findById(booking.id))!;
    return { booking: publicBooking(updated), approved: result.approved, declineMessage: result.declineMessage };
  },

  /** Webhook de MercadoPago para una reserva (código RES-...). Idempotente. */
  async confirmMercadoPago(
    code: string,
    result: { approved: boolean; transactionId: string | null; rawPayload: Record<string, unknown> | null },
  ): Promise<void> {
    const booking = await lodgingRepository.findByCode(code);
    if (!booking || booking.paymentMethod !== 'MERCADOPAGO') return;
    if (booking.paymentStatus === 'PAID') return;

    if (result.approved) {
      await lodgingRepository.confirmPayment(booking.id, {
        transactionId: result.transactionId,
        rawPayload: result.rawPayload,
      });
    } else if (booking.status === 'PENDIENTE_PAGO') {
      // Se conserva el apartado: el cliente puede reintentar en MercadoPago.
      await lodgingRepository.update(booking.id, {
        paymentStatus: 'REJECTED',
        transactionId: result.transactionId,
        rawPayload: result.rawPayload,
      });
    }
  },

  /* ------------------------------- Admin ------------------------------- */

  async listUnits() {
    const items = await productsRepository.listByDivision('HOSPITALIDAD');
    return items.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      isActive: p.isActive,
      imageUrl: p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url ?? null,
      lodging: configOf(p),
    }));
  },

  async updateConfig(productId: string, input: UpdateLodgingConfigInput) {
    const product = await getLodgingProduct(productId);
    const next: LodgingConfig = { ...configOf(product), ...input };
    if (next.bookable && !(next.nightlyPrice && next.nightlyPrice > 0)) {
      throw new ValidationError([
        { path: 'nightlyPrice', message: 'Configure el precio por noche antes de activar las reservas' },
      ]);
    }
    await productsRepository.update(productId, { lodging: next });
    return next;
  },

  /** Precio especial para un rango de días (price null = volver al precio base). */
  async setPrices(productId: string, input: SetPricesInput) {
    assertRange(input.from, input.to);
    const product = await getLodgingProduct(productId);
    const cfg = configOf(product);
    const today = todayLima();

    // Se descartan las fechas ya pasadas para que el mapa no crezca sin límite.
    const overrides = Object.fromEntries(
      Object.entries(cfg.priceOverrides).filter(([d]) => d >= today),
    );
    for (const d of daysInclusive(input.from, input.to)) {
      if (input.price === null) delete overrides[d];
      else overrides[d] = input.price;
    }

    const next = { ...cfg, priceOverrides: overrides };
    await productsRepository.update(productId, { lodging: next });
    return next;
  },

  /** Calendario del admin: estado de cada noche ocupada y precios del rango. */
  async getCalendar(productId: string, query: CalendarQuery) {
    assertRange(query.from, query.to);
    const product = await getLodgingProduct(productId);
    const cfg = configOf(product);
    const now = Timestamp.now();
    const nights = await lodgingRepository.listNights(productId, query.from, query.to);

    return {
      nightlyPrice: cfg.nightlyPrice,
      priceOverrides: Object.fromEntries(
        Object.entries(cfg.priceOverrides).filter(([d]) => d >= query.from && d <= query.to),
      ),
      // Los apartados vencidos ya no ocupan la noche.
      nights: nights
        .filter((n) => n.status !== 'HOLD' || isNightTaken(n, now))
        .map((n) => ({
          date: n.date,
          status: n.status,
          bookingId: n.bookingId,
          bookingCode: n.bookingCode,
          note: n.note,
        })),
    };
  },

  async blockNights(productId: string, input: BlockNightsInput) {
    assertRange(input.from, input.to);
    await getLodgingProduct(productId);
    await lodgingRepository.blockNights(productId, daysInclusive(input.from, input.to), input.note ?? null);
  },

  async unblockNights(productId: string, input: UnblockNightsInput) {
    assertRange(input.from, input.to);
    await getLodgingProduct(productId);
    const released = await lodgingRepository.unblockNights(productId, daysInclusive(input.from, input.to));
    return { released };
  },

  async listBookings(query: BookingQuery) {
    const result = await lodgingRepository.list(query);
    return { ...result, items: await Promise.all(result.items.map(withEffectiveStatus)) };
  },

  async getBooking(id: string) {
    const booking = await lodgingRepository.findById(id);
    if (!booking) throw new NotFoundError('Reserva');
    return withEffectiveStatus(booking);
  },

  /** Reserva cargada a mano (WhatsApp, en persona): ocupa las noches directo. */
  async createManualBooking(input: CreateManualBookingInput) {
    const product = await getLodgingProduct(input.productId);
    const cfg = configOf(product);
    const dates = nightsBetween(input.checkIn, input.checkOut);
    if (dates.length > MAX_ADMIN_RANGE_DAYS) {
      throw new ValidationError([{ path: 'checkOut', message: `Máximo ${MAX_ADMIN_RANGE_DAYS} noches` }]);
    }

    let nightly: BookingNight[];
    let total: number;
    if (input.total !== undefined && input.total !== null) {
      // Monto pactado con el cliente: se reparte en partes iguales por noche.
      total = round2(input.total);
      const each = round2(total / dates.length);
      nightly = dates.map((date) => ({ date, price: each }));
    } else {
      nightly = priceNights(cfg, dates);
      total = round2(nightly.reduce((sum, n) => sum + n.price, 0));
    }

    const code = await generateBookingCode();
    const id = await lodgingRepository.createWithNights(
      {
        code,
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights: dates.length,
        guests: input.guests,
        nightly,
        total,
        currency: 'PEN',
        customer: {
          name: input.customer.name,
          email: input.customer.email || null,
          phone: input.customer.phone,
          documentType: input.customer.documentType ?? null,
          documentNumber: input.customer.documentNumber ?? null,
        },
        notes: input.notes ?? null,
        status: 'CONFIRMADA',
        source: 'ADMIN',
        paymentMethod: 'MANUAL',
        paymentStatus: input.paid ? 'PAID' : 'PENDING',
        holdExpiresAt: null,
        transactionId: null,
        rawPayload: null,
        paidAt: input.paid ? Timestamp.now() : null,
        cancelReason: null,
        cancelledAt: null,
        internalNotes: null,
      },
      'BOOKED',
    );
    return lodgingService.getBooking(id);
  },

  async cancelBooking(id: string, reason: string | null) {
    const booking = await lodgingRepository.findById(id);
    if (!booking) throw new NotFoundError('Reserva');
    await lodgingRepository.cancel(id, reason);
    return lodgingService.getBooking(id);
  },

  /** Marcar pago manual como cobrado, registrar devolución o notas. */
  async updateBooking(id: string, input: UpdateBookingInput) {
    const booking = await lodgingRepository.findById(id);
    if (!booking) throw new NotFoundError('Reserva');

    const data: Partial<BookingDoc> = {};
    if (input.internalNotes !== undefined) data.internalNotes = input.internalNotes;
    if (input.paymentStatus !== undefined && input.paymentStatus !== booking.paymentStatus) {
      // Una reserva web se confirma solo con la pasarela (así también ocupa sus
      // noches); a mano solo se puede registrar la devolución.
      if (booking.paymentMethod !== 'MANUAL' && input.paymentStatus !== 'REFUNDED') {
        throw new ConflictError('En reservas web solo se puede registrar la devolución del pago');
      }
      data.paymentStatus = input.paymentStatus;
      if (input.paymentStatus === 'PAID' && !booking.paidAt) data.paidAt = Timestamp.now();
    }
    if (Object.keys(data).length) await lodgingRepository.update(id, data);
    return lodgingService.getBooking(id);
  },
};
