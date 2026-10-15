import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designationService } from '@/services/designation.service';
import toast from 'react-hot-toast';
import type { DesignationFormData } from '@/types/designation';

export const designationKeys = {
  all: ['designations'] as const,
  lists: () => [...designationKeys.all, 'list'] as const,
  list: (params: any) => [...designationKeys.lists(), params] as const,
};

export function useDesignations(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: designationKeys.list(params || {}),
    queryFn: () => designationService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DesignationFormData) => designationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationKeys.lists() });
      toast.success('Designation created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create designation';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DesignationFormData }) =>
      designationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationKeys.lists() });
      toast.success('Designation updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update designation';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => designationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designationKeys.lists() });
      toast.success('Designation deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete designation';
      showApiError(error, { fallbackMessage: message });
    },
  });
}