import { api } from '@/lib/api';
import type {
  DmsDocument,
  DmsExpiringDocument,
  DmsBacklogItem,
  DmsFolder,
  DmsVersionHistory,
  DmsSignatureRequest,
  DmsBulkBatch,
  DmsEsignSignatory,
  DocumentType,
  Paginated,
  ComplianceDashboard,
  DmsComplianceRequirement,
  DmsComplianceRequirementPayload,
} from '@/types/dms';

// ── Document Types ────────────────────────────────────────────────────────────

export const getDocumentTypes = async (): Promise<DocumentType[]> => {
  const { data } = await api.get('/flexi-meta/document-types');
  // Handles both paginated ({ data: { data: [...] } }) and plain array ({ data: [...] }) shapes.
  return data.data.data ?? data.data;
};

// ── Folders ───────────────────────────────────────────────────────────────────

export const getFolderTree = async (params?: { employee_id?: number }): Promise<DmsFolder[]> => {
  const { data } = await api.get('/dms/folders', { params });
  return data.data;
};

export const createFolder = async (payload: {
  name: string;
  parent_id?: number | null;
  folder_type?: 'personal' | 'shared';
  employee_id?: number | null;
}): Promise<DmsFolder> => {
  const { data } = await api.post('/dms/folders', payload);
  return data.data;
};

export const updateFolder = async (uuid: string, payload: { name?: string }): Promise<DmsFolder> => {
  const { data } = await api.put(`/dms/folders/${uuid}`, payload);
  return data.data;
};

export const deleteFolder = async (uuid: string): Promise<void> => {
  await api.delete(`/dms/folders/${uuid}`);
};

// ── Documents ─────────────────────────────────────────────────────────────────

export interface DocumentFilters {
  folder_id?: number | null;
  document_type_id?: number | null;
  verification_status?: string;
  employee_id?: number | null;
  search?: string;
  per_page?: number;
  page?: number;
}

export const getDocuments = async (filters?: DocumentFilters): Promise<Paginated<DmsDocument>> => {
  const { data } = await api.get('/dms/documents', { params: filters });
  // Backend nests pagination under data.data.meta (Resource-collection envelope);
  // flatten into the top-level Paginated<T> shape the page consumes (DMS-D5).
  const p = data.data;
  return { data: p.data, ...p.meta };
};

export const getDocument = async (uuid: string): Promise<DmsDocument> => {
  const { data } = await api.get(`/dms/documents/${uuid}`);
  return data.data;
};

export const getSigningDocumentBlob = async (uuid: string, signal?: AbortSignal): Promise<Blob> => {
  const { data } = await api.get(`/dms/documents/${uuid}/download`, { responseType: 'blob', signal });
  return data;
};

export const uploadDocument = async (formData: FormData): Promise<DmsDocument> => {
  const { data } = await api.post('/dms/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const updateDocument = async (uuid: string, payload: Partial<DmsDocument>): Promise<DmsDocument> => {
  const { data } = await api.put(`/dms/documents/${uuid}`, payload);
  return data.data;
};

export const deleteDocument = async (uuid: string): Promise<void> => {
  await api.delete(`/dms/documents/${uuid}`);
};

/**
 * Download a document. The backend streams the file bytes as an attachment
 * (FIX-20), so fetch it as a blob and trigger a browser download. Filename is
 * taken from the server's Content-Disposition, falling back to the document uuid.
 */
export const downloadDocument = async (uuid: string): Promise<void> => {
  const response = await api.get(`/dms/documents/${uuid}/download`, { responseType: "blob" });

  const disposition = (response.headers["content-disposition"] as string | undefined) ?? "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
  const filename = match ? decodeURIComponent(match[1]) : `document-${uuid}`;

  const blobUrl = window.URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const verifyDocument = async (
  uuid: string,
  status: 'verified' | 'rejected',
  note?: string,
): Promise<DmsDocument> => {
  const { data } = await api.post(`/dms/documents/${uuid}/verify`, { status, note });
  return data.data;
};

export const getDocumentVersions = async (uuid: string): Promise<DmsVersionHistory[]> => {
  const { data } = await api.get(`/dms/documents/${uuid}/versions`);
  return data.data;
};

/**
 * NOTE: the backend `POST /dms/documents/{uuid}/version` endpoint
 * (DmsDocumentController::newVersion) is an honest 501 stub — the new-version
 * flow has not been built. Do NOT wire this into UI until that endpoint is
 * implemented; calling it today returns 501. No component currently uses it.
 */
export const uploadNewVersion = async (uuid: string, formData: FormData): Promise<DmsDocument> => {
  const { data } = await api.post(`/dms/documents/${uuid}/version`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

// ── E-Signature ───────────────────────────────────────────────────────────────

/** One signer in a signature request. `user_id` is optional — a signatory can be
 *  a manual name+email recipient with no platform account. `email` is where the
 *  OTP is delivered and is always required by the backend. */
export interface SignatureSignatoryInput {
  user_id?: number | null;
  name: string;
  email: string;
  sign_order: number;
  is_parallel?: boolean;
}

export const requestSignature = async (
  uuid: string,
  payload: {
    signatories: SignatureSignatoryInput[];
    provider?: 'internal' | 'manual';
    message?: string | null;
    expires_at?: string | null;
  },
): Promise<DmsSignatureRequest> => {
  const { data } = await api.post(`/dms/documents/${uuid}/sign/request`, payload);
  return data.data;
};

export const getSignatureRequest = async (uuid: string): Promise<DmsSignatureRequest> => {
  const { data } = await api.get(`/dms/signature-requests/${uuid}`);
  return data.data;
};

export const verifySignatureOtp = async (
  signatureRequestUuid: string,
  otp: string,
  signatureImageUuid?: string,
): Promise<DmsSignatureRequest> => {
  const { data } = await api.post(
    `/dms/signature-requests/${signatureRequestUuid}/verify`,
    { otp, ...(signatureImageUuid ? { signature_image_uuid: signatureImageUuid } : {}) },
  );
  return data.data;
};

// ── Compliance ────────────────────────────────────────────────────────────────
// Compliance endpoints (/dms/compliance/*) are served by DmsComplianceController.

export const getComplianceDashboard = async (): Promise<ComplianceDashboard> => {
  const { data } = await api.get('/dms/compliance/dashboard');
  return data.data;
};

export const getExpiringDocuments = async (days = 30): Promise<DmsExpiringDocument[]> => {
  const { data } = await api.get('/dms/compliance/expiring', { params: { days } });
  return data.data;
};

export const getVerificationBacklog = async (): Promise<DmsBacklogItem[]> => {
  const { data } = await api.get('/dms/compliance/verification-backlog');
  return data.data;
};

// ── Bulk Upload ───────────────────────────────────────────────────────────────


export const uploadBulkFiles = async (
  batchUuid: string,
  formData: FormData,
  onUploadProgress?: (percent: number) => void,
): Promise<DmsBulkBatch> => {
  const { data } = await api.post(`/dms/bulk-batches/${batchUuid}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onUploadProgress && e.total) {
        onUploadProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return data.data;
};

export const getBulkBatch = async (batchUuid: string): Promise<DmsBulkBatch> => {
  const { data } = await api.get(`/dms/bulk-batches/${batchUuid}`);
  return data.data;
};

export const processBulkBatch = async (batchUuid: string): Promise<DmsBulkBatch> => {
  const { data } = await api.post(`/dms/bulk-batches/${batchUuid}/process`);
  return data.data;
};

export const retryBulkBatch = async (batchUuid: string): Promise<DmsBulkBatch> => {
  const { data } = await api.post(`/dms/bulk-batches/${batchUuid}/retry`);
  return data.data;
};

export const getBulkBatches = async (): Promise<Paginated<DmsBulkBatch>> => {
  const { data } = await api.get('/dms/bulk-batches');
  return data.data;
};

// ── E-Signature (Signatory) ───────────────────────────────────────────────────

export const getPendingSignatures = async (signal?: AbortSignal): Promise<DmsEsignSignatory[]> => {
  const { data } = await api.get('/dms/signature-requests/pending', { signal });
  return data.data;
};

export const declineSignature = async (
  signatureRequestUuid: string,
  signatoryUuid: string,
  reason: string,
): Promise<DmsEsignSignatory> => {
  const { data } = await api.post(
    `/dms/signature-requests/${signatureRequestUuid}/signatories/${signatoryUuid}/decline`,
    { decline_reason: reason },
  );
  return data.data;
};

export const resendSignatureOtp = async (
  signatureRequestUuid: string,
  signatoryUuid: string,
): Promise<void> => {
  await api.post(
    `/dms/signature-requests/${signatureRequestUuid}/signatories/${signatoryUuid}/resend-otp`,
  );
};

export const verifySignatoryOtp = async (
  signatureRequestUuid: string,
  signatoryUuid: string,
  otp: string,
  signatureImageUuid?: string,
): Promise<DmsEsignSignatory> => {
  const { data } = await api.post(
    `/dms/signature-requests/${signatureRequestUuid}/signatories/${signatoryUuid}/verify`,
    { otp, ...(signatureImageUuid ? { signature_image_uuid: signatureImageUuid } : {}) },
  );
  return data.data;
};

// ── Compliance Requirements ───────────────────────────────────────────────────

/**
 * Paginated list of compliance requirements for the authenticated company.
 * Requires `manage-compliance` permission.
 */
export const getComplianceRequirements = async (params?: {
  page?: number;
  per_page?: number;
}): Promise<Paginated<DmsComplianceRequirement>> => {
  const { data } = await api.get('/dms/compliance-requirements', { params });
  return data.data;
};

/**
 * Create a new compliance requirement.
 * Requires `manage-compliance` permission.
 */
export const createComplianceRequirement = async (
  payload: DmsComplianceRequirementPayload,
): Promise<DmsComplianceRequirement> => {
  const { data } = await api.post('/dms/compliance-requirements', payload);
  return data.data;
};

/**
 * Update an existing compliance requirement.
 * All fields optional (partial update).
 * Requires `manage-compliance` permission.
 */
export const updateComplianceRequirement = async (
  uuid: string,
  payload: Partial<DmsComplianceRequirementPayload>,
): Promise<DmsComplianceRequirement> => {
  const { data } = await api.put(`/dms/compliance-requirements/${uuid}`, payload);
  return data.data;
};

/**
 * Soft-delete a compliance requirement.
 * Preserved for audit; cannot be recovered via API.
 * Requires `manage-compliance` permission.
 */
export const deleteComplianceRequirement = async (uuid: string): Promise<void> => {
  await api.delete(`/dms/compliance-requirements/${uuid}`);
};

export interface CreateBulkBatchPayload {
  batch_name: string;
  folder_id: number;
  default_access_level: string;
}

export interface Folder {
  id: number;
  name: string;
  // ...other fields
}

export async function getFolders(): Promise<Folder[]> {
  const res = await api.get("/dms/folders");
  return res.data; // adjust to res.data.results / res.data.data per your API
}

export async function createBulkBatch(
  payload: CreateBulkBatchPayload,
): Promise<DmsBulkBatch> {
  const res = await api.post("/dms/bulk-batches", payload);
  return res.data;
}
