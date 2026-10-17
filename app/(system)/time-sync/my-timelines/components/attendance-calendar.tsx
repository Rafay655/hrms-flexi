'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Check, Clock3 } from 'lucide-react';
import { attendanceDate, attendanceLabel, attendanceTime, attendanceTone, minutesDisplay, monthEnd, monthLabel } from '@/lib/attendance-timeline';
import type { TimelineAttendanceDay } from '@/types/attendance-timeline';

type Props = {
  month: string;
  rows: TimelineAttendanceDay[];
  timeZone: string;
  filtered: boolean;
  onSelect: (day: TimelineAttendanceDay) => void;
};

export function AttendanceCalendar({ month, rows, timeZone, filtered, onSelect }: Props) {
  const reduced = useReducedMotion();
  const records = new Map(rows.filter(row => row.attendance_date).map(row => [row.attendance_date!.slice(0, 10), row]));
  const offset = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7;
  const count = Number(monthEnd(month).slice(-2));
  const cells = Math.ceil((offset + count) / 7) * 7;
  const todayParts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const today = ['year', 'month', 'day'].map(type => todayParts.find(part => part.type === type)?.value).join('-');
  const statuses = [...new Set(rows.map(row => row.status))];

  return (
    <section aria-label={`${monthLabel(month)} attendance calendar`} className="overflow-hidden rounded-2xl border border-brand-600/15 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-600/10 bg-brand-100/40 px-4 py-4 sm:px-6">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">{monthLabel(month)}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Select a recorded day to explore your attendance.</p>
        </div>
        <span className="rounded-full border border-[#EEC293]/50 bg-[#EEC293]/15 px-3 py-1 text-[11px] font-medium text-brand-800">{rows.length} {filtered ? 'matching' : 'recorded'} days</span>
      </div>
      <div className="grid grid-cols-7 border-b border-brand-600/10 bg-brand-100/30" aria-hidden="true">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-brand-600 sm:text-xs">{day}</div>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={month} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -8 }} transition={{ duration: reduced ? 0 : 0.22 }} className="grid grid-cols-7" aria-label="Calendar days">
          {Array.from({ length: cells }, (_, index) => {
            const day = index - offset + 1;
            if (day < 1 || day > count) return <div key={`blank-${index}`} aria-hidden="true" className="min-h-24 border-b border-r border-brand-600/[0.07] bg-brand-100/30 sm:min-h-36" />;
            const date = `${month}-${String(day).padStart(2, '0')}`;
            const row = records.get(date);
            const isToday = date === today;
            const tone = row ? attendanceTone(row.status) : null;
            const content = <>
              <div className="flex items-center justify-between gap-1">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:h-7 sm:w-7 sm:text-sm ${isToday ? 'bg-white/10 text-[#EEC293] ring-1 ring-[#EEC293]/50' : 'text-brand-900'}`}>{day}</span>
                {row && <ArrowUpRight aria-hidden="true" className={`hidden h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block ${isToday ? 'text-white/60' : 'text-brand-600/50'}`} />}
              </div>
              {row ? <div className="mt-3 min-w-0 space-y-2">
                <span className={`inline-flex max-w-full items-center gap-1 rounded-md border px-1 py-0.5 text-[9px] leading-snug sm:px-1.5 sm:text-[11px] ${tone!.badge}`}><span className={`hidden h-1 w-1 shrink-0 rounded-full sm:block ${tone!.dot}`} /><span className="break-words">{attendanceLabel(row.status)}</span></span>
                <p className={`flex flex-wrap items-center gap-1 text-[10px] font-semibold tabular-nums sm:text-xs ${isToday ? 'text-white' : 'text-brand-800'}`}><Clock3 className="hidden h-3 w-3 lg:block" />{minutesDisplay(row.work_minutes)}</p>
                <p className={`hidden text-[10px] tabular-nums xl:block ${isToday ? 'text-white/75' : 'text-muted-foreground'}`}>{attendanceTime(row.first_in, timeZone)} – {attendanceTime(row.last_out, timeZone)}</p>
                {row.is_regularized && <span className={`hidden items-center gap-1 text-[10px] lg:flex ${isToday ? 'text-[#EEC293]' : 'text-brand-600'}`}><Check className="h-3 w-3" />Corrected</span>}
              </div> : <p className={`mt-3 hidden text-[10px] leading-relaxed sm:block ${isToday ? 'text-white/75' : 'text-muted-foreground/65'}`}>{filtered ? 'No matching record' : date > today ? 'Upcoming' : 'No record'}</p>}
            </>;
            const className = `group min-h-24 min-w-0 border-b border-r border-brand-600/[0.07] p-1.5 text-left sm:min-h-36 sm:p-3 lg:p-4 ${isToday ? 'bg-brand-800' : 'bg-white'}`;
            return row ? <button key={date} type="button" aria-label={`View attendance for ${attendanceDate(date)}: ${attendanceLabel(row.status)}`} aria-current={isToday ? 'date' : undefined} onClick={() => onSelect(row)} className={`${className} relative transition-colors hover:z-10 ${isToday ? 'hover:bg-brand-900' : 'hover:bg-brand-100/70'} focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600`}>{content}</button> : <div key={date} aria-label={`${attendanceDate(date)}: ${filtered ? 'No matching record' : 'No record'}`} aria-current={isToday ? 'date' : undefined} className={className}>{content}</div>;
          })}
        </motion.div>
      </AnimatePresence>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-brand-100/25 px-4 py-3 text-[10px] text-muted-foreground sm:px-6 sm:text-xs">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-800 ring-2 ring-[#EEC293]/60" />Today</span>
        {statuses.map(status => <span key={status} className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${attendanceTone(status).dot}`} />{attendanceLabel(status)}</span>)}
        <span className="ml-auto">{filtered ? 'Filters apply to this calendar' : 'Unrecorded days have no attendance status'}</span>
      </div>
    </section>
  );
}
