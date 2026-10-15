import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { compOffService, type CompOffFormData } from '@/services/comp-off.service';
import toast from 'react-hot-toast';

export const compOffKeys = {
  all: ['comp-off'] as const,
  lists: () => [...compOffKeys.all, 'list'] as const,
  list: (params: any) => [...compOffKeys.lists(), params] as const,
  my: (params: any) => [...compOffKeys.all, 'my', params] as const,
};

export function useCompOffs(params?: any) {
  return useQuery({
    queryKey: compOffKeys.list(params || {}),
    queryFn: () => compOffService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useMyCompOffs(params?: any) {
  return useQuery({
    queryKey: compOffKeys.my(params || {}),
    queryFn: () => compOffService.getMy(params),
  });
}

export function useCreateCompOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompOffFormData) => compOffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compOffKeys.all });
      toast.success('Comp‑off record created');
    },
    onError: (error: any) =>
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}