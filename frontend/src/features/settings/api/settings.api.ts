import { apiClient } from '@/core/api/client';
import type { PaymentConfig, PeruDepartment, ShippingRates } from '@/types/api';

export interface UpdateShippingRatesInput {
  rates: Partial<Record<PeruDepartment, number>>;
}

export type UpdatePaymentConfigInput = Partial<
  Omit<PaymentConfig, 'updatedAt'>
>;

export const settingsApi = {
  getShippingRates: async (): Promise<ShippingRates> => {
    const { data } = await apiClient.get('/admin/settings/shipping-rates');
    return data;
  },

  updateShippingRates: async (input: UpdateShippingRatesInput): Promise<ShippingRates> => {
    const { data } = await apiClient.put('/admin/settings/shipping-rates', input);
    return data;
  },

  getPaymentConfig: async (): Promise<PaymentConfig> => {
    const { data } = await apiClient.get('/admin/settings/payment-config');
    return data;
  },

  updatePaymentConfig: async (input: UpdatePaymentConfigInput): Promise<PaymentConfig> => {
    const { data } = await apiClient.put('/admin/settings/payment-config', input);
    return data;
  },

  uploadYapeQr: async (file: File): Promise<{ url: string; storagePath: string; config: PaymentConfig }> => {
    const formData = new FormData();
    formData.append('qr', file);
    const { data } = await apiClient.post('/admin/settings/yape-qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
