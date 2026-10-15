// types/payroll-period.ts

export interface PayrollPeriod {
  id: string;
  period_month: number;
  period_year: number;
  period_label: string;
  start_date: string;
  end_date: string;
  attendance_cutoff_date: string;
  processing_deadline: string;
  status: string;
  total_gross: string | null;
  total_deductions: string | null;
  total_net: string | null;
  total_employer_cost: string | null;
  employee_count: number | null;
  notes: string | null;
  processed_at: string | null;
  locked_at: string | null;
  paid_at: string | null;
  created_at: string;
  has_active_workflow: boolean;
  active_workflow: {
    uuid: string;
    run_type: string;
    selection_mode: string;
    selected_groups: any[];
    processing_step: string;
    status: string;
    started_at: string;
  } | null;
  workflows_count: number;
}

export interface PeriodFormPayload {
  period_month: number;
  period_year: number;
  start_date: string;
  end_date: string;
  attendance_cutoff_date: string;
  processing_deadline: string;
  notes?: string;
  auto_create_workflow?: boolean;
  workflow_run_type?: "regular" | "supplementary" | "bonus";
}

export interface PayrollPeriodsResponse {
  data: PayrollPeriod[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
  };
}