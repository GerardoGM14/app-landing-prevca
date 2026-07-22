import { apiClient } from '@/core/api/client';
import type {
  Division,
  PaginatedResponse,
  Product,
  ProductImage,
  WoodVariant,
  ProductOption,
} from '@/types/api';

export interface ProductListParams {
  search?: string;
  division?: Division;
  categoryId?: string;
  isActive?: boolean;
  pageSize?: number;
  cursor?: string;
}

export interface ProductInput {
  slug: string;
  ref: string;
  title: string;
  division: Division;
  categoryId?: string | null;
  shortDesc: string;
  description: string;
  specs?: string | null;
  features: string[];
  scientificName?: string | null;
  origin?: string | null;
  applications?: string | null;
  datasheetUrl?: string | null;
  price?: number | null;
  /** Precios por tipo de madera; si tiene elementos, manda sobre `price` */
  woodVariants: WoodVariant[];
  /** Opciones libres con precio (medidas, presentaciones) */
  options: ProductOption[];
  optionLabel?: string | null;
  subcategory?: string | null;
  showPrice: boolean;
  allowsDirectPurchase: boolean;
  stock: number;
  showStock: boolean;
  trackStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
}

export const productsApi = {
  list: async (params: ProductListParams = {}): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get('/admin/products', { params });
    return data;
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get(`/admin/products/${id}`);
    return data;
  },

  create: async (input: ProductInput): Promise<Product> => {
    const { data } = await apiClient.post('/admin/products', input);
    return data;
  },

  update: async (id: string, input: Partial<ProductInput>): Promise<Product> => {
    const { data } = await apiClient.patch(`/admin/products/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  updateStock: async (
    id: string,
    payload: { quantity: number; operation: 'set' | 'add' },
  ): Promise<Product> => {
    const { data } = await apiClient.patch(`/admin/products/${id}/stock`, payload);
    return data;
  },

  uploadImages: async (productId: string, files: File[]): Promise<{ images: ProductImage[] }> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    const { data } = await apiClient.post(`/admin/images/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteImage: async (productId: string, storagePath: string): Promise<void> => {
    await apiClient.delete(`/admin/images/${productId}/${encodeURIComponent(storagePath)}`);
  },

  updateImage: async (
    productId: string,
    storagePath: string,
    input: { alt?: string | null; isPrimary?: boolean; order?: number },
  ): Promise<ProductImage> => {
    const { data } = await apiClient.patch(
      `/admin/images/${productId}/${encodeURIComponent(storagePath)}`,
      input,
    );
    return data;
  },
};
