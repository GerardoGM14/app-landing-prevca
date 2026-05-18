import { z } from 'zod';

export const updateImageSchema = z.object({
  alt: z.string().max(200).optional().nullable(),
  isPrimary: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const reorderImagesSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});

export type UpdateImageInput = z.infer<typeof updateImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
