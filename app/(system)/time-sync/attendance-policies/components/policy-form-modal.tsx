'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import SearchableSelect from '@/components/ui/searchable-select';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { useEmployeeTypes } from '@/hooks/useEmployeeTypes';
import { attendancePolicyService as service } from '@/services/attendance-policy.service';
import type { AttendancePolicy } from '@/types/attendance-policy';
import { showApiError } from '@/lib/error-toast';
import { useAppSelector } from '@/store/hooks';
import { companyDate } from '@/lib/web-punch';

type Draft = Record<string, string | string[] | boolean>;
type NumericField = { key: string; label: string; max: number; initial: string; decimal?: boolean };
const attendance: NumericField[] = [
  { key: 'grace_in_minutes', label: 'Clock-in grace (minutes)', max: 720, initial: '15' },
  { key: 'grace_out_minutes', label: 'Clock-out grace (minutes)', max: 720, initial: '10' },
  { key: 'half_day_threshold_minutes', label: 'Half-day threshold (minutes)', max: 1440, initial: '240' },
  { key: 'absent_threshold_minutes', label: 'Absent threshold (minutes)', max: 1440, initial: '120' },
  { key: 'short_leave_threshold_minutes', label: 'Short-leave threshold (minutes)', max: 720, initial: '30' },
  { key: 'late_marks_for_half_day', label: 'Late marks for half-day', max: 31, initial: '3' },
  { key: 'late_marks_for_absent', label: 'Late marks for absence', max: 31, initial: '6' },
  { key: 'max_short_leaves_per_month', label: 'Short leaves per month', max: 31, initial: '2' },
  { key: 'regularization_max_days_back', label: 'Regularization lookback (days)', max: 365, initial: '7' },
  { key: 'regularization_max_per_month', label: 'Regularizations per month', max: 31, initial: '3' },
];
const overtime: NumericField[] = [
  { key: 'min_ot_minutes', label: 'Minimum overtime (minutes)', max: 1440, initial: '30' },
  { key: 'ot_rate_weekday', label: 'Weekday overtime rate', max: 9.99, initial: '1.50', decimal: true },
  { key: 'ot_rate_weekend', label: 'Weekend overtime rate', max: 9.99, initial: '2.00', decimal: true },
  { key: 'night_premium_rate', label: 'Night premium rate', max: 9.99, initial: '1.25', decimal: true },
  { key: 'comp_off_min_hours', label: 'Comp-off minimum hours', max: 24, initial: '4', decimal: true },
  { key: 'comp_off_expiry_days', label: 'Comp-off expiry (days)', max: 3650, initial: '30' },
];
const numeric = [...attendance, ...overtime];
const timeKeys = ['auto_absent_cutoff_time', 'night_window_start', 'night_window_end'];
const arrayKeys = ['branch_ids', 'department_ids', 'employment_types', 'comp_off_eligible_on'];
const tabs = ['Policy & scope', 'Attendance rules', 'Overtime & benefits'];
function initialDraft(policy: AttendancePolicy | undefined, date: string): Draft {
  const draft: Draft = { policy_name: '', branch_ids: [], department_ids: [], employment_types: [], comp_off_eligible_on: [], effective_from: date, effective_to: '', auto_absent_on_no_punch: false, auto_absent_cutoff_time: '12:00', ot_calculation_method: 'actual', night_window_start: '22:00', night_window_end: '06:00', is_default: false, is_active: true };
  numeric.forEach(field => { draft[field.key] = field.initial; });
  if (policy) for (const key of Object.keys(draft)) {
    const value = policy[key as keyof AttendancePolicy];
    if (arrayKeys.includes(key)) draft[key] = Array.isArray(value) ? value.map(String) : [];
    else if (typeof draft[key] === 'boolean') draft[key] = Boolean(value);
    else draft[key] = value == null ? '' : String(value);
  }
  timeKeys.forEach(key => { draft[key] = String(draft[key]).slice(0, 5); });
  ['effective_from', 'effective_to'].forEach(key => { draft[key] = String(draft[key]).slice(0, 10); });
  return draft;
}

export function PolicyFormModal({ uuid, onClose }: { uuid?: string; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const company = useAppSelector(state => state.auth.company?.id);
  const query = useQuery({ queryKey: ['attendance-policies', company, 'detail', uuid], queryFn: () => service.getById(uuid!), enabled: Boolean(uuid), retry: false });
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"><DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left"><DialogTitle>{uuid ? 'Edit attendance policy' : 'Create attendance policy'}</DialogTitle><DialogDescription>Configure scope, attendance rules, and benefits.</DialogDescription></DialogHeader>{uuid && query.isPending ? <AppLoader label="Loading policy…" /> : uuid && query.isError ? <div className="p-6"><ApiErrorState error={query.error} onRetry={() => void query.refetch()} /></div> : <PolicyEditor policy={query.data} onClose={onClose} onSaving={setSaving} />}</DialogContent></Dialog>;
}

function PolicyEditor({ policy, onClose, onSaving }: { policy?: AttendancePolicy; onClose: () => void; onSaving: (value: boolean) => void }) {
  const timeZone = useAppSelector(state => state.auth.company?.timezone) || 'Asia/Karachi';
  const [draft, setDraft] = useState(() => initialDraft(policy, companyDate(timeZone)));
  const [tab, setTab] = useState(0);
  const client = useQueryClient();
  const branches = useBranches({ per_page: 1000 });
  const departments = useDepartments({ per_page: 1000 });
  const employeeTypes = useEmployeeTypes({ per_page: 1000 });
  const save = useMutation({ mutationFn: service.save, retry: false, onMutate: () => onSaving(true), onSettled: () => onSaving(false), onError: error => showApiError(error), onSuccess: () => { toast.success(policy ? 'Policy updated successfully' : 'Policy created successfully'); void client.invalidateQueries({ queryKey: ['attendance-policies'] }); onClose(); } });
  const set = (key: string, value: Draft[string]) => setDraft(previous => ({ ...previous, [key]: value }));
  const field = (key: string, label: string, type = 'text', required = false) => <div className="space-y-1.5" key={key}><Label htmlFor={`policy-${key}`}>{label}{required ? ' *' : ''}</Label><Input id={`policy-${key}`} type={type} required={required} maxLength={key === 'policy_name' ? 100 : undefined} value={String(draft[key])} min={key === 'effective_to' ? String(draft.effective_from) : undefined} onChange={event => set(key, event.target.value)} /></div>;
  const numbers = (fields: NumericField[]) => fields.map(item => <div className="space-y-1.5" key={item.key}><Label htmlFor={`policy-${item.key}`}>{item.label}</Label><Input id={`policy-${item.key}`} type="number" min={0} max={item.max} step={item.decimal ? '0.01' : '1'} value={String(draft[item.key])} onChange={event => set(item.key, event.target.value)} /></div>);
  const toggle = (key: string, label: string) => <label key={key} className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="h-4 w-4 accent-[#1E1B4B]" checked={Boolean(draft[key])} onChange={event => set(key, event.target.checked)} />{label}</label>;
  const branchRows = Array.isArray(branches.data?.data?.data) ? branches.data.data.data : [];
  const branchOptions = branchRows.map(branch => ({ value: branch.id, label: branch.name }));
  const departmentOptions = (departments.data?.data ?? []).map(item => ({ value: String(item.id), label: item.name }));
  const typeOptions = (employeeTypes.data?.data ?? []).map(item => ({ value: String(item.id), label: item.name }));
  // Keep selected scope visible even when a lookup page omits an older/inactive value.
  const withSelected = (options: { value: string; label: string }[], key: string) => [...options, ...(draft[key] as string[]).filter(value => !options.some(option => option.value === value)).map(value => ({ value, label: value }))];
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = event.currentTarget.querySelector<HTMLInputElement>('input:invalid');
    if (invalid) {
      const panel = invalid.closest<HTMLElement>('[data-policy-tab]');
      if (panel) setTab(Number(panel.dataset.policyTab));
      requestAnimationFrame(() => { invalid.focus(); invalid.reportValidity(); });
      return;
    }
    if (!String(draft.policy_name).trim()) { setTab(0); toast.error('Policy name is required.'); return; }
    if (draft.effective_to && String(draft.effective_to) < String(draft.effective_from)) { setTab(0); toast.error('Effective to must be on or after effective from.'); return; }
    const payload: Record<string, unknown> = { ...draft, policy_name: String(draft.policy_name).trim(), effective_to: draft.effective_to || null };
    for (const item of numeric) {
      const value = draft[item.key];
      if (value === '') { payload[item.key] = null; continue; }
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > item.max || (!item.decimal && !Number.isInteger(number))) { setTab(attendance.includes(item) ? 1 : 2); toast.error(`${item.label} must be ${item.decimal ? 'a number' : 'a whole number'} between 0 and ${item.max}.`); return; }
      payload[item.key] = number;
    }
    payload.department_ids = (draft.department_ids as string[]).map(Number);
    payload.employment_types = (draft.employment_types as string[]).map(Number);
    timeKeys.forEach(key => { payload[key] = draft[key] || null; });
    payload.ot_calculation_method = draft.ot_calculation_method || null;
    if ((draft.branch_ids as string[]).some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) { setTab(0); toast.error('Please select valid branch UUIDs.'); return; }
    save.mutate({ uuid: policy?.id, payload });
  }
  return <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <div className="flex gap-1 border-b bg-white px-6 py-3" role="tablist" aria-label="Policy sections">{tabs.map((label, index) => <button key={label} type="button" role="tab" id={`policy-tab-${index}`} aria-selected={tab === index} aria-controls={`policy-panel-${index}`} onClick={() => setTab(index)} className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium sm:text-sm ${tab === index ? 'bg-[#1E1B4B] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{label}</button>)}</div>
    <fieldset disabled={save.isPending} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div data-policy-tab="0" id="policy-panel-0" role="tabpanel" aria-labelledby="policy-tab-0" className={tab === 0 ? 'space-y-5' : 'hidden'}>
        {field('policy_name', 'Policy name', 'text', true)}<div className="grid gap-4 sm:grid-cols-2">{field('effective_from', 'Effective from', 'date', true)}{field('effective_to', 'Effective to', 'date')}</div><div className="flex flex-wrap gap-5">{toggle('is_active', 'Active')}{toggle('is_default', 'Default policy')}</div>
        <div className="border-t pt-4"><h3 className="mb-1 text-sm font-semibold">Applicability</h3><p className="mb-4 text-xs text-gray-500">Leave a selection empty to apply across all values in that group.</p><div className="grid gap-4 sm:grid-cols-2">{[{ key: 'branch_ids', label: 'Branches', options: branchOptions, query: branches }, { key: 'department_ids', label: 'Departments', options: departmentOptions, query: departments }, { key: 'employment_types', label: 'Employment types', options: typeOptions, query: employeeTypes }].map(item => <div className="space-y-1.5" key={item.key}><Label htmlFor={`policy-${item.key}`}>{item.label}</Label><SearchableSelect id={`policy-${item.key}`} multiple value={draft[item.key] as string[]} options={withSelected(item.options, item.key)} widthClass="w-full" disabled={item.query.isPending || save.isPending} placeholder={`All ${item.label.toLowerCase()}`} onChange={value => set(item.key, value)} />{item.query.isError && <ApiErrorState error={item.query.error} onRetry={() => void item.query.refetch()} />}</div>)}</div></div>
      </div>
      <div data-policy-tab="1" id="policy-panel-1" role="tabpanel" aria-labelledby="policy-tab-1" className={tab === 1 ? 'space-y-5' : 'hidden'}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{numbers(attendance)}</div><div className="grid items-center gap-4 border-t pt-4 sm:grid-cols-2">{toggle('auto_absent_on_no_punch', 'Automatically mark absent without punches')}{field('auto_absent_cutoff_time', 'Auto-absence cutoff', 'time')}</div></div>
      <div data-policy-tab="2" id="policy-panel-2" role="tabpanel" aria-labelledby="policy-tab-2" className={tab === 2 ? 'space-y-5' : 'hidden'}><div className="space-y-1.5"><Label htmlFor="policy-ot-method">Overtime calculation</Label><SearchableSelect id="policy-ot-method" value={String(draft.ot_calculation_method)} allLabel="Not specified" options={[{ value: 'actual', label: 'Actual minutes' }, ...[15, 30, 60].map(value => ({ value: `rounded_${value}`, label: `Rounded to ${value} minutes` }))]} widthClass="w-full sm:w-72" onChange={value => set('ot_calculation_method', value)} /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{numbers(overtime)}{field('night_window_start', 'Night window starts', 'time')}{field('night_window_end', 'Night window ends', 'time')}</div><div className="space-y-1.5 border-t pt-4"><Label htmlFor="policy-comp-off">Comp-off eligible days</Label><SearchableSelect id="policy-comp-off" multiple value={draft.comp_off_eligible_on as string[]} options={[{ value: 'holiday', label: 'Holiday' }, { value: 'weekly_off', label: 'Weekly off' }]} widthClass="w-full" onChange={value => set('comp_off_eligible_on', value)} /></div></div>
    </fieldset>
    <DialogFooter className="items-center gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-between"><span className="text-xs text-gray-500">Section {tab + 1} of 3</span><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>Cancel</Button>{tab > 0 && <Button type="button" variant="outline" onClick={() => setTab(tab - 1)} disabled={save.isPending}>Back</Button>}{tab < 2 && <Button type="button" variant="outline" onClick={() => setTab(tab + 1)} disabled={save.isPending}>Next</Button>}<Button type="submit" disabled={save.isPending} className="bg-[#1E1B4B] hover:bg-[#2A2675]">{save.isPending ? <AppLoader variant="inline" label="Saving…" /> : policy ? 'Save changes' : 'Create policy'}</Button></div></DialogFooter>
  </form>;
}
