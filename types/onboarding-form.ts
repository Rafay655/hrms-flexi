import type { VisibilityCondition } from "@/lib/onboarding-visibility";
export type FormMode = "quick" | "detailed";

export type ComplianceTag = "nadra" | "eobi" | "fbr" | "safety" | "ss" | string;

export type ApiFieldOption = {
  label: string;
  value: string | number;
};

export type ApiFieldValidation = {
  rule: string;
  label: string;
  description: string;
  param?: string | number | null;
};

export type ApiFieldValueObject = {
  id?: string | number;
  value?: string | number;
  label?: string;
};

export type ApiField = {
  visibility_condition?: VisibilityCondition | null;
  is_core?: boolean;
  id: number;
  label: string;

  system_key?: string;
  field_key?: string;

  type: string;
  column_span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

  placeholder?: string | null;

  source_type?: "static" | "dynamic" | string;
  source_key?: string | null;

  parent_source_key?: string | null;
  parent_system_key?: string | null;
  parent_filter_column?: string | null;
  load_strategy?: "eager" | "lazy" | string;

  options?: ApiFieldOption[];

  show_in_quick?: boolean;
  show_in_detail?: boolean;

  is_required: boolean;
  required_in_quick?: boolean;
  required_in_detail?: boolean;
  is_login_email: boolean;

  tags?: ComplianceTag[];
  validations?: ApiFieldValidation[];

  value?:
    | boolean
    | string
    | number
    | string[]
    | ApiFieldValueObject
    | ApiFieldValueObject[]
    | null;
  current_value?:
    | boolean
    | string
    | number
    | string[]
    | ApiFieldValueObject
    | ApiFieldValueObject[]
    | null;
  default_value?:
    | boolean
    | string
    | number
    | string[]
    | ApiFieldValueObject
    | ApiFieldValueObject[]
    | null;
};

export type ApiStep = {
  id: number;
  step_id?: number;
  name: string;
  step_name?: string;
  icon: string | null;
  order: number;
  fields_count: number;
  required_count: number;
  fields: ApiField[];
};

export type ApiMeta = {
  company_uuid?: string;
  employee_uuid?: string;
  total_steps: number;
  total_fields: number;
  total_required: number;
  mode: FormMode;
};

export type FormResponse = {
  success: boolean;
  message: string;
  data: ApiStep[];
  meta: ApiMeta;
};

export type EmployeeProfileField = {
  label: string;
  type: string;
  tags?: ComplianceTag[];
  is_required?: boolean;
  is_login_email?: boolean;
  value?: string | number | string[] | ApiFieldValueObject | ApiFieldValueObject[] | null;
};

export type EmployeeProfileStep = {
  step_id: number;
  step_name: string;
  icon: string | null;
  order: number;
  fields: Record<string, EmployeeProfileField>;
};

export type EmployeeDraftResponse = {
  success: boolean;
  message: string;
  data?: {
    id?: string;
    uuid?: string;
    employee_uuid?: string;
    employee_code?: string | null;
    company_id?: number;
    employment_status?: string;
    joining_date?: string | null;
    form_mode?: FormMode;
    user?: unknown;
    documents?: unknown[];
    profile?: {
      steps?: EmployeeProfileStep[];
      orphaned?: Record<string, unknown>;
    };
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
  };
  id?: string;
  uuid?: string;
  employee_uuid?: string;
  errors?: Record<string, string[] | string>;
};

export type PublishEmployeeResponse = {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: Record<string, string[] | string>;
};

export type FieldValue = string | string[] | File | null;

export type FormValues = Record<string, FieldValue>;

export type FieldErrors = Record<string, string>;

export type StepSubmitPayload = {
  form_mode: FormMode;
  step_id: number;
  values: FormValues;
  fields: ApiField[];
  allFields?: ApiField[];
  employee_uuid?: string;
};