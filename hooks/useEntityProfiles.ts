// hooks/useEntityProfiles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entityProfileApi } from '@/services/entity-profile.service';
import type {
  EntityProfile,
  CreateEntityProfilePayload,
  UpdateEntityProfilePayload,
  EntityProfileQueryParams,
} from '@/types/entity-profile.types';

export const ENTITY_PROFILES_QUERY_KEY = 'entityProfiles';

export function useEntityProfiles(params?: EntityProfileQueryParams) {
  return useQuery({
    queryKey: [ENTITY_PROFILES_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await entityProfileApi.getProfiles(params);
      return {
        data: data.data,
        meta: data.meta,
      };
    },
  });
}

export function useCreateEntityProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEntityProfilePayload) =>
      entityProfileApi.createProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITY_PROFILES_QUERY_KEY] });
    },
  });
}

export function useUpdateEntityProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateEntityProfilePayload }) =>
      entityProfileApi.updateProfile(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITY_PROFILES_QUERY_KEY] });
    },
  });
}

export function useDeleteEntityProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => entityProfileApi.deleteProfile(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITY_PROFILES_QUERY_KEY] });
    },
  });
}