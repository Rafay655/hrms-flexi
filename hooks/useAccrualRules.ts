import { useAppSelector } from "@/store/hooks";
import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accrualRuleService } from '@/services/accrual-rule.service';
import toast from 'react-hot-toast';
import type { AccrualRuleFormData, AccrualRuleFilters } from '@/types/accrual-rule';

export const accrualRuleKeys = {
  all: ['accrual-rules'] as const,
  lists: () => [...accrualRuleKeys.all, 'list'] as const,
  list: (params: AccrualRuleFilters) => [...accrualRuleKeys.lists(), params] as const,
};

export function useAccrualRules(params?: AccrualRuleFilters, enabled = true) {
  const company=useAppSelector(state=>state.auth.company?.id);
  const user=useAppSelector(state=>state.auth.user?.id);
  return useQuery({
    queryKey: [...accrualRuleKeys.list(params || {}),company,user],
    queryFn: ({ signal }) => accrualRuleService.getAll(params, signal),
    enabled,
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
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to create' }),
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
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to update' }),
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
    onError: (error: unknown) => showApiError(error, { fallbackMessage: 'Failed to delete' }),
  });
}