export type ExceptionSeverity = 'high' | 'medium' | 'low';
export type ExceptionStatus = 'pending' | 'escalated' | 'resolved' | 'all';
export type ExceptionCategory = 'all' | 'missing_punch' | 'late_early' | 'geo_violation' | 'fraud_alerts';
export interface ExceptionFilters {
  date_from?: string; date_to?: string; date?: string;
  status?: ExceptionStatus; category?: ExceptionCategory; search?: string; type?: string;
  severity?: ExceptionSeverity; min_severity?: ExceptionSeverity;
  department_id?: number; employee_id?: string; page: number; per_page: number;
}
export interface AttendanceException {
  id: string;
  exception_code?: string;
  date: string;
  type: string;
  severity: ExceptionSeverity;
  status: string;
  employee: { id?: string; uuid?: string; name: string; employee_code: string; department_id?: number | null; department?: string | { name?: string } | null };
  label?: string;
  message?: string;
  description?: string;
  details?: unknown;
  [key: string]: unknown;
}
export interface ExceptionListResponse {
  success: boolean; message: string; data: AttendanceException[];
  meta: { total: number; current_page: number; per_page: number; last_page: number; date_from?: string; date_to?: string;
    summary?: { by_type?: Record<string, number>; by_severity?: Partial<Record<ExceptionSeverity, number>>; affected_employees?: number; [key: string]: unknown };
  };
}
