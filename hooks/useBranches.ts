import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchService } from '@/services/branch.service';
import toast from 'react-hot-toast';
import type { BranchFormData } from '@/types/branch';

export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (params: any) => [...branchKeys.lists(), params] as const,
};

export function useBranches(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: number;
}) {
  return useQuery({
    queryKey: branchKeys.list(params || {}),
    queryFn: () => branchService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BranchFormData) => branchService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      toast.success('Branch created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create branch';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: BranchFormData }) =>
      branchService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      toast.success('Branch updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update branch';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => branchService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      toast.success('Branch deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete branch';
      showApiError(error, { fallbackMessage: message });
    },
  });
}