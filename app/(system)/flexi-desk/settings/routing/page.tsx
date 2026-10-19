"use client";

/**
 * FlexiDesk settings — routing rules (flexidesk.settings.manage).
 *
 * Rules are checked from the top; the FIRST active rule whose conditions ALL match decides where a ticket goes, so the
 * order on this screen is the order of evaluation. Drag a rule (or use the arrows) to reorder: the whole list is saved in
 * one step, so the order is never half-changed. A rule needs at least one thing to match and exactly one target.
 */

import React from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { flattenFieldErrors, moveItem, parseApiError, parseKeywords, routingRuleSummary, validateRoutingRuleForm, type RoutingLookups, type RoutingRuleFormInput } from "@/lib/flexi-desk";
import type { AdminCategory, AdminSubCategory, Priority, RoutingRule, RoutingTargets } from "@/types/flexi-desk.types";
import { Field, SettingsShell, fieldInput, primaryButton, secondaryButton } from "@/components/flexi-desk/SettingsParts";

const PRIORITIES: Priority[] = ["low", "normal", "high", "critical"];

const emptyForm: RoutingRuleFormInput = {
  rule_name: "", match_category_uuid: "", match_sub_category_uuid: "", match_department_id: "", match_branch_uuid: "",
  match_priority: "", match_keywords: "", assign_to_user_uuid: "", assign_to_department_id: "",
};

function toForm(rule: RoutingRule): RoutingRuleFormInput {
  return {
    rule_name: rule.rule_name,
    match_category_uuid: rule.match_category_uuid ?? "",
    match_sub_category_uuid: rule.match_sub_category_uuid ?? "",
    match_department_id: rule.match_department_id ? String(rule.match_department_id) : "",
    match_branch_uuid: rule.match_branch_uuid ?? "",
    match_priority: rule.match_priority ?? "",
    match_keywords: (rule.match_keywords ?? []).join(", "),
    assign_to_user_uuid: rule.assign_to_user_uuid ?? "",
    assign_to_department_id: rule.assign_to_department_id ? String(rule.assign_to_department_id) : "",
  };
}

function RuleForm({ rule, rules, categories, subCategories, targets, onDone }: {
  rule?: RoutingRule; rules: RoutingRule[]; categories: AdminCategory[]; subCategories: AdminSubCategory[]; targets: RoutingTargets | undefined; onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<RoutingRuleFormInput>(rule ? toForm(rule) : emptyForm);
  const [override, setOverride] = React.useState<string>(rule?.priority_override ?? "");
  const [active, setActive] = React.useState(rule?.is_active ?? true);
  const [targetKind, setTargetKind] = React.useState<"user" | "department">(rule?.assign_to_department_id ? "department" : "user");
  const [person, setPerson] = React.useState<{ uuid: string; name: string } | null>(rule?.assign_to_user_uuid ? { uuid: rule.assign_to_user_uuid, name: rule.assign_to_user_name ?? "Assigned person" } : null);
  const [term, setTerm] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  const set = (patch: Partial<RoutingRuleFormInput>) => setForm((f) => ({ ...f, ...patch }));
  const people = useQuery({ queryKey: flexiDeskKeys.routingTargets(term), queryFn: () => flexiDeskService.getRoutingTargets(term), enabled: term.trim().length >= 2, staleTime: 30_000 });
  const subsOfCategory = subCategories.filter((s) => s.is_active && s.category_uuid === form.match_category_uuid);

  const save = useMutation({
    mutationFn: () => {
      const nextSort = rule ? rule.sort_order : Math.max(0, ...rules.map((r) => r.sort_order)) + 10;

      return flexiDeskService.saveRoutingRule(rule?.uuid ?? null, {
        rule_name: form.rule_name.trim(),
        match_category_uuid: form.match_category_uuid || null,
        match_sub_category_uuid: form.match_sub_category_uuid || null,
        match_department_id: form.match_department_id ? Number(form.match_department_id) : null,
        match_branch_uuid: form.match_branch_uuid || null,
        match_priority: (form.match_priority || null) as Priority | null,
        match_keywords: parseKeywords(form.match_keywords),
        assign_to_user_uuid: form.assign_to_user_uuid || null,
        assign_to_department_id: form.assign_to_department_id ? Number(form.assign_to_department_id) : null,
        priority_override: (override || null) as Priority | null,
        is_active: active,
        sort_order: nextSort,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.adminRules() });
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
    const found = validateRoutingRuleForm(form);
    setErrors(found);
    setError(null);
    if (Object.keys(found).length === 0) save.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4" aria-label={rule ? "Edit routing rule" : "New routing rule"}>
      <Field label="Rule name" error={errors.rule_name}>
        <input value={form.rule_name} onChange={(e) => set({ rule_name: e.target.value })} maxLength={150} className={fieldInput} />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900">When a ticket matches ALL of these</legend>
        {errors.match_category_uuid && <p role="alert" className="text-xs text-red-700">{errors.match_category_uuid}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <select value={form.match_category_uuid} onChange={(e) => set({ match_category_uuid: e.target.value, match_sub_category_uuid: "" })} className={fieldInput}>
              <option value="">Any</option>
              {categories.filter((c) => c.is_active || c.uuid === form.match_category_uuid).map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Sub-category" hint={form.match_category_uuid ? undefined : "Choose a category first."}>
            <select value={form.match_sub_category_uuid} disabled={!form.match_category_uuid} onChange={(e) => set({ match_sub_category_uuid: e.target.value })} className={fieldInput}>
              <option value="">Any</option>
              {subsOfCategory.map((s) => <option key={s.uuid} value={s.uuid}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Requester's department">
            <select value={form.match_department_id} onChange={(e) => set({ match_department_id: e.target.value })} className={fieldInput}>
              <option value="">Any</option>
              {(targets?.departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Requester's branch">
            <select value={form.match_branch_uuid} onChange={(e) => set({ match_branch_uuid: e.target.value })} className={fieldInput}>
              <option value="">Any</option>
              {(targets?.branches ?? []).map((b) => <option key={b.uuid} value={b.uuid}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.match_priority} onChange={(e) => set({ match_priority: e.target.value })} className={fieldInput}>
              <option value="">Any</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Keywords (comma separated; any one matches)" error={errors.match_keywords} hint="Looked for in the subject and description.">
            <input value={form.match_keywords} onChange={(e) => set({ match_keywords: e.target.value })} className={fieldInput} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900">Then</legend>
        <div className="flex gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-1.5"><input type="radio" name="target-kind" checked={targetKind === "user"} onChange={() => { setTargetKind("user"); set({ assign_to_department_id: "" }); }} /> Assign to a person</label>
          <label className="flex items-center gap-1.5"><input type="radio" name="target-kind" checked={targetKind === "department"} onChange={() => { setTargetKind("department"); set({ assign_to_user_uuid: "" }); setPerson(null); }} /> Send to a department</label>
        </div>
        {errors.assign_to_user_uuid && <p role="alert" className="text-xs text-red-700">{errors.assign_to_user_uuid}</p>}
        {errors.assign_to_department_id && <p role="alert" className="text-xs text-red-700">{errors.assign_to_department_id}</p>}

        {targetKind === "user" ? (
          <div className="space-y-1">
            <p className="text-sm text-gray-900">{person ? person.name : "Nobody chosen yet"}</p>
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search a person by name…" aria-label="Search for a person to assign to" className={fieldInput} />
            {term.trim().length >= 2 && (
              <ul className="max-h-36 overflow-auto rounded-lg border border-gray-200 bg-white text-sm">
                {people.isPending ? <li className="px-3 py-2 text-gray-500">Searching…</li> : (people.data?.users ?? []).length === 0 ? <li className="px-3 py-2 text-gray-500">No matches.</li> : (
                  people.data!.users.map((u) => (
                    <li key={u.uuid}><button type="button" onClick={() => { setPerson(u); set({ assign_to_user_uuid: u.uuid }); setTerm(""); }} className="block w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">{u.name}</button></li>
                  ))
                )}
              </ul>
            )}
          </div>
        ) : (
          <Field label="Department">
            <select value={form.assign_to_department_id} onChange={(e) => set({ assign_to_department_id: e.target.value })} className={fieldInput}>
              <option value="">Choose a department</option>
              {(targets?.departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Also change the priority to (optional)">
          <select value={override} onChange={(e) => setOverride(e.target.value)} className={fieldInput}>
            <option value="">Keep the ticket&apos;s priority</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active (an inactive rule is skipped but keeps its place)</label>

      {error && Object.keys(errors).length === 0 && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={secondaryButton}>Cancel</button>
        <button type="submit" disabled={save.isPending} className={primaryButton}>{save.isPending ? "Saving…" : rule ? "Save rule" : "Add rule"}</button>
      </div>
    </form>
  );
}

function SortableRule({ rule, position, total, lookups, busy, onEdit, onDelete, onMove }: {
  rule: RoutingRule; position: number; total: number; lookups: RoutingLookups; busy: boolean; onEdit: () => void; onDelete: () => void; onMove: (delta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.uuid });
  const summary = routingRuleSummary(rule, lookups);

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-start gap-3 rounded-lg border bg-white p-3 ${isDragging ? "border-indigo-400 shadow-md" : "border-gray-200"} ${rule.is_active ? "" : "opacity-70"}`}>
      <button type="button" {...attributes} {...listeners} aria-label={`Drag to reorder ${rule.rule_name}`} className="mt-0.5 cursor-grab rounded px-1 text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">⋮⋮</button>
      <span className="mt-0.5 w-6 text-right text-xs font-medium text-gray-500" aria-label={`Position ${position} of ${total}`}>{position}</span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-gray-900">{rule.rule_name} {!rule.is_active && <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-600">Off</span>}</p>
        <p className="text-gray-600"><span className="text-xs uppercase tracking-wide text-gray-400">When </span>{summary.when}</p>
        <p className="text-gray-600"><span className="text-xs uppercase tracking-wide text-gray-400">Then </span>{summary.then}</p>
        {rule.assign_to_user_uuid && rule.assign_to_user_can_work === false && (
          <p role="note" className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
            {rule.assign_to_user_name ?? "This person"} cannot work tickets, so this rule no longer assigns anything: its tickets wait in the unassigned queue and HR is alerted. Choose someone who can resolve tickets.
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs">
        <button type="button" disabled={busy || position === 1} onClick={() => onMove(-1)} aria-label={`Move ${rule.rule_name} up`} className="rounded border border-gray-300 px-1.5 py-0.5 disabled:opacity-40">↑</button>
        <button type="button" disabled={busy || position === total} onClick={() => onMove(1)} aria-label={`Move ${rule.rule_name} down`} className="rounded border border-gray-300 px-1.5 py-0.5 disabled:opacity-40">↓</button>
        <button type="button" onClick={onEdit} className="ml-2 text-gray-600 underline">Edit</button>
        <button type="button" onClick={onDelete} className="text-gray-600 underline">Delete</button>
      </div>
    </li>
  );
}

export default function RoutingSettingsPage() {
  const queryClient = useQueryClient();
  const rulesQuery = useQuery({ queryKey: flexiDeskKeys.adminRules(), queryFn: flexiDeskService.listRoutingRules, retry: false });
  const categoriesQuery = useQuery({ queryKey: flexiDeskKeys.adminCategories(), queryFn: flexiDeskService.listAdminCategories, retry: false });
  const subsQuery = useQuery({ queryKey: flexiDeskKeys.adminSubCategories(), queryFn: flexiDeskService.listAdminSubCategories, retry: false });
  const targetsQuery = useQuery({ queryKey: flexiDeskKeys.routingTargets(""), queryFn: () => flexiDeskService.getRoutingTargets(""), retry: false, staleTime: 60_000 });

  const [editing, setEditing] = React.useState<string | "new" | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const rules = React.useMemo(() => rulesQuery.data ?? [], [rulesQuery.data]);
  const categories = React.useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const subs = React.useMemo(() => subsQuery.data ?? [], [subsQuery.data]);

  const lookups: RoutingLookups = React.useMemo(() => ({
    categories: Object.fromEntries(categories.map((c) => [c.uuid, c.name])),
    subCategories: Object.fromEntries(subs.map((s) => [s.uuid, s.name])),
    departments: Object.fromEntries((targetsQuery.data?.departments ?? []).map((d) => [String(d.id), d.name])),
    branches: Object.fromEntries((targetsQuery.data?.branches ?? []).map((b) => [b.uuid, b.name])),
    users: Object.fromEntries(rules.filter((r) => r.assign_to_user_uuid && r.assign_to_user_name).map((r) => [r.assign_to_user_uuid!, r.assign_to_user_name!])),
  }), [categories, subs, targetsQuery.data, rules]);

  const reorder = useMutation({
    mutationFn: (order: string[]) => flexiDeskService.reorderRoutingRules(order),
    onMutate: async (order) => {
      setError(null);
      setMessage(null);
      await queryClient.cancelQueries({ queryKey: flexiDeskKeys.adminRules() });
      const previous = queryClient.getQueryData<RoutingRule[]>(flexiDeskKeys.adminRules());
      if (previous) {
        const byUuid = new Map(previous.map((r) => [r.uuid, r]));
        queryClient.setQueryData(flexiDeskKeys.adminRules(), order.map((u) => byUuid.get(u)!).filter(Boolean));
      }

      return { previous };
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(flexiDeskKeys.adminRules(), saved);
      setMessage("Order saved.");
    },
    onError: (err, _order, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(flexiDeskKeys.adminRules(), ctx.previous);
      setError(parseApiError(err)?.message ?? "The order could not be saved. It has been put back as it was.");
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.adminRules() });
    },
  });

  const remove = useMutation({
    mutationFn: (uuid: string) => flexiDeskService.deleteRoutingRule(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: flexiDeskKeys.adminRules() }),
    onError: (err) => setError(parseApiError(err)?.message ?? "That did not work. Please try again."),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const commit = (next: RoutingRule[]) => reorder.mutate(next.map((r) => r.uuid));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = rules.findIndex((r) => r.uuid === e.active.id);
    const to = rules.findIndex((r) => r.uuid === e.over!.id);
    if (from >= 0 && to >= 0) commit(moveItem(rules, from, to));
  };

  const failed = rulesQuery.isError;

  return (
    <SettingsShell title="Routing rules" intro="Decide who a new ticket goes to. Rules are checked from the top and the first matching active rule wins. If none match, the sub-category's default resolver is used, then the unassigned queue.">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">{rules.length} {rules.length === 1 ? "rule" : "rules"}</h2>
        {editing !== "new" && <button type="button" onClick={() => setEditing("new")} className={primaryButton}>New rule</button>}
      </div>

      {editing === "new" && <RuleForm rules={rules} categories={categories} subCategories={subs} targets={targetsQuery.data} onDone={() => setEditing(null)} />}

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}

      {failed ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Could not load the routing rules. You may not have permission to manage settings.</p>
      ) : rulesQuery.isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="text-sm text-gray-500">No rules yet. Tickets go to the sub-category&apos;s default resolver, otherwise the unassigned queue.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rules.map((r) => r.uuid)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2" aria-label="Routing rules in the order they are checked">
              {rules.map((r, i) => (
                <React.Fragment key={r.uuid}>
                  {editing === r.uuid ? (
                    <li><RuleForm rule={r} rules={rules} categories={categories} subCategories={subs} targets={targetsQuery.data} onDone={() => setEditing(null)} /></li>
                  ) : (
                    <SortableRule rule={r} position={i + 1} total={rules.length} lookups={lookups} busy={reorder.isPending} onEdit={() => setEditing(r.uuid)}
                      onDelete={() => { if (window.confirm(`Delete the rule “${r.rule_name}”?`)) remove.mutate(r.uuid); }} onMove={(d) => commit(moveItem(rules, i, i + d))} />
                  )}
                </React.Fragment>
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </SettingsShell>
  );
}
