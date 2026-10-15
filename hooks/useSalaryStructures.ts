import { showApiError } from "@/lib/error-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryStructureService } from '@/services/salary-structure.service';
import toast from 'react-hot-toast';
import type {
  SalaryStructureFormData,
  SalaryStructureComponentFormData
  , SimulationRequest, SimulationResponse
} from '@/types/salary-structure';

export const salaryStructureKeys = {
  all: ['salary-structures'] as const,
  lists: () => [...salaryStructureKeys.all, 'list'] as const,
  list: (params: any) => [...salaryStructureKeys.lists(), params] as const,
  details: () => [...salaryStructureKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...salaryStructureKeys.details(), uuid] as const,
};

export function useSalaryStructures(params?: { page?: number; per_page?: number; search?: string }) {
  return useQuery({
    queryKey: salaryStructureKeys.list(params || {}),
    queryFn: () => salaryStructureService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

export function useSalaryStructureDetail(uuid: string | undefined) {
  return useQuery({
    queryKey: salaryStructureKeys.detail(uuid || ''),
    queryFn: () => salaryStructureService.getById(uuid!),
    enabled: !!uuid,
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SalaryStructureFormData) => salaryStructureService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.lists() });
      toast.success('Salary structure created');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to create' }),
  });
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: SalaryStructureFormData }) =>
      salaryStructureService.update(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.lists() });
      toast.success('Salary structure updated');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to update' }),
  });
}

export function useDeleteSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => salaryStructureService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.lists() });
      toast.success('Salary structure deleted');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to delete' }),
  });
}

// ── Component creation ────────────────────────────────────
export function useCreateSalaryStructureComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      structureUuid,
      data,
    }: {
      structureUuid: string;
      data: SalaryStructureComponentFormData;
    }) => salaryStructureService.createComponent(structureUuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.details() });
      toast.success('Component added');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to add component' }),
  });
}

// ── Simulation (updated to use gross_salary) ───────────────
export function useSimulateSalaryStructure() {
  return useMutation<SimulationResponse, Error, { uuid: string; gross_salary: number }>({
    mutationFn: (variables) =>
      salaryStructureService.simulate({
        uuid: variables.uuid,
        gross_salary: variables.gross_salary,
      } as SimulationRequest),
    onError: (error) => {
      showApiError(error, { fallbackMessage: error.message || 'Simulation failed' });
    },
  });
}

export function useCloneSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, new_name }: { uuid: string; new_name: string }) =>
      salaryStructureService.clone(uuid, new_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryStructureKeys.lists() });
      toast.success('Salary structure cloned');
    },
    onError: (error: any) => showApiError(error, { fallbackMessage: error.response?.data?.message || 'Failed to clone' }),
  });
}