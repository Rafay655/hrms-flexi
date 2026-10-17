'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, Check, ChevronRight, Clock3, MapPin, RefreshCw, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import { Switch } from '@/components/ui/switch';
import { useAppSelector } from '@/store/hooks';
import { useTeamAttendance } from '@/hooks/use-team-attendance';
import { attendanceDate, attendanceTime, geofenceLabel, minutesDisplay } from '@/lib/attendance-timeline';
import type { TeamFilters, TeamPerson } from '@/types/team-attendance';
import { AttendanceBadge, TimelineError } from '../my-timelines/components/today-panel';
import { PersonAvatar, PunchLocation, TeamMemberModal } from './components/team-details';

function localDate(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}

export default function MyTeamPage() {
  const company = useAppSelector(state => state.auth.company);
  const user = useAppSelector(state => state.auth.user?.id);
  const timeZone = company?.timezone || 'Asia/Karachi';
  return <MyTeam key={`${company?.id}-${user}-${timeZone}`} timeZone={timeZone} />;
}

function MyTeam({ timeZone }: { timeZone: string }) {
  const reduced = useReducedMotion();
  const today = localDate(timeZone);
  const [filters, setFilters] = useState<TeamFilters>({ date: today, recursive: false });
  const [view, setView] = useState<'attendance' | 'locations'>('attendance');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ person: TeamPerson; date: string } | null>(null);
  const queries = useTeamAttendance(filters);
  const response = queries.attendance.data;
  const summary = queries.summary.data?.data;
  const locations = queries.locations.data;
  const managers = response?.available_managers ?? [];
  const fetching = Object.values(queries).some(query => query.isFetching);
  const query = view === 'attendance' ? queries.attendance : queries.locations;
  const matches = (person: TeamPerson) => [person.name, person.employee_code, person.department, person.designation].filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase());
  const rows = (response?.data ?? []).filter(row => matches(row.employee));
  const pins = (locations?.data ?? []).filter(row => matches(row.employee));
  const count = view === 'attendance' ? rows.length : pins.length;
  const returnedDate = view === 'attendance' ? response?.meta.date : locations?.meta.date;
  const summaryMetrics = summary ? [
    { label: 'Team size', value: summary.team_size, tone: 'text-brand-900' },
    { label: 'Present', value: summary.present, tone: 'text-emerald-700' },
    { label: 'Late', value: summary.late, tone: 'text-amber-800' },
    { label: 'Absent', value: summary.absent, tone: 'text-rose-700' },
    { label: 'On leave', value: summary.on_leave, tone: 'text-brand-700' },
    { label: 'Not marked', value: summary.not_marked, tone: 'text-muted-foreground' },
    { label: 'Checked in', value: summary.checked_in, tone: 'text-brand-900' },
  ] : [];

  return (
    <div className="min-w-0 space-y-4 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-brand-600"><span className="h-1.5 w-1.5 rounded-full bg-[#EEC293]" />TIMESYNC / TEAM</p><h1 className="text-2xl font-semibold tracking-tight text-brand-900">My team</h1><p className="mt-1 text-xs text-muted-foreground">A clear view of your people, attendance and recorded locations.</p></div>
        <div className="flex items-center gap-3"><span className="hidden text-[11px] text-muted-foreground sm:block">{timeZone}</span><Button variant="outline" size="sm" disabled={fetching} aria-label="Refresh team attendance" className="border-brand-600/15 bg-white text-brand-800" onClick={() => { void Promise.allSettled(Object.values(queries).map(query => query.refetch())); }}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${fetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />Refresh</Button></div>
      </header>

      <section aria-label="Team filters" className="grid items-end gap-4 rounded-xl border border-brand-600/10 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[180px_1fr_auto]">
        <div className="space-y-1.5"><Label htmlFor="team-date" className="text-xs">Attendance date</Label><Input id="team-date" type="date" value={filters.date} max={today} onChange={event => { const date = event.target.value; if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today) { setFilters(previous => ({ ...previous, date })); setSelected(null); } }} /></div>
        <div className="space-y-1.5"><Label htmlFor="team-manager" className="text-xs">View attendance for</Label><SearchableSelect id="team-manager" aria-label="Team manager" widthClass="w-full" allLabel="My team" value={filters.employee_uuid ?? ''} options={[...managers.map(manager => ({ value: manager.uuid, label: `${manager.name}${manager.is_self ? ' (you)' : ''} · ${manager.subordinate_count} direct reports` })), ...(filters.employee_uuid && !managers.some(manager => manager.uuid === filters.employee_uuid) ? [{ value: filters.employee_uuid, label: 'Selected manager' }] : [])]} onChange={value => { setFilters(previous => ({ ...previous, employee_uuid: value || undefined })); setSelected(null); }} /></div>
        <div className="flex min-h-9 items-center justify-between gap-4 rounded-lg bg-brand-100/60 px-3 py-2"><Label htmlFor="team-recursive" className="cursor-pointer"><span className="block text-xs font-medium text-brand-900">Include indirect reports</span><span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">People reporting through your managers</span></Label><Switch id="team-recursive" checked={filters.recursive} onCheckedChange={recursive => { setFilters(previous => ({ ...previous, recursive })); setSelected(null); }} /></div>
      </section>

      <section aria-label="My team summary" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-semibold text-brand-900">My team at a glance</h2><span className="text-[11px] text-muted-foreground">{attendanceDate(summary?.date ?? filters.date, 'short')} · {filters.recursive ? 'Direct & indirect reports' : 'Direct reports'}</span></div>
        {queries.summary.isPending ? <LoadingCards /> : queries.summary.isError ? <TimelineError error={queries.summary.error} retry={() => void queries.summary.refetch()} /> : summary ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">{summaryMetrics.map((metric, index) => <motion.div key={metric.label} initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : index * 0.025 }} className={`rounded-xl border p-3 ${index === 0 ? 'border-brand-800 bg-brand-800' : 'border-brand-600/10 bg-white'}`}><p className={`text-2xl font-semibold tabular-nums ${index === 0 ? 'text-[#EEC293]' : metric.tone}`}>{metric.value}</p><p className={`mt-1 text-[11px] ${index === 0 ? 'text-white/75' : 'text-muted-foreground'}`}>{metric.label}</p></motion.div>)}</div> : <p className="text-sm text-muted-foreground">No summary is available.</p>}
        {filters.employee_uuid && <p className="text-[11px] text-muted-foreground">The manager filter applies to attendance. Summary and locations cover your team.</p>}
      </section>

      <section aria-label="Team records" className="min-w-0 overflow-hidden rounded-2xl border border-brand-600/10 bg-brand-100/30">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-600/10 p-4">
          <div className="flex items-center gap-1 rounded-lg border border-brand-600/10 bg-white p-1" role="group" aria-label="Team view">
            {[{ value: 'attendance' as const, label: 'Attendance', icon: Users }, { value: 'locations' as const, label: 'Locations', icon: MapPin }].map(item => <Button key={item.value} variant="ghost" size="sm" aria-pressed={view === item.value} onClick={() => setView(item.value)} className={`h-8 gap-1.5 text-xs ${view === item.value ? 'bg-brand-800 text-white hover:bg-brand-900 hover:text-white' : 'text-brand-700'}`}><item.icon className="h-3.5 w-3.5" />{item.label}</Button>)}
          </div>
          <div className="relative w-full sm:w-64"><Search aria-hidden="true" className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" /><Input aria-label="Search displayed team members" placeholder="Find a team member…" value={search} onChange={event => setSearch(event.target.value)} className="bg-white pl-9" /></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-muted-foreground">
          <p>{view === 'attendance' ? response?.meta.viewing_team_of ? `Team of ${response.meta.viewing_team_of.name}` : 'My team attendance' : 'My team · Last recorded punch locations'}{returnedDate && ` · ${attendanceDate(returnedDate, 'short')}`}</p>
          <span>{query.isPending ? 'Loading…' : query.isError ? 'Unavailable' : `${count} ${search.trim() ? 'matching ' : ''}members`}</span>
        </div>
        {returnedDate && returnedDate !== filters.date && <p role="status" className="mx-4 mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">The API returned {attendanceDate(returnedDate)} for the selected date {attendanceDate(filters.date)}.</p>}
        {view === 'attendance' && Boolean(response?.meta.drill_path?.length) && <nav aria-label="Manager path" className="mb-3 flex flex-wrap items-center gap-1 px-4 text-xs text-brand-700"><button type="button" onClick={() => setFilters(previous => ({ ...previous, employee_uuid: undefined }))} className="underline underline-offset-2">My team</button>{response!.meta.drill_path.map(person => <span key={person.uuid} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /><button type="button" className="underline underline-offset-2" onClick={() => setFilters(previous => ({ ...previous, employee_uuid: person.uuid }))}>{person.name}</button></span>)}</nav>}

        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          {query.isPending ? <LoadingCards /> : query.isError ? <TimelineError error={query.error} retry={() => void query.refetch()} /> : !count ? <div className="rounded-xl border border-dashed border-brand-600/15 bg-white py-12 text-center"><Users className="mx-auto h-7 w-7 text-brand-600/60" /><h3 className="mt-3 text-sm font-semibold text-brand-900">{search.trim() ? 'No matching team members' : 'No team records'}</h3><p className="mt-1 px-4 text-xs text-muted-foreground">{search.trim() ? 'Try a different name, code or department.' : 'Try another date or include indirect reports.'}</p></div> : view === 'attendance' ? <>
            <div aria-hidden="true" className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_1fr_1fr_24px] gap-4 px-4 pb-2 text-[10px] font-medium uppercase tracking-wide text-brand-600 md:grid"><span>Team member</span><span>Attendance</span><span>In / out</span><span>Worked / overtime</span><span /></div>
            <ul className="space-y-2">{rows.map((row, index) => <motion.li key={row.employee.uuid} initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : Math.min(index * 0.02, 0.15) }}>
              <button type="button" aria-label={`View attendance for ${row.employee.name}`} onClick={() => setSelected({ person: row.employee, date: row.attendance_date })} className="group grid w-full grid-cols-2 items-center gap-3 rounded-xl border border-brand-600/10 bg-white p-3 text-left transition-colors hover:border-brand-600/30 hover:bg-brand-100/40 focus-visible:outline-2 focus-visible:outline-brand-600 sm:p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_1fr_1fr_24px] md:gap-4">
                <div className="col-span-2 flex min-w-0 items-center gap-2.5 md:col-span-1"><PersonAvatar person={row.employee} /><div className="min-w-0"><p className="break-words text-sm font-medium text-brand-900">{row.employee.name}</p><p className="mt-0.5 break-words text-[10px] text-muted-foreground">{row.employee.employee_code}{row.employee.designation ? ` · ${row.employee.designation}` : ''}</p><p className="mt-1 text-[10px] text-brand-600">{row.employee.department || 'Department not provided'}{row.employee.reporting_level ? ` · ${row.employee.reporting_level} report` : ''}</p></div></div>
                <div className="min-w-0"><AttendanceBadge status={row.status} /><p className="mt-1.5 text-[10px] text-muted-foreground">{geofenceLabel(row.is_geofence_valid)}</p>{row.is_regularized && <span className="mt-1 flex items-center gap-1 text-[10px] text-brand-700"><Check className="h-3 w-3" />Regularized</span>}</div>
                <div className="space-y-1 text-xs tabular-nums"><p><span className="mr-1 text-[10px] text-muted-foreground md:hidden">In</span>{attendanceTime(row.first_in, timeZone)}</p><p className="text-muted-foreground"><span className="mr-1 text-[10px] md:hidden">Out</span>{attendanceTime(row.last_out, timeZone)}</p></div>
                <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-brand-100 pt-2 md:col-span-1 md:block md:border-0 md:pt-0"><p className="text-xs font-semibold tabular-nums text-brand-900">{minutesDisplay(row.work_minutes)}<span className="ml-1 font-normal text-muted-foreground md:hidden">worked</span></p><p className="text-[10px] text-brand-600 md:mt-1">{minutesDisplay(row.overtime_minutes)} overtime</p>{row.late_minutes > 0 && <p className="text-[10px] text-amber-800 md:mt-1">{row.late_minutes} min late</p>}</div>
                <ChevronRight aria-hidden="true" className="hidden h-4 w-4 text-brand-600/60 transition-transform group-hover:translate-x-0.5 md:block" />
              </button>
            </motion.li>)}</ul>
          </> : <>
            <p className="mb-3 text-[11px] text-muted-foreground">These are recorded punch locations, not live tracking. Missing coordinates are shown explicitly.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{pins.map(({ employee, last_punch }) => <motion.article key={employee.uuid} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-brand-600/10 bg-white p-4"><div className="flex items-start gap-2.5"><PersonAvatar person={employee} /><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-medium text-brand-900">{employee.name}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{employee.employee_code} · {employee.reporting_level ?? 'Team member'}</p></div></div><div className="my-3 flex flex-wrap items-center justify-between gap-2 border-y border-brand-100 py-2 text-[11px]"><span className="capitalize text-brand-700">{last_punch?.punch_type.replaceAll('_', ' ') ?? 'No punch'}</span><span className="flex items-center gap-1 text-muted-foreground"><Clock3 className="h-3 w-3" />{attendanceTime(last_punch?.punched_at, timeZone)}</span></div><PunchLocation punch={last_punch} /><Button variant="ghost" size="sm" className="mt-3 h-7 px-0 text-xs text-brand-700" onClick={() => setSelected({ person: employee, date: locations?.meta.date ?? filters.date })}>View day<ArrowUpRight className="ml-1 h-3 w-3" /></Button></motion.article>)}</div>
          </>}
        </div>
      </section>
      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><CalendarDays className="h-3 w-3" />Times are shown in {timeZone}. Refresh to retrieve the latest attendance.</p>
      {selected && <TeamMemberModal key={`${selected.person.uuid}-${selected.date}`} person={selected.person} date={selected.date} timeZone={timeZone} onClose={() => setSelected(null)} />}
    </div>
  );
}

function LoadingCards() {
  return <div role="status" aria-label="Loading team data" className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-brand-100 motion-reduce:animate-none" />)}</div>;
}
