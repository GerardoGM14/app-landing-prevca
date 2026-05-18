import { z } from 'zod';
import { ORDER_STATUS } from '../../config/constants';

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(150),
    email: z.string().email().max(200),
    phone: z.string().max(40).optional(),
    company: z.string().max(150).optional(),
  }),
  message: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(50),
});

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUS).optional(),
  internalNotes: z.string().max(5000).optional().nullable(),
});

export const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUS).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
