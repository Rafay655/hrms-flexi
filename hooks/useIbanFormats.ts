import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ibanFormatService } from '@/services/iban-format.service';
import toast from 'react-hot-toast';
import type { IbanFormatFormData } from '@/types/iban-format';

export const ibanFormatKeys = {
  all: ['iban-formats'] as const,
  lists: () => [...ibanFormatKeys.all, 'list'] as const,
  list: (params: any) => [...ibanFormatKeys.lists(), params] as const,
};

export function useIbanFormats(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ibanFormatKeys.list(params || {}),
    queryFn: () => ibanFormatService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateIbanFormat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IbanFormatFormData) => ibanFormatService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ibanFormatKeys.lists() });
      toast.success('IBAN format created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create IBAN format';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateIbanFormat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IbanFormatFormData }) =>
      ibanFormatService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ibanFormatKeys.lists() });
      toast.success('IBAN format updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update IBAN format';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteIbanFormat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ibanFormatService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ibanFormatKeys.lists() });
      toast.success('IBAN format deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete IBAN format';
      showApiError(error, { fallbackMessage: message });
    },
  });
}