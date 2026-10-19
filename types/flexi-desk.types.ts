/**
 * types/flexi-desk.types.ts
 * FlexiDesk (helpdesk) — client view of the API contract.
 *
 * Mirrors backend/app/Http/Resources/FlexiDesk/*. The resources are the contract; keep these in
 * step. Only uuids are exposed (never numeric ids or company_id). Departments are the one
 * exception: they have no uuid, so their integer id is their public key.
 */

export type TicketStatus =
  | "open"
  | "in_progress"
  | "escalated"
  | "pending_info"
  | "resolved"
  | "closed"
  | "reopened";

export type TicketPriority = "low" | "normal" | "high" | "critical";

/** Which audience is reading. Drives wording only; the API decides what data each audience gets. */
export type TicketAudience = "employee" | "resolver";

export type TicketAttachment = {
  uuid: string;
  original_filename: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string | null;
};

/** Server-computed capabilities for the caller on this ticket: render buttons from these, never re-derive rules. */
export type TicketAbilities = {
  work: boolean;
  close: boolean;
  reopen: boolean;
  reassign: boolean;
  delete: boolean;
  comment_external: boolean;
  comment_internal: boolean;
  escalate: boolean;
  deescalate: boolean;
};

/** Present only when the caller may see resolver context (view-all, or assignee). */
export type SlaState = "none" | "paused" | "breached" | "at_risk" | "ok";

export type TicketSla = {
  configured: boolean;
  response_due_at: string | null;
  due_at: string | null;
  first_response_at: string | null;
  paused: boolean;
  state: SlaState;
};

export type FlexiDeskTicket = {
  uuid: string;
  ticket_number: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  source: "web" | "mobile" | "email";
  category: { uuid: string; name: string } | null;
  sub_category: { uuid: string; name: string } | null;
  assignee: { uuid: string; name: string } | null;
  reopened_count: number;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  attachments: TicketAttachment[];
  abilities: TicketAbilities;
  // resolver-only block
  escalation_level?: number;
  escalation?: { level: number; exception: { code: string; at: string } | null };
  employee?: { uuid: string; name: string; employee_code: string | null } | null;
  sla?: TicketSla;
};

export type CategoryOption = {
  uuid: string;
  name: string;
  icon: string | null;
  default_priority: TicketPriority;
  sort_order: number;
  is_active: boolean;
  sub_categories: { uuid: string; name: string }[] | null;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CreateTicketPayload = {
  category_uuid: string;
  sub_category_uuid?: string | null;
  subject: string;
  description: string;
  priority?: TicketPriority;
  /** Idempotency key: the server returns the original ticket if this is replayed. */
  client_request_id: string;
  attachments?: File[];
};

export type TicketListParams = {
  status?: TicketStatus;
  sla_state?: SlaState;
  escalated?: boolean;
  priority?: TicketPriority;
  category_uuid?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

/** The platform error envelope (central ApiExceptionRenderer). */
export type FlexiDeskApiError = {
  code: string;
  message: string;
  hint?: string | null;
  field_errors?: Record<string, string[]>;
};


/** One conversation entry. `is_internal` is present ONLY for the resolver audience. */
export type TicketThreadEntry = {
  uuid: string;
  sender_type: "employee" | "resolver" | "system";
  sender: { name: string } | null;
  message: string;
  is_system_note: boolean;
  can_delete: boolean;
  created_at: string | null;
  attachments: TicketAttachment[];
  is_internal?: boolean;
};

export type EscalationEntry = {
  uuid: string;
  kind: "escalate" | "deescalate";
  level: number;
  triggered_by: "manual" | "sla_breach" | string;
  from: { name: string | null } | null;
  to: { name: string | null };
  reason: string | null;
  created_at: string | null;
};

/** Minimal result of a handoff. NOT a ticket view: a full fetch goes back through authorization. */
export type MutationReceipt = {
  ticket_uuid: string;
  status: TicketStatus;
  escalation_level: number;
  assignee?: { uuid: string; name: string } | null;
};

export type ExceptionType = "escalation_target_missing" | "sla_not_configured";

// ── Sprint 3: formal grievances ──────────────────────────────────────────────

export type GrievanceStatus =
  | "filed"
  | "committee_assigned"
  | "under_investigation"
  | "hearing_scheduled"
  | "ruling_issued"
  | "appealed"
  | "closed";

export type GrievanceType = "harassment" | "discrimination" | "policy_violation" | "workplace_safety" | "compensation" | "other";

export type GrievanceNoteType = "investigation" | "hearing" | "ruling_basis";

/** A list row: number, type, stage and dates only. No narrative and no people, by design. */
export type GrievanceSummary = {
  uuid: string;
  grievance_number: string;
  grievance_type: GrievanceType;
  status: GrievanceStatus;
  is_identity_masked: boolean;
  is_mine: boolean;
  created_at: string | null;
  closed_at: string | null;
  intake_due_at?: string | null;
};

/** Server-computed rights on this case for this caller: render buttons from these, never re-derive the rules. */
export type GrievanceAbilities = {
  assign_committee: boolean;
  investigate: boolean;
  view_notes: boolean;
  add_note: boolean;
  rule: boolean;
  appeal: boolean;
  resolve_appeal: boolean;
  close: boolean;
  reveal_identity: boolean;
  revoke_access: boolean;
  upload_evidence: boolean;
};

export type GrievanceHearing = {
  uuid: string;
  scheduled_at: string | null;
  mode: "in_person" | "virtual";
  location: string | null;
  held_at: string | null;
  /** staff only */
  attendee_count?: number;
  attendees?: { uuid: string; name: string }[];
};

/**
 * One case, shaped by audience. For a MASKED case the staff payload has no `filer` key at all: the identity is
 * not in the response, so nothing here can leak it. `filer` is present only for an unmasked case.
 */
export type Grievance = GrievanceSummary & {
  subject: string;
  description: string;
  audience: "filer" | "staff";
  appeal_deadline: string | null;
  appeal_filed_at: string | null;
  appeal_notes: string | null;
  abilities: GrievanceAbilities;
  hearings: GrievanceHearing[];
  ruling?: string | null;
  ruling_date?: string | null;
  // staff-only block
  converted_from_ticket?: boolean;
  committee?: { uuid: string; name: string } | null;
  committee_members?: { role: string }[];
  investigator?: { uuid: string; name: string } | null;
  against?: { name: string; employee_code: string | null } | null;
  filer?: { name: string; employee_code: string | null };
};

export type GrievanceNote = {
  uuid: string;
  note_type: GrievanceNoteType | "appeal";
  body: string;
  author: { name: string } | null;
  created_at: string | null;
};

export type GrievanceAttachment = {
  uuid: string;
  display_name: string;
  original_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by_me: boolean;
  created_at: string | null;
};

export type GrievanceCommittee = {
  uuid: string;
  name: string;
  notes: string | null;
  formed_at: string | null;
  dissolved_at: string | null;
  is_active: boolean;
  chairperson: { uuid: string; name: string } | null;
  members: { user_uuid: string | null; name: string | null; role: string; joined_at: string | null }[];
  eligible_member_count: number;
  minimum_members: number;
};

export type PersonOption = { uuid: string; name: string };

/** Returned once by the reveal action. Held in memory only; never cached or stored. */
export type RevealedIdentity = { name: string; employee_code: string | null };

export type FileGrievancePayload = {
  grievance_type: GrievanceType;
  subject: string;
  description: string;
  is_identity_masked: boolean;
  source_ticket_uuid?: string | null;
  attachments?: File[];
};

export type GrievanceListParams = { status?: GrievanceStatus; grievance_type?: GrievanceType; page?: number; per_page?: number };

// ── Sprint 3 close-out: access overlay, participants, aggregate report ──────

export type RevocationKind = "offboarding" | "conflict_of_interest" | "compromise" | "administrative";

export type GrievanceParticipant = { uuid: string; name: string; case_role: string };

export type GrievanceRevocation = {
  uuid: string;
  person: { uuid: string; name: string } | null;
  kind: RevocationKind;
  reason: string;
  revoked_by: { name: string } | null;
  created_at: string | null;
};

/** One breakdown cell. A withheld cell has count === null: small counts can single out a person. */
export type ReportCell = { count: number | null; suppressed: boolean };

export type GrievanceReport = {
  window: { from: string; to: string };
  min_cell_size: number;
  total: number;
  by_status: Record<string, ReportCell>;
  by_type: Record<string, ReportCell>;
  by_month: Record<string, ReportCell>;
  open_cases: ReportCell;
  awaiting_intake_review_overdue: ReportCell;
  avg_days_filing_to_ruling: number | null;
  appeal_rate_percent: number | null;
  confidential_handling_percent: number | null;
  notes: string;
};

/** Who currently derives access to a case (committee snapshot + global view-all), and who lost it. Not a directory. */
export type GrievanceAccessSummary = {
  current: { uuid: string; name: string; sources: ("committee" | "global")[]; case_role: string | null }[];
  revoked: { uuid: string; name: string; kind: RevocationKind; revoked_at: string | null }[];
};

// ── Knowledge Base and CSAT ─────────────────────────────────────────────────

export type KbStatus = "draft" | "published" | "archived";

export type KbArticle = {
  uuid: string;
  title: string;
  slug: string;
  summary: string | null;
  tags: string[];
  category: { uuid: string; name: string } | null;
  published_at: string | null;
  updated_at: string | null;
  /** present only when reading a single article */
  body?: string;
  // editors only
  status?: KbStatus;
  views?: number;
  last_reviewed_at?: string | null;
};

export type KbArticleInput = {
  title: string;
  summary?: string | null;
  body: string;
  tags?: string[];
  category_uuid?: string | null;
  slug?: string | null;
};

export type KbListParams = { q?: string; category_uuid?: string; status?: KbStatus; page?: number; per_page?: number };

export type KbAnalyticsRow = {
  uuid: string;
  title: string;
  slug: string;
  status: KbStatus;
  category: { uuid: string; name: string } | null;
  views: number;
  helpful: number;
  not_helpful: number;
  votes: number;
  /** null until there are enough votes to mean anything */
  not_helpful_ratio: number | null;
  needs_review: boolean;
  stale: boolean;
  deflections: number;
  attached_to_tickets: number;
};

export type KbAnalytics = {
  window: { from: string; to: string };
  totals: { articles: number; published: number; views: number; votes: number; deflections: number; needs_review: number; stale: number };
  articles: KbAnalyticsRow[];
  notes: string;
};

export type CsatState = "pending" | "submitted" | "expired";

export type CsatSurvey = { state: CsatState; expires_at: string | null; submitted_at: string | null; rating: number | null };

export type CsatSubmission = { rating: number; resolver_helpful?: boolean | null; speed_rating?: number | null; feedback?: string | null };

/** A breakdown row. An under-sampled group is `{ insufficient_responses: true }` and nothing else: not named, not counted. */
export type CsatBreakdownRow =
  | { insufficient_responses: true }
  | {
      insufficient_responses: false;
      responses: number;
      average_rating: number;
      poor_rating_percent: number;
      category?: { uuid: string; name: string } | null;
      resolver?: { uuid: string; name: string } | null;
    };

export type CsatReport = {
  window: { from: string; to: string };
  min_sample: number;
  surveys_sent: number;
  submitted: number;
  expired_unanswered: number;
  pending: number;
  response_rate_percent: number | null;
  average_rating: number | null;
  poor_rating_percent: number | null;
  distribution: Record<string, number> | null;
  by_category: CsatBreakdownRow[];
  by_resolver: CsatBreakdownRow[];
  notes: string;
};
// ── Admin configuration (flexidesk.settings.manage) ──────────────────────────

export type Priority = "low" | "normal" | "high" | "critical";

export type AdminCategory = {
  uuid: string;
  name: string;
  icon: string | null;
  default_priority: Priority;
  sort_order: number;
  is_active: boolean;
  sub_categories: { uuid: string; name: string }[] | null;
};
export type AdminCategoryInput = { name: string; icon?: string | null; default_priority?: Priority; sort_order?: number; is_active?: boolean };

export type AdminSubCategory = {
  uuid: string;
  category_uuid: string | null;
  name: string;
  default_resolver_uuid: string | null;
  default_resolver_name: string | null;
  auto_route_department_id: number | null;
  is_active: boolean;
};
export type AdminSubCategoryInput = { category_uuid: string; name: string; default_resolver_uuid?: string | null; auto_route_department_id?: number | null; is_active?: boolean };

export type RoutingRule = {
  uuid: string;
  rule_name: string;
  match_category_uuid: string | null;
  match_sub_category_uuid: string | null;
  match_department_id: number | null;
  match_branch_uuid: string | null;
  match_priority: Priority | null;
  match_keywords: string[];
  assign_to_user_uuid: string | null;
  assign_to_user_name: string | null;
  /** False when the person this rule assigns to cannot work tickets (no flexidesk.ticket.resolve): the rule cannot assign, and the screen says so. */
  assign_to_user_can_work: boolean | null;
  assign_to_department_id: number | null;
  priority_override: Priority | null;
  is_active: boolean;
  sort_order: number;
};
export type RoutingRuleInput = Omit<RoutingRule, "uuid" | "assign_to_user_name" | "assign_to_user_can_work" | "match_keywords"> & { match_keywords: string[] };

export type SlaConfig = {
  uuid: string;
  category_uuid: string | null;
  name: string;
  priority: Priority;
  response_hours: number;
  resolution_hours: number;
  warning_at_percent: number;
  auto_escalate: boolean;
  working_hours_only: boolean;
  working_days: number[];
  workday_start: string;
  workday_end: string;
  timezone: string;
  holiday_provider: string | null;
  is_active: boolean;
};
export type SlaConfigInput = Omit<SlaConfig, "uuid">;

export type RoutingTargets = {
  users: { uuid: string; name: string }[];
  departments: { id: number; name: string }[];
  branches: { uuid: string; name: string }[];
};

// ── Reports (flexidesk.report.view) ──────────────────────────────────────────

export type ReportWindow = { from: string; to: string } | null;
export type SlaTally = { with_sla: number; met: number; breached: number; undecided: number; compliance_percent: number | null };

export type TicketVolumeReport = {
  window: ReportWindow;
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_category: { category: string; count: number }[];
  by_day: { date: string; count: number }[];
};
export type SlaComplianceReport = { window: ReportWindow; resolution: SlaTally; response: SlaTally; by_priority: Record<string, SlaTally> };
export type EscalationRateReport = {
  window: ReportWindow;
  tickets: number;
  escalated_tickets: number;
  escalation_rate_percent: number | null;
  by_trigger: Record<string, number>;
  highest_level: Record<string, number>;
};
export type ResolutionTimeReport = {
  window: ReportWindow;
  resolved: number;
  average_hours: number | null;
  median_hours: number | null;
  by_priority: Record<string, { resolved: number; average_hours: number | null }>;
};
export type ReopenedRateReport = {
  window: ReportWindow;
  resolved_tickets: number;
  reopened_tickets: number;
  reopened_rate_percent: number | null;
  reopened_more_than_once: number;
};
export type ResolverPerformanceReport = {
  window: ReportWindow;
  min_sample: number;
  notes: string;
  resolvers: (
    | { insufficient_tickets: true }
    | { resolver: { uuid: string; name: string }; assigned: number; resolved: number; avg_first_response_hours: number | null; avg_resolution_hours: number | null; sla_breached: number }
  )[];
};
export type HeatmapReport = { window: null; total_open: number; cells: { category: string; department: string; priority: string; count: number }[] };
export type AdminDashboard = {
  window: null;
  period: string;
  cards: { open: number; unassigned: number; at_risk: number; breached: number; avg_resolution_hours: number | null; csat_average: number | null };
  poor_csat: { ticket_number: string; ticket_uuid: string; rating: number; category: string | null; submitted_at: string }[] | null;
  recent_escalations: { ticket_number: string; ticket_uuid: string; level: number; triggered_by: string; escalated_at: string }[];
};

/** A person a ticket can be handed to (GET options/ticket-assignees): names and a workload count only. */
export type TicketAssignee = { uuid: string; name: string; open_tickets: number };
