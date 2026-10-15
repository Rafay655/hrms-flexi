import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeTypeService } from '@/services/employee-type.service';
import toast from 'react-hot-toast';
import type { EmployeeTypeFormData } from '@/types/employee-type';

export const employeeTypeKeys = {
  all: ['employee-types'] as const,
  lists: () => [...employeeTypeKeys.all, 'list'] as const,
  list: (params: any) => [...employeeTypeKeys.lists(), params] as const,
};

export function useEmployeeTypes(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: employeeTypeKeys.list(params || {}),
    queryFn: () => employeeTypeService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateEmployeeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmployeeTypeFormData) => employeeTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeTypeKeys.lists() });
      toast.success('Employee type created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create employee type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateEmployeeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeTypeFormData }) =>
      employeeTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeTypeKeys.lists() });
      toast.success('Employee type updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update employee type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteEmployeeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeeTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeTypeKeys.lists() });
      toast.success('Employee type deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete employee type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}