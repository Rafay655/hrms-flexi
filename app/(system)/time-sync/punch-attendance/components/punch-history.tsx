'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, History, ListFilter, MapPin, Search } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import { attendanceTime, geofenceLabel } from '@/lib/attendance-timeline';
import { PUNCH_LABELS, punchLabel } from '@/lib/web-punch';
import type { PunchListFilters, PunchListResponse, RawPunch } from '@/types/web-punch';

type Props = {
  query: UseQueryResult<PunchListResponse, Error>;
  filters: PunchListFilters;
  onFilters: (filters: PunchListFilters) => void;
  timeZone: string;
  today: string;
};

function Coordinates({ punch }: { punch: RawPunch }) {
  const lat = punch.lat == null ? NaN : Number(punch.lat), lng = punch.lng == null ? NaN : Number(punch.lng);
  const available = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return <div className="text-[11px] text-muted-foreground"><p className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{geofenceLabel(punch.is_geofence_valid)}</p>{available ? <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-brand-700 underline underline-offset-2">{lat.toFixed(5)}, {lng.toFixed(5)}<span className="sr-only"> · Open recorded location in a new tab</span></a> : <p className="mt-1">No coordinates recorded</p>}{punch.accuracy_meters != null && Number.isFinite(Number(punch.accuracy_meters)) && <p className="mt-1">Accuracy ±{Math.round(Number(punch.accuracy_meters))} m</p>}</div>;
}

export function PunchHistory({ query, filters, onFilters, timeZone, today }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const [search, setSearch] = useState(filters.search ?? '');
  const meta = query.data?.meta;
  const rows = query.data?.data ?? [];
  const devices = [...new Map(rows.filter(row => row.device_id || row.device?.id).map(row => [row.device_id ?? row.device!.id!, { value: row.device_id ?? row.device!.id!, label: row.device?.friendly_name || row.device?.device_name || 'Attendance device' }])).values()];
  if (filters.device_id && !devices.some(device => device.value === filters.device_id)) devices.push({ value: filters.device_id, label: 'Selected device' });
  function changeRange(field: 'date_from' | 'date_to', value: string) {
    const next = { ...filters, [field]: value || undefined, date: '', page: 1 };
    if (next.date_from && next.date_to && next.date_from > next.date_to) { toast.error('The start date must be on or before the end date.'); return; }
    onFilters(next);
  }
  const page = meta?.current_page ?? filters.page, pages = Math.max(1, meta?.last_page ?? 1);
  return <section aria-label="Punch history" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 p-4">
      <div><h2 className="flex items-center gap-2 text-sm font-semibold text-brand-900"><History className="h-4 w-4 text-brand-600" />Punch history</h2><p className="mt-1 text-[11px] text-muted-foreground">Recorded punches across attendance methods.</p></div>
      <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
        <div className="space-y-1"><Label htmlFor="punch-history-date" className="text-[10px]">Date</Label><Input id="punch-history-date" type="date" className="h-9 w-40" value={filters.date} max={today} onChange={event => { const date = event.target.value; if (!date || (/^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today)) { onFilters({ ...filters, date, date_from: undefined, date_to: undefined, page: 1 }); } }} /></div>
        <div className="space-y-1"><Label htmlFor="punch-history-type" className="text-[10px]">Punch type</Label><SearchableSelect id="punch-history-type" aria-label="Filter punch type" value={filters.punch_type ?? ''} options={Object.entries(PUNCH_LABELS).map(([value, label]) => ({ value, label }))} allLabel="All punches" widthClass="w-36" onChange={punch_type => onFilters({ ...filters, punch_type: punch_type || undefined, page: 1 })} /></div>
        <Button variant="outline" size="sm" aria-expanded={advanced} aria-controls="punch-extra-filters" onClick={() => setAdvanced(previous => !previous)} className="h-9 text-xs"><ListFilter className="mr-1.5 h-3.5 w-3.5" />More filters</Button>
      </div>
    </div>
    {advanced && <div id="punch-extra-filters" className="space-y-3 border-b border-brand-100 bg-brand-100/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-1"><Label htmlFor="punch-source" className="text-[10px]">Source</Label><SearchableSelect id="punch-source" widthClass="w-full" value={filters.source ?? ''} allLabel="All sources" options={['web', 'mobile', 'device', 'manual'].map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} onChange={source => onFilters({ ...filters, source: source || undefined, page: 1 })} /></div>
        <div className="space-y-1"><Label htmlFor="punch-device" className="text-[10px]">Device in returned punches</Label><SearchableSelect id="punch-device" widthClass="w-full" value={filters.device_id ?? ''} allLabel="All devices" options={devices} onChange={device_id => onFilters({ ...filters, device_id: device_id || undefined, page: 1 })} /></div>
        <div className="space-y-1"><Label htmlFor="punch-processed" className="text-[10px]">Processing</Label><SearchableSelect id="punch-processed" widthClass="w-full" value={filters.is_processed ?? ''} allLabel="All statuses" options={[{ value: '1', label: 'Processed' }, { value: '0', label: 'Pending' }]} onChange={value => onFilters({ ...filters, is_processed: value as '0' | '1' | '', page: 1 })} /></div>
        <div className="space-y-1"><Label htmlFor="punch-from" className="text-[10px]">From</Label><Input id="punch-from" type="date" max={filters.date_to || today} value={filters.date_from ?? ''} onChange={event => changeRange('date_from', event.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="punch-to" className="text-[10px]">To</Label><Input id="punch-to" type="date" min={filters.date_from} max={today} value={filters.date_to ?? ''} onChange={event => changeRange('date_to', event.target.value)} /></div>
      </div>
      <form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); onFilters({ ...filters, search: search.trim() || undefined, page: 1 }); }}>
        <Input aria-label="Search punch records" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search punch records…" className="min-w-40 flex-1 bg-white" />
        <Button variant="outline" type="submit" className="text-xs"><Search className="mr-1.5 h-3.5 w-3.5" />Search</Button>
        <Button variant="ghost" type="button" className="text-xs" onClick={() => { setSearch(''); onFilters({ date: today, page: 1, per_page: filters.per_page }); }}>Reset filters</Button>
      </form>
      <p className="text-[10px] text-muted-foreground">Choose a single date or a date range. These filters do not change today’s Clock In lock.</p>
    </div>}
    {query.isPending ? <AppLoader label="Loading punches…" /> : query.isError ? <div className="p-4"><ApiErrorState error={query.error} onRetry={() => void query.refetch()} /></div> : !rows.length ? <div className="px-5 py-10 text-center"><History className="mx-auto h-7 w-7 text-brand-600/50" /><p className="mt-2 text-sm font-medium text-brand-900">No punches found</p><p className="mt-1 text-xs text-muted-foreground">No recorded punches match this date and filter.</p></div> : <div aria-busy={query.isFetching}>
      <table className="w-full table-fixed text-left text-xs">
        <caption className="sr-only">Attendance punch records</caption>
        <thead className="hidden border-b border-gray-200 bg-gray-50 md:table-header-group">
          <tr>{['Employee', 'Date / time', 'Punch', 'Source', 'Recorded location', 'Processing'].map(label => <th key={label} scope="col" className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">{label}</th>)}</tr>
        </thead>
        <tbody className="block divide-y divide-gray-100 md:table-row-group">{rows.map(punch => <tr key={punch.id} className="grid grid-cols-2 items-start gap-x-3 gap-y-2 px-3 py-3 transition-colors hover:bg-gray-50/80 md:table-row md:p-0">
          <td className="min-w-0 md:px-3 md:py-3 md:align-top"><p className="break-words font-medium text-brand-900">{punch.employee?.name || 'Employee unavailable'}</p><p className="mt-0.5 break-words text-[10px] text-gray-500">{punch.employee?.employee_code || '—'}</p></td>
          <td className="md:px-3 md:py-3 md:align-top"><p className="font-medium tabular-nums text-brand-900">{attendanceTime(punch.punched_at, timeZone)}</p><p className="mt-0.5 text-[10px] text-gray-500">{punch.punched_at?.slice(0, 10) ?? 'Date not recorded'}</p></td>
          <td className="md:px-3 md:py-3 md:align-top"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${punch.punch_type === 'in' ? 'bg-brand-100 text-brand-800' : punch.punch_type === 'out' ? 'bg-[#EEC293]/20 text-brand-800' : 'bg-amber-50 text-amber-800'}`}>{punchLabel(punch.punch_type)}</span></td>
          <td className="min-w-0 md:px-3 md:py-3 md:align-top"><p className="capitalize text-gray-700">{punch.source.replaceAll('_', ' ')}</p>{punch.device && <p className="mt-0.5 break-words text-[10px] text-gray-500">{punch.device.friendly_name || punch.device.device_name}</p>}</td>
          <td className="min-w-0 break-words md:px-3 md:py-3 md:align-top"><Coordinates punch={punch} /></td>
          <td className="md:px-3 md:py-3 md:align-top"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${punch.is_processed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{punch.is_processed ? 'Processed' : 'Pending'}</span>{punch.mock_location_flag && <p className="mt-1 text-[10px] text-amber-800">Mock location flagged</p>}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-100 px-4 py-3 text-[11px] text-muted-foreground">
      <span>{query.isSuccess ? `${meta?.total ?? 0} punches · Page ${page} of ${pages}` : 'Punch records'}</span>
      <div className="flex items-center gap-2"><label htmlFor="punch-page-size" className="sr-only">Punches per page</label><select id="punch-page-size" className="h-8 rounded-md border border-brand-600/15 bg-white px-2 text-xs" value={filters.per_page} onChange={event => onFilters({ ...filters, per_page: Number(event.target.value), page: 1 })}>{[10, 25, 50, 1000].map(value => <option key={value} value={value}>{value} / page</option>)}</select><Button variant="outline" size="icon" className="h-8 w-8" aria-label="Previous punch page" disabled={!meta || query.isFetching || page <= 1} onClick={() => onFilters({ ...filters, page: page - 1 })}><ChevronLeft className="h-3.5 w-3.5" /></Button><Button variant="outline" size="icon" className="h-8 w-8" aria-label="Next punch page" disabled={!meta || query.isFetching || page >= pages} onClick={() => onFilters({ ...filters, page: page + 1 })}><ChevronRight className="h-3.5 w-3.5" /></Button></div>
    </div>
  </section>;
}
