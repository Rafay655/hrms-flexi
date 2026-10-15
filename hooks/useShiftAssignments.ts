import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftAssignmentService } from '@/services/shift-assignment.service';
import toast from 'react-hot-toast';
import type { ShiftAssignmentFormData } from '@/types/shift-assignment';

export const shiftAssignmentKeys = {
  all: ['shift-assignments'] as const,
  lists: () => [...shiftAssignmentKeys.all, 'list'] as const,
  list: (params: any) => [...shiftAssignmentKeys.lists(), params] as const,
};

export function useShiftAssignments(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: number;
}) {
  return useQuery({
    queryKey: shiftAssignmentKeys.list(params || {}),
    queryFn: () => shiftAssignmentService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateShiftAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShiftAssignmentFormData) => shiftAssignmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftAssignmentKeys.lists() });
      toast.success('Assignment created successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create assignment' });
    },
  });
}

export function useUpdateShiftAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: ShiftAssignmentFormData }) =>
      shiftAssignmentService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftAssignmentKeys.lists() });
      toast.success('Assignment updated successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update assignment' });
    },
  });
}

export function useDeleteShiftAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => shiftAssignmentService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftAssignmentKeys.lists() });
      toast.success('Assignment deleted successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete assignment' });
    },
  });
}