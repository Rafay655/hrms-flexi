import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryComponentService } from '@/services/salary-component.service';
import toast from 'react-hot-toast';
import type { SalaryComponentFormData } from '@/types/salary-component';

export const salaryComponentKeys = {
  all: ['salary-components'] as const,
  lists: () => [...salaryComponentKeys.all, 'list'] as const,
  list: (params: any) => [...salaryComponentKeys.lists(), params] as const,
};

export function useSalaryComponents(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: salaryComponentKeys.list(params || {}),
    queryFn: () => salaryComponentService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateSalaryComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SalaryComponentFormData) => salaryComponentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryComponentKeys.lists() });
      toast.success('Salary component created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create salary component';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateSalaryComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SalaryComponentFormData }) =>
      salaryComponentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryComponentKeys.lists() });
      toast.success('Salary component updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update salary component';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteSalaryComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => salaryComponentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryComponentKeys.lists() });
      toast.success('Salary component deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete salary component';
      showApiError(error, { fallbackMessage: message });
    },
  });
}