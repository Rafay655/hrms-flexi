import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { divisionService } from '@/services/division.service';
import toast from 'react-hot-toast';
import type { DivisionFormData } from '@/types/division';

export const divisionKeys = {
  all: ['divisions'] as const,
  lists: () => [...divisionKeys.all, 'list'] as const,
  list: (params: any) => [...divisionKeys.lists(), params] as const,
};

export function useDivisions(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: divisionKeys.list(params || {}),
    queryFn: () => divisionService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DivisionFormData) => divisionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: divisionKeys.lists() });
      toast.success('Division created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create division';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DivisionFormData }) =>
      divisionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: divisionKeys.lists() });
      toast.success('Division updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update division';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => divisionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: divisionKeys.lists() });
      toast.success('Division deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete division';
      showApiError(error, { fallbackMessage: message });
    },
  });
}