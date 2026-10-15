// types/calculation.types.ts

export interface EmployeeSalary {
  employee_uuid: string;
  gross_salary: number;
  basic_salary: number;
  fiscal_year: string;
  net_taxable_monthly: number;
  effective_date: string;
}

export interface TaxCalculationPayload {
  employee_uuid: string;
  net_taxable_monthly: number;
  fiscal_year: string;
}

export interface TaxCalculationResult {
  monthly_tax: number;
  annual_tax: number;
  tax_paid_ytd: number;
  tax_still_owed: number;
  projected_annual: number;
  remaining_months: number;
  joining_date: string | null;
  fiscal_year: string;
  slab_id: string;
  slab_label: string;
  slab_rate: number;
  slab_fixed: number;
  slab_threshold: number;
  slab_breakdown: Array<{
    slab_number: number;
    label: string;
    slab_from: number;
    slab_to: number;
    rate_pct: number;
    fixed_component: number;
    tax_note: string;
    income_in_slab: number;
    tax_in_slab: number;
    status: 'full' | 'partial' | 'empty';
  }>;
  surcharge: number;
  exemption_type: string | null;
  exemption_rate_pct: number;
  exemption_amount: number;
  annual_tax_after_exemption: number;
}

export interface EOBICalculationPayload {
  employee_uuid: string;
  gross_salary: number;
}

export interface EOBICalculationResult {
  employee_share: number;
  employer_share: number;
  notified_wage_base: number;
  employer_contribution_rate: number;
  employee_contribution_rate: number;
}

export interface SocialSecurityCalculationPayload {
  employee_uuid: string;
  gross_salary: number;
}

export interface SocialSecurityCalculationResult {
  employer_share: number;
  employee_share: number;
  state_id: number;
  state_name: string;
  scheme: string;
  status: string;
}

export interface GratuityCalculationPayload {
  employee_uuid: string;
  basis_salary: number;
  completed_years: number;
}

export interface GratuityCalculationResult {
  eligible: boolean;
  gross_gratuity: number;
  exempt_amount: number;
  taxable_amount: number;
  completed_years: number;
  days_per_year: number;
  salary_basis: string;
  formula_type: string;
  rounding_rule: string;
  config: {
    id: string;
    policy_name: string;
    state_id: number | null;
    salary_basis: string;
    formula_type: string;
    days_per_completed_year: number;
    minimum_service_required: string;
    service_unit: string;
    rounding_rule: string;
    tax_exemption_per_year: string;
  };
}

export interface AllCalculationsPayload {
  employee_uuid: string;
  gross_salary: number;
  net_taxable_monthly: number;
  basis_salary: number;
  completed_years: number;
}

export interface AllCalculationsResult {
  employee_uuid: string;
  period: any[];
  eobi: EOBICalculationResult;
  social_security: SocialSecurityCalculationResult;
  tax: TaxCalculationResult;
  provident_fund: {
    applicable: boolean;
    employee_contribution: number;
    employer_contribution: number;
    breakdown: any;
    policy: any;
    line_items: any[];
  };
  gratuity: {
    applicable: boolean;
    employee_contribution: number;
    employer_contribution: number;
  };
  line_items: Array<{
    pay_head: string;
    type: string;
    amount: number;
    tag: string;
  }>;
  employer_total_cost: number;
  employee_total_deduction: number;
}