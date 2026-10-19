/**
 * services/engageboard-enps.service.ts
 * EngageBoard / eNPS Engine (SM-02) — API client.
 *
 * All methods delegate to the shared axios instance at @/lib/api.
 * URL prefix: /engageboard/enps
 * (backend: routes/engageboard/enps.php, mounted in bootstrap/app.php under
 * Route::middleware('api')->prefix('api') → full path /api/v1/engageboard/enps/*,
 * confirmed by direct read, not the stale "NOT YET MOUNTED" header comment
 * left in that route file).
 *
 * Responses follow the { success, message, data } envelope; paginated list
 * endpoints (campaigns index) nest Laravel's paginator shape inside `data`
 * (`data.data.data ?? data.data`, matching services/dms.service.ts).
 */

import { api } from "@/lib/api";
import type {
  CloseCampaignResult,
  EnpsBenchmark,
  EnpsCampaign,
  EnpsDashboard,
  EnpsScore,
  LaunchCampaignResult,
  StoreEnpsCampaignInput,
} from "@/types/engageboard-enps.types";

const BASE = "/engageboard/enps";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: { data: { data: any } }): any {
  return res.data.data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrapPaginated(res: { data: { data: any } }): any {
  const data = res.data.data;
  return data?.data ?? data;
}

export const enpsService = {
  // ── Dashboard / trends / benchmarks (EB-ENPS-011..014) ────────────────────
  getDashboard: (): Promise<EnpsDashboard> => api.get(`${BASE}/dashboard`).then(unwrap),

  getTrends: (params?: { from?: string; to?: string }): Promise<EnpsScore[]> =>
    api.get(`${BASE}/trends`, { params }).then(unwrap),

  getBenchmarks: (): Promise<EnpsBenchmark[]> => api.get(`${BASE}/benchmarks`).then(unwrap),

  updateBenchmarks: (
    benchmarks: Array<Pick<EnpsBenchmark, "label" | "min_score" | "max_score" | "is_internal_target" | "sort_order">>,
  ): Promise<EnpsBenchmark[]> => api.put(`${BASE}/benchmarks`, { benchmarks }).then(unwrap),

  // ── Campaign CRUD + lifecycle (EB-ENPS-005..009) ──────────────────────────
  getCampaigns: (params?: { frequency?: string; status?: string }): Promise<EnpsCampaign[]> =>
    api.get(`${BASE}/campaigns`, { params }).then(unwrapPaginated),

  getCampaign: (uuid: string): Promise<EnpsCampaign> =>
    api.get(`${BASE}/campaigns/${uuid}`).then(unwrap),

  createCampaign: (payload: StoreEnpsCampaignInput): Promise<EnpsCampaign> =>
    api.post(`${BASE}/campaigns`, payload).then(unwrap),

  launchCampaign: (uuid: string): Promise<LaunchCampaignResult> =>
    api.post(`${BASE}/campaigns/${uuid}/launch`).then(unwrap),

  closeCampaign: (uuid: string, force = false): Promise<CloseCampaignResult> =>
    api.post(`${BASE}/campaigns/${uuid}/close`, { force }).then(unwrap),

  getCampaignScores: (uuid: string): Promise<EnpsScore[]> =>
    api.get(`${BASE}/campaigns/${uuid}/scores`).then(unwrap),
};
