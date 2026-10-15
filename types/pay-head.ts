// types/pay-head.ts

export type PayHeadType = 'earning' | 'deduction' | 'employer_contribution';
export type PayHeadCategory = 'basic' | 'allowance' | 'statutory' | 'voluntary' | 'bonus' | 'reimbursement' | 'other';
export type CalculationType = 'fixed' | 'percentage_of_basic' | 'percentage_of_gross' | 'percentage_of_ctc' | 'formula' | 'slab_based';
export type StatutoryCode = 'eobi_employee' | 'eobi_employer' | 'pessi' | 'fbr_tax' | 'professional_tax';

export interface PayHead {
  id: string;                // UUID
  code: string;
  name: string;
  name_urdu: string | null;
  type: PayHeadType;
  category: PayHeadCategory;
  calculation_type: CalculationType;
  formula_expression: string | null;
  is_taxable: boolean;
  is_statutory: boolean;
  statutory_code: StatutoryCode | null;
  affects_eobi: boolean;
  affects_pessi: boolean;
  is_part_of_gross: boolean;
  is_part_of_ctc: boolean;
  is_overridable: boolean;   // ✅ new field
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PayHeadFormData {
  code: string;
  name: string;
  name_urdu: string;
  type: PayHeadType | '';
  category: PayHeadCategory | '';
  calculation_type: CalculationType | '';
  formula_expression: string;
  is_taxable: boolean;
  is_statutory: boolean;
  statutory_code: StatutoryCode | '';
  affects_eobi: boolean;
  affects_pessi: boolean;
  is_part_of_gross: boolean;
  is_part_of_ctc: boolean;
  is_overridable: boolean;   // ✅ new field
  display_order: number;
  is_active: boolean;
}

export interface PaginatedPayHeadsResponse {
  success: boolean;
  message: string;
  data: PayHead[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}