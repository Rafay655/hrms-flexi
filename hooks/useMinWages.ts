// hooks/useMinimumWages.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { minimumWageApi } from '@/services/min-wage.service';
import type {
  MinimumWage,
  CreateMinimumWagePayload,
  UpdateMinimumWagePayload,
  MinimumWageQueryParams,
} from '@/types/minimum-wage.types';

export const MINIMUM_WAGES_QUERY_KEY = 'minimumWages';

export function useMinimumWages(params?: MinimumWageQueryParams) {
  return useQuery({
    queryKey: [MINIMUM_WAGES_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await minimumWageApi.getConfigs(params);
      return {
        data: data.data,
        meta: data.meta,
      };
    },
  });
}

export function useCreateMinimumWage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMinimumWagePayload) =>
      minimumWageApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MINIMUM_WAGES_QUERY_KEY] });
    },
  });
}

export function useUpdateMinimumWage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateMinimumWagePayload }) =>
      minimumWageApi.updateConfig(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MINIMUM_WAGES_QUERY_KEY] });
    },
  });
}

export function useDeleteMinimumWage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => minimumWageApi.deleteConfig(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MINIMUM_WAGES_QUERY_KEY] });
    },
  });
}