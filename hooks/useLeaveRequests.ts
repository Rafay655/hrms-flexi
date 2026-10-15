import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveRequestService } from '@/services/leave-request.service';
import toast from 'react-hot-toast';
import type { LeaveRequestFormData } from '@/types/leave-request';

export const leaveRequestKeys = {
  all: ['leave-requests'] as const,
  lists: () => [...leaveRequestKeys.all, 'list'] as const,
  list: (params: any) => [...leaveRequestKeys.lists(), params] as const,
};

export function useLeaveRequests(params?: { page?: number; per_page?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: leaveRequestKeys.list(params || {}),
    queryFn: () => leaveRequestService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveRequestFormData) => leaveRequestService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() });
      toast.success('Leave request submitted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to submit' }),
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: LeaveRequestFormData }) =>
      leaveRequestService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() });
      toast.success('Leave request updated');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update' }),
  });
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => leaveRequestService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() });
      toast.success('Leave request deleted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete' }),
  });
}