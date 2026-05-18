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

export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  SETTINGS: 'settings',
} as const;

export const STORAGE_PATHS = {
  PRODUCT_IMAGES: 'products',
} as const;

export const IMAGE_CONFIG = {
  MAX_WIDTH: 1600,
  WEBP_QUALITY: 82,
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;
