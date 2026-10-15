// types/gratuity-config.types.ts

export interface GratuityConfig {
  id: string;
  policy_name: string;
  legal_entity_id: string | null;
  legal_entity?: { id: string; name: string } | null;
  employee_category: string[] | null;
  department: number[] | null;
  grade: number[] | null;
  state_id: number | null;
  state?: { id: number; name: string; code: string } | null;
  salary_basis: 'last_drawn' | 'basic' | 'gross';
  formula_type: 'days_per_completed_year' | 'one_month_per_completed_year' | 'monthly_provision_percentage';
  days_per_completed_year: number | null;
  monthly_provision_rate: number | null;
  minimum_service_required: number;
  service_unit: 'years' | 'months';
  prorate_partial_year: boolean;
  rounding_rule: 'no_rounding' | 'round_to_nearest' | 'round_down' | 'round_up';
  include_in_fnf: boolean;
  tax_treatment: 'exempt' | 'taxable' | 'partially_exempt';
  tax_exemption_per_year: number;
  max_cap: number | null;
  provision_monthly: boolean;
  effective_from: string | null;
  effective_to: string | null;
  status: 'draft' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateGratuityConfigPayload {
  policy_name: string;
  employee_category?: string[] | null;
  department?: number[] | null;
  grade?: number[] | null;
  state_id?: number | null;
  salary_basis?: 'last_drawn' | 'basic' | 'gross';
  formula_type?: 'days_per_completed_year' | 'one_month_per_completed_year' | 'monthly_provision_percentage';
  days_per_completed_year?: number | null;
  monthly_provision_rate?: number | null;
  minimum_service_required?: number;
  service_unit?: 'years' | 'months';
  prorate_partial_year?: boolean;
  rounding_rule?: 'no_rounding' | 'round_to_nearest' | 'round_down' | 'round_up';
  include_in_fnf?: boolean;
  tax_treatment?: 'exempt' | 'taxable' | 'partially_exempt';
  tax_exemption_per_year?: number;
  max_cap?: number | null;
  provision_monthly?: boolean;
  effective_from?: string | null;
  effective_to?: string | null;
  status?: 'draft' | 'active' | 'inactive';
}

export interface UpdateGratuityConfigPayload extends Partial<CreateGratuityConfigPayload> {}

export interface GratuityConfigQueryParams {
  state_id?: number;
  page?: number;
  per_page?: number;
  search?: string;
}