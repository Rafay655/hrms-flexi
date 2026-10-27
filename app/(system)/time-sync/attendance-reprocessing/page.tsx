'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarRange, CheckCircle2, RefreshCw, Users, LockKeyhole, SkipForward, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import SearchableSelect from '@/components/ui/searchable-select';
import { useAppSelector } from '@/store/hooks';
import { employeeService } from '@/services/employee.service';
import { attendanceReprocessService, type ReprocessInput } from '@/services/attendance-reprocess.service';
import { companyDate } from '@/lib/web-punch';
import { attendanceDate, attendanceLabel } from '@/lib/attendance-timeline';
import { showApiError } from '@/lib/error-toast';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default function AttendanceReprocessingPage() {
  const company = useAppSelector(state => state.auth.company);
  const user = useAppSelector(state => state.auth.user?.id);
  return <Reprocessing key={`${company?.id}-${user}`} company={company?.id} user={user} timeZone={company?.timezone || 'Asia/Karachi'} />;
}
function Reprocessing({ company, user, timeZone }: { company?: string; user?: string; timeZone: string }) {
  const today = companyDate(timeZone);
  const [fromDate, setFromDate] = useState(`${today.slice(0, 7)}-01`);
  const [toDate, setToDate] = useState(today);
  const [selected, setSelected] = useState<string[]>([]);
  const client = useQueryClient();
  const employees = useQuery({ queryKey: ['time-sync', 'reprocessing-employees', company, user], queryFn: ({ signal }) => employeeService.getAllForBatches(signal), retry: false });
  const options = [...new Map((employees.data ?? []).map(employee => {
    const value = String(employee.uuid || employee.id);
    return [value, { value, label: `${employee.name} · ${employee.employee_code}` }] as const;
  })).values()].filter(employee => uuidPattern.test(employee.value));
  const mutation = useMutation({
    mutationFn: (input: ReprocessInput) => attendanceReprocessService.run(input), retry: false,
    onError: error => showApiError(error),
    onSuccess: response => {
      toast.success(response.message);
      void client.invalidateQueries({ queryKey: ['time-sync'] });
      void client.invalidateQueries({ queryKey: ['regularizations'] });
    },
  });
  const result = mutation.data?.data;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fromDate || !toDate) { toast.error('Select both dates.'); return; }
    if (fromDate > toDate) { toast.error('From date must be on or before to date.'); return; }
    if (selected.some(id => !uuidPattern.test(id))) { toast.error('Select valid employees.'); return; }
    mutation.mutate({ from_date: fromDate, to_date: toDate, employee_id: selected });
  }
  return <div className="space-y-5 p-3">
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="border-b"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-[#1E1B4B]"><RefreshCw className="h-5 w-5" /></span><div><CardTitle className="text-2xl font-semibold text-gray-900">Attendance Reprocessing</CardTitle><p className="mt-1 text-sm text-gray-500">Recalculate attendance for a date range and employee scope.</p></div></div></CardHeader>
      <CardContent className="p-6"><form onSubmit={submit} className="space-y-5"><fieldset disabled={mutation.isPending} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="reprocess-from">From date *</Label><Input id="reprocess-from" type="date" required max={toDate || undefined} value={fromDate} onChange={event => setFromDate(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="reprocess-to">To date *</Label><Input id="reprocess-to" type="date" required min={fromDate || undefined} value={toDate} onChange={event => setToDate(event.target.value)} /></div></div><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="reprocess-employees">Employees (optional)</Label>{selected.length > 0 && <button type="button" className="text-xs font-medium text-brand-700 hover:underline" onClick={() => setSelected([])}>Clear selection</button>}</div><SearchableSelect id="reprocess-employees" multiple value={selected} options={options} onChange={setSelected} widthClass="w-full" placeholder="All employees — select to narrow the scope" searchPlaceholder="Search name or employee code…" disabled={mutation.isPending || employees.isPending || employees.isError} isLoading={employees.isPending} /><p className="text-xs text-gray-500">Leave empty to reprocess attendance for all employees in the current company.</p>{employees.isError && <ApiErrorState error={employees.error} onRetry={() => void employees.refetch()} />}</div></fieldset>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50 p-4"><div className="flex items-start gap-2.5 text-sm text-gray-600"><Users className="mt-0.5 h-4 w-4 shrink-0 text-[#1E1B4B]" /><div><p className="font-medium text-gray-900">{selected.length ? `${selected.length} selected ${selected.length === 1 ? 'employee' : 'employees'}` : 'All employees'}</p><p className="mt-1 text-xs">{fromDate && toDate ? `${attendanceDate(fromDate, 'short')} – ${attendanceDate(toDate, 'short')}` : 'Select a date range'} · Inclusive date range</p></div></div><Button type="submit" disabled={mutation.isPending || !fromDate || !toDate || fromDate > toDate} className="bg-[#1E1B4B] text-white hover:bg-[#2A2675]">{mutation.isPending ? <AppLoader variant="inline" label="Reprocessing attendance…" /> : <><RefreshCw className="mr-2 h-4 w-4" />{selected.length ? 'Reprocess selected employees' : 'Reprocess all employees'}</>}</Button></div>
      {mutation.isPending && <div role="status" className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">Attendance is being reprocessed. The results will appear when the server responds.</div>}
      </form></CardContent>
    </Card>
    {result && <Card className="border border-gray-100 shadow-sm"><CardHeader className="border-b"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><CardTitle className="text-lg font-semibold text-gray-900">Reprocessing results</CardTitle></div><span className="rounded-full border border-brand-200 bg-brand-100 px-2.5 py-1 text-xs font-medium capitalize text-brand-800">{result.status.replaceAll('_', ' ')}</span></div><p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><CalendarRange className="h-3.5 w-3.5" />{result.from_date} – {result.to_date}</p></CardHeader><CardContent className="space-y-5 p-6"><dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ label: 'Employees', value: result.employees, icon: Users }, { label: 'Processed', value: result.processed, icon: Activity }, { label: 'Locked', value: result.locked, icon: LockKeyhole }, { label: 'Skipped', value: result.skipped, icon: SkipForward }].map(item => <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"><dt className="flex items-center gap-2 text-xs text-gray-500"><item.icon className="h-4 w-4 text-brand-600" />{item.label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-[#1E1B4B]">{item.value.toLocaleString()}</dd></div>)}</dl><div className="overflow-hidden rounded-lg border border-gray-200"><table className="w-full"><caption className="sr-only">Attendance results by status</caption><thead className="border-b border-gray-200 bg-gray-50"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700"><th scope="col" className="px-6 py-3">Attendance status</th><th scope="col" className="px-6 py-3 text-right">Records</th></tr></thead><tbody className="divide-y divide-gray-100">{Object.entries(result.by_status ?? {}).length ? Object.entries(result.by_status).map(([status, count]) => <tr key={status} className="text-sm transition-colors hover:bg-gray-50"><td className="px-6 py-4 capitalize text-gray-700">{attendanceLabel(status)}</td><td className="px-6 py-4 text-right font-medium tabular-nums text-gray-900">{count.toLocaleString()}</td></tr>) : <tr><td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">No attendance statuses returned.</td></tr>}</tbody></table></div></CardContent></Card>}
  </div>;
}
