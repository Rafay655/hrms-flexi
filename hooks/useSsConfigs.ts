// hooks/useSsConfigs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ssConfigApi } from '@/services/ss-config.service';
import type {
  SsConfig,
  CreateSsConfigPayload,
  UpdateSsConfigPayload,
  SsConfigQueryParams,
} from '@/types/ss-config.types';

export const SS_CONFIGS_QUERY_KEY = 'ssConfigs';

export function useSsConfigs(params?: SsConfigQueryParams) {
  return useQuery({
    queryKey: [SS_CONFIGS_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await ssConfigApi.getConfigs(params);
      return {
        data: data.data,
        meta: data.meta,
      };
    },
  });
}

export function useCreateSsConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSsConfigPayload) =>
      ssConfigApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SS_CONFIGS_QUERY_KEY] });
    },
  });
}

export function useUpdateSsConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateSsConfigPayload }) =>
      ssConfigApi.updateConfig(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SS_CONFIGS_QUERY_KEY] });
    },
  });
}

export function useDeleteSsConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => ssConfigApi.deleteConfig(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SS_CONFIGS_QUERY_KEY] });
    },
  });
}