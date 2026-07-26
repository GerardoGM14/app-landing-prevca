/**
 * Cliente para la API pública de Grupo Prevca.
 *
 * En desarrollo apunta al emulador local de Firebase Functions.
 * En producción usa la Cloud Function desplegada.
 *
 * Para sobrescribir, define PUBLIC_API_BASE_URL en .env (Astro respeta PUBLIC_ prefix).
 */

const DEFAULT_DEV_URL = 'http://localhost:5001/app-prevca/us-central1/api';
const DEFAULT_PROD_URL = 'https://us-central1-app-prevca.cloudfunctions.net/api';

export const API_BASE =
  import.meta.env.PUBLIC_API_BASE_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...(options.headers ?? {}) }
    : { 'Content-Type': 'application/json', ...(options.headers ?? {}) };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Error ${res.status} al consultar la API`);
  }
  return data;
}

/* ------------------------------------------------------------------ *
 * Productos / categorías
 * ------------------------------------------------------------------ */

export async function fetchProducts(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && v !== '' && search.set(k, String(v)));
  const qs = search.toString();
  const path = `/public/products${qs ? `?${qs}` : ''}`;
  const data = await request(path);
  return data.items ?? [];
}

export async function fetchProductBySlug(slug) {
  return request(`/public/products/by-slug/${encodeURIComponent(slug)}`);
}

/* ------------------------------------------------------------------ *
 * Cotización y checkout
 * ------------------------------------------------------------------ */

/**
 * Cotización tradicional (sin pago). El asesor contacta al cliente.
 */
export async function submitOrder(payload) {
  return request('/public/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Checkout con pago real. Backend recalcula totales y crea la orden.
 * @param {{
 *   customer: { name, email, phone?, company? },
 *   shipping: { department, province, district, address, reference? },
 *   billing: { receiptType, documentType, documentNumber, businessName? },
 *   message?: string,
 *   items: Array<{ productId, quantity, woodType? }>,
 *   paymentMethod: 'YAPE'|'TRANSFERENCIA'|'PAYPAL'|'CULQI'|'MERCADOPAGO'
 * }} payload
 */
export async function submitCheckout(payload) {
  return request('/public/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Sube la captura de pago (Yape/Transferencia) en multipart.
 * @param {string} code - código de la orden (ORD-2026-NNNNN)
 * @param {File} file - archivo de imagen o PDF
 */
export async function uploadPaymentProof(code, file) {
  const form = new FormData();
  form.append('proof', file);
  return request(`/public/orders/${encodeURIComponent(code)}/proof`, {
    method: 'POST',
    body: form,
  });
}

/**
 * Crea el cargo de Culqi con el token del popup. El backend cobra y responde
 * de inmediato si el pago fue aprobado o rechazado (síncrono).
 * @param {string} code - código de la orden
 * @param {string} token - token generado por Culqi.js (tkn_...)
 * @returns {Promise<{ code, approved, paymentStatus, message }>}
 */
export async function chargeCulqi(code, token) {
  // No usamos request() porque un pago rechazado responde 402 (no-ok) pero
  // trae un cuerpo válido con approved:false que sí queremos leer.
  const res = await fetch(`${API_BASE}/public/orders/${encodeURIComponent(code)}/culqi-charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json().catch(() => ({}));
  // 200 = aprobado, 402 = rechazado (ambos con {approved, message}).
  if (res.status === 200 || res.status === 402) {
    return data;
  }
  throw new Error(data?.error?.message ?? `Error ${res.status} al procesar el pago`);
}

/* ------------------------------------------------------------------ *
 * Configuración pública (envío y métodos de pago habilitados)
 * ------------------------------------------------------------------ */

/**
 * Devuelve `{ rates: { LIMA: 15, AREQUIPA: 25, ... } }`
 */
export async function fetchShippingRates() {
  return request('/public/shipping-rates');
}

/**
 * Devuelve `{ yape, transfer, paypal, culqi, mercadopago }`. Cada uno es null si
 * está deshabilitado o un objeto con sus datos públicos (QR, número, publicKey, etc.)
 */
export async function fetchPaymentMethods() {
  return request('/public/payment-methods');
}
