import { addDays, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';

export function monthRange(month: string) {
  const date = parseISO(`${month}-01`);
  return { date_from: format(startOfMonth(date), 'yyyy-MM-dd'), date_to: format(endOfMonth(date), 'yyyy-MM-dd') };
}
export function monthDates(month: string) {
  const { date_from, date_to } = monthRange(month);
  const dates: string[] = [];
  for (let date = parseISO(date_from); format(date, 'yyyy-MM-dd') <= date_to; date = addDays(date, 1)) dates.push(format(date, 'yyyy-MM-dd'));
  return dates;
}
export function duration(minutes?: number | null) {
  if (minutes == null) return '—';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
export function calendarLabel(value?: string | null) {
  return value ? value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) : 'Not recorded';
}
export function statusTone(status?: string | null) {
  if (status === 'present') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (['late_in', 'early_out', 'half_day'].includes(status ?? '')) return 'border-[#EEC293] bg-[#EEC293]/20 text-brand-900';
  if (status === 'absent') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (['leave', 'on_leave', 'holiday'].includes(status ?? '')) return 'border-violet-200 bg-violet-50 text-violet-800';
  return 'border-gray-200 bg-gray-50 text-gray-600';
}
