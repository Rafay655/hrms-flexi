// src/hooks/useSalaryAssignments.ts

import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  salaryAssignmentService,
  CreateSalaryAssignmentPayload,
} from '@/services/salary-assignment.service';
import type { UpdateSalaryAssignmentPayload } from '@/types/salary-assignment';
import toast from 'react-hot-toast';

export const salaryAssignmentKeys = {
  all: ['salary-assignments'] as const,
  lists: () => [...salaryAssignmentKeys.all, 'list'] as const,
  list: (params: any) => [...salaryAssignmentKeys.lists(), params] as const,
};

export function useSalaryAssignments(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: salaryAssignmentKeys.list(params || {}),
    queryFn: () => salaryAssignmentService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateSalaryAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalaryAssignmentPayload) =>
      salaryAssignmentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryAssignmentKeys.lists() });
      toast.success('Salary assignment created');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create assignment' });
    },
  });
}

// ── Update mutation ────────────────────────────────────
export function useUpdateSalaryAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeUuid,
      assignmentUuid,
      data,
    }: {
      employeeUuid: string;
      assignmentUuid: string;
      data: UpdateSalaryAssignmentPayload;
    }) => salaryAssignmentService.update(employeeUuid, assignmentUuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryAssignmentKeys.lists() });
      toast.success('Salary assignment updated');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update assignment' });
    },
  });
}