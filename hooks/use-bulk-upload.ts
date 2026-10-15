"use client";

import { showApiError } from "@/lib/error-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import {
  createBulkBatch,
  getBulkBatch,
  getBulkBatches,
  processBulkBatch,
  retryBulkBatch,
  uploadBulkFiles,
  type BulkBatch,
  type CreateBulkBatchPayload,
  type ListBulkBatchesParams,
} from "@/services/bulk-upload.service";

// ── Query keys ────────────────────────────────────────────────────────────────

export const bulkUploadKeys = {
  all: ["dms", "bulk-upload"] as const,
  list: (params?: ListBulkBatchesParams) =>
    [...bulkUploadKeys.all, "list", params ?? {}] as const,
  detail: (uuid: string) => [...bulkUploadKeys.all, "detail", uuid] as const,
};

// ── List batches ──────────────────────────────────────────────────────────────

export function useBulkBatches(params?: ListBulkBatchesParams) {
  return useQuery({
    queryKey: bulkUploadKeys.list(params),
    queryFn: () => getBulkBatches(params),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

// ── Batch detail (auto-polls while processing) ────────────────────────────────

export function useBulkBatch(uuid: string, enabled = true) {
  return useQuery({
    queryKey: bulkUploadKeys.detail(uuid),
    queryFn: () => getBulkBatch(uuid),
    enabled: Boolean(uuid) && enabled,
    refetchInterval: (query) => {
      const status = (query.state.data as BulkBatch | undefined)?.status;
      return status === "processing" ? 3000 : false;
    },
  });
}

// ── Create batch ──────────────────────────────────────────────────────────────

export function useCreateBulkBatch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBulkBatchPayload) => createBulkBatch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bulkUploadKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to create batch." });
    },
  });
}

// ── Upload files ──────────────────────────────────────────────────────────────

export function useUploadBulkFiles() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      uuid,
      formData,
      onProgress,
    }: {
      uuid: string;
      formData: FormData;
      onProgress?: (pct: number) => void;
    }) => uploadBulkFiles(uuid, formData, onProgress),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: bulkUploadKeys.detail(vars.uuid) });
      qc.invalidateQueries({ queryKey: bulkUploadKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Upload failed." });
    },
  });
}

// ── Process batch ─────────────────────────────────────────────────────────────

export function useProcessBulkBatch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => processBulkBatch(uuid),
    onSuccess: (_batch, uuid) => {
      toast.success("Batch processing started.");
      qc.invalidateQueries({ queryKey: bulkUploadKeys.detail(uuid) });
      qc.invalidateQueries({ queryKey: bulkUploadKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to start processing." });
    },
  });
}

// ── Retry failed items ────────────────────────────────────────────────────────

export function useRetryBulkBatch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => retryBulkBatch(uuid),
    onSuccess: (res, uuid) => {
      toast.success(`${res.retried_count} item(s) queued for retry.`);
      qc.invalidateQueries({ queryKey: bulkUploadKeys.detail(uuid) });
      qc.invalidateQueries({ queryKey: bulkUploadKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Retry failed." });
    },
  });
}