import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costCenterService } from '@/services/cost-center.service';
import toast from 'react-hot-toast';
import type { CostCenterFormData } from '@/types/cost-center';

export const costCenterKeys = {
  all: ['cost-centers'] as const,
  lists: () => [...costCenterKeys.all, 'list'] as const,
  list: (params: any) => [...costCenterKeys.lists(), params] as const,
};

export function useCostCenters(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: costCenterKeys.list(params || {}),
    queryFn: () => costCenterService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CostCenterFormData) => costCenterService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.lists() });
      toast.success('Cost center created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create cost center';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CostCenterFormData }) =>
      costCenterService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.lists() });
      toast.success('Cost center updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update cost center';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => costCenterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.lists() });
      toast.success('Cost center deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete cost center';
      showApiError(error, { fallbackMessage: message });
    },
  });
}