"use client";

import { showApiError } from "@/lib/error-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type { AxiosError } from "axios";

import {
  createComplianceRequirement,
  deleteComplianceRequirement,
  getComplianceRequirement,
  getComplianceRequirements,
  updateComplianceRequirement,
  type ComplianceRequirement,
  type ComplianceRequirementPayload,
  type ListComplianceParams,
} from "@/services/compliance-requirements.service";

// ── Query keys ────────────────────────────────────────────────────────────────

export const complianceKeys = {
  all: ["dms", "compliance-requirements"] as const,
  list: (params?: ListComplianceParams) =>
    [...complianceKeys.all, "list", params ?? {}] as const,
  detail: (uuid: string) => [...complianceKeys.all, "detail", uuid] as const,
};

// ── LIST ──────────────────────────────────────────────────────────────────────

export function useComplianceRequirements(params?: ListComplianceParams) {
  return useQuery({
    queryKey: complianceKeys.list(params),
    queryFn: () => getComplianceRequirements(params),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

// ── DETAIL ────────────────────────────────────────────────────────────────────

export function useComplianceRequirement(uuid: string, enabled = true) {
  return useQuery({
    queryKey: complianceKeys.detail(uuid),
    queryFn: () => getComplianceRequirement(uuid),
    enabled: Boolean(uuid) && enabled,
  });
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export function useCreateComplianceRequirement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ComplianceRequirementPayload) =>
      createComplianceRequirement(payload),
    onSuccess: () => {
      toast.success("Compliance requirement created.");
      qc.invalidateQueries({ queryKey: complianceKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Failed to create requirement." });
    },
  });
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export function useUpdateComplianceRequirement(uuid: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<ComplianceRequirementPayload>) =>
      updateComplianceRequirement(uuid, payload),
    onSuccess: (doc) => {
      toast.success("Requirement updated.");
      qc.setQueryData(complianceKeys.detail(uuid), doc);
      qc.invalidateQueries({ queryKey: complianceKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Update failed." });
    },
  });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export function useDeleteComplianceRequirement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteComplianceRequirement(uuid),
    onSuccess: () => {
      toast.success("Requirement deleted.");
      qc.invalidateQueries({ queryKey: complianceKeys.all });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      showApiError(err, { fallbackMessage: err.response?.data?.message ?? "Delete failed." });
    },
  });
}