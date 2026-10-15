"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLetterBatches, getLetterBatch, createLetterBatch, commitLetterBatch, retryFailedLetterBatch } from "@/services/letter-batch";
import { employeeService } from "@/services/employee.service";
import type { LetterBatchFilters } from "@/types/letter-batch";

export const letterBatchKeys = { all: ["letter-forge", "batches"] as const, detail: (uuid: string) => ["letter-forge", "batches", "detail", uuid] as const };
export function useLetterBatches(filters: LetterBatchFilters) {
  return useQuery({ queryKey: [...letterBatchKeys.all, "list", filters], queryFn: ({ signal }) => getLetterBatches(filters, signal), placeholderData: (prev) => prev,
    refetchInterval: (query) => !query.state.error && query.state.data?.data.some((batch) => batch.status === "running") ? 8000 : false });
}
export function useLetterBatch(uuid: string) {
  return useQuery({ queryKey: letterBatchKeys.detail(uuid), queryFn: ({ signal }) => getLetterBatch(uuid, signal), enabled: Boolean(uuid), retry: false,
    refetchInterval: (query) => !query.state.error && query.state.data?.data.status === "running" && !query.state.data.data.is_terminal ? Math.min(2000 * 1.5 ** Math.max(0, query.state.dataUpdateCount - 1), 10000) : false });
}
export function useBatchEmployees() {
  return useQuery({ queryKey: ["employees", "batch-picker", { detailed: 0 }], queryFn: ({ signal }) => employeeService.getAllForBatches(signal), staleTime: 5 * 60 * 1000 });
}
export function useCreateLetterBatch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createLetterBatch, retry: false, onSuccess: async (response) => { qc.setQueryData(letterBatchKeys.detail(response.data.uuid), response); await qc.invalidateQueries({ queryKey: letterBatchKeys.all }); } });
}
export function useLetterBatchActions(uuid: string) {
  const qc = useQueryClient();
  const onSuccess = async () => { await qc.invalidateQueries({ queryKey: letterBatchKeys.all }); };
  return { commit: useMutation({ mutationFn: () => commitLetterBatch(uuid), retry: false, onSuccess }), retry: useMutation({ mutationFn: () => retryFailedLetterBatch(uuid), retry: false, onSuccess }) };
}
