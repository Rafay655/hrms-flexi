export interface CalendarShift {
  id: string;
  code: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  is_night_shift: boolean;
}
export interface AttendanceCalendarDay {
  date: string;
  weekday: string;
  shift_code: string | null;
  display_code: string | null;
  day_type: string;
  is_working_day: boolean;
  shift: CalendarShift | null;
  shift_source: string | null;
  roster: { id: string; status: string; is_weekly_off: boolean; is_holiday: boolean; notes: string | null } | null;
  holiday: { name: string; is_optional: boolean } | null;
  leave: Record<string, unknown> | null;
  attendance: {
    id: string; status: string; first_in: string | null; last_out: string | null;
    work_minutes: number; late_minutes: number; early_out_minutes: number; overtime_minutes: number; break_minutes: number;
    is_regularized: boolean; is_geofence_valid: boolean | null; is_locked: boolean;
  } | null;
  status: string | null;
  anomalies: string[];
}
export interface CalendarEmployee {
  employee: { id: string; internal_id?: number; employee_code: string; name: string; department_id?: number | null; department: string | null };
  days: AttendanceCalendarDay[];
  summary: {
    shift_code_counts: Record<string, number>; working_days: number; present_days: number; absent_days: number;
    leave_days: number; holiday_days: number; weekly_off_days: number; half_days: number;
    total_work_minutes: number; anomaly_count: number; status_counts: Record<string, number>;
  };
}
export interface AttendanceCalendarResponse {
  success: boolean;
  message: string;
  data: { from: string; to: string; shift_legend: CalendarShift[]; employees: CalendarEmployee[] };
  meta: { total: number; current_page: number; per_page: number; last_page: number };
}
export interface AttendanceCalendarFilters { date_from: string; date_to: string; page: number; per_page: number }
