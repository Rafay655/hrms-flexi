/**
 * lib/flexi-desk.ts
 * FlexiDesk — pure helpers (no I/O, no React) so they are unit-testable.
 *
 * The numeric limits below MIRROR the backend (config/flexidesk.php + StoreTicketRequest,
 * Rules V1–V3). They exist so employees get instant feedback; the API remains the authority and
 * always re-validates.
 */

import type { EscalationEntry, FlexiDeskApiError, GrievanceStatus, GrievanceType, ReportCell, RevocationKind, SlaState, TicketAudience, TicketPriority, TicketStatus } from "@/types/flexi-desk.types";

export const FIELD_LIMITS = {
  subjectMin: 10,
  subjectMax: 255,
  descriptionMin: 30,
  descriptionMax: 5000,
} as const;

export const ATTACHMENT_LIMITS = {
  maxFiles: 3,
  maxSizeKb: 10240,
  extensions: ["pdf", "docx", "xlsx", "png", "jpg", "jpeg", "zip"],
} as const;

type FileLike = { name: string; size: number };

/** Why a single file cannot be attached, or null when it is fine. */
export function attachmentProblem(file: FileLike): string | null {
  const dot = file.name.lastIndexOf(".");
  const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : "";

  if (!extension || !(ATTACHMENT_LIMITS.extensions as readonly string[]).includes(extension)) {
    return `${file.name}: only ${ATTACHMENT_LIMITS.extensions.join(", ").toUpperCase()} files are allowed.`;
  }
  if (file.size > ATTACHMENT_LIMITS.maxSizeKb * 1024) {
    return `${file.name}: files must be 10 MB or smaller.`;
  }

  return null;
}

export type TicketFormInput = {
  categoryUuid: string;
  subject: string;
  description: string;
  files: FileLike[];
};

export type TicketFormErrors = Partial<Record<"categoryUuid" | "subject" | "description" | "files", string>>;

/** Instant client-side checks. Text is measured after trimming, so padding cannot satisfy a minimum. */
export function validateTicketForm(input: TicketFormInput): TicketFormErrors {
  const errors: TicketFormErrors = {};
  const subject = input.subject.trim();
  const description = input.description.trim();

  if (!input.categoryUuid) {
    errors.categoryUuid = "Choose a category.";
  }
  if (subject.length < FIELD_LIMITS.subjectMin || subject.length > FIELD_LIMITS.subjectMax) {
    errors.subject = `Subject must be ${FIELD_LIMITS.subjectMin}–${FIELD_LIMITS.subjectMax} characters.`;
  }
  if (description.length < FIELD_LIMITS.descriptionMin || description.length > FIELD_LIMITS.descriptionMax) {
    errors.description = `Description must be ${FIELD_LIMITS.descriptionMin}–${FIELD_LIMITS.descriptionMax} characters.`;
  }

  if (input.files.length > ATTACHMENT_LIMITS.maxFiles) {
    errors.files = `You can attach at most ${ATTACHMENT_LIMITS.maxFiles} files.`;
  } else {
    for (const f of input.files) {
      const problem = attachmentProblem(f);
      if (problem) {
        errors.files = problem;
        break;
      }
    }
  }

  return errors;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  escalated: "Escalated",
  pending_info: "Pending information",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

/** Persona-aware wording (Design.md 8): an employee is "waiting" on themselves, a resolver on information. */
export function ticketStatusLabel(status: TicketStatus, audience: TicketAudience): string {
  if (status === "pending_info" && audience === "employee") {
    return "Waiting for your response";
  }

  return STATUS_LABELS[status];
}

/** Tailwind tone. Colour is decoration only: the text label always accompanies it (accessibility). */
const STATUS_TONES: Record<TicketStatus, string> = {
  open: "bg-sky-50 text-sky-700 ring-sky-600/20",
  in_progress: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  escalated: "bg-amber-50 text-amber-800 ring-amber-600/20",
  pending_info: "bg-violet-50 text-violet-700 ring-violet-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  closed: "bg-gray-100 text-gray-700 ring-gray-500/20",
  reopened: "bg-orange-50 text-orange-800 ring-orange-600/20",
};

export function ticketStatusTone(status: TicketStatus): string {
  return STATUS_TONES[status];
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  critical: "Critical",
};

export function priorityLabel(priority: TicketPriority): string {
  return PRIORITY_LABELS[priority];
}

/**
 * Idempotency key for ticket creation. Generate ONCE per form instance and reuse it on retries, so
 * a double-click or a network retry can never create two tickets (the server enforces it; this
 * merely supplies the key). Backend limit: 64 characters.
 */
export function newClientRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** "29 Sep 2026, 14:05" in the viewer's locale; a dash for missing values. */
export function formatTicketDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Duck-typed on purpose: keeps this module free of an axios import (and therefore unit-testable). */
export function parseApiError(err: unknown): FlexiDeskApiError | null {
  const data = (err as { response?: { data?: { error?: Partial<FlexiDeskApiError> } } } | undefined)?.response?.data;
  const error = data?.error;

  if (!error || typeof error.code !== "string" || typeof error.message !== "string") {
    return null;
  }

  return {
    code: error.code,
    message: error.message,
    hint: error.hint ?? null,
    field_errors: error.field_errors,
  };
}

const SERVER_TO_FORM_FIELD: Record<string, keyof TicketFormErrors> = {
  category_uuid: "categoryUuid",
  sub_category_uuid: "categoryUuid",
  subject: "subject",
  description: "description",
  attachments: "files",
};

/** API field names -> the ticket form's field names (first message wins; unknown fields are dropped). */
export function mapServerFieldErrors(fieldErrors: Record<string, string[]> | undefined): TicketFormErrors {
  const mapped: TicketFormErrors = {};

  for (const [serverField, messages] of Object.entries(fieldErrors ?? {})) {
    const formField = SERVER_TO_FORM_FIELD[serverField.split(".")[0]];
    if (formField && !mapped[formField] && messages[0]) {
      mapped[formField] = messages[0];
    }
  }

  return mapped;
}

// ── Sprint 2.1: conversation, SLA, escalation ────────────────────────────────

/** Mirrors backend config/flexidesk.php `attachments.max_per_ticket` (the API is the authority). */
export const MAX_FILES_PER_TICKET = 10;

export const REPLY_LIMITS = { messageMax: 5000, reasonMin: 20, reasonMax: 2000 } as const;

export type ReplyInput = { message: string; files: FileLike[] };
export type ReplyErrors = Partial<Record<"message" | "files", string>>;

/** Instant checks for a reply/note. Whitespace-only text is empty; the API re-validates everything. */
export function validateReply(input: ReplyInput): ReplyErrors {
  const errors: ReplyErrors = {};
  const message = input.message.trim();

  if (message.length < 1) {
    errors.message = "Write a message before sending.";
  } else if (message.length > REPLY_LIMITS.messageMax) {
    errors.message = `Messages can be at most ${REPLY_LIMITS.messageMax} characters.`;
  }

  if (input.files.length > ATTACHMENT_LIMITS.maxFiles) {
    errors.files = `You can attach at most ${ATTACHMENT_LIMITS.maxFiles} files at a time.`;
  } else {
    for (const f of input.files) {
      const problem = attachmentProblem(f);
      if (problem) {
        errors.files = problem;
        break;
      }
    }
  }

  return errors;
}

/** Escalate / de-escalate need a real reason (Rules V9): at least 20 characters after trimming. */
export function validateReason(reason: string): string | null {
  const length = reason.trim().length;
  if (length < REPLY_LIMITS.reasonMin) {
    return `Give a reason of at least ${REPLY_LIMITS.reasonMin} characters (${length} so far).`;
  }
  if (length > REPLY_LIMITS.reasonMax) {
    return `The reason can be at most ${REPLY_LIMITS.reasonMax} characters.`;
  }

  return null;
}

/** Working transitions a resolver can pick from the status control. Escalation, close and reopen have their own actions. */
const WORK_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress"],
  in_progress: ["pending_info", "resolved"],
  pending_info: ["in_progress"],
  escalated: ["in_progress", "pending_info", "resolved"],
  resolved: [],
  reopened: ["in_progress"],
  closed: [],
};

/** Mirrors TicketStateMachine minus escalate/close/reopen. The server still rejects anything invalid. */
export function nextWorkStatuses(status: TicketStatus): TicketStatus[] {
  return WORK_TRANSITIONS[status];
}

const ESCALATABLE: TicketStatus[] = ["open", "in_progress", "pending_info", "escalated", "reopened"];

/** Whether the Escalate action makes sense from this status (the `escalate` ability decides who). */
export function canEscalateFrom(status: TicketStatus): boolean {
  return ESCALATABLE.includes(status);
}

const SLA_LABELS: Record<SlaState, string> = {
  none: "No SLA",
  paused: "SLA paused",
  breached: "SLA breached",
  at_risk: "SLA at risk",
  ok: "Within SLA",
};

export function slaStateLabel(state: SlaState): string {
  return SLA_LABELS[state];
}

const SLA_TONES: Record<SlaState, string> = {
  none: "bg-gray-100 text-gray-700 ring-gray-500/20",
  paused: "bg-violet-50 text-violet-700 ring-violet-600/20",
  breached: "bg-red-50 text-red-700 ring-red-600/20",
  at_risk: "bg-amber-50 text-amber-800 ring-amber-600/20",
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function slaStateTone(state: SlaState): string {
  return SLA_TONES[state];
}

/** "Escalated automatically (SLA breach)" vs "Escalated manually": the trigger is always shown, never implied. */
export function escalationTriggerLabel(entry: Pick<EscalationEntry, "kind" | "triggered_by">): string {
  if (entry.kind === "deescalate") {
    return "De-escalated manually";
  }

  return entry.triggered_by === "sla_breach" ? "Escalated automatically (SLA breach)" : "Escalated manually";
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes < 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Room left for new files on a ticket, given what it already holds (visible files only: the API is the authority). */
export function remainingFileSlots(existing: number): number {
  return Math.max(0, MAX_FILES_PER_TICKET - existing);
}

const REPLY_FIELDS: Record<string, keyof ReplyErrors> = { message: "message", attachments: "files" };

/** API field names -> the reply form's fields (first message wins; unknown fields dropped). */
export function mapReplyServerErrors(fieldErrors: Record<string, string[]> | undefined): ReplyErrors {
  const mapped: ReplyErrors = {};

  for (const [serverField, messages] of Object.entries(fieldErrors ?? {})) {
    const formField = REPLY_FIELDS[serverField.split(".")[0]];
    if (formField && !mapped[formField] && messages[0]) {
      mapped[formField] = messages[0];
    }
  }

  return mapped;
}

// ── Sprint 3: formal grievances ──────────────────────────────────────────────

export const GRIEVANCE_LIMITS = {
  subjectMin: 10,
  subjectMax: 255,
  descriptionMin: 30,
  descriptionMax: 10000,
  textMax: 10000,
  reasonMin: 20,
  reasonMax: 500,
  maxFilesPerUpload: 3,
  maxSizeKb: 10240,
  /** Evidence is stricter than ticket files: no archives. Mirrors config/flexidesk.php grievance.* */
  extensions: ["pdf", "docx", "xlsx", "png", "jpg", "jpeg"],
} as const;

export const GRIEVANCE_TYPES: { value: GrievanceType; label: string }[] = [
  { value: "harassment", label: "Harassment" },
  { value: "discrimination", label: "Discrimination" },
  { value: "policy_violation", label: "Policy violation" },
  { value: "workplace_safety", label: "Workplace safety" },
  { value: "compensation", label: "Compensation" },
  { value: "other", label: "Other" },
];

export function grievanceTypeLabel(type: GrievanceType): string {
  return GRIEVANCE_TYPES.find((t) => t.value === type)?.label ?? "Other";
}

/** The seven stages in order. The timeline renders from this, so the UI can never invent a stage. */
export const GRIEVANCE_STAGES: GrievanceStatus[] = [
  "filed",
  "committee_assigned",
  "under_investigation",
  "hearing_scheduled",
  "ruling_issued",
  "appealed",
  "closed",
];

const GRIEVANCE_STATUS_LABELS: Record<GrievanceStatus, string> = {
  filed: "Filed",
  committee_assigned: "Committee assigned",
  under_investigation: "Under investigation",
  hearing_scheduled: "Hearing scheduled",
  ruling_issued: "Ruling issued",
  appealed: "Appealed",
  closed: "Closed",
};

export function grievanceStatusLabel(status: GrievanceStatus): string {
  return GRIEVANCE_STATUS_LABELS[status];
}

const GRIEVANCE_TONES: Record<GrievanceStatus, string> = {
  filed: "bg-sky-50 text-sky-700 ring-sky-600/20",
  committee_assigned: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  under_investigation: "bg-violet-50 text-violet-700 ring-violet-600/20",
  hearing_scheduled: "bg-amber-50 text-amber-800 ring-amber-600/20",
  ruling_issued: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  appealed: "bg-orange-50 text-orange-800 ring-orange-600/20",
  closed: "bg-gray-100 text-gray-700 ring-gray-500/20",
};

export function grievanceStatusTone(status: GrievanceStatus): string {
  return GRIEVANCE_TONES[status];
}

/** Where a stage sits relative to the current one: drives the timeline (done / current / upcoming). */
export function stageState(stage: GrievanceStatus, current: GrievanceStatus): "done" | "current" | "upcoming" {
  const a = GRIEVANCE_STAGES.indexOf(stage);
  const b = GRIEVANCE_STAGES.indexOf(current);

  return a < b ? "done" : a === b ? "current" : "upcoming";
}

/** Plain-language "what happens next" for the person who filed. Never promises a date the system does not hold. */
export function filerNextStep(status: GrievanceStatus, appealOpen: boolean): string {
  switch (status) {
    case "filed":
      return "HR will review your grievance and assign a committee.";
    case "committee_assigned":
      return "A committee has been assigned and will begin its investigation.";
    case "under_investigation":
      return "The committee is investigating.";
    case "hearing_scheduled":
      return "A hearing has been scheduled. The committee will reach a ruling afterwards.";
    case "ruling_issued":
      return appealOpen ? "A ruling has been issued. You can appeal it until the deadline shown." : "A ruling has been issued. The window to appeal has closed.";
    case "appealed":
      return "Your appeal is with HR leadership for a decision.";
    case "closed":
      return "This grievance is closed.";
  }
}

export type GrievanceFormInput = { grievanceType: string; subject: string; description: string; files: FileLike[] };
export type GrievanceFormErrors = Partial<Record<"grievanceType" | "subject" | "description" | "files", string>>;

/** Evidence-file check (grievance evidence excludes archives, unlike ticket attachments). */
export function evidenceProblem(file: FileLike): string | null {
  const dot = file.name.lastIndexOf(".");
  const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : "";

  if (!extension || !(GRIEVANCE_LIMITS.extensions as readonly string[]).includes(extension)) {
    return `${file.name}: only ${GRIEVANCE_LIMITS.extensions.join(", ").toUpperCase()} files are allowed.`;
  }
  if (file.size > GRIEVANCE_LIMITS.maxSizeKb * 1024) {
    return `${file.name}: files must be 10 MB or smaller.`;
  }

  return null;
}

/** Instant checks while the person types; the API re-validates everything and stays the authority. */
export function validateGrievanceForm(input: GrievanceFormInput): GrievanceFormErrors {
  const errors: GrievanceFormErrors = {};
  const subject = input.subject.trim();
  const description = input.description.trim();

  if (!GRIEVANCE_TYPES.some((t) => t.value === input.grievanceType)) {
    errors.grievanceType = "Choose the type of grievance.";
  }
  if (subject.length < GRIEVANCE_LIMITS.subjectMin || subject.length > GRIEVANCE_LIMITS.subjectMax) {
    errors.subject = `Subject must be ${GRIEVANCE_LIMITS.subjectMin}–${GRIEVANCE_LIMITS.subjectMax} characters.`;
  }
  if (description.length < GRIEVANCE_LIMITS.descriptionMin || description.length > GRIEVANCE_LIMITS.descriptionMax) {
    errors.description = `Description must be ${GRIEVANCE_LIMITS.descriptionMin}–${GRIEVANCE_LIMITS.descriptionMax} characters.`;
  }

  if (input.files.length > GRIEVANCE_LIMITS.maxFilesPerUpload) {
    errors.files = `You can attach at most ${GRIEVANCE_LIMITS.maxFilesPerUpload} files at a time.`;
  } else {
    for (const f of input.files) {
      const problem = evidenceProblem(f);
      if (problem) {
        errors.files = problem;
        break;
      }
    }
  }

  return errors;
}

/** A reason of 20-500 characters (identity reveal). Trimmed: padding cannot satisfy the minimum. */
export function validateRevealReason(reason: string): string | null {
  const length = reason.trim().length;
  if (length < GRIEVANCE_LIMITS.reasonMin) {
    return `Give a reason of at least ${GRIEVANCE_LIMITS.reasonMin} characters (${length} so far).`;
  }
  if (length > GRIEVANCE_LIMITS.reasonMax) {
    return `The reason can be at most ${GRIEVANCE_LIMITS.reasonMax} characters.`;
  }

  return null;
}

/** Non-empty and within the ceiling: notes, ruling, appeal statement. */
export function validateCaseText(text: string): string | null {
  const length = text.trim().length;
  if (length < 1) {
    return "This cannot be empty.";
  }

  return length > GRIEVANCE_LIMITS.textMax ? `This can be at most ${GRIEVANCE_LIMITS.textMax} characters.` : null;
}

/**
 * How long the appeal window has left, in whole days, or null when there is no open window.
 * `now` is injectable so the helper stays pure and testable.
 */
export function appealDaysLeft(deadlineIso: string | null | undefined, now: Date = new Date()): number | null {
  if (!deadlineIso) {
    return null;
  }
  const deadline = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadline) || deadline < now.getTime()) {
    return null;
  }

  return Math.max(0, Math.ceil((deadline - now.getTime()) / 86_400_000));
}

const GRIEVANCE_FIELD_MAP: Record<string, keyof GrievanceFormErrors> = {
  grievance_type: "grievanceType",
  subject: "subject",
  description: "description",
  attachments: "files",
};

/** API field names -> the filing form's field names (first message wins; unknown fields dropped). */
export function mapGrievanceServerErrors(fieldErrors: Record<string, string[]> | undefined): GrievanceFormErrors {
  const mapped: GrievanceFormErrors = {};

  for (const [serverField, messages] of Object.entries(fieldErrors ?? {})) {
    const formField = GRIEVANCE_FIELD_MAP[serverField.split(".")[0]];
    if (formField && !mapped[formField] && messages[0]) {
      mapped[formField] = messages[0];
    }
  }

  return mapped;
}

// ── Sprint 3 close-out ───────────────────────────────────────────────────────

export const REVOCATION_KINDS: { value: RevocationKind; label: string }[] = [
  { value: "offboarding", label: "Left the organisation" },
  { value: "conflict_of_interest", label: "Conflict of interest" },
  { value: "compromise", label: "Suspected compromise" },
  { value: "administrative", label: "Administrative removal" },
];

export function revocationKindLabel(kind: RevocationKind): string {
  return REVOCATION_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

/** A reason of 20-500 characters, trimmed. Same rule as an identity reveal; the API enforces it too. */
export function validateRevocationReason(reason: string): string | null {
  return validateRevealReason(reason);
}

/** Case role at assignment, in words. */
export function caseRoleLabel(role: string): string {
  return ({ chairperson: "Chairperson", investigator: "Investigator", member: "Member", secretary: "Secretary", observer: "Observer" } as Record<string, string>)[role] ?? role;
}

/** A report cell as text: withheld cells say so instead of showing a number that could identify someone. */
export function formatReportCell(cell: ReportCell | undefined, minCell = 5): string {
  if (!cell) {
    return "—";
  }

  return cell.suppressed || cell.count === null ? `Withheld (fewer than ${minCell})` : String(cell.count);
}

/** Percent or average that the server withheld (null) reads as "Not enough cases", never as zero. */
export function formatReportMetric(value: number | null | undefined, suffix = ""): string {
  return value === null || value === undefined ? "Not enough cases" : `${value}${suffix}`;
}

/** Why a person can open a case, in words: assigned to it, or holds organisation-wide grievance access. */
export function accessSourceLabel(sources: ("committee" | "global")[], caseRole: string | null): string {
  const parts: string[] = [];
  if (sources.includes("committee")) {
    parts.push(caseRole ? `Assigned: ${caseRoleLabel(caseRole)}` : "Assigned to the case");
  }
  if (sources.includes("global")) {
    parts.push("Organisation-wide access");
  }

  return parts.join(" · ");
}

// ── Knowledge Base and CSAT ─────────────────────────────────────────────────

export const KB_LIMITS = { titleMin: 5, titleMax: 255, summaryMax: 500, bodyMax: 20000, publishMinChars: 100, maxTags: 10, tagMax: 30 } as const;
export const CSAT_LIMITS = { feedbackMax: 500 } as const;

export type KbFormErrors = Partial<Record<"title" | "body" | "summary" | "tags", string>>;

/** Instant checks for the editor; the API re-validates and stays the authority. */
export function validateKbArticle(input: { title: string; body: string; summary: string; tags: string[] }): KbFormErrors {
  const errors: KbFormErrors = {};
  const title = input.title.trim();

  if (title.length < KB_LIMITS.titleMin || title.length > KB_LIMITS.titleMax) {
    errors.title = `Title must be ${KB_LIMITS.titleMin}–${KB_LIMITS.titleMax} characters.`;
  }
  if (input.body.trim().length < 1 || input.body.length > KB_LIMITS.bodyMax) {
    errors.body = `Content is required and can be at most ${KB_LIMITS.bodyMax} characters.`;
  }
  if (input.summary.length > KB_LIMITS.summaryMax) {
    errors.summary = `The summary can be at most ${KB_LIMITS.summaryMax} characters.`;
  }
  if (input.tags.length > KB_LIMITS.maxTags || input.tags.some((t) => t.length > KB_LIMITS.tagMax)) {
    errors.tags = `Use at most ${KB_LIMITS.maxTags} tags of ${KB_LIMITS.tagMax} characters each.`;
  }

  return errors;
}

/** What still stands between a draft and publishing (Rules V19): a category and 100 characters of content. */
export function publishBlockers(article: { category: unknown; body: string }): string[] {
  const blockers: string[] = [];
  if (!article.category) {
    blockers.push("Choose a category.");
  }
  if (article.body.replace(/<[^>]*>/g, "").trim().length < KB_LIMITS.publishMinChars) {
    blockers.push(`Write at least ${KB_LIMITS.publishMinChars} characters of content.`);
  }

  return blockers;
}

/** "vpn, network" -> ["vpn","network"]: trimmed, lower-cased, de-duplicated. */
export function parseTags(text: string): string[] {
  return Array.from(new Set(text.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)));
}

/** Not-helpful share as text; withheld ratios (too few votes) never read as zero. */
export function formatNotHelpful(ratio: number | null): string {
  return ratio === null ? "Not enough votes" : `${Math.round(ratio * 100)}% not helpful`;
}

/** The suggestion box only asks the server once there is something worth asking about. */
export function shouldSuggest(categoryUuid: string, text: string): boolean {
  return categoryUuid !== "" || text.trim().length >= 3;
}

export function validateCsat(input: { rating: number; feedback: string }): { rating?: string; feedback?: string } {
  const errors: { rating?: string; feedback?: string } = {};
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.rating = "Choose a rating from 1 to 5.";
  }
  if (input.feedback.length > CSAT_LIMITS.feedbackMax) {
    errors.feedback = `Comments can be at most ${CSAT_LIMITS.feedbackMax} characters.`;
  }

  return errors;
}

const RATING_WORDS = ["", "Very unhappy", "Unhappy", "Okay", "Happy", "Very happy"];

export function ratingLabel(rating: number): string {
  return RATING_WORDS[rating] ?? "";
}

/** A CSAT breakdown row as text. Under-sampled rows say so and reveal nothing else. */
export function csatRowLabel(row: { insufficient_responses: boolean; resolver?: { name: string } | null; category?: { name: string } | null }): string {
  if (row.insufficient_responses) {
    return "Insufficient responses";
  }

  return row.resolver?.name ?? row.category?.name ?? "Unassigned";
}
// ── Admin configuration (categories, routing, SLA) ───────────────────────────────────────────────────────────────

/** A copy of the list with one item moved. The target is clamped; an out-of-range source leaves the list as it was. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = [...list];
  if (from < 0 || from >= copy.length) {
    return copy;
  }
  const [item] = copy.splice(from, 1);
  copy.splice(Math.max(0, Math.min(copy.length, to)), 0, item);

  return copy;
}

export type SlaFormInput = {
  name: string;
  response_hours: number;
  resolution_hours: number;
  warning_at_percent: number;
  working_hours_only: boolean;
  working_days: number[];
  workday_start: string;
  workday_end: string;
};
export type SlaFormErrors = Partial<Record<"name" | "response_hours" | "resolution_hours" | "warning_at_percent" | "working_days" | "workday_end", string>>;

/** Instant checks mirroring the API (which stays the authority): resolution must be longer than response. */
export function validateSlaForm(input: SlaFormInput): SlaFormErrors {
  const errors: SlaFormErrors = {};
  const hours = (n: number) => Number.isInteger(n) && n >= 1 && n <= 65535;

  if (input.name.trim().length < 1 || input.name.trim().length > 100) {
    errors.name = "Give the SLA a name of up to 100 characters.";
  }
  if (!hours(input.response_hours)) {
    errors.response_hours = "Response time must be a whole number of hours, 1 to 65535.";
  }
  if (!hours(input.resolution_hours)) {
    errors.resolution_hours = "Resolution time must be a whole number of hours, 1 to 65535.";
  } else if (hours(input.response_hours) && input.resolution_hours <= input.response_hours) {
    errors.resolution_hours = "Resolution time must be longer than the response time.";
  }
  if (!Number.isInteger(input.warning_at_percent) || input.warning_at_percent < 1 || input.warning_at_percent > 99) {
    errors.warning_at_percent = "The warning point must be between 1% and 99% of the time.";
  }
  if (input.working_hours_only) {
    if (input.working_days.length < 1) {
      errors.working_days = "Choose at least one working day.";
    }
    if (input.workday_end <= input.workday_start) {
      errors.workday_end = "The workday must end after it starts.";
    }
  }

  return errors;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function workingDaysLabel(days: number[]): string {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (sorted.length === 7) {
    return "every day";
  }
  const consecutive = sorted.length > 2 && sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);

  return consecutive ? `${DAY_NAMES[sorted[0] - 1]}–${DAY_NAMES[sorted[sorted.length - 1] - 1]}` : sorted.map((d) => DAY_NAMES[d - 1]).join(", ");
}

/** When the SLA clock actually runs, in plain words, so nobody has to guess what "working hours only" means. */
export function slaCoverageLabel(sla: { working_hours_only: boolean; working_days: number[]; workday_start: string; workday_end: string; timezone: string; holiday_provider?: string | null }): string {
  if (!sla.working_hours_only) {
    return "Runs around the clock, every day.";
  }
  const holidays = sla.holiday_provider ? ", skipping public holidays" : "";

  return `Runs ${workingDaysLabel(sla.working_days)}, ${sla.workday_start}–${sla.workday_end} (${sla.timezone})${holidays}.`;
}

export type RoutingRuleFormInput = {
  rule_name: string;
  match_category_uuid: string;
  match_sub_category_uuid: string;
  match_department_id: string;
  match_branch_uuid: string;
  match_priority: string;
  match_keywords: string;
  assign_to_user_uuid: string;
  assign_to_department_id: string;
};
export type RoutingRuleFormErrors = Partial<Record<"rule_name" | "match_category_uuid" | "match_keywords" | "assign_to_user_uuid", string>>;

/** Comma-separated keywords as a clean list. */
export function parseKeywords(text: string): string[] {
  return text.split(",").map((k) => k.trim()).filter((k) => k !== "");
}

/** A rule needs a name, at least one match condition, and exactly one target. The API re-checks ownership of every reference. */
export function validateRoutingRuleForm(input: RoutingRuleFormInput): RoutingRuleFormErrors {
  const errors: RoutingRuleFormErrors = {};
  const keywords = parseKeywords(input.match_keywords);

  if (input.rule_name.trim().length < 1 || input.rule_name.trim().length > 150) {
    errors.rule_name = "Give the rule a name of up to 150 characters.";
  }
  const hasCondition = !!(input.match_category_uuid || input.match_sub_category_uuid || input.match_department_id || input.match_branch_uuid || input.match_priority) || keywords.length > 0;
  if (!hasCondition) {
    errors.match_category_uuid = "Choose at least one thing to match: a category, sub-category, department, branch, priority or keyword.";
  }
  if (keywords.length > 20 || keywords.some((k) => k.length > 100)) {
    errors.match_keywords = "Use at most 20 keywords of 100 characters each.";
  }
  if (Number(!!input.assign_to_user_uuid) + Number(!!input.assign_to_department_id) !== 1) {
    errors.assign_to_user_uuid = "Choose exactly one target: a person or a department.";
  }

  return errors;
}

export type RoutingLookups = {
  categories: Record<string, string>;
  subCategories: Record<string, string>;
  departments: Record<string, string>;
  branches: Record<string, string>;
  users: Record<string, string>;
};

/** A rule as "when ... then ...". A reference that no longer resolves says so instead of showing a raw id. */
export function routingRuleSummary(
  rule: {
    match_category_uuid?: string | null;
    match_sub_category_uuid?: string | null;
    match_department_id?: number | null;
    match_branch_uuid?: string | null;
    match_priority?: string | null;
    match_keywords?: string[] | null;
    assign_to_user_uuid?: string | null;
    assign_to_department_id?: number | null;
    priority_override?: string | null;
  },
  lookups: RoutingLookups,
): { when: string; then: string } {
  const when: string[] = [];
  if (rule.match_category_uuid) when.push(`Category ${lookups.categories[rule.match_category_uuid] ?? "(removed)"}`);
  if (rule.match_sub_category_uuid) when.push(`Sub-category ${lookups.subCategories[rule.match_sub_category_uuid] ?? "(removed)"}`);
  if (rule.match_department_id) when.push(`Department ${lookups.departments[String(rule.match_department_id)] ?? "(removed)"}`);
  if (rule.match_branch_uuid) when.push(`Branch ${lookups.branches[rule.match_branch_uuid] ?? "(removed)"}`);
  if (rule.match_priority) when.push(`Priority ${rule.match_priority}`);
  if (rule.match_keywords && rule.match_keywords.length > 0) when.push(`Keywords ${rule.match_keywords.join(", ")}`);

  let then = rule.assign_to_user_uuid
    ? `Assign to ${lookups.users[rule.assign_to_user_uuid] ?? "(unknown person)"}`
    : rule.assign_to_department_id
      ? `Send to department ${lookups.departments[String(rule.assign_to_department_id)] ?? "(unknown department)"}`
      : "No target";
  if (rule.priority_override) {
    then += ` · set priority to ${rule.priority_override}`;
  }

  return { when: when.join(" · ") || "Any ticket", then };
}

/** The API's field_errors ({ field: [messages] }) as one message per field. */
export function flattenFieldErrors(fieldErrors: Record<string, string[]> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fieldErrors ?? {})) {
    if (messages[0]) {
      out[field] = messages[0];
    }
  }

  return out;
}

// ── Reports (Sprint 7) ───────────────────────────────────────────────────────────────────────────────────────────

export type ReportKey =
  | "ticket-volume" | "sla-compliance" | "escalation-rate" | "resolution-time" | "resolver-performance" | "open-ticket-heatmap" | "reopened-rate";

/** R1–R10. Three of them already have their own screens (CSAT, grievance summary, KB effectiveness) and are linked, not rebuilt. */
export const REPORT_CATALOGUE: { key: string; code: string; title: string; description: string; href?: string }[] = [
  { key: "ticket-volume", code: "R1", title: "Ticket volume", description: "Tickets raised, by status, priority, category and day." },
  { key: "sla-compliance", code: "R2", title: "SLA compliance", description: "Resolution and first-response targets met or breached." },
  { key: "escalation-rate", code: "R3", title: "Escalation rate", description: "How many tickets were escalated, why, and how high." },
  { key: "resolution-time", code: "R4", title: "Average resolution time", description: "Hours from raising to resolving, excluding paused time." },
  { key: "resolver-performance", code: "R5", title: "Resolver performance", description: "Workload and timing per resolver. Operational figures, not a personnel assessment." },
  { key: "csat", code: "R6", title: "CSAT satisfaction", description: "Satisfaction ratings and response rate.", href: "/flexi-desk/csat" },
  { key: "open-ticket-heatmap", code: "R7", title: "Open ticket heatmap", description: "Work still open, by category, department and priority." },
  { key: "grievance-summary", code: "R8", title: "Grievance summary", description: "Aggregate case statistics. Never identifies a person.", href: "/flexi-desk/grievances/report" },
  { key: "kb-effectiveness", code: "R9", title: "Knowledge base effectiveness", description: "How helpful articles are and how many tickets they deflect.", href: "/flexi-desk/knowledge-base" },
  { key: "reopened-rate", code: "R10", title: "Reopened rate", description: "Resolved tickets that were later reopened, from the history." },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value: string): number | null {
  if (!ISO_DATE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);

  return back.getUTCFullYear() === y && back.getUTCMonth() === m - 1 && back.getUTCDate() === d ? t : null;
}

/** The last 30 days including today, as the API defaults it. */
export function defaultReportWindow(today: string): { from: string; to: string } {
  const t = parseIsoDate(today) ?? Date.now();
  const from = new Date(t - 29 * 86_400_000);

  return { from: from.toISOString().slice(0, 10), to: new Date(t).toISOString().slice(0, 10) };
}

/** Mirrors the API's window rules (at most 12 months, never in the future). The API remains the authority. */
export function reportWindowError(from: string, to: string, today: string): string | null {
  if (!from && !to) return null;
  const f = from ? parseIsoDate(from) : null;
  const t = to ? parseIsoDate(to) : null;
  const now = parseIsoDate(today) ?? Date.now();

  if ((from && f === null) || (to && t === null)) return "Enter a valid date.";
  if (f !== null && t !== null && f > t) return "The start date must be on or before the end date.";
  if ((f !== null && f > now) || (t !== null && t > now)) return "Dates cannot be in the future.";
  if (f !== null && t !== null) {
    const start = new Date(f);
    if (Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 12, start.getUTCDate()) < t) return "The window can be at most 12 months.";
  }

  return null;
}

/** A withheld or empty figure is said in words; it is never shown as a misleading zero. */
export function formatReportValue(value: number | null | undefined, unit: "percent" | "hours" | "count" | "rating"): string {
  if (value === null || value === undefined) return "Not enough data";
  switch (unit) {
    case "percent": return `${Number(value.toFixed(1))}%`;
    case "hours": return `${value.toFixed(1)} h`;
    case "rating": return `${value.toFixed(1)} / 5`;
    default: return String(value);
  }
}

/** 0 (none) to 4 (busiest cell), relative to the busiest cell of the map. */
export function heatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;

  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as 1 | 2 | 3 | 4;
}

/**
 * The file name the server gives an export. Built here too because a browser hides the Content-Disposition header from a page on
 * another origin unless the API exposes it, and the name is fully determined by the report, window and (for open work) today.
 */
export function exportFilename(key: string, format: "csv" | "pdf", from: string, to: string, today: string): string {
  return key === "open-ticket-heatmap" ? `flexidesk-${key}-${today}.${format}` : `flexidesk-${key}-${from}_to_${to}.${format}`;
}

// ── Assigning tickets from the unassigned queue ──────────────────────────────────────────────────────────────────

/** A finished ticket stays with whoever resolved it; only an unfinished one can be handed to someone else. */
export function canReassignFrom(status: TicketStatus): boolean {
  return status !== "resolved" && status !== "closed";
}

/** How loaded a person already is, shown beside their name in the picker so work can be spread. */
export function workloadLabel(openTickets: number): string {
  return openTickets === 0 ? "no open tickets" : `${openTickets} open ticket${openTickets === 1 ? "" : "s"}`;
}
