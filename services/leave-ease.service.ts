/**
 * services/leave-ease.service.ts
 * LeaveEase — API client.
 *
 * URL prefix: /leave-ease (backend: routes/leave-ease.php → /api/v1/leave-ease/*).
 * Paths are relative to NEXT_PUBLIC_API_URL, which already includes /api/v1.
 *
 * Currently covers only the SELF-SERVICE reads the ESS portal consumes. The admin LeaveEase
 * pages under app/(system)/leave-ease/ keep their own calls; extracting them is LeaveEase work.
 *
 * ⚠️ TWO envelope shapes live here:
 *   - balances/my and comp-off/my → FLAT   { data: [...] }             → res.data.data
 *   - requests                    → PAGINATED { data: { data, meta } } → res.data.data.data
 */

import { api } from "@/lib/api";
import type {
  CompOffRow,
  LeaveBalance,
  LeaveRequestRow,
  MyLeaveRequestsResponse,
} from "@/types/ess-leave";

const BASE = "/leave-ease";

/**
 * GET /leave-ease/balances/my — the signed-in employee's leave balances.
 *
 * No permission gate beyond auth:sanctum; self-scoped server-side (the ViewModel resolves the
 * employee from the token). Flat envelope.
 */
export async function fetchMyLeaveBalances(): Promise<LeaveBalance[]> {
  const res = await api.get(`${BASE}/balances/my`);
  return res.data.data ?? [];
}

/**
 * GET /leave-ease/requests — the signed-in employee's own leave requests.
 *
 * Company-scoped route, but ListLeaveRequestsViewModel forces employee_id to the caller's own
 * employee for any non-HR role (LE-04 fix, 2026-07-17). Do NOT pass employee_id from here — it
 * is ignored for employees and is the parameter that used to leak colleagues' leave. Paginated.
 */
export async function fetchMyLeaveRequests(
  params: { per_page?: number; page?: number; status?: string } = {},
): Promise<MyLeaveRequestsResponse> {
  const res = await api.get(`${BASE}/requests`, { params });
  const body = res.data.data; // { data: [...], meta: {...} }
  return {
    data: (body?.data ?? []) as LeaveRequestRow[],
    meta: body?.meta,
  };
}

/**
 * GET /leave-ease/comp-off/my — the employee's compensatory-off credits.
 *
 * Reachable by a plain employee via the leave-balance.view arm of the OR gate. Flat envelope.
 */
export async function fetchMyCompOff(): Promise<CompOffRow[]> {
  const res = await api.get(`${BASE}/comp-off/my`);
  return res.data.data ?? [];
}

/** TanStack Query keys — mirror the resource path, per CLAUDE.md §4.3. */
export const leaveKeys = {
  all: ["leave-ease"] as const,
  myBalances: () => [...leaveKeys.all, "balances", "my"] as const,
  myRequests: (params: object = {}) =>
    [...leaveKeys.all, "requests", "my", params] as const,
  myCompOff: () => [...leaveKeys.all, "comp-off", "my"] as const,
};
