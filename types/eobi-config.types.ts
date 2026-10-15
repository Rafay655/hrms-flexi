// types/eobi-config.types.ts

export interface EobiConfig {
  id: string;
  tax_year_id: string;
  tax_year_label?: string;
  legal_entity_id: string | null;
  legal_entity?: { id: string; name: string } | null;
  state_id: number | null;
  state?: { id: number; name: string } | null;
  employer_registration_no: string | null;
  notified_wage_base: number;
  employer_contribution_rate: number;
  employee_contribution_rate: number;
  employer_contribution_amount: number | null;
  employee_contribution_amount: number | null;
  minimum_employee_applicability_count: number;
  apply_to_all_employees: boolean;
  contribution_start_rule: 'first_month' | 'next_month' | 'manual';
  effective_from: string;
  effective_to: string | null;
  source_document: string | null;
  status: 'draft' | 'active' | 'inactive';
  filing_deadline_day: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEobiConfigPayload {
  tax_year_id: string;
  state_id?: number | null;
  employer_registration_no?: string | null;
  notified_wage_base: number;
  employer_contribution_rate: number;
  employee_contribution_rate?: number;
  minimum_employee_applicability_count?: number;
  apply_to_all_employees?: boolean;
  contribution_start_rule?: 'first_month' | 'next_month' | 'manual';
  effective_from: string;
  effective_to?: string | null;
  source_document?: string | null;
  status?: 'draft' | 'active' | 'inactive';
  filing_deadline_day?: number;
}

export interface UpdateEobiConfigPayload extends Partial<CreateEobiConfigPayload> {}

export interface EobiConfigQueryParams {
  state_id?: number;
  tax_year_id?: string;
  page?: number;
  per_page?: number;
  search?: string;
}