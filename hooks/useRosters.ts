import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rosterService } from '@/services/roster.service';
import toast from 'react-hot-toast';
import type { RosterFormData } from '@/types/roster';

export const rosterKeys = {
  all: ['roster'] as const,
  lists: () => [...rosterKeys.all, 'list'] as const,
  list: (params: any) => [...rosterKeys.lists(), params] as const,
};

export function useRosters(params?: {
  page?: number;
  per_page?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
  employee_id?: string;
}) {
  return useQuery({
    queryKey: rosterKeys.list(params || {}),
    queryFn: () => rosterService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RosterFormData) => rosterService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rosterKeys.lists() });
      toast.success('Roster assignment created');
    },
    onError: (error: any) =>
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}

export function useUpdateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: RosterFormData }) =>
      rosterService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rosterKeys.lists() });
      toast.success('Roster assignment updated');
    },
    onError: (error: any) =>
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update' }),
  });
}

export function useDeleteRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => rosterService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rosterKeys.lists() });
      toast.success('Roster assignment deleted');
    },
    onError: (error: any) =>
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete' }),
  });
}

export function usePublishRosters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => rosterService.publish(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rosterKeys.lists() });
      toast.success('Selected rosters published');
    },
    onError: (error: any) =>
      showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to publish' }),
  });
}