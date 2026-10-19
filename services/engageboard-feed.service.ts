/**
 * services/engageboard-feed.service.ts
 * CompanyFeed (Node G13, backend/routes/engageboard/feed.php) — API client.
 *
 * URL prefix: /engageboard  (backend mounts feed.php at `v1/engageboard`, this
 * app's axios baseURL already carries the `/api/v1` segment — see loan-hub.ts's
 * identical convention, followed here letter-for-letter).
 *
 * Responses follow the { success, message, data } envelope; unwrap() strips it.
 *
 * Employee search: FeedService::searchMentionableEmployees() exists in the
 * backend but is NEVER routed (verified — no controller method, no route in
 * feed.php calls it; it is dead code as of this writing). The `@mention`
 * autocomplete therefore uses the same confirmed-reachable employee list this
 * codebase's LetterForge picker already relies on
 * (frontend/services/letterforge-employee-search.ts →
 * GET /people-hub/onboarding), but with `detailed=false` — OnboardingController::index()'s
 * simple-mode branch — which is the ONLY reachable endpoint in this codebase
 * that returns an employee's real numeric `id` alongside its name (the
 * detailed/uuid-only branch that letterforge-employee-search.ts uses cannot
 * supply the numeric id `mentioned_employee_ids`/`recipient_id` require).
 */

import { api } from "@/lib/api";
import type {
  Announcement,
  CompanyPost,
  CreatePostPayload,
  EmployeeOption,
  PaginatedResponse,
  PostComment,
  PostReaction,
  ReactionType,
} from "@/types/engageboard-feed.types";

const BASE = "/engageboard/feed";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(res: { data: { data: any } }): any {
  return res.data.data;
}

interface OnboardingSimpleRow {
  id: number;
  uuid: string;
  employee_code: string;
  name: string;
}

/** Shared, confirmed-reachable employee search — see this file's header docblock. */
export async function searchEmployees(query: string, perPage = 10): Promise<EmployeeOption[]> {
  if (query.trim().length < 2) return [];

  const { data } = await api.get("/people-hub/onboarding", {
    params: { search: query, per_page: perPage, detailed: 0 },
  });

  const rows: OnboardingSimpleRow[] = data.data ?? [];
  return rows.map((row) => ({
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    employee_code: row.employee_code,
  }));
}

/**
 * Employee-id -> display-name directory, for resolving PostCommentResource's
 * bare numeric `employee_id` (that resource has no whenLoaded relation and
 * never returns a name — see CommentThread.tsx's docblock). Built from the
 * same confirmed-reachable /people-hub/onboarding?detailed=false endpoint,
 * fetched once at a large page size (its own validated max is 1000) rather
 * than per-comment, since there is no "resolve these specific ids" variant
 * of this endpoint to call instead.
 */
export async function fetchEmployeeDirectory(): Promise<Map<number, EmployeeOption>> {
  const { data } = await api.get("/people-hub/onboarding", {
    params: { per_page: 1000, detailed: 0 },
  });

  const rows: OnboardingSimpleRow[] = data.data ?? [];
  const map = new Map<number, EmployeeOption>();
  rows.forEach((row) => {
    map.set(row.id, { id: row.id, uuid: row.uuid, name: row.name, employee_code: row.employee_code });
  });
  return map;
}

export const engageBoardFeedService = {
  // ── Feed listing + posts ──────────────────────────────────────────────
  list: (params?: { per_page?: number; page?: number }): Promise<PaginatedResponse<CompanyPost>> =>
    api.get(BASE, { params }).then(unwrap),

  get: (uuid: string): Promise<CompanyPost> => api.get(`${BASE}/posts/${uuid}`).then(unwrap),

  create: (payload: CreatePostPayload): Promise<CompanyPost> => {
    const hasFiles = (payload.attachments ?? []).some((a) => a.file instanceof File);

    if (!hasFiles) {
      // JSON is simpler and sufficient when there are no file uploads (link
      // attachments only, or no attachments at all).
      return api.post(`${BASE}/posts`, payload).then(unwrap);
    }

    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === "attachments" || value === undefined) return;
      form.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    });

    (payload.attachments ?? []).forEach((attachment, index) => {
      form.append(`attachments[${index}][type]`, attachment.type);
      if (attachment.file) form.append(`attachments[${index}][file]`, attachment.file);
      if (attachment.link_url) form.append(`attachments[${index}][link_url]`, attachment.link_url);
      if (attachment.alt_text) form.append(`attachments[${index}][alt_text]`, attachment.alt_text);
    });

    return api
      .post(`${BASE}/posts`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then(unwrap);
  },

  update: (uuid: string, payload: Partial<CreatePostPayload>): Promise<CompanyPost> =>
    api.put(`${BASE}/posts/${uuid}`, payload).then(unwrap),

  remove: (uuid: string): Promise<{ archived: boolean }> =>
    api.delete(`${BASE}/posts/${uuid}`).then(unwrap),

  // ── Reactions ─────────────────────────────────────────────────────────
  react: (uuid: string, reactionType: ReactionType): Promise<PostReaction> =>
    api.post(`${BASE}/posts/${uuid}/react`, { reaction_type: reactionType }).then(unwrap),

  unreact: (uuid: string): Promise<{ removed: boolean }> =>
    api.delete(`${BASE}/posts/${uuid}/react`).then(unwrap),

  // ── Comments ──────────────────────────────────────────────────────────
  listComments: (postUuid: string): Promise<PostComment[]> =>
    api.get(`${BASE}/posts/${postUuid}/comments`).then(unwrap),

  addComment: (
    postUuid: string,
    body: string,
    parentCommentId?: number | null,
  ): Promise<PostComment> =>
    api
      .post(`${BASE}/posts/${postUuid}/comments`, {
        body,
        parent_comment_id: parentCommentId ?? undefined,
      })
      .then(unwrap),

  updateComment: (uuid: string, body: string): Promise<PostComment> =>
    api.put(`${BASE}/comments/${uuid}`, { body }).then(unwrap),

  deleteComment: (uuid: string): Promise<{ is_deleted: boolean }> =>
    api.delete(`${BASE}/comments/${uuid}`).then(unwrap),

  // ── Announcements ─────────────────────────────────────────────────────
  listAnnouncements: (params?: {
    per_page?: number;
    page?: number;
    category?: string;
  }): Promise<PaginatedResponse<Announcement>> =>
    api.get(`${BASE}/announcements`, { params }).then(unwrap),
};
