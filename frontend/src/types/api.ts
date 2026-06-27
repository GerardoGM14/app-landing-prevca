export type Division = 'MADERA' | 'HOSPITALIDAD' | 'CAFE' | 'TRANSPORTE';

export type OrderStatus = 'PENDIENTE' | 'CONTACTADO' | 'COTIZADO' | 'CERRADO' | 'RECHAZADO';

export type PaymentMethod = 'QUOTE' | 'YAPE' | 'TRANSFERENCIA' | 'PAYPAL' | 'CULQI';

export type PaymentStatus =
  | 'NONE'
  | 'PENDING_PROOF'
  | 'PENDING_VERIFICATION'
  | 'PAID'
  | 'REJECTED'
  | 'REFUNDED';

export type ReceiptType = 'BOLETA' | 'FACTURA';
export type DocumentType = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';

export type PeruDepartment =
  | 'AMAZONAS'
  | 'ANCASH'
  | 'APURIMAC'
  | 'AREQUIPA'
  | 'AYACUCHO'
  | 'CAJAMARCA'
  | 'CALLAO'
  | 'CUSCO'
  | 'HUANCAVELICA'
  | 'HUANUCO'
  | 'ICA'
  | 'JUNIN'
  | 'LA_LIBERTAD'
  | 'LAMBAYEQUE'
  | 'LIMA'
  | 'LORETO'
  | 'MADRE_DE_DIOS'
  | 'MOQUEGUA'
  | 'PASCO'
  | 'PIURA'
  | 'PUNO'
  | 'SAN_MARTIN'
  | 'TACNA'
  | 'TUMBES'
  | 'UCAYALI';

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
  scientificName: string | null;
  origin: string | null;
  applications: string | null;
  datasheetUrl: string | null;
  price: number | null;
  showPrice: boolean;
  allowsDirectPurchase: boolean;
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
  lineTotal: number | null;
}

export interface OrderShipping {
  department: PeruDepartment;
  province: string;
  district: string;
  address: string;
  reference: string | null;
  cost: number;
}

export interface OrderBilling {
  receiptType: ReceiptType;
  documentType: DocumentType;
  documentNumber: string;
  businessName: string | null;
}

export interface OrderPayment {
  proofPath: string | null;
  proofUrl: string | null;
  transactionId: string | null;
  rawPayload: Record<string, unknown> | null;
  reportedAt: FirestoreTimestamp | null;
  paidAt: FirestoreTimestamp | null;
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
  shipping: OrderShipping | null;
  billing: OrderBilling | null;
  message: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  payment: OrderPayment;
  subtotal: number | null;
  shippingCost: number | null;
  total: number | null;
  internalNotes: string | null;
  items: OrderItem[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ShippingRates {
  rates: Record<PeruDepartment, number>;
  updatedAt: FirestoreTimestamp | null;
}

export interface PaymentConfig {
  yapeEnabled: boolean;
  yapeQrUrl: string | null;
  yapeNumber: string | null;
  yapeOwnerName: string | null;
  transferEnabled: boolean;
  transferBankName: string | null;
  transferAccountNumber: string | null;
  transferAccountHolder: string | null;
  transferCci: string | null;
  paypalEnabled: boolean;
  paypalClientId: string | null;
  culqiEnabled: boolean;
  culqiPublicKey: string | null;
  updatedAt: FirestoreTimestamp | null;
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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  QUOTE: 'Cotización',
  YAPE: 'Yape',
  TRANSFERENCIA: 'Transferencia',
  PAYPAL: 'PayPal',
  CULQI: 'Culqi',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  NONE: '—',
  PENDING_PROOF: 'Esperando captura',
  PENDING_VERIFICATION: 'Por validar',
  PAID: 'Pagado',
  REJECTED: 'Rechazado',
  REFUNDED: 'Reembolsado',
};

export const PERU_DEPARTMENT_LABELS: Record<PeruDepartment, string> = {
  AMAZONAS: 'Amazonas',
  ANCASH: 'Áncash',
  APURIMAC: 'Apurímac',
  AREQUIPA: 'Arequipa',
  AYACUCHO: 'Ayacucho',
  CAJAMARCA: 'Cajamarca',
  CALLAO: 'Callao',
  CUSCO: 'Cusco',
  HUANCAVELICA: 'Huancavelica',
  HUANUCO: 'Huánuco',
  ICA: 'Ica',
  JUNIN: 'Junín',
  LA_LIBERTAD: 'La Libertad',
  LAMBAYEQUE: 'Lambayeque',
  LIMA: 'Lima',
  LORETO: 'Loreto',
  MADRE_DE_DIOS: 'Madre de Dios',
  MOQUEGUA: 'Moquegua',
  PASCO: 'Pasco',
  PIURA: 'Piura',
  PUNO: 'Puno',
  SAN_MARTIN: 'San Martín',
  TACNA: 'Tacna',
  TUMBES: 'Tumbes',
  UCAYALI: 'Ucayali',
};

export const PERU_DEPARTMENTS: PeruDepartment[] = Object.keys(
  PERU_DEPARTMENT_LABELS,
) as PeruDepartment[];
