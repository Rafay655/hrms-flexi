export type SignatureSignatoryPlan = { type: "employee" | "role"; role?: string; sign_order: number }[];
export type TemplateEngine = "legacy" | "mustache";

export type LetterCategory =
  | "joining" | "probation" | "career" | "disciplinary"
  | "exit" | "on_demand" | "finance" | "separation"
  | "certificate" | "compensation" | "movement";

export const LETTER_CATEGORY_OPTIONS: { value: LetterCategory; label: string }[] = [
  { value: "joining", label: "Joining" },
  { value: "probation", label: "Probation" },
  { value: "career", label: "Career" },
  { value: "disciplinary", label: "Disciplinary" },
  { value: "exit", label: "Exit" },
  { value: "on_demand", label: "On demand" },
  { value: "finance", label: "Finance" },
  { value: "separation", label: "Separation" },
  { value: "certificate", label: "Certificate" },
  { value: "compensation", label: "Compensation" },
  { value: "movement", label: "Movement" },
];

export type LetterLanguage = "en" | "ur" | "ar";

export type SignaturePolicy =
  | "none" | "internal_signatory" | "employee_acknowledgement"
  | "multi_party" | "external_qualified";

export type VariableType = "string" | "number" | "date" | "boolean";

/* ---------- Mustache variable schema ---------- */
export interface VariableSchemaEntry {
  name: string;
  label: string;
  type: VariableType;
  required: boolean;
  default?: string | number | boolean;
}

export interface VariableSchema {
  variables: VariableSchemaEntry[];
  derived?: Record<string, string>;
}

/* ---------- Template ---------- */
export interface LetterTemplate {
  uuid: string;
  company_id: number | null;
  template_key: string;
  name: string;
  category?: LetterCategory;
  language: LetterLanguage;
  engine?: TemplateEngine;
  paper_size?: string;
  orientation?: string;
  variables?: string[];
  variable_schema?: VariableSchema;
  sample_values?: Record<string, string>;
  body_html: string;
  header_html?: string | null;
  footer_html?: string | null;
  is_active: boolean;
  publish_status?: TemplateVersionStatus | null;
  requires_approval: boolean;
  requires_e_signature: boolean;
  signature_policy?: SignaturePolicy;
  signature_signatories?: SignatureSignatoryPlan | null;
  series_tracking: boolean;
  requires_employee_acknowledgement?: boolean;
  is_system_default: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

/* ---------- Filters ---------- */
export interface LetterTemplateFilters {
  category?: LetterCategory | "";
  language?: LetterLanguage | "";
  engine?: TemplateEngine | "";
  search?: string;
  sort?: string;
  sort_dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

/* ---------- Payloads ---------- */
interface BaseTemplatePayload {
  template_key: string;
  category?: LetterCategory;
  name: string;
  language: LetterLanguage;
  body_html: string;
  header_html?: string | null;
  footer_html?: string | null;
  requires_approval: boolean;
  requires_e_signature?: boolean;
  series_tracking: boolean;
  requires_employee_acknowledgement?: boolean;
  signature_policy?: SignaturePolicy;
  signature_signatories?: SignatureSignatoryPlan | null;
}

export interface LegacyTemplatePayload extends BaseTemplatePayload {
  engine: "legacy";
  paper_size?: string;
  orientation?: string;
  variables?: string[];
  sample_values?: Record<string, string>;
}

export interface MustacheTemplatePayload extends BaseTemplatePayload {
  engine: "mustache";
  variables?: string[];
  variable_schema?: VariableSchema;
}

export type CreateLetterTemplatePayload =
  | LegacyTemplatePayload
  | MustacheTemplatePayload;

export type UpdateLetterTemplatePayload = Partial<
  LegacyTemplatePayload | MustacheTemplatePayload
>;

export interface LetterTemplatePreview {
  html: string;
  variables_used: string[];
}

export type TemplateVersionStatus = "draft" | "review_required" | "published" | "retired";
export interface TemplateVersion {
  id: number;
  version: number;
  status: TemplateVersionStatus;
  content_hash: string;
  created_by: number | null;
  submitted_by: number | null;
  submitted_at: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_note: string | null;
  published_at: string | null;
  is_active: boolean;
  maker?: { uuid: string; name: string } | null;
  submitter?: { uuid: string; name: string } | null;
  can_review?: boolean;
  created_at?: string;
  content?: { body_html: string; header_html: string | null; footer_html: string | null; sample_values: Record<string, unknown>; source_schema_json: unknown };
}
export interface TemplateVersionHistory {
  template_uuid: string;
  maker_checker_required: boolean;
  current_published_version_id: number | null;
  versions: TemplateVersion[];
}
export type ReviewTemplatePayload = { decision: "approve" } | { decision: "reject"; note: string };
export interface TemplatePublishResult { version: number; status?: TemplateVersionStatus; message?: string }
export interface GenerateLetterPayload {
  template_key: string;
  employee_id: number;
  language?: LetterLanguage;
  extra_data?: Record<string, string | number | boolean>;
}
export interface LetterRenderStatus {
  uuid: string;
  status: string;
  generated_pdf_path?: string | null;
  error_message?: string | null;
  can_download?: boolean;
  dispatched_at?: string | null;
  recalled_at?: string | null;
}
export interface GeneratedLetter extends LetterRenderStatus {
  template_key: string;
  employee_id: number;
  language: LetterLanguage;
}
export interface GenerateLetterResponse extends Omit<ApiEnvelope<GeneratedLetter>, "meta"> {
  meta?: { language_fallback?: { requested: string; rendered: string; note: string } };
}

/* ---------- Envelope ---------- */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

/* ---------- Registered template keys (21 total, backend-enforced) ---------- */
export interface RegisteredTemplateKey {
  key: string;
  label: string;
}

export const REGISTERED_TEMPLATE_KEYS: readonly RegisteredTemplateKey[] = [
  { key: "appointment_letter",         label: "Appointment Letter" },
  { key: "offer_letter",               label: "Offer Letter" },
  { key: "probation_extension_letter", label: "Probation Extension Letter" },
  { key: "confirmation_letter",        label: "Confirmation Letter" },
  { key: "promotion_letter",           label: "Promotion Letter" },
  { key: "transfer_letter",            label: "Transfer Letter" },
  { key: "increment_letter",           label: "Increment Letter" },
  { key: "contract_renewal_letter",    label: "Contract Renewal Letter" },
  { key: "recognition_certificate",    label: "Recognition Certificate" },
  { key: "warning_letter",             label: "Warning Letter" },
  { key: "show_cause_notice",          label: "Show Cause Notice" },
  { key: "relieving_letter",           label: "Relieving Letter" },
  { key: "experience_certificate",     label: "Experience Certificate" },
  { key: "fnf_settlement_letter",      label: "Full & Final Settlement Letter" },
  { key: "noc_letter",                 label: "No Objection Certificate" },
  { key: "salary_certificate",         label: "Salary Certificate" },
  { key: "training_certificate",       label: "Training Certificate" },
  { key: "asset_handover_note",        label: "Asset Handover Note" },
  { key: "loan_sanction_letter",       label: "Loan Sanction Letter" },
  { key: "loan_clearance_letter",      label: "Loan Clearance Letter" },
  { key: "tax_deduction_certificate",  label: "Tax Deduction Certificate" },
] as const;

export const TEMPLATE_KEY_VALUES: readonly string[] =
  REGISTERED_TEMPLATE_KEYS.map((r) => r.key);
