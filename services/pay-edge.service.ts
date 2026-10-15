/**
 * services/pay-edge.service.ts
 * PayEdge — API client.
 *
 * URL prefix: /pay-edge (backend: routes/pay-edge.php → /api/v1/pay-edge/*).
 * Paths are relative to NEXT_PUBLIC_API_URL, which already includes /api/v1.
 *
 * Covers only the SELF-SERVICE payslip reads the ESS portal consumes. The admin PayEdge pages
 * keep their own calls.
 *
 * ⚠️ Only the PAYSLIP endpoints are wired here. The tax-certificate endpoints are intentionally
 * omitted — they lack an ownership check (confirmed IDOR 2026-07-18, flagged to the PayEdge
 * owner). Do not add them until that is fixed server-side.
 */

import { api } from "@/lib/api";
import type { PayslipDownload, PayslipRow } from "@/types/ess-payslip";

const BASE = "/pay-edge";

/**
 * GET /pay-edge/employees/{employeeUuid}/payslips — the employee's own payslips.
 *
 * ⚠️ `employeeUuid` MUST be sourced from GET /v1/ess/me, never from user input (INVARIANT 4).
 * The backend re-verifies ownership and 403s a mismatch, but the client must not invite one.
 * Flat { data: [...] } envelope.
 */
export async function fetchMyPayslips(
  employeeUuid: string,
): Promise<PayslipRow[]> {
  const res = await api.get(`${BASE}/employees/${employeeUuid}/payslips`);
  return res.data.data ?? [];
}

/**
 * POST /pay-edge/payslips/{payslipUuid}/download — mint a 5-minute signed URL for the PDF.
 *
 * ⚠️ This route is POST, not GET (it mutates: it increments download_count). Calling it with
 * GET returns 405 — verified live 2026-07-18, which is how the original GET here was caught.
 *
 * Returns the JSON envelope; the caller opens `download_url` (a signed serve-route URL that
 * streams the PDF inline). Ownership is checked here server-side — the service scopes the
 * lookup by the caller's employee_id, so a payslip belonging to someone else 404s.
 */
export async function requestPayslipDownload(
  payslipUuid: string,
): Promise<PayslipDownload> {
  const res = await api.post(`${BASE}/payslips/${payslipUuid}/download`);
  return res.data.data;
}

/** TanStack Query keys — mirror the resource path, per CLAUDE.md §4.3. */
export const payEdgeKeys = {
  all: ["pay-edge"] as const,
  myPayslips: (employeeUuid: string | null | undefined) =>
    [...payEdgeKeys.all, "payslips", "my", employeeUuid ?? "none"] as const,
};
