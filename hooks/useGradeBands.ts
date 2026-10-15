import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gradeBandService } from '@/services/grade-band.service';
import toast from 'react-hot-toast';
import type { GradeBandFormData } from '@/types/grade-band';

export const gradeBandKeys = {
  all: ['grade-bands'] as const,
  lists: () => [...gradeBandKeys.all, 'list'] as const,
  list: (params: any) => [...gradeBandKeys.lists(), params] as const,
};

export function useGradeBands(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: gradeBandKeys.list(params || {}),
    queryFn: () => gradeBandService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateGradeBand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GradeBandFormData) => gradeBandService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeBandKeys.lists() });
      toast.success('Grade band created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create grade band';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateGradeBand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GradeBandFormData }) =>
      gradeBandService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeBandKeys.lists() });
      toast.success('Grade band updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update grade band';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteGradeBand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => gradeBandService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeBandKeys.lists() });
      toast.success('Grade band deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete grade band';
      showApiError(error, { fallbackMessage: message });
    },
  });
}