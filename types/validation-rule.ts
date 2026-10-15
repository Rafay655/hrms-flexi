export type ValidationRuleCategory =
  | "format"
  | "string"
  | "length"
  | "numeric"
  | "date"
  | "file"
  | "custom";

export type ValidationRuleParamType = "integer" | "float" | "string";

export type ValidationRuleFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "select"
  | "checkbox"
  | "file"
  | "date"
  | "textarea"
  | string;

export interface ValidationRule {
  id: number;
  key: string;
  label: string;
  description: string | null;
  applies_to: ValidationRuleFieldType[];
  has_param: boolean;
  param_label: string | null;
  param_type: ValidationRuleParamType | null;
  laravel_rule: string;
  category: ValidationRuleCategory;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ValidationRuleFormData {
  key: string;
  label: string;
  description: string;
  applies_to: string[];
  has_param: boolean;
  param_label: string;
  param_type: ValidationRuleParamType | "";
  laravel_rule: string;
  category: ValidationRuleCategory | "";
  is_active: boolean;
}

export interface ValidationRuleApiPayload {
  key: string;
  label: string;
  description: string | null;
  applies_to: string[];
  has_param: boolean;
  param_label: string | null;
  param_type: ValidationRuleParamType | null;
  laravel_rule: string;
  category: ValidationRuleCategory;
  is_active: boolean;
}

export interface PaginatedValidationRulesResponse {
  success: boolean;
  message: string;
  data: ValidationRule[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
  };
}

export interface ValidationRuleSingleResponse {
  success: boolean;
  message: string;
  data: ValidationRule;
}

export interface ValidationRulesQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface RafayAhmed {
  success: boolean;
  message: string;
  data: ValidationRule;
}