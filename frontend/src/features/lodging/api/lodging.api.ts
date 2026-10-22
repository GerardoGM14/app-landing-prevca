import { apiClient } from '@/core/api/client';
import type { PaginatedResponse } from '@/types/api';
import type {
  Booking,
  BookingPaymentStatus,
  BookingStatus,
  LodgingConfig,
  LodgingUnit,
  ManualBookingInput,
  UnitCalendar,
} from '../types';

export interface BookingListParams {
  status?: BookingStatus;
  productId?: string;
  pageSize?: number;
  cursor?: string;
}

export type LodgingConfigInput = Partial<Omit<LodgingConfig, 'priceOverrides'>>;

export interface DayRange {
  from: string;
  to: string;
}

export const lodgingApi = {
  listUnits: async (): Promise<LodgingUnit[]> => {
    const { data } = await apiClient.get('/admin/lodging/units');
    return data.items;
  },

  updateConfig: async (id: string, input: LodgingConfigInput): Promise<LodgingConfig> => {
    const { data } = await apiClient.patch(`/admin/lodging/units/${id}`, input);
    return data;
  },

  setPrices: async (id: string, input: DayRange & { price: number | null }): Promise<LodgingConfig> => {
    const { data } = await apiClient.post(`/admin/lodging/units/${id}/prices`, input);
    return data;
  },

  getCalendar: async (id: string, range: DayRange): Promise<UnitCalendar> => {
    const { data } = await apiClient.get(`/admin/lodging/units/${id}/calendar`, { params: range });
    return data;
  },

  block: async (id: string, input: DayRange & { note?: string | null }): Promise<void> => {
    await apiClient.post(`/admin/lodging/units/${id}/block`, input);
  },

  unblock: async (id: string, input: DayRange): Promise<{ released: number }> => {
    const { data } = await apiClient.post(`/admin/lodging/units/${id}/unblock`, input);
    return data;
  },

  listBookings: async (params: BookingListParams = {}): Promise<PaginatedResponse<Booking>> => {
    const { data } = await apiClient.get('/admin/lodging/bookings', { params });
    return data;
  },

  getBooking: async (id: string): Promise<Booking> => {
    const { data } = await apiClient.get(`/admin/lodging/bookings/${id}`);
    return data;
  },

  createManualBooking: async (input: ManualBookingInput): Promise<Booking> => {
    const { data } = await apiClient.post('/admin/lodging/bookings', input);
    return data;
  },

  updateBooking: async (
    id: string,
    input: { paymentStatus?: BookingPaymentStatus; internalNotes?: string | null },
  ): Promise<Booking> => {
    const { data } = await apiClient.patch(`/admin/lodging/bookings/${id}`, input);
    return data;
  },

  cancelBooking: async (id: string, reason: string | null): Promise<Booking> => {
    const { data } = await apiClient.post(`/admin/lodging/bookings/${id}/cancel`, { reason });
    return data;
  },
};
