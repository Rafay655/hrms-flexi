import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { genderService } from '@/services/gender.service';
import toast from 'react-hot-toast';
import type { GenderFormData } from '@/types/gender';

export const genderKeys = {
  all: ['genders'] as const,
  lists: () => [...genderKeys.all, 'list'] as const,
  list: (params: any) => [...genderKeys.lists(), params] as const,
};

export function useGenders(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: genderKeys.list(params || {}),
    queryFn: () => genderService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateGender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenderFormData) => genderService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: genderKeys.lists() });
      toast.success('Gender created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create gender';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateGender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GenderFormData }) =>
      genderService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: genderKeys.lists() });
      toast.success('Gender updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update gender';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteGender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => genderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: genderKeys.lists() });
      toast.success('Gender deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete gender';
      showApiError(error, { fallbackMessage: message });
    },
  });
}