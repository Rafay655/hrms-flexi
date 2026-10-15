import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { countryService } from '@/services/country.service';
import toast from 'react-hot-toast';
import type { CountryFormData } from '@/types/country';

export const countryKeys = {
  all: ['countries'] as const,
  lists: () => [...countryKeys.all, 'list'] as const,
  list: (params: any) => [...countryKeys.lists(), params] as const,
};

export function useCountries(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: countryKeys.list(params || {}),
    queryFn: () => countryService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CountryFormData) => countryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.lists() });
      toast.success('Country created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create country';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CountryFormData }) =>
      countryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.lists() });
      toast.success('Country updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update country';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => countryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.lists() });
      toast.success('Country deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete country';
      showApiError(error, { fallbackMessage: message });
    },
  });
}