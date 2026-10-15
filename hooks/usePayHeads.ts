import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payHeadService } from '@/services/pay-head.service';
import toast from 'react-hot-toast';
import type { PayHeadFormData } from '@/types/pay-head';

export const payHeadKeys = {
  all: ['pay-heads'] as const,
  lists: () => [...payHeadKeys.all, 'list'] as const,
  list: (params: any) => [...payHeadKeys.lists(), params] as const,
};

export function usePayHeads(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: payHeadKeys.list(params || {}),
    queryFn: () => payHeadService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreatePayHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PayHeadFormData) => payHeadService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payHeadKeys.lists() });
      toast.success('Pay head created');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}

export function useUpdatePayHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: PayHeadFormData }) =>
      payHeadService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payHeadKeys.lists() });
      toast.success('Pay head updated');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update' }),
  });
}

export function useDeletePayHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => payHeadService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payHeadKeys.lists() });
      toast.success('Pay head deleted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete' }),
  });
}