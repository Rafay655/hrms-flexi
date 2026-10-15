export type RosterStatus = 'draft' | 'published' | 'cancelled';

export interface RosterAssignment {
  id: string;              // UUID
  employee_id: string;     // UUID
  employee?: {
    uuid: string;
    employee_code: string;
    name: string;
  };
  shift_id: string | null; // UUID or null
  shift?: {
    uuid: string;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
  } | null;
  roster_date: string;     // "YYYY-MM-DD"
  is_weekly_off: boolean;
  is_holiday: boolean;
  status: RosterStatus;
  notes: string | null;
  template_id: string | null; // UUID or null
  template?: {
    uuid: string;
    name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface RosterFormData {
  employee_id: string;     // UUID
  shift_id: string;        // UUID or empty string
  roster_date: string;     // YYYY-MM-DD
  is_weekly_off: boolean;
  is_holiday: boolean;
  status: RosterStatus;
  notes: string;
  template_id: string;     // UUID or empty string
}

export interface RosterApiPayload {
  employee_id: string;
  shift_id: string | null;
  roster_date: string;
  is_weekly_off: boolean;
  is_holiday: boolean;
  status: RosterStatus;
  notes: string | null;
  template_id: string | null;
}

export interface PaginatedRostersResponse {
  success: boolean;
  message: string;
  data: RosterAssignment[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}