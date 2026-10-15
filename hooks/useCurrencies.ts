import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currencyService } from '@/services/currency.service';
import toast from 'react-hot-toast';
import type { CurrencyFormData } from '@/types/currency';

export const currencyKeys = {
  all: ['currencies'] as const,
  lists: () => [...currencyKeys.all, 'list'] as const,
  list: (params: any) => [...currencyKeys.lists(), params] as const,
};

export function useCurrencies(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: currencyKeys.list(params || {}),
    queryFn: () => currencyService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CurrencyFormData) => currencyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      toast.success('Currency created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create currency';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CurrencyFormData }) =>
      currencyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      toast.success('Currency updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update currency';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => currencyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      toast.success('Currency deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete currency';
      showApiError(error, { fallbackMessage: message });
    },
  });
}