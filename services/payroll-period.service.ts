// services/payroll-periods.ts

import { api } from "@/lib/api";
import type { PayrollPeriod, PeriodFormPayload, PayrollPeriodsResponse } from "@/types/payroll-period";

export async function fetchPayrollPeriods(page: number, perPage: number): Promise<PayrollPeriodsResponse> {
  const { data } = await api.get("/pay-edge/payroll-periods", {
    params: { page, per_page: perPage },
  });
  return data;
}

export async function fetchPayrollPeriodById(uuid: string): Promise<PayrollPeriod> {
  const { data } = await api.get(`/pay-edge/payroll-periods/${uuid}`);
  return data.data;
}

export async function createPayrollPeriod(payload: PeriodFormPayload): Promise<any> {
  const { data } = await api.post("/pay-edge/payroll-periods", payload);
  return data;
}

export async function updatePayrollPeriod(uuid: string, payload: PeriodFormPayload): Promise<any> {
  const { data } = await api.put(`/pay-edge/payroll-periods/${uuid}`, payload);
  return data;
}