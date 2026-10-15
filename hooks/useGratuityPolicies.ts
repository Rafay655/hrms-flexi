// src/hooks/useGratuityPolicies.ts

import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  gratuityPolicyService,

} from '@/services/gratuity-policy.service';
import type { CreateGratuityPolicyPayload, UpdateGratuityPolicyPayload } from '@/types/gratuity-policy';
import toast from 'react-hot-toast';

export const gratuityPolicyKeys = {
  all: ['gratuity-policies'] as const,
  lists: () => [...gratuityPolicyKeys.all, 'list'] as const,
  list: (params: any) => [...gratuityPolicyKeys.lists(), params] as const,
};

export function useGratuityPolicies(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: gratuityPolicyKeys.list(params || {}),
    queryFn: () => gratuityPolicyService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateGratuityPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGratuityPolicyPayload) =>
      gratuityPolicyService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratuityPolicyKeys.lists() });
      toast.success('Gratuity policy created');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create policy' });
    },
  });
}

export function useUpdateGratuityPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: UpdateGratuityPolicyPayload }) =>
      gratuityPolicyService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gratuityPolicyKeys.lists() });
      toast.success('Gratuity policy updated');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update policy' });
    },
  });
}