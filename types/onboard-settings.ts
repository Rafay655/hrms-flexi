import type { VisibilityCondition } from "@/lib/onboarding-visibility";
export const FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "number",
  "date",
  "textarea",
  "select",
  "multiselect",
  "file",
  "checkbox",
  "radio",
  "toggle",
] as const;

export const FIELD_TAGS = ["nadra", "eobi", "fbr", "safety", "ss"] as const;

export const SOURCE_TYPES = ["static", "dynamic"] as const;

export type FieldType = (typeof FIELD_TYPES)[number];
export type FieldTag = (typeof FIELD_TAGS)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];

export type FieldOption = {
  label: string;
  value: string | number;
};

export type ValidationRuleParam = {
  value?: string | number;
};

export type FieldValidationRule = {
  rule: string;
  label?: string;
  description?: string | null;
  category?: string | null;
  has_param?: boolean;
  param_label?: string | null;
  param_type?: string | null;
  params?: ValidationRuleParam | [];
};

export type OnboardSettingField = {
  visibility_condition?: VisibilityCondition | null;
  is_core?: boolean;
  id: number;
  step_id: number;
  label: string;
  system_key?: string;
  type: FieldType;
  column_span:1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  column_span_label?: string;
  placeholder: string | null;
  source_type: SourceType;
  source_table: string | null;
  source_label_col: string | null;
  source_value_col: string | null;
  source_filter_col: string | null;
  options: FieldOption[];
  show_in_quick: boolean;
  show_in_detail: boolean;
  required_in_quick: boolean;
  required_in_detail: boolean;
  validation_rules: FieldValidationRule[];
  tags: FieldTag[];
  is_login_email: boolean;
  order?: number;
  created_at?: string;
  updated_at?: string;
};

export type OnboardSettingStep = {
  id: number;
  company_id: number;
  company_uuid: string;
  form_builder_id: number;
  name: string;
  icon: string | null;
  order: number;
  fields_count: number;
  fields: OnboardSettingField[];
  created_at?: string;
  updated_at?: string;
};

export type OnboardSettingsResponse = {
  success: boolean;
  message: string;
  data: OnboardSettingStep[];
  meta?: {
    company_id: number;
    company_uuid: string;
    total_steps: number;
    form_builder_id: number;
  };
};

export type DataSourceItem = {
  key?: string;
  table?: string;
  value?: string;
  name?: string;
  label?: string;
  category?: string;
};

export type ValidationRuleCatalogItem = {
  id: number;
  key: string;
  label: string;
  description: string | null;
  applies_to: string[];
  has_param: boolean;
  param_label: string | null;
  param_type: string | null;
  laravel_rule: string;
  category: string | null;
  is_active: boolean;
};

export type SaveOnboardFieldPayload = {
  visibility_condition?: VisibilityCondition | null;
  step_id: number;
  label: string;
  type: FieldType;
  column_span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  placeholder: string | null;
  source_type: SourceType;
  options: FieldOption[];
  source_table: string | null;
  source_label_col: string | null;
  source_value_col: string | null;
  source_filter_col: string | null;
  show_in_quick: boolean;
  show_in_detail: boolean;
  required_in_quick: boolean;
  required_in_detail: boolean;
  validation_rules: {
    rule: string;
    params: Record<string, string | number>;
  }[];
  tags: FieldTag[];
  is_login_email: boolean;
};

export type StoreStepPayload = {
  company_uuid: string;
  form_builder_id: number;
  name: string;
  icon?: string | null;
};

export type UpdateStepPayload = {
  name: string;
  icon?: string | null;
};