export type Division = 'MADERA' | 'HOSPITALIDAD' | 'CAFE' | 'TRANSPORTE';

export type OrderStatus = 'PENDIENTE' | 'CONTACTADO' | 'COTIZADO' | 'CERRADO' | 'RECHAZADO';

export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface ProductImage {
  storagePath: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  order: number;
}

export interface Product {
  id: string;
  slug: string;
  ref: string;
  title: string;
  division: Division;
  categoryId: string | null;
  shortDesc: string;
  description: string;
  specs: string | null;
  features: string[];
  price: number | null;
  showPrice: boolean;
  stock: number;
  showStock: boolean;
  trackStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  images: ProductImage[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  division: Division;
  order: number;
  isActive: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface OrderItem {
  productId: string;
  titleSnapshot: string;
  priceSnapshot: number | null;
  quantity: number;
}

export interface Order {
  id: string;
  code: string;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
  };
  message: string | null;
  status: OrderStatus;
  internalNotes: string | null;
  items: OrderItem[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export const DIVISION_LABELS: Record<Division, string> = {
  MADERA: 'Madera',
  HOSPITALIDAD: 'Alojamiento',
  CAFE: 'Café',
  TRANSPORTE: 'Transporte',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  CONTACTADO: 'Contactado',
  COTIZADO: 'Cotizado',
  CERRADO: 'Cerrado',
  RECHAZADO: 'Rechazado',
};
