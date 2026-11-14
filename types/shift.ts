export type ShiftType = 'fixed' | 'rotational' | 'flexible';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export interface ShiftBreakWindow {
  days: Weekday[];
  start: string;
  end: string;
  paid: boolean;
  label: string;
}
export interface Shift {
  id: string;
  uuid?: string;
  internal_id?: number;
  company_id?: number;
  attendance_policy_id: string | null;
  name: string;
  code: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  is_night_shift?: boolean | null;
  overtime_allowed: boolean;
  max_ot_minutes_per_day: number | null;
  working_days: Weekday[];
  break_windows?: ShiftBreakWindow[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface ShiftFormData {
  is_night_shift: boolean;
  attendance_policy_id: string;
  name: string;
  code: string;
  shift_type: ShiftType | '';
  start_time: string;
  end_time: string;
  working_days: Weekday[];
  break_windows: ShiftBreakWindow[];
  overtime_allowed: boolean;
  max_ot_minutes_per_day: string;
  is_active: boolean;
}
export interface ShiftApiPayload {
  is_night_shift: boolean;
  attendance_policy_id: string | null;
  name: string;
  code: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  working_days: Weekday[];
  break_windows: { weekdays: Weekday[]; start_time: string; end_time: string; paid: boolean; label: string }[];
  overtime_allowed: boolean;
  max_ot_minutes_per_day: number | null;
  is_active: boolean;
}
export interface PaginatedShiftsResponse {
  success: boolean;
  message: string;
  data: {
    data: Shift[];
    links: unknown;
    meta: { current_page: number; from: number; last_page: number; per_page: number; to: number; total: number };
  };
}
