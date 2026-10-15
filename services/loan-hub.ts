/**
 * services/loan-hub.ts
 * LoanHub (Loan & Advance Management) — API client.
 *
 * All methods delegate to the shared axios instance at @/lib/api.
 * URL prefix: /loans  (backend: routes/loan-hub.php → /api/v1/loans/*)
 *
 * Responses follow the { success, message, data } envelope; this client unwraps
 * `data.data`. List endpoints return the resource array under data (pagination meta,
 * when present, sits alongside).
 */

import { api } from "@/lib/api";
import type {
  EligibilityResult,
  EmiCalcResult,
  Loan,
  LoanApplication,
  LoanDashboard,
  LoanPolicy,
  LoanSetting,
  LoanType,
} from "@/types/loan-hub";

const BASE = "/loans";

// Unwraps the { success, message, data } envelope. Returns `any` so each method's
// own Promise<T> return annotation stays the single source of truth for the type
// (axios types response.data as `any`, so a generic here cannot infer T).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: { data: { data: any } }): any {
  return res.data.data;
}

export const loanHubService = {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: (): Promise<LoanDashboard> => api.get(`${BASE}/dashboard`).then(unwrap),

  // ── Loan types ────────────────────────────────────────────────────────────
  getTypes: (params?: Record<string, unknown>): Promise<LoanType[]> =>
    api.get(`${BASE}/types`, { params }).then(unwrap),
  createType: (payload: Partial<LoanType>): Promise<LoanType> =>
    api.post(`${BASE}/types`, payload).then(unwrap),
  updateType: (uuid: string, payload: Partial<LoanType>): Promise<LoanType> =>
    api.put(`${BASE}/types/${uuid}`, payload).then(unwrap),
  deleteType: (uuid: string): Promise<void> => api.delete(`${BASE}/types/${uuid}`).then(() => undefined),

  // ── Policies ──────────────────────────────────────────────────────────────
  getPolicies: (params?: Record<string, unknown>): Promise<LoanPolicy[]> =>
    api.get(`${BASE}/policies`, { params }).then(unwrap),
  createPolicy: (payload: Partial<LoanPolicy>): Promise<LoanPolicy> =>
    api.post(`${BASE}/policies`, payload).then(unwrap),
  updatePolicy: (uuid: string, payload: Partial<LoanPolicy>): Promise<LoanPolicy> =>
    api.put(`${BASE}/policies/${uuid}`, payload).then(unwrap),
  deletePolicy: (uuid: string): Promise<void> => api.delete(`${BASE}/policies/${uuid}`).then(() => undefined),

  // ── Settings ──────────────────────────────────────────────────────────────
  getSettings: (): Promise<LoanSetting[]> => api.get(`${BASE}/settings`).then(unwrap),
  updateSettings: (settings: Array<Pick<LoanSetting, "setting_key" | "setting_value">>): Promise<void> =>
    api.put(`${BASE}/settings`, { settings }).then(() => undefined),

  // ── Eligibility + EMI calculator ───────────────────────────────────────────
  eligibilityCheck: (params: {
    employee_id: number | string;
    loan_type_id: number;
    amount: number;
    tenure: number;
  }): Promise<EligibilityResult> => api.get(`${BASE}/eligibility-check`, { params }).then(unwrap),

  emiCalculator: (params: {
    amount: number;
    tenure: number;
    interest_type: string;
    rate?: number;
  }): Promise<EmiCalcResult> => api.get(`${BASE}/emi-calculator`, { params }).then(unwrap),

  // ── Applications ──────────────────────────────────────────────────────────
  getApplications: (params?: Record<string, unknown>): Promise<LoanApplication[]> =>
    api.get(`${BASE}/applications`, { params }).then(unwrap),
  getApplication: (uuid: string): Promise<LoanApplication> =>
    api.get(`${BASE}/applications/${uuid}`).then(unwrap),
  createApplication: (payload: Record<string, unknown>): Promise<LoanApplication> =>
    api.post(`${BASE}/applications`, payload).then(unwrap),
  updateApplication: (uuid: string, payload: Record<string, unknown>): Promise<LoanApplication> =>
    api.put(`${BASE}/applications/${uuid}`, payload).then(unwrap),
  submitApplication: (uuid: string): Promise<LoanApplication> =>
    api.post(`${BASE}/applications/${uuid}/submit`).then(unwrap),
  cancelApplication: (uuid: string): Promise<LoanApplication> =>
    api.post(`${BASE}/applications/${uuid}/cancel`).then(unwrap),

  // ── Approvals ─────────────────────────────────────────────────────────────
  getPendingApprovals: (): Promise<LoanApplication[]> =>
    api.get(`${BASE}/approvals/pending`).then(unwrap),
  approve: (uuid: string, payload?: Record<string, unknown>): Promise<LoanApplication> =>
    api.post(`${BASE}/approvals/${uuid}/approve`, payload ?? {}).then(unwrap),
  reject: (uuid: string, reason: string): Promise<LoanApplication> =>
    api.post(`${BASE}/approvals/${uuid}/reject`, { reason }).then(unwrap),
  requestRevision: (uuid: string, notes: string): Promise<LoanApplication> =>
    api.post(`${BASE}/approvals/${uuid}/revision`, { notes }).then(unwrap),

  // ── Active loans ──────────────────────────────────────────────────────────
  getLoans: (params?: Record<string, unknown>): Promise<Loan[]> =>
    api.get(`${BASE}/active`, { params }).then(unwrap),
  getMine: (): Promise<{ loans: Loan[]; applications: LoanApplication[] }> =>
    api.get(`${BASE}/my`).then(unwrap),
  getLoan: (uuid: string): Promise<Loan> => api.get(`${BASE}/${uuid}`).then(unwrap),
  disburse: (uuid: string, payload: Record<string, unknown>): Promise<Loan> =>
    api.post(`${BASE}/${uuid}/disburse`, payload).then(unwrap),
  prepay: (uuid: string, payload: Record<string, unknown>): Promise<{ loan: Loan; breakdown: Record<string, unknown> }> =>
    api.post(`${BASE}/${uuid}/prepay`, payload).then(unwrap),
  hold: (uuid: string, payload: Record<string, unknown>): Promise<Loan> =>
    api.post(`${BASE}/${uuid}/hold`, payload).then(unwrap),
  resume: (uuid: string): Promise<Loan> => api.post(`${BASE}/${uuid}/resume`).then(unwrap),
  writeOff: (uuid: string, reason: string): Promise<Loan> =>
    api.post(`${BASE}/${uuid}/write-off`, { reason }).then(unwrap),
  adjust: (uuid: string, payload: Record<string, unknown>): Promise<Loan> =>
    api.post(`${BASE}/${uuid}/adjust`, payload).then(unwrap),
  recalculate: (uuid: string): Promise<Loan> =>
    api.post(`${BASE}/${uuid}/recalculate`).then(unwrap),

  // ── Guarantor lifecycle ─────────────────────────────────────────────────────
  guarantorAccept: (uuid: string): Promise<{ guarantor_uuid: string; accepted_at: string | null }> =>
    api.post(`${BASE}/${uuid}/guarantor/accept`).then(unwrap),
  guarantorRelease: (uuid: string, reason: string): Promise<{ guarantor_uuid: string; status: string }> =>
    api.post(`${BASE}/${uuid}/guarantor/release`, { reason }).then(unwrap),

  // ── Statement (PDF download, also archived to DMS server-side) ───────────────
  // Object URL for inline preview (printable statement page). Caller revokes it.
  fetchStatementBlobUrl: async (uuid: string): Promise<string> => {
    const res = await api.get(`${BASE}/${uuid}/statement`, { responseType: "blob" });
    return window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  },
  downloadStatement: async (uuid: string, loanNumber: string): Promise<void> => {
    const res = await api.get(`${BASE}/${uuid}/statement`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan-statement-${loanNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── ESS extras ──────────────────────────────────────────────────────────────
  installmentCalendar: (): Promise<{
    installments: Array<{ loan_number: string; loan_uuid: string; installment_number: number; due_date: string; amount: number; status: string }>;
  }> => api.get(`${BASE}/installment-calendar`).then(unwrap),
  prepaymentRequest: (uuid: string, payload: { prepayment_type: "partial" | "full"; amount?: number }): Promise<unknown> =>
    api.post(`${BASE}/${uuid}/prepayment-request`, payload).then(unwrap),

  // ── Reports ───────────────────────────────────────────────────────────────
  report: <T = unknown>(name: string, params?: Record<string, unknown>): Promise<T> =>
    api.get(`${BASE}/reports/${name}`, { params }).then(unwrap),

  // Download a tabular report as CSV or Excel (gap #7).
  downloadReport: async (name: string, format: "csv" | "xlsx" | "pdf" = "xlsx", params?: Record<string, unknown>): Promise<void> => {
    const res = await api.get(`${BASE}/reports/${name}/export`, { params: { ...params, format }, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan-${name}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
