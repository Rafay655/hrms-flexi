import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dmsFolderService } from '@/services/dms-folder.service';
import toast from 'react-hot-toast';
import type { DmsFolderFormData } from '@/types/dms-folder';

export const dmsFolderKeys = {
  all: ['dms-folders'] as const,
  lists: () => [...dmsFolderKeys.all, 'list'] as const,
  list: () => [...dmsFolderKeys.lists()] as const,
};

export function useDmsFolders() {
  return useQuery({
    queryKey: dmsFolderKeys.list(),
    queryFn: dmsFolderService.getAll,
    select: (data) => data.data,
    placeholderData: (prev) => prev,
  });
}

export function useCreateDmsFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DmsFolderFormData) => dmsFolderService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmsFolderKeys.lists() });
      toast.success('Folder created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create folder';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateDmsFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: DmsFolderFormData }) =>
      dmsFolderService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmsFolderKeys.lists() });
      toast.success('Folder updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update folder';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteDmsFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => dmsFolderService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmsFolderKeys.lists() });
      toast.success('Folder deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete folder';
      showApiError(error, { fallbackMessage: message });
    },
  });
}