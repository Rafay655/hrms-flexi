export type ShiftType = 'fixed' | 'rotational' | 'flexible';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ShiftArchetype {
  id: string;
  uuid: string;
  internal_id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface Shift {
  id: string;                          // UUID
  uuid: string;
  internal_id: number;
  company_id: number;
  attendance_policy_id: string;
  shift_archetype_id: string | null;
  shift_archetype: ShiftArchetype | null;
  name: string;
  code: string;
  shift_type: ShiftType;
  start_time: string;                  // "HH:mm"
  end_time: string;
  is_night_shift: boolean;
  grace_minutes: number;
  early_out_grace_minutes: number;
  break_duration_minutes: number;
  overtime_allowed: boolean;
  ot_threshold_minutes: number;
  max_ot_minutes_per_day: number | null;
  working_days: Weekday[];            // Normalised – API returns string or array
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShiftFormData {
  shift_archetype_id: string;
  name: string;
  code: string;
  shift_type: ShiftType | '';
  start_time: string;
  end_time: string;
  is_night_shift: boolean;
  grace_minutes: number;
  early_out_grace_minutes: number;
  break_duration_minutes: number;
  overtime_allowed: boolean;
  ot_threshold_minutes: number;
  max_ot_minutes_per_day: string;      // number | '' for input
  working_days: Weekday[];
  is_active: boolean;
  attendance_policy_id: string;
}

export interface ShiftApiPayload {
  shift_archetype_id: string | null;
  name: string;
  code: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  is_night_shift: boolean;
  grace_minutes: number;
  early_out_grace_minutes: number;
  break_duration_minutes: number;
  overtime_allowed: boolean;
  ot_threshold_minutes: number;
  max_ot_minutes_per_day: number | null;
  working_days: Weekday[];
  attendance_policy_id: string;
  is_active: boolean;
}

export interface PaginatedShiftsResponse {
  success: boolean;
  message: string;
  data: {
    data: Shift[];
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