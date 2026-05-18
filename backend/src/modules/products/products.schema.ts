import { z } from 'zod';
import { DIVISIONS } from '../../config/constants';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createProductSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(slugRegex, 'Slug debe ser lowercase con palabras separadas por guiones'),
  ref: z.string().min(1).max(30),
  title: z.string().min(1).max(200),
  division: z.enum(DIVISIONS),
  categoryId: z.string().optional().nullable(),
  shortDesc: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  specs: z.string().max(300).optional().nullable(),
  features: z.array(z.string().min(1).max(200)).max(20).default([]),
  price: z.number().nonnegative().optional().nullable(),
  showPrice: z.boolean().default(false),
  stock: z.number().int().nonnegative().default(0),
  showStock: z.boolean().default(false),
  trackStock: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  search: z.string().optional(),
  division: z.enum(DIVISIONS).optional(),
  categoryId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const updateStockSchema = z.object({
  quantity: z.number().int(),
  operation: z.enum(['set', 'add']).default('set'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
