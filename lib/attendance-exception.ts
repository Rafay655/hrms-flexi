import { differenceInCalendarDays, isValid, parseISO } from 'date-fns';
export function validateExceptionRange(from: string, to: string) {
  if (!from || !to) return 'Choose both a start and end date.';
  const start = parseISO(from), end = parseISO(to);
  if (!isValid(start) || !isValid(end)) return 'Choose valid dates.';
  const days = differenceInCalendarDays(end, start) + 1;
  if (days < 1) return 'End date must be on or after the start date.';
  if (days > 62) return 'Choose a range of 62 days or fewer.';
  return '';
}
export function exceptionLabel(value?: string | null) { return value ? value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) : '—'; }
export function exceptionSeverityTone(value: string) {
  if (value === 'high') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (value === 'medium') return 'border-[#EEC293] bg-[#EEC293]/20 text-brand-900';
  return 'border-brand-600/20 bg-brand-100 text-brand-700';
}
export function exceptionStatusTone(value: string) {
  if (value === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === 'escalated') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-[#EEC293] bg-[#EEC293]/20 text-brand-900';
}

export function regularizationTypeForException(type: string): string | null {
  const mapping: Record<string, string> = { missing_punch_in: 'add_in', missing_punch_out: 'add_out', absent: 'full_replacement', late_arrival: 'modify_in', early_departure: 'modify_out' };
  return mapping[type] ?? null;
}
