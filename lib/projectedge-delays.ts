import { dateFromDay, dayNumber } from "./projectedge-gantt";

export function requestedDueDate(
  current: string | null,
  days: string,
): string | null {
  if (!current || !/^\d+$/.test(days) || Number(days) < 1 || Number(days) > 365)
    return null;
  return dateFromDay(dayNumber(current) + Number(days));
}
