import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  settingsApi,
  type UpdatePaymentConfigInput,
  type UpdateShippingRatesInput,
} from '../api/settings.api';

const KEYS = {
  shippingRates: ['settings', 'shipping-rates'] as const,
  paymentConfig: ['settings', 'payment-config'] as const,
};

export const useShippingRates = () =>
  useQuery({
    queryKey: KEYS.shippingRates,
    queryFn: () => settingsApi.getShippingRates(),
  });

export const useUpdateShippingRates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateShippingRatesInput) => settingsApi.updateShippingRates(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.shippingRates }),
  });
};

export const usePaymentConfig = () =>
  useQuery({
    queryKey: KEYS.paymentConfig,
    queryFn: () => settingsApi.getPaymentConfig(),
  });

export const useUpdatePaymentConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePaymentConfigInput) => settingsApi.updatePaymentConfig(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.paymentConfig }),
  });
};
