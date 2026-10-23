'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import SearchableSelect from '@/components/ui/searchable-select';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { shiftService } from '@/services/shift.service';
import { attendancePolicyService } from '@/services/attendance-policy.service';
import { useAppSelector } from '@/store/hooks';
import { showApiError } from '@/lib/error-toast';
import type { Shift, Weekday, ShiftBreakWindow } from '@/types/shift';

const weekdays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const numericFields = [
  { key: 'max_ot_minutes_per_day', label: 'Maximum overtime per day (minutes)', max: 1440, initial: '' },
];
type Draft = Record<string, string | boolean | string[]>;
function initial(shift?: Shift): Draft {
  const draft: Draft = { name: '', code: '', attendance_policy_id: '', shift_type: 'fixed', start_time: '09:00', end_time: '18:00', is_night_shift: false, overtime_allowed: false, is_active: true, working_days: weekdays.slice(0, 5) };
  numericFields.forEach(item => { draft[item.key] = item.initial; });
  if (shift) for (const key of Object.keys(draft)) {
    const value = shift[key as keyof Shift];
    if (key === 'working_days') draft[key] = [...shift.working_days];
    else if (typeof draft[key] === 'boolean') draft[key] = Boolean(value);
    else draft[key] = value == null ? '' : String(value);
  }
  draft.start_time = String(draft.start_time).slice(0, 5);
  draft.end_time = String(draft.end_time).slice(0, 5);
  return draft;
}
async function allPolicies() {
  const first = await attendancePolicyService.getAll({ page: 1, per_page: 100 });
  const rows = [...first.data.data];
  for (let page = 2; page <= first.data.meta.last_page; page++) rows.push(...(await attendancePolicyService.getAll({ page, per_page: 100 })).data.data);
  return rows;
}
export function ShiftFormModal({ uuid, onClose }: { uuid?: string; onClose: () => void }) {
  const company = useAppSelector(state => state.auth.company?.id);
  const [saving, setSaving] = useState(false);
  const query = useQuery({ queryKey: ['shifts', company, 'detail', uuid], queryFn: () => shiftService.getById(uuid!), enabled: Boolean(uuid), retry: false });
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"><DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left"><DialogTitle>{uuid ? 'Edit shift template' : 'Create shift template'}</DialogTitle><DialogDescription>Set the schedule, working days, and attendance rules.</DialogDescription></DialogHeader>{uuid && query.isPending ? <AppLoader label="Loading shift…" /> : uuid && query.isError ? <div className="p-6"><ApiErrorState error={query.error} onRetry={() => void query.refetch()} /></div> : <ShiftEditor shift={query.data} company={company} onSaving={setSaving} onClose={onClose} />}</DialogContent></Dialog>;
}
function ShiftEditor({ shift, company, onSaving, onClose }: { shift?: Shift; company?: string; onSaving: (saving: boolean) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(() => initial(shift));
  const [tab, setTab] = useState(0);
  const [breaks, setBreaks] = useState<ShiftBreakWindow[]>(() => (shift?.break_windows ?? []).map(window => ({ ...window, days: [...window.days], start: window.start.slice(0, 5), end: window.end.slice(0, 5) })));
  const client = useQueryClient();
  const policies = useQuery({ queryKey: ['attendance-policies', company, 'shift-options'], queryFn: allPolicies, retry: false });
  const save = useMutation({ mutationFn: shiftService.save, retry: false, onMutate: () => onSaving(true), onSettled: () => onSaving(false), onError: error => showApiError(error), onSuccess: () => { toast.success(shift ? 'Shift updated successfully' : 'Shift created successfully'); void client.invalidateQueries({ queryKey: ['shifts'] }); onClose(); } });
  const set = (key: string, value: Draft[string]) => setDraft(previous => ({ ...previous, [key]: value }));
  const selectedOptions = (options: { value: string; label: string }[], key: string) => draft[key] && !options.some(item => item.value === draft[key]) ? [...options, { value: String(draft[key]), label: `Current selection (${String(draft[key]).slice(0, 8)}…)` }] : options;
  const field = (key: string, label: string, type = 'text', maxLength?: number) => <div key={key} className="space-y-1.5"><Label htmlFor={`shift-${key}`}>{label} *</Label><Input id={`shift-${key}`} type={type} required maxLength={maxLength} value={String(draft[key])} onChange={event => set(key, event.target.value)} /></div>;
  const toggle = (key: string, label: string) => <label className="flex items-center gap-2 text-sm text-gray-700"><input className="h-4 w-4 accent-[#1E1B4B]" type="checkbox" checked={Boolean(draft[key])} onChange={event => set(key, event.target.checked)} />{label}</label>;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = event.currentTarget.querySelector<HTMLInputElement>('input:invalid');
    if (invalid) { setTab(Number(invalid.closest<HTMLElement>('[data-shift-tab]')?.dataset.shiftTab ?? 0)); requestAnimationFrame(() => { invalid.focus(); invalid.reportValidity(); }); return; }
    if (!String(draft.name).trim() || !String(draft.code).trim()) { setTab(0); toast.error('Name and code are required.'); return; }
    if (!(draft.working_days as string[]).length) { setTab(0); toast.error('Select at least one working day.'); return; }
    const payload: Record<string, unknown> = { ...draft, name: String(draft.name).trim(), code: String(draft.code).trim(), attendance_policy_id: draft.attendance_policy_id || null, working_days: [...new Set(draft.working_days as string[])] };
    for (const key of ['attendance_policy_id']) if (draft[key] && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(draft[key]))) { setTab(0); toast.error('Please select a valid attendance policy UUID.'); return; }
    for (const item of numericFields) {
      const value = draft[item.key];
      if (value === '') { payload[item.key] = null; continue; }
      const number = Number(value);
      if (!Number.isInteger(number) || number < 0 || number > item.max) { setTab(1); toast.error(`${item.label} must be a whole number between 0 and ${item.max}.`); return; }
      payload[item.key] = number;
    }
    if (breaks.length > 7) { setTab(1); toast.error('A shift may have at most 7 break windows.'); return; }
    for (const [index, window] of breaks.entries()) {
      if (!window.days.length || window.days.some(day => !weekdays.includes(day))) { setTab(1); toast.error(`Break ${index + 1}: select at least one valid weekday.`); return; }
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(window.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(window.end)) { setTab(1); toast.error(`Break ${index + 1}: enter times in HH:mm format.`); return; }
      if (window.end <= window.start) { setTab(1); toast.error(`Break ${index + 1}: end must be after start on the same calendar day.`); return; }
      if (window.label.length > 50) { setTab(1); toast.error(`Break ${index + 1}: label may not exceed 50 characters.`); return; }
    }
    payload.break_windows = breaks.map(window => ({ days: [...new Set(window.days)], start: window.start, end: window.end, paid: window.paid, label: window.label.trim() }));
    save.mutate({ uuid: shift?.id, payload });
  }
  return <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="flex gap-1 border-b px-6 py-3">{['Schedule & scope', 'Breaks & overtime'].map((label, index) => <button key={label} type="button" aria-pressed={tab === index} disabled={save.isPending} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === index ? 'bg-[#1E1B4B] text-white' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setTab(index)}>{label}</button>)}</div><fieldset disabled={save.isPending} className="min-h-0 flex-1 overflow-y-auto px-6 py-5"><div data-shift-tab="0" className={tab === 0 ? 'space-y-5' : 'hidden'}><div className="grid gap-4 sm:grid-cols-2">{field('name', 'Shift name', 'text', 100)}{field('code', 'Shift code', 'text', 20)}<div className="space-y-1.5"><Label htmlFor="shift-type">Shift type *</Label><SearchableSelect id="shift-type" allowAll={false} value={String(draft.shift_type)} options={['fixed', 'rotational', 'flexible'].map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} widthClass="w-full" onChange={value => set('shift_type', value)} /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="shift-policy">Attendance policy (optional)</Label><SearchableSelect id="shift-policy" value={String(draft.attendance_policy_id)} allLabel="Automatic policy resolution" disabled={policies.isPending} widthClass="w-full" options={selectedOptions((policies.data ?? []).map(item => ({ value: item.id, label: item.policy_name })), 'attendance_policy_id')} onChange={value => set('attendance_policy_id', value)} /><p className="text-xs text-gray-500">Leave unassigned to resolve by branch, department, employment type, or the default policy.</p>{policies.isError && <ApiErrorState error={policies.error} onRetry={() => void policies.refetch()} />}</div>{field('start_time', 'Start time', 'time')}{field('end_time', 'End time', 'time')}</div><div className="flex flex-wrap gap-5">{toggle('is_night_shift', 'Night shift')}{toggle('is_active', 'Active')}</div><fieldset className="space-y-2 border-t pt-4"><legend className="pt-4 text-sm font-medium">Working days *</legend><div className="flex flex-wrap gap-2">{weekdays.map(day => { const selected = (draft.working_days as string[]).includes(day); return <label key={day} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs capitalize ${selected ? 'border-brand-200 bg-brand-100 text-brand-900' : 'border-gray-200 text-gray-600'}`}><input type="checkbox" className="accent-[#1E1B4B]" checked={selected} onChange={() => set('working_days', selected ? (draft.working_days as string[]).filter(item => item !== day) : [...draft.working_days as string[], day])} />{day.slice(0, 3)}</label>; })}</div></fieldset></div><div data-shift-tab="1" className={tab === 1 ? 'space-y-5' : 'hidden'}>
      <BreakWindowsEditor windows={breaks} workingDays={draft.working_days as Weekday[]} onChange={setBreaks} />
      <div className="space-y-4 border-t pt-4"><h3 className="text-sm font-semibold">Overtime</h3>{toggle('overtime_allowed', 'Allow overtime')}<div className="grid gap-4 sm:grid-cols-2">{numericFields.map(item => <div className="space-y-1.5" key={item.key}><Label htmlFor={`shift-${item.key}`}>{item.label}</Label><Input id={`shift-${item.key}`} type="number" min={0} max={item.max} step={1} value={String(draft[item.key])} onChange={event => set(item.key, event.target.value)} /></div>)}</div><p className="text-xs text-gray-500">Grace periods and overtime thresholds come from the attendance policy. Break schedules can differ by working day.</p></div>
    </div></fieldset><DialogFooter className="items-center gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-between"><span className="text-xs text-gray-500">Section {tab + 1} of 2</span><div className="flex justify-end gap-2"><Button variant="outline" type="button" disabled={save.isPending} onClick={onClose}>Cancel</Button><Button variant="outline" type="button" disabled={save.isPending} onClick={() => setTab(tab === 0 ? 1 : 0)}>{tab === 0 ? 'Next' : 'Back'}</Button><Button type="submit" className="bg-[#1E1B4B] hover:bg-[#2A2675]" disabled={save.isPending}>{save.isPending ? <AppLoader variant="inline" label="Saving…" /> : shift ? 'Save changes' : 'Create template'}</Button></div></DialogFooter></form>;
}

export function ShiftDetailsModal({ uuid, onClose }: { uuid: string; onClose: () => void }) {
  const company = useAppSelector(state => state.auth.company?.id);
  const query = useQuery({ queryKey: ['shifts', company, 'detail', uuid], queryFn: () => shiftService.getById(uuid), retry: false });
  const shift = query.data;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Shift template details</DialogTitle><DialogDescription>{shift ? `${shift.name} · ${shift.code}` : 'Attendance schedule and rules'}</DialogDescription></DialogHeader>{query.isPending ? <AppLoader label="Loading shift…" /> : query.isError ? <ApiErrorState error={query.error} onRetry={() => void query.refetch()} /> : shift && <div className="space-y-4"><dl className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-2">{[{ label: 'Shift type', value: shift.shift_type }, { label: 'Schedule', value: `${shift.start_time?.slice(0, 5)} – ${shift.end_time?.slice(0, 5)}` }, { label: 'Status', value: shift.is_active ? 'Active' : 'Inactive' }, { label: 'Night shift', value: shift.is_night_shift ? 'Yes' : 'No' }, { label: 'Overtime allowed', value: shift.overtime_allowed ? 'Yes' : 'No' }, { label: 'Attendance policy', value: shift.attendance_policy_id ? 'Assigned' : 'Not assigned' }, ...numericFields.map(item => ({ label: item.label, value: shift[item.key as keyof Shift] == null ? 'Not set' : String(shift[item.key as keyof Shift]) }))].map(item => <div key={item.label}><dt className="text-xs text-gray-500">{item.label}</dt><dd className="mt-1 break-words font-medium">{item.value}</dd></div>)}</dl><div><p className="text-xs text-gray-500">Working days</p><p className="mt-1 text-sm capitalize">{shift.working_days.join(', ') || 'None'}</p></div><BreakWindowsSummary windows={shift.break_windows ?? []} /></div>}<DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter></DialogContent></Dialog>;
}


function BreakWindowsEditor({ windows, workingDays, onChange }: { windows: ShiftBreakWindow[]; workingDays: Weekday[]; onChange: (windows: ShiftBreakWindow[]) => void }) {
  const update = (index: number, values: Partial<ShiftBreakWindow>) => onChange(windows.map((window, position) => position === index ? { ...window, ...values } : window));
  return <section className="space-y-3" aria-label="Break windows"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Break windows</h3><p className="mt-1 text-xs text-gray-500">Up to 7 windows. Days refer to the shift start date; each break must start and end on the same calendar day.</p></div><Button type="button" variant="outline" size="sm" disabled={windows.length >= 7} onClick={() => { if (windows.length >= 7) return; onChange([...windows, { days: [...workingDays], start: '13:30', end: '14:30', paid: false, label: 'Lunch' }]); }}>Add break</Button></div>
    {!windows.length && <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">No break windows configured.</div>}
    {windows.map((window, index) => <fieldset key={index} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4"><div className="flex items-center justify-between"><legend className="text-xs font-semibold text-brand-900">Break {index + 1}</legend><Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-rose-600" onClick={() => onChange(windows.filter((_, position) => position !== index))} aria-label={`Remove break ${index + 1}`}>Remove</Button></div><div className="grid gap-3 sm:grid-cols-3"><div className="space-y-1.5"><Label htmlFor={`break-label-${index}`}>Label</Label><Input id={`break-label-${index}`} maxLength={50} value={window.label} onChange={event => update(index, { label: event.target.value })} /></div><div className="space-y-1.5"><Label htmlFor={`break-start-${index}`}>Start *</Label><Input id={`break-start-${index}`} type="time" required value={window.start} onChange={event => update(index, { start: event.target.value })} /></div><div className="space-y-1.5"><Label htmlFor={`break-end-${index}`}>End *</Label><Input id={`break-end-${index}`} type="time" required value={window.end} onChange={event => update(index, { end: event.target.value })} /></div></div><fieldset className="space-y-2"><legend className="mb-2 text-xs text-gray-600">Applies on *</legend><div className="flex flex-wrap gap-2">{weekdays.map(day => <label key={day} className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs capitalize ${window.days.includes(day) ? 'border-brand-200 bg-brand-100 text-brand-900' : 'border-gray-200 text-gray-500'}`}><input type="checkbox" className="accent-[#1E1B4B]" checked={window.days.includes(day)} onChange={event => update(index, { days: event.target.checked ? [...window.days, day] : window.days.filter(value => value !== day) })} />{day.slice(0, 3)}</label>)}</div></fieldset><label className="flex items-center gap-2 text-xs text-gray-700"><input type="checkbox" className="accent-[#1E1B4B]" checked={window.paid} onChange={event => update(index, { paid: event.target.checked })} />Paid break (not deducted from work minutes)</label></fieldset>)}
  </section>;
}
function BreakWindowsSummary({ windows }: { windows: ShiftBreakWindow[] }) {
  return <section className="space-y-2"><h3 className="text-sm font-medium">Break windows</h3>{!windows.length ? <p className="text-xs text-gray-500">No break windows configured.</p> : windows.map((window, index) => <div key={index} className="rounded-lg border border-gray-200 p-3"><div className="flex justify-between gap-2 text-sm"><span className="font-medium">{window.label || 'Break'}</span><span>{window.start.slice(0, 5)} – {window.end.slice(0, 5)}</span></div><p className="mt-1 text-xs capitalize text-gray-500">{window.days.map(day => day.slice(0, 3)).join(', ')} · {window.paid ? 'Paid' : 'Unpaid'}</p></div>)}</section>;
}
