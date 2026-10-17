export interface TeamPerson {
  uuid: string;
  employee_code: string;
  name: string;
  department?: string | null;
  designation?: string | null;
  avatar_url?: string | null;
  initials?: string;
  reporting_level?: 'direct' | 'indirect' | string;
}

export interface TeamPunch {
  uuid: string;
  punched_at: string;
  punch_type: string;
  lat: number | null;
  lng: number | null;
  is_geofence_valid: boolean | null;
  mock_location: boolean;
}

export interface TeamAttendance {
  employee: TeamPerson;
  attendance_date: string;
  status: string;
  first_in: string | null;
  last_out: string | null;
  work_minutes: number;
  overtime_minutes: number;
  late_minutes: number;
  is_geofence_valid: boolean | null;
  geofence_violation_meters: number | null;
  is_regularized: boolean;
  last_punch: TeamPunch | null;
}

export interface TeamManager extends TeamPerson {
  subordinate_count: number;
  is_self: boolean;
}

export interface TeamEnvelope<T> { success: boolean; message: string; data: T }
export interface TeamAttendanceResponse extends TeamEnvelope<TeamAttendance[]> {
  meta: {
    date: string;
    recursive: boolean;
    team_size: number;
    viewing_team_of: TeamPerson | null;
    drill_path: TeamPerson[];
  };
  available_managers: TeamManager[];
}
export interface TeamSummary {
  date: string;
  team_size: number;
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  not_marked: number;
  checked_in: number;
}
export interface TeamLocation { employee: TeamPerson; last_punch: TeamPunch | null }
export interface TeamLocationsResponse extends TeamEnvelope<TeamLocation[]> {
  meta: { date: string; recursive: boolean; pins_count: number };
}
export interface TeamMemberDetail {
  employee: TeamPerson;
  attendance_date: string;
  status: string;
  first_in: string | null;
  last_out: string | null;
  work_minutes: number;
  late_minutes: number;
  is_geofence_valid: boolean | null;
  punches: TeamPunch[];
}
export interface TeamFilters { date: string; recursive: boolean; employee_uuid?: string }
