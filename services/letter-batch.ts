import { api } from "@/lib/api";
import { normalizeLetterList } from "@/lib/letter-forge-contract";
import type { ApiEnvelope } from "@/types/letter-forge";
import type { CreateLetterBatchPayload, LetterBatch, LetterBatchFilters } from "@/types/letter-batch";
const base = "/letter-forge/letter-batches";

export async function getLetterBatches(filters: LetterBatchFilters, signal?: AbortSignal): Promise<ApiEnvelope<LetterBatch[]>> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== undefined));
  const { data } = await api.get<ApiEnvelope<unknown>>(base, { params, signal });
  return normalizeLetterList<LetterBatch>(data);
}
export async function getLetterBatch(uuid: string, signal?: AbortSignal): Promise<ApiEnvelope<LetterBatch>> {
  const { data } = await api.get<ApiEnvelope<LetterBatch>>(`${base}/${uuid}`, { signal }); return data;
}
export async function createLetterBatch(payload: CreateLetterBatchPayload): Promise<ApiEnvelope<LetterBatch>> {
  const employee_ids = [...new Set(payload.employee_ids)];
  if (!employee_ids.length || employee_ids.length > 500 || employee_ids.some((id) => !Number.isSafeInteger(id) || id < 1)) throw new Error("Select between 1 and 500 employees with valid numeric IDs.");
  if (!payload.template_key || !payload.idempotency_key || payload.idempotency_key.length > 100) throw new Error("Template and a valid idempotency key are required.");
  const { data } = await api.post<ApiEnvelope<LetterBatch>>(base, { template_key: payload.template_key, employee_ids, dry_run: true, idempotency_key: payload.idempotency_key }); return data;
}
export async function commitLetterBatch(uuid: string): Promise<ApiEnvelope<LetterBatch>> {
  const { data } = await api.post<ApiEnvelope<LetterBatch>>(`${base}/${uuid}/commit`); return data;
}
export async function retryFailedLetterBatch(uuid: string): Promise<ApiEnvelope<LetterBatch>> {
  const { data } = await api.post<ApiEnvelope<LetterBatch>>(`${base}/${uuid}/retry-failed`); return data;
}
