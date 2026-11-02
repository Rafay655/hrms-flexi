export type AccrualPeriod = 'monthly' | 'quarterly' | 'annual';

export interface LeavePolicy {
  id: string;
  uuid: string;
  leave_type: {
    id: string;          // UUID
    uuid: string;
    name: string;
    code: string;
  };
  leave_type_id: number;  // internal ID (from response)
  grade_band: {
    id: number;          // internal ID
    uuid: string | null; // may be null
    name: string;
  } | null;
  grade_band_id: number | null;
  department: {
    id: number;
    name: string;
  } | null;
  department_id: number | null;
  annual_entitlement: number;
  carry_forward_limit: number | null;
  encashment_limit: number | null;
  accrual_rate: number | null;
  accrual_period: AccrualPeriod | null;
  probation_eligible: boolean;
  min_service_months: number;
  max_consecutive_days: number | null;
  requires_approval: boolean;
  effective_from: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeavePolicyFormData {
  leave_type_id: string;       // UUID (disabled on edit)
  grade_band_id: number | '';       // Integer ID (disabled on edit)
  department_id: number | '';  // (disabled on edit)
  annual_entitlement: number;
  carry_forward_limit: string;
  encashment_limit: string;
  accrual_rate: string;
  accrual_period: AccrualPeriod | '';
  probation_eligible: boolean;
  min_service_months: number;
  max_consecutive_days: string;
  requires_approval: boolean;
  effective_from: string;
  is_active: boolean;
}

export interface LeavePolicyApiPayload {
  leave_type_id: string | null;
  grade_band_id: number | null;
  department_id: number | null;
  annual_entitlement: number;
  carry_forward_limit: number | null;
  encashment_limit: number | null;
  accrual_rate: number | null;
  accrual_period: AccrualPeriod | null;
  probation_eligible: boolean;
  min_service_months: number;
  max_consecutive_days: number | null;
  requires_approval: boolean;
  effective_from: string;
  is_active: boolean;
}