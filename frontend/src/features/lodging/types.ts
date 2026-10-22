import type { DocumentType, FirestoreTimestamp } from '@/types/api';

export type BookingStatus = 'PENDIENTE_PAGO' | 'CONFIRMADA' | 'CANCELADA' | 'EXPIRADA' | 'REVISAR';
export type BookingPaymentStatus = 'PENDING' | 'PAID' | 'REJECTED' | 'REFUNDED';
export type BookingPaymentMethod = 'MERCADOPAGO' | 'CULQI' | 'MANUAL';
export type NightStatus = 'HOLD' | 'BOOKED' | 'BLOCKED';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
  REVISAR: 'Revisar',
};

export const BOOKING_STATUS_BADGE: Record<BookingStatus, 'yellow' | 'green' | 'gray' | 'red'> = {
  PENDIENTE_PAGO: 'yellow',
  CONFIRMADA: 'green',
  CANCELADA: 'gray',
  EXPIRADA: 'gray',
  REVISAR: 'red',
};

export const BOOKING_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  PENDING: 'Por cobrar',
  PAID: 'Pagado',
  REJECTED: 'Rechazado',
  REFUNDED: 'Devuelto',
};

export const BOOKING_PAYMENT_BADGE: Record<BookingPaymentStatus, 'yellow' | 'green' | 'red' | 'gray'> = {
  PENDING: 'yellow',
  PAID: 'green',
  REJECTED: 'red',
  REFUNDED: 'gray',
};

export const BOOKING_PAYMENT_METHOD_LABELS: Record<BookingPaymentMethod, string> = {
  MERCADOPAGO: 'MercadoPago',
  CULQI: 'Culqi',
  MANUAL: 'Manual',
};

export interface LodgingConfig {
  bookable: boolean;
  nightlyPrice: number | null;
  maxGuests: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  priceOverrides: Record<string, number>;
}

export interface LodgingUnit {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  imageUrl: string | null;
  lodging: LodgingConfig;
}

export interface CalendarNight {
  date: string;
  status: NightStatus;
  bookingId: string | null;
  bookingCode: string | null;
  note: string | null;
}

export interface UnitCalendar {
  nightlyPrice: number | null;
  priceOverrides: Record<string, number>;
  nights: CalendarNight[];
}

export interface Booking {
  id: string;
  code: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  nightly: { date: string; price: number }[];
  total: number;
  customer: {
    name: string;
    email: string | null;
    phone: string;
    documentType: DocumentType | null;
    documentNumber: string | null;
  };
  notes: string | null;
  status: BookingStatus;
  source: 'WEB' | 'ADMIN';
  paymentMethod: BookingPaymentMethod;
  paymentStatus: BookingPaymentStatus;
  holdExpiresAt: FirestoreTimestamp | null;
  transactionId: string | null;
  paidAt: FirestoreTimestamp | null;
  cancelReason: string | null;
  cancelledAt: FirestoreTimestamp | null;
  internalNotes: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ManualBookingInput {
  productId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  customer: {
    name: string;
    phone: string;
    email?: string | null;
    documentType?: DocumentType;
    documentNumber?: string;
  };
  total?: number | null;
  paid: boolean;
  notes?: string | null;
}
