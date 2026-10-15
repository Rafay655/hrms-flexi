import { describe, expect, it } from "vitest";

import {
  attendanceStatusLabel,
  attendanceStatusTone,
  formatMinutes,
  formatPunchTime,
  monthFilterLabel,
  summariseAttendance,
  toMonthFilter,
} from "./ess";
import type { AttendanceDay, AttendanceStatus } from "@/types/ess-attendance";

const day = (over: Partial<AttendanceDay> = {}): AttendanceDay => ({
  id: "uuid-1",
  attendance_date: "2026-07-01",
  status: "present",
  shift: null,
  first_in: "2026-07-01 09:00:00",
  last_out: "2026-07-01 18:00:00",
  work_minutes: 480,
  overtime_minutes: 0,
  late_minutes: 0,
  early_out_minutes: 0,
  night_minutes: 0,
  break_minutes: 0,
  is_geofence_valid: true,
  geofence_violation_meters: null,
  is_regularized: false,
  is_locked: false,
  ...over,
});

/** The 11 values of the DB enum, transcribed from the migration. */
const ALL_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late_in",
  "early_out",
  "half_day",
  "out_missing",
  "present_holiday",
  "present_off_day",
  "weekend",
  "holiday",
  "on_leave",
];

describe("attendanceStatusLabel", () => {
  it("labels every value of the DB enum", () => {
    for (const s of ALL_STATUSES) {
      const label = attendanceStatusLabel(s);
      expect(label).toBeTruthy();
      // A raw enum value leaking to the UI means a missing label.
      expect(label).not.toBe(s);
    }
  });

  it("falls back to the raw value for an unknown status rather than throwing", () => {
    // Guards against a backend enum change taking the page down.
    expect(attendanceStatusLabel("teleported")).toBe("teleported");
  });
});

describe("attendanceStatusTone", () => {
  it("treats worked days as good", () => {
    expect(attendanceStatusTone("present")).toBe("good");
    expect(attendanceStatusTone("present_holiday")).toBe("good");
    expect(attendanceStatusTone("present_off_day")).toBe("good");
  });

  it("treats real exceptions as warnings", () => {
    expect(attendanceStatusTone("absent")).toBe("warn");
    expect(attendanceStatusTone("late_in")).toBe("warn");
    expect(attendanceStatusTone("out_missing")).toBe("warn");
  });

  it("does NOT warn on days nothing was expected", () => {
    // The load-bearing one: colouring a weekend or approved leave like a problem
    // tells an employee they did something wrong when they didn't.
    expect(attendanceStatusTone("weekend")).toBe("neutral");
    expect(attendanceStatusTone("holiday")).toBe("neutral");
    expect(attendanceStatusTone("on_leave")).toBe("neutral");
  });

  it("assigns a tone to every enum value", () => {
    for (const s of ALL_STATUSES) {
      expect(["good", "warn", "neutral"]).toContain(attendanceStatusTone(s));
    }
  });
});

describe("formatMinutes", () => {
  it("formats hours and minutes", () => {
    expect(formatMinutes(450)).toBe("7h 30m");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(45)).toBe("45m");
  });

  it("renders no-data as an em dash, not a confident zero", () => {
    // "0h 0m" reads as "you worked zero hours"; "—" reads as "not recorded".
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(undefined)).toBe("—");
    expect(formatMinutes(0)).toBe("—");
  });

  it("handles negatives without mangling them", () => {
    expect(formatMinutes(-90)).toBe("-1h 30m");
  });
});

describe("formatPunchTime", () => {
  it("extracts HH:MM from a backend datetime", () => {
    expect(formatPunchTime("2026-07-01 09:04:11")).toBe("09:04");
  });

  it("returns an em dash when no punch was recorded", () => {
    expect(formatPunchTime(null)).toBe("—");
    expect(formatPunchTime("")).toBe("—");
  });

  it("does not throw on an unexpected format", () => {
    expect(formatPunchTime("not-a-date")).toBe("—");
  });
});

describe("summariseAttendance", () => {
  it("returns zeros for an empty month", () => {
    expect(summariseAttendance([])).toEqual({
      daysPresent: 0,
      daysAbsent: 0,
      exceptions: 0,
      workMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
    });
  });

  it("counts presence, absence and exceptions", () => {
    const s = summariseAttendance([
      day({ status: "present" }),
      day({ status: "present_holiday" }),
      day({ status: "absent", work_minutes: 0 }),
      day({ status: "late_in", late_minutes: 15 }),
      day({ status: "weekend", work_minutes: 0 }),
    ]);

    expect(s.daysPresent).toBe(2); // present + present_holiday
    expect(s.daysAbsent).toBe(1);
    expect(s.exceptions).toBe(2); // absent + late_in
    expect(s.lateMinutes).toBe(15);
  });

  it("does not count weekends or leave as exceptions", () => {
    const s = summariseAttendance([
      day({ status: "weekend" }),
      day({ status: "holiday" }),
      day({ status: "on_leave" }),
    ]);

    expect(s.exceptions).toBe(0);
    expect(s.daysAbsent).toBe(0);
  });

  it("treats null minute fields as zero rather than NaN", () => {
    // A null work_minutes must not poison the total into NaN and render "NaNh".
    const s = summariseAttendance([
      day({ work_minutes: null, overtime_minutes: null, late_minutes: null }),
      day({ work_minutes: 480, overtime_minutes: 60, late_minutes: 5 }),
    ]);

    expect(s.workMinutes).toBe(480);
    expect(s.overtimeMinutes).toBe(60);
    expect(s.lateMinutes).toBe(5);
  });
});

describe("toMonthFilter / monthFilterLabel", () => {
  it("formats a date as the YYYY-MM the API expects", () => {
    expect(toMonthFilter(new Date(2026, 6, 17))).toBe("2026-07");
  });

  it("zero-pads single-digit months", () => {
    // "2026-1" would silently LIKE-match 2026-1x months on the backend.
    expect(toMonthFilter(new Date(2026, 0, 5))).toBe("2026-01");
  });

  it("renders a human month label", () => {
    expect(monthFilterLabel("2026-07")).toBe("July 2026");
  });

  it("returns the input unchanged when it isn't a valid month", () => {
    expect(monthFilterLabel("garbage")).toBe("garbage");
    expect(monthFilterLabel("2026-13")).toBe("2026-13");
  });
});
