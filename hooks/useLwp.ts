import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lwpService } from '@/services/lwp.service';
import toast from 'react-hot-toast';
import type { LwpFormData } from '@/types/lwp';

export const lwpKeys = {
  all: ['lwp'] as const,
  lists: () => [...lwpKeys.all, 'list'] as const,
  list: (params: any) => [...lwpKeys.lists(), params] as const,
};

export function useLwp(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: lwpKeys.list(params || {}),
    queryFn: () => lwpService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLwp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LwpFormData) => lwpService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lwpKeys.lists() });
      toast.success('LWP record created');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}