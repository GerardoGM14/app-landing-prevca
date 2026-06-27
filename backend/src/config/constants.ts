export const DIVISIONS = ['MADERA', 'HOSPITALIDAD', 'CAFE', 'TRANSPORTE'] as const;
export type Division = (typeof DIVISIONS)[number];

export const ORDER_STATUS = [
  'PENDIENTE',
  'CONTACTADO',
  'COTIZADO',
  'CERRADO',
  'RECHAZADO',
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

/**
 * Métodos de pago soportados en checkout.
 * QUOTE = cotización tradicional (sin pago, asesor contacta).
 */
export const PAYMENT_METHODS = [
  'QUOTE',
  'YAPE',
  'TRANSFERENCIA',
  'PAYPAL',
  'CULQI',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Estados del pago:
 *   NONE: no aplica (orden tipo cotización pura)
 *   PENDING_PROOF: esperando que cliente suba captura (Yape/Transferencia)
 *   PENDING_VERIFICATION: captura subida o callback recibido, esperando que admin valide
 *   PAID: pago confirmado y aprobado
 *   REJECTED: pago rechazado por admin (captura inválida) o por pasarela
 *   REFUNDED: pago revertido al cliente
 */
export const PAYMENT_STATUS = [
  'NONE',
  'PENDING_PROOF',
  'PENDING_VERIFICATION',
  'PAID',
  'REJECTED',
  'REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const RECEIPT_TYPES = ['BOLETA', 'FACTURA'] as const;
export type ReceiptType = (typeof RECEIPT_TYPES)[number];

export const DOCUMENT_TYPES = ['DNI', 'RUC', 'CE', 'PASAPORTE'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * 24 departamentos del Perú + Callao (provincia constitucional, tratada como dpto).
 */
export const PERU_DEPARTMENTS = [
  'AMAZONAS',
  'ANCASH',
  'APURIMAC',
  'AREQUIPA',
  'AYACUCHO',
  'CAJAMARCA',
  'CALLAO',
  'CUSCO',
  'HUANCAVELICA',
  'HUANUCO',
  'ICA',
  'JUNIN',
  'LA_LIBERTAD',
  'LAMBAYEQUE',
  'LIMA',
  'LORETO',
  'MADRE_DE_DIOS',
  'MOQUEGUA',
  'PASCO',
  'PIURA',
  'PUNO',
  'SAN_MARTIN',
  'TACNA',
  'TUMBES',
  'UCAYALI',
] as const;
export type PeruDepartment = (typeof PERU_DEPARTMENTS)[number];

/**
 * Tarifas de envío por defecto (en soles, IGV incluido).
 * El admin puede sobreescribirlas desde /settings/shipping-rates en Firestore.
 */
export const DEFAULT_SHIPPING_RATES: Record<PeruDepartment, number> = {
  AMAZONAS: 45,
  ANCASH: 30,
  APURIMAC: 40,
  AREQUIPA: 25,
  AYACUCHO: 40,
  CAJAMARCA: 35,
  CALLAO: 15,
  CUSCO: 35,
  HUANCAVELICA: 45,
  HUANUCO: 40,
  ICA: 25,
  JUNIN: 30,
  LA_LIBERTAD: 25,
  LAMBAYEQUE: 25,
  LIMA: 15,
  LORETO: 60,
  MADRE_DE_DIOS: 60,
  MOQUEGUA: 35,
  PASCO: 40,
  PIURA: 25,
  PUNO: 40,
  SAN_MARTIN: 50,
  TACNA: 35,
  TUMBES: 35,
  UCAYALI: 55,
};

export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  SETTINGS: 'settings',
} as const;

export const SETTINGS_DOCS = {
  SHIPPING_RATES: 'shipping-rates',
  PAYMENT_CONFIG: 'payment-config',
  ORDER_COUNTER: 'order-counter',
} as const;

export const STORAGE_PATHS = {
  PRODUCT_IMAGES: 'products',
  PAYMENT_PROOFS: 'payment-proofs',
} as const;

export const IMAGE_CONFIG = {
  MAX_WIDTH: 1600,
  WEBP_QUALITY: 82,
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

export const PROOF_CONFIG = {
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const,
} as const;

/**
 * IGV peruano (18%). Los precios en BD están con IGV incluido;
 * esta constante se usa para desglosar en boleta/factura.
 */
export const IGV_RATE = 0.18;
