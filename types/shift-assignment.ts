export interface Employee {
  id: number;
  uuid: string;
  employee_code: string;
  name: string;
  gross_salary?: string;
}

export interface Shift {
  id: string;       // UUID
  internal_id: number;
  name: string;
  code: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  is_night_shift: boolean;
}

export interface ShiftAssignment {
  id: string;               // UUID
  internal_id: number;
  company_id: number;
  employee_id: string;      // UUID
  employee_internal_id: number;
  employee: Employee;
  shift_id: string;         // UUID
  shift_internal_id: number;
  shift: Shift;
  valid_from: string;       // "YYYY-MM-DD"
  valid_to: string | null;
  assigned_by: number;
  assigned_by_user: {
    id: number;
    name: string;
    email: string;
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShiftAssignmentFormData {
  employee_id: string;     // UUID
  shift_id: string;        // UUID
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
}

export interface ShiftAssignmentApiPayload {
  employee_id: string;
  shift_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
}

export interface PaginatedShiftAssignmentsResponse {
  success: boolean;
  message: string;
  data: ShiftAssignment[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}