'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect from '@/components/ui/searchable-select';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { employeeService } from '@/services/employee.service';
import { rosterTemplateService } from '@/services/roster-template.service';
import type { RosterTemplate } from '@/types/roster-template';
import { useAppSelector } from '@/store/hooks';
import { companyDate } from '@/lib/web-punch';
import { showApiError } from '@/lib/error-toast';
const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
interface Summary { created: number; skipped: number; skipped_dates: string[]; days: number }
async function templates() {
  const first = await rosterTemplateService.getAll({ is_active: 1, per_page: 100, page: 1 });
  if (!first.success) throw new Error(first.message);
  const rows = [...first.data];
  for (let page = 2; page <= first.meta.last_page; page++) { const next = await rosterTemplateService.getAll({ is_active: 1, per_page: 100, page }); if (!next.success) throw new Error(next.message); rows.push(...next.data); }
  return rows.filter(item => item.is_active);
}
export function RosterAssignmentModal({ onClose }: { onClose: () => void }) {
  const company = useAppSelector(state => state.auth.company);
  const today = companyDate(company?.timezone || 'Asia/Karachi');
  const [employee, setEmployee] = useState(''), [from, setFrom] = useState(today), [to, setTo] = useState(today);
  const [mode, setMode] = useState<'template' | 'shift'>('template');
  const [template, setTemplate] = useState(''), [shift, setShift] = useState(''), [days, setDays] = useState<string[]>([]);
  const [off, setOff] = useState(false), [holiday, setHoliday] = useState(false), [status, setStatus] = useState('scheduled'), [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Summary | null>(null);
  const client = useQueryClient();
  const people = useQuery({ queryKey: ['roster', company?.id, 'employee-options'], queryFn: ({ signal }) => employeeService.getAllForBatches(signal), retry: false });
  const shifts = useQuery({ queryKey: ['roster', company?.id, 'active-shifts'], queryFn: async () => { const { data } = await api.get<{ success: boolean; message?: string; data: { id: string; name: string; code: string }[] }>('/time-sync/shifts/lookup'); if (!data.success) throw new Error(data.message); return data.data; }, retry: false });
  const available = useQuery({ queryKey: ['roster', company?.id, 'active-templates'], queryFn: templates, retry: false });
  const pattern = useQuery({ queryKey: ['roster', company?.id, 'template-preview', template], queryFn: () => rosterTemplateService.getById(template), enabled: mode === 'template' && Boolean(template), retry: false });
  const mutation = useMutation({ mutationFn: async (payload: Record<string, unknown>) => { const { data } = await api.post<{ success: boolean; message: string; data: Summary }>('/time-sync/roster', payload); if (!data.success) throw new Error(data.message); return data; }, retry: false, onSuccess: response => { toast.success(response.message); setResult(response.data); void client.invalidateQueries({ queryKey: ['roster'] }); void client.invalidateQueries({ queryKey: ['time-sync'] }); }, onError: error => {
    showApiError(error);
    const body = (error as { response?: { data?: { errors?: Record<string, string[]>; data?: Summary } } }).response?.data;
    setErrors(Object.fromEntries(Object.entries(body?.errors ?? {}).map(([key, value]) => [key, value[0]])));
    if (body?.data?.skipped_dates) setResult(body.data);
  } });
  function submit(event: React.FormEvent) {
    event.preventDefault(); setErrors({}); setResult(null);
    if (!employee || !from || !to) { toast.error('Employee and both dates are required.'); return; }
    const length = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 + 1;
    if (!Number.isFinite(length) || length < 1 || length > 366) { setErrors({ date_to: 'Choose an inclusive date range between 1 and 366 days.' }); return; }
    if (mode === 'template' && !template) { setErrors({ template_id: 'Select an active template.' }); return; }
    if (mode === 'shift' && !shift && !off && !holiday) { setErrors({ shift_id: 'Select a shift, weekly off, or holiday.' }); return; }
    mutation.mutate({ employee_id: employee, date_from: from, date_to: to, status, notes: notes.trim() || null, ...(mode === 'template' ? { template_id: template } : { ...(shift ? { shift_id: shift } : {}), is_weekly_off: off, is_holiday: holiday, ...(shift && days.length ? { working_days: days } : {}) }) });
  }
  const message = (key: string) => errors[key] ? <p className="text-xs text-red-600">{errors[key]}</p> : null;
  return <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }}><DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-2xl"><DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left"><DialogTitle>Add Assignment</DialogTitle><DialogDescription>Assign one employee over a date range. Existing assignments are skipped, never overwritten.</DialogDescription></DialogHeader><form onSubmit={submit}><fieldset disabled={mutation.isPending} className="space-y-4 px-6 py-5"><div className="space-y-1.5"><Label>Employee *</Label><SearchableSelect aria-label="Assignment employee" allowAll={false} widthClass="w-full" value={employee} options={(people.data ?? []).map(item => ({ value: String(item.uuid || item.id), label: `${item.employee_code} – ${item.name}` }))} onChange={setEmployee} disabled={people.isPending} />{message('employee_id')}{people.isError && <ApiErrorState error={people.error} onRetry={() => void people.refetch()} />}</div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="assign-from">From *</Label><Input id="assign-from" required type="date" value={from} onChange={event => setFrom(event.target.value)} />{message('date_from')}</div><div className="space-y-1.5"><Label htmlFor="assign-to">To *</Label><Input id="assign-to" required type="date" min={from} value={to} onChange={event => setTo(event.target.value)} />{message('date_to')}</div></div><div className="flex gap-2">{(['template', 'shift'] as const).map(value => <Button key={value} type="button" variant={mode === value ? 'default' : 'outline'} className={mode === value ? 'bg-[#1E1B4B] hover:bg-[#2A2675]' : ''} aria-pressed={mode === value} onClick={() => setMode(value)}>Use {value}</Button>)}</div>{mode === 'template' ? <div className="space-y-2"><Label>Template *</Label><SearchableSelect aria-label="Assignment template" allowAll={false} widthClass="w-full" value={template} options={(available.data ?? []).map(item => ({ value: item.id, label: item.name }))} onChange={setTemplate} disabled={available.isPending} />{message('template_id')}{message('template')}{available.isError && <ApiErrorState error={available.error} onRetry={() => void available.refetch()} />}{pattern.isFetching ? <AppLoader variant="inline" label="Loading pattern…" /> : pattern.isError ? <ApiErrorState error={pattern.error} onRetry={() => void pattern.refetch()} /> : pattern.data && <PatternPreview template={pattern.data} />}</div> : <div className="space-y-3"><Label>Shift</Label><SearchableSelect aria-label="Assignment shift" widthClass="w-full" value={shift} options={(shifts.data ?? []).map(item => ({ value: item.id, label: `${item.name} (${item.code})` }))} allLabel="No shift" onChange={setShift} disabled={shifts.isPending} />{message('shift_id')}{shifts.isError && <ApiErrorState error={shifts.error} onRetry={() => void shifts.refetch()} />}<div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={off} onChange={event => setOff(event.target.checked)} />Weekly off</label><label className="flex items-center gap-2"><input type="checkbox" checked={holiday} onChange={event => setHoliday(event.target.checked)} />Holiday</label></div>{message('is_weekly_off')}{message('is_holiday')}{shift && <div className="space-y-2"><p className="text-xs text-gray-500">Working days (leave empty for every day)</p><div className="flex flex-wrap gap-2">{weekdays.map(day => <label className="flex items-center gap-1 text-xs capitalize" key={day}><input type="checkbox" checked={days.includes(day)} onChange={event => setDays(event.target.checked ? [...days, day] : days.filter(value => value !== day))} />{day.slice(0, 3)}</label>)}</div>{message('working_days')}</div>}</div>}<div className="space-y-1.5"><Label>Status</Label><SearchableSelect aria-label="Assignment status" allowAll={false} widthClass="w-full" value={status} options={[{ value: 'scheduled', label: 'Scheduled (draft)' }, { value: 'published', label: 'Published' }, { value: 'confirmed', label: 'Confirmed' }]} onChange={setStatus} /><p className="text-xs text-gray-500">Shift swaps require published or confirmed working rosters.</p>{message('status')}</div><div className="space-y-1.5"><Label htmlFor="assign-notes">Notes</Label><Textarea id="assign-notes" maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)} />{message('notes')}</div></fieldset>{result && <div className="mx-6 mb-5 space-y-2 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm"><p>{result.created ?? 0} created · {result.skipped ?? result.skipped_dates?.length ?? 0} skipped</p>{Boolean(result.skipped_dates?.length) && <details><summary className="cursor-pointer text-xs font-medium">View skipped dates</summary><p className="mt-2 break-words text-xs">{result.skipped_dates.join(', ')}</p></details>}</div>}<DialogFooter className="border-t bg-muted/30 px-6 py-4"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Close</Button><Button type="submit" className="bg-[#1E1B4B] hover:bg-[#2A2675]" disabled={mutation.isPending || mutation.isSuccess}>{mutation.isPending ? <AppLoader variant="inline" label="Assigning…" /> : 'Create assignment'}</Button></DialogFooter></form></DialogContent></Dialog>;
}
function PatternPreview({ template }: { template: RosterTemplate }) {
  return <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><p className="mb-2 text-xs font-semibold">{template.name} · {template.template_type}</p><div className="space-y-1">{template.pattern_data.map((row, index) => <p key={index} className="text-xs capitalize text-gray-600">{index + 1}. {row.day}: {row.is_off ? 'Weekly off' : row.shift ? `${row.shift.name} · ${row.shift.start_time.slice(0, 5)}–${row.shift.end_time.slice(0, 5)}` : 'Shift unavailable'}</p>)}</div></div>;
}
