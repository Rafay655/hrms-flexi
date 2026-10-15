import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ComplianceDashboardByStatus {
  draft: number;
  under_review: number;
  approved: number;
  published: number;
  archived: number;
}

export interface ComplianceDashboardByVerification {
  pending: number;
  verified: number;
  rejected: number;
  expired: number;
}

export interface ComplianceDashboardRecentDoc {
  uuid: string;
  title: string;
  status: string;
  verification_status: string;
  file_size: number;
  legal_hold: boolean;
  created_at: string;
}

export interface ComplianceDashboard {
  total_documents: number;
  by_status: ComplianceDashboardByStatus;
  by_verification: ComplianceDashboardByVerification;
  pending_verification: number;
  expiring_7_days: number;
  expiring_30_days: number;
  expired: number;
  legal_holds: number;
  pki_signed: number;
  pending_signatures: number;
  folders: number;
  storage_bytes: number;
  recent: ComplianceDashboardRecentDoc[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  return Boolean(v);
}

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

/** Drill through up to 2 levels of `{ data: ... }` envelope. */
function unwrapDeep(raw: unknown): Record<string, unknown> {
  let cur: unknown = raw;
  for (let i = 0; i < 3; i++) {
    if (
      cur &&
      typeof cur === "object" &&
      !Array.isArray(cur) &&
      "data" in (cur as Record<string, unknown>)
    ) {
      cur = (cur as Record<string, unknown>).data;
    } else {
      break;
    }
  }
  return cur && typeof cur === "object" && !Array.isArray(cur)
    ? (cur as Record<string, unknown>)
    : {};
}

function normalizeDashboard(raw: unknown): ComplianceDashboard {
  const d = unwrapDeep(raw);
  const bs = (d.by_status ?? {}) as Record<string, unknown>;
  const bv = (d.by_verification ?? {}) as Record<string, unknown>;
  const recentRaw = Array.isArray(d.recent) ? d.recent : [];

  return {
    total_documents: num(d.total_documents),
    by_status: {
      draft: num(bs.draft),
      under_review: num(bs.under_review),
      approved: num(bs.approved),
      published: num(bs.published),
      archived: num(bs.archived),
    },
    by_verification: {
      pending: num(bv.pending),
      verified: num(bv.verified),
      rejected: num(bv.rejected),
      expired: num(bv.expired),
    },
    pending_verification: num(d.pending_verification),
    expiring_7_days: num(d.expiring_7_days),
    expiring_30_days: num(d.expiring_30_days),
    expired: num(d.expired),
    legal_holds: num(d.legal_holds),
    pki_signed: num(d.pki_signed),
    pending_signatures: num(d.pending_signatures),
    folders: num(d.folders),
    storage_bytes: num(d.storage_bytes),
    recent: recentRaw.map((r) => {
      const o = (r ?? {}) as Record<string, unknown>;
      return {
        uuid: str(o.uuid),
        title: str(o.title, "Untitled"),
        status: str(o.status, "draft"),
        verification_status: str(o.verification_status, "pending"),
        file_size: num(o.file_size),
        legal_hold: bool(o.legal_hold),
        created_at: str(o.created_at),
      };
    }),
  };
}

// ── GET dashboard ─────────────────────────────────────────────────────────────

export async function getComplianceDashboard(): Promise<ComplianceDashboard> {
  const { data } = await api.get<ApiEnvelope<ComplianceDashboard>>(
    "/dms/compliance/dashboard",
  );
  return normalizeDashboard(data);
}