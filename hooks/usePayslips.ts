// hooks/usePayslips.ts

import { useQuery } from "@tanstack/react-query";
import { fetchPayslips } from "@/services/payslips";
import type { PayslipsResponse } from "@/types/payslip";

export interface PayslipsParams {
  page?: number;
  per_page?: number;
  period_year?: number;
  period_month?: number;
  employee_id?: string;
  is_emailed?: boolean;
  search?: string;
}

export interface UsePayslipsOptions {
  enabled?: boolean;
}

export function usePayslips(params: PayslipsParams, options?: UsePayslipsOptions) {
  return useQuery<PayslipsResponse, Error>({
    queryKey: ["payslips", params],
    queryFn: () => fetchPayslips(params),
    staleTime: 60_000,
    enabled: options?.enabled,
  });
}