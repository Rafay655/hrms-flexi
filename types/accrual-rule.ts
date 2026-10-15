export type AccrualFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'pro_rata';

export interface AccrualRule {
  uuid: string;
  company_uuid: string;
  leave_type_uuid: string;
  leave_type_name: string;
  leave_type_code: string;
  name: string;
  accrual_frequency: AccrualFrequency;
  days_per_accrual: number;
  max_carry_forward: number | null;
  carry_forward_expiry_months: number | null;
  is_prorated_for_new_joiners: boolean;
  min_service_months_for_accrual: number;
  is_active: boolean;
  effective_from: string;       // YYYY-MM-DD (possibly with time, we'll strip)
  effective_to: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface AccrualRuleFormData {
  leave_type_uuid: string;
  name: string;
  accrual_frequency: AccrualFrequency | '';
  days_per_accrual: number;
  max_carry_forward: string;           // empty for null
  carry_forward_expiry_months: string; // empty for null
  is_prorated_for_new_joiners: boolean;
  min_service_months_for_accrual: number;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}

export interface AccrualRuleApiPayload {
  leave_type_uuid: string;
  name: string;
  accrual_frequency: AccrualFrequency;
  days_per_accrual: number;
  max_carry_forward: number | null;
  carry_forward_expiry_months: number | null;
  is_prorated_for_new_joiners: boolean;
  min_service_months_for_accrual: number;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}

export interface PaginatedAccrualRulesResponse {
  success: boolean;
  message: string;
  data: AccrualRule[];       // data is an array directly
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}