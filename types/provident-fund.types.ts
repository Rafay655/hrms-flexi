// types/provident-fund.types.ts

// ── PF Policy Types ──────────────────────────────────
export interface PFPolicy {
  id: string;
  policy_name: string;
  legal_entity_id: string | null;
  legal_entity?: { id: string; name: string } | null;
  employee_category: string[] | null;
  department: number[] | null;
  grade: number[] | null;
  state_id: number | null;
  state?: { id: number; name: string; code: string } | null;
  salary_basis: 'gross_salary' | 'basic_salary';
  basis_pay_head_id: number | null;
  basis_pay_head?: { id: number; uuid: string; code: string; name: string } | null;
  custom_pay_heads: number[] | null;
  employee_contribution_type: 'percentage' | 'fixed_amount' | 'none';
  employee_contribution_value: number;
  employee_contribution_cap: number | null;
  employer_contribution_type: 'percentage' | 'fixed_amount' | 'none';
  employer_contribution_value: number;
  employer_contribution_cap: number | null;
  matching_rule: 'no_matching' | 'match_employee_contribution' | 'match_up_to_cap' | 'custom';
  tax_treatment: 'exempt' | 'taxable' | 'partially_exempt';
  include_in_tax_calculation: boolean;
  effective_from: string | null;
  effective_to: string | null;
  status: 'draft' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreatePFPolicyPayload {
  policy_name: string;
  employee_category?: string[] | null;
  department?: number[] | null;
  grade?: number[] | null;
  state_id?: number | null;
  salary_basis?: 'gross_salary' | 'basic_salary';
  employee_contribution_type?: 'percentage' | 'fixed_amount' | 'none';
  employee_contribution_value?: number;
  employee_contribution_cap?: number | null;
  employer_contribution_type?: 'percentage' | 'fixed_amount' | 'none';
  employer_contribution_value?: number;
  employer_contribution_cap?: number | null;
  matching_rule?: 'no_matching' | 'match_employee_contribution' | 'match_up_to_cap' | 'custom';
  tax_treatment?: 'exempt' | 'taxable' | 'partially_exempt';
  include_in_tax_calculation?: boolean;
  effective_from?: string | null;
  effective_to?: string | null;
  status?: 'draft' | 'active' | 'inactive';
}

export interface UpdatePFPolicyPayload extends Partial<CreatePFPolicyPayload> {}

export interface PFPolicyQueryParams {
  state_id?: number;
  page?: number;
  per_page?: number;
  search?: string;
}

// ── PF Calculation Types ─────────────────────────────
export interface PFSalaryInput {
  employee_uuid: string;
  payroll_month?: number;
  gross_salary?: number;
  basic_salary?: number;
  taxable_allowances?: number;
  exempt_allowances?: number;
  bonus?: number;
  arrears?: number;
  previous_employer_income?: number;
  previous_employer_tax?: number;
  ytd_taxable_income?: number;
  ytd_tax_deducted?: number;
  tax_year_id?: string;
  fiscal_year?: string;
}

export interface PFLineItem {
  pay_head: string;
  type: 'deduction' | 'employer_contribution' | 'earning';
  amount: number;
  tag: string;
}

export interface PFBreakdown {
  salary_basis: string;
  basis_salary: number;
  employee_contribution_type: string;
  employee_contribution_value: string | number;
  employer_contribution_type: string;
  employer_contribution_value: string | number;
  matching_rule: string;
}

export interface PFCalculationPreview {
  applicable: boolean;
  employee_contribution: number;
  employer_contribution: number;
  breakdown: PFBreakdown;
  policy: PFPolicy;
  line_items: PFLineItem[];
}