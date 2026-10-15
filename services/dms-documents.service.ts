import type { AxiosError } from "axios";
import { api } from "@/lib/api"; // ⚠️ adjust to your axios instance

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocumentStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "archived";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type AccessLevel =
  | "public"
  | "hr_only"
  | "employee_only"
  | "manager_team"
  | "finance_only";

export type TransitionStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "archived";

export interface DocumentTypeRef {
  id: number;
  name: string;
}

export interface FolderRef {
  id: number;
  name: string;
}

export interface DmsDocument {
  uuid: string;
  title: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_size_human: string;
  version: number;
  disk: string;
  status: DocumentStatus;
  access_level: AccessLevel;
  expiry_date: string | null;
  is_expired: boolean;
  verification_status: VerificationStatus;
  verified_at: string | null;
  is_encrypted: boolean;
  tags: string[];
  description: string | null;
  document_type: DocumentTypeRef | null;
  folder: FolderRef | null;
  uploaded_by: number;
  employee_id: number | null;
  company_id: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  uuid: string;
  version: number;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_size_human: string;
  change_note: string | null;
  uploaded_by: number;
  created_at: string;
}

export interface ListDocumentsParams {
  page?: number;
  per_page?: number;
  search?: string;
  document_type_id?: number;
  folder_id?: number;
  employee_id?: number;
  access_level?: AccessLevel;
  status?: DocumentStatus;
}

/** Form-data payload for POST /dms/documents */
export interface UploadDocumentPayload {
  file: File;
  title?: string;
  folder_id?: number;
  document_type_id?: number;
  employee_id?: number;
  expiry_date?: string; // Y-m-d
  description?: string;
  tags?: string[];
  access_level?: AccessLevel;
}

/** JSON payload for PUT /dms/documents/{uuid} */
export interface UpdateDocumentPayload {
  title?: string;
  folder_id?: number | null;
  document_type_id?: number | null;
  expiry_date?: string | null;
  description?: string | null;
  tags?: string[];
  access_level?: AccessLevel;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    const candidate =
      obj.data ?? obj.items ?? obj.results ?? obj.documents ?? obj.versions;
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

// ── LIST DOCUMENTS ────────────────────────────────────────────────────────────
// GET /dms/documents

export async function getDocuments(
  params?: ListDocumentsParams,
): Promise<DmsDocument[]> {
  const { data } = await api.get("/dms/documents", { params });
  return normalizeList<DmsDocument>(data);
}

// ── SHOW DOCUMENT ─────────────────────────────────────────────────────────────
// GET /dms/documents/{uuid}

export async function getDocument(uuid: string): Promise<DmsDocument> {
  const { data } = await api.get<ApiEnvelope<DmsDocument>>(
    `/dms/documents/${uuid}`,
  );
  return unwrap<DmsDocument>(data);
}

// ── UPLOAD DOCUMENT ───────────────────────────────────────────────────────────
// POST /dms/documents  (multipart/form-data)

export async function uploadDocument(
  payload: UploadDocumentPayload,
  onProgress?: (percent: number) => void,
): Promise<DmsDocument> {
  const fd = new FormData();

  fd.append("file", payload.file);
  if (payload.title) fd.append("title", payload.title);
  if (payload.folder_id != null)
    fd.append("folder_id", String(payload.folder_id));
  if (payload.document_type_id != null)
    fd.append("document_type_id", String(payload.document_type_id));
  if (payload.employee_id != null)
    fd.append("employee_id", String(payload.employee_id));
  if (payload.expiry_date) fd.append("expiry_date", payload.expiry_date);
  if (payload.description) fd.append("description", payload.description);
  if (payload.access_level) fd.append("access_level", payload.access_level);
  payload.tags?.forEach((tag) => fd.append("tags[]", tag));

  const { data } = await api.post<ApiEnvelope<DmsDocument>>(
    "/dms/documents",
    fd,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (!e.total) return;
        onProgress?.(Math.round((e.loaded * 100) / e.total));
      },
    },
  );
  return unwrap<DmsDocument>(data);
}

// ── UPDATE DOCUMENT ───────────────────────────────────────────────────────────
// PUT /dms/documents/{uuid}

export async function updateDocument(
  uuid: string,
  payload: UpdateDocumentPayload,
): Promise<DmsDocument> {
  const { data } = await api.put<ApiEnvelope<DmsDocument>>(
    `/dms/documents/${uuid}`,
    payload,
  );
  return unwrap<DmsDocument>(data);
}

// ── DELETE DOCUMENT ───────────────────────────────────────────────────────────
// DELETE /dms/documents/{uuid}

export async function deleteDocument(uuid: string): Promise<void> {
  await api.delete(`/dms/documents/${uuid}`);
}

// ── GET VERSIONS ──────────────────────────────────────────────────────────────
// GET /dms/documents/{uuid}/versions

export async function getDocumentVersions(
  uuid: string,
): Promise<DocumentVersion[]> {
  const { data } = await api.get(`/dms/documents/${uuid}/versions`);
  return normalizeList<DocumentVersion>(data);
}

// ── UPLOAD VERSION ────────────────────────────────────────────────────────────
// POST /dms/documents/{uuid}/version  (multipart)
//   file (required), change_note (optional)

export async function uploadDocumentVersion(
  uuid: string,
  file: File,
  changeNote?: string,
  onProgress?: (pct: number) => void,
): Promise<DocumentVersion> {
  const fd = new FormData();
  fd.append("file", file);
  if (changeNote) fd.append("change_note", changeNote);

  const { data } = await api.post<ApiEnvelope<DocumentVersion>>(
    `/dms/documents/${uuid}/version`,
    fd,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (!e.total) return;
        onProgress?.(Math.round((e.loaded * 100) / e.total));
      },
    },
  );
  return unwrap<DocumentVersion>(data);
}

// ── TRANSITION ────────────────────────────────────────────────────────────────
// POST /dms/documents/{uuid}/transition
//   body: { status, note? }

export async function transitionDocument(
  uuid: string,
  status: TransitionStatus,
  note?: string,
): Promise<unknown> {
  const { data } = await api.post(`/dms/documents/${uuid}/transition`, {
    status,
    note: note || null,
  });
  return unwrap<unknown>(data);
}

// ── VERIFY ────────────────────────────────────────────────────────────────────
// POST /dms/documents/{uuid}/verify
//   body: { status: "verified", note? }

export async function verifyDocument(
  uuid: string,
  note?: string,
): Promise<unknown> {
  const { data } = await api.post(`/dms/documents/${uuid}/verify`, {
    status: "verified",
    note: note || null,
  });
  return unwrap<unknown>(data);
}

// ── ROLLBACK ──────────────────────────────────────────────────────────────────
// POST /dms/documents/{uuid}/rollback
//   body: { version }

export async function rollbackDocumentVersion(
  uuid: string,
  version: number,
): Promise<unknown> {
  const { data } = await api.post(`/dms/documents/${uuid}/rollback`, {
    version,
  });
  return unwrap<unknown>(data);
}

// ── GET DOWNLOAD URL ──────────────────────────────────────────────────────────
// GET /dms/documents/{uuid}/download
//   Returns a signed URL pointing at /dms/files/serve

export async function getDocumentDownloadUrl(uuid: string): Promise<string> {
  const { data } = await api.get(`/dms/documents/${uuid}/download`);

  // Handle envelope shapes:
  //   { data: { url: "..." } }
  //   { data: "..." }
  //   "..."  (raw)
  const unwrapped =
    data && typeof data === "object" && "data" in data
      ? (data as { data: unknown }).data
      : data;

  const url =
    typeof unwrapped === "string"
      ? unwrapped
      : (unwrapped as { url?: string } | null)?.url;

  if (!url || typeof url !== "string") {
    throw new Error("Download URL not found in response.");
  }
  return url;
}

// ── FETCH BLOB ────────────────────────────────────────────────────────────────
// GET the signed URL → return the blob + content type

export async function fetchDocumentBlob(signedUrl: string): Promise<{
  blob: Blob;
  contentType: string;
}> {
  const response = await api.get(signedUrl, {
    responseType: "blob",
    headers: { Accept: "*/*" },
  });

  const contentType =
    String(response.headers["content-type"] ?? "") ||
    "application/octet-stream";

  return {
    blob: response.data as Blob,
    contentType,
  };
}
// ── SHARE DOCUMENT ────────────────────────────────────────────────────────────
// POST /dms/documents/{uuid}/share
//   body: { shared_with_user_id, access_level, expires_at }

export type ShareAccessLevel = "view" | "download" | "sign";

export interface ShareDocumentPayload {
  shared_with_user_id: number;
  access_level: ShareAccessLevel;
  expires_at: string; // ISO 8601, e.g. "2026-12-31T23:59:59"
}

export interface DocumentShare {
  uuid?: string;
  shared_with_user_id: number;
  access_level: ShareAccessLevel;
  expires_at: string;
  created_at?: string;
}

export async function shareDocument(
  uuid: string,
  payload: ShareDocumentPayload,
): Promise<DocumentShare | unknown> {
  const { data } = await api.post(`/dms/documents/${uuid}/share`, payload);
  return unwrap<DocumentShare | unknown>(data);
}
export type { AxiosError };