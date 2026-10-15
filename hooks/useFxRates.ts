import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fxRateService } from '@/services/fx-rate.service';
import toast from 'react-hot-toast';
import type { FxRateFormData } from '@/types/fx-rate';

export const fxRateKeys = {
  all: ['fx-rates'] as const,
  lists: () => [...fxRateKeys.all, 'list'] as const,
  list: (params: any) => [...fxRateKeys.lists(), params] as const,
};

export function useFxRates(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: fxRateKeys.list(params || {}),
    queryFn: () => fxRateService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateFxRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FxRateFormData) => fxRateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fxRateKeys.lists() });
      toast.success('Exchange rate created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create exchange rate';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateFxRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FxRateFormData }) =>
      fxRateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fxRateKeys.lists() });
      toast.success('Exchange rate updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update exchange rate';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteFxRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => fxRateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fxRateKeys.lists() });
      toast.success('Exchange rate deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete exchange rate';
      showApiError(error, { fallbackMessage: message });
    },
  });
}