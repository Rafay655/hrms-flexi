/**
 * services/time-sync.service.ts
 * TimeSync — API client.
 *
 * URL prefix: /time-sync (backend: routes/time-sync.php → /api/v1/time-sync/*).
 * All paths are relative to NEXT_PUBLIC_API_URL, which already includes /api/v1 —
 * never prefix a path with /v1 or api/.
 *
 * Currently covers only the SELF-SERVICE reads the ESS portal consumes. The admin-side
 * TimeSync pages under app/(system)/time-sync/ still call the API inline; extracting them
 * belongs to TimeSync, not ESS.
 */

import { api } from "@/lib/api";
import type {
  MyAttendanceFilters,
  MyAttendanceResponse,
} from "@/types/ess-attendance";

const BASE = "/time-sync";

/**
 * GET /time-sync/attendance/my — the signed-in employee's own attendance.
 *
 * Self-scoped server-side: MyDailyAttendanceViewModel resolves the employee from
 * $request->user()->id and filters by company. There is no employee parameter, by design —
 * one employee can never read another's attendance through this route.
 *
 * Gated on `attendance.view_self`. NOTE: that permission did not exist in the database until
 * 2026-07-17 (its seeder was never registered), so this endpoint 403'd for every employee.
 * See docs/ess/SPRINTS.md §1.1.
 *
 * ⚠️ Returns the ViewModel's hand-built envelope — `data` is the array directly, with `meta`
 * and `employee` alongside it, NOT the { data: { data, meta } } shape the rest of the app uses.
 * Hence `res.data` here rather than `res.data.data`.
 */
export async function fetchMyAttendance(
  filters: MyAttendanceFilters = {},
): Promise<MyAttendanceResponse> {
  const res = await api.get(`${BASE}/attendance/my`, { params: filters });

  return {
    employee: res.data.employee,
    data: res.data.data ?? [],
    meta: res.data.meta,
  };
}

/** TanStack Query keys — mirror the resource path, per CLAUDE.md §4.3. */
export const timeSyncKeys = {
  all: ["time-sync"] as const,
  myAttendance: (filters: MyAttendanceFilters = {}) =>
    [...timeSyncKeys.all, "attendance", "my", filters] as const,
};
