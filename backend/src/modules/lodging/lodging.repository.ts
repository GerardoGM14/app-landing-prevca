import { FieldValue, Query, Timestamp, Transaction } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import {
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingStatus,
  COLLECTIONS,
  DocumentType,
  NightStatus,
  SETTINGS_DOCS,
} from '../../config/constants';
import { ConflictError } from '../../shared/errors/app-error';

/**
 * Disponibilidad "tipo butacas de cine": cada noche ocupada de un departamento
 * es un documento con ID fijo `${productId}_${fecha}` en `lodgingNights`. Sin
 * documento la noche está libre. Como el ID es determinístico, dos clientes que
 * intentan la misma noche chocan sobre el MISMO documento dentro de una
 * transacción de Firestore, y solo uno puede ganarla.
 */

const nightsCol = () => db.collection(COLLECTIONS.LODGING_NIGHTS);
const bookingsCol = () => db.collection(COLLECTIONS.BOOKINGS);

export const nightId = (productId: string, date: string): string => `${productId}_${date}`;

export interface NightDoc {
  productId: string;
  date: string;
  status: NightStatus;
  bookingId: string | null;
  bookingCode: string | null;
  /** Solo para HOLD: cuándo se libera si no llega el pago */
  holdExpiresAt: Timestamp | null;
  note: string | null;
  updatedAt: Timestamp;
}

export interface BookingCustomer {
  name: string;
  email: string | null;
  phone: string;
  documentType: DocumentType | null;
  documentNumber: string | null;
}

export interface BookingNight {
  date: string;
  price: number;
}

export interface BookingDoc {
  code: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  /** Precio de cada noche al momento de reservar */
  nightly: BookingNight[];
  total: number;
  currency: 'PEN';
  customer: BookingCustomer;
  notes: string | null;
  status: BookingStatus;
  source: 'WEB' | 'ADMIN';
  paymentMethod: BookingPaymentMethod;
  paymentStatus: BookingPaymentStatus;
  holdExpiresAt: Timestamp | null;
  transactionId: string | null;
  rawPayload: Record<string, unknown> | null;
  paidAt: Timestamp | null;
  cancelReason: string | null;
  cancelledAt: Timestamp | null;
  internalNotes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Booking = BookingDoc & { id: string };

/** Una noche está tomada si está reservada, bloqueada o apartada por OTRA reserva vigente. */
export const isNightTaken = (
  night: NightDoc | undefined,
  now: Timestamp,
  ownBookingId?: string,
): boolean => {
  if (!night) return false;
  if (night.status === 'BOOKED' || night.status === 'BLOCKED') {
    return night.bookingId === null || night.bookingId !== ownBookingId;
  }
  // HOLD
  if (ownBookingId && night.bookingId === ownBookingId) return false;
  return night.holdExpiresAt !== null && night.holdExpiresAt.toMillis() > now.toMillis();
};

const mapBooking = (doc: FirebaseFirestore.DocumentSnapshot): Booking | null =>
  doc.exists ? { id: doc.id, ...(doc.data() as BookingDoc) } : null;

const readNights = async (tx: Transaction, productId: string, dates: string[]) => {
  const refs = dates.map((d) => nightsCol().doc(nightId(productId, d)));
  const snaps = refs.length ? await tx.getAll(...refs) : [];
  return snaps.map((s, i) => ({
    ref: refs[i],
    date: dates[i],
    data: s.exists ? (s.data() as NightDoc) : undefined,
  }));
};

const conflictMessage = (dates: string[]) =>
  dates.length === 1
    ? `La noche del ${dates[0]} ya no está disponible`
    : `Estas noches ya no están disponibles: ${dates.join(', ')}`;

export const lodgingRepository = {
  /* ---------------------------- Calendario ---------------------------- */

  /** Noches con documento (ocupadas, apartadas o bloqueadas) en un rango [from, to]. */
  async listNights(productId: string, from: string, to: string): Promise<NightDoc[]> {
    const snap = await nightsCol()
      .where('productId', '==', productId)
      .where('date', '>=', from)
      .where('date', '<=', to)
      .orderBy('date')
      .get();
    return snap.docs.map((d) => d.data() as NightDoc);
  },

  /**
   * Bloquea noches (mantenimiento, uso propio). Falla si alguna está reservada
   * o apartada por un cliente; las ya bloqueadas solo actualizan la nota.
   */
  async blockNights(productId: string, dates: string[], note: string | null): Promise<void> {
    await db.runTransaction(async (tx) => {
      const now = Timestamp.now();
      const nights = await readNights(tx, productId, dates);
      const taken = nights
        .filter((n) => n.data && n.data.status !== 'BLOCKED' && isNightTaken(n.data, now))
        .map((n) => n.date);
      if (taken.length) throw new ConflictError(`${conflictMessage(taken)} (tienen una reserva)`);
      for (const n of nights) {
        tx.set(n.ref, {
          productId,
          date: n.date,
          status: 'BLOCKED',
          bookingId: null,
          bookingCode: null,
          holdExpiresAt: null,
          note,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
  },

  /** Desbloquea noches. Solo borra las BLOQUEADAS; las reservas no se tocan. */
  async unblockNights(productId: string, dates: string[]): Promise<number> {
    return db.runTransaction(async (tx) => {
      const nights = await readNights(tx, productId, dates);
      const blocked = nights.filter((n) => n.data?.status === 'BLOCKED');
      blocked.forEach((n) => tx.delete(n.ref));
      return blocked.length;
    });
  },

  /* ----------------------------- Reservas ----------------------------- */

  async findById(id: string): Promise<Booking | null> {
    return mapBooking(await bookingsCol().doc(id).get());
  },

  async findByCode(code: string): Promise<Booking | null> {
    const snap = await bookingsCol().where('code', '==', code).limit(1).get();
    return snap.empty ? null : mapBooking(snap.docs[0]);
  },

  async list(filters: {
    status?: BookingStatus;
    productId?: string;
    pageSize: number;
    cursor?: string;
  }): Promise<{ items: Booking[]; nextCursor: string | null }> {
    let query: Query = bookingsCol();
    if (filters.status) query = query.where('status', '==', filters.status);
    if (filters.productId) query = query.where('productId', '==', filters.productId);
    query = query.orderBy('createdAt', 'desc');

    if (filters.cursor) {
      const cursorDoc = await bookingsCol().doc(filters.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.limit(filters.pageSize + 1).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as BookingDoc) }));
    const hasMore = docs.length > filters.pageSize;
    const items = hasMore ? docs.slice(0, filters.pageSize) : docs;
    return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
  },

  async update(id: string, data: Partial<BookingDoc>): Promise<void> {
    await bookingsCol()
      .doc(id)
      .update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  },

  /**
   * Crea la reserva y ocupa sus noches en UNA transacción: o se reservan todas
   * las noches o ninguna. Con `nightStatus: 'HOLD'` las aparta hasta
   * `holdExpiresAt` (pago web); con 'BOOKED' las reserva directo (admin).
   */
  async createWithNights(
    data: Omit<BookingDoc, 'createdAt' | 'updatedAt'>,
    nightStatus: 'HOLD' | 'BOOKED',
  ): Promise<string> {
    const ref = bookingsCol().doc();
    await db.runTransaction(async (tx) => {
      const now = Timestamp.now();
      const dates = data.nightly.map((n) => n.date);
      const nights = await readNights(tx, data.productId, dates);
      const taken = nights.filter((n) => isNightTaken(n.data, now)).map((n) => n.date);
      if (taken.length) throw new ConflictError(conflictMessage(taken));

      for (const n of nights) {
        tx.set(n.ref, {
          productId: data.productId,
          date: n.date,
          status: nightStatus,
          bookingId: ref.id,
          bookingCode: data.code,
          holdExpiresAt: nightStatus === 'HOLD' ? data.holdExpiresAt : null,
          note: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      const ts = FieldValue.serverTimestamp();
      tx.set(ref, { ...data, createdAt: ts, updatedAt: ts });
    });
    return ref.id;
  },

  /**
   * Pago aprobado: convierte las noches en reservadas. Si mientras tanto el
   * apartado venció y otro cliente tomó alguna noche, la reserva queda en
   * REVISAR (el cliente pagó y hay que devolverle o reubicarlo).
   * Idempotente: si ya estaba pagada no hace nada.
   */
  async confirmPayment(
    bookingId: string,
    payment: { transactionId: string | null; rawPayload: Record<string, unknown> | null },
  ): Promise<BookingStatus> {
    return db.runTransaction(async (tx) => {
      const bookingRef = bookingsCol().doc(bookingId);
      const snap = await tx.get(bookingRef);
      if (!snap.exists) throw new ConflictError('Reserva no encontrada');
      const booking = snap.data() as BookingDoc;
      if (booking.paymentStatus === 'PAID') return booking.status;

      const now = Timestamp.now();
      const nights = await readNights(tx, booking.productId, booking.nightly.map((n) => n.date));
      const taken = nights.filter((n) => isNightTaken(n.data, now, bookingId)).map((n) => n.date);
      const status: BookingStatus = taken.length ? 'REVISAR' : 'CONFIRMADA';

      if (!taken.length) {
        for (const n of nights) {
          tx.set(n.ref, {
            productId: booking.productId,
            date: n.date,
            status: 'BOOKED',
            bookingId,
            bookingCode: booking.code,
            holdExpiresAt: null,
            note: null,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      tx.update(bookingRef, {
        status,
        paymentStatus: 'PAID',
        transactionId: payment.transactionId,
        rawPayload: payment.rawPayload,
        paidAt: now,
        holdExpiresAt: null,
        ...(taken.length
          ? {
              internalNotes: `Pago recibido pero estas noches ya estaban ocupadas: ${taken.join(', ')}. Devolver el dinero o reubicar al huésped.`,
            }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return status;
    });
  },

  /** Cancela la reserva y libera SOLO las noches que le pertenecen. */
  async cancel(bookingId: string, reason: string | null): Promise<void> {
    await db.runTransaction(async (tx) => {
      const bookingRef = bookingsCol().doc(bookingId);
      const snap = await tx.get(bookingRef);
      if (!snap.exists) throw new ConflictError('Reserva no encontrada');
      const booking = snap.data() as BookingDoc;
      if (booking.status === 'CANCELADA') return;

      const nights = await readNights(tx, booking.productId, booking.nightly.map((n) => n.date));
      nights.filter((n) => n.data?.bookingId === bookingId).forEach((n) => tx.delete(n.ref));

      tx.update(bookingRef, {
        status: 'CANCELADA',
        holdExpiresAt: null,
        cancelReason: reason,
        cancelledAt: Timestamp.now(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  },
};

/** Código correlativo RES-2026-00001 con contador atómico, igual que pedidos y reclamos. */
export const generateBookingCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const counterRef = db.collection(COLLECTIONS.SETTINGS).doc(SETTINGS_DOCS.BOOKING_COUNTER);
  const field = `RES_${year}`;

  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = (snap.data()?.[field] as number | undefined) ?? 0;
    tx.set(counterRef, { [field]: current + 1 }, { merge: true });
    return current + 1;
  });

  return `RES-${year}-${String(next).padStart(5, '0')}`;
};
