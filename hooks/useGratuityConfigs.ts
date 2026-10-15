// hooks/useGratuityConfigs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gratuityConfigApi } from '@/services/gratuity-config.service';
import type {
  GratuityConfig,
  CreateGratuityConfigPayload,
  UpdateGratuityConfigPayload,
  GratuityConfigQueryParams,
} from '@/types/gratuity-config.types';

export const GRATUITY_CONFIGS_QUERY_KEY = 'gratuityConfigs';

export function useGratuityConfigs(params?: GratuityConfigQueryParams) {
  return useQuery({
    queryKey: [GRATUITY_CONFIGS_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await gratuityConfigApi.getConfigs(params);
      return {
        data: data.data,
        meta: data.meta,
      };
    },
  });
}

export function useCreateGratuityConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGratuityConfigPayload) =>
      gratuityConfigApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GRATUITY_CONFIGS_QUERY_KEY] });
    },
  });
}

export function useUpdateGratuityConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateGratuityConfigPayload }) =>
      gratuityConfigApi.updateConfig(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GRATUITY_CONFIGS_QUERY_KEY] });
    },
  });
}

export function useDeleteGratuityConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => gratuityConfigApi.deleteConfig(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GRATUITY_CONFIGS_QUERY_KEY] });
    },
  });
}