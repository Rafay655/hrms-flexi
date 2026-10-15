import { showApiError } from "@/lib/error-toast";
import { useEffect, useState } from "react";

import type { Template, TemplateFormData } from "@/types/templates";
import {
  fetchTemplates,
  fetchTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  resetTemplate,
  testTemplate,
} from "@/services/templateService";

export function useTemplates(page: number, search: string, perPage: number, filters?: any) {
  const [data, setData] = useState<{ data: Template[]; meta: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchTemplates(page, search, perPage, filters)
      .then((res) => setData(res))
      .catch((apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to load templates" }))
      .finally(() => setIsLoading(false));
  }, [page, search, perPage, filters?.module, filters?.channel, filters?.is_active]);

  return { data, isLoading };
}

export function useTemplate(uuid: string) {
  const [data, setData] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    setIsLoading(true);
    fetchTemplate(uuid)
      .then((res) => setData(res.data))
      .catch((apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to load template" }))
      .finally(() => setIsLoading(false));
  }, [uuid]);

  return { data, isLoading };
}

export function useCreateTemplate() {
  const [isPending, setIsPending] = useState(false);
  const mutate = (data: TemplateFormData): Promise<any> => {
    setIsPending(true);
    return createTemplate(data).finally(() => setIsPending(false));
  };
  return { mutate, isPending };
}

export function useUpdateTemplate() {
  const [isPending, setIsPending] = useState(false);
  const mutate = (uuid: string, data: TemplateFormData): Promise<any> => {
    setIsPending(true);
    return updateTemplate(uuid, data).finally(() => setIsPending(false));
  };
  return { mutate, isPending };
}

export function useDeleteTemplate() {
  const [isPending, setIsPending] = useState(false);
  const mutate = (uuid: string): Promise<void> => {
    setIsPending(true);
    return deleteTemplate(uuid).finally(() => setIsPending(false));
  };
  return { mutate, isPending };
}

export function useResetTemplate() {
  const [isPending, setIsPending] = useState(false);
  const mutate = (uuid: string): Promise<void> => {
    setIsPending(true);
    return resetTemplate(uuid).finally(() => setIsPending(false));
  };
  return { mutate, isPending };
}

export function useTestTemplate() {
  const [isPending, setIsPending] = useState(false);
  const mutate = (uuid: string, recipientEmail: string): Promise<void> => {
    setIsPending(true);
    return testTemplate(uuid, recipientEmail).finally(() => setIsPending(false));
  };
  return { mutate, isPending };
}