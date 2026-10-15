/**
 * services/expense-hub.ts
 * ExpenseHub (Expense Management & Travel) — API client.
 *
 * Delegates to the shared axios instance at @/lib/api.
 * URL prefix: /expense-hub (backend: routes/expense-hub.php → /api/v1/expense-hub/*).
 * Responses follow the { success, message, data } envelope; this client unwraps `data.data`.
 */

import { api } from "@/lib/api";
import type {
  ClaimLinePayload,
  CorporateCard,
  CorporateCardTransaction,
  ExpenseCategory,
  ExpenseClaim,
  ExpenseDashboard,
  ExpensePolicy,
  ExpenseReceipt,
  ExpenseSetting,
  MileageRate,
  Paginated,
  PageMeta,
  PerDiemRate,
  ReimbursementFeedItem,

  TravelRequest, TravelRequestPayload, SettleTravelPayload
} from "@/types/expense-hub";

const BASE = "/expense-hub";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: { data: { data: any } }): any {
  return res.data.data;
}

/** Unwrap a list response into { items, meta }. Falls back to a single-page meta. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function paginate(res: { data: { data: any; meta?: PageMeta } }): Paginated<any> {
  const items = res.data.data ?? [];
  const meta = res.data.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: items.length,
    total: items.length,
    from: items.length ? 1 : null,
    to: items.length || null,
  };
  return { items, meta };
}

export interface ClaimPayload {
  employee_id: number | string;
  title: string;
  claim_type?: string;
  department_id?: number | null;
  cost_center_id?: number | null;
  currency_id?: number;
  travel_request_id?: number | null;
  line_items?: ClaimLinePayload[];
}

export interface TravelPayload {
  employee_id: number | string;
  trip_type?: string;
  destination_city?: string;
  destination_country?: string;
  purpose: string;
  start_date: string;
  end_date: string;
  itinerary?: unknown;
  currency_id?: number;
  estimated_amount?: number;
  advance_amount?: number;
  per_diem_rate_id?: number;
}

export const expenseHubService = {
  // ── Dashboard + reports ─────────────────────────────────────────────────────
  dashboard: (): Promise<ExpenseDashboard> => api.get(`${BASE}/dashboard`).then(unwrap),
  reportSummary: (params?: Record<string, unknown>): Promise<{ group_by: string; rows: unknown[] }> =>
    api.get(`${BASE}/reports/summary`, { params }).then(unwrap),
  reportBudgetVsActual: (): Promise<unknown[]> => api.get(`${BASE}/reports/budget-vs-actual`).then(unwrap),
  reportPolicyViolations: (params?: Record<string, unknown>): Promise<unknown[]> =>
    api.get(`${BASE}/reports/policy-violations`, { params }).then(unwrap),
  reportTravelSpend: (): Promise<unknown[]> => api.get(`${BASE}/reports/travel-spend`).then(unwrap),
  reportReimbursementRegister: (params?: Record<string, unknown>): Promise<unknown[]> =>
    api.get(`${BASE}/reports/reimbursement-register`, { params }).then(unwrap),

  // ── Categories ──────────────────────────────────────────────────────────────
  getCategories: (params?: Record<string, unknown>): Promise<Paginated<ExpenseCategory>> =>
    api.get(`${BASE}/categories`, { params }).then(paginate),
  createCategory: (payload: Partial<ExpenseCategory>): Promise<ExpenseCategory> =>
    api.post(`${BASE}/categories`, payload).then(unwrap),
  updateCategory: (uuid: string, payload: Partial<ExpenseCategory>): Promise<ExpenseCategory> =>
    api.put(`${BASE}/categories/${uuid}`, payload).then(unwrap),
  deleteCategory: (uuid: string): Promise<void> =>
    api.delete(`${BASE}/categories/${uuid}`).then(() => undefined),

  // ── Policies ──────────────────────────────────────────────────────────────────
  getPolicies: (params?: Record<string, unknown>): Promise<Paginated<ExpensePolicy>> =>
    api.get(`${BASE}/policies`, { params }).then(paginate),
  createPolicy: (payload: Partial<ExpensePolicy>): Promise<ExpensePolicy> =>
    api.post(`${BASE}/policies`, payload).then(unwrap),
  updatePolicy: (uuid: string, payload: Partial<ExpensePolicy>): Promise<ExpensePolicy> =>
    api.put(`${BASE}/policies/${uuid}`, payload).then(unwrap),
  deletePolicy: (uuid: string): Promise<void> =>
    api.delete(`${BASE}/policies/${uuid}`).then(() => undefined),

  // ── Per-diem rates ──────────────────────────────────────────────────────────
  getPerDiemRates: (params?: Record<string, unknown>): Promise<Paginated<PerDiemRate>> =>
    api.get(`${BASE}/per-diem-rates`, { params }).then(paginate),
  createPerDiemRate: (payload: Partial<PerDiemRate>): Promise<PerDiemRate> =>
    api.post(`${BASE}/per-diem-rates`, payload).then(unwrap),
  updatePerDiemRate: (uuid: string, payload: Partial<PerDiemRate>): Promise<PerDiemRate> =>
    api.put(`${BASE}/per-diem-rates/${uuid}`, payload).then(unwrap),
  deletePerDiemRate: (uuid: string): Promise<void> =>
    api.delete(`${BASE}/per-diem-rates/${uuid}`).then(() => undefined),

  // ── Mileage rates ──────────────────────────────────────────────────────────────
  getMileageRates: (params?: Record<string, unknown>): Promise<Paginated<MileageRate>> =>
    api.get(`${BASE}/mileage-rates`, { params }).then(paginate),
  createMileageRate: (payload: Partial<MileageRate>): Promise<MileageRate> =>
    api.post(`${BASE}/mileage-rates`, payload).then(unwrap),
  updateMileageRate: (uuid: string, payload: Partial<MileageRate>): Promise<MileageRate> =>
    api.put(`${BASE}/mileage-rates/${uuid}`, payload).then(unwrap),
  deleteMileageRate: (uuid: string): Promise<void> =>
    api.delete(`${BASE}/mileage-rates/${uuid}`).then(() => undefined),

  // ── Settings ──────────────────────────────────────────────────────────────────
  getSettings: (): Promise<ExpenseSetting[]> => api.get(`${BASE}/settings`).then(unwrap),
  saveSettings: (settings: ExpenseSetting[]): Promise<void> =>
    api.put(`${BASE}/settings`, { settings }).then(() => undefined),

  // ── Claims ──────────────────────────────────────────────────────────────────────
  getClaims: (params?: Record<string, unknown>): Promise<Paginated<ExpenseClaim>> =>
    api.get(`${BASE}/claims`, { params }).then(paginate),
  myClaims: (params?: Record<string, unknown>): Promise<Paginated<ExpenseClaim>> =>
    api.get(`${BASE}/ess/my-claims`, { params }).then(paginate),
  getClaim: (uuid: string): Promise<ExpenseClaim> => api.get(`${BASE}/claims/${uuid}`).then(unwrap),
  createClaim: (payload: ClaimPayload): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims`, payload).then(unwrap),
  updateClaim: (uuid: string, payload: Partial<ClaimPayload>): Promise<ExpenseClaim> =>
    api.put(`${BASE}/claims/${uuid}`, payload).then(unwrap),
  submitClaim: (uuid: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/submit`).then(unwrap),
  cancelClaim: (uuid: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/cancel`).then(unwrap),

  // ── Approval actions ─────────────────────────────────────────────────────────
  pendingApprovals: (): Promise<ExpenseClaim[]> =>
    api.get(`${BASE}/approvals/pending`).then(unwrap),
  approveClaim: (
    uuid: string,
    payload?: { comments?: string; line_approvals?: Record<string, number> },
  ): Promise<ExpenseClaim> => api.post(`${BASE}/claims/${uuid}/approve`, payload ?? {}).then(unwrap),
  rejectClaim: (uuid: string, reason: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/reject`, { reason }).then(unwrap),
  requestRevision: (uuid: string, notes: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/revision`, { notes }).then(unwrap),

  // ── Finance transitions ───────────────────────────────────────────────────────
  verifyClaim: (uuid: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/verify`).then(unwrap),
  scheduleClaim: (uuid: string, payrollMonth: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/schedule`, { payroll_month: payrollMonth }).then(unwrap),
  reimburseClaim: (uuid: string, reference?: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/reimburse`, { reference }).then(unwrap),
  holdClaim: (uuid: string, reason: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/hold`, { reason }).then(unwrap),
  resumeClaim: (uuid: string, to: string): Promise<ExpenseClaim> =>
    api.post(`${BASE}/claims/${uuid}/resume`, { to }).then(unwrap),

  // ── Travel requests ─────────────────────────────────────────────────────────────
getTravelRequests: (params?: any) =>
    api.get<{ data: TravelRequest[]; meta: any }>('/expense-hub/travel-requests', { params }),

  getTravelRequest: (uuid: string) =>
    api.get<{ data: TravelRequest }>(`/expense-hub/travel-requests/${uuid}`),

  createTravelRequest: (payload: TravelRequestPayload) =>
    api.post<{ data: TravelRequest }>('/expense-hub/travel-requests', payload),

  updateTravelRequest: (uuid: string, payload: TravelRequestPayload) =>
    api.put<{ data: TravelRequest }>(`/expense-hub/travel-requests/${uuid}`, payload),

  submitTravel: (uuid: string) =>
    api.post<{ data: TravelRequest }>(`/expense-hub/travel-requests/${uuid}/submit`),

  cancelTravel: (uuid: string) =>
    api.post<{ data: TravelRequest }>(`/expense-hub/travel-requests/${uuid}/cancel`),

  settleTravel: (uuid: string, payload: SettleTravelPayload) =>
    api.post<{ data: TravelRequest }>(`/expense-hub/travel-requests/${uuid}/settle`, payload),

  // ── Receipts (over DMS) ────────────────────────────────────────────────────────
  getReceipts: (params?: Record<string, unknown>): Promise<Paginated<ExpenseReceipt>> =>
    api.get(`${BASE}/receipts`, { params }).then(paginate),
  uploadReceipt: (form: FormData): Promise<ExpenseReceipt> =>
    api
      .post(`${BASE}/receipts`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then(unwrap),

  // ── PayEdge reimbursement feed (machine/finance) ─────────────────────────────
  payrollFeed: (month: string): Promise<ReimbursementFeedItem[]> =>
    api.get(`${BASE}/payroll/feed/${month}`).then(unwrap),
  outstanding: (employeeId: number): Promise<unknown[]> =>
    api.get(`${BASE}/payroll/outstanding/${employeeId}`).then(unwrap),

  // ── Corporate cards + reconciliation (Phase 3) ───────────────────────────────
  getCards: (params?: Record<string, unknown>): Promise<Paginated<CorporateCard>> =>
    api.get(`${BASE}/cards`, { params }).then(paginate),
  createCard: (payload: Partial<CorporateCard>): Promise<CorporateCard> =>
    api.post(`${BASE}/cards`, payload).then(unwrap),
  updateCard: (uuid: string, payload: Partial<CorporateCard>): Promise<CorporateCard> =>
    api.put(`${BASE}/cards/${uuid}`, payload).then(unwrap),
  deleteCard: (uuid: string): Promise<void> =>
    api.delete(`${BASE}/cards/${uuid}`).then(() => undefined),
  getCardTransactions: (params?: Record<string, unknown>): Promise<Paginated<CorporateCardTransaction>> =>
    api.get(`${BASE}/cards/transactions`, { params }).then(paginate),
  addCardTransaction: (
    cardUuid: string,
    payload: Partial<CorporateCardTransaction>,
  ): Promise<CorporateCardTransaction> =>
    api.post(`${BASE}/cards/${cardUuid}/transactions`, payload).then(unwrap),
  reconcileTransaction: (txnUuid: string, lineUuid: string): Promise<CorporateCardTransaction> =>
    api.post(`${BASE}/cards/transactions/${txnUuid}/reconcile`, { line_uuid: lineUuid }).then(unwrap),
  unreconcileTransaction: (txnUuid: string): Promise<CorporateCardTransaction> =>
    api.post(`${BASE}/cards/transactions/${txnUuid}/unreconcile`).then(unwrap),
};
