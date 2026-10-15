import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stateService } from '@/services/state.service';
import toast from 'react-hot-toast';
import type { StateFormData } from '@/types/state';

export const stateKeys = {
  all: ['states'] as const,
  lists: () => [...stateKeys.all, 'list'] as const,
  list: (params: any) => [...stateKeys.lists(), params] as const,
};

export function useStates(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  country_id?: number;
}) {
  return useQuery({
    queryKey: stateKeys.list(params || {}),
    queryFn: () => stateService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StateFormData) => stateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stateKeys.lists() });
      toast.success('State created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create state';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StateFormData }) =>
      stateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stateKeys.lists() });
      toast.success('State updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update state';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => stateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stateKeys.lists() });
      toast.success('State deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete state';
      showApiError(error, { fallbackMessage: message });
    },
  });
}