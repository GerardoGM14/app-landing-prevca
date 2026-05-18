import { apiClient } from '@/core/api/client';
import type { Category, Division } from '@/types/api';

export interface CategoryInput {
  slug: string;
  name: string;
  division: Division;
  order: number;
  isActive: boolean;
}

export const categoriesApi = {
  list: async (params: { division?: Division; isActive?: boolean } = {}) => {
    const { data } = await apiClient.get<{ items: Category[] }>('/admin/categories', { params });
    return data.items;
  },
  create: async (input: CategoryInput): Promise<Category> => {
    const { data } = await apiClient.post('/admin/categories', input);
    return data;
  },
  update: async (id: string, input: Partial<CategoryInput>): Promise<Category> => {
    const { data } = await apiClient.patch(`/admin/categories/${id}`, input);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};
