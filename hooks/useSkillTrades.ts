import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillTradeService } from '@/services/skill-trade.service';
import toast from 'react-hot-toast';
import type { SkillTradeFormData } from '@/types/skill-trade';

export const skillTradeKeys = {
  all: ['skill-trades'] as const,
  lists: () => [...skillTradeKeys.all, 'list'] as const,
  list: (params: any) => [...skillTradeKeys.lists(), params] as const,
};

export function useSkillTrades(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: skillTradeKeys.list(params || {}),
    queryFn: () => skillTradeService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateSkillTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SkillTradeFormData) => skillTradeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillTradeKeys.lists() });
      toast.success('Skill trade created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create skill trade';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useUpdateSkillTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SkillTradeFormData }) =>
      skillTradeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillTradeKeys.lists() });
      toast.success('Skill trade updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update skill trade';
      showApiError(error, { fallbackMessage: message });
    },
  });
}

export function useDeleteSkillTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => skillTradeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillTradeKeys.lists() });
      toast.success('Skill trade deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete skill trade';
      showApiError(error, { fallbackMessage: message });
    },
  });
}