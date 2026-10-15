export type DashboardPeriod = "2026-10" | "2026-09";

export interface LetterDashboardDemo {
  periodLabel: string;
  statuses: { key: string; name: string; value: number }[];
  trend: { month: string; generated: number; dispatched: number }[];
  types: { name: string; value: number }[];
  channels: { name: string; value: number }[];
  acknowledgements: { received: number; pending: number };
  templates: { total: number; published: number; ready: number };
  batches: { name: string; status: string; total: number; eligible: number; skipped: number; success: number; failed: number }[];
  recentLetters: { reference: string; employee: string; code: string; template: string; date: string; channel: string | null; status: string }[];
}

const history = [
  { month: "Apr", generated: 240, dispatched: 213 },
  { month: "May", generated: 278, dispatched: 251 },
  { month: "Jun", generated: 302, dispatched: 280 },
  { month: "Jul", generated: 286, dispatched: 263 },
  { month: "Aug", generated: 340, dispatched: 314 },
  { month: "Sep", generated: 384, dispatched: 352 },
  { month: "Oct*", generated: 128, dispatched: 92 },
];

// Frontend-only fixtures. No fake UUIDs or employee IDs are sent to live APIs.
export const demoDashboards: Record<DashboardPeriod, LetterDashboardDemo> = {
  "2026-10": {
    periodLabel: "1–6 October 2026",
    statuses: [
      { key: "dispatched", name: "Dispatched", value: 86 },
      { key: "pending_approval", name: "Pending approval", value: 18 },
      { key: "pending_signature", name: "Pending signature", value: 9 },
      { key: "generated", name: "Generated", value: 8 },
      { key: "failed", name: "Failed", value: 4 },
      { key: "revoked", name: "Revoked", value: 3 },
    ],
    trend: history.slice(1),
    types: [{ name: "Confirmation", value: 42 }, { name: "Salary cert.", value: 28 }, { name: "Promotion", value: 20 }, { name: "NOC", value: 18 }, { name: "Warning", value: 12 }, { name: "Other", value: 8 }],
    channels: [{ name: "Email", value: 52 }, { name: "Employee portal", value: 24 }, { name: "Print", value: 8 }, { name: "Recorded only", value: 2 }],
    acknowledgements: { received: 25, pending: 11 },
    templates: { total: 24, published: 19, ready: 17 },
    batches: [
      { name: "October probation confirmations", status: "Processing", total: 40, eligible: 36, skipped: 4, success: 28, failed: 2 },
      { name: "Salary certificate requests", status: "Completed", total: 20, eligible: 20, skipped: 0, success: 20, failed: 0 },
      { name: "Promotion cycle preview", status: "Dry run", total: 15, eligible: 12, skipped: 3, success: 0, failed: 0 },
    ],
    recentLetters: [
      { reference: "LF-2026-0128", employee: "Ahmed Raza", code: "EMP-0012", template: "Confirmation letter", date: "06 Oct 2026", channel: null, status: "pending_approval" },
      { reference: "LF-2026-0127", employee: "Sara Khan", code: "EMP-0034", template: "Promotion letter", date: "06 Oct 2026", channel: null, status: "pending_signature" },
      { reference: "LF-2026-0126", employee: "Waleed Aslam", code: "EMP-0023", template: "No objection certificate", date: "05 Oct 2026", channel: "Email", status: "dispatched" },
      { reference: "LF-2026-0125", employee: "Ayesha Malik", code: "EMP-0041", template: "Salary certificate", date: "05 Oct 2026", channel: "Portal", status: "dispatched" },
      { reference: "LF-2026-0124", employee: "Syed Affan", code: "EMP-0020", template: "Warning letter", date: "04 Oct 2026", channel: null, status: "failed" },
      { reference: "LF-2026-0123", employee: "Hassan Ali", code: "EMP-0056", template: "Confirmation letter", date: "04 Oct 2026", channel: null, status: "generated" },
    ],
  },
  "2026-09": {
    periodLabel: "1–30 September 2026",
    statuses: [
      { key: "dispatched", name: "Dispatched", value: 330 },
      { key: "pending_approval", name: "Pending approval", value: 12 },
      { key: "pending_signature", name: "Pending signature", value: 7 },
      { key: "generated", name: "Generated", value: 15 },
      { key: "failed", name: "Failed", value: 8 },
      { key: "revoked", name: "Revoked", value: 12 },
    ],
    trend: history.slice(0, 6),
    types: [{ name: "Confirmation", value: 116 }, { name: "Salary cert.", value: 92 }, { name: "Promotion", value: 48 }, { name: "NOC", value: 64 }, { name: "Warning", value: 36 }, { name: "Other", value: 28 }],
    channels: [{ name: "Email", value: 204 }, { name: "Employee portal", value: 88 }, { name: "Print", value: 30 }, { name: "Recorded only", value: 8 }],
    acknowledgements: { received: 102, pending: 8 },
    templates: { total: 22, published: 17, ready: 16 },
    batches: [
      { name: "September probation confirmations", status: "Completed", total: 60, eligible: 48, skipped: 12, success: 48, failed: 0 },
      { name: "Annual salary certificates", status: "Completed with failures", total: 80, eligible: 80, skipped: 0, success: 76, failed: 4 },
      { name: "Department promotion preview", status: "Dry run", total: 25, eligible: 22, skipped: 3, success: 0, failed: 0 },
    ],
    recentLetters: [
      { reference: "LF-2026-0384", employee: "Hassan Ali", code: "EMP-0056", template: "Promotion letter", date: "30 Sep 2026", channel: "Email", status: "dispatched" },
      { reference: "LF-2026-0383", employee: "Sara Khan", code: "EMP-0034", template: "Salary certificate", date: "30 Sep 2026", channel: "Portal", status: "dispatched" },
      { reference: "LF-2026-0382", employee: "Ahmed Raza", code: "EMP-0012", template: "Confirmation letter", date: "29 Sep 2026", channel: null, status: "pending_approval" },
      { reference: "LF-2026-0381", employee: "Ayesha Malik", code: "EMP-0041", template: "No objection certificate", date: "29 Sep 2026", channel: "Email", status: "revoked" },
    ],
  },
};
