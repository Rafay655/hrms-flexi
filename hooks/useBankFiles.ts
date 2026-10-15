// hooks/useBankFiles.ts

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchBankFiles,
  fetchBankFileDetail,
  downloadBankFile,
} from "@/services/bank-files";

export function useBankFilesList(page: number, perPage: number) {
  return useQuery({
    queryKey: ["bank-files", { page, perPage }],
    queryFn: () => fetchBankFiles(page, perPage),
    staleTime: 60_000,
  });
}

export function useBankFileDetail(bankFileId: string | null) {
  return useQuery({
    queryKey: ["bank-file-detail", bankFileId],
    queryFn: () => fetchBankFileDetail(bankFileId!),
    enabled: !!bankFileId,
  });
}

// We don't need a mutation for download; we'll handle it directly in the component.