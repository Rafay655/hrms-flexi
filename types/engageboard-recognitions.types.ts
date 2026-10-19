/**
 * types/engageboard-recognitions.types.ts
 *
 * Mirrors backend/app/Http/Resources/EngageBoard/Recognitions/*.php and
 * StoreRecognitionRequest/StoreRecognitionBadgeRequest exactly (read directly).
 */

export type BadgeCategory = "performance" | "values" | "milestone" | "peer" | "hr_award";

/** Who may award a badge — RecognitionBadge::canBeAwardedBy()'s exact match arms. */
export type WhoCanAward = "hr_only" | "manager" | "peer" | "system";

export type FrequencyLimit = "once" | "monthly" | "quarterly" | "unlimited";

export type RecognitionVisibility = "public" | "private";

/** Client-side best-effort mirror of RecognitionController::resolveGiverRole() —
 * see engageboard-recognitions.service.ts's docblock for the "manager" caveat
 * (the server additionally checks the specific recipient's reporting line,
 * which the client cannot verify ahead of submission). */
export type GiverRole = "hr" | "manager" | "peer";

export interface RecognitionBadge {
  uuid: string;
  name: string;
  category: BadgeCategory;
  icon_path: string | null;
  points_attached: number | null;
  who_can_award: WhoCanAward;
  frequency_limit: FrequencyLimit | null;
  active: boolean;
}

export interface RecognitionPartyRef {
  id: number;
  name: string;
}

export interface EmployeeRecognition {
  uuid: string;
  given_by: RecognitionPartyRef;
  recipient: RecognitionPartyRef;
  badge: RecognitionBadge | null;
  company_value: { id: number; name: string; slug: string } | null;
  reason_message: string;
  points_gifted: number;
  visibility: RecognitionVisibility;
  certificate_generated: boolean;
  recognized_at: string | null;
}

export interface GiveRecognitionPayload {
  recipient_id: number;
  recognition_badge_id?: number | null;
  company_value_id?: number | null;
  reason_message: string;
  points: number;
  visibility: RecognitionVisibility;
  certificate_generated?: boolean;
}

/** GET /reports/recognitions/activity's `most_recognized` row shape (HR-admin
 * only — see the service docblock for why this powers the leaderboard). */
export interface RecognitionActivityRow {
  employee_code: string | null;
  count: number;
  points_received?: number;
}

export interface RecognitionActivityReport {
  top_recognizers: RecognitionActivityRow[];
  most_recognized: RecognitionActivityRow[];
  badge_distribution: Record<string, number>;
  by_department: Record<string, number>;
  by_month: Record<string, number>;
  total_recognitions: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
}

export interface EmployeeOption {
  id: number;
  uuid: string;
  name: string;
  employee_code: string;
}
