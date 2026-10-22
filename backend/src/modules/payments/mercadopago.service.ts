import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { ConflictError } from '../../shared/errors/app-error';
import { Order } from '../orders/orders.repository';
import type { Booking } from '../lodging/lodging.repository';

/**
 * Integración con MercadoPago (Checkout Pro).
 *
 * El Access Token (secreto) NUNCA se guarda en Firestore: se inyecta como
 * variable de entorno del backend. Use el token de PRUEBA en el emulador y el
 * de PRODUCCIÓN en el deploy real.
 *
 *   MERCADOPAGO_ACCESS_TOKEN   → APP_USR-... (prod) o TEST-... (sandbox)
 *   PUBLIC_LANDING_URL         → https://tu-landing.web.app (para back_urls)
 *   PUBLIC_API_URL             → https://.../api (base pública para el webhook)
 *
 * En Firebase Functions v2 se declaran como secret/env en el deploy:
 *   firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN
 */

const getAccessToken = (): string => {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new ConflictError(
      'MercadoPago no está configurado en el servidor (falta MERCADOPAGO_ACCESS_TOKEN)',
    );
  }
  return token;
};

const getClient = (): MercadoPagoConfig =>
  new MercadoPagoConfig({ accessToken: getAccessToken() });

const trimSlash = (url: string): string => url.replace(/\/$/, '');

const landingUrl = (): string =>
  trimSlash(process.env.PUBLIC_LANDING_URL ?? 'http://localhost:4321');

/** MercadoPago no acepta localhost/IPs privadas en back_urls con auto_return. */
const isPublicUrl = (url: string): boolean =>
  !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i.test(url);

/** Base pública del API (para que MP nos notifique el webhook). */
const apiUrl = (): string | undefined => {
  const url = process.env.PUBLIC_API_URL;
  return url ? trimSlash(url) : undefined;
};

/** Fecha en formato ISO con zona de Perú (UTC-5, sin horario de verano), como pide MercadoPago. */
const toLimaIso = (date: Date): string =>
  new Date(date.getTime() - 5 * 3_600_000).toISOString().replace('Z', '-05:00');

export interface PreferenceResult {
  /** ID de la preference en MercadoPago */
  preferenceId: string;
  /** URL de Checkout Pro a la que redirigir al cliente (prod) */
  initPoint: string;
  /** URL de sandbox (solo con credenciales de prueba) */
  sandboxInitPoint: string;
}

export const mercadopagoService = {
  /**
   * Crea una preference de Checkout Pro para una orden ya persistida.
   * `external_reference` = code de la orden, así el webhook sabe a quién confirmar.
   */
  async createPreference(order: Order): Promise<PreferenceResult> {
    if (order.total === null || order.total <= 0) {
      throw new ConflictError('La orden no tiene un total válido para cobrar');
    }

    const preference = new Preference(getClient());
    const notificationUrl = apiUrl() ? `${apiUrl()}/public/webhooks/mercadopago` : undefined;

    const body = await preference.create({
      body: {
        external_reference: order.code,
        items: order.items.map((item) => ({
          id: item.productId,
          title: item.titleSnapshot,
          quantity: item.quantity,
          unit_price: item.priceSnapshot ?? 0,
          currency_id: 'PEN',
        })),
        // El envío va como un ítem aparte para que el total case con la orden.
        ...(order.shippingCost && order.shippingCost > 0
          ? {
              shipments: {
                cost: order.shippingCost,
                mode: 'not_specified' as const,
              },
            }
          : {}),
        // NO forzamos payer.email en Checkout Pro: MercadoPago toma los datos
        // de la cuenta con la que el comprador inicia sesión. Enviar un email
        // que coincida con el comprador (o con el vendedor) deja el botón
        // "Pagar" deshabilitado en sandbox. Solo pasamos el nombre.
        payer: {
          name: order.customer.name,
        },
        back_urls: {
          success: `${landingUrl()}/pago-exitoso?code=${order.code}`,
          pending: `${landingUrl()}/pago-pendiente?code=${order.code}`,
          failure: `${landingUrl()}/pago-fallido?code=${order.code}`,
        },
        // MercadoPago rechaza auto_return con back_urls en localhost
        // (invalid_auto_return). Solo lo activamos con una URL pública real.
        ...(isPublicUrl(landingUrl()) ? { auto_return: 'approved' as const } : {}),
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
        statement_descriptor: 'GRUPO PREVCA',
      },
    });

    if (!body.id || !body.init_point) {
      throw new ConflictError('MercadoPago no devolvió un link de pago válido');
    }

    return {
      preferenceId: body.id,
      initPoint: body.init_point,
      sandboxInitPoint: body.sandbox_init_point ?? body.init_point,
    };
  },

  /**
   * Preference para una reserva de alojamiento. A diferencia de un pedido:
   *  - el link vence junto con el apartado de las noches (no se puede pagar
   *    después de que se liberaron),
   *  - `binary_mode`: el pago queda aprobado o rechazado al momento, nunca
   *    "pendiente",
   *  - se excluyen los pagos en efectivo (agentes, bancos), que tardan días.
   */
  async createBookingPreference(booking: Booking): Promise<PreferenceResult> {
    if (!(booking.total > 0)) {
      throw new ConflictError('La reserva no tiene un total válido para cobrar');
    }

    const preference = new Preference(getClient());
    const notificationUrl = apiUrl() ? `${apiUrl()}/public/webhooks/mercadopago` : undefined;
    const nightsLabel = booking.nights === 1 ? '1 noche' : `${booking.nights} noches`;

    const body = await preference.create({
      body: {
        external_reference: booking.code,
        items: [
          {
            id: booking.productId,
            title: `${booking.productTitle} · ${nightsLabel} (${booking.checkIn} al ${booking.checkOut})`,
            quantity: 1,
            unit_price: booking.total,
            currency_id: 'PEN',
          },
        ],
        payer: { name: booking.customer.name },
        back_urls: {
          success: `${landingUrl()}/reserva-exitosa?code=${booking.code}`,
          pending: `${landingUrl()}/reserva-pendiente?code=${booking.code}`,
          failure: `${landingUrl()}/reserva-fallida?code=${booking.code}`,
        },
        ...(isPublicUrl(landingUrl()) ? { auto_return: 'approved' as const } : {}),
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
        binary_mode: true,
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
        },
        ...(booking.holdExpiresAt
          ? {
              expires: true,
              expiration_date_from: toLimaIso(new Date()),
              expiration_date_to: toLimaIso(booking.holdExpiresAt.toDate()),
            }
          : {}),
        statement_descriptor: 'GRUPO PREVCA',
      },
    });

    if (!body.id || !body.init_point) {
      throw new ConflictError('MercadoPago no devolvió un link de pago válido');
    }

    return {
      preferenceId: body.id,
      initPoint: body.init_point,
      sandboxInitPoint: body.sandbox_init_point ?? body.init_point,
    };
  },

  /**
   * Consulta un pago por su ID (recibido en el webhook) y lo normaliza a
   * { approved, transactionId, rawPayload } + el code de la orden.
   */
  async fetchPaymentResult(paymentId: string): Promise<{
    orderCode: string | null;
    approved: boolean;
    transactionId: string;
    rawPayload: Record<string, unknown>;
  }> {
    const payment = new Payment(getClient());
    const data = await payment.get({ id: paymentId });

    return {
      orderCode: data.external_reference ?? null,
      approved: data.status === 'approved',
      transactionId: String(data.id ?? paymentId),
      rawPayload: data as unknown as Record<string, unknown>,
    };
  },
};
