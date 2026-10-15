export interface DocumentType {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  requires_expiry: boolean;
  requires_verification: boolean;
  is_system: boolean;
  is_active: boolean;
}

export interface DmsFolder {
  id: number;           // numeric PK — used for folder_id filter in DocumentFilters
  uuid: string;
  name: string;
  slug: string;
  folder_type: 'personal' | 'shared' | 'system';
  is_system: boolean;
  sort_order: number;
  parent_id: number | null;
  children?: DmsFolder[];
  created_at: string;
}

export interface DmsDocument {
  uuid: string;
  title: string;
  original_name: string;
  mime_type: string | null;
  file_size: number | null;
  file_size_human: string;
  version: number;
  disk: string;
  expiry_date: string | null;
  is_expired: boolean;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  verified_at: string | null;
  is_encrypted: boolean;
  tags: string[];
  description: string | null;
  document_type: { id: number; name: string } | null;
  folder: { id: number; name: string } | null;
  employee_id: number | null;
  company_id: number;
  created_at: string;
  updated_at: string;
}

export interface DmsVersionHistory {
  uuid: string;
  version: number;
  original_name: string;
  mime_type: string | null;
  file_size: number | null;
  change_note: string | null;
  uploaded_by: number;
  created_at: string;
}

export interface DmsSignatureRequest {
  uuid: string;
  document_id: number;
  /** Populated by GET /v1/dms/signature-requests/:uuid — absent on create responses */
  document?: { uuid: string; title: string } | null;
  signer_user_id: number;
  status: 'pending' | 'signed' | 'declined' | 'expired';
  signed_at: string | null;
  expires_at: string | null;
  decline_reason: string | null;
  created_at: string;
  /**
   * Signatories for this request — present on GET /v1/dms/signature-requests/:uuid.
   * Used by the sign page to derive the current user's signatory UUID when the
   * ?signatory_uuid= query param is absent from the link.
   */
  signatories?: DmsEsignSignatory[];
}

export interface ComplianceDashboard {
  total_documents: number;
  pending_verification: number;
  expiring_in_7_days: number;
  expiring_in_30_days: number;
  expired: number;
}

/**
 * One row from GET /v1/dms/compliance/expiring
 * Note: this is NOT a full DmsDocument — the backend returns a lean projection
 * with a pre-computed `days_until_expiry` field.
 */
export interface DmsExpiringDocument {
  uuid: string;
  title: string;
  employee_id: number | null;
  expiry_date: string | null;       // YYYY-MM-DD
  days_until_expiry: number;        // positive integer
  document_type: string | null;     // resolved type name, not id
  verification_status: DmsDocument['verification_status'];
}

/**
 * One row from GET /v1/dms/compliance/verification-backlog
 * Pending documents ordered oldest-first for reviewer queues.
 */
export interface DmsBacklogItem {
  uuid: string;
  title: string;
  employee_id: number | null;
  document_type: string | null;
  uploaded_at: string;              // ISO-8601 datetime
  days_pending: number;             // positive integer
}

// Pagination wrapper
export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DmsBulkBatchItem {
  uuid: string;
  filename: string;
  employee_id: number | null;
  employee_name: string | null;
  title: string | null;
  expiry_date: string | null;
  status: 'pending' | 'matched' | 'uploaded' | 'failed';
  error_message: string | null;
  document_uuid: string | null;
}

export interface DmsBulkBatch {
  uuid: string;
  batch_name: string;
  status: 'created' | 'uploading' | 'processing' | 'completed' | 'failed';
  document_type_id: number | null;
  total_files: number;
  processed_count: number;
  failed_count: number;
  items?: DmsBulkBatchItem[];
  created_at: string;
}

export interface DmsEsignSignatory {
  uuid: string;
  signature_request_uuid: string;
  name: string;
  email: string;
  user_id: number | null;
  sign_order: number;
  is_parallel: boolean;
  status: 'pending' | 'notified' | 'signed' | 'declined';
  signed_at: string | null;
  decline_reason: string | null;
  otp_expires_at: string | null;
  total_signatories: number;
  requested_by_name: string | null;
  document: { uuid: string; title: string; document_type: { name: string } | null } | null;
  created_at: string;
}

// ── Compliance Requirements ───────────────────────────────────────────────────

export type ComplianceFrequency = 'annual' | 'quarterly' | 'monthly' | 'ad_hoc';

/**
 * One row from GET /v1/dms/compliance-requirements.
 * Source: DmsComplianceRequirement model, managed by ComplianceRequirementController.
 * Permission: manage-compliance.
 */
export interface DmsComplianceRequirement {
  uuid: string;
  title: string;
  description: string | null;
  document_type_id: number | null;
  document_type: { id: number; name: string } | null;
  frequency: ComplianceFrequency;
  is_mandatory: boolean;
  is_active: boolean;
  reminder_days_before: number;
  company_id: number;
  created_at: string;
}

export type DmsComplianceRequirementPayload = {
  title: string;
  description?: string | null;
  document_type_id?: number | null;
  frequency: ComplianceFrequency;
  is_mandatory: boolean;
  is_active: boolean;
  reminder_days_before: number;
};
