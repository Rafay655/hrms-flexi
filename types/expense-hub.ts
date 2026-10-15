/**
 * types/expense-hub.ts
 * ExpenseHub (Expense Management & Travel) — shared DTOs.
 * Mirrors the backend resources under /api/v1/expense-hub/*.
 */

export type ClaimStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "finance_verified"
  | "reimbursement_scheduled"
  | "reimbursed"
  | "revision_requested"
  | "rejected"
  | "cancelled"
  | "on_hold";

export type ClaimType = "regular" | "travel" | "medical" | "project_based";
export type PaymentMethod = "cash" | "personal_card" | "bank_transfer" | "corporate_card";
export type LineType = "expense" | "per_diem" | "mileage";
export type PolicyFlag = "over_limit" | "missing_receipt" | "duplicate_receipt" | "blackout" | null;
export type PerDiemTier = "tier_1" | "tier_2" | "tier_3" | "international";
export type VehicleType = "car" | "motorcycle" | "suv" | "van" | "other";
export type TripType = "domestic" | "international";


export interface ExpenseCategory {
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: number | null;
  receipt_required: boolean;
  receipt_required_above: string | null;
  is_blackout: boolean;
  requires_travel_request: boolean;
  status: "active" | "inactive";
  created_at?: string;
}

export interface ExpensePolicy {
  uuid: string;
  name: string;
  category_id: number | null;
  grade_band_id: number | null;
  department_id: number | null;
  max_amount_per_line: string | null;
  max_amount_per_claim: string | null;
  max_amount_monthly: string | null;
  auto_approve_below: string | null;
  receipt_required_above: string | null;
  is_blackout: boolean;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
}

export interface PerDiemRate {
  uuid: string;
  name: string;
  tier: PerDiemTier;
  country: string | null;
  city: string | null;
  grade_band_id: number | null;
  currency_id: number;
  meal_rate: string;
  lodging_rate: string;
  incidental_rate: string;
  daily_total: string;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
}

export interface MileageRate {
  uuid: string;
  vehicle_type: VehicleType;
  label: string | null;
  currency_id: number;
  rate_per_km: string;
  fuel_card_offset: boolean;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
}

export interface ExpenseSetting {
  uuid?: string;
  key: string;
  value: unknown;
  data_type?: "string" | "integer" | "decimal" | "boolean" | "json";
  group?: string;
}

export interface ExpenseClaimLineItem {
  uuid: string;
  category_id: number;
  category?: { uuid: string; name: string; code: string };
  line_type: LineType;
  expense_date: string;
  description: string | null;
  vendor: string | null;
  amount_claimed: string;
  amount_approved: string | null;
  currency_id: number;
  exchange_rate: string;
  amount_pkr: string;
  payment_method: PaymentMethod;
  has_receipt: boolean;
  expense_receipt_id: number | null;
  per_diem_rate_id: number | null;
  per_diem_days: number | null;
  mileage_rate_id: number | null;
  distance_km: string | null;
  route: string | null;
  policy_flag: PolicyFlag;
}

export interface ExpenseClaimApproval {
  level: number;
  role_key: string | null;
  status: "pending" | "approved" | "rejected" | "skipped";
  acted_by: number | null;
  comments: string | null;
  acted_at: string | null;
}

export interface ExpenseClaim {
  uuid: string;
  claim_number: string | null;
  title: string;
  claim_type: ClaimType;
  status: ClaimStatus;
  employee_id: number;
  employee?: {
    id: number;
    uuid: string;
    code: string;          // could be employee_code
    name?: string;         // add this
    employee_code?: string; // or use code as employee_code? Clarify.
    designation?: string;
    department?: string;
  };
  department_id: number | null;
  cost_center_id: number | null;
  travel_request_id: number | null;
  currency_id: number;
  total_amount_claimed: string;
  total_amount_approved: string;
  total_amount_pkr: string;
  advance_adjustment: string;
  payroll_month: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  finance_verified_at: string | null;
  scheduled_at: string | null;
  reimbursed_at: string | null;
  rejection_reason: string | null;
  revision_notes: string | null;
  hold_reason: string | null;
  created_at?: string;
  line_items?: ExpenseClaimLineItem[];
  approvals?: ExpenseClaimApproval[];
}

/** Payload shape for a claim line in create/update requests. */
export interface ClaimLinePayload {
  category_id: number | string;
  line_type?: LineType;
  expense_date: string;
  description?: string;
  vendor?: string;
  amount_claimed?: number;
  currency_id?: number;
  payment_method?: PaymentMethod;
  expense_receipt_id?: number;
  has_receipt?: boolean;
  per_diem_rate_id?: number | string;
  per_diem_days?: number;
  mileage_rate_id?: number | string;
  distance_km?: number;
  route?: string;
}


export interface ExpenseReceipt {
  uuid: string;
  employee_id: number;
  dms_document_id: number | null;
  original_filename: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  vendor: string | null;
  amount: string | null;
  currency_id: number | null;
  status: "pending" | "attached" | "flagged_duplicate";
  is_duplicate: boolean;
  created_at?: string;
}

export interface ExpenseDashboard {
  employee?: {
    my_pending_claims: number;
    reimbursed_this_month: number;
    travel_advances: number;
  };
  operations?: {
    pending_approvals: number;
    pending_verifications: number;
    reimbursement_queue: number;
    over_policy_claims: number;
    reimbursed_total_month: number;
  };
  management?: {
    committed_spend_pkr: number;
    spend_by_department: { department_id: number | null; total: number }[];
  };
}

export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface CorporateCard {
  uuid: string;
  card_holder_name: string;
  last_four: string;
  card_type: string;
  issuing_bank: string | null;
  employee_id: number | null;
  currency_id: number | null;
  status: "active" | "suspended" | "closed";
  assigned_at: string | null;
  created_at?: string;
}

export interface CorporateCardTransaction {
  uuid: string;
  corporate_card_id: number;
  transaction_date: string;
  merchant: string | null;
  amount: string;
  currency_id: number;
  reference: string | null;
  reconciliation_status: "unmatched" | "matched" | "disputed";
  matched_line_item_id: number | null;
  reconciled_at: string | null;
}

export interface ReimbursementFeedItem {
  reimbursement_uuid: string;
  claim_uuid: string | null;
  claim_number: string | null;
  employee_id: number;
  employee_code: string | null;
  payroll_month: string;
  amount: number;
  gross_amount: number;
  advance_adjustment: number;
  recovery_amount: number;
  payment_mode: "with_salary" | "separate";
  taxable: boolean;
  status: string;
}


// types/expense-hub.ts

export type TravelStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'settled';



export interface TravelRequest {
  uuid: string;
  request_number: string | null;
  status: TravelStatus;
  employee_id: number;
  employee?: {
    id: number;
    uuid: string;
    code: string;
  };
  department_id: number | null;
  trip_type: 'domestic' | 'international';
  destination_city: string | null;
  destination_country: string | null;
  purpose: string;
  start_date: string;
  end_date: string;
  itinerary: any; // adjust as needed
  currency_id: number | null;
  estimated_amount: string | null;
  per_diem_estimate: string | null;
  advance_amount: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  settlement_claim_id: string | null;
  created_at: string;
}

export interface TravelRequestPayload {
  employee_id?: number;
  department_id?: number | null;
  trip_type?: 'domestic' | 'international';
  destination_city?: string | null;
  destination_country?: string | null;
  purpose?: string;
  start_date?: string;
  end_date?: string;
  itinerary?: any;
  currency_id?: number | null;
  estimated_amount?: number | null;
  advance_amount?: number | null;
  per_diem_rate_id?: number | null;
  per_diem_estimate?: number | null;
}

export interface SettleTravelPayload {
  settlement_claim_id: string;
  advance_used: number;
  shortfall_recovered: number;
  surplus_payable: number;
}