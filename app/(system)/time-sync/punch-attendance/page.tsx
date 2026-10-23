'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { showApiError } from '@/lib/error-toast';
import { ArrowDownLeft, ArrowUpRight, Check, Clock3, Coffee, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { useAppSelector } from '@/store/hooks';
import { useWebPunch } from '@/hooks/use-web-punch';
import { attendanceDate, attendanceTime } from '@/lib/attendance-timeline';
import { parseApiError } from '@/lib/api-error';
import { acquireLocation, companyDate, PUNCH_LABELS } from '@/lib/web-punch';
import type { GpsLocation, PunchListFilters, PunchType, WebPunchInput } from '@/types/web-punch';
import { PunchHistory } from './components/punch-history';

const LocationMap = dynamic(() => import('./components/location-map'), {
  ssr: false,
  loading: () => <AppLoader label="Loading map…" className="h-44 rounded-lg bg-brand-100/40" />,
});

const actions = [
  { type: 'in' as const, flag: 'can_punch_in' as const, icon: ArrowDownLeft },
  { type: 'out' as const, flag: 'can_punch_out' as const, icon: ArrowUpRight },
  { type: 'break_start' as const, flag: 'can_break_start' as const, icon: Coffee },
  { type: 'break_end' as const, flag: 'can_break_end' as const, icon: Clock3 },
];

export default function PunchAttendancePage() {
  const company = useAppSelector(state => state.auth.company);
  const user = useAppSelector(state => state.auth.user?.id);
  const timeZone = company?.timezone || 'Asia/Karachi';
  return <PunchAttendance key={`${company?.id}-${user}-${timeZone}`} timeZone={timeZone} />;
}

function PunchAttendance({ timeZone }: { timeZone: string }) {
  const date = companyDate(timeZone);
  const [filters, setFilters] = useState<PunchListFilters>({ date, page: 1, per_page: 1000 });
  const { today, history, mutation, employeeId, clockIn } = useWebPunch(filters);
  const attendance = today.data?.data;
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activePunch, setActivePunch] = useState<PunchType | null>(null);
  const [retryAttempt, setRetryAttempt] = useState<WebPunchInput | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const working = locating || mutation.isPending || activePunch !== null;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function send(input: WebPunchInput) {
    try {
      const response = await mutation.mutateAsync(input);
      setRetryAttempt(null); toast.success(response.message || 'Your punch was recorded.');
      setFilters({ date: companyDate(timeZone), page: 1, per_page: 1000 });
    } catch (error) {
      const status = parseApiError(error).status;
      // A lost response may follow a successful write. Retry the exact payload/key.
      const uncertain = status == null || status >= 500;
      showApiError(error, { description: uncertain ? 'We could not confirm whether the punch was recorded. Use Retry same punch to confirm safely.' : undefined });
      setRetryAttempt(uncertain ? input : null);
      void today.refetch();
      void history.refetch(); if (employeeId) void clockIn.refetch();
    }
  }

  async function punch(type: PunchType) {
    if (busy.current || retryAttempt || !attendance || today.isError || today.isFetching) return;
    const action = actions.find(item => item.type === type)!;
    if (!attendance.actions[action.flag] || (type === 'in' && (clockInLocked || !clockIn.isSuccess || clockIn.isFetching))) return;
    busy.current = true; setActivePunch(type); setLocating(true);
    try {
      if (type === 'in') {
        const check = await clockIn.refetch();
        if (check.isError) throw check.error;
        if ((check.data?.meta.total ?? 0) > 0 || check.data?.data.length) {
          toast.error('Clock-in has already been recorded for today.'); return;
        }
      }
      let gps: GpsLocation;
      try { gps = await acquireLocation(); }
      catch (error) { toast.error(error instanceof Error ? error.message : 'Location could not be captured.'); return; }
      // Do not send a punch after navigating away or switching company/user.
      if (!mounted.current) return;
      setLocation(gps); setLocating(false);
      const input: WebPunchInput = {
        client_idempotency_key: crypto.randomUUID(), punch_type: type,
        lat: gps.lat, lng: gps.lng, accuracy_meters: gps.accuracy_meters,
        device_info: { user_agent: navigator.userAgent, timezone: timeZone },
      };
      await send(input);
    } catch (error) { showApiError(error); }
    finally { busy.current = false; setActivePunch(null); setLocating(false); }
  }

  async function retry() {
    if (busy.current || !retryAttempt) return;
    busy.current = true; setActivePunch(retryAttempt.punch_type);
    try { await send(retryAttempt); }
    finally { busy.current = false; setActivePunch(null); }
  }

  const clockInLocked = (clockIn.data?.meta.total ?? 0) > 0 || Boolean(clockIn.data?.data.length) || Boolean(attendance?.date === date && (attendance.first_in || attendance.clock_in_at));

  const stateLabel = attendance?.punch_state?.replaceAll('_', ' ') || 'Not clocked in';

  return (
    <div className="min-w-0 space-y-4 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="mb-1 text-[10px] font-medium tracking-wider text-brand-600">TIMESYNC / MY ATTENDANCE</p><h1 className="text-2xl font-semibold tracking-tight text-brand-900">Punch attendance</h1><p className="mt-1 text-xs text-muted-foreground">Capture your location and record your day.</p></div>
        <Button variant="outline" size="sm" disabled={working || today.isFetching || history.isFetching || clockIn.isFetching} onClick={() => { void today.refetch(); void history.refetch(); if (employeeId) void clockIn.refetch(); }} className="border-brand-600/15 text-brand-800"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Refresh status</Button>
      </header>

      {retryAttempt && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-600/10 bg-brand-100/40 p-4"><p className="text-xs text-brand-700">Punch awaiting confirmation</p><Button size="sm" disabled={working} onClick={() => void retry()} className="bg-brand-800 text-white hover:bg-brand-900">{mutation.isPending ? <AppLoader variant="inline" label="Confirming…" className="text-white" /> : 'Retry same punch'}</Button></div>}


      <section aria-label="Record attendance" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E1B4B] text-xs font-semibold text-[#EEC293]">{attendance?.employee.name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('') || <Clock3 className="h-4 w-4" />}</span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">{attendance?.employee.name ?? 'Your attendance'}</h2>
              <p className="mt-0.5 text-[11px] text-gray-500">{attendance?.employee.employee_code}{attendance?.shift ? ' · ' + attendance.shift.name : ''}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-gray-500">{attendanceDate(attendance?.date ?? date, 'short')}</span>
            {attendance && <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-medium capitalize text-brand-800">{stateLabel}</span>}
          </div>
        </div>
        {today.isPending ? <AppLoader label="Getting your attendance status…" className="min-h-28 py-5" /> : today.isError ? <div className="p-3"><ApiErrorState error={today.error} onRetry={() => void today.refetch()} /></div> : !attendance ? <p className="px-4 py-5 text-xs text-gray-500">Your attendance profile is unavailable. Refresh or contact your administrator.</p> : (
          <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 xl:min-w-64">
              <div><dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Clock in</dt><dd className="mt-0.5 text-base font-semibold tabular-nums text-gray-900">{attendanceTime(attendance.clock_in_at ?? attendance.first_in, timeZone)}</dd></div>
              <div><dt className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Clock out</dt><dd className="mt-0.5 text-base font-semibold tabular-nums text-gray-900">{attendanceTime(attendance.clock_out_at ?? attendance.last_out, timeZone)}</dd></div>
            </dl>
            <div className="min-w-0 space-y-2 xl:flex-1 xl:max-w-xl">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {actions.map(action => <Button key={action.type} disabled={working || Boolean(retryAttempt) || today.isFetching || !attendance.actions[action.flag] || (action.type === 'in' && (clockInLocked || !clockIn.isSuccess || clockIn.isFetching))} onClick={() => void punch(action.type)} className={'h-9 gap-1.5 px-2 text-xs ' + (action.type === 'in' ? 'bg-[#1E1B4B] text-white hover:bg-[#2A2675]' : action.type === 'out' ? 'bg-[#EEC293] text-brand-900 hover:bg-[#e5b382]' : 'border border-gray-200 bg-white text-brand-800 hover:bg-gray-50')}>
                  {activePunch === action.type ? <AppLoader variant="inline" label={locating ? 'Getting GPS…' : 'Recording…'} className={action.type === 'in' ? 'text-white' : 'text-brand-800'} /> : <><action.icon className="h-3.5 w-3.5 shrink-0" />{PUNCH_LABELS[action.type]}</>}
                </Button>)}
              </div>
              {clockIn.isError && <ApiErrorState error={clockIn.error} onRetry={() => void clockIn.refetch()} />}
              {clockInLocked && <p className="flex items-center gap-1 text-[11px] text-gray-500 xl:justify-end"><Check className="h-3 w-3 text-brand-600" />Clock-in already recorded for today.</p>}
              {employeeId && clockIn.isPending && <AppLoader variant="inline" label="Checking today's clock-in…" />}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-gray-100 bg-gray-50/70 px-4 py-2">
          <div className="flex min-w-0 items-start gap-1.5 text-[11px] text-gray-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            {locating ? <AppLoader variant="inline" label="Capturing your location…" /> : location ? <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="tabular-nums text-brand-800">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span><span>±{Math.round(location.accuracy_meters)} m</span><span>Captured {new Date(location.capturedAt).toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' })}</span></span> : <span>GPS is captured automatically when you punch.{attendance?.geofence?.zone_name ? ' Assigned location: ' + attendance.geofence.zone_name + '.' : ''}</span>}
          </div>
          <Dialog open={showMap} onOpenChange={setShowMap}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-1.5 bg-white text-xs text-brand-800"><MapPin className="h-3.5 w-3.5" />View location</Button></DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-brand-900">Punch location</DialogTitle>
                <DialogDescription>{location ? `Location captured for your latest punch attempt. Accuracy ±${Math.round(location.accuracy_meters)} m.` : 'Your GPS location is captured automatically when you clock in, clock out, or record a break.'}</DialogDescription>
              </DialogHeader>
              {location ? <><LocationMap location={location} zone={attendance?.geofence ?? null} /><p className="text-xs tabular-nums text-gray-500">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p></> : <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center"><MapPin className="mx-auto mb-2 h-6 w-6 text-brand-600" /><p className="text-sm font-medium text-brand-900">No location captured yet</p><p className="mt-1 text-xs text-gray-500">Record a punch to view its captured location here.</p></div>}
            </DialogContent>
          </Dialog>
        </div>
      </section>
      <PunchHistory query={history} filters={filters} onFilters={setFilters} timeZone={timeZone} today={date} />
    </div>
  );
}
