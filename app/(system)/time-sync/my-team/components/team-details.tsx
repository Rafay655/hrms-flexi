'use client';

import { ArrowUpRight, Clock3, MapPin, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTeamMember } from '@/hooks/use-team-attendance';
import { attendanceDate, attendanceTime, geofenceLabel, minutesDisplay } from '@/lib/attendance-timeline';
import type { TeamPerson, TeamPunch } from '@/types/team-attendance';
import { AttendanceBadge, TimelineError } from '../../my-timelines/components/today-panel';

export function PersonAvatar({ person }: { person: TeamPerson }) {
  return <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xs font-semibold text-brand-700">{person.initials || person.name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('')}</span>;
}

export function PunchLocation({ punch }: { punch: TeamPunch | null }) {
  const lat = punch?.lat, lng = punch?.lng;
  const hasCoordinates = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return (
    <div className="space-y-1.5 text-xs text-muted-foreground">
      <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{punch ? geofenceLabel(punch.is_geofence_valid) : 'No punch recorded'}</p>
      {hasCoordinates ? <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 underline-offset-4 hover:underline">{lat.toFixed(5)}, {lng.toFixed(5)}<ArrowUpRight className="h-3 w-3" /><span className="sr-only">Open recorded location in a new tab</span></a> : <p className="text-[11px]">Coordinates not recorded</p>}
      {punch?.mock_location && <p className="flex items-center gap-1 text-amber-800"><ShieldAlert className="h-3 w-3" />Mock location reported</p>}
    </div>
  );
}

export function TeamMemberModal({ person, date, timeZone, onClose }: { person: TeamPerson; date: string; timeZone: string; onClose: () => void }) {
  const query = useTeamMember(person.uuid, date);
  const detail = query.data?.data;
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b bg-brand-100/60 px-5 py-4 pr-12 text-left">
          <DialogTitle className="text-brand-900">{detail?.employee.name ?? person.name}</DialogTitle>
          <DialogDescription>{person.employee_code} · {attendanceDate(detail?.attendance_date ?? date)} · {timeZone}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-5 overflow-y-auto p-5">
          {query.isPending ? <div role="status" className="h-56 animate-pulse rounded-xl bg-brand-100 motion-reduce:animate-none"><span className="sr-only">Loading member attendance</span></div> : query.isError ? <TimelineError error={query.error} retry={() => void query.refetch()} /> : detail ? <>
            <div className="flex flex-wrap items-center justify-between gap-2"><AttendanceBadge status={detail.status} /><span className="text-xs text-muted-foreground">{geofenceLabel(detail.is_geofence_valid)}</span></div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['First in', attendanceTime(detail.first_in, timeZone)], ['Last out', attendanceTime(detail.last_out, timeZone)], ['Worked', minutesDisplay(detail.work_minutes)], ['Late arrival', `${detail.late_minutes} min`]].map(([label, value]) => <div key={label} className="rounded-xl bg-brand-100/70 p-3"><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-semibold tabular-nums text-brand-900">{value}</dd></div>)}
            </dl>
            <div><h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900"><Clock3 className="h-4 w-4 text-brand-600" />Recorded punches</h3><p className="mt-1 text-[11px] text-muted-foreground">Punch events are shown as recorded. Daily totals may include attendance adjustments.</p></div>
            {detail.punches.length ? <ol className="space-y-3">{[...detail.punches].sort((a, b) => a.punched_at.localeCompare(b.punched_at)).map(punch => <li key={punch.uuid} className="relative ml-1 border-l border-brand-600/15 pl-5"><span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-[#EEC293] ring-4 ring-white" /><div className="flex flex-wrap items-baseline justify-between gap-2"><span className="text-sm font-medium capitalize text-brand-900">{punch.punch_type.replaceAll('_', ' ')}</span><span className="text-xs tabular-nums text-brand-700">{attendanceDate(punch.punched_at, 'short')} · {attendanceTime(punch.punched_at, timeZone)}</span></div><div className="mt-2 rounded-lg bg-brand-100/40 p-3"><PunchLocation punch={punch} /></div></li>)}</ol> : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No punch events recorded for this day.</p>}
          </> : <p className="text-sm text-muted-foreground">No attendance detail is available.</p>}
        </div>
        <DialogFooter className="border-t bg-brand-100/40 px-5 py-3"><Button onClick={onClose} className="bg-brand-800 text-white hover:bg-brand-900">Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
