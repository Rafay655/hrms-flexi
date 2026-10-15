export interface SalaryStructureComponent {
  id: string;
  salary_structure_id: string;
  pay_head_id: string | null;
  pay_head_code: string | null;
  pay_head_name: string | null;
  calculation_type: string;
  default_value: string;
  percentage: string | null;
  formula_expression: string | null;
  min_amount: string | null;
  max_amount: string | null;
  is_mandatory: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryStructure {
  id: string;
  name: string;
  description: string | null;
  currency_code: string | null;
  is_default: boolean;
  is_active: boolean;
  components_count: number;
  components?: SalaryStructureComponent[];
  created_at?: string;
  updated_at?: string;
}

export interface SalaryStructureFormData {
  name: string;
  description: string;
  currency_code: string;
  is_default: boolean;
  is_active: boolean;
}

export interface SalaryStructureApiPayload {
  name: string;
  description: string | null;
  currency_code: string | null;
  is_default: boolean;
  is_active: boolean;
}

export interface SalaryStructureComponentFormData {
  pay_head_id: string;        // UUID (or empty for custom)
  calculation_type: string;
  default_value: string;
  percentage: string;
  formula_expression: string;
  min_amount: string;
  max_amount: string;
  is_mandatory: boolean;
  display_order: number;
}

export interface PaginatedSalaryStructuresResponse {
  success: boolean;
  message: string;
  data: SalaryStructure[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SimulationRequest {
  uuid: string;
  gross_salary: number;
}

export interface SimulationResponse {
  success: boolean;
  message: string;
  data: {
    earnings: {
      gross_earnings: number;
      taxable_earnings: number;
      lines: Array<{
        pay_head_code: string;
        pay_head_name: string;
        category: string;
        is_taxable: boolean;
        amount: number;
        calculation_type: string;
      }>;
    };
    deductions: {
      pre_tax_deductions: number;
      net_taxable_income: number;
      income_tax_monthly: number;
      post_tax_deductions: number;
      total_deductions: number;
      lines: Array<{
        pay_head_code: string;
        pay_head_name: string;
        category: string;
        is_pre_tax: boolean;
        amount: number;
        calculation_type: string;
      }>;
    };
    tax: {
      net_taxable_income: number;
      projected_annual: number;
      remaining_months: number;
      joining_date: string | null;
      annual_tax: number;
      monthly_tax: number;
      slab_label: string;
      slab_rate_pct: number;
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
        status: string;
      }>;
    };
    employer: {
      employer_contributions: number;
      eobi_employer: number;
      total_ctc: number;
      lines: Array<{
        pay_head_code: string;
        pay_head_name: string;
        category: string;
        amount: number;
        calculation_type: string;
      }>;
    };
    summary: {
      gross_earnings: number;
      total_deductions: number;
      net_pay: number;
      total_ctc: number;
      fiscal_year: string;
      basic_salary: number;
    };
  };
}