import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthConditionService } from '@/services/health-condition.service';
import toast from 'react-hot-toast';
import type { HealthConditionFormData } from '@/types/health-condition';

export const healthConditionKeys = {
  all: ['health-conditions'] as const,
  lists: () => [...healthConditionKeys.all, 'list'] as const,
  list: (params: any) => [...healthConditionKeys.lists(), params] as const,
};

export function useHealthConditions(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: healthConditionKeys.list(params || {}),
    queryFn: () => healthConditionService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateHealthCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HealthConditionFormData) => healthConditionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: healthConditionKeys.lists() });
      toast.success('Health condition created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create health condition';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateHealthCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: HealthConditionFormData }) =>
      healthConditionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: healthConditionKeys.lists() });
      toast.success('Health condition updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update health condition';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteHealthCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => healthConditionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: healthConditionKeys.lists() });
      toast.success('Health condition deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete health condition';
      showApiError(error, { fallbackMessage: message });
    },
  });
}