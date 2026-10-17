import type { TodayAttendance, TimelineAttendanceDay, MonthlyAttendanceSummary } from '@/types/attendance-timeline';
export const timelineToday: TodayAttendance = {
  date: '2026-10-17', employee: { uuid: 'employee', employee_code: 'EMP-9', name: 'Example Employee' },
  punch_state: 'on_duty', clock_in_at: '2026-10-17 10:03:14', clock_out_at: null,
  last_punch: { uuid: 'punch', punched_at: '2026-10-17 10:53:20', punch_type: 'in', lat: null, lng: null, is_geofence_valid: null, mock_location: false },
  last_punch_type: 'in', status: 'out_missing', first_in: '2026-10-17 10:03:14', last_out: null,
  work_minutes: 0, overtime_minutes: 0, late_minutes: 18, early_out_minutes: 0, break_minutes: 0,
  is_geofence_valid: null, is_regularized: false,
  shift: { uuid: 'shift', name: 'Regular shift', start_time: '09:30:00', end_time: '18:30:00', is_night_shift: false, target_minutes: 540, grace_minutes: 15, break_duration_minutes: 60 },
  geofence: { zone_uuid: 'zone', zone_name: 'Head Office', zone_type: 'office', lat: null, lng: null, radius_meters: 200, bypass: false, required: true },
  actions: { can_punch_in: false, can_punch_out: true, can_break_start: true, can_break_end: false, is_early: false, is_late_departure: false },
  pending_regularizations: 0, progress: { worked_minutes: 68, worked_display: '1h 8m', target_minutes: 540, target_display: '9h 0m', percentage: 12.6 },
};
export const timelineDay: TimelineAttendanceDay = {
  id: 'attendance-1', attendance_date: '2026-10-16', status: 'present',
  shift: { id: 'shift', internal_id: 5, name: 'Regular shift', code: 'RS', shift_type: 'fixed', start_time: '09:30:00', end_time: '18:30:00', is_night_shift: false },
  first_in: '2026-10-16 09:30:00', last_out: '2026-10-16 18:33:42', work_minutes: 544, overtime_minutes: 64,
  late_minutes: 0, early_out_minutes: 0, night_minutes: 0, break_minutes: 0,
  is_geofence_valid: null, geofence_violation_meters: null, is_regularized: false, is_locked: false,
};
export const timelineSummary: MonthlyAttendanceSummary = {
  month: '2026-10', month_label: 'October 2026', present: 25, late: 0, absent: 0, on_leave: 0,
  half_day: 0, early_out: 0, out_missing: 0, weekoffs: 6, total_marked: 31, working_days: 25,
};
