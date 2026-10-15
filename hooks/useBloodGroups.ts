import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bloodGroupService } from '@/services/blood-group.service';
import toast from 'react-hot-toast';
import type { BloodGroupFormData } from '@/types/blood-group';

export const bloodGroupKeys = {
  all: ['blood-groups'] as const,
  lists: () => [...bloodGroupKeys.all, 'list'] as const,
  list: (params: any) => [...bloodGroupKeys.lists(), params] as const,
};

export function useBloodGroups(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: bloodGroupKeys.list(params || {}),
    queryFn: () => bloodGroupService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateBloodGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BloodGroupFormData) => bloodGroupService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bloodGroupKeys.lists() });
      toast.success('Blood group created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create blood group';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateBloodGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BloodGroupFormData }) =>
      bloodGroupService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bloodGroupKeys.lists() });
      toast.success('Blood group updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update blood group';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteBloodGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => bloodGroupService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bloodGroupKeys.lists() });
      toast.success('Blood group deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete blood group';
      showApiError(error, { fallbackMessage: message });
    },
  });
}