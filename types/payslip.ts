// types/payslip.ts

export interface Payslip {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  employee_initials: string;
  designation: string;
  department: string;
  grade: string;
  period_month: number;
  period_year: number;
  period_label: string;
  gross_pay: number;
  deductions: number;
  net_salary: number;
  status: string;
  status_color: string;
  file_path: string;
  is_emailed: boolean;
  emailed_at: string | null;
  download_count: number;
  created_at: string;
}

export interface PayslipsResponse {
  success: boolean;
  message: string;
  data: Payslip[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}