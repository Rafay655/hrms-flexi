import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationTypeService } from '@/services/location-type.service';
import toast from 'react-hot-toast';
import type { LocationTypeFormData } from '@/types/location-type';

export const locationTypeKeys = {
  all: ['location-types'] as const,
  lists: () => [...locationTypeKeys.all, 'list'] as const,
  list: (params: any) => [...locationTypeKeys.lists(), params] as const,
};

export function useLocationTypes(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: locationTypeKeys.list(params || {}),
    queryFn: () => locationTypeService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLocationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LocationTypeFormData) => locationTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.lists() });
      toast.success('Location type created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create location type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateLocationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LocationTypeFormData }) =>
      locationTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.lists() });
      toast.success('Location type updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update location type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteLocationType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => locationTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.lists() });
      toast.success('Location type deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete location type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}