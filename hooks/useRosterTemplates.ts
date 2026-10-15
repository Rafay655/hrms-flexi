import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rosterTemplateService } from '@/services/roster-template.service';
import toast from 'react-hot-toast';
import type { RosterTemplateFormData } from '@/types/roster-template';

export const rosterTemplateKeys = {
  all: ['roster-templates'] as const,
  lists: () => [...rosterTemplateKeys.all, 'list'] as const,
  list: (params: any) => [...rosterTemplateKeys.lists(), params] as const,
};

export function useRosterTemplates(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  template_type?: string;
  is_active?: number;
}) {
  return useQuery({
    queryKey: rosterTemplateKeys.list(params || {}),
    queryFn: () => rosterTemplateService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRosterTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RosterTemplateFormData) => rosterTemplateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rosterTemplateKeys.lists() });
      toast.success('Template created');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create template' }),
  });
}

export function useUpdateRosterTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: RosterTemplateFormData }) =>
      rosterTemplateService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rosterTemplateKeys.lists() });
      toast.success('Template updated');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update template' }),
  });
}

export function useDeleteRosterTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => rosterTemplateService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rosterTemplateKeys.lists() });
      toast.success('Template deleted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete template' }),
  });
}