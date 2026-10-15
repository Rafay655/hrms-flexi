/**
 * services/ess.service.ts
 * ESS Portal — API client.
 *
 * Delegates to the shared axios instance at @/lib/api.
 * URL prefix: /ess (backend: routes/ess.php → /api/v1/ess/*).
 * Responses follow the { success, message, data } envelope; this client unwraps `data.data`.
 *
 * ⚠️ This client covers PORTAL-LEVEL endpoints only. Module-owned ESS endpoints keep their
 * existing clients — LoanHub's /v1/ess/loans/* is served by services/loan-hub.ts, and
 * ExpenseHub's /v1/expense-hub/ess/my-claims by services/expense-hub.ts. ESS consumes those;
 * it does not re-export them. See docs/ess/IMPLEMENTATION_PLAN.md §1.1.
 */

import { api } from "@/lib/api";
import type { EssMe } from "@/types/ess";

const BASE = "/ess";

/**
 * GET /v1/ess/me — portal bootstrap: identity, employee linkage, resolved nav.
 *
 * One call, on portal load. Do not probe individual modules to build the nav: that would be
 * N requests per page load and would surface areas the user cannot actually open.
 */
export async function fetchEssMe(): Promise<EssMe> {
  const res = await api.get(`${BASE}/me`);
  return res.data.data;
}

/** TanStack Query keys — mirror the resource path, per CLAUDE.md §4.3. */
export const essKeys = {
  all: ["ess"] as const,
  me: () => [...essKeys.all, "me"] as const,
};
