import { useAppSelector } from "@/store/hooks";
import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveTypeService } from '@/services/leave-type.service';
import toast from 'react-hot-toast';
import type { LeaveTypeFormData } from '@/types/leave-type';

export const leaveTypeKeys = {
  all: ['leave-types'] as const,
  lists: () => [...leaveTypeKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...leaveTypeKeys.lists(), params] as const,
};

export function useLeaveTypes(params?: { page?: number; per_page?: number; search?: string; is_active?: number }) {
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  return useQuery({
    queryKey: [...leaveTypeKeys.list(params || {}), company, user],
    queryFn: () => leaveTypeService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveTypeFormData) => leaveTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.lists() });
      toast.success('Leave type created');
    },
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to create' }),
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: LeaveTypeFormData }) =>
      leaveTypeService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.lists() });
      toast.success('Leave type updated');
    },
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to update' }),
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => leaveTypeService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.lists() });
      toast.success('Leave type deleted');
    },
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to delete' }),
  });
}