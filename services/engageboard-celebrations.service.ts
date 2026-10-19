/**
 * services/engageboard-celebrations.service.ts
 * Celebrations (Node G14, backend/routes/engageboard/recognitions.php) — API client.
 *
 * URL prefix: /engageboard/celebrations. Both endpoints are computed LIVE from
 * PeopleHub data (employees.joining_date + EmployeeFieldResolver::getDateOfBirth())
 * on every call, not read from a pre-populated table — CelebrationController's
 * own docblock (Round 1 review fix): "upcoming" genuinely returns future,
 * not-yet-occurred events within the requested window, not just today's.
 */

import { api } from "@/lib/api";
import type { TeamEvent } from "@/types/engageboard-celebrations.types";

const BASE = "/engageboard/celebrations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: { data: { data: any } }): any {
  return res.data.data;
}

export const engageBoardCelebrationsService = {
  /** `days` is server-validated to [0, 365]; defaults to 30 there if omitted. */
  upcoming: (days?: number): Promise<TeamEvent[]> =>
    api.get(`${BASE}/upcoming`, { params: days !== undefined ? { days } : undefined }).then(unwrap),

  today: (): Promise<TeamEvent[]> => api.get(`${BASE}/today`).then(unwrap),
};
