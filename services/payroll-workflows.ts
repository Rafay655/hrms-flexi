// services/payroll-workflows.ts

import { api } from "@/lib/api";
import type { PayrollWorkflowsResponse } from "@/types/payroll-workflow";

export async function fetchPayrollWorkflows(
  page: number,
  perPage: number
): Promise<PayrollWorkflowsResponse> {
  const { data } = await api.get("/pay-edge/payroll-workflows", {
    params: { page, per_page: perPage },
  });
  return data;
}