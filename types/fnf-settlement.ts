// types/fnf-settlement.ts

export interface FnfSettlement {
  id: string;
  employee_id: string;
  employee_name: string;
  last_working_date: string;
  settlement_date: string;
  total_earnings: string;
  total_deductions: string;
  net_settlement: string;
  gratuity_amount: string;
  leave_encashment_amount: string;
  notice_period_recovery: string;
  pending_loan_balance: string;
  pending_expense_claims: string;
  pro_rata_salary: string;
  final_tax_deduction: string;
  status: string;
  payment_reference: string | null;
  paid_at: string | null;
  approved_at: string | null;
  notes: string | null;
}

export interface FnfSettlementsResponse {
  success: boolean;
  message: string;
  data: FnfSettlement[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

// ── Exit related types (used to pick an employee from active exits) ──

export interface ExitEmployee {
  id: string;           // employee uuid
  employee_code: string;
  name: string;
  email: string;
}

export interface ExitItem {
  id: string;           // separation_id
  exit_type: string;
  initiated_by: string;
  status: string;
  status_label: string;
  employee: ExitEmployee;
  resignation_date: string;
  notice_period_days: number;
  notice_period_waived: boolean;
  notice_waiver_reason: string | null;
  last_working_date: string;
  exit_reason: string;
  exit_reason_detail: string | null;
  exit_interview_scheduled: boolean;
  exit_interview_date: string | null;
  clearance_percentage: number;
  clearance_completed_at: string | null;
  blacklisted: boolean;
  blacklist_reason: string | null;
  rehire_eligible: boolean;
  created_by: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface ExitsResponse {
  success: boolean;
  message: string;
  data: {
    items: ExitItem[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  };
}