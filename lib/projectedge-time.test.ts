import { describe, expect, it } from "vitest";
import { dailyHours, weekDays } from "./projectedge-time";
import type { TimeEntry } from "@/types/projectedge-time";
describe("timesheet calendar and totals", () => {
  it("anchors Sunday and DST weeks to Monday without local-date drift", () => {
    expect(weekDays("2026-03-08")).toEqual([
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
    ]);
    expect(weekDays("2024-02-29")[6]).toBe("2024-03-03");
  });
  it("excludes rejected hours, other employees and the edited entry with exact hundredths", () => {
    const logs = [
      {
        id: 1,
        employee_id: 2,
        log_date: "2026-10-01",
        hours_logged: 0.1,
        status: "draft",
      },
      {
        id: 2,
        employee_id: 2,
        log_date: "2026-10-01",
        hours_logged: 0.2,
        status: "approved",
      },
      {
        id: 3,
        employee_id: 2,
        log_date: "2026-10-01",
        hours_logged: 24,
        status: "rejected",
      },
      {
        id: 4,
        employee_id: 3,
        log_date: "2026-10-01",
        hours_logged: 4,
        status: "submitted",
      },
    ] as TimeEntry[];
    expect(dailyHours(logs, "2026-10-01", 2)).toBe(0.3);
    expect(dailyHours(logs, "2026-10-01", 2, 1)).toBe(0.2);
  });
});
