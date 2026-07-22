import { z } from 'zod';
import {
  DOCUMENT_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  PERU_DEPARTMENTS,
  RECEIPT_TYPES,
  WOOD_TYPES,
} from '../../config/constants';

const customerSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  company: z.string().max(150).optional(),
});

const shippingSchema = z.object({
  department: z.enum(PERU_DEPARTMENTS),
  province: z.string().min(1).max(120),
  district: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
  reference: z.string().max(300).optional(),
});

const billingSchema = z.object({
  receiptType: z.enum(RECEIPT_TYPES),
  documentType: z.enum(DOCUMENT_TYPES),
  documentNumber: z.string().min(6).max(20),
  businessName: z.string().max(200).optional(),
});

const itemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      /**
       * Tipo de madera elegido, solo para productos con variantes.
       * El precio SIEMPRE se resuelve en servidor a partir de este valor.
       */
      woodType: z.enum(WOOD_TYPES).optional(),
      /**
       * `value` de la opción elegida, para productos con opciones libres.
       * El precio se resuelve en servidor a partir de este valor.
       */
      optionValue: z.string().max(80).optional(),
    }),
  )
  .min(1)
  .max(50);

/**
 * Schema histórico: cotización simple (sin pago, sin envío).
 * Sigue funcionando para productos que NO permiten pago directo.
 */
export const createOrderSchema = z.object({
  customer: customerSchema,
  message: z.string().max(2000).optional(),
  items: itemsSchema,
});

/**
 * Schema nuevo: checkout con pago, envío y facturación.
 * Solo válido si TODOS los items tienen allowsDirectPurchase=true.
 */
export const checkoutSchema = z.object({
  customer: customerSchema,
  shipping: shippingSchema,
  billing: billingSchema,
  message: z.string().max(2000).optional(),
  items: itemsSchema,
  paymentMethod: z.enum(PAYMENT_METHODS).refine((m) => m !== 'QUOTE', {
    message: 'paymentMethod no puede ser QUOTE en checkout',
  }),
});

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUS).optional(),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  internalNotes: z.string().max(5000).optional().nullable(),
});

export const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUS).optional(),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type ShippingInput = z.infer<typeof shippingSchema>;
export type BillingInput = z.infer<typeof billingSchema>;
