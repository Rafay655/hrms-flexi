import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessLineService } from '@/services/business-line.service';
import toast from 'react-hot-toast';
import type { BusinessLineFormData } from '@/types/business-line';

export const businessLineKeys = {
  all: ['business-lines'] as const,
  lists: () => [...businessLineKeys.all, 'list'] as const,
  list: (params: any) => [...businessLineKeys.lists(), params] as const,
};

export function useBusinessLines(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: businessLineKeys.list(params || {}),
    queryFn: () => businessLineService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateBusinessLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BusinessLineFormData) => businessLineService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessLineKeys.lists() });
      toast.success('Business line created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create business line';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateBusinessLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BusinessLineFormData }) =>
      businessLineService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessLineKeys.lists() });
      toast.success('Business line updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update business line';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteBusinessLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => businessLineService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessLineKeys.lists() });
      toast.success('Business line deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete business line';
      showApiError(error, { fallbackMessage: message });
    },
  });
}