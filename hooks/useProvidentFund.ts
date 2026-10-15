// hooks/useProvidentFund.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providentFundApi } from '@/services/provident-fund.service';
import type {
  PFPolicy,
  CreatePFPolicyPayload,
  UpdatePFPolicyPayload,
  PFPolicyQueryParams,
  PFSalaryInput,
  PFCalculationPreview,
} from '@/types/provident-fund.types';

export const PF_POLICIES_QUERY_KEY = 'pfPolicies';

// ── Policies ───────────────────────────────────────────
export function usePFPolicies(params?: PFPolicyQueryParams) {
  return useQuery({
    queryKey: [PF_POLICIES_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await providentFundApi.getPolicies(params);
      return {
        data: data.data,
        meta: data.meta,
      };
    },
  });
}

export function useCreatePFPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePFPolicyPayload) =>
      providentFundApi.createPolicy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PF_POLICIES_QUERY_KEY] });
    },
  });
}

export function useUpdatePFPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdatePFPolicyPayload }) =>
      providentFundApi.updatePolicy(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PF_POLICIES_QUERY_KEY] });
    },
  });
}

export function useDeletePFPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => providentFundApi.deletePolicy(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PF_POLICIES_QUERY_KEY] });
    },
  });
}

// ── Calculation ───────────────────────────────────────
export function useCalculatePF() {
  return useMutation({
    mutationFn: (payload: PFSalaryInput) =>
      providentFundApi.calculatePreview(payload),
  });
}