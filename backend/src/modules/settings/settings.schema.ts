import { z } from 'zod';
import { PERU_DEPARTMENTS } from '../../config/constants';

/**
 * Tarifas de envío por departamento. Todos los departamentos son obligatorios
 * para evitar que falte alguno y la app reviente en checkout.
 */
const shippingRatesShape = Object.fromEntries(
  PERU_DEPARTMENTS.map((dept) => [dept, z.number().nonnegative().max(1000)]),
) as Record<(typeof PERU_DEPARTMENTS)[number], z.ZodNumber>;

export const updateShippingRatesSchema = z.object({
  rates: z.object(shippingRatesShape).partial(),
});

export const updatePaymentConfigSchema = z.object({
  yapeEnabled: z.boolean().optional(),
  yapeQrUrl: z.string().url().max(500).optional().nullable(),
  yapeNumber: z.string().max(40).optional().nullable(),
  yapeOwnerName: z.string().max(150).optional().nullable(),
  transferEnabled: z.boolean().optional(),
  transferBankName: z.string().max(150).optional().nullable(),
  transferAccountNumber: z.string().max(40).optional().nullable(),
  transferAccountHolder: z.string().max(150).optional().nullable(),
  transferCci: z.string().max(40).optional().nullable(),
  paypalEnabled: z.boolean().optional(),
  paypalClientId: z.string().max(200).optional().nullable(),
  culqiEnabled: z.boolean().optional(),
  culqiPublicKey: z.string().max(200).optional().nullable(),
});

export type UpdateShippingRatesInput = z.infer<typeof updateShippingRatesSchema>;
export type UpdatePaymentConfigInput = z.infer<typeof updatePaymentConfigSchema>;
