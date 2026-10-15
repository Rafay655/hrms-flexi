import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regularizationService } from '@/services/regularization.service';
import toast from 'react-hot-toast';
import type { RegularizationFormData } from '@/types/regularization';

export const regularizationKeys = {
  all: ['regularizations'] as const,
  my: (params: any) => [...regularizationKeys.all, 'my', params] as const,
  team: (params: any) => [...regularizationKeys.all, 'team', params] as const,
};

export function useMyRegularizations(params: any) {
  return useQuery({
    queryKey: regularizationKeys.my(params),
    queryFn: () => regularizationService.getMyRegularizations(params),
    placeholderData: (prev) => prev,
  });
}

export function useRegularizations(params: any) {
  return useQuery({
    queryKey: regularizationKeys.team(params),
    queryFn: () => regularizationService.getAllRegularizations(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRegularization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegularizationFormData) => regularizationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regularizationKeys.all });
      toast.success('Regularization request submitted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to submit' }),
  });
}