/**
 * types/flexi-import.ts
 * FlexiImport Module 1.7 — canonical TypeScript types.
 *
 * Single source of truth for all batch, row, column-map, and field-definition
 * shapes. Import from here in services, hooks, and page components.
 */

// ── Enumerations ───────────────────────────────────────────────────────────────

/** Full batch lifecycle state-machine values. */
export type BatchStatus =
  | 'uploaded'
  | 'validating'
  | 'validation_complete'
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'rolled_back';

/** Supported import payload types (maps to backend ImportTypeRegistry). */
export type ImportType = 'employees' | 'flexi_meta_entities' | string;

/** How the batch processor handles conflicts / errors. */
export type ImportMode =
  | 'create_only'
  | 'update_only'
  | 'create_or_update'
  | 'all_or_nothing'
  | 'partial'
  | 'skip_errors'; // legacy alias for partial used by some batch responses

// ── Core resource shapes ───────────────────────────────────────────────────────

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'date' | 'number' | 'boolean' | 'enum' | 'cnic' | string;
  description?: string;
  allowed_values?: string[];
  source_table?: string;
  label_column?: string;
}

/**
 * Full batch detail object as returned by the batch CRUD endpoints.
 * Fields that are only present once the batch has been processed are nullable.
 */
export interface ImportBatch {
  uuid: string;
  import_type: ImportType;
  /** Original filename of the uploaded CSV/XLSX. */
  file_name: string;
  status: BatchStatus;
  import_mode: ImportMode;
  require_approval: boolean;
  requires_approval: boolean;           // alias field some endpoints return
  approval_status: 'pending' | 'approved' | 'rejected' | null;
  approval_threshold: number | null;
  rejection_reason: string | null;
  /** csv_column → field_key mapping submitted with the batch. */
  column_mapping: Record<string, string> | null;
  /** field_key → human-readable label, resolved at upload time. */
  field_labels: Record<string, string>;
  total_rows: number;
  valid_rows: number | null;
  invalid_rows: number | null;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  skipped_rows: number;
  progress_percentage: number;
  is_rollbackable: boolean;
  initiator_name: string;
  uploaded_by: string;
  submitted_at: string | null;
  created_at: string;
  completed_at: string | null;
  /** CSV column headers extracted by the backend (xlsx / encoding-normalised). */
  csv_headers?: string[];
  /** Present when status === 'failed' — brief description of the fatal error. */
  error_message?: string | null;
}

/** A single CSV row's validation or processing result. */
export interface ImportRow {
  row_number: number;
  /** Raw CSV values keyed by CSV column header. */
  fields: Record<string, string>;
  status: 'valid' | 'invalid' | 'pending' | 'processing' | 'committed' | 'failed';
  /** Field-level validation errors, keyed by field key. */
  errors?: Record<string, string>;
  /** Flat array of validation error messages (alternative format). */
  validation_errors?: string[] | null;
  processing_error?: string | null;
  created_record_type?: string | null;
  created_record_id?: number | null;
}

/** Saved column-mapping template (GET /flexi-import/column-maps). */
export interface ImportColumnMap {
  /** Primary key — may be "id" or "uuid" depending on which endpoint returns it. */
  id: string;
  uuid?: string;
  name: string;
  import_type: ImportType;
  is_default: boolean;
  /** csv_column → field_key */
  mapping: Record<string, string>;
  /** Same data under alternative key returned by some endpoints. */
  column_mapping?: Record<string, string>;
  last_used_at: string | null;
  created_at: string;
}

// ── API response wrappers ──────────────────────────────────────────────────────

export interface PaginatedBatchResponse {
  data: ImportBatch[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BatchListParams {
  page?: number;
  per_page?: number;
  status?: BatchStatus | string;
  import_type?: ImportType | string;
  from?: string;
  to?: string;
}

// ── Payload types ──────────────────────────────────────────────────────────────

export interface UploadBatchPayload {
  file: File;
  import_type: ImportType;
  import_mode?: ImportMode;
  require_approval?: boolean;
  /** Mapping to persist on the batch; used during step-2 upload. */
  column_mapping?: Record<string, string>;
  /** UUID of a saved ColumnMap to apply instead of a manual mapping. */
  column_map_id?: string;
}

// ── Derived status helpers ─────────────────────────────────────────────────────

/** Statuses that require 3-second polling (not yet settled). */
export const ACTIVE_BATCH_STATUSES = new Set<BatchStatus>([
  'uploaded',
  'validating',
  'processing',
  'pending_approval',
  'approved',
]);

/** Statuses that will never change further (terminal). */
export const TERMINAL_BATCH_STATUSES = new Set<BatchStatus>([
  'completed',
  'failed',
  'rejected',
  'rolled_back',
]);

/** Returns true if the batch is in an active (non-terminal, non-settled) state. */
export function isBatchActive(status: BatchStatus | string | undefined): boolean {
  return !!status && ACTIVE_BATCH_STATUSES.has(status as BatchStatus);
}

/**
 * Returns true if the 24-hour rollback window is still open.
 * The backend enforces the same guard via ImportBatch::isRollbackWindowOpen().
 */
export function isRollbackWindowOpen(
  batch: Pick<ImportBatch, 'status' | 'completed_at'>,
): boolean {
  if (batch.status !== 'completed') return false;
  if (!batch.completed_at) return false;
  const MS_24H = 24 * 60 * 60 * 1_000;
  return Date.now() - new Date(batch.completed_at).getTime() < MS_24H;
}
