/**
 * types/engageboard-enps.types.ts
 * EngageBoard / eNPS Engine (SM-02) — Node G20-A.
 *
 * Shapes mirror `backend/app/Http/Resources/EngageBoard/Enps/*Resource.php` and
 * `EnpsCampaign::FREQUENCIES` / `Survey::ANONYMITY_LEVELS`, verified directly.
 */

import type { Survey, SurveyAnonymity, TargetAudience } from "./engageboard-pulsecheck.types";

export type EnpsFrequency = "quarterly" | "semi_annual" | "annual" | "ad_hoc";

export type EnpsSegmentType = "company" | "department" | "location" | "grade";

export interface EnpsCampaign {
  uuid: string;
  frequency: EnpsFrequency | null;
  benchmark_target: number | null;
  delta_vs_previous: number | null;
  survey: Survey;
  created_at: string | null;
}

/**
 * EnpsScoreResource — THE single segment-suppression enforcement point
 * (EB-SEC-005/006). When `suppressed` is true every numeric field below is
 * withheld by the backend and must be rendered as "insufficient data",
 * never coerced to 0 or hidden outright (see `<SegmentBreakdown/>`).
 */
export interface EnpsScore {
  uuid: string;
  campaign_uuid: string | null;
  campaign_title: string | null;
  score_date: string | null;
  segment_type: EnpsSegmentType;
  segment_value: string | null;
  suppressed: boolean;
  promoter_count?: number;
  passive_count?: number;
  detractor_count?: number;
  total_responses?: number;
  enps_score?: number;
  participation_rate?: number;
  delta_vs_previous?: number | null;
  flagged?: boolean;
}

export interface EnpsBenchmark {
  uuid: string;
  label: string;
  min_score: number | null;
  max_score: number | null;
  is_internal_target: boolean;
  sort_order: number;
}

export interface EnpsDashboard {
  current_score: EnpsScore | null;
  delta: number | null;
  trend: EnpsScore[];
  participation: number | null;
  alerts: EnpsScore[];
}

export interface StoreEnpsCampaignInput {
  name: string;
  frequency?: EnpsFrequency;
  anonymity: SurveyAnonymity;
  target_audience: TargetAudience;
  start_date: string;
  end_date?: string;
  send_reminders?: boolean;
  reminder_days?: number[];
  benchmark_target?: number;
  follow_up_question?: string;
}

export interface LaunchCampaignResult {
  campaign: EnpsCampaign;
  invitations_created: number;
}

export interface CloseCampaignResult {
  campaign: EnpsCampaign;
  scores: EnpsScore[];
}

/**
 * eNPS score band, derived client-side from `enps_score` per
 * 03-design-system.md §1.1 — never used to hide the numeric score/label,
 * only to color-code it (band label is always rendered as text too).
 */
export type EnpsBand = "at-risk" | "needs-improvement" | "good" | "excellent" | "world-class";

export interface EnpsBandInfo {
  band: EnpsBand;
  label: string;
  colorVar: string;
}
