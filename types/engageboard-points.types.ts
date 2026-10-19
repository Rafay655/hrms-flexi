/**
 * types/engageboard-points.types.ts
 * EngageBoard / PointsLedger (Node G20-B) — TypeScript shapes.
 *
 * Every field here is copied 1:1 from the real backend Resource/migration classes
 * (not assumed from 05-api-contract.md's prose table):
 *   backend/app/Http/Resources/EngageBoard/PointsLedger/*.php
 *   backend/database/migrations/2026_08_21_00000{1,2,3,4,6,7}_*.php
 */

// ── Enums (verified against the migrations' `enum()` column definitions) ──────
export type TierLevel = "bronze" | "silver" | "gold" | "platinum";

export type TransactionType = "earn" | "redeem" | "expire" | "adjust" | "transfer";

/** point_transactions.source_type — the coarse module-category enum. */
export type SourceType =
  | "recognition"
  | "survey"
  | "birthday"
  | "anniversary"
  | "goal"
  | "manual"
  | "redemption"
  | "referral"
  | "training";

/** point_redemptions.status — 5 values (includes 'cancelled', EB-PTS-048, beyond the source's 4-value enum). */
export type RedemptionStatus = "pending" | "approved" | "rejected" | "fulfilled" | "cancelled";

export type RewardCategory = "voucher" | "time_off" | "gift" | "experience" | "recognition_item";

export type TriggerType =
  | "manager_recognition"
  | "peer_recognition"
  | "survey_completion"
  | "work_anniversary"
  | "birthday"
  | "performance_rating"
  | "referral_hired"
  | "training_completed"
  | "goal_achieved"
  | "hr_bonus";

export type BudgetPeriod = "monthly" | "quarterly" | "annual";
export type RolloverPolicy = "rollover" | "expire" | "partial";

/**
 * PointsReportService::topEarners() — GET /engageboard/reports/points/top-earners.
 * Gated server-side by `engageboard.points.wallets.view-any` (HR/finance-admin-only,
 * see PointsReportController::authorizeWalletsViewAny()) — callers must check the
 * same permission client-side before querying, matching the recognitions
 * leaderboard's `activityReport()` precedent (only ever call this for a user who
 * actually holds the permission; there's no lesser "own view" fallback here).
 */
export interface TopEarnerRow {
  employee_code: string | null;
  employee_name: string;
  lifetime_earned: number;
  balance: number;
  tier_level: TierLevel;
}

export interface TopEarnersReport {
  top_earners: TopEarnerRow[];
  tier_distribution: Record<string, number>;
}

// ── Resource shapes ─────────────────────────────────────────────────────────

/** PointAccountResource — GET /points/account[/{empId}]. */
export interface PointAccount {
  uuid: string;
  employee_id: number;
  balance: number;
  reserved_balance: number;
  available_balance: number;
  tier: TierLevel;
  lifetime_earned: number;
  lifetime_redeemed: number;
  lifetime_expired: number;
  last_transaction_date: string | null;
}

/** PointTransactionResource — GET /points/transactions. */
export interface PointTransaction {
  uuid: string;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  source_type: SourceType;
  source_reference_id: number | null;
  gifted_by_id: number | null;
  note: string | null;
  expires_at: string | null;
  transaction_date: string | null;
}

/**
 * RewardsCatalogItemResource — GET/POST/PUT /points/catalog.
 *
 * NOTE (confirmed defect, not an assumption): this resource never exposes the
 * item's numeric `id` — only `uuid`. `POST /points/redeem`'s `reward_id` field is
 * validated server-side as `integer|exists:rewards_catalog,id`
 * (RedeemPointsRequest::rules()), which this resource cannot supply. See the `id`
 * comment on `RewardsCatalogItem` below and 20b-integration-snippet.md's
 * "Known API defect" section.
 */
export interface RewardsCatalogItem {
  uuid: string;
  name: string;
  category: RewardCategory;
  description: string | null;
  points_required: number;
  monetary_value_pkr: number | null;
  stock: number | null;
  in_stock: boolean;
  eligible_tiers: TierLevel[];
  image_path: string | null;
  requires_approval: boolean;
  active: boolean;
}

/** PointRedemptionResource — redemption request/history. */
export interface PointRedemption {
  uuid: string;
  employee_id: number;
  rewards_catalog_id: number;
  reward: RewardsCatalogItem;
  points_deducted: number;
  status: RedemptionStatus;
  requested_at: string | null;
  reviewed_by_id: number | null;
  reviewed_at: string | null;
  fulfillment_notes: string | null;
  fulfilled_at: string | null;
}

/** PointEarningRuleResource — GET/PUT /points/earning-rules. */
export interface PointEarningRule {
  uuid: string;
  trigger_type: TriggerType;
  points_amount: number;
  active: boolean;
}

/** PointBudgetResource — GET/POST /points/budgets. */
export interface PointBudget {
  uuid: string;
  name: string;
  period: BudgetPeriod;
  department_scope: string | null;
  period_start: string | null;
  period_end: string | null;
  total_points_allocated: number;
  department_allocation: Record<string, number> | null;
  per_manager_cap: number | null;
  per_employee_gift_cap: number | null;
  rollover_policy: RolloverPolicy;
  points_disbursed: number;
  points_redeemed_value: number;
}

/** BudgetService::utilization() row shape — GET /points/budgets/{id}/utilization. */
export interface PointBudgetAllocation {
  scope_type: string;
  scope_id: string | number;
  allocated: number;
  utilized: number;
  remaining: number;
}

export interface PointBudgetUtilization {
  budget: PointBudget;
  allocations: PointBudgetAllocation[];
}

// ── Request payload shapes (verified against the FormRequest ::rules()) ───────

export interface AwardPointsPayload {
  employee_id: number;
  points: number;
  note?: string;
}

export interface RedeemPointsPayload {
  /**
   * Backend validates this as an integer PK (`exists:rewards_catalog,id`), which
   * RewardsCatalogItemResource never sends to the client — see the type-level
   * comment on RewardsCatalogItem. We pass the item's `uuid` here as the best
   * available identifier; this will 422 against the current backend until that
   * contract gap is closed on the backend side.
   */
  reward_id: string;
}

export interface ApproveRedemptionPayload {
  fulfillment_notes: string;
}

export interface RejectRedemptionPayload {
  reason: string;
}

export interface UpdateEarningRulePayload {
  points_amount?: number;
  active?: boolean;
}

export interface CreateRewardsCatalogItemPayload {
  name: string;
  category: RewardCategory;
  description?: string | null;
  points_required: number;
  monetary_value_pkr?: number | null;
  stock?: number | null;
  eligible_tiers: TierLevel[];
  image_path?: string | null;
  requires_approval?: boolean;
  active?: boolean;
}

export type UpdateRewardsCatalogItemPayload = Partial<CreateRewardsCatalogItemPayload>;

export interface CreatePointBudgetPayload {
  name: string;
  period: BudgetPeriod;
  department_scope?: string | null;
  period_start: string;
  period_end: string;
  total_points_allocated: number;
  department_allocation?: Record<string, number> | null;
  per_manager_cap?: number | null;
  per_employee_gift_cap?: number | null;
  rollover_policy?: RolloverPolicy;
}

/**
 * The backend's `success()` envelope wraps a paginated Eloquent collection's
 * ::collection() resource directly inside a plain `{success,message,data}` array
 * (App\Traits\ApiResponse — see backend/app/Traits/ApiResponse.php), NOT via
 * Laravel's Resource::toResponse()/PaginatedResourceResponse path. That means the
 * automatic `meta`/`links` pagination envelope is never attached — `data` is a
 * flat array of resolved items with no total/last_page. Confirmed by reading the
 * trait directly, not assumed. Frontend "load more" pagination therefore uses
 * page-size-based heuristics (below), not a total/last_page count.
 */
export const POINTS_PAGE_SIZE = 25;
