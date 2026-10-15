import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salutationService } from '@/services/salutation.service';
import toast from 'react-hot-toast';
import type { SalutationFormData } from '@/types/salutation';

export const salutationKeys = {
  all: ['salutations'] as const,
  lists: () => [...salutationKeys.all, 'list'] as const,
  list: (params: any) => [...salutationKeys.lists(), params] as const,
};

export function useSalutations(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: salutationKeys.list(params || {}),
    queryFn: () => salutationService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateSalutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SalutationFormData) => salutationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salutationKeys.lists() });
      toast.success('Salutation created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create salutation';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateSalutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SalutationFormData }) =>
      salutationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salutationKeys.lists() });
      toast.success('Salutation updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update salutation';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteSalutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => salutationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salutationKeys.lists() });
      toast.success('Salutation deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete salutation';
      showApiError(error, { fallbackMessage: message });
    },
  });
}