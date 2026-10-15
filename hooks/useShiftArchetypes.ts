import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftArchetypeService } from '@/services/shift-archetype.service';
import toast from 'react-hot-toast';
import type { ShiftArchetypeFormData } from '@/types/shift-archetype';

export const shiftArchetypeKeys = {
  all: ['shift-archetypes'] as const,
  lists: () => [...shiftArchetypeKeys.all, 'list'] as const,
  list: (params: any) => [...shiftArchetypeKeys.lists(), params] as const,
};

export function useShiftArchetypes(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: number;
}) {
  return useQuery({
    queryKey: shiftArchetypeKeys.list(params || {}),
    queryFn: () => shiftArchetypeService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateShiftArchetype() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShiftArchetypeFormData) => shiftArchetypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftArchetypeKeys.lists() });
      toast.success('Archetype created successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create archetype' });
    },
  });
}

export function useUpdateShiftArchetype() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: ShiftArchetypeFormData }) =>
      shiftArchetypeService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftArchetypeKeys.lists() });
      toast.success('Archetype updated successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update archetype' });
    },
  });
}

export function useDeleteShiftArchetype() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => shiftArchetypeService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftArchetypeKeys.lists() });
      toast.success('Archetype deleted successfully');
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete archetype' });
    },
  });
}