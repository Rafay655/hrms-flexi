// hooks/useEobiConfigs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eobiConfigApi } from '@/services/eobi-config.service';
import type {
  EobiConfig,
  CreateEobiConfigPayload,
  UpdateEobiConfigPayload,
  EobiConfigQueryParams,
} from '@/types/eobi-config.types';

export const EOBI_CONFIGS_QUERY_KEY = 'eobiConfigs';

export function useEobiConfigs(params?: EobiConfigQueryParams) {
  return useQuery({
    queryKey: [EOBI_CONFIGS_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await eobiConfigApi.getConfigs(params);
      return {
        data: data.data,
        meta: data.meta,
      };
    },
  });
}

export function useCreateEobiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEobiConfigPayload) =>
      eobiConfigApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EOBI_CONFIGS_QUERY_KEY] });
    },
  });
}

export function useUpdateEobiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateEobiConfigPayload }) =>
      eobiConfigApi.updateConfig(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EOBI_CONFIGS_QUERY_KEY] });
    },
  });
}

export function useDeleteEobiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => eobiConfigApi.deleteConfig(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EOBI_CONFIGS_QUERY_KEY] });
    },
  });
}