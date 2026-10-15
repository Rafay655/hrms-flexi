import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regionService } from '@/services/region.service';
import toast from 'react-hot-toast';
import type { RegionFormData } from '@/types/region';

export const regionKeys = {
  all: ['regions'] as const,
  lists: () => [...regionKeys.all, 'list'] as const,
  list: (params: any) => [...regionKeys.lists(), params] as const,
};

export function useRegions(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: regionKeys.list(params || {}),
    queryFn: () => regionService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegionFormData) => regionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
      toast.success('Region created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create region';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RegionFormData }) =>
      regionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
      toast.success('Region updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update region';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => regionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.lists() });
      toast.success('Region deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete region';
      showApiError(error, { fallbackMessage: message });
    },
  });
}