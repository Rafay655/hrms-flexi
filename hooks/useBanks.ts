import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService } from '@/services/bank.service';
import toast from 'react-hot-toast';
import type { BankFormData } from '@/types/bank';

export const bankKeys = {
  all: ['banks'] as const,
  lists: () => [...bankKeys.all, 'list'] as const,
  list: (params: any) => [...bankKeys.lists(), params] as const,
};

export function useBanks(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: bankKeys.list(params || {}),
    queryFn: () => bankService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BankFormData) => bankService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.lists() });
      toast.success('Bank created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create bank';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BankFormData }) =>
      bankService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.lists() });
      toast.success('Bank updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update bank';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => bankService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.lists() });
      toast.success('Bank deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete bank';
      showApiError(error, { fallbackMessage: message });
    },
  });
}