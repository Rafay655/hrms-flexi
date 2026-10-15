import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavePolicyService } from '@/services/leave-policy.service';
import toast from 'react-hot-toast';
import type { LeavePolicyFormData } from '@/types/leave-policy';

export const leavePolicyKeys = {
  all: ['leave-policies'] as const,
  lists: () => [...leavePolicyKeys.all, 'list'] as const,
  list: (params: any) => [...leavePolicyKeys.lists(), params] as const,
};

export function useLeavePolicies(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: leavePolicyKeys.list(params || {}),
    queryFn: () => leavePolicyService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLeavePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeavePolicyFormData) => leavePolicyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.lists() });
      toast.success('Policy created');
    },
    onError: (error: any) =>
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}

export function useUpdateLeavePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: LeavePolicyFormData }) =>
      leavePolicyService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.lists() });
      toast.success('Policy updated');
    },
    onError: (error: any) =>
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update' }),
  });
}

export function useDeleteLeavePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => leavePolicyService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leavePolicyKeys.lists() });
      toast.success('Policy deleted');
    },
    onError: (error: any) =>
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete' }),
  });
}