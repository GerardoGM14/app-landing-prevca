import { z } from 'zod';
import { DIVISIONS } from '../../config/constants';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(slugRegex, 'Slug debe ser lowercase con palabras separadas por guiones'),
  name: z.string().min(1).max(120),
  division: z.enum(DIVISIONS),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = z.object({
  division: z.enum(DIVISIONS).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
