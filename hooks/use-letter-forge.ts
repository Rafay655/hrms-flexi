"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import {
  activateLetterTemplate,
  deactivateLetterTemplate,
  previewLetterTemplate,
  createLetterTemplate,
  deleteLetterTemplate,
  getLetterTemplate,
  getLetterTemplates,
  updateLetterTemplate,
  getTemplateVersions, publishTemplate, submitTemplateReview, reviewTemplate, retireTemplateVersion, generateLetter,
} from "@/services/letter-forge";
import type {
  CreateLetterTemplatePayload,
  LetterTemplateFilters,
  UpdateLetterTemplatePayload,
  ReviewTemplatePayload,
} from "@/types/letter-forge";


export const letterTemplateKeys = {
  all: ["letter-forge", "templates"] as const,
  list: (filters: LetterTemplateFilters) =>
    [...letterTemplateKeys.all, "list", filters] as const,
  detail: (uuid: string) =>
    [...letterTemplateKeys.all, "detail", uuid] as const,
};

export function useLetterTemplates(filters: LetterTemplateFilters) {
  return useQuery({
    queryKey: letterTemplateKeys.list(filters),
    queryFn: ({ signal }) => getLetterTemplates(filters, signal),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useLetterTemplate(uuid: string | null) {
  return useQuery({
    queryKey: uuid
      ? letterTemplateKeys.detail(uuid)
      : (["letter-forge", "templates", "detail", "none"] as const),
    queryFn: () => getLetterTemplate(uuid as string),
    enabled: Boolean(uuid),
  });
}

export function useCreateLetterTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLetterTemplatePayload) => createLetterTemplate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: letterTemplateKeys.all }),
  });
}

export function useUpdateLetterTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateLetterTemplatePayload }) =>
      updateLetterTemplate(uuid, payload),
    onSuccess: (_data, { uuid }) => {
      qc.invalidateQueries({ queryKey: letterTemplateKeys.all });
      qc.invalidateQueries({ queryKey: letterTemplateKeys.detail(uuid) });
    },
  });
}

export function useDeleteLetterTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => deleteLetterTemplate(uuid),
    retry: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: letterTemplateKeys.all }),
  });
}

export function usePreviewLetterTemplate(uuid: string | null, versionId?: number) {
  // A query keeps the observer attached across Strict Mode's effect replay.
  // This endpoint uses POST, but only renders the saved template.
  return useQuery({
    queryKey: [...letterTemplateKeys.all, "preview", uuid, versionId],
    queryFn: () => previewLetterTemplate(uuid!, versionId),
    enabled: Boolean(uuid),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useActivateLetterTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activateLetterTemplate,
    retry: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: letterTemplateKeys.all }),
  });
}

export function useDeactivateLetterTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateLetterTemplate,
    retry: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: letterTemplateKeys.all }),
  });
}

export function useLetterAccess() {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const roles = useAppSelector((state) => state.auth.roles);
  const can = (permission: string) => roles.includes("super_admin") || permissions.includes(permission);

  return {
    can,
    permissions,
    canViewTemplates: can("view-letter-templates"),
    canManageTemplates: can("manage-letter-templates"),
    canGenerateLetters: can("generate-letters"),
    canManageLetters: can("manage-letters"),
  };
}

export function useTemplateVersions(uuid: string) {
  return useQuery({
    queryKey: [...letterTemplateKeys.all, "versions", uuid],
    queryFn: ({ signal }) => getTemplateVersions(uuid, signal),
    enabled: Boolean(uuid),
  });
}

export function useTemplatePublishing(uuid: string) {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: letterTemplateKeys.all });
  const publish = useMutation({ mutationFn: () => publishTemplate(uuid), retry: false, onSuccess });
  const submit = useMutation({ mutationFn: () => submitTemplateReview(uuid), retry: false, onSuccess });
  const review = useMutation({ mutationFn: (payload: ReviewTemplatePayload) => reviewTemplate(uuid, payload), retry: false, onSuccess });
  const retire = useMutation({ mutationFn: (versionId: number) => retireTemplateVersion(uuid, versionId), retry: false, onSuccess });
  return { publish, submit, review, retire };
}

export function useGenerateLetter() {
  const client = useQueryClient();
  return useMutation({ mutationFn: generateLetter, retry: false, onSuccess: () => client.invalidateQueries({ queryKey: ["letter-forge", "letters"] }) });
}
