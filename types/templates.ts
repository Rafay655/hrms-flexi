export interface Template {
  id: number;
  uuid: string;
  company_id: number | null;
  template_key: string;
  name: string;
  module: string;
  channel: "email" | "sms" | "whatsapp" | "in_app" | "push";
  subject: string | null;
  body_html: string | null;
  body_text: string;
  variables: string[];
  sample_values: Record<string, string> | null;
  is_active: boolean;
  version: number;
  effective_from: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Form data – omit fields managed by the backend
export type TemplateFormData = Omit<
  Template,
  | "id"
  | "uuid"
  | "company_id"
  | "version"
  | "created_by"
  | "updated_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "is_active"
  | "effective_from"
>;