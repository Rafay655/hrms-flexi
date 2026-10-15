import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cityService } from '@/services/city.service';
import toast from 'react-hot-toast';
import type { CityFormData } from '@/types/city';

export const cityKeys = {
  all: ['cities'] as const,
  lists: () => [...cityKeys.all, 'list'] as const,
  list: (params: any) => [...cityKeys.lists(), params] as const,
};

export function useCities(params?: {
  page?: number;
  per_page?: number;
  search?: string;
    country_id?: number;
    state_id?: number;
}) {
  return useQuery({
    queryKey: cityKeys.list(params || {}),
    queryFn: () => cityService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CityFormData) => cityService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.lists() });
      toast.success('City created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create city';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CityFormData }) =>
      cityService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.lists() });
      toast.success('City updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update city';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cityService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cityKeys.lists() });
      toast.success('City deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete city';
      showApiError(error, { fallbackMessage: message });
    },
  });
}