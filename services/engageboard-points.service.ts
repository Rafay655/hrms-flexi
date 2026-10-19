/**
 * services/engageboard-points.service.ts
 * EngageBoard / PointsLedger (Node G20-B) — API client.
 *
 * All methods delegate to the shared axios instance at @/lib/api.
 *
 * Full backend path: /api/v1/points (backend: backend/routes/engageboard/points.php,
 * mounted at `api` + `v1/points` in bootstrap/app.php — verified directly, NOT
 * `/engageboard/points`. PointsLedger is the one EngageBoard sub-module that does
 * not use the `/api/v1/engageboard/*` prefix every other sub-node's frontend uses).
 *
 * IMPORTANT: `NEXT_PUBLIC_API_URL` already includes `/api/v1` (see frontend/.env.local
 * and every other engageboard-*.service.ts's BASE, e.g. "/engageboard/enps") — so
 * this file's relative BASE must be `/points`, NOT `/v1/points`, or every request
 * 404s against a doubled `/v1/v1/points/...` path. (Corrected 2026-08-29 — the
 * original `/v1/points` BASE shipped in Node G20-B and passed two independent
 * reviews because neither ran a live dev server against a real backend; caught
 * while building G20's centralized landing dashboard, which was the first code
 * to actually need cross-service-file comparison.)
 *
 * Responses follow the { success, message, data } envelope (App\Traits\ApiResponse);
 * this client unwraps `data.data`. List endpoints return a flat array under `data`
 * with NO pagination meta (see POINTS_PAGE_SIZE's comment in the types file) — callers
 * page via `?page=` and infer "last page" from a short/empty result.
 */

import { api } from "@/lib/api";
import type {
  ApproveRedemptionPayload,
  AwardPointsPayload,
  CreatePointBudgetPayload,
  CreateRewardsCatalogItemPayload,
  PointAccount,
  PointBudget,
  PointBudgetUtilization,
  PointEarningRule,
  PointRedemption,
  PointTransaction,
  RedeemPointsPayload,
  RejectRedemptionPayload,
  RewardsCatalogItem,
  TopEarnersReport,
  UpdateEarningRulePayload,
  UpdateRewardsCatalogItemPayload,
} from "@/types/engageboard-points.types";

const BASE = "/points";

// Unwraps the { success, message, data } envelope. Returns `any` so each method's
// own Promise<T> return annotation stays the single source of truth for the type
// (axios types response.data as `any`, so a generic here cannot infer T) — same
// convention as services/loan-hub.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: { data: { data: any } }): any {
  return res.data.data;
}

export const engageboardPointsService = {
  // ── Wallet (EB-PTS-009/010/011) ───────────────────────────────────────────
  getMyAccount: (): Promise<PointAccount> => api.get(`${BASE}/account`).then(unwrap),
  getAccount: (empId: number): Promise<PointAccount> => api.get(`${BASE}/account/${empId}`).then(unwrap),
  getTransactions: (page = 1): Promise<PointTransaction[]> =>
    api.get(`${BASE}/transactions`, { params: { page } }).then(unwrap),

  // ── Manual award (EB-PTS-012) — no dedicated UI in this node's scope, kept for
  // API-contract completeness. ─────────────────────────────────────────────
  award: (payload: AwardPointsPayload): Promise<PointTransaction> =>
    api.post(`${BASE}/award`, payload).then(unwrap),

  // ── Earning rules (EB-PTS-013/014) ────────────────────────────────────────
  getEarningRules: (): Promise<PointEarningRule[]> => api.get(`${BASE}/earning-rules`).then(unwrap),
  updateEarningRule: (uuid: string, payload: UpdateEarningRulePayload): Promise<PointEarningRule> =>
    api.put(`${BASE}/earning-rules/${uuid}`, payload).then(unwrap),

  // ── Rewards catalog (EB-PTS-015..018) ─────────────────────────────────────
  getCatalog: (): Promise<RewardsCatalogItem[]> => api.get(`${BASE}/catalog`).then(unwrap),
  createCatalogItem: (payload: CreateRewardsCatalogItemPayload): Promise<RewardsCatalogItem> =>
    api.post(`${BASE}/catalog`, payload).then(unwrap),
  updateCatalogItem: (uuid: string, payload: UpdateRewardsCatalogItemPayload): Promise<RewardsCatalogItem> =>
    api.put(`${BASE}/catalog/${uuid}`, payload).then(unwrap),
  deactivateCatalogItem: (uuid: string): Promise<{ active: boolean }> =>
    api.delete(`${BASE}/catalog/${uuid}`).then(unwrap),

  // ── Redemption (EB-PTS-019..023, + EB-PTS-048 cancel) ─────────────────────
  redeem: (payload: RedeemPointsPayload): Promise<PointRedemption> =>
    api.post(`${BASE}/redeem`, payload).then(unwrap),
  getMyRedemptions: (page = 1): Promise<PointRedemption[]> =>
    api.get(`${BASE}/redemptions`, { params: { page } }).then(unwrap),
  getPendingRedemptions: (page = 1): Promise<PointRedemption[]> =>
    api.get(`${BASE}/redemptions/pending`, { params: { page } }).then(unwrap),
  approveRedemption: (uuid: string, payload: ApproveRedemptionPayload): Promise<PointRedemption> =>
    api.post(`${BASE}/redemptions/${uuid}/approve`, payload).then(unwrap),
  rejectRedemption: (uuid: string, payload: RejectRedemptionPayload): Promise<PointRedemption> =>
    api.post(`${BASE}/redemptions/${uuid}/reject`, payload).then(unwrap),
  cancelRedemption: (uuid: string): Promise<PointRedemption> =>
    api.post(`${BASE}/redemptions/${uuid}/cancel`).then(unwrap),

  // ── Budgets (EB-PTS-024..026) ──────────────────────────────────────────────
  getBudgets: (): Promise<PointBudget[]> => api.get(`${BASE}/budgets`).then(unwrap),
  createBudget: (payload: CreatePointBudgetPayload): Promise<PointBudget> =>
    api.post(`${BASE}/budgets`, payload).then(unwrap),
  getBudgetUtilization: (uuid: string): Promise<PointBudgetUtilization> =>
    api.get(`${BASE}/budgets/${uuid}/utilization`).then(unwrap),

  // ── Reports (EB-REP-009) — under /engageboard/reports, NOT /points, unlike
  // every other method in this file. Permission-gated server-side (see
  // TopEarnersReport's docblock) — only call this for a user who holds
  // `engageboard.points.wallets.view-any`. ──────────────────────────────────
  getTopEarners: (limit = 10): Promise<TopEarnersReport> =>
    api.get("/engageboard/reports/points/top-earners", { params: { limit } }).then(unwrap),
};
