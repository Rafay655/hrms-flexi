"use client";

import { showApiError } from "@/lib/error-toast";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type { AxiosError } from "axios";

import {
  deleteDocument,
  fetchDocumentBlob,
  getDocument,
  getDocuments,
  getDocumentDownloadUrl,
  getDocumentVersions,
  rollbackDocumentVersion,
  shareDocument,
  transitionDocument,
  updateDocument,
  uploadDocument,
  uploadDocumentVersion,
  verifyDocument,
  type DmsDocument,
  type DocumentVersion,
  type ListDocumentsParams,
  type ShareDocumentPayload,
  type TransitionStatus,
  type UpdateDocumentPayload,
  type UploadDocumentPayload,

} from "@/services/dms-documents.service";

// ── Query keys ────────────────────────────────────────────────────────────────

export const dmsDocumentKeys = {
  all: ["dms", "documents"] as const,
  list: (params?: ListDocumentsParams) =>
    [...dmsDocumentKeys.all, "list", params ?? {}] as const,
  detail: (uuid: string) => [...dmsDocumentKeys.all, "detail", uuid] as const,
};

export const dmsVersionKeys = {
  all: ["dms", "versions"] as const,
  list: (uuid: string) => [...dmsVersionKeys.all, uuid] as const,
};

// ── LIST ──────────────────────────────────────────────────────────────────────

export function useDmsDocuments(params?: ListDocumentsParams) {
  return useQuery({
    queryKey: dmsDocumentKeys.list(params),
    queryFn: () => getDocuments(params),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

// ── DETAIL ────────────────────────────────────────────────────────────────────

export function useDmsDocument(uuid: string, enabled = true) {
  return useQuery({
    queryKey: dmsDocumentKeys.detail(uuid),
    queryFn: () => getDocument(uuid),
    enabled: Boolean(uuid) && enabled,
  });
}

// ── UPLOAD ────────────────────────────────────────────────────────────────────

export function useUploadDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      onProgress,
    }: {
      payload: UploadDocumentPayload;
      onProgress?: (pct: number) => void;
    }) => uploadDocument(payload, onProgress),
    onSuccess: () => {
      toast.success("Document uploaded successfully.");
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Upload failed." });
    },
  });
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export function useUpdateDocument(uuid: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDocumentPayload) =>
      updateDocument(uuid, payload),
    onSuccess: (doc) => {
      toast.success("Document updated.");
      qc.setQueryData(dmsDocumentKeys.detail(uuid), doc);
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Update failed." });
    },
  });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export function useDeleteDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteDocument(uuid),
    onSuccess: () => {
      toast.success("Document deleted.");
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Delete failed." });
    },
  });
}

// ── VERSIONS LIST ─────────────────────────────────────────────────────────────

export function useDocumentVersions(uuid: string, enabled = true) {
  return useQuery({
    queryKey: dmsVersionKeys.list(uuid),
    queryFn: () => getDocumentVersions(uuid),
    enabled: Boolean(uuid) && enabled,
  });
}

// ── UPLOAD VERSION ────────────────────────────────────────────────────────────

export function useUploadDocumentVersion(uuid: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      changeNote,
      onProgress,
    }: {
      file: File;
      changeNote?: string;
      onProgress?: (pct: number) => void;
    }) => uploadDocumentVersion(uuid, file, changeNote, onProgress),
    onSuccess: () => {
      toast.success("New version uploaded.");
      qc.invalidateQueries({ queryKey: dmsVersionKeys.list(uuid) });
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.detail(uuid) });
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to upload version." });
    },
  });
}

// ── TRANSITION ────────────────────────────────────────────────────────────────

export function useTransitionDocument(uuid: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      status,
      note,
    }: {
      status: TransitionStatus;
      note?: string;
    }) => transitionDocument(uuid, status, note),
    onSuccess: () => {
      toast.success("Status updated.");
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.detail(uuid) });
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to change status." });
    },
  });
}

// ── VERIFY ────────────────────────────────────────────────────────────────────

export function useVerifyDocument(uuid: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ note }: { note?: string }) => verifyDocument(uuid, note),
    onSuccess: () => {
      toast.success("Document verified.");
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.detail(uuid) });
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to verify document." });
    },
  });
}

// ── ROLLBACK ──────────────────────────────────────────────────────────────────

export function useRollbackDocumentVersion(uuid: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ version }: { version: number }) =>
      rollbackDocumentVersion(uuid, version),
    onSuccess: (_data, vars) => {
      toast.success(`Rolled back to version ${vars.version}.`);
      qc.invalidateQueries({ queryKey: dmsVersionKeys.list(uuid) });
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.detail(uuid) });
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to rollback." });
    },
  });
}

// ── DOWNLOAD ──────────────────────────────────────────────────────────────────

export function useDownloadDocument() {
  const [downloadingUuid, setDownloadingUuid] = React.useState<string | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: async ({
      uuid,
      filename,
    }: {
      uuid: string;
      filename?: string;
    }): Promise<void> => {
      setDownloadingUuid(uuid);
      try {
        const signedUrl = await getDocumentDownloadUrl(uuid);
        const { blob } = await fetchDocumentBlob(signedUrl);

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Give Safari a tick to start the download before revoking
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } finally {
        setDownloadingUuid(null);
      }
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to download the document." });
    },
  });

  return {
    ...mutation,
    downloadingUuid,
    isDownloading: (uuid: string) => downloadingUuid === uuid,
  };
}

// ── SHARE ─────────────────────────────────────────────────────────────────────

export function useShareDocument(uuid: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ShareDocumentPayload) =>
      shareDocument(uuid, payload),
    onSuccess: () => {
      toast.success("Document shared successfully.");
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.detail(uuid) });
      qc.invalidateQueries({ queryKey: dmsDocumentKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to share document." });
    },
  });
}