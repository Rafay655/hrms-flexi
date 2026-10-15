import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statutoryRateService } from '@/services/statutory-rate.service';
import toast from 'react-hot-toast';
import type { StatutoryRateFormData } from '@/types/statutory-rate';

export const statutoryRateKeys = {
  all: ['statutory-rates'] as const,
  lists: () => [...statutoryRateKeys.all, 'list'] as const,
  list: (params: any) => [...statutoryRateKeys.lists(), params] as const,
};

export function useStatutoryRates(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: statutoryRateKeys.list(params || {}),
    queryFn: () => statutoryRateService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateStatutoryRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StatutoryRateFormData) => statutoryRateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statutoryRateKeys.lists() });
      toast.success('Statutory rate created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create statutory rate';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateStatutoryRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StatutoryRateFormData }) =>
      statutoryRateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statutoryRateKeys.lists() });
      toast.success('Statutory rate updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update statutory rate';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteStatutoryRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => statutoryRateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statutoryRateKeys.lists() });
      toast.success('Statutory rate deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete statutory rate';
      showApiError(error, { fallbackMessage: message });
    },
  });
}