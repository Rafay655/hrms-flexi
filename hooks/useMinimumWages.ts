import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { minimumWageService } from '@/services/minimum-wage.service';
import toast from 'react-hot-toast';
import type { MinimumWageFormData } from '@/types/minimum-wage';

export const minimumWageKeys = {
  all: ['minimum-wages'] as const,
  lists: () => [...minimumWageKeys.all, 'list'] as const,
  list: (params: any) => [...minimumWageKeys.lists(), params] as const,
};

export function useMinimumWages(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: minimumWageKeys.list(params || {}),
    queryFn: () => minimumWageService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateMinimumWage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MinimumWageFormData) => minimumWageService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: minimumWageKeys.lists() });
      toast.success('Minimum wage created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create minimum wage';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateMinimumWage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MinimumWageFormData }) =>
      minimumWageService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: minimumWageKeys.lists() });
      toast.success('Minimum wage updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update minimum wage';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteMinimumWage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => minimumWageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: minimumWageKeys.lists() });
      toast.success('Minimum wage deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete minimum wage';
      showApiError(error, { fallbackMessage: message });
    },
  });
}