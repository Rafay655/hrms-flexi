import type { GeneratedLetter, SignaturePolicy } from "./letter-forge";

export type DispatchChannel = "email" | "in_app" | "print" | "none";
export interface LetterRecord extends GeneratedLetter {
  reference_number?: string | null;
  company_id?: number;
  series_number?: string | number | null;
  signed_pdf_path?: string | null;
  created_at?: string;
  updated_at?: string;
  generated_by?: number | null;
  dispatched_by?: number | null;
  recalled_at?: string | null;
  recall_reason?: string | null;
  can_recall?: boolean;
  is_terminal?: boolean;
  issuing_entity_id?: number | null;
  acknowledged_at?: string | null;
  acknowledged_by?: number | null;
  dispatched_at?: string | null;
  dispatch_channel?: DispatchChannel | null;
  artifacts_expired_at?: string | null;
  signature_policy?: SignaturePolicy;
  acknowledgement_status?: "not_required" | "pending" | "acknowledged";
  acknowledgement_required?: boolean;
  can_acknowledge?: boolean;
  can_revoke?: boolean;
  can_supersede?: boolean;
  revoke_reason?: string | null;
  supersede_reason?: string | null;
  supersedes_uuid?: string | null;
  replacement_uuid?: string | null;
  template?: { uuid: string; name: string; category?: string };
  employee?: { uuid: string; name: string; employee_code: string; designation?: string | null };
  dispatch_logs?: { uuid: string; channel: string; status: string; dispatched_to?: string | null; dispatched_by?: number | null; ip_address?: string | null; error_message?: string | null; created_at?: string }[];
}
export interface LetterFilters { page?: number; per_page?: number; status?: string; template_key?: string; employee_id?: number }
export interface CorrectionPayload { reason: string; extra_data?: Record<string, string | number | boolean> }
export interface LetterDashboard {
  month: string; month_label: string; month_start: string; month_end: string; is_current_month: boolean;
  kpi: { letters_generated: number; dispatched: number; pending_approval: number; pending_signature: number; pending_acknowledgement: number; published_templates: number; total_templates: number };
  trend: { months: string[]; labels: string[]; generated: number[]; dispatched: number[]; note: string };
  status_breakdown: { status: string; label: string; count: number }[];
  status_total: number;
  needs_attention: Record<'awaiting_approval' | 'awaiting_signature' | 'awaiting_acknowledgement' | 'generation_failed', { count: number; hint: string }>;
  top_letter_types: { template_key: string; label: string; count: number }[];
  top_letter_types_other: number; top_letter_types_total: number;
  delivery_channels: { total: number; channels: { channel: string; label: string; count: number; percentage: number }[] };
  acknowledgement: { required: number; acknowledged: number; pending: number; hint: string };
  recent_batches: { uuid: string; template_key: string; label: string; status: string; dry_run: boolean; employees: number; eligible: number; skipped: number; generated: number; failed: number; remaining: number; is_committable: boolean; committed_at: string | null; completed_at: string | null; created_at: string }[];
  batches_in_month: number;
  template_library: { total: number; published: number; unpublished: number; active_published: number; hint: string };
  recent_letters: LetterRecord[];
}
