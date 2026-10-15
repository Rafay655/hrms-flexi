// hooks/usePayrollWorkflows.ts

import { useQuery } from "@tanstack/react-query";
import { fetchPayrollWorkflows } from "@/services/payroll-workflows";

export function usePayrollWorkflowsList(page: number, perPage: number) {
  return useQuery({
    queryKey: ["payroll-workflows", { page, perPage }],
    queryFn: () => fetchPayrollWorkflows(page, perPage),
    staleTime: 60_000,
  });
}