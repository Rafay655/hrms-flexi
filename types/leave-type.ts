export type AccrualType = 'monthly' | 'quarterly' | 'annual' | 'none';
export type GenderRestriction = 'male' | 'female';

export interface LeaveType {
  id: string;               // UUID
  uuid: string;
  internal_id: number;
  company_id: number;
  name: string;
  code: string;
  is_paid: boolean;
  default_days_per_year: number | null;
  is_encashable: boolean;
  carry_forward_allowed: boolean;
  carry_forward_max_days: number | null;
  requires_attachment: boolean;
  min_days_notice: number;
  allow_half_day: boolean;
  is_gender_specific: boolean;
  gender_restriction: GenderRestriction | null;
  accrual_type: AccrualType | null;
  is_system_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveTypeFormData {
  name: string;
  code: string;
  is_paid: boolean;
  default_days_per_year: string;        // number or empty
  is_encashable: boolean;
  carry_forward_allowed: boolean;
  carry_forward_max_days: string;       // number or empty
  requires_attachment: boolean;
  min_days_notice: number;
  allow_half_day: boolean;
  is_gender_specific: boolean;
  gender_restriction: GenderRestriction | '';
  accrual_type: AccrualType | '';
  is_active: boolean;
}

export interface LeaveTypeApiPayload {
  name: string;
  code: string;
  is_paid: boolean;
  default_days_per_year: number | null;
  is_encashable: boolean;
  carry_forward_allowed: boolean;
  carry_forward_max_days: number | null;
  requires_attachment: boolean;
  min_days_notice: number;
  allow_half_day: boolean;
  is_gender_specific: boolean;
  gender_restriction: GenderRestriction | null;
  accrual_type: AccrualType | null;
  is_active: boolean;
}

export interface PaginatedLeaveTypesResponse {
  success: boolean;
  message: string;
  data: {
    data: LeaveType[];
    links: any;
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  };
}