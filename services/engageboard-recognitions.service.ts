/**
 * services/engageboard-recognitions.service.ts
 * Recognitions (Node G14, backend/routes/engageboard/recognitions.php) — API client.
 *
 * URL prefix: /engageboard (recognitions.php mounts at `v1/engageboard`, then
 * its own `recognitions`/`celebrations` sub-prefixes — see BASE below).
 *
 * Company-values CRUD (`/engageboard/recognitions/values`) is deliberately NOT
 * wired here: `CompanyValueResource` (backend/app/Http/Resources/EngageBoard/
 * Recognitions/CompanyValueResource.php) exposes only `uuid`/`name`/`slug`/`active`
 * — never the numeric `id` that `StoreRecognitionRequest.company_value_id`
 * requires (`exists:engagement_company_values,id`). There is no way for this
 * frontend-only node to submit a usable company_value_id from that list
 * endpoint's response shape, so `<RecognitionForm/>` omits a company-value
 * picker rather than submit a value it cannot validate client-side. See
 * docs/engageboard/graph/20c-integration-snippet.md.
 */

import { api } from "@/lib/api";
import type {
  EmployeeOption,
  EmployeeRecognition,
  GiveRecognitionPayload,
  GiverRole,
  PaginatedResponse,
  RecognitionActivityReport,
  RecognitionBadge,
} from "@/types/engageboard-recognitions.types";

const BASE = "/engageboard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: { data: { data: any } }): any {
  return res.data.data;
}

interface OnboardingSimpleRow {
  id: number;
  uuid: string;
  employee_code: string;
  name: string;
}

/** Same confirmed-reachable employee search as engageboard-feed.service.ts —
 * see that file's header docblock for why /people-hub/onboarding?detailed=0
 * is used instead of the unrouted FeedService::searchMentionableEmployees().
 * NOTE: pass `detailed: 0`, not `false` — Laravel's `boolean` validation rule
 * does not accept the literal query-string value "false" (only 0/1/"0"/"1"),
 * so `detailed: false` 422s on every call (found live during G32 QA). */
export async function searchEmployees(query: string, perPage = 10): Promise<EmployeeOption[]> {
  if (query.trim().length < 2) return [];

  const { data } = await api.get("/people-hub/onboarding", {
    params: { search: query, per_page: perPage, detailed: 0 },
  });

  const rows: OnboardingSimpleRow[] = data.data ?? [];
  return rows.map((row) => ({
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    employee_code: row.employee_code,
  }));
}

/**
 * Client-side best-effort mirror of RecognitionController::resolveGiverRole().
 * The HR-role check is exact (same role list, `HR_ROLES` in the controller).
 * The "manager" case is NOT exact: the backend additionally confirms the
 * caller is the SPECIFIC selected recipient's direct reporting manager
 * (EmployeeFieldResolver::getReportingManagerId()), which no endpoint exposes
 * to this frontend ahead of submission. A `manager`-role user is optimistically
 * treated as 'manager' here (showing manager+peer badges); if the chosen
 * recipient isn't actually their direct report, the backend recomputes the
 * real role as 'peer' and rejects a manager-only badge with a 422 that
 * <RecognitionForm/> surfaces via toast — the server remains authoritative.
 */
export function resolveClientGiverRole(userRoles: string[]): GiverRole {
  const HR_ROLES = ["super_admin", "admin", "hr_manager", "hr_officer"];
  if (userRoles.some((r) => HR_ROLES.includes(r))) return "hr";
  if (userRoles.includes("manager")) return "manager";
  return "peer";
}

export const engageBoardRecognitionsService = {
  give: (payload: GiveRecognitionPayload): Promise<EmployeeRecognition> =>
    api.post(`${BASE}/recognitions`, payload).then(unwrap),

  list: (params?: {
    per_page?: number;
    page?: number;
    visibility?: string;
  }): Promise<PaginatedResponse<EmployeeRecognition>> =>
    api.get(`${BASE}/recognitions`, { params }).then(unwrap),

  history: (
    employeeId: number,
    params?: { per_page?: number; page?: number },
  ): Promise<PaginatedResponse<EmployeeRecognition>> =>
    api.get(`${BASE}/recognitions/${employeeId}/history`, { params }).then(unwrap),

  /** Certificate is a raw PDF stream behind auth:sanctum — cannot be linked to
   * directly (a plain <a href> would carry no bearer token), so this fetches
   * the blob through the authenticated axios client instead. */
  downloadCertificate: (uuid: string): Promise<Blob> =>
    api
      .get(`${BASE}/recognitions/${uuid}/certificate`, { responseType: "blob" })
      .then((res) => res.data),

  listBadges: (): Promise<RecognitionBadge[]> =>
    api.get(`${BASE}/recognitions/badges`).then(unwrap),

  createBadge: (payload: {
    name: string;
    category: string;
    icon_path?: string | null;
    points_attached?: number | null;
    who_can_award: string;
    frequency_limit?: string | null;
    active?: boolean;
  }): Promise<RecognitionBadge> => api.post(`${BASE}/recognitions/badges`, payload).then(unwrap),

  /** HR-Admin-only aggregate (RecognitionBadgePolicy::create /
   * engageboard.recognition.badges.manage) — see <LeaderboardWidget/>'s
   * docblock for why this, not a peer-visible endpoint, powers the widget. */
  activityReport: (): Promise<RecognitionActivityReport> =>
    api.get("/engageboard/reports/recognitions/activity").then(unwrap),
};
