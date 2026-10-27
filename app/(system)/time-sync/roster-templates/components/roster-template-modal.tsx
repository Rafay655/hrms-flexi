'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { useCreateRosterTemplate, useUpdateRosterTemplate } from '@/hooks/useRosterTemplates';
import { shiftService } from '@/services/shift.service';
import type { RosterTemplate, RosterTemplateFormData, PatternDay, Weekday, TemplateType } from '@/types/roster-template';

const weekdays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const types: { value: TemplateType; label: string }[] = [{ value: 'weekly', label: 'Weekly' }, { value: 'fortnightly', label: 'Fortnightly' }, { value: 'yearly', label: 'Yearly' }];
async function allShifts() {
  return shiftService.lookup();
}

export function RosterTemplateModal({ mode, item, onClose }: { mode: 'create' | 'edit' | 'view'; item?: RosterTemplate; onClose: () => void }) {
  const readOnly = mode === 'view';
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bulkShift, setBulkShift] = useState('');
  const [draft, setDraft] = useState<RosterTemplateFormData>(() => ({
    name: item?.name ?? '', template_type: item?.template_type ?? 'weekly',
    working_days: [...(item?.working_days ?? weekdays.slice(0, 5))],
    pattern_data: item?.pattern_data?.map(row => ({ ...row })) ?? [],
    auto_generate: Boolean(item?.auto_generate), is_active: item ? Boolean(item.is_active) : true,
  }));
  const shifts = useQuery({ queryKey: ['shifts', 'roster-template-options'], queryFn: allShifts, retry: false });
  const create = useCreateRosterTemplate();
  const update = useUpdateRosterTemplate();
  const saving = create.isPending || update.isPending;
  const options = (shifts.data ?? []).map(shift => ({ value: String(shift.uuid ?? shift.id), label: `${shift.name} (${shift.code})` }));
  // Preserve references to shifts that are no longer returned by the options endpoint.
  const shiftOptions = [...options, ...[...new Set(draft.pattern_data.map(row => row.shift_id).filter(id => id != null && id !== '').map(String))].filter(id => !options.some(option => option.value === id)).map(id => ({ value: id, label: (() => { const saved = draft.pattern_data.find(row => String(row.shift_id) === id)?.shift; return saved ? `${saved.name} (${saved.code})${saved.is_active ? '' : ' · Inactive — saved shift'}` : `Saved shift (${id.slice(0, 8)}…)`; })() }))];
  const set = <K extends keyof RosterTemplateFormData>(key: K, value: RosterTemplateFormData[K]) => { setDraft(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: '' })); };
  const updateRow = (index: number, value: Partial<PatternDay>) => set('pattern_data', draft.pattern_data.map((row, position) => position === index ? { ...row, ...value } : row));
  const validateDetails = () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = 'Enter a name for this template.';
    else if (draft.name.trim().length > 100) next.name = 'Use 100 characters or fewer.';
    if (!draft.template_type) next.template_type = 'Choose a template type.';
    if (!draft.working_days.length) next.working_days = 'Select at least one working day.';
    setErrors(next);
    return !Object.keys(next).length;
  };
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly || saving) return;
    if (!validateDetails()) { setTab(0); return; }
    if (!draft.pattern_data.length || draft.pattern_data.some(row => !row.is_off && !row.shift_id)) {
      setErrors({ pattern_data: draft.pattern_data.length ? 'Choose a shift or mark each unassigned row as a day off.' : 'Add working days or add a day to start your pattern.' });
      setTab(1); return;
    }
    const limit = draft.template_type === 'weekly' ? 7 : 14;
    if (draft.pattern_data.length > limit) { setTab(1); setErrors({ pattern_data: `This template supports at most ${limit} pattern rows.` }); return; }
    const missing = draft.working_days.find(day => !draft.pattern_data.some(row => row.day === day));
    if (missing) { setTab(1); setErrors({ pattern_data: `Add a pattern row for ${missing}.` }); return; }
    const payload = { ...draft, name: draft.name.trim(), pattern_data: draft.pattern_data.map(row => ({ day: row.day, is_off: row.is_off, shift_id: row.is_off ? null : row.shift_id })) };
    if (mode === 'create') create.mutate(payload, { onSuccess: onClose });
    else if (item) update.mutate({ uuid: item.id, data: payload }, { onSuccess: onClose });
  }
  const message = (key: string) => errors[key] ? <p id={`roster-${key}-error`} role="alert" className="mt-1 text-xs text-red-600">{errors[key]}</p> : null;

  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl" onEscapeKeyDown={event => { if (saving) event.preventDefault(); }} onInteractOutside={event => { if (saving) event.preventDefault(); }}>
      <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left">
        <DialogTitle>{readOnly ? 'Roster template details' : mode === 'edit' ? 'Edit roster template' : 'Create roster template'}</DialogTitle>
        <DialogDescription>{readOnly ? 'Review working days and the saved shift sequence.' : 'Name your template, then build the shift pattern to reuse in your rosters.'}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <div className="flex gap-2 border-b px-6 py-3" role="tablist" aria-label="Template sections">
          {['Template details', 'Shift pattern'].map((label, index) => <button key={label} type="button" role="tab" id={`roster-tab-${index}`} aria-selected={tab === index} aria-controls={`roster-panel-${index}`} disabled={saving} onClick={() => setTab(index)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === index ? 'bg-brand-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{index + 1}. {label}</button>)}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <fieldset disabled={saving || readOnly} className="min-w-0">
            <div role="tabpanel" id="roster-panel-0" aria-labelledby="roster-tab-0" hidden={tab !== 0} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5"><Label htmlFor="roster-name">Template name *</Label><Input id="roster-name" autoFocus={!readOnly} maxLength={100} placeholder="e.g. Office team — standard week" value={draft.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'roster-name-error' : undefined} onChange={event => set('name', event.target.value)} />{message('name')}</div>
                <div className="min-w-0 space-y-1.5"><Label htmlFor="roster-type">Template type *</Label><SearchableSelect id="roster-type" allowAll={false} widthClass="w-full" value={draft.template_type} options={types} disabled={saving || readOnly} onChange={value => set('template_type', value as TemplateType)} />{message('template_type')}</div>
              </div>
              <fieldset className="space-y-3"><legend className="text-sm font-semibold">Working days *</legend><p className="text-xs text-muted-foreground">Choose the days your team normally works. You’ll assign shifts in the next section.</p><div className="flex flex-wrap gap-2">{weekdays.map(day => <label key={day} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm capitalize ${draft.working_days.includes(day) ? 'border-brand-200 bg-brand-100 text-brand-900' : 'border-gray-200 text-gray-600'}`}><input type="checkbox" checked={draft.working_days.includes(day)} onChange={event => set('working_days', weekdays.filter(value => value === day ? event.target.checked : draft.working_days.includes(value)))} className="accent-[#1E1B4B]" />{day.slice(0, 3)}</label>)}</div>{message('working_days')}
                {!readOnly && <div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => set('working_days', weekdays.slice(0, 5))}>Mon–Fri</Button><Button type="button" size="sm" variant="outline" onClick={() => set('working_days', [...weekdays])}>Every day</Button></div>}
              </fieldset>
              <div className="space-y-4 border-t pt-4">
                <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 accent-[#1E1B4B]" checked={draft.is_active} onChange={event => set('is_active', event.target.checked)} /><span><span className="block font-medium">Active template</span><span className="text-xs text-muted-foreground">Make this template available for roster planning.</span></span></label>
                <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 accent-[#1E1B4B]" checked={draft.auto_generate} onChange={event => set('auto_generate', event.target.checked)} /><span><span className="block font-medium">Auto generate</span><span className="text-xs text-muted-foreground">Enable automatic roster generation for this template.</span></span></label>
              </div>
            </div>
            <div role="tabpanel" id="roster-panel-1" aria-labelledby="roster-tab-1" hidden={tab !== 1} className="space-y-4">
              <div><h3 className="text-sm font-semibold">Build your shift sequence</h3><p className="mt-1 text-xs text-muted-foreground">Rows run in order. Add repeated weekdays when your pattern spans multiple weeks. Changing working days won’t overwrite this sequence.</p></div>
              {!readOnly && <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => set('pattern_data', [...draft.pattern_data, ...draft.working_days.map(day => ({ day, shift_id: null, is_off: false }))])} disabled={!draft.working_days.length || draft.pattern_data.length + draft.working_days.length > (draft.template_type === 'weekly' ? 7 : 14)}>Add working days</Button><Button type="button" size="sm" variant="outline" disabled={draft.pattern_data.length >= (draft.template_type === 'weekly' ? 7 : 14)} onClick={() => set('pattern_data', [...draft.pattern_data, { day: weekdays[draft.pattern_data.length % 7], shift_id: null, is_off: false }])}><Plus className="mr-1 h-4 w-4" />Add day</Button></div><div className="grid min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><SearchableSelect aria-label="Shift to apply to working rows" allowAll={false} widthClass="w-full" options={shiftOptions} value={bulkShift} placeholder="Choose a shift for working rows" disabled={saving || shifts.isPending || shifts.isError} onChange={setBulkShift} /><Button type="button" variant="outline" size="sm" disabled={!bulkShift || !draft.pattern_data.some(row => !row.is_off)} onClick={() => set('pattern_data', draft.pattern_data.map(row => row.is_off ? row : { ...row, shift_id: bulkShift }))}>Apply to working rows</Button></div><p className="text-xs text-muted-foreground">Apply replaces shifts in working rows and keeps days off unchanged.</p></div>}
              {shifts.isPending && <AppLoader variant="inline" label="Loading shifts…" />}
              {shifts.isError && <ApiErrorState error={shifts.error} onRetry={() => void shifts.refetch()} />}
              {message('pattern_data')}
              {!draft.pattern_data.length ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{readOnly ? 'No pattern days configured.' : 'Add your working days to begin, then choose their shifts.'}</div> : <div className="space-y-3">{draft.pattern_data.map((row, index) => <div key={index} className="rounded-lg border border-gray-200 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Day {index + 1}</span>{!readOnly && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600" aria-label={`Remove pattern day ${index + 1}`} onClick={() => set('pattern_data', draft.pattern_data.filter((_, position) => position !== index))}><Trash2 className="h-4 w-4" /></Button>}</div><div className="grid items-end gap-3 sm:grid-cols-[minmax(0,170px)_minmax(0,1fr)_auto]"><div className="min-w-0 space-y-1.5"><Label htmlFor={`roster-day-${index}`}>Weekday</Label><SearchableSelect id={`roster-day-${index}`} allowAll={false} widthClass="w-full" value={row.day} disabled={readOnly || saving} options={weekdays.map(day => ({ value: day, label: day.charAt(0).toUpperCase() + day.slice(1) }))} onChange={value => updateRow(index, { day: value as Weekday })} /></div><div className="min-w-0 space-y-1.5"><Label htmlFor={`roster-shift-${index}`}>{row.is_off ? 'Shift (day off)' : 'Shift *'}</Label><SearchableSelect id={`roster-shift-${index}`} allowAll={false} widthClass="w-full" disabled={readOnly || saving || row.is_off || shifts.isPending || shifts.isError} value={row.shift_id == null ? '' : String(row.shift_id)} placeholder={row.is_off ? 'No shift needed' : 'Choose a shift'} options={shiftOptions} onChange={value => updateRow(index, { shift_id: value, is_off: false })} /></div><label className="flex h-10 items-center gap-2 whitespace-nowrap text-sm"><input type="checkbox" className="accent-[#1E1B4B]" checked={row.is_off} onChange={event => updateRow(index, { is_off: event.target.checked, shift_id: null })} />Day off</label></div></div>)}</div>}
              <p className="text-xs text-muted-foreground">{draft.pattern_data.length} pattern days · {draft.pattern_data.filter(row => !row.is_off).length} working · {draft.pattern_data.filter(row => row.is_off).length} off</p>
            </div>
          </fieldset>
        </div>
        <DialogFooter className="shrink-0 items-center gap-3 border-t bg-muted/30 px-6 py-4 sm:justify-between"><span className="text-xs text-muted-foreground">Section {tab + 1} of 2{!readOnly && ' · * Required'}</span><div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>{tab === 1 && <Button type="button" variant="outline" disabled={saving} onClick={() => setTab(0)}>Back</Button>}{tab === 0 ? <Button type="button" disabled={saving} className="bg-brand-900 hover:bg-brand-800" onClick={() => { if (readOnly || validateDetails()) setTab(1); }}>Next: shift pattern</Button> : !readOnly && <Button type="submit" disabled={saving} className="bg-brand-900 hover:bg-brand-800">{saving ? <AppLoader variant="inline" label="Saving…" /> : mode === 'create' ? 'Create template' : 'Save changes'}</Button>}</div></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
