/**
 * services/flexi-desk.service.ts
 * FlexiDesk (helpdesk) — API client. Backend: routes/flexi-desk.php → /api/v1/flexi-desk/*.
 *
 * Paths are module-relative (NEXT_PUBLIC_API_URL already carries /api/v1; see docs/API_CONVENTIONS.md
 * E4). Responses follow { success, message, data, meta? }; list endpoints are flattened to
 * Paginated<T> here so pages never touch the envelope.
 */

import { api } from "@/lib/api";
import { exportFilename } from "@/lib/flexi-desk";
import type {
  TicketAssignee,
  AdminDashboard,
  AdminCategory,
  AdminCategoryInput,
  AdminSubCategory,
  AdminSubCategoryInput,
  RoutingRule,
  RoutingRuleInput,
  RoutingTargets,
  SlaConfig,
  SlaConfigInput,
  CategoryOption,
  CsatReport,
  CsatSubmission,
  CsatSurvey,
  KbAnalytics,
  KbArticle,
  KbArticleInput,
  KbListParams,
  FileGrievancePayload,
  GrievanceAccessSummary,
  GrievanceParticipant,
  GrievanceReport,
  GrievanceRevocation,
  RevocationKind,
  Grievance,
  GrievanceAttachment,
  GrievanceCommittee,
  GrievanceListParams,
  GrievanceNote,
  GrievanceNoteType,
  GrievanceSummary,
  PersonOption,
  RevealedIdentity,
  CreateTicketPayload,
  EscalationEntry,
  ExceptionType,
  FlexiDeskTicket,
  MutationReceipt,
  Paginated,
  TicketAttachment,
  TicketListParams,
  TicketStatus,
  TicketThreadEntry,
} from "@/types/flexi-desk.types";

const BASE = "/flexi-desk";

type ListEnvelope<T> = { data: T[]; meta: Omit<Paginated<T>, "data"> };

async function list(path: string, params?: TicketListParams): Promise<Paginated<FlexiDeskTicket>> {
  const res = await api.get<ListEnvelope<FlexiDeskTicket>>(`${BASE}/${path}`, { params });

  return { data: res.data.data, ...res.data.meta };
}

/** TanStack Query keys — mirror the resource path (CLAUDE.md 4.3). */
export const flexiDeskKeys = {
  all: ["flexi-desk"] as const,
  categories: () => [...flexiDeskKeys.all, "options", "categories"] as const,
  myTickets: (params?: TicketListParams) => [...flexiDeskKeys.all, "tickets", "my", params ?? {}] as const,
  allTickets: (params?: TicketListParams) => [...flexiDeskKeys.all, "tickets", "all", params ?? {}] as const,
  unassigned: (params?: TicketListParams) => [...flexiDeskKeys.all, "tickets", "unassigned", params ?? {}] as const,
  queue: (params?: TicketListParams) => [...flexiDeskKeys.all, "tickets", "queue", params ?? {}] as const,
  ticket: (uuid: string) => [...flexiDeskKeys.all, "tickets", uuid] as const,
  grievances: (params?: GrievanceListParams) => [...flexiDeskKeys.all, "grievances", params ?? {}] as const,
  grievance: (uuid: string) => [...flexiDeskKeys.all, "grievances", uuid] as const,
  grievanceNotes: (uuid: string) => [...flexiDeskKeys.all, "grievances", uuid, "notes"] as const,
  grievanceAccess: (uuid: string) => [...flexiDeskKeys.all, "grievances", uuid, "access"] as const,
  grievanceParticipants: (uuid: string) => [...flexiDeskKeys.all, "grievances", uuid, "participants"] as const,
  grievanceRevocations: (uuid: string) => [...flexiDeskKeys.all, "grievances", uuid, "revocations"] as const,
  grievanceReport: (from?: string, to?: string) => [...flexiDeskKeys.all, "grievances", "report", from ?? "", to ?? ""] as const,
  grievanceEvidence: (uuid: string) => [...flexiDeskKeys.all, "grievances", uuid, "evidence"] as const,
  committees: (includeDissolved = false) => [...flexiDeskKeys.all, "committees", includeDissolved] as const,
  committeePeople: (search: string) => [...flexiDeskKeys.all, "committees", "people", search] as const,
  kbArticles: (params?: KbListParams) => [...flexiDeskKeys.all, "kb", "list", params ?? {}] as const,
  kbSuggest: (category: string, q: string) => [...flexiDeskKeys.all, "kb", "suggest", category, q] as const,
  kbArticle: (key: string) => [...flexiDeskKeys.all, "kb", "article", key] as const,
  kbAnalytics: (from?: string, to?: string) => [...flexiDeskKeys.all, "kb", "analytics", from ?? "", to ?? ""] as const,
  report: (key: string, from?: string, to?: string) => [...flexiDeskKeys.all, "reports", key, from ?? "", to ?? ""] as const,
  dashboard: () => [...flexiDeskKeys.all, "reports", "dashboard"] as const,
  ticketAssignees: (search: string) => [...flexiDeskKeys.all, "options", "ticket-assignees", search] as const,
  adminCategories: () => [...flexiDeskKeys.all, "admin", "categories"] as const,
  adminSubCategories: () => [...flexiDeskKeys.all, "admin", "sub-categories"] as const,
  adminRules: () => [...flexiDeskKeys.all, "admin", "routing-rules"] as const,
  adminSla: () => [...flexiDeskKeys.all, "admin", "sla-configs"] as const,
  routingTargets: (search: string) => [...flexiDeskKeys.all, "admin", "routing-targets", search] as const,
  csat: (ticketUuid: string) => [...flexiDeskKeys.all, "csat", ticketUuid] as const,
  csatReport: (from?: string, to?: string) => [...flexiDeskKeys.all, "csat", "report", from ?? "", to ?? ""] as const,
  thread: (uuid: string) => [...flexiDeskKeys.all, "tickets", uuid, "thread"] as const,
  escalations: (uuid: string) => [...flexiDeskKeys.all, "tickets", uuid, "escalations"] as const,
  exceptions: (type: ExceptionType | "all", params?: TicketListParams) => [...flexiDeskKeys.all, "tickets", "exceptions", type, params ?? {}] as const,
};

/** Every record of a config resource (the API caps a page at 100; a company has far fewer). */
async function listAll<T>(path: string): Promise<T[]> {
  const res = await api.get<{ data: T[] }>(`${BASE}/${path}`, { params: { per_page: 100 } });
  return res.data.data;
}

export const flexiDeskService = {
  // ── Assigning a ticket ───────────────────────────────────────────────────
  /** People a ticket can be handed to: active, able to resolve tickets, with their open-ticket count. */
  getTicketAssignees: async (search = ""): Promise<TicketAssignee[]> => {
    const res = await api.get(`${BASE}/options/ticket-assignees`, { params: search.trim() ? { search: search.trim() } : undefined });
    return res.data.data as TicketAssignee[];
  },
  assignTicket: async (uuid: string, assigneeUuid: string, note?: string): Promise<FlexiDeskTicket> => {
    const res = await api.post(`${BASE}/tickets/${uuid}/assign`, { assignee_uuid: assigneeUuid, ...(note?.trim() ? { note: note.trim() } : {}) });
    return res.data.data as FlexiDeskTicket;
  },

  // ── Reports ──────────────────────────────────────────────────────────────
  /** One ticket report. Dates are YYYY-MM-DD; omit both for the last 30 days. */
  getReport: async <T>(key: string, from?: string, to?: string): Promise<T> => {
    const res = await api.get(`${BASE}/reports/${key}`, { params: { ...(from ? { from } : {}), ...(to ? { to } : {}) } });
    return res.data.data as T;
  },
  getDashboard: async (): Promise<AdminDashboard> => {
    const res = await api.get(`${BASE}/reports/dashboard`);
    return res.data.data as AdminDashboard;
  },
  /** The file for the same report and window that is on screen. Returns the bytes and the name the server chose. */
  downloadReport: async (key: string, format: "csv" | "pdf", from?: string, to?: string): Promise<{ blob: Blob; filename: string }> => {
    const res = await api.get(`${BASE}/reports/${key}/export`, { params: { format, ...(from ? { from } : {}), ...(to ? { to } : {}) }, responseType: "blob" });
    const match = /filename="?([^";]+)"?/.exec(String(res.headers["content-disposition"] ?? ""));
    return { blob: res.data as Blob, filename: match?.[1] ?? exportFilename(key, format, from ?? "", to ?? "", new Date().toISOString().slice(0, 10)) };
  },

  // ── Admin configuration ──────────────────────────────────────────────────
  listAdminCategories: () => listAll<AdminCategory>("categories"),
  saveAdminCategory: async (uuid: string | null, payload: AdminCategoryInput): Promise<AdminCategory> => {
    const res = uuid ? await api.put(`${BASE}/categories/${uuid}`, payload) : await api.post(`${BASE}/categories`, payload);
    return res.data.data as AdminCategory;
  },
  deleteAdminCategory: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE}/categories/${uuid}`);
  },

  listAdminSubCategories: () => listAll<AdminSubCategory>("sub-categories"),
  saveAdminSubCategory: async (uuid: string | null, payload: AdminSubCategoryInput): Promise<AdminSubCategory> => {
    const res = uuid ? await api.put(`${BASE}/sub-categories/${uuid}`, payload) : await api.post(`${BASE}/sub-categories`, payload);
    return res.data.data as AdminSubCategory;
  },
  deleteAdminSubCategory: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE}/sub-categories/${uuid}`);
  },

  listRoutingRules: () => listAll<RoutingRule>("routing-rules"),
  saveRoutingRule: async (uuid: string | null, payload: Partial<RoutingRuleInput>): Promise<RoutingRule> => {
    const res = uuid ? await api.put(`${BASE}/routing-rules/${uuid}`, payload) : await api.post(`${BASE}/routing-rules`, payload);
    return res.data.data as RoutingRule;
  },
  deleteRoutingRule: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE}/routing-rules/${uuid}`);
  },
  /** The complete list of rule uuids in their new evaluation order; the server rewrites the order in one transaction. */
  reorderRoutingRules: async (order: string[]): Promise<RoutingRule[]> => {
    const res = await api.post(`${BASE}/routing-rules/reorder`, { order });
    return res.data.data as RoutingRule[];
  },
  getRoutingTargets: async (search = ""): Promise<RoutingTargets> => {
    const res = await api.get(`${BASE}/options/routing-targets`, { params: search.trim() ? { search: search.trim() } : undefined });
    return res.data.data as RoutingTargets;
  },

  listSlaConfigs: () => listAll<SlaConfig>("sla-configs"),
  saveSlaConfig: async (uuid: string | null, payload: Partial<SlaConfigInput>): Promise<SlaConfig> => {
    const res = uuid ? await api.put(`${BASE}/sla-configs/${uuid}`, payload) : await api.post(`${BASE}/sla-configs`, payload);
    return res.data.data as SlaConfig;
  },
  deleteSlaConfig: async (uuid: string): Promise<void> => {
    await api.delete(`${BASE}/sla-configs/${uuid}`);
  },

  /** Active categories (+ active sub-categories) for the new-ticket form. */
  getCategoryOptions: async (): Promise<CategoryOption[]> => {
    const res = await api.get(`${BASE}/options/categories`);
    return res.data.data as CategoryOption[];
  },

  getMyTickets: (params?: TicketListParams) => list("tickets/my", params),
  getAllTickets: (params?: TicketListParams) => list("tickets", params),
  getUnassignedTickets: (params?: TicketListParams) => list("tickets/unassigned", params),
  getQueue: (params?: TicketListParams) => list("tickets/queue", params),
  getExceptions: (type?: ExceptionType, params?: TicketListParams) => list("tickets/exceptions", { ...params, ...(type ? { type } : {}) } as TicketListParams),

  getTicket: async (uuid: string): Promise<FlexiDeskTicket> => {
    const res = await api.get(`${BASE}/tickets/${uuid}`);
    return res.data.data as FlexiDeskTicket;
  },

  /**
   * Raise a ticket. Always multipart so attachments and fields share one request.
   * `client_request_id` makes the call idempotent: replaying it returns the original ticket.
   */
  createTicket: async (payload: CreateTicketPayload): Promise<{ ticket: FlexiDeskTicket; created: boolean }> => {
    const form = new FormData();
    form.append("category_uuid", payload.category_uuid);
    if (payload.sub_category_uuid) {
      form.append("sub_category_uuid", payload.sub_category_uuid);
    }
    form.append("subject", payload.subject.trim());
    form.append("description", payload.description.trim());
    if (payload.priority) {
      form.append("priority", payload.priority);
    }
    form.append("client_request_id", payload.client_request_id);
    (payload.attachments ?? []).forEach((file) => form.append("attachments[]", file));

    const res = await api.post(`${BASE}/tickets`, form, { headers: { "Content-Type": "multipart/form-data" } });

    return { ticket: res.data.data as FlexiDeskTicket, created: res.status === 201 };
  },

  /** The conversation. The API already filtered it to this caller's audience (employees never receive internal notes). */
  getThread: async (uuid: string): Promise<TicketThreadEntry[]> => {
    const res = await api.get(`${BASE}/tickets/${uuid}/comments`);
    return res.data.data as TicketThreadEntry[];
  },

  /** External reply, or (resolvers only) an internal note. Files travel with the message in one request. */
  postComment: async (uuid: string, payload: { message: string; isInternal?: boolean; files?: File[] }): Promise<TicketThreadEntry> => {
    const form = new FormData();
    form.append("message", payload.message.trim());
    form.append("is_internal", payload.isInternal ? "1" : "0");
    (payload.files ?? []).forEach((file) => form.append("attachments[]", file));

    const res = await api.post(`${BASE}/tickets/${uuid}/comments`, form, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data.data as TicketThreadEntry;
  },

  deleteComment: async (uuid: string, commentUuid: string): Promise<void> => {
    await api.delete(`${BASE}/tickets/${uuid}/comments/${commentUuid}`);
  },

  addAttachments: async (uuid: string, files: File[]): Promise<TicketAttachment[]> => {
    const form = new FormData();
    files.forEach((file) => form.append("attachments[]", file));

    const res = await api.post(`${BASE}/tickets/${uuid}/attachments`, form, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data.data as TicketAttachment[];
  },

  changeStatus: async (uuid: string, status: TicketStatus, note?: string): Promise<FlexiDeskTicket> => {
    const res = await api.patch(`${BASE}/tickets/${uuid}/status`, { status, note: note || undefined });
    return res.data.data as FlexiDeskTicket;
  },

  /** Answers with a minimal receipt, never a ticket: after a handoff the caller may no longer be allowed to see it. */
  escalate: async (uuid: string, reason: string): Promise<MutationReceipt> => {
    const res = await api.post(`${BASE}/tickets/${uuid}/escalate`, { reason: reason.trim() });
    return res.data.data as MutationReceipt;
  },

  deescalate: async (uuid: string, reason: string): Promise<MutationReceipt> => {
    const res = await api.post(`${BASE}/tickets/${uuid}/deescalate`, { reason: reason.trim() });
    return res.data.data as MutationReceipt;
  },

  getEscalations: async (uuid: string): Promise<EscalationEntry[]> => {
    const res = await api.get(`${BASE}/tickets/${uuid}/escalations`);
    return res.data.data as EscalationEntry[];
  },
  reopenTicket: async (uuid: string, note?: string): Promise<FlexiDeskTicket> => {
    const res = await api.post(`${BASE}/tickets/${uuid}/reopen`, { note });
    return res.data.data as FlexiDeskTicket;
  },

  /** Streams through the API (authorized on every read); the browser saves the returned blob. */
  downloadAttachment: async (ticketUuid: string, attachmentUuid: string, filename: string): Promise<void> => {
    const res = await api.get(`${BASE}/tickets/${ticketUuid}/attachments/${attachmentUuid}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
  // ── Formal grievances ──────────────────────────────────────────────────────

  getGrievances: async (params?: GrievanceListParams): Promise<Paginated<GrievanceSummary>> => {
    const res = await api.get<ListEnvelope<GrievanceSummary>>(`${BASE}/grievances`, { params });
    return { data: res.data.data, ...res.data.meta };
  },

  getGrievance: async (uuid: string): Promise<Grievance> => {
    const res = await api.get(`${BASE}/grievances/${uuid}`);
    return res.data.data as Grievance;
  },

  /** Always multipart so the optional evidence and the fields share one request. The filer is the token, never the payload. */
  fileGrievance: async (payload: FileGrievancePayload): Promise<Grievance> => {
    const form = new FormData();
    form.append("grievance_type", payload.grievance_type);
    form.append("subject", payload.subject.trim());
    form.append("description", payload.description.trim());
    form.append("is_identity_masked", payload.is_identity_masked ? "1" : "0");
    if (payload.source_ticket_uuid) {
      form.append("source_ticket_uuid", payload.source_ticket_uuid);
    }
    (payload.attachments ?? []).forEach((file) => form.append("attachments[]", file));

    const res = await api.post(`${BASE}/grievances`, form, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data.data as Grievance;
  },

  assignCommittee: async (uuid: string, committeeUuid: string, investigatorUuid?: string): Promise<Grievance> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/assign-committee`, { committee_uuid: committeeUuid, investigator_uuid: investigatorUuid || undefined });
    return res.data.data as Grievance;
  },

  startInvestigation: async (uuid: string): Promise<Grievance> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/start-investigation`);
    return res.data.data as Grievance;
  },

  scheduleHearing: async (uuid: string, payload: { scheduled_at: string; mode: "in_person" | "virtual"; location?: string; attendee_uuids?: string[] }): Promise<Grievance> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/hearings`, payload);
    return res.data.data as Grievance;
  },

  getGrievanceNotes: async (uuid: string): Promise<GrievanceNote[]> => {
    const res = await api.get(`${BASE}/grievances/${uuid}/notes`);
    return res.data.data as GrievanceNote[];
  },

  addGrievanceNote: async (uuid: string, noteType: GrievanceNoteType, body: string): Promise<GrievanceNote> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/notes`, { note_type: noteType, body: body.trim() });
    return res.data.data as GrievanceNote;
  },

  issueRuling: async (uuid: string, ruling: string): Promise<Grievance> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/ruling`, { ruling: ruling.trim() });
    return res.data.data as Grievance;
  },

  appealGrievance: async (uuid: string, appealNotes: string): Promise<Grievance> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/appeal`, { appeal_notes: appealNotes.trim() });
    return res.data.data as Grievance;
  },

  resolveAppeal: async (uuid: string, decision: "uphold" | "revise", ruling?: string): Promise<Grievance> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/resolve-appeal`, { decision, ruling: decision === "revise" ? ruling?.trim() : undefined });
    return res.data.data as Grievance;
  },

  closeGrievance: async (uuid: string): Promise<Grievance> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/close`);
    return res.data.data as Grievance;
  },

  /** One caller, one reveal, one audit event. The result is for display in memory only: do not cache or persist it. */
  revealIdentity: async (uuid: string, reason: string): Promise<RevealedIdentity> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/reveal-identity`, { reason: reason.trim() });
    return res.data.data as RevealedIdentity;
  },

  getGrievanceEvidence: async (uuid: string): Promise<GrievanceAttachment[]> => {
    const res = await api.get(`${BASE}/grievances/${uuid}/attachments`);
    return res.data.data as GrievanceAttachment[];
  },

  addGrievanceEvidence: async (uuid: string, files: File[]): Promise<GrievanceAttachment[]> => {
    const form = new FormData();
    files.forEach((file) => form.append("attachments[]", file));

    const res = await api.post(`${BASE}/grievances/${uuid}/attachments`, form, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data.data as GrievanceAttachment[];
  },

  /** Streamed through the API on every read (authorized and audited); the browser saves the returned blob. */
  downloadEvidence: async (uuid: string, attachmentUuid: string, filename: string): Promise<void> => {
    const res = await api.get(`${BASE}/grievances/${uuid}/attachments/${attachmentUuid}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  getGrievanceParticipants: async (uuid: string): Promise<GrievanceParticipant[]> => {
    const res = await api.get(`${BASE}/grievances/${uuid}/participants`);
    return res.data.data as GrievanceParticipant[];
  },

  getGrievanceAccess: async (uuid: string): Promise<GrievanceAccessSummary> => {
    const res = await api.get(`${BASE}/grievances/${uuid}/access`);
    return res.data.data as GrievanceAccessSummary;
  },

  getGrievanceRevocations: async (uuid: string): Promise<GrievanceRevocation[]> => {
    const res = await api.get(`${BASE}/grievances/${uuid}/access-revocations`);
    return res.data.data as GrievanceRevocation[];
  },

  /** Removes one person's access to one case. Audited; append-only; the person is not notified. */
  revokeGrievanceAccess: async (uuid: string, payload: { user_uuid: string; kind: RevocationKind; reason: string }): Promise<GrievanceRevocation> => {
    const res = await api.post(`${BASE}/grievances/${uuid}/access-revocations`, { ...payload, reason: payload.reason.trim() });
    return res.data.data as GrievanceRevocation;
  },

  /** Aggregate statistics only: counts, percentages and averages, with small cells withheld by the server. */
  getGrievanceReport: async (params?: { from?: string; to?: string }): Promise<GrievanceReport> => {
    const res = await api.get(`${BASE}/grievances/report/summary`, { params });
    return res.data.data as GrievanceReport;
  },

  // ── Knowledge Base ─────────────────────────────────────────────────────────

  getKbArticles: async (params?: KbListParams): Promise<Paginated<KbArticle>> => {
    const res = await api.get<ListEnvelope<KbArticle>>(`${BASE}/kb/articles`, { params });
    return { data: res.data.data, ...res.data.meta };
  },

  /** Up to five published articles for the new-ticket form. Reading suggestions records nothing. */
  suggestKb: async (categoryUuid: string, q: string): Promise<KbArticle[]> => {
    const res = await api.get(`${BASE}/kb/articles/suggest`, { params: { ...(categoryUuid ? { category_uuid: categoryUuid } : {}), q } });
    return res.data.data as KbArticle[];
  },

  getKbArticle: async (slug: string): Promise<KbArticle> => {
    const res = await api.get(`${BASE}/kb/articles/${slug}`);
    return res.data.data as KbArticle;
  },

  getKbArticleForEdit: async (uuid: string): Promise<KbArticle> => {
    const res = await api.get(`${BASE}/kb/articles/${uuid}`);
    return res.data.data as KbArticle;
  },

  createKbArticle: async (payload: KbArticleInput): Promise<KbArticle> => {
    const res = await api.post(`${BASE}/kb/articles`, payload);
    return res.data.data as KbArticle;
  },

  updateKbArticle: async (uuid: string, payload: Partial<KbArticleInput>): Promise<KbArticle> => {
    const res = await api.put(`${BASE}/kb/articles/${uuid}`, payload);
    return res.data.data as KbArticle;
  },

  kbAction: async (uuid: string, action: "publish" | "archive" | "unarchive" | "reviewed"): Promise<KbArticle> => {
    const res = await api.post(`${BASE}/kb/articles/${uuid}/${action}`);
    return res.data.data as KbArticle;
  },

  /** One vote per employee: voting again changes it. Pass the ticket to mark an attached article helpful. */
  rateKbArticle: async (uuid: string, helpful: boolean, ticketUuid?: string): Promise<void> => {
    await api.post(`${BASE}/kb/articles/${uuid}/rate`, { helpful, ticket_uuid: ticketUuid });
  },

  /** The employee accepted this suggestion and left the ticket form. A view or a vote is never a deflection. */
  deflectKbArticle: async (uuid: string, clientRequestId: string): Promise<void> => {
    await api.post(`${BASE}/kb/articles/${uuid}/deflect`, { client_request_id: clientRequestId });
  },

  getKbAnalytics: async (params?: { from?: string; to?: string }): Promise<KbAnalytics> => {
    const res = await api.get(`${BASE}/kb/analytics`, { params });
    return res.data.data as KbAnalytics;
  },

  attachKbArticle: async (ticketUuid: string, articleUuid: string): Promise<void> => {
    await api.post(`${BASE}/tickets/${ticketUuid}/kb-articles`, { article_uuid: articleUuid });
  },

  // ── CSAT (feedback only: never changes a ticket) ───────────────────────────

  /** Resolves to null when the ticket has no survey (404). */
  getCsat: async (ticketUuid: string): Promise<CsatSurvey | null> => {
    try {
      const res = await api.get(`${BASE}/tickets/${ticketUuid}/csat`);
      return res.data.data as CsatSurvey;
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  submitCsat: async (ticketUuid: string, payload: CsatSubmission): Promise<CsatSurvey> => {
    const res = await api.post(`${BASE}/tickets/${ticketUuid}/csat`, payload);
    return res.data.data as CsatSurvey;
  },

  getCsatReport: async (params?: { from?: string; to?: string }): Promise<CsatReport> => {
    const res = await api.get(`${BASE}/csat/report`, { params });
    return res.data.data as CsatReport;
  },

  // ── Committees (flexidesk.committee.manage) ────────────────────────────────

  getCommittees: async (includeDissolved = false): Promise<GrievanceCommittee[]> => {
    const res = await api.get(`${BASE}/grievance-committees`, { params: includeDissolved ? { include_dissolved: 1 } : undefined });
    return res.data.data as GrievanceCommittee[];
  },

  searchCommitteePeople: async (search: string): Promise<PersonOption[]> => {
    const res = await api.get(`${BASE}/grievance-committees/eligible-members`, { params: search.trim() ? { search: search.trim() } : undefined });
    return res.data.data as PersonOption[];
  },

  createCommittee: async (payload: { name: string; chairperson_uuid: string; members: { user_uuid: string; role?: string }[]; notes?: string }): Promise<GrievanceCommittee> => {
    const res = await api.post(`${BASE}/grievance-committees`, payload);
    return res.data.data as GrievanceCommittee;
  },

  addCommitteeMember: async (uuid: string, userUuid: string, role = "member"): Promise<GrievanceCommittee> => {
    const res = await api.post(`${BASE}/grievance-committees/${uuid}/members`, { user_uuid: userUuid, role });
    return res.data.data as GrievanceCommittee;
  },

  removeCommitteeMember: async (uuid: string, userUuid: string): Promise<GrievanceCommittee> => {
    const res = await api.delete(`${BASE}/grievance-committees/${uuid}/members/${userUuid}`);
    return res.data.data as GrievanceCommittee;
  },

  dissolveCommittee: async (uuid: string): Promise<GrievanceCommittee> => {
    const res = await api.post(`${BASE}/grievance-committees/${uuid}/dissolve`);
    return res.data.data as GrievanceCommittee;
  },
};
