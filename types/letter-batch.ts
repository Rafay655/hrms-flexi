export type LetterBatchStatus = "draft" | "dry_run" | "running" | "completed" | "partially_failed" | "failed";
export interface LetterBatchItem {
  uuid: string;
  employee_id: number;
  status: string;
  generated_letter_id: number | null;
  failure_reason: string | null;
  processed_at: string | null;
}
export interface LetterBatch {
  uuid: string;
  template_key: string;
  status: LetterBatchStatus;
  dry_run: boolean;
  total_count: number;
  queued_count: number;
  succeeded_count: number;
  failed_count: number;
  skipped_count: number;
  committed_by: number | null;
  committed_at: string | null;
  completed_at: string | null;
  created_at: string;
  is_committable: boolean;
  is_terminal: boolean;
  items?: LetterBatchItem[];
}
export interface LetterBatchFilters { page?: number; per_page?: number; status?: LetterBatchStatus | ""; template_key?: string }
export interface CreateLetterBatchPayload { template_key: string; employee_ids: number[]; dry_run: true; idempotency_key: string }
