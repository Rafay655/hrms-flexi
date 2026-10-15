// services/bank-files.ts

import { api } from "@/lib/api";
import type { BankFilesResponse, BankFileDetail } from "@/types/bank-file";

export async function fetchBankFiles(
  page: number,
  perPage: number
): Promise<BankFilesResponse> {
  const { data } = await api.get("/pay-edge/bank-files", {
    params: { page, per_page: perPage },
  });
  return data;
}

export async function fetchBankFileDetail(
  bankFileId: string
): Promise<BankFileDetail> {
  const { data } = await api.get(
    `/pay-edge/bank-files/${bankFileId}/download`
  );
  return data.data;
}

export async function downloadBankFile(bankFileId: string): Promise<Blob> {
  const response = await api.get(`/pay-edge/bank-files/${bankFileId}/serve`, {
    responseType: "blob",
  });
  return response.data;
}