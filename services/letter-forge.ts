import { parseApiError } from "@/lib/api-error";
import { api } from "@/lib/api";
import type {
  ApiEnvelope,
  CreateLetterTemplatePayload,
  LetterTemplate,
  LetterTemplateFilters,
  LetterTemplatePreview,
  UpdateLetterTemplatePayload,
  TemplateVersionHistory, ReviewTemplatePayload, TemplatePublishResult,
  GenerateLetterPayload, GenerateLetterResponse, LetterRenderStatus,
} from "@/types/letter-forge";

function cleanFilters(filters: LetterTemplateFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  (Object.keys(filters) as (keyof LetterTemplateFilters)[]).forEach((k) => {
    const v = filters[k];
    if (v === "" || v === null || v === undefined) return;
    out[k] = v as string | number;
  });
  return out;
}

export async function getLetterTemplates(
  filters: LetterTemplateFilters,
  signal?: AbortSignal,
): Promise<ApiEnvelope<LetterTemplate[]>> {
  const { data } = await api.get<ApiEnvelope<LetterTemplate[]>>("/letter-forge/templates", {
    params: cleanFilters(filters),
    signal,
  });
  return data;
}

export async function getLetterTemplate(
  uuid: string,
): Promise<ApiEnvelope<LetterTemplate>> {
  const { data } = await api.get<ApiEnvelope<LetterTemplate>>(`/letter-forge/templates/${uuid}`);
  return data;
}

export async function createLetterTemplate(
  payload: CreateLetterTemplatePayload,
): Promise<ApiEnvelope<LetterTemplate>> {
  const { data } = await api.post<ApiEnvelope<LetterTemplate>>("/letter-forge/templates", payload);
  return data;
}

export async function updateLetterTemplate(
  uuid: string,
  payload: UpdateLetterTemplatePayload,
): Promise<ApiEnvelope<LetterTemplate>> {
  const { data } = await api.put<ApiEnvelope<LetterTemplate>>(
    `/letter-forge/templates/${uuid}`,
    payload,
  );
  return data;
}

export async function deleteLetterTemplate(
  uuid: string,
): Promise<ApiEnvelope<null> | undefined> {
  const { data } = await api.delete<ApiEnvelope<null> | undefined>(`/letter-forge/templates/${uuid}`);
  return data;
}

export async function previewLetterTemplate(uuid: string, versionId?: number): Promise<ApiEnvelope<LetterTemplatePreview>> {
  const { data } = versionId === undefined
    ? await api.post<ApiEnvelope<LetterTemplatePreview>>(`/letter-forge/templates/${uuid}/preview`)
    : await api.post<ApiEnvelope<LetterTemplatePreview>>(`/letter-forge/templates/${uuid}/preview`, { version_id: versionId });
  return data;
}

export async function activateLetterTemplate(uuid: string): Promise<ApiEnvelope<LetterTemplate>> {
  const { data } = await api.post<ApiEnvelope<LetterTemplate>>(`/letter-forge/templates/${uuid}/activate`);
  return data;
}

export async function deactivateLetterTemplate(uuid: string): Promise<ApiEnvelope<LetterTemplate>> {
  const { data } = await api.post<ApiEnvelope<LetterTemplate>>(`/letter-forge/templates/${uuid}/deactivate`);
  return data;
}

export const getLetterForgeError = parseApiError;

export async function getTemplateVersions(uuid: string, signal?: AbortSignal): Promise<ApiEnvelope<TemplateVersionHistory>> {
  const { data } = await api.get<ApiEnvelope<TemplateVersionHistory>>(`/letter-forge/templates/${uuid}/versions`, { signal });
  return data;
}

export async function submitTemplateReview(uuid: string): Promise<ApiEnvelope<TemplatePublishResult>> {
  const { data } = await api.post<ApiEnvelope<TemplatePublishResult>>(`/letter-forge/templates/${uuid}/submit-review`);
  return data;
}

export async function publishTemplate(uuid: string): Promise<{ routedToReview: boolean; result: ApiEnvelope<TemplatePublishResult> }> {
  try {
    const { data } = await api.post<ApiEnvelope<TemplatePublishResult>>(`/letter-forge/templates/${uuid}/publish`);
    return { routedToReview: false, result: data };
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status !== 409) throw error;
    return { routedToReview: true, result: await submitTemplateReview(uuid) };
  }
}

export async function reviewTemplate(uuid: string, payload: ReviewTemplatePayload): Promise<ApiEnvelope<TemplatePublishResult>> {
  const { data } = await api.post<ApiEnvelope<TemplatePublishResult>>(`/letter-forge/templates/${uuid}/review`, payload);
  return data;
}

export async function retireTemplateVersion(uuid: string, versionId: number): Promise<ApiEnvelope<TemplatePublishResult>> {
  const { data } = await api.post<ApiEnvelope<TemplatePublishResult>>(`/letter-forge/templates/${uuid}/versions/${versionId}/retire`);
  return data;
}

export async function generateLetter(payload: GenerateLetterPayload): Promise<GenerateLetterResponse> {
  const { data } = await api.post<GenerateLetterResponse>("/letter-forge/letters/generate", payload);
  return data;
}

export async function getLetterRenderStatus(uuid: string, signal?: AbortSignal): Promise<ApiEnvelope<LetterRenderStatus>> {
  const { data } = await api.get<ApiEnvelope<LetterRenderStatus>>(`/letter-forge/letters/${uuid}/status`, { signal, timeout: 15_000 });
  return data;
}
