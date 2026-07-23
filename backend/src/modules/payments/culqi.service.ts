import { ConflictError, ValidationError } from '../../shared/errors/app-error';
import { Order } from '../orders/orders.repository';

/**
 * Integración con Culqi (Culqi Checkout / popup).
 *
 * Flujo: el cliente ingresa la tarjeta en el popup de Culqi.js (en la landing),
 * Culqi devuelve un TOKEN, y este servicio crea el CARGO llamando a la API REST
 * de Culqi con la Secret Key. El cargo es SÍNCRONO: Culqi responde aprobado o
 * rechazado en el momento, no hay webhook de espera.
 *
 * La Secret Key (secreta) NUNCA se guarda en Firestore: se inyecta como
 * variable de entorno del backend.
 *   CULQI_SECRET_KEY → sk_live_... (prod) o sk_test_... (pruebas)
 *
 * En Firebase Functions v2 se declara como secret en el deploy:
 *   firebase functions:secrets:set CULQI_SECRET_KEY
 *
 * La Public Key (pk_...) sí vive en Firestore (settings) porque va al navegador.
 */

const CULQI_CHARGES_URL = 'https://api.culqi.com/v2/charges';

const getSecretKey = (): string => {
  const key = process.env.CULQI_SECRET_KEY;
  if (!key) {
    throw new ConflictError(
      'Culqi no está configurado en el servidor (falta CULQI_SECRET_KEY)',
    );
  }
  return key;
};

export interface CulqiChargeResult {
  approved: boolean;
  chargeId: string;
  /** Respuesta cruda de Culqi, se guarda en la orden para auditoría */
  raw: Record<string, unknown>;
  /** Mensaje amigable si el pago fue rechazado */
  declineMessage: string | null;
}

export const culqiService = {
  /**
   * Crea un cargo en Culqi a partir del token que generó el popup.
   * El monto se toma de la ORDEN (server-side), nunca del cliente.
   * Culqi trabaja en céntimos: S/ 10.50 → 1050.
   */
  async createCharge(order: Order, token: string, email: string): Promise<CulqiChargeResult> {
    if (order.total === null || order.total <= 0) {
      throw new ConflictError('La orden no tiene un total válido para cobrar');
    }
    if (!token) {
      throw new ValidationError([{ path: 'token', message: 'Falta el token de Culqi' }]);
    }

    const amountInCents = Math.round(order.total * 100);

    const body = {
      amount: amountInCents,
      currency_code: 'PEN',
      email,
      source_id: token,
      description: `Pedido ${order.code} - Grupo Prevca`.slice(0, 80),
      metadata: {
        orderCode: order.code,
        customer: order.customer.name,
      },
      antifraud_details: {
        first_name: order.customer.name.split(' ')[0] ?? order.customer.name,
        last_name: order.customer.name.split(' ').slice(1).join(' ') || order.customer.name,
      },
    };

    let response: Response;
    try {
      response = await fetch(CULQI_CHARGES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getSecretKey()}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ConflictError('No se pudo conectar con Culqi. Intente nuevamente.');
    }

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    // Culqi devuelve 2xx con `outcome.type === 'venta_exitosa'` si aprobó.
    if (response.ok) {
      const outcome = (data.outcome ?? {}) as Record<string, unknown>;
      const approved = outcome.type === 'venta_exitosa';
      return {
        approved,
        chargeId: String(data.id ?? ''),
        raw: data,
        declineMessage: approved ? null : String(outcome.user_message ?? 'Pago no aprobado'),
      };
    }

    // 4xx: tarjeta rechazada, fondos insuficientes, token inválido, etc.
    const merchantMessage = String(
      data.user_message ?? data.merchant_message ?? 'La tarjeta fue rechazada',
    );
    return {
      approved: false,
      chargeId: String(data.charge_id ?? ''),
      raw: data,
      declineMessage: merchantMessage,
    };
  },
};
