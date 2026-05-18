import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ordersApi,
  type OrderListParams,
  type OrderUpdateInput,
} from '../api/orders.api';

const KEYS = {
  all: ['orders'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (params: OrderListParams) => [...KEYS.lists(), params] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
};

export const useOrdersList = (params: OrderListParams = {}) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => ordersApi.list(params),
  });

export const useOrder = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: () => ordersApi.getById(id!),
    enabled: Boolean(id),
  });

export const useUpdateOrder = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderUpdateInput) => ordersApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.lists() }),
  });
};
