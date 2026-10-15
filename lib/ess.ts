// lib/ess.ts
// Pure, framework-free helpers for the ESS Portal — extracted so they can be unit-tested
// (vitest) independently of the React pages that consume them.
// Mirrors the lib/audit-trail.ts and lib/flexi-import.ts pattern.

import type { EssCapability, EssMe } from "@/types/ess";
import type {
  AttendanceDay,
  AttendanceStatus,
} from "@/types/ess-attendance";
import type {
  CompOffStatus,
  LeaveBalance,
  LeaveRequestStatus,
} from "@/types/ess-leave";


export function navAreas(me: EssMe | null | undefined): EssCapability[] {
  return (me?.capabilities ?? []).filter((c) => c.available);
}

/** Is a specific area usable by this user? Use to guard a page, not just to hide a link. */
export function hasArea(me: EssMe | null | undefined, key: string): boolean {
  return navAreas(me).some((c) => c.key === key);
}

export function areaUnavailableReason(
  me: EssMe | null | undefined,
  key: string,
): "module_not_built" | "not_entitled" | null {
  const area = (me?.capabilities ?? []).find((c) => c.key === key);
  if (!area || area.available) return null;
  return area.reason === "available" ? null : area.reason;
}


export function activeAreaKey(
  me: EssMe | null | undefined,
  pathname: string,
): string | null {
  const match = navAreas(me)
    .filter((c) => pathname === c.route || pathname.startsWith(`${c.route}/`))
    .sort((a, b) => b.route.length - a.route.length)[0];

  return match?.key ?? null;
}

export function essDisplayName(me: EssMe | null | undefined): string {
  return me?.employee?.display_name?.trim() || me?.user?.name?.trim() || "";
}

/** Initials for the avatar fallback. "Ada Lovelace" → "AL"; single word → first letter. */
export function essInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late_in: "Late In",
  early_out: "Early Out",
  half_day: "Half Day",
  out_missing: "Missing Punch",
  present_holiday: "Worked (Holiday)",
  present_off_day: "Worked (Off Day)",
  weekend: "Weekend",
  holiday: "Holiday",
  on_leave: "On Leave",
};

export function attendanceStatusLabel(status: string): string {
  return ATTENDANCE_STATUS_LABELS[status as AttendanceStatus] ?? status;
}

export function attendanceStatusTone(
  status: string,
): "good" | "warn" | "neutral" {
  switch (status) {
    case "present":
    case "present_holiday":
    case "present_off_day":
      return "good";
    case "absent":
    case "late_in":
    case "early_out":
    case "half_day":
    case "out_missing":
      return "warn";
    default:
      return "neutral";
  }
}

/**
 * Minutes → "7h 30m". Returns "—" for null/0 so an empty cell reads as "no data" rather
 * than an authoritative "0h 0m".
 */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes === 0) return "—";

  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;

  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

/** "2026-07-17 09:04:11" → "09:04". Null-safe; returns "—" when no punch was recorded. */
export function formatPunchTime(value: string | null | undefined): string {
  if (!value) return "—";
  const match = /\d{2}:\d{2}/.exec(value.slice(11));
  return match ? match[0] : "—";
}

export function summariseAttendance(days: AttendanceDay[]): {
  daysPresent: number;
  daysAbsent: number;
  exceptions: number;
  workMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
} {
  return days.reduce(
    (acc, d) => {
      const tone = attendanceStatusTone(d.status);
      if (tone === "good") acc.daysPresent += 1;
      if (d.status === "absent") acc.daysAbsent += 1;
      if (tone === "warn") acc.exceptions += 1;

      acc.workMinutes += d.work_minutes ?? 0;
      acc.overtimeMinutes += d.overtime_minutes ?? 0;
      acc.lateMinutes += d.late_minutes ?? 0;

      return acc;
    },
    {
      daysPresent: 0,
      daysAbsent: 0,
      exceptions: 0,
      workMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
    },
  );
}

export function toMonthFilter(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-07" → "July 2026", for the month picker label. */
export function monthFilterLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return month;
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}



const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  revoked: "Revoked",
};

export function leaveStatusLabel(status: string): string {
  return LEAVE_STATUS_LABELS[status as LeaveRequestStatus] ?? status;
}

export function leaveStatusTone(
  status: string,
): "good" | "warn" | "neutral" {
  switch (status) {
    case "approved":
      return "good";
    case "pending":
      return "warn";
    default:
      return "neutral";
  }
}

const COMPOFF_STATUS_LABELS: Record<CompOffStatus, string> = {
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

export function compOffStatusLabel(status: string): string {
  return COMPOFF_STATUS_LABELS[status as CompOffStatus] ?? status;
}

export function compOffStatusTone(
  status: string,
): "good" | "warn" | "neutral" {
  switch (status) {
    case "approved":
      return "good";
    case "pending_approval":
      return "warn";
    default:
      // expired / rejected — closed, informational, not an alarm.
      return "neutral";
  }
}

/**
 * Days → "12.5 days" / "1 day" / "0.5 day". Half-days are real in this system (total_days can
 * be 0.5), so this must not round. Null/undefined → "—".
 */
export function formatDays(days: number | null | undefined): string {
  if (days === null || days === undefined) return "—";
  const n = Math.round(days * 10) / 10; // trim float noise, keep the half
  const label = n === 1 ? "day" : "days";
  return `${n} ${label}`;
}


export function summariseLeaveBalances(balances: LeaveBalance[]): {
  totalAvailable: number;
  totalUsed: number;
  types: number;
  paidTypes: number;
} {
  return balances.reduce(
    (acc, b) => {
      acc.totalAvailable += b.available_balance ?? 0;
      acc.totalUsed += b.used_balance ?? 0;
      acc.types += 1;
      if (b.leave_type?.is_paid) acc.paidTypes += 1;
      return acc;
    },
    { totalAvailable: 0, totalUsed: 0, types: 0, paidTypes: 0 },
  );
}

// ── Payslips (ESS-PAY-01/02) ─────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];


export function payslipPeriodLabel(row: {
  period_month: number;
  period_year: number;
}): string {
  const name = MONTH_NAMES[row.period_month - 1];
  return name
    ? `${name} ${row.period_year}`
    : `${String(row.period_month).padStart(2, "0")}/${row.period_year}`;
}
