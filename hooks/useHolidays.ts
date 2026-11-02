import { useAppSelector } from "@/store/hooks";
import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidayService } from '@/services/holiday.service';
import toast from 'react-hot-toast';
import type { HolidayFormData } from '@/types/holiday';

export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...holidayKeys.lists(), params] as const,
};

export function useHolidays(params?: { page?: number; per_page?: number; search?: string }) {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return useQuery({
    queryKey: [...holidayKeys.list(params || {}), company, user],
    queryFn: () => holidayService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HolidayFormData) => holidayService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
      toast.success('Holiday created');
    },
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to create' }),
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: HolidayFormData }) =>
      holidayService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
      toast.success('Holiday updated');
    },
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to update' }),
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => holidayService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
      toast.success('Holiday deleted');
    },
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to delete' }),
  });
}
export function useHolidayYear(year: number, enabled: boolean) {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return useQuery({
    queryKey: [...holidayKeys.all, 'year', company, user, year],
    queryFn: () => holidayService.getYear(year),
    enabled,
  });
}
