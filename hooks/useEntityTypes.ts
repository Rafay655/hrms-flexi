import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entityTypeService } from '@/services/entity-type.service';
import toast from 'react-hot-toast';
import type { EntityTypeFormData } from '@/types/entity-type';

export const entityTypeKeys = {
  all: ['entity-types'] as const,
  lists: () => [...entityTypeKeys.all, 'list'] as const,
  list: (params: any) => [...entityTypeKeys.lists(), params] as const,
};

export function useEntityTypes(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: entityTypeKeys.list(params || {}),
    queryFn: () => entityTypeService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateEntityType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EntityTypeFormData) => entityTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityTypeKeys.lists() });
      toast.success('Entity type created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create entity type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateEntityType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EntityTypeFormData }) =>
      entityTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityTypeKeys.lists() });
      toast.success('Entity type updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update entity type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteEntityType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => entityTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityTypeKeys.lists() });
      toast.success('Entity type deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete entity type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}