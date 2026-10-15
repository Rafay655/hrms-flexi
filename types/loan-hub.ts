/**
 * types/loan-hub.ts
 * LoanHub (Loan & Advance Management) — shared DTOs.
 *
 * Mirrors the backend resources under app/Http/Resources/LoanHub/* and the
 * report/recovery payloads. Money values arrive as numbers or numeric strings
 * (decimal casts) — components should coerce with Number() before formatting.
 */

export type LoanCategory = "advance" | "loan";
export type InterestType = "interest_free" | "fixed_flat" | "reducing_balance";

export type ApplicationStatus =
  | "draft" | "submitted" | "pending_l1" | "pending_l2"
  | "approved" | "rejected" | "revision_requested" | "cancelled";

export type LoanStatus =
  | "approved" | "disbursed" | "active" | "on_hold"
  | "closed" | "closed_via_ff" | "written_off" | "cancelled";

export type EmiStatus = "scheduled" | "due" | "paid" | "partial" | "missed" | "waived" | "adjusted";

export type DisbursementMethod = "bank_transfer" | "cash" | "cheque" | "salary_addition";

// ── Config ──────────────────────────────────────────────────────────────────

export interface LoanType {
  id: number;
  uuid: string;
  company_id: number | null;
  is_system: boolean;
  code: string;
  name: string;
  name_ur: string | null;
  category: LoanCategory;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoanPolicy {
  uuid: string;
  company_id: number | null;
  is_system: boolean;
  loan_type_id: number;
  loan_type?: { uuid: string; code: string; name: string; category: LoanCategory };
  grade_min_id: number | null;
  grade_max_id: number | null;
  branch_id: number | null;
  min_tenure_months: number;
  probation_allowed: boolean;
  allowed_contract_types: string[];
  min_amount: number | string;
  max_amount_absolute: number | string | null;
  max_amount_salary_multiple: number | string | null;
  min_tenure: number;
  max_tenure: number;
  interest_type: InterestType;
  interest_rate: number | string;
  max_concurrent_loans: number;
  max_concurrent_same_type: number;
  cooling_period_months: number;
  auto_deduct_salary: boolean;
  max_emi_pct_of_gross: number | string;
  recovery_start_offset_months: number;
  requires_guarantor: boolean;
  requires_documents: boolean;
  approval_matrix: unknown[];
  allow_prepayment: boolean;
  prepayment_penalty_pct: number | string;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
}

export interface LoanSetting {
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  source?: "global" | "company";
}

// ── Applications ────────────────────────────────────────────────────────────

export interface EligibilityCheck {
  rule: string;
  passed: boolean;
  message: string;
}

export interface EligibilityResult {
  passed: boolean;
  checks: EligibilityCheck[];
  computed: {
    gross_salary?: number | null;
    existing_emi?: number;
    new_emi?: number;
    eligible_min?: number;
    eligible_max?: number | null;
    emi_to_gross?: number | null;
  };
}

export interface LoanApproval {
  uuid: string;
  approval_level: number;
  approver_role: string | null;
  approver_id: number | null;
  status: "pending" | "approved" | "rejected" | "revision_requested";
  approved_amount: number | string | null;
  comments: string | null;
  decided_at: string | null;
  created_at?: string;
}

export interface LoanApplication {
  uuid: string;
  application_number: string | null;
  status: ApplicationStatus;
  category: LoanCategory;
  employee_id: number;
  employee?: { id: number; uuid: string; code: string | null };
  loan_type_id: number;
  loan_type?: { uuid: string; code: string; name: string; category: LoanCategory };
  requested_amount: number | string;
  approved_amount: number | string | null;
  requested_tenure_months: number;
  approved_tenure_months: number | null;
  interest_type: InterestType;
  interest_rate: number | string;
  purpose: string;
  purpose_detail: string | null;
  recovery_start_month: string | null;
  deduction_priority: number;
  guarantor_employee_id: number | null;
  remarks: string | null;
  rejection_reason: string | null;
  revision_notes: string | null;
  eligibility_snapshot: EligibilityResult | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string | null;
  approvals?: LoanApproval[];
  loan?: {
    uuid: string;
    loan_number: string | null;
    status: LoanStatus;
    principal_amount: number | string;
    emi_amount: number | string;
    total_repayable: number | string;
    outstanding_balance: number | string;
  } | null;
}

// ── Loans ───────────────────────────────────────────────────────────────────

export interface LoanEmiRow {
  uuid: string;
  emi_number: number;
  due_date: string | null;
  emi_amount: number | string;
  principal_component: number | string;
  interest_component: number | string;
  opening_balance: number | string;
  closing_balance: number | string;
  actual_paid: number | string;
  paid_date: string | null;
  status: EmiStatus;
  shortfall: number | string;
}

export interface LoanTransactionRow {
  uuid: string;
  transaction_type: string;
  transaction_date: string | null;
  debit_amount: number | string;
  credit_amount: number | string;
  running_balance: number | string;
  reference_type: string | null;
  reference_id: number | null;
  description: string | null;
  created_at?: string;
}

export interface Loan {
  uuid: string;
  loan_number: string | null;
  status: LoanStatus;
  category: LoanCategory;
  employee_id: number;
  employee?: { id: number; uuid: string; code: string | null };
  loan_type_id: number;
  loan_type?: { uuid: string; code: string; name: string; category: LoanCategory };
  principal_amount: number | string;
  interest_type: InterestType;
  interest_rate: number | string;
  total_interest: number | string;
  total_repayable: number | string;
  emi_amount: number | string;
  tenure_months: number;
  total_emis: number;
  emis_paid: number;
  amount_paid: number | string;
  outstanding_balance: number | string;
  deduction_priority: number;
  recovery_start_date: string | null;
  expected_closure_date: string | null;
  actual_closure_date: string | null;
  disbursement_date: string | null;
  disbursement_method: DisbursementMethod | null;
  disbursement_reference: string | null;
  guarantor_employee_id: number | null;
  closure_type: string | null;
  perquisite_applicable: boolean;
  created_at: string | null;
  schedule?: LoanEmiRow[];
  transactions?: LoanTransactionRow[];
}

// ── EMI calculator / reports ─────────────────────────────────────────────────

export interface EmiCalcResult {
  principal: number;
  tenure_months: number;
  interest_type: InterestType;
  interest_rate: number;
  emi_amount: number;
  total_interest: number;
  total_repayable: number;
  schedule: Array<{
    emi_number: number;
    due_date: string | null;
    emi_amount: number;
    principal_component: number;
    interest_component: number;
    opening_balance: number;
    closing_balance: number;
  }>;
}

export interface LoanDashboard {
  active_count: number;
  total_outstanding: number;
  avg_emi: number;
  default_count: number;
  outstanding_by_type: Array<{ code: string; name: string; count: number; outstanding: number }>;
  recovery_this_month: { expected: number; actual: number };
  top_borrowers: Array<{ employee_id: number; outstanding: number }>;
  upcoming_closures: Array<{
    uuid: string;
    loan_number: string | null;
    employee_id: number;
    outstanding_balance: number;
    expected_closure_date: string | null;
  }>;
}

export interface Paginated<T> {
  data: T[];
  // Laravel pagination meta (when present)
  current_page?: number;
  last_page?: number;
  total?: number;
}
