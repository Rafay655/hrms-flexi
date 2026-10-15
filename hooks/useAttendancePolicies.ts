import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendancePolicyService } from '@/services/attendance-policy.service';
import toast from 'react-hot-toast';
import type { AttendancePolicyFormData } from '@/types/attendance-policy';

// ─── Query Keys ──────────────────────────────────────────
export const attendancePolicyKeys = {
  all: ['attendance-policies'] as const,
  lists: () => [...attendancePolicyKeys.all, 'list'] as const,
  list: (params: any) => [...attendancePolicyKeys.lists(), params] as const,
  details: () => [...attendancePolicyKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...attendancePolicyKeys.details(), uuid] as const,
};

// ─── List (paginated, with search) ───────────────────────
export function useAttendancePolicies(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: attendancePolicyKeys.list(params || {}),
    queryFn: () => attendancePolicyService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

// ─── Single policy (for edit form) ───────────────────────
export function useAttendancePolicy(uuid: string | undefined) {
  return useQuery({
    queryKey: attendancePolicyKeys.detail(uuid || ''),
    queryFn: () => attendancePolicyService.getById(uuid!),
    enabled: !!uuid,
  });
}

// ─── Create Mutation ─────────────────────────────────────
export function useCreateAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendancePolicyFormData) => attendancePolicyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancePolicyKeys.lists() });
      toast.success('Policy created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create policy';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

// ─── Update Mutation ─────────────────────────────────────
export function useUpdateAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: AttendancePolicyFormData }) =>
      attendancePolicyService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancePolicyKeys.lists() });
      toast.success('Policy updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update policy';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

// ─── Delete Mutation ─────────────────────────────────────
export function useDeleteAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => attendancePolicyService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancePolicyKeys.lists() });
      toast.success('Policy deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete policy';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

// ─── Combined Save (for form page – decides create/update) ──
export function useSaveAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid?: string; data: AttendancePolicyFormData }) =>
      uuid
        ? attendancePolicyService.update(uuid, data)
        : attendancePolicyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancePolicyKeys.lists() });
      toast.success('Policy saved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to save policy';
      showApiError(error, { fallbackMessage: message });
    },
  });
}