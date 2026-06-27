import { apiClient } from '@/core/api/client';
import type {
  Order,
  OrderStatus,
  PaginatedResponse,
  PaymentMethod,
  PaymentStatus,
} from '@/types/api';

export interface OrderListParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  pageSize?: number;
  cursor?: string;
}

export interface OrderUpdateInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  internalNotes?: string | null;
}

export const ordersApi = {
  list: async (params: OrderListParams = {}): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get('/admin/orders', { params });
    return data;
  },

  getById: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get(`/admin/orders/${id}`);
    return data;
  },

  update: async (id: string, input: OrderUpdateInput): Promise<Order> => {
    const { data } = await apiClient.patch(`/admin/orders/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/orders/${id}`);
  },
};
