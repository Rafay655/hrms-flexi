// lib/audit-trail.ts
// Pure, framework-free helpers for the Audit Trail screens — extracted so they
// can be unit-tested (vitest) independently of the React pages that consume them.

export type RiskLevel = "critical" | "high" | "medium" | "low";

export type Stream = "all" | "business" | "security" | "activity";

/**
 * Normalised timeline row the combined-feed UI renders. The backend
 * (GET /audit-trail) now returns a FLAT list (see CombinedFeedItem); this is the
 * shape after mapping.
 */
export type TimelineItem = {
  id: string;
  stream: "business" | "security" | "activity";
  event_type: string;
  description: string | null;
  causer_name: string | null;
  causer_id: number | null;
  ip_address: string | null;
  module: string | null;
  risk_level: RiskLevel | null;
  created_at: string;
  subject_type: string | null;
  subject_id: number | null;
  properties: Record<string, unknown>;
};

/** Raw flat item returned by GET /audit-trail (combinedFeed) after 2026-06-19. */
export type CombinedFeedItem = {
  stream: "security" | "activity" | "business";
  id: number;
  event_type: string | null;
  risk_level: RiskLevel | null;
  causer_id: number | null;
  module: string | null;
  ip_address: string | null;
  created_at: string;
};

export type TimelineFilterParams = {
  stream?: Stream;
  date_from?: string;
  date_to?: string;
  user_id?: string;
  module?: string;
};

/**
 * Map the backend's flat combined-feed array into TimelineItem[].
 * Raw ids collide across streams, so the React/list key is composite
 * (`{stream}-{id}`). Missing fields normalise to null / "—".
 */
export function mapCombinedFeed(items: CombinedFeedItem[]): TimelineItem[] {
  return items.map((r): TimelineItem => ({
    id: `${r.stream}-${r.id}`,
    stream: r.stream,
    event_type: r.event_type ?? "—",
    description: null,
    causer_name: null,
    causer_id: r.causer_id ?? null,
    ip_address: r.ip_address ?? null,
    module: r.module ?? null,
    risk_level: r.risk_level ?? null,
    created_at: r.created_at,
    subject_type: null,
    subject_id: null,
    properties: {},
  }));
}

/**
 * Apply the combined-feed filter bar (stream/module/user/date) client-side over
 * the recent feed. date_to is inclusive of the whole end-of-day.
 */
export function applyTimelineFilters(
  items: TimelineItem[],
  params: TimelineFilterParams,
): TimelineItem[] {
  let out = items;

  if (params.stream && params.stream !== "all") {
    out = out.filter((i) => i.stream === params.stream);
  }
  if (params.module) {
    out = out.filter((i) => i.module === params.module);
  }
  if (params.user_id) {
    const uid = Number(params.user_id);
    if (!Number.isNaN(uid)) out = out.filter((i) => i.causer_id === uid);
  }
  if (params.date_from) {
    const from = new Date(params.date_from).getTime();
    out = out.filter((i) => new Date(i.created_at).getTime() >= from);
  }
  if (params.date_to) {
    const to = new Date(params.date_to).getTime() + 86_400_000; // inclusive end-of-day
    out = out.filter((i) => new Date(i.created_at).getTime() <= to);
  }

  return out;
}

// ── Business-audit helpers ──────────────────────────────────────────────────

const EVENT_BADGE: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-800",
  updated: "bg-amber-100 text-amber-800",
  deleted: "bg-red-100 text-red-800",
  restored: "bg-blue-100 text-blue-800",
};

export function eventBadgeClass(event: string | null): string {
  return EVENT_BADGE[(event ?? "").toLowerCase()] ?? "bg-gray-100 text-gray-700";
}

/** "App\\Models\\PeopleHub\\Employee" → "Employee" */
export function shortSubject(subjectType: string | null): string {
  if (!subjectType) return "—";
  const parts = subjectType.split("\\");
  return parts[parts.length - 1] || subjectType;
}

export function actorLabel(causerId: number | null): string {
  return causerId ? `User #${causerId}` : "System";
}

/** Render a diff value for display: null/empty → ∅, objects → JSON, else string. */
export function renderDiffValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "∅";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
