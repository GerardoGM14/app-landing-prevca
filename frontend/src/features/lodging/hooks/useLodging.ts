import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  lodgingApi,
  type BookingListParams,
  type DayRange,
  type LodgingConfigInput,
} from '../api/lodging.api';
import type { BookingPaymentStatus, ManualBookingInput } from '../types';

const KEYS = {
  all: ['lodging'] as const,
  units: () => [...KEYS.all, 'units'] as const,
  calendars: () => [...KEYS.all, 'calendar'] as const,
  calendar: (id: string, range: DayRange) => [...KEYS.calendars(), id, range] as const,
  bookings: () => [...KEYS.all, 'bookings'] as const,
  bookingList: (params: BookingListParams) => [...KEYS.bookings(), 'list', params] as const,
  booking: (id: string) => [...KEYS.bookings(), 'detail', id] as const,
};

/** Cualquier cambio de noches o reservas puede afectar calendario y listados. */
const useInvalidateAll = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEYS.all });
};

export const useLodgingUnits = () =>
  useQuery({ queryKey: KEYS.units(), queryFn: lodgingApi.listUnits });

export const useUnitCalendar = (id: string | undefined, range: DayRange) =>
  useQuery({
    queryKey: KEYS.calendar(id ?? '', range),
    queryFn: () => lodgingApi.getCalendar(id!, range),
    enabled: Boolean(id),
  });

export const useUpdateLodgingConfig = (id: string) => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: LodgingConfigInput) => lodgingApi.updateConfig(id, input),
    onSuccess: invalidate,
  });
};

export const useSetPrices = (id: string) => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: DayRange & { price: number | null }) => lodgingApi.setPrices(id, input),
    onSuccess: invalidate,
  });
};

export const useBlockNights = (id: string) => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: DayRange & { note?: string | null }) => lodgingApi.block(id, input),
    onSuccess: invalidate,
  });
};

export const useUnblockNights = (id: string) => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: DayRange) => lodgingApi.unblock(id, input),
    onSuccess: invalidate,
  });
};

export const useBookingsList = (params: BookingListParams = {}) =>
  useQuery({
    queryKey: KEYS.bookingList(params),
    queryFn: () => lodgingApi.listBookings(params),
  });

export const useBooking = (id: string | undefined) =>
  useQuery({
    queryKey: KEYS.booking(id ?? ''),
    queryFn: () => lodgingApi.getBooking(id!),
    enabled: Boolean(id),
  });

export const useCreateManualBooking = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: ManualBookingInput) => lodgingApi.createManualBooking(input),
    onSuccess: invalidate,
  });
};

export const useUpdateBooking = (id: string) => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: { paymentStatus?: BookingPaymentStatus; internalNotes?: string | null }) =>
      lodgingApi.updateBooking(id, input),
    onSuccess: invalidate,
  });
};

export const useCancelBooking = (id: string) => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (reason: string | null) => lodgingApi.cancelBooking(id, reason),
    onSuccess: invalidate,
  });
};
