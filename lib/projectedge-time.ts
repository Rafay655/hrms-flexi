import { dateFromDay, dayNumber } from "./projectedge-gantt";
import type { TimeEntry } from "@/types/projectedge-time";

export function weekDays(date: string): string[] {
  const day = dayNumber(date);
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const monday = day - ((weekday + 6) % 7);
  return Array.from({ length: 7 }, (_, index) => dateFromDay(monday + index));
}
// Rejected hours do not consume the backend daily allowance. Use integer
// hundredths to avoid floating-point rounding at the 24-hour boundary.
export function dailyHours(
  entries: TimeEntry[],
  date: string,
  employeeId?: number,
  exceptId?: number,
): number {
  return (
    entries
      .filter(
        (entry) =>
          entry.log_date === date &&
          entry.status !== "rejected" &&
          entry.id !== exceptId &&
          (employeeId === undefined || entry.employee_id === employeeId),
      )
      .reduce((sum, entry) => sum + Math.round(entry.hours_logged * 100), 0) /
    100
  );
}
