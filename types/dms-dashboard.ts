export interface DmsDashboard {
  month: string; month_label: string; month_start: string; month_end: string;
  range_end_exclusive: string; timezone: string; as_of: string;
  is_current_month: boolean; snapshot_at: string; snapshot_mode: string;
  kpi: { documents_uploaded: number; verified_documents: number; pending_verification: number; pending_signatures: number; expiring_documents: number; folders: number };
  trend: { months: string[]; labels: string[]; uploaded: number[]; verified: number[]; note: string };
  status_breakdown: { status: string; label: string; count: number }[];
  status_total: number;
  needs_attention: Record<'awaiting_verification' | 'awaiting_signature' | 'missing_documents' | 'expired_documents', { count: number; scope: string; hint: string }>;
  document_types: { document_type_id: number | null; label: string; count: number }[];
  document_types_other: number; document_types_total: number;
  folder_distribution: { total: number; folders: { folder_type: string; label: string; count: number; percentage: number }[] };
  signatures: { total: number; pending: number; signed: number; declined: number; expired: number };
  compliance: { expiring: number; expired: number; missing: number; missing_unit: string; window_start: string; window_end: string };
  folder_count: number; batches_in_month: number;
  recent_batches: { uuid: string; batch_name: string; status: string; total_files: number; processed: number; failed: number; remaining: number; progress_percentage: number; created_at: string; completed_at: string | null }[];
  recent_documents: { uuid: string; reference_number: string | null; title: string; uploaded_at: string; verification_status: string; verified_at: string | null; expiry_date: string | null; is_expired: boolean; owner: { type: string; name: string; uuid?: string | null; employee_code?: string | null } | null; document_type: { id: number; name: string } | null; folder: { id: number; name: string; folder_type: string } | null }[];
}
