/**
 * types/ess-leave.ts
 * ESS Leave (ESS-LEAVE-01…) — DTOs for the employee's own leave.
 *
 * Mirrors the LeaveEase resources and the eager-loads their repositories actually apply.
 * Keep in step: the backend is the contract, this is the client's view.
 *
 * ⚠️ These describe LeaveEase-owned endpoints that ESS CONSUMES — it does not re-export them.
 *   - GET /v1/leave-ease/balances/my   (no permission; any auth user, self-scoped)
 *   - GET /v1/leave-ease/requests       (leave-request.view OR .create; self-scoped in the VM)
 *   - GET /v1/leave-ease/comp-off/my    (leave-balance.view OR comp_off.approve; self-scoped)
 *
 * The `requests` self-scoping is the fix from 2026-07-17 (LE-04) — see
 * ListLeaveRequestsViewModel. Do not add an employee_id param to the request-list call here.
 */

/** LeaveRequest.status enum — transcribed from the migration, not invented. */
export type LeaveRequestStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "revoked";

/** CompOffRecord.status enum. Distinct from leave-request status (note pending_approval). */
export type CompOffStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "expired";

/**
 * A leave balance for one leave type in one year.
 *
 * available = opening + earned + carried_forward − used − encashed (stored, not derived here).
 * `leave_type` is always present on balances/my — the repo eager-loads it (leaveType:id,uuid,
 * name,code,is_paid,is_encashable).
 */
export type LeaveBalance = {
  id: string;
  year: number;
  leave_type: {
    id: string;
    name: string;
    code: string;
    is_paid: boolean;
    is_encashable: boolean;
  } | null;
  opening_balance: number;
  earned_balance: number;
  carried_forward: number;
  used_balance: number;
  encashed_balance: number;
  available_balance: number;
  locked: boolean;
};

/**
 * A leave request. `leave_type` is eager-loaded with only name+code on the list endpoint, so
 * is_paid is not meaningful here — omitted rather than typed as an always-false field.
 */
export type LeaveRequestRow = {
  id: string;
  leave_type: { id: string; name: string; code: string } | null;
  from_date: string | null;
  to_date: string | null;
  is_half_day: boolean;
  half_day_session: string | null;
  total_days: number;
  reason: string | null;
  status: LeaveRequestStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string | null;
};

/** A comp-off credit. Has NO leave type — it is time earned, not a leave category. */
export type CompOffRow = {
  id: string;
  holiday_date: string | null;
  hours_worked: number | null;
  credit_type: string | null;
  credit_days: number | null;
  status: CompOffStatus;
  approved_at: string | null;
  expires_at: string | null;
};

// ── Response envelopes ───────────────────────────────────────────────────────
//
// balances/my and comp-off/my use the FLAT { success, message, data: [...] } shape.
// requests uses a PAGINATED { success, message, data: { data: [...], meta } } shape.

export type MyLeaveBalancesResponse = { data: LeaveBalance[] };
export type MyCompOffResponse = { data: CompOffRow[] };

export type MyLeaveRequestsResponse = {
  data: LeaveRequestRow[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};
