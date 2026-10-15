import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveEncashmentService } from '@/services/leave-encashment.service';
import toast from 'react-hot-toast';
import type { LeaveEncashmentFormData } from '@/types/leave-encashment';

export const leaveEncashmentKeys = {
  all: ['leave-encashments'] as const,
  lists: () => [...leaveEncashmentKeys.all, 'list'] as const,
  list: (params: any) => [...leaveEncashmentKeys.lists(), params] as const,
};

export function useLeaveEncashments(params: { page?: number; per_page?: number; company_id?: string }) {
  return useQuery({
    queryKey: leaveEncashmentKeys.list(params),
    queryFn: () => leaveEncashmentService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLeaveEncashment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveEncashmentFormData) => leaveEncashmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveEncashmentKeys.lists() });
      toast.success('Encashment recorded');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}