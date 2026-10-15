export interface LwpRecord {
  uuid: string;
  employee: {
    uuid: string;
    name: string | null;
  };
  absence_date: string;         // YYYY-MM-DD
  lwp_days: number;
  source: 'manual' | 'auto';
  daily_attendance_id: number | null;
  payroll_included: boolean;
  payroll_period_id: number | null;
  hr_notes: string | null;
  created_by: {
    uuid: string | null;
    name: string | null;
  };
  created_at: string;
}

export interface LwpFormData {
  employee_id: string;          // UUID of employee
  absence_date: string;         // YYYY-MM-DD
  lwp_days: number;             // 0.5 – 30
  hr_notes: string;
}

export interface PaginatedLwpResponse {
  success: boolean;
  message: string;
  data: {
    data: LwpRecord[];
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