import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, type ProductInput, type ProductListParams } from '../api/products.api';

const KEYS = {
  all: ['products'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (params: ProductListParams) => [...KEYS.lists(), params] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
};

export const useProductsList = (params: ProductListParams = {}) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => productsApi.list(params),
  });

export const useProduct = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: () => productsApi.getById(id!),
    enabled: Boolean(id),
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => productsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.lists() }),
  });
};

export const useUpdateProduct = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProductInput>) => productsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.lists() }),
  });
};

export const useUploadImages = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => productsApi.uploadImages(productId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.detail(productId) }),
  });
};

export const useDeleteImage = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storagePath: string) => productsApi.deleteImage(productId, storagePath),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.detail(productId) }),
  });
};

export const useUpdateImage = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      storagePath,
      input,
    }: {
      storagePath: string;
      input: { alt?: string | null; isPrimary?: boolean; order?: number };
    }) => productsApi.updateImage(productId, storagePath, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.detail(productId) }),
  });
};
