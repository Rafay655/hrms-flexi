import type { AxiosError, AxiosProgressEvent } from "axios";
import {api} from "@/lib/api"; // ⚠️ adjust to your axios instance

// ── Types ─────────────────────────────────────────────────────────────────────

export type BulkBatchStatus = "pending" | "processing" | "completed" | "failed";
export type BulkBatchItemStatus = "pending" | "processed" | "failed";

export type AccessLevel =
  | "public"
  | "hr_only"
  | "employee_only"
  | "manager_team"
  | "finance_only";

export interface MappingConfig {
  filename_col: string;
  emp_id_col: string;
  title_col: string;
  expiry_col: string;
}

export interface BulkBatchItem {
  uuid: string;
  original_name: string;
  mapped_title: string | null;
  mapped_emp_identifier: string | null;
  employee_id: number | null;
  status: BulkBatchItemStatus;
  error_message: string | null;
  document_uuid: string | null;
  created_at: string;
}

export interface BulkBatch {
  uuid: string;
  batch_name: string;
  document_type_id: number | null;
  default_access_level: string;
  total_files: number;
  processed: number;
  failed: number;
  progress_percentage: number;
  status: BulkBatchStatus;
  created_at: string;
  completed_at: string | null;
  default_folder_id: number | null;
  /** Present only on GET /{uuid} detail response */
  items?: BulkBatchItem[];
}

export interface CreateBulkBatchPayload {
  batch_name: string;
  document_type_id: number;
  default_access_level: AccessLevel;
   default_folder_id?: number | null;   
  mapping_config?: MappingConfig;
}

export interface UploadBulkFilesResult {
  batch: BulkBatch;
  matched: number;
  unmatched: number;
}

export interface RetryBulkBatchResult {
  retried_count: number;
}

export interface ListBulkBatchesParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: BulkBatchStatus;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}



function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

function normalizeList<T>(payload: unknown): T[] {
  const raw = unwrap(payload as ApiEnvelope<unknown>);

  if (Array.isArray(raw)) return raw as T[];

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidate = obj.data ?? obj.items ?? obj.results ?? obj.batches;
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

// ── CREATE BATCH ──────────────────────────────────────────────────────────────
// POST  {{base_url}}dms/bulk-batches

export async function createBulkBatch(
  payload: CreateBulkBatchPayload,
): Promise<BulkBatch> {
  const { data } = await api.post<ApiEnvelope<BulkBatch>>(
    "/dms/bulk-batches",
    payload,
  );
  return unwrap<BulkBatch>(data);
}

// ── LIST BATCHES ──────────────────────────────────────────────────────────────
// GET  {{base_url}}dms/bulk-batches

export async function getBulkBatches(
  params?: ListBulkBatchesParams,
): Promise<BulkBatch[]> {
  const { data } = await api.get("/dms/bulk-batches", { params });
  return normalizeList<BulkBatch>(data);
}

// ── GET BATCH DETAIL ──────────────────────────────────────────────────────────
// GET  {{base_url}}dms/bulk-batches/{{batch_uuid}}

export async function getBulkBatch(uuid: string): Promise<BulkBatch> {
  const { data } = await api.get<ApiEnvelope<BulkBatch>>(
    `/dms/bulk-batches/${uuid}`,
  );
  return unwrap<BulkBatch>(data);
}

// ── UPLOAD FILES ──────────────────────────────────────────────────────────────
// POST  {{base_url}}dms/bulk-batches/{{batch_uuid}}/upload

export async function uploadBulkFiles(
  uuid: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<UploadBulkFilesResult> {
  const { data } = await api.post<ApiEnvelope<UploadBulkFilesResult>>(
    `/dms/bulk-batches/${uuid}/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    },
  );
  return unwrap<UploadBulkFilesResult>(data);
}

// ── PROCESS BATCH ─────────────────────────────────────────────────────────────
// POST  {{base_url}}dms/bulk-batches/{{batch_uuid}}/process

export async function processBulkBatch(uuid: string): Promise<BulkBatch> {
  const { data } = await api.post<ApiEnvelope<BulkBatch>>(
    `/dms/bulk-batches/${uuid}/process`,
  );
  return unwrap<BulkBatch>(data);
}

// ── RETRY FAILED ITEMS ────────────────────────────────────────────────────────
// POST  {{base_url}}dms/bulk-batches/{{batch_uuid}}/retry

export async function retryBulkBatch(
  uuid: string,
): Promise<RetryBulkBatchResult> {
  const { data } = await api.post<ApiEnvelope<RetryBulkBatchResult>>(
    `/dms/bulk-batches/${uuid}/retry`,
  );
  return unwrap<RetryBulkBatchResult>(data);
}

export type { AxiosError };