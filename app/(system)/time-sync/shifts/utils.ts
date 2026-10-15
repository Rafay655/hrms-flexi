
import { AssignmentType } from "./types";

export const STORAGE_KEY = "hrms_shift_roster_complete_module_v2";
export const CURRENT_USER = "Admin User";
export const CURRENT_MANAGER = "HR Manager";

export const weekDays = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 7, label: "Sun" },
];

export const holidayCalendar = [
  { date: "2026-03-23", name: "Pakistan Day" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-08-14", name: "Independence Day" },
];

export function toMinutes(value: string) {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function computeIsCrossDay(start: string, end: string) {
  return toMinutes(end) <= toMinutes(start);
}

export function computeWorkingMinutes(start: string, end: string, breakMinutes: number) {
  if (!start || !end) return 0;
  let diff = toMinutes(end) - toMinutes(start);
  if (diff <= 0) diff += 1440;
  return Math.max(diff - Number(breakMinutes || 0), 0);
}

export function nextId<T extends { id: number }>(list: T[]) {
  return list.length ? Math.max(...list.map((item) => item.id)) + 1 : 1;
}

export function formatDateTimeNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function dayNumber(dateString: string) {
  const jsDay = new Date(`${dateString}T00:00:00`).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function enumerateDates(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const aS = new Date(`${aStart}T00:00:00`).getTime();
  const aE = new Date(`${aEnd || "9999-12-31"}T00:00:00`).getTime();
  const bS = new Date(`${bStart}T00:00:00`).getTime();
  const bE = new Date(`${bEnd || "9999-12-31"}T00:00:00`).getTime();
  return aS <= bE && bS <= aE;
}

export function isDateWithin(date: string, start: string, end: string) {
  const current = new Date(`${date}T00:00:00`).getTime();
  const s = new Date(`${start}T00:00:00`).getTime();
  const e = new Date(`${end || "9999-12-31"}T00:00:00`).getTime();
  return current >= s && current <= e;
}

export function getAssignmentPriority(type: AssignmentType) {
  if (type === "override") return 3;
  if (type === "temporary") return 2;
  return 1;
}

export function createPattern(days: number) {
  return Array.from({ length: days }, (_, i) => ({ day: i + 1, shift_id: null as number | null }));
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}