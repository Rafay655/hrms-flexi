import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftService } from '@/services/shift.service';
import toast from 'react-hot-toast';
import type { ShiftFormData } from '@/types/shift';

export const shiftKeys = {
  all: ['shifts'] as const,
  lists: () => [...shiftKeys.all, 'list'] as const,
  list: (params: any) => [...shiftKeys.lists(), params] as const,
};

export function useShifts(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: number;
}) {
  return useQuery({
    queryKey: shiftKeys.list(params || {}),
    queryFn: () => shiftService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShiftFormData) => shiftService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      toast.success('Shift created successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create shift' });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: ShiftFormData }) =>
      shiftService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      toast.success('Shift updated successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update shift' });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => shiftService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      toast.success('Shift deleted successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete shift' });
    },
  });
}