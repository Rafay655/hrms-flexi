import type { TodayAttendance } from '@/types/attendance-timeline';
export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present' }, { value: 'late_in', label: 'Late arrival' }, { value: 'absent', label: 'Absent' },
  { value: 'on_leave', label: 'On leave' }, { value: 'half_day', label: 'Half day' }, { value: 'early_out', label: 'Early departure' },
  { value: 'out_missing', label: 'Clock-out missing' }, { value: 'weekend', label: 'Weekly off' }, { value: 'holiday', label: 'Holiday' },
  { value: 'present_holiday', label: 'Worked on holiday' }, { value: 'present_off_day', label: 'Worked on weekly off' },
];
export function attendanceLabel(status?: string | null) { if (!status?.trim()) return 'Not marked'; return ATTENDANCE_STATUSES.find(item => item.value === status)?.label ?? status.replaceAll('_', ' '); }
export function attendanceTone(status?: string | null) {
  status = status ?? "";
  if (['present', 'present_holiday', 'present_off_day'].includes(status)) return { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
  if (['late_in', 'out_missing', 'half_day', 'early_out'].includes(status)) return { badge: 'border-amber-200 bg-amber-50 text-amber-800', dot: 'bg-[#EEC293]' };
  if (status === 'absent') return { badge: 'border-rose-200 bg-rose-50 text-rose-700', dot: 'bg-rose-500' };
  return { badge: 'border-brand-600/15 bg-brand-100 text-brand-700', dot: 'bg-brand-600' };
}
export function minutesDisplay(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '—';
  const minutes = Math.max(0, Math.floor(value)); return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}
// SQL-style values are already local wall-clock time. Never reinterpret them in the browser's timezone.
export function attendanceTime(value?: string | null, timeZone = 'UTC') {
  if (!value) return '—';
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value)) {
    const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' });
  }
  const match = value.match(/(?:^|[ T])(\d{2}):(\d{2})(?::\d{2})?/); if (!match) return '—';
  const hour = Number(match[1]), minute = Number(match[2]); if (hour > 23 || minute > 59) return '—';
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? 'PM' : 'AM'}`;
}
export function attendanceDate(value?: string | null, style: 'long' | 'short' | 'day' | 'weekday' = 'long') {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`); if (Number.isNaN(date.getTime())) return '—';
  const options: Intl.DateTimeFormatOptions = style === 'day' ? { day: '2-digit' } : style === 'weekday' ? { weekday: 'short' } : style === 'short' ? { month: 'short', day: 'numeric' } : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
}
export function currentAttendanceMonth(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}`;
}
export function shiftMonth(month: string, offset: number) { const [year, number] = month.split('-').map(Number); return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7); }
export function monthLabel(month: string) { return new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
export function monthEnd(month: string) { const [year, number] = month.split('-').map(Number); return new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10); }
export function todayProgress(today: TodayAttendance) {
  return {
    worked: today.progress?.worked_minutes ?? today.work_minutes,
    target: today.progress?.target_minutes ?? today.shift?.target_minutes ?? null,
    percentage: today.progress?.percentage ?? (today.shift?.target_minutes ? today.work_minutes / today.shift.target_minutes * 100 : 0),
  };
}
export function geofenceLabel(value: boolean | null | undefined) { return value === true ? 'Location verified' : value === false ? 'Outside permitted area' : 'Location not checked'; }
