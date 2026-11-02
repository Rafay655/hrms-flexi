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
  /** Legacy response field; entitlement is configured on Leave Policy. */
  default_days_per_year: number | null;
  is_encashable: boolean;
  carry_forward_allowed: boolean;
  /** Legacy response field; limits are configured on Leave Policy. */
  carry_forward_max_days: number | null;
  requires_attachment: boolean;
  min_days_notice: number;
  allow_half_day: boolean;
  is_gender_specific: boolean;
  gender_restriction: GenderRestriction | null;
  /** Legacy response field; accrual is configured on Leave Policy. */
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
  is_encashable: boolean;
  carry_forward_allowed: boolean;
  requires_attachment: boolean;
  min_days_notice: number;
  allow_half_day: boolean;
  is_gender_specific: boolean;
  gender_restriction: GenderRestriction | '';
  is_active: boolean;
}

export interface LeaveTypeApiPayload {
  name: string;
  code: string;
  is_paid: boolean;
  is_encashable: boolean;
  carry_forward_allowed: boolean;
  requires_attachment: boolean;
  min_days_notice: number;
  allow_half_day: boolean;
  is_gender_specific: boolean;
  gender_restriction: GenderRestriction | null;
  is_active: boolean;
}

export interface PaginatedLeaveTypesResponse {
  success: boolean;
  message: string;
  data: {
    data: LeaveType[];
    links: { first: string | null; last: string | null; prev: string | null; next: string | null };
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