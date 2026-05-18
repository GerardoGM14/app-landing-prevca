/**
 * Cliente mínimo para la API pública de Grupo Prevca.
 *
 * En desarrollo apunta al emulador local de Firebase Functions.
 * En producción usa la Cloud Function desplegada (o un dominio personalizado).
 *
 * Para sobrescribir, define PUBLIC_API_BASE_URL en .env (Astro respeta PUBLIC_ prefix).
 */

const DEFAULT_DEV_URL = 'http://localhost:5001/app-prevca/us-central1/api';
const DEFAULT_PROD_URL = 'https://us-central1-app-prevca.cloudfunctions.net/api';

export const API_BASE =
  import.meta.env.PUBLIC_API_BASE_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);

/**
 * @typedef {Object} ProductImage
 * @property {string} url
 * @property {string|null} alt
 * @property {boolean} isPrimary
 *
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} slug
 * @property {string} ref
 * @property {string} title
 * @property {string} division
 * @property {string} shortDesc
 * @property {string} description
 * @property {string|null} specs
 * @property {string[]} features
 * @property {number|null} price
 * @property {boolean} showPrice
 * @property {number|null} stock
 * @property {boolean} showStock
 * @property {ProductImage[]} images
 */

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Error ${res.status} al consultar la API`);
  }
  return data;
}

/**
 * Obtiene productos activos.
 * @param {{ division?: string, search?: string, pageSize?: number }} [params]
 */
export async function fetchProducts(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && v !== '' && search.set(k, String(v)));
  const qs = search.toString();
  const path = `/public/products${qs ? `?${qs}` : ''}`;
  const data = await request(path);
  return data.items ?? [];
}

/**
 * Obtiene un producto por su slug.
 */
export async function fetchProductBySlug(slug) {
  return request(`/public/products/by-slug/${encodeURIComponent(slug)}`);
}

/**
 * Envía una cotización al backend.
 * @param {{
 *   customer: { name: string, email: string, phone?: string, company?: string },
 *   message?: string,
 *   items: Array<{ productId: string, quantity: number }>
 * }} payload
 */
export async function submitOrder(payload) {
  return request('/public/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
