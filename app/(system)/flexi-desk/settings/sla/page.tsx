"use client";

/**
 * FlexiDesk settings — SLA targets (flexidesk.settings.manage).
 *
 * One SLA per category and priority; a row with no category is the company default for that priority. Resolution must
 * be longer than the first response. "Working hours only" means the clock stops outside the working days and hours (and,
 * if chosen, on public holidays) — the screen says exactly when it runs so nobody has to guess.
 */

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { flattenFieldErrors, parseApiError, slaCoverageLabel, validateSlaForm, type SlaFormErrors } from "@/lib/flexi-desk";
import type { AdminCategory, Priority, SlaConfig } from "@/types/flexi-desk.types";
import { Field, SettingsShell, fieldInput, primaryButton, secondaryButton } from "@/components/flexi-desk/SettingsParts";

const PRIORITIES: Priority[] = ["low", "normal", "high", "critical"];
const DAYS = [
  { n: 1, label: "Mon" }, { n: 2, label: "Tue" }, { n: 3, label: "Wed" }, { n: 4, label: "Thu" }, { n: 5, label: "Fri" }, { n: 6, label: "Sat" }, { n: 7, label: "Sun" },
];

type FormState = {
  category_uuid: string;
  name: string;
  priority: Priority;
  response_hours: string;
  resolution_hours: string;
  warning_at_percent: string;
  auto_escalate: boolean;
  working_hours_only: boolean;
  working_days: number[];
  workday_start: string;
  workday_end: string;
  timezone: string;
  holiday_provider: boolean;
  is_active: boolean;
};

const blank: FormState = {
  category_uuid: "", name: "", priority: "normal", response_hours: "4", resolution_hours: "16", warning_at_percent: "80", auto_escalate: true,
  working_hours_only: true, working_days: [1, 2, 3, 4, 5], workday_start: "09:00", workday_end: "18:00", timezone: "Asia/Karachi", holiday_provider: false, is_active: true,
};

function fromSla(s: SlaConfig): FormState {
  return {
    category_uuid: s.category_uuid ?? "", name: s.name, priority: s.priority, response_hours: String(s.response_hours), resolution_hours: String(s.resolution_hours),
    warning_at_percent: String(s.warning_at_percent), auto_escalate: s.auto_escalate, working_hours_only: s.working_hours_only, working_days: s.working_days,
    workday_start: s.workday_start, workday_end: s.workday_end, timezone: s.timezone, holiday_provider: !!s.holiday_provider, is_active: s.is_active,
  };
}

function SlaForm({ sla, categories, onDone }: { sla?: SlaConfig; categories: AdminCategory[]; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [f, setF] = React.useState<FormState>(sla ? fromSla(sla) : blank);
  const [errors, setErrors] = React.useState<SlaFormErrors & Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const set = (patch: Partial<FormState>) => setF((s) => ({ ...s, ...patch }));

  const numbers = { response_hours: Number(f.response_hours), resolution_hours: Number(f.resolution_hours), warning_at_percent: Number(f.warning_at_percent) };
  const coverage = slaCoverageLabel({ working_hours_only: f.working_hours_only, working_days: f.working_days, workday_start: f.workday_start, workday_end: f.workday_end, timezone: f.timezone, holiday_provider: f.holiday_provider ? "leave_ease" : null });

  const save = useMutation({
    mutationFn: () => flexiDeskService.saveSlaConfig(sla?.uuid ?? null, {
      category_uuid: f.category_uuid || null,
      name: f.name.trim(),
      priority: f.priority,
      ...numbers,
      auto_escalate: f.auto_escalate,
      working_hours_only: f.working_hours_only,
      working_days: [...f.working_days].sort((a, b) => a - b),
      workday_start: f.workday_start,
      workday_end: f.workday_end,
      timezone: f.timezone.trim(),
      holiday_provider: f.holiday_provider ? "leave_ease" : null,
      is_active: f.is_active,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.adminSla() });
      onDone();
    },
    onError: (err) => {
      const parsed = parseApiError(err);
      setErrors(flattenFieldErrors(parsed?.field_errors));
      setError(parsed?.message ?? "That did not work. Please try again.");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateSlaForm({ name: f.name, ...numbers, working_hours_only: f.working_hours_only, working_days: f.working_days, workday_start: f.workday_start, workday_end: f.workday_end });
    setErrors(found);
    setError(null);
    if (Object.keys(found).length === 0) save.mutate();
  };

  const toggleDay = (n: number) => set({ working_days: f.working_days.includes(n) ? f.working_days.filter((d) => d !== n) : [...f.working_days, n] });

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4" aria-label={sla ? "Edit SLA" : "New SLA"}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" error={errors.name}><input value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={100} className={fieldInput} /></Field>
        <Field label="Applies to" error={errors.category_uuid}>
          <select value={f.category_uuid} onChange={(e) => set({ category_uuid: e.target.value })} className={fieldInput}>
            <option value="">Every category (company default)</option>
            {categories.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Priority" error={errors.priority}>
          <select value={f.priority} onChange={(e) => set({ priority: e.target.value as Priority })} className={fieldInput}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="First response within (hours)" error={errors.response_hours}><input type="number" min={1} value={f.response_hours} onChange={(e) => set({ response_hours: e.target.value })} className={fieldInput} /></Field>
        <Field label="Resolved within (hours)" error={errors.resolution_hours} hint="Must be longer than the response time."><input type="number" min={1} value={f.resolution_hours} onChange={(e) => set({ resolution_hours: e.target.value })} className={fieldInput} /></Field>
        <Field label="Warn at (% of the time used)" error={errors.warning_at_percent} hint="The resolver is warned at this point; auto-escalation triggers at a breach."><input type="number" min={1} max={99} value={f.warning_at_percent} onChange={(e) => set({ warning_at_percent: e.target.value })} className={fieldInput} /></Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={f.auto_escalate} onChange={(e) => set({ auto_escalate: e.target.checked })} /> Escalate automatically when the SLA is breached</label>
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={f.working_hours_only} onChange={(e) => set({ working_hours_only: e.target.checked })} /> Count working hours only</label>

      {f.working_hours_only && (
        <fieldset className="space-y-3 rounded-lg bg-white p-3">
          <legend className="px-1 text-xs text-gray-500">Working time</legend>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Working days">
            {DAYS.map((d) => (
              <label key={d.n} className="flex items-center gap-1 text-sm text-gray-700"><input type="checkbox" checked={f.working_days.includes(d.n)} onChange={() => toggleDay(d.n)} /> {d.label}</label>
            ))}
          </div>
          {errors.working_days && <p role="alert" className="text-xs text-red-700">{errors.working_days}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Starts"><input type="time" value={f.workday_start} onChange={(e) => set({ workday_start: e.target.value })} className={fieldInput} /></Field>
            <Field label="Ends" error={errors.workday_end}><input type="time" value={f.workday_end} onChange={(e) => set({ workday_end: e.target.value })} className={fieldInput} /></Field>
            <Field label="Time zone" error={errors.timezone}><input value={f.timezone} onChange={(e) => set({ timezone: e.target.value })} className={fieldInput} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={f.holiday_provider} onChange={(e) => set({ holiday_provider: e.target.checked })} /> Skip public holidays (from the LeaveEase calendar)</label>
        </fieldset>
      )}

      <p className="rounded-lg bg-white p-2 text-sm text-gray-700" aria-live="polite"><span className="font-medium">The clock: </span>{coverage}</p>

      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={f.is_active} onChange={(e) => set({ is_active: e.target.checked })} /> Active</label>
      {error && Object.keys(errors).length === 0 && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {errors.holiday_provider && <p role="alert" className="text-xs text-red-700">{errors.holiday_provider}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={secondaryButton}>Cancel</button>
        <button type="submit" disabled={save.isPending} className={primaryButton}>{save.isPending ? "Saving…" : sla ? "Save SLA" : "Add SLA"}</button>
      </div>
    </form>
  );
}

export default function SlaSettingsPage() {
  const queryClient = useQueryClient();
  const slaQuery = useQuery({ queryKey: flexiDeskKeys.adminSla(), queryFn: flexiDeskService.listSlaConfigs, retry: false });
  const categoriesQuery = useQuery({ queryKey: flexiDeskKeys.adminCategories(), queryFn: flexiDeskService.listAdminCategories, retry: false });
  const [editing, setEditing] = React.useState<string | "new" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const categories = React.useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const categoryName = (uuid: string | null) => (uuid ? categories.find((c) => c.uuid === uuid)?.name ?? "(removed category)" : "Every category");
  const rows = React.useMemo(() => [...(slaQuery.data ?? [])].sort((a, b) => categoryName(a.category_uuid).localeCompare(categoryName(b.category_uuid)) || PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slaQuery.data, categories]);

  const remove = useMutation({
    mutationFn: (uuid: string) => flexiDeskService.deleteSlaConfig(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: flexiDeskKeys.adminSla() }),
    onError: (err) => setError(parseApiError(err)?.message ?? "That did not work. Please try again."),
  });

  return (
    <SettingsShell title="SLA targets" intro="How fast tickets should get a first response and be resolved. A row with no category is the default for that priority; a category row overrides it.">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">{rows.length} {rows.length === 1 ? "target" : "targets"}</h2>
        {editing !== "new" && <button type="button" onClick={() => setEditing("new")} className={primaryButton}>New SLA</button>}
      </div>

      {editing === "new" && <SlaForm categories={categories} onDone={() => setEditing(null)} />}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</p>}

      {slaQuery.isError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Could not load the SLA targets. You may not have permission to manage settings.</p>
      ) : slaQuery.isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No SLA targets yet. Tickets without one have no deadline.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((s) => (
            <li key={s.uuid}>
              {editing === s.uuid ? (
                <SlaForm sla={s} categories={categories} onDone={() => setEditing(null)} />
              ) : (
                <div className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 ${s.is_active ? "" : "opacity-70"}`}>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{s.name} {!s.is_active && <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-600">Off</span>}</p>
                    <p className="text-gray-600">{categoryName(s.category_uuid)} · {s.priority} priority</p>
                    <p className="text-gray-600">First response {s.response_hours}h · resolved {s.resolution_hours}h · warn at {s.warning_at_percent}%{s.auto_escalate ? " · escalates on breach" : ""}</p>
                    <p className="text-xs text-gray-500">{slaCoverageLabel(s)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditing(s.uuid)} className={secondaryButton}>Edit</button>
                    <button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(`Delete the SLA “${s.name}”?`)) remove.mutate(s.uuid); }} className={secondaryButton}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SettingsShell>
  );
}
