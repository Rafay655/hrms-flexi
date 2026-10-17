import type { AttendanceDay } from './ess-attendance';
export interface AttendanceEmployee { id?: string; uuid?: string; employee_code: string; name: string; internal_id?: number; user_id?: number }
export interface TodayAttendance {
  date: string; employee: AttendanceEmployee; punch_state: string;
  clock_in_at: string | null; clock_out_at: string | null;
  last_punch: { uuid: string; punched_at: string; punch_type: string; lat: number | null; lng: number | null; is_geofence_valid: boolean | null; mock_location: boolean } | null;
  last_punch_type: string | null; status: string; first_in: string | null; last_out: string | null;
  work_minutes: number; overtime_minutes: number; late_minutes: number; early_out_minutes: number; break_minutes: number;
  is_geofence_valid: boolean | null; is_regularized: boolean;
  shift: { uuid: string; name: string; start_time: string | null; end_time: string | null; is_night_shift: boolean; target_minutes: number; grace_minutes: number; break_duration_minutes: number } | null;
  geofence: { zone_uuid: string; zone_name: string; zone_type: string; lat: number | null; lng: number | null; radius_meters: number; bypass: boolean; required: boolean } | null;
  actions: { can_punch_in: boolean; can_punch_out: boolean; can_break_start: boolean; can_break_end: boolean; is_early: boolean; is_late_departure: boolean };
  pending_regularizations: number;
  progress: { worked_minutes: number; worked_display: string; target_minutes: number; target_display: string; percentage: number } | null;
}
export interface TimelineAttendanceDay extends Omit<AttendanceDay, 'status'> {
  status: string;
  policy?: { id: string; policy_name: string; is_default: boolean } | null;
  regularization_id?: string | null;
  locked_period?: unknown;
}
export interface MonthlyAttendanceSummary {
  month: string; month_label: string; present: number; late: number; absent: number;
  on_leave: number; half_day: number; early_out: number; out_missing: number;
  weekoffs: number; total_marked: number; working_days: number;
}
export interface TimelineFilters { month: string; page: number; per_page: number; date_from?: string; date_to?: string; status?: string }
export interface TimelineEnvelope<T> { success: boolean; message: string; data: T; employee?: AttendanceEmployee }
export interface TimelineListResponse extends TimelineEnvelope<TimelineAttendanceDay[]> {
  meta: { current_page: number; per_page: number; total: number; last_page: number; from?: number | null; to?: number | null };
}
