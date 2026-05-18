import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, type CategoryInput } from '../api/categories.api';
import type { Division } from '@/types/api';

const KEYS = {
  all: ['categories'] as const,
  list: (filter: { division?: Division } = {}) => [...KEYS.all, 'list', filter] as const,
};

export const useCategoriesList = (filter: { division?: Division } = {}) =>
  useQuery({
    queryKey: KEYS.list(filter),
    queryFn: () => categoriesApi.list(filter),
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      categoriesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
};
