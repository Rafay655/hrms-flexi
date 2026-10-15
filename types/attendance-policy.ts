// ---- API response item (matches the JSON you provided) ----
export interface AttendancePolicy {
  id: string;
  policy_name: string;
  branch_ids: string[];
  branches?: {
    id: string;
    uuid: string;
    name: string;
    code: string;
    branch_type: string;
    is_active: boolean;
  }[];
  department_ids: number[];
  departments?: { id: number; name: string; code: string; status: string }[];
  employment_types: number[];
  employee_types?: { id: number; name: string; status: string }[];
  grace_in_minutes: number;
  grace_out_minutes: number;
  half_day_threshold_minutes: number;
  absent_threshold_minutes: number;
  short_leave_threshold_minutes: number;
  late_marks_for_half_day: number;
  late_marks_for_absent: number;
  max_short_leaves_per_month: number;
  auto_absent_on_no_punch: boolean;
  auto_absent_cutoff_time: string;          // "HH:mm" e.g. "12:00"
  ot_calculation_method: string;            // e.g. "actual"
  min_ot_minutes: number;
  ot_rate_weekday: string;
  ot_rate_weekend: string;
  night_window_start: string;               // "HH:mm"
  night_window_end: string;
  night_premium_rate: string;
  comp_off_eligible_on: string[];
  comp_off_min_hours: string;
  comp_off_expiry_days: number;
  regularization_max_days_back: number;
  regularization_max_per_month: number;
  is_default: boolean;
  effective_from: string;                   // "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss"
  effective_to: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ---- Form data (used in create/edit, with string arrays for multi‑select) ----
export interface AttendancePolicyFormData {
  policy_name: string;
  branch_ids: string[];
  department_ids: string[];
  employment_types: string[];
  grace_in_minutes: number;
  grace_out_minutes: number;
  half_day_threshold_minutes: number;
  absent_threshold_minutes: number;
  short_leave_threshold_minutes: number;
  late_marks_for_half_day: number;
  late_marks_for_absent: number;
  max_short_leaves_per_month: number;
  auto_absent_on_no_punch: boolean;
  auto_absent_cutoff_time: string;
  ot_calculation_method: string;
  min_ot_minutes: number;
  ot_rate_weekday: string;
  ot_rate_weekend: string;
  night_window_start: string;
  night_window_end: string;
  night_premium_rate: string;
  comp_off_eligible_on: string[];
  comp_off_min_hours: string;
  comp_off_expiry_days: number;
  regularization_max_days_back: number;
  regularization_max_per_month: number;
  is_default: boolean;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

// ---- API payload (numbers for IDs, etc.) ----
export interface AttendancePolicyApiPayload {
  policy_name: string;
  branch_ids: string[];
  department_ids: number[];
  employment_types: number[];
  grace_in_minutes: number;
  grace_out_minutes: number;
  half_day_threshold_minutes: number;
  absent_threshold_minutes: number;
  short_leave_threshold_minutes: number;
  late_marks_for_half_day: number;
  late_marks_for_absent: number;
  max_short_leaves_per_month: number;
  auto_absent_on_no_punch: boolean;
  auto_absent_cutoff_time: string;
  ot_calculation_method: string;
  min_ot_minutes: number;
  ot_rate_weekday: number;   // numeric
  ot_rate_weekend: number;
  night_window_start: string;
  night_window_end: string;
  night_premium_rate: number;
  comp_off_eligible_on: string[];
  comp_off_min_hours: number;
  comp_off_expiry_days: number;
  regularization_max_days_back: number;
  regularization_max_per_month: number;
  is_default: boolean;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

// ---- Paginated response for listing ----
export interface PaginatedAttendancePoliciesResponse {
  success: boolean;
  message: string;
  data: {
    data: AttendancePolicy[];
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

// ---- Single policy response (if wrapped) ----
export interface SingleAttendancePolicyResponse {
  success: boolean;
  message: string;
  data: AttendancePolicy;
}