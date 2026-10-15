import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maritalStatusService } from '@/services/marital-status.service';
import toast from 'react-hot-toast';
import type { MaritalStatusFormData } from '@/types/marital-status';

export const maritalStatusKeys = {
  all: ['marital-statuses'] as const,
  lists: () => [...maritalStatusKeys.all, 'list'] as const,
  list: (params: any) => [...maritalStatusKeys.lists(), params] as const,
};

export function useMaritalStatuses(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: maritalStatusKeys.list(params || {}),
    queryFn: () => maritalStatusService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateMaritalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MaritalStatusFormData) => maritalStatusService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maritalStatusKeys.lists() });
      toast.success('Marital status created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create marital status';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateMaritalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MaritalStatusFormData }) =>
      maritalStatusService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maritalStatusKeys.lists() });
      toast.success('Marital status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update marital status';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteMaritalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => maritalStatusService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maritalStatusKeys.lists() });
      toast.success('Marital status deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete marital status';
      showApiError(error, { fallbackMessage: message });
    },
  });
}