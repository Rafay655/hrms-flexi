import { api } from "@/lib/api";
import { parseApiError } from "@/lib/api-error";
import { normalizeLetterList } from "@/lib/letter-forge-contract";
import type { ApiEnvelope } from "@/types/letter-forge";
import type { CorrectionPayload, DispatchChannel, LetterDashboard, LetterFilters, LetterRecord } from "@/types/generated-letters";

const root = "/letter-forge/letters";
export async function approveLetter(uuid: string) {
  return (await api.post<ApiEnvelope<LetterRecord>>(`${root}/${uuid}/approve`)).data;
}
export async function rejectLetter(uuid: string, rejection_reason: string) {
  if (!rejection_reason.trim() || rejection_reason.length > 1000) throw new Error("Enter a rejection reason of 1–1,000 characters.");
  return (await api.post<ApiEnvelope<LetterRecord>>(`${root}/${uuid}/reject`, { rejection_reason })).data;
}
export async function getGeneratedLetters(filters: LetterFilters, signal?: AbortSignal) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== undefined));
  const { data } = await api.get<ApiEnvelope<unknown>>(root, { params, signal });
  return normalizeLetterList<LetterRecord>(data);
}
export async function getGeneratedLetter(uuid: string, signal?: AbortSignal) {
  return (await api.get<ApiEnvelope<LetterRecord>>(`${root}/${uuid}`, { signal })).data;
}
export async function getLetterDashboard(signal?: AbortSignal, month?: string) {
  return (await api.get<ApiEnvelope<LetterDashboard>>("/letter-forge/dashboard", { signal, params: month ? { month } : undefined })).data;
}
export function validateCorrection(payload: CorrectionPayload) {
  if (payload.reason.trim().length < 10 || payload.reason.length > 1000) throw new Error("Enter a reason of 10–1,000 characters.");
  if (payload.extra_data && Object.keys(payload.extra_data).length > 50) throw new Error("Use at most 50 replacement values.");
  return payload; // Preserve the user's reason verbatim for the audit record.
}
export async function dispatchLetter(uuid: string, channel: DispatchChannel) {
  return (await api.post<ApiEnvelope<LetterRecord>>(`${root}/${uuid}/dispatch`, { channel })).data;
}
export async function remindLetter(uuid: string) {
  return (await api.post<ApiEnvelope<{ message: string }>>(`${root}/${uuid}/remind`)).data;
}
export async function revokeLetter(uuid: string, reason: string) {
  return (await api.post<ApiEnvelope<LetterRecord>>(`${root}/${uuid}/revoke`, validateCorrection({ reason }))).data;
}
export async function supersedeLetter(uuid: string, payload: CorrectionPayload) {
  return (await api.post<ApiEnvelope<LetterRecord>>(`${root}/${uuid}/supersede`, validateCorrection(payload))).data;
}
export async function downloadLetter(uuid: string, filename: string) {
  let blob: Blob;
  try {
    blob = (await api.get<Blob>(`${root}/${uuid}/download`, { responseType: "blob" })).data;
  } catch (error) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (response?.data instanceof Blob) {
      try { response.data = JSON.parse(await response.data.text()); } catch { /* Preserve the original HTTP error. */ }
    }
    // Retain status, code and request ID when exposing a readable download error.
    throw Object.assign(new Error(parseApiError(error).message), error);
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/[\\/:*?"<>|]/g, "-");
  document.body.appendChild(anchor);
  try { anchor.click(); } finally {
    anchor.remove();
    // Allow the browser to consume the download before releasing the object URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
