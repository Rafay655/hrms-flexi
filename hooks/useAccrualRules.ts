import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accrualRuleService } from '@/services/accrual-rule.service';
import toast from 'react-hot-toast';
import type { AccrualRuleFormData } from '@/types/accrual-rule';

export const accrualRuleKeys = {
  all: ['accrual-rules'] as const,
  lists: () => [...accrualRuleKeys.all, 'list'] as const,
  list: (params: any) => [...accrualRuleKeys.lists(), params] as const,
};

export function useAccrualRules(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: accrualRuleKeys.list(params || {}),
    queryFn: () => accrualRuleService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateAccrualRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AccrualRuleFormData) => accrualRuleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accrualRuleKeys.lists() });
      toast.success('Accrual rule created');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}

export function useUpdateAccrualRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: AccrualRuleFormData }) =>
      accrualRuleService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accrualRuleKeys.lists() });
      toast.success('Accrual rule updated');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update' }),
  });
}

export function useDeleteAccrualRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => accrualRuleService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accrualRuleKeys.lists() });
      toast.success('Accrual rule deleted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete' }),
  });
}