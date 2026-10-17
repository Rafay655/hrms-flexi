import type { TeamAttendanceResponse, TeamEnvelope, TeamLocationsResponse, TeamMemberDetail, TeamSummary } from '@/types/team-attendance';

const employee = { uuid: 'employee-uuid', employee_code: 'EMP-009', name: 'Example Engineer', department: 'Engineering', designation: 'Software Engineer', avatar_url: null, initials: 'EE', reporting_level: 'direct' };
const punch = { uuid: 'punch-uuid', punched_at: '2026-10-17 10:03:14', punch_type: 'in', lat: null, lng: null, is_geofence_valid: null, mock_location: false };
export const teamAttendance: TeamAttendanceResponse = {
  success: true, message: 'Success',
  data: [{ employee, attendance_date: '2026-10-17', status: 'out_missing', first_in: '2026-10-17 10:03:14', last_out: null, work_minutes: 0, overtime_minutes: 0, late_minutes: 18, is_geofence_valid: null, geofence_violation_meters: null, is_regularized: false, last_punch: punch }],
  meta: { date: '2026-10-17', recursive: false, team_size: 1, viewing_team_of: { uuid: 'manager-self', name: 'Example Manager', employee_code: 'EMP-001' }, drill_path: [] },
  available_managers: [
    { uuid: 'manager-self', name: 'Example Manager', employee_code: 'EMP-001', subordinate_count: 1, is_self: true },
    { uuid: 'manager-other', name: 'Other Manager', employee_code: 'EMP-002', subordinate_count: 2, is_self: false },
  ],
};
export const teamSummary: TeamEnvelope<TeamSummary> = { success: true, message: 'Success', data: { date: '2026-10-17', team_size: 1, present: 1, late: 1, absent: 0, on_leave: 0, not_marked: 0, checked_in: 1 } };
export const teamLocations: TeamLocationsResponse = { success: true, message: 'Success', data: [{ employee, last_punch: punch }], meta: { date: '2026-10-17', recursive: false, pins_count: 1 } };
export const teamDetail: TeamEnvelope<TeamMemberDetail> = { success: true, message: 'Success', data: { employee, attendance_date: '2026-10-17', status: 'out_missing', first_in: '2026-10-17 10:03:14', last_out: null, work_minutes: 0, late_minutes: 18, is_geofence_valid: null, punches: [punch] } };
