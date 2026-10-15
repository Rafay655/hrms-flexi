import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayService } from '@/services/holiday.service';
import toast from 'react-hot-toast';
import type { HolidayFormData } from '@/types/holiday';

export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  list: (params: any) => [...holidayKeys.lists(), params] as const,
};

export function useHolidays(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: holidayKeys.list(params || {}),
    queryFn: () => holidayService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HolidayFormData) => holidayService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() });
      toast.success('Holiday created');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: HolidayFormData }) =>
      holidayService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() });
      toast.success('Holiday updated');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update' }),
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => holidayService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() });
      toast.success('Holiday deleted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete' }),
  });
}