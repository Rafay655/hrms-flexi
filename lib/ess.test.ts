import { describe, expect, it } from "vitest";

import {
  activeAreaKey,
  areaUnavailableReason,
  attendanceStatusLabel,
  attendanceStatusTone,
  compOffStatusLabel,
  compOffStatusTone,
  essDisplayName,
  essInitials,
  formatDays,
  formatMinutes,
  formatPunchTime,
  hasArea,
  leaveStatusLabel,
  leaveStatusTone,
  monthFilterLabel,
  navAreas,
  payslipPeriodLabel,
  summariseAttendance,
  summariseLeaveBalances,
  toMonthFilter,
} from "./ess";
import type { EssCapability, EssMe } from "@/types/ess";
import type { AttendanceDay } from "@/types/ess-attendance";
import type { LeaveBalance } from "@/types/ess-leave";

const cap = (over: Partial<EssCapability>): EssCapability => ({
  key: "x",
  label: "X",
  route: "/ess/x",
  icon: "Circle",
  screens: [],
  available: true,
  reason: "available",
  ...over,
});

const me = (capabilities: EssCapability[], employeeName?: string | null): EssMe => ({
  user: {
    uuid: "u-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    avatar: null,
    roles: ["employee"],
  },
  employee:
    employeeName === undefined
      ? { uuid: "e-1", code: "E100", display_name: "Ada L." }
      : employeeName === null
        ? null
        : { uuid: "e-1", code: "E100", display_name: employeeName },
  capabilities,
});

describe("navAreas", () => {
  it("returns only available areas", () => {
    const result = navAreas(
      me([
        cap({ key: "leave" }),
        cap({ key: "performance", available: false, reason: "module_not_built" }),
      ]),
    );

    expect(result.map((c) => c.key)).toEqual(["leave"]);
  });

  // The load-bearing case: a deferred module must never reach the nav.
  it("hides areas whose module is not built", () => {
    const result = navAreas(
      me([
        cap({ key: "tickets", available: false, reason: "module_not_built" }),
        cap({ key: "benefits", available: false, reason: "module_not_built" }),
      ]),
    );

    expect(result).toEqual([]);
  });

  it("hides areas the user is not entitled to", () => {
    const result = navAreas(
      me([cap({ key: "payslips", available: false, reason: "not_entitled" })]),
    );

    expect(result).toEqual([]);
  });

  it("is safe on null/undefined (first paint, before /me resolves)", () => {
    expect(navAreas(null)).toEqual([]);
    expect(navAreas(undefined)).toEqual([]);
  });
});

describe("hasArea", () => {
  it("is true only for available areas", () => {
    const session = me([
      cap({ key: "leave" }),
      cap({ key: "performance", available: false, reason: "module_not_built" }),
    ]);

    expect(hasArea(session, "leave")).toBe(true);
    expect(hasArea(session, "performance")).toBe(false);
    expect(hasArea(session, "nope")).toBe(false);
  });
});

describe("areaUnavailableReason", () => {
  it("explains why an area is missing", () => {
    const session = me([
      cap({ key: "tickets", available: false, reason: "module_not_built" }),
      cap({ key: "payslips", available: false, reason: "not_entitled" }),
      cap({ key: "leave" }),
    ]);

    expect(areaUnavailableReason(session, "tickets")).toBe("module_not_built");
    expect(areaUnavailableReason(session, "payslips")).toBe("not_entitled");
    expect(areaUnavailableReason(session, "leave")).toBeNull();
    expect(areaUnavailableReason(session, "unknown")).toBeNull();
  });
});

describe("activeAreaKey", () => {
  const session = me([
    cap({ key: "leave", route: "/ess/leave" }),
    cap({ key: "dashboard", route: "/ess/dashboard" }),
  ]);

  it("matches an exact route", () => {
    expect(activeAreaKey(session, "/ess/leave")).toBe("leave");
  });

  it("matches a nested route", () => {
    expect(activeAreaKey(session, "/ess/leave/apply")).toBe("leave");
  });

  it("returns null when nothing matches", () => {
    expect(activeAreaKey(session, "/ess/unknown")).toBeNull();
  });

  it("prefers the longest matching route, not the first", () => {
    const nested = me([
      cap({ key: "leave", route: "/ess/leave" }),
      cap({ key: "leave-approvals", route: "/ess/leave/approvals" }),
    ]);

    expect(activeAreaKey(nested, "/ess/leave/approvals")).toBe("leave-approvals");
  });

  it("does not match a partial path segment", () => {
    // "/ess/leaves" must NOT activate "/ess/leave".
    expect(activeAreaKey(session, "/ess/leaves")).toBeNull();
  });

  it("never activates an unavailable area", () => {
    const blocked = me([
      cap({ key: "performance", route: "/ess/performance", available: false, reason: "module_not_built" }),
    ]);

    expect(activeAreaKey(blocked, "/ess/performance")).toBeNull();
  });
});

describe("essDisplayName", () => {
  it("prefers the employee display name", () => {
    expect(essDisplayName(me([], "Ada L."))).toBe("Ada L.");
  });

  it("falls back to the user name when there is no employee record", () => {
    expect(essDisplayName(me([], null))).toBe("Ada Lovelace");
  });

  it("returns an empty string rather than 'undefined' when nothing is known", () => {
    expect(essDisplayName(null)).toBe("");
  });
});

describe("essInitials", () => {
  it("uses first and last initials", () => {
    expect(essInitials("Ada Lovelace")).toBe("AL");
  });

  it("handles a single name", () => {
    expect(essInitials("Ada")).toBe("A");
  });

  it("ignores middle names and extra whitespace", () => {
    expect(essInitials("  Ada  Byron   Lovelace  ")).toBe("AL");
  });

  it("is safe on empty input", () => {
    expect(essInitials("")).toBe("");
    expect(essInitials("   ")).toBe("");
  });
});

// ── Attendance helpers ───────────────────────────────────────────────────────

const day = (over: Partial<AttendanceDay>): AttendanceDay => ({
  id: "d-1",
  attendance_date: "2026-07-01",
  status: "present",
  shift: null,
  first_in: null,
  last_out: null,
  work_minutes: null,
  overtime_minutes: null,
  late_minutes: null,
  early_out_minutes: null,
  night_minutes: null,
  break_minutes: null,
  is_geofence_valid: null,
  geofence_violation_meters: null,
  is_regularized: false,
  is_locked: false,
  ...over,
});

describe("attendanceStatusLabel", () => {
  it("maps every enum value to a human label", () => {
    expect(attendanceStatusLabel("out_missing")).toBe("Missing Punch");
    expect(attendanceStatusLabel("present_off_day")).toBe("Worked (Off Day)");
  });

  it("falls back to the raw value for an unknown status rather than throwing", () => {
    expect(attendanceStatusLabel("future_enum_value")).toBe("future_enum_value");
  });
});

describe("attendanceStatusTone", () => {
  it("treats worked days as good", () => {
    for (const s of ["present", "present_holiday", "present_off_day"]) {
      expect(attendanceStatusTone(s)).toBe("good");
    }
  });

  it("treats real exceptions as warn", () => {
    for (const s of ["absent", "late_in", "early_out", "half_day", "out_missing"]) {
      expect(attendanceStatusTone(s)).toBe("warn");
    }
  });

  it("treats days with nothing expected as neutral, NOT a problem", () => {
    // weekend / holiday / on_leave must never be coloured like an exception.
    for (const s of ["weekend", "holiday", "on_leave"]) {
      expect(attendanceStatusTone(s)).toBe("neutral");
    }
  });
});

describe("formatMinutes", () => {
  it("formats hours and minutes", () => {
    expect(formatMinutes(450)).toBe("7h 30m");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(45)).toBe("45m");
  });

  it("renders null/undefined/0 as an em dash, not '0h'", () => {
    // A worked-hours cell of 0 must read as "no data", never an authoritative zero.
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(undefined)).toBe("—");
    expect(formatMinutes(0)).toBe("—");
  });

  it("handles negative minutes", () => {
    expect(formatMinutes(-90)).toBe("-1h 30m");
  });
});

describe("formatPunchTime", () => {
  it("extracts HH:MM from a datetime string", () => {
    expect(formatPunchTime("2026-07-17 09:04:11")).toBe("09:04");
  });

  it("returns an em dash when no punch was recorded", () => {
    expect(formatPunchTime(null)).toBe("—");
    expect(formatPunchTime(undefined)).toBe("—");
    expect(formatPunchTime("")).toBe("—");
  });
});

describe("summariseAttendance", () => {
  it("counts a real month correctly, keeping neutral days out of the exception tally", () => {
    const s = summariseAttendance([
      day({ status: "present", work_minutes: 480, overtime_minutes: 30 }),
      day({ status: "late_in", work_minutes: 460, late_minutes: 20 }),
      day({ status: "absent" }),
      day({ status: "weekend" }), // neutral — must not count as present or exception
      day({ status: "on_leave" }), // neutral
    ]);

    expect(s.daysPresent).toBe(1);
    expect(s.daysAbsent).toBe(1);
    expect(s.exceptions).toBe(2); // late_in + absent, NOT weekend/on_leave
    expect(s.workMinutes).toBe(940);
    expect(s.overtimeMinutes).toBe(30);
    expect(s.lateMinutes).toBe(20);
  });

  it("is all-zero for an empty month", () => {
    const s = summariseAttendance([]);
    expect(s).toEqual({
      daysPresent: 0,
      daysAbsent: 0,
      exceptions: 0,
      workMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
    });
  });
});

describe("toMonthFilter / monthFilterLabel", () => {
  it("formats a Date as YYYY-MM with a zero-padded month", () => {
    expect(toMonthFilter(new Date(2026, 0, 15))).toBe("2026-01");
    expect(toMonthFilter(new Date(2026, 11, 1))).toBe("2026-12");
  });

  it("renders a human month label", () => {
    expect(monthFilterLabel("2026-07")).toBe("July 2026");
  });
});

// ── Leave helpers ────────────────────────────────────────────────────────────

const balance = (over: Partial<LeaveBalance>): LeaveBalance => ({
  id: "b-1",
  year: 2026,
  leave_type: { id: "lt-1", name: "Annual", code: "AL", is_paid: true, is_encashable: false },
  opening_balance: 0,
  earned_balance: 0,
  carried_forward: 0,
  used_balance: 0,
  encashed_balance: 0,
  available_balance: 0,
  locked: false,
  ...over,
});

describe("leaveStatusLabel / leaveStatusTone", () => {
  it("labels every status", () => {
    expect(leaveStatusLabel("pending")).toBe("Pending");
    expect(leaveStatusLabel("revoked")).toBe("Revoked");
    expect(leaveStatusLabel("unknown_future")).toBe("unknown_future");
  });

  it("tones approved good, pending warn, and closed states neutral", () => {
    expect(leaveStatusTone("approved")).toBe("good");
    expect(leaveStatusTone("pending")).toBe("warn");
    // rejected / cancelled / revoked / draft are closed — never an alarm.
    for (const s of ["rejected", "cancelled", "revoked", "draft"]) {
      expect(leaveStatusTone(s)).toBe("neutral");
    }
  });
});

describe("compOffStatusLabel / compOffStatusTone", () => {
  it("labels comp-off statuses, incl. the pending_approval variant", () => {
    expect(compOffStatusLabel("pending_approval")).toBe("Pending Approval");
    expect(compOffStatusLabel("expired")).toBe("Expired");
  });

  it("tones approved good, pending warn, expired/rejected neutral", () => {
    expect(compOffStatusTone("approved")).toBe("good");
    expect(compOffStatusTone("pending_approval")).toBe("warn");
    expect(compOffStatusTone("expired")).toBe("neutral");
    expect(compOffStatusTone("rejected")).toBe("neutral");
  });
});

describe("formatDays", () => {
  it("pluralises and preserves half-days", () => {
    expect(formatDays(12.5)).toBe("12.5 days");
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(0.5)).toBe("0.5 days");
    expect(formatDays(0)).toBe("0 days");
  });

  it("is null-safe", () => {
    expect(formatDays(null)).toBe("—");
    expect(formatDays(undefined)).toBe("—");
  });
});

describe("summariseLeaveBalances", () => {
  it("sums stored balances and counts paid types", () => {
    const s = summariseLeaveBalances([
      balance({ available_balance: 10, used_balance: 4, leave_type: { id: "1", name: "Annual", code: "AL", is_paid: true, is_encashable: true } }),
      balance({ available_balance: 6, used_balance: 2, leave_type: { id: "2", name: "Sick", code: "SL", is_paid: true, is_encashable: false } }),
      balance({ available_balance: 3, used_balance: 0, leave_type: { id: "3", name: "Unpaid", code: "LWP", is_paid: false, is_encashable: false } }),
    ]);

    expect(s.totalAvailable).toBe(19);
    expect(s.totalUsed).toBe(6);
    expect(s.types).toBe(3);
    expect(s.paidTypes).toBe(2); // Annual + Sick, not Unpaid
  });

  it("is all-zero for no balances", () => {
    expect(summariseLeaveBalances([])).toEqual({
      totalAvailable: 0,
      totalUsed: 0,
      types: 0,
      paidTypes: 0,
    });
  });
});

describe("payslipPeriodLabel", () => {
  it("builds Month YYYY from the structured month+year", () => {
    expect(payslipPeriodLabel({ period_month: 7, period_year: 2026 })).toBe("July 2026");
    expect(payslipPeriodLabel({ period_month: 1, period_year: 2025 })).toBe("January 2025");
    expect(payslipPeriodLabel({ period_month: 12, period_year: 2026 })).toBe("December 2026");
  });

  it("degrades to MM/YYYY for an out-of-range month rather than crashing", () => {
    expect(payslipPeriodLabel({ period_month: 13, period_year: 2026 })).toBe("13/2026");
    expect(payslipPeriodLabel({ period_month: 0, period_year: 2026 })).toBe("00/2026");
  });
});
