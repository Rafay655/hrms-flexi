/**
 * services/engageboard-pulsecheck.service.ts
 * EngageBoard / PulseCheck (SM-01 survey engine) — API client.
 *
 * All methods delegate to the shared axios instance at @/lib/api.
 * URL prefix: /engageboard/surveys
 * (backend: routes/engageboard/pulsecheck.php, mounted in bootstrap/app.php
 * under Route::middleware('api')->prefix('api') → full path
 * /api/v1/engageboard/surveys/*, confirmed by direct read, not the stale
 * "NOT YET MOUNTED" header comment left in that route file).
 *
 * Responses follow the { success, message, data } envelope (App\Traits\ApiResponse).
 * Paginated list endpoints additionally nest Laravel's paginator shape inside
 * `data` ({ data: [...], links, meta }) — matches this codebase's existing
 * `services/dms.service.ts` convention (`data.data.data ?? data.data`).
 *
 * The two respond-flow endpoints (#11/#12 in 05-api-contract.md) are NOT
 * behind auth:sanctum — the invitation token in the query string / body is
 * the sole authorization mechanism (ADR-005). They're still called through
 * the shared `api` client: its request interceptor only attaches
 * Authorization/X-Company-ID headers when a token exists in localStorage,
 * so an anonymous respondent's request goes out header-free, which is fine
 * since the backend route never checks Sanctum for these two paths.
 */

import { api } from "@/lib/api";
import type {
  PublishSurveyResult,
  StoreSurveyInput,
  StoreSurveyQuestionInput,
  Survey,
  SurveyAnalyticsRow,
  SurveyParticipation,
  SurveyPublic,
  SurveyQuestion,
  SubmitSurveyResponseInput,
  UpdateSurveyInput,
} from "@/types/engageboard-pulsecheck.types";

const BASE = "/engageboard/surveys";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: { data: { data: any } }): any {
  return res.data.data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrapPaginated(res: { data: { data: any } }): any {
  const data = res.data.data;
  return data?.data ?? data;
}

export const pulseCheckService = {
  // ── Header CRUD + lifecycle (EB-SUR-007..013) ─────────────────────────────
  getSurveys: (params?: { status?: string; type?: string }): Promise<Survey[]> =>
    api.get(BASE, { params }).then(unwrapPaginated),

  getSurvey: (uuid: string): Promise<Survey> => api.get(`${BASE}/${uuid}`).then(unwrap),

  createSurvey: (payload: StoreSurveyInput): Promise<Survey> =>
    api.post(BASE, payload).then(unwrap),

  updateSurvey: (uuid: string, payload: UpdateSurveyInput): Promise<Survey> =>
    api.put(`${BASE}/${uuid}`, payload).then(unwrap),

  publishSurvey: (uuid: string): Promise<PublishSurveyResult> =>
    api.post(`${BASE}/${uuid}/publish`).then(unwrap),

  closeSurvey: (uuid: string, force = false): Promise<Survey> =>
    api.post(`${BASE}/${uuid}/close`, { force }).then(unwrap),

  archiveSurvey: (uuid: string): Promise<{ archived: true }> =>
    api.delete(`${BASE}/${uuid}`).then(unwrap),

  // ── Questions (EB-SUR-014..016) ────────────────────────────────────────────
  addQuestion: (uuid: string, payload: StoreSurveyQuestionInput): Promise<SurveyQuestion> =>
    api.post(`${BASE}/${uuid}/questions`, payload).then(unwrap),

  reorderQuestions: (
    uuid: string,
    order: Array<{ id: number; sort_order: number }>,
  ): Promise<SurveyQuestion[]> =>
    api.put(`${BASE}/${uuid}/questions/reorder`, { order }).then(unwrap),

  deleteQuestion: (uuid: string, questionId: number): Promise<{ deleted: true }> =>
    api.delete(`${BASE}/${uuid}/questions/${questionId}`).then(unwrap),

  // ── Analytics / participation / remind / export (EB-SUR-019..022) ─────────
  getAnalytics: (uuid: string): Promise<SurveyAnalyticsRow[]> =>
    api.get(`${BASE}/${uuid}/analytics`).then(unwrap),

  getParticipation: (uuid: string): Promise<SurveyParticipation> =>
    api.get(`${BASE}/${uuid}/participation`).then(unwrap),

  /**
   * Round-1 review (Defect 2): the survey detail page's Participation tab
   * must reuse G22's report endpoint — `SurveyReportService::
   * participationReport()` is a strict superset of `SurveyService::
   * participation()` above (same base fields + a `department_heatmap`
   * array) — confirmed by reading both classes directly. The list page's
   * lightweight per-row participation badge intentionally keeps using
   * `getParticipation()` above (the thinner native endpoint): fetching the
   * heatmap for every row on a list of up to 25 surveys would be wasteful
   * for data the list view never displays.
   */
  getParticipationReport: (uuid: string): Promise<SurveyParticipation> =>
    api.get(`/engageboard/reports/survey/${uuid}/participation`).then(unwrap),

  remind: (uuid: string): Promise<{ reminded: number }> =>
    api.post(`${BASE}/${uuid}/remind`).then(unwrap),

  /** Streams the CSV/PDF export and triggers a browser download (mirrors loan-hub.ts's downloadReport). */
  exportSurvey: async (uuid: string, title: string, format: "csv" | "pdf" = "csv"): Promise<void> => {
    const res = await api.get(`${BASE}/${uuid}/export`, { params: { format }, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── Token-gated respond flow (EB-SUR-017/018) — no auth:sanctum ──────────
  getRespondSurvey: (uuid: string, token: string): Promise<SurveyPublic> =>
    api.get(`${BASE}/${uuid}/respond`, { params: { token } }).then(unwrap),

  submitResponse: (uuid: string, payload: SubmitSurveyResponseInput): Promise<{ submitted: true }> =>
    api.post(`${BASE}/${uuid}/responses`, payload).then(unwrap),
};
