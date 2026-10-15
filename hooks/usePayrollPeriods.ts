// hooks/usePayrollPeriods.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPayrollPeriods,
  fetchPayrollPeriodById,
  createPayrollPeriod,
  updatePayrollPeriod,
} from "@/services/payroll-period.service";
import type { PeriodFormPayload, PayrollPeriod } from "@/types/payroll-period";

export function usePayrollPeriodsList(page: number, perPage: number) {
  return useQuery({
    queryKey: ["payroll-periods", { page, perPage }],
    queryFn: () => fetchPayrollPeriods(page, perPage),
    staleTime: 60_000,
  });
}

export function usePayrollPeriodDetail(uuid: string | null) {
  return useQuery({
    queryKey: ["payroll-period", uuid],
    queryFn: () => fetchPayrollPeriodById(uuid!),
    enabled: !!uuid,
    staleTime: 0,
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PeriodFormPayload) => createPayrollPeriod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
    },
  });
}

export function useUpdatePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: PeriodFormPayload }) =>
      updatePayrollPeriod(uuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
    },
  });
}