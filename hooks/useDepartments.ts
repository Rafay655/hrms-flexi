import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/department.service';
import toast from 'react-hot-toast';
import type { DepartmentFormData } from '@/types/department';

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (params: any) => [...departmentKeys.lists(), params] as const,
};

export function useDepartments(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: departmentKeys.list(params || {}),
    queryFn: () => departmentService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepartmentFormData) => departmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success('Department created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create department';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DepartmentFormData }) =>
      departmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success('Department updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update department';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => departmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success('Department deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete department';
      showApiError(error, { fallbackMessage: message });
    },
  });
}