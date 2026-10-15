import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankBranchService } from '@/services/bank-branch.service';
import toast from 'react-hot-toast';
import type { BankBranchFormData } from '@/types/bank-branch';

export const bankBranchKeys = {
  all: ['bank-branches'] as const,
  lists: () => [...bankBranchKeys.all, 'list'] as const,
  list: (params: any) => [...bankBranchKeys.lists(), params] as const,
};

export function useBankBranches(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: bankBranchKeys.list(params || {}),
    queryFn: () => bankBranchService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateBankBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BankBranchFormData) => bankBranchService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankBranchKeys.lists() });
      toast.success('Bank branch created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create bank branch';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateBankBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BankBranchFormData }) =>
      bankBranchService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankBranchKeys.lists() });
      toast.success('Bank branch updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update bank branch';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteBankBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => bankBranchService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankBranchKeys.lists() });
      toast.success('Bank branch deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete bank branch';
      showApiError(error, { fallbackMessage: message });
    },
  });
}