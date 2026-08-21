import { z } from 'zod';
import {
  CLAIM_TYPES,
  CLAIM_ITEM_TYPES,
  CLAIM_STATUS,
  DOCUMENT_TYPES,
} from '../../config/constants';

/**
 * Campos del Libro de Reclamaciones según el formato oficial de INDECOPI
 * (Decreto Supremo N° 011-2011-PCM). Un reclamo lo puede enviar cualquier
 * consumidor sin necesidad de haber comprado en la tienda.
 */
export const createClaimSchema = z.object({
  // 1. Identificación del consumidor reclamante
  consumer: z.object({
    fullName: z.string().min(1).max(200),
    documentType: z.enum(DOCUMENT_TYPES),
    documentNumber: z.string().min(6).max(20),
    address: z.string().min(1).max(300),
    phone: z.string().min(6).max(40),
    email: z.string().email().max(200),
    // Si el consumidor es menor de edad, datos del padre/apoderado
    isMinor: z.boolean().default(false),
    guardianName: z.string().max(200).optional().nullable(),
  }),

  // 2. Identificación del bien contratado
  item: z.object({
    type: z.enum(CLAIM_ITEM_TYPES),
    amount: z.number().nonnegative().optional().nullable(),
    description: z.string().min(1).max(1000),
  }),

  // 3. Detalle de la reclamación
  detail: z.object({
    type: z.enum(CLAIM_TYPES),
    description: z.string().min(1).max(3000),
    request: z.string().min(1).max(2000),
  }),
});

export const claimQuerySchema = z.object({
  status: z.enum(CLAIM_STATUS).optional(),
  type: z.enum(CLAIM_TYPES).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const updateClaimSchema = z.object({
  status: z.enum(CLAIM_STATUS).optional(),
  response: z.string().max(3000).optional().nullable(),
  internalNotes: z.string().max(3000).optional().nullable(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type ClaimQuery = z.infer<typeof claimQuerySchema>;
export type UpdateClaimInput = z.infer<typeof updateClaimSchema>;
