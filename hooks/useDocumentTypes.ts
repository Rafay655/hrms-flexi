import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentTypeService } from '@/services/document-type.service';
import toast from 'react-hot-toast';
import type { DocumentTypeFormData } from '@/types/document-type';

export const documentTypeKeys = {
  all: ['document-types'] as const,
  lists: () => [...documentTypeKeys.all, 'list'] as const,
  list: (params: any) => [...documentTypeKeys.lists(), params] as const,
};

export function useDocumentTypes(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: documentTypeKeys.list(params || {}),
    queryFn: () => documentTypeService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DocumentTypeFormData) => documentTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeKeys.lists() });
      toast.success('Document type created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create document type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: DocumentTypeFormData }) =>
      documentTypeService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeKeys.lists() });
      toast.success('Document type updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update document type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => documentTypeService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeKeys.lists() });
      toast.success('Document type deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete document type';
      showApiError(error, { fallbackMessage: message });
    },
  });
}