import { useAppSelector } from "@/store/hooks";
import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveRequestService } from '@/services/leave-request.service';
import toast from 'react-hot-toast';
import type { LeaveRequestFormData, LeaveRequestFilters } from '@/types/leave-request';

export const leaveRequestKeys = {
  all: ['leave-requests'] as const,
  lists: () => [...leaveRequestKeys.all, 'list'] as const,
  list: (params: LeaveRequestFilters) => [...leaveRequestKeys.lists(), params] as const,
};

export function useLeaveRequests(params?: LeaveRequestFilters) {
  const company=useAppSelector(s=>s.auth.company?.id);
  const user=useAppSelector(s=>s.auth.user?.id);
  return useQuery({
    queryKey: [...leaveRequestKeys.list(params || {}),company,user],
    queryFn: ({signal}) => leaveRequestService.getAll(params,signal),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveRequestFormData) => leaveRequestService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() });
      toast.success('Leave request created');
    },
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to submit' }),
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
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to update' }),
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
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to delete' }),
  });
}