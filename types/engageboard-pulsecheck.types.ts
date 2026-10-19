/**
 * types/engageboard-pulsecheck.types.ts
 * EngageBoard / PulseCheck (SM-01 survey engine) — Node G20-A.
 *
 * Shapes mirror `backend/app/Http/Resources/EngageBoard/PulseCheck/*Resource.php`
 * and the enum consts on `backend/app/Models/EngageBoard/PulseCheck/{Survey,SurveyQuestion}.php`
 * verified directly, not paraphrased from 05-api-contract.md.
 */

export type SurveyType = "pulse" | "enps" | "onboarding" | "exit" | "custom";

export type SurveyAnonymity = "named" | "semi_anonymous" | "fully_anonymous";

export type SurveyStatus = "draft" | "published" | "closed" | "archived";

/** SurveyQuestion::TYPES — backend/app/Models/EngageBoard/PulseCheck/SurveyQuestion.php */
export type SurveyQuestionType =
  | "scale_1_5"
  | "scale_1_10"
  | "scale_0_10"
  | "emoji"
  | "yes_no"
  | "text"
  | "mcq";

export type TargetAudienceType = "all" | "department" | "location" | "grade" | "custom_group";

export interface TargetAudience {
  type: TargetAudienceType;
  values?: number[];
}

export interface SurveyQuestionOption {
  id: number;
  option_text: string;
  sort_order: number;
}

export interface SurveyQuestion {
  id: number;
  uuid: string;
  question_text: string;
  question_type: SurveyQuestionType;
  is_required: boolean;
  sort_order: number;
  scale_min_label: string | null;
  scale_max_label: string | null;
  allow_comment: boolean;
  conditional_logic: Record<string, unknown> | null;
  options?: SurveyQuestionOption[];
}

export interface Survey {
  uuid: string;
  title: string;
  survey_type: SurveyType;
  anonymity: SurveyAnonymity;
  target_audience: TargetAudience;
  start_date: string | null;
  end_date: string | null;
  max_responses: number | null;
  allow_resubmission: boolean;
  send_reminders: boolean;
  reminder_days: number[];
  status: SurveyStatus;
  created_at: string | null;
  questions?: SurveyQuestion[];
}

/** SurveyPublicResource — the token-gated /respond payload, deliberately a subset of Survey. */
export interface SurveyPublic {
  uuid: string;
  title: string;
  survey_type: SurveyType;
  anonymity: SurveyAnonymity;
  questions: SurveyQuestion[];
}

export interface StoreSurveyQuestionInput {
  question_text: string;
  question_type: SurveyQuestionType;
  is_required?: boolean;
  allow_comment?: boolean;
  scale_min_label?: string;
  scale_max_label?: string;
  conditional_logic?: Record<string, unknown>;
  options?: Array<{ option_text: string } | string>;
}

export interface StoreSurveyInput {
  title: string;
  survey_type?: SurveyType;
  anonymity: SurveyAnonymity;
  target_audience: TargetAudience;
  start_date: string;
  end_date?: string;
  max_responses?: number;
  allow_resubmission?: boolean;
  send_reminders?: boolean;
  reminder_days?: number[];
  questions?: StoreSurveyQuestionInput[];
}

export type UpdateSurveyInput = Partial<Omit<StoreSurveyInput, "questions">>;

export interface PublishSurveyResult {
  survey: Survey;
  invitations_created: number;
}

/** SurveyService::analytics() row shape — GET /surveys/{uuid}/analytics. */
export interface SurveyAnalyticsRow {
  question_id: number;
  question_text: string;
  question_type: SurveyQuestionType;
  response_count: number;
  average?: number | null;
  min?: number | null;
  max?: number | null;
  distribution?: Record<string, number>;
  comments?: string[];
}

/** SurveyService::participation() — GET /surveys/{uuid}/participation. */
export interface SurveyParticipation {
  rate: number;
  invited: number;
  responded: number;
  non_responders: Array<{
    employee_id: number;
    employee_uuid: string | null;
    employee_code: string | null;
  }>;
  /**
   * Present only when fetched via the G22 report endpoint
   * (`GET /engageboard/reports/survey/{uuid}/participation`,
   * `SurveyReportService::participationReport()`) — a strict superset of the
   * PulseCheck-native `participation()` payload above, adding a per-department
   * response-rate breakdown. Absent when fetched via the thinner native
   * endpoint (`SurveyService::participation()`, still used for the surveys
   * list page's lightweight per-row badge).
   */
  department_heatmap?: Array<{
    department_id: number | null;
    invited: number;
    responded: number;
    rate: number;
  }>;
}

export interface SubmitSurveyResponseAnswer {
  question_id: number;
  value: string | number | string[];
  comment?: string;
}

export interface SubmitSurveyResponseInput {
  token: string;
  answers: SubmitSurveyResponseAnswer[];
}
