// services/payslips.ts

import { api } from "@/lib/api";
import type { PayslipsResponse } from "@/types/payslip";
import type { PayslipsParams } from "@/hooks/usePayslips";

export async function fetchPayslips(params: PayslipsParams): Promise<PayslipsResponse> {
  const { data } = await api.get("/pay-edge/payslips", { params });
  return data;
}

export async function servePayslip(uuid: string): Promise<Blob> {
  const response = await api.get(`/pay-edge/payslips/${uuid}/serve`, {
    responseType: "blob",
  });
  return response.data;
}

export async function downloadPayslip(uuid: string): Promise<Blob> {
  const response = await api.post(
    `/pay-edge/payslips/${uuid}/download`,
    {},
    { responseType: "blob" }
  );
  return response.data;
}