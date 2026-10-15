import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentCategoryService } from '@/services/document-category.service';
import toast from 'react-hot-toast';
import type { DocumentCategoryFormData } from '@/types/document-category';

export const documentCategoryKeys = {
  all: ['document-categories'] as const,
  lists: () => [...documentCategoryKeys.all, 'list'] as const,
  list: (params: any) => [...documentCategoryKeys.lists(), params] as const,
};

export function useDocumentCategories(params?: { search?: string }) {
  return useQuery({
    queryKey: documentCategoryKeys.list(params || {}),
    queryFn: () => documentCategoryService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDocumentCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DocumentCategoryFormData) => documentCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.lists() });
      toast.success('Document category created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create category';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateDocumentCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: DocumentCategoryFormData }) =>
      documentCategoryService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.lists() });
      toast.success('Document category updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update category';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteDocumentCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => documentCategoryService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.lists() });
      toast.success('Document category deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete category';
      showApiError(error, { fallbackMessage: message });
    },
  });
}