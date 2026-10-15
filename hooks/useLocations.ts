import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import toast from 'react-hot-toast';
import type { LocationFormData } from '@/types/location';

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (params: any) => [...locationKeys.lists(), params] as const,
};

export function useLocations(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  location_type_id?: number;
}) {
  return useQuery({
    queryKey: locationKeys.list(params || {}),
    queryFn: () => locationService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LocationFormData) => locationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      toast.success('Location created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create location';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LocationFormData }) =>
      locationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      toast.success('Location updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update location';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => locationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      toast.success('Location deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete location';
      showApiError(error, { fallbackMessage: message });
    },
  });
}