import { z } from 'zod';
import { DIVISIONS, WOOD_TYPES } from '../../config/constants';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Precio del producto según el tipo de madera. Si el array tiene elementos,
 * el producto es "con variantes": el cliente elige la madera y ese es el
 * precio. Si está vacío, se usa el `price` simple del producto.
 */
const woodVariantSchema = z.object({
  woodType: z.enum(WOOD_TYPES),
  price: z.number().nonnegative(),
});

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
  scientificName: z.string().max(120).optional().nullable(),
  origin: z.string().max(300).optional().nullable(),
  applications: z.string().max(2000).optional().nullable(),
  datasheetUrl: z.string().url().max(500).optional().nullable(),
  price: z.number().nonnegative().optional().nullable(),
  /**
   * Variantes de precio por tipo de madera. Si tiene elementos, el producto
   * se vende "por tipo de madera" y `price` se ignora en el checkout.
   * No se permiten tipos de madera repetidos.
   */
  woodVariants: z
    .array(woodVariantSchema)
    .max(WOOD_TYPES.length)
    .default([])
    .refine(
      (variants) => new Set(variants.map((v) => v.woodType)).size === variants.length,
      { message: 'No se puede repetir el mismo tipo de madera' },
    ),
  showPrice: z.boolean().default(false),
  /**
   * Si true, el producto puede comprarse directo (checkout con pago).
   * Si false (default), solo permite agregarse a una solicitud de cotización.
   * Requiere price definido cuando es true.
   */
  allowsDirectPurchase: z.boolean().default(false),
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
  categorySlug: z.string().optional(),
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
