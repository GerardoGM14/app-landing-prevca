import { z } from 'zod';
import {
  BOOKING_PAYMENT_STATUS,
  BOOKING_STATUS,
  DOCUMENT_TYPES,
  LODGING_RULES,
} from '../../config/constants';
import { isValidDate } from './lodging.dates';

const date = z.string().refine(isValidDate, 'Fecha inválida (use YYYY-MM-DD)');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (use HH:MM)');

const customerSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  documentType: z.enum(DOCUMENT_TYPES),
  documentNumber: z.string().trim().min(6).max(20),
});

const stayFields = {
  checkIn: date,
  checkOut: date,
  guests: z.number().int().min(1).max(50),
};

const checkStay = (v: { checkIn: string; checkOut: string }) => v.checkOut > v.checkIn;
const stayMessage = { message: 'La salida debe ser posterior a la llegada', path: ['checkOut'] };

/* ------------------------------ Público ------------------------------ */

export const createBookingSchema = z
  .object({
    productSlug: z.string().min(1).max(200),
    ...stayFields,
    customer: customerSchema,
    notes: z.string().trim().max(1000).optional().nullable(),
    paymentMethod: z.enum(['MERCADOPAGO', 'CULQI']),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Debe aceptar las condiciones de la reserva' }),
    }),
  })
  .refine(checkStay, stayMessage);

/* ------------------------------- Admin ------------------------------- */

export const updateLodgingConfigSchema = z.object({
  bookable: z.boolean().optional(),
  nightlyPrice: z.number().positive().max(100_000).nullable().optional(),
  maxGuests: z.number().int().min(1).max(50).optional(),
  minNights: z.number().int().min(1).max(LODGING_RULES.MAX_NIGHTS).optional(),
  checkInTime: time.optional(),
  checkOutTime: time.optional(),
});

/** Rango de días del calendario del admin (ambos incluidos). */
const dayRange = z
  .object({ from: date, to: date })
  .refine((v) => v.to >= v.from, { message: 'El fin debe ser igual o posterior al inicio', path: ['to'] })
  .refine((v) => v.from >= '2000-01-01' && v.to <= '2100-12-31', { message: 'Rango fuera de límites' });

export const blockNightsSchema = z.object({
  from: date,
  to: date,
  note: z.string().trim().max(200).optional().nullable(),
}).refine((v) => v.to >= v.from, { message: 'El fin debe ser igual o posterior al inicio', path: ['to'] });

export const unblockNightsSchema = dayRange;

export const setPricesSchema = z
  .object({
    from: date,
    to: date,
    /** null = volver al precio base */
    price: z.number().positive().max(100_000).nullable(),
  })
  .refine((v) => v.to >= v.from, { message: 'El fin debe ser igual o posterior al inicio', path: ['to'] });

export const calendarQuerySchema = z
  .object({ from: date, to: date })
  .refine((v) => v.to >= v.from, { message: 'El fin debe ser igual o posterior al inicio', path: ['to'] });

export const createManualBookingSchema = z
  .object({
    productId: z.string().min(1),
    ...stayFields,
    customer: customerSchema.partial({ email: true, documentType: true, documentNumber: true }).extend({
      email: z.string().trim().email().max(200).optional().nullable().or(z.literal('')),
    }),
    /** Si se omite, se calcula con las tarifas del departamento */
    total: z.number().nonnegative().max(1_000_000).optional().nullable(),
    paid: z.boolean().default(false),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine(checkStay, stayMessage);

export const bookingQuerySchema = z.object({
  status: z.enum(BOOKING_STATUS).optional(),
  productId: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
});

export const updateBookingSchema = z.object({
  paymentStatus: z.enum(BOOKING_PAYMENT_STATUS).optional(),
  internalNotes: z.string().max(3000).optional().nullable(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateLodgingConfigInput = z.infer<typeof updateLodgingConfigSchema>;
export type BlockNightsInput = z.infer<typeof blockNightsSchema>;
export type UnblockNightsInput = z.infer<typeof unblockNightsSchema>;
export type SetPricesInput = z.infer<typeof setPricesSchema>;
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
export type CreateManualBookingInput = z.infer<typeof createManualBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
