/**
 * types/ess-attendance.ts
 * ESS Attendance (ESS-ATT-01/02/03) — DTOs for the employee's own attendance.
 *
 * Mirrors app/Http/Resources/TimeSync/DailyAttendanceResource.php and the custom envelope
 * returned by App\ViewModels\TimeSync\DailyAttendance\MyDailyAttendanceViewModel. Keep the
 * two in step: the backend is the contract, this is the client's view of it.
 *
 * ⚠️ These types describe a TimeSync-owned endpoint that ESS merely CONSUMES
 * (GET /v1/time-sync/attendance/my). ESS does not re-export or proxy it — see
 * docs/ess/IMPLEMENTATION_PLAN.md §1.1.
 */

/**
 * The 11 values of the `status` enum on timesync_daily_attendance.
 *
 * Transcribed from the migration, not invented. Any value outside this list means the enum
 * changed and this file is stale.
 */
export type AttendanceStatus =
  | "present"
  | "absent"
  | "late_in"
  | "early_out"
  | "half_day"
  | "out_missing"
  | "present_holiday"
  | "present_off_day"
  | "weekend"
  | "holiday"
  | "on_leave";

export type AttendanceShift = {
  id: string;
  internal_id: number;
  name: string;
  code: string | null;
  shift_type: string | null;
  start_time: string | null;
  end_time: string | null;
  is_night_shift: boolean;
};

/** One day of attendance. Minute fields are integers, never pre-formatted strings. */
export type AttendanceDay = {
  id: string;
  attendance_date: string | null;
  status: AttendanceStatus;
  shift: AttendanceShift | null;

  /** "YYYY-MM-DD HH:MM:SS" or null when no punch was recorded. */
  first_in: string | null;
  last_out: string | null;

  work_minutes: number | null;
  overtime_minutes: number | null;
  late_minutes: number | null;
  early_out_minutes: number | null;
  night_minutes: number | null;
  break_minutes: number | null;

  is_geofence_valid: boolean | null;
  geofence_violation_meters: number | null;
  is_regularized: boolean;
  is_locked: boolean;
};

/**
 * GET /v1/time-sync/attendance/my.
 *
 * ⚠️ NOT the usual { success, message, data: { data, meta } } envelope. This ViewModel builds
 * its own response by hand: `data` is the array DIRECTLY, `meta` and `employee` sit at the top
 * level. Unwrapping this like the other modules' clients (res.data.data.data) returns undefined.
 */
export type MyAttendanceResponse = {
  employee: {
    id: string;
    employee_code: string | null;
    name: string | null;
  };
  data: AttendanceDay[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

/** Query filters the endpoint actually supports. Anything else is ignored server-side. */
export type MyAttendanceFilters = {
  /** "YYYY-MM" — matched with a LIKE against attendance_date. */
  month?: string;
  date_from?: string;
  date_to?: string;
  status?: AttendanceStatus;
  per_page?: number;
  page?: number;
};
