// types/ss-config.types.ts

export interface PayHead {
  id: number;
  uuid: string;
  code: string;
  name: string;
}

export interface State {
  id: number;
  name: string;
  code: string;
}
// types/ss-config.types.ts

// types/ss-config.types.ts

export interface SsConfig {
  id: string;
  tax_year_id: string;
  tax_year_label?: string;
  legal_entity_id: string | null;
  legal_entity?: { id: string; name: string } | null;
  state_id: number;
  state?: { id: number; name: string; code: string } | null;
  scheme: string; // PESSI, SESSI, KP-ESSI, B-ESSI, ICT, Other
  employer_registration_no: string; // required
  registration_office: string | null;
  wage_ceiling_type: 'fixed_amount' | 'minimum_wage_linked' | 'no_ceiling';
  wage_ceiling_amount: number;
  wage_basis: 'gross_salary' | 'basic_salary' | 'minimum_wage';
  employer_contribution_rate: number;
  employee_contribution_rate: number;
  basis_pay_head_id: number | null;
  basis_pay_head?: any;
  effective_from: string;
  effective_to: string | null;
  source_document: string | null;
  status: 'draft' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateSsConfigPayload {
  tax_year_id: string;
  state_id: number;
  scheme: string;
  employer_registration_no: string; // required
  registration_office?: string | null;
  wage_ceiling_type?: 'fixed_amount' | 'minimum_wage_linked' | 'no_ceiling';
  wage_ceiling_amount: number;
  wage_basis?: 'gross_salary' | 'basic_salary' | 'minimum_wage';
  employer_contribution_rate: number;
  employee_contribution_rate?: number;
  effective_from: string;
  effective_to?: string | null;
  source_document?: string | null;
  status?: 'draft' | 'active' | 'inactive';
}

export interface UpdateSsConfigPayload extends Partial<CreateSsConfigPayload> {}

export interface SsConfigQueryParams {
  tax_year_id?: string;
  state_id?: number;
  page?: number;
  per_page?: number;
  search?: string;
}