"use client";

/**
 * FlexiDesk settings — categories and sub-categories (flexidesk.settings.manage).
 *
 * Employees only ever see ACTIVE categories, so turning one off hides it from the new-ticket form without touching its history.
 * A category or sub-category that tickets already use cannot be deleted (the API says so); switch it off instead.
 * A sub-category's default resolver is a person of this company, chosen by name search.
 */

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { flattenFieldErrors, parseApiError } from "@/lib/flexi-desk";
import type { AdminCategory, AdminSubCategory, Priority } from "@/types/flexi-desk.types";
import { Field, SettingsShell, fieldInput, primaryButton, secondaryButton } from "@/components/flexi-desk/SettingsParts";

const PRIORITIES: Priority[] = ["low", "normal", "high", "critical"];

function useSaveFeedback() {
  const [error, setError] = React.useState<string | null>(null);
  const [fields, setFields] = React.useState<Record<string, string>>({});
  const fail = (err: unknown) => {
    const parsed = parseApiError(err);
    setFields(flattenFieldErrors(parsed?.field_errors));
    setError(parsed?.message ?? "That did not work. Please try again.");
  };
  const clear = () => {
    setError(null);
    setFields({});
  };

  return { error, fields, fail, clear };
}

function CategoryForm({ category, onDone }: { category?: AdminCategory; onDone: () => void }) {
  const queryClient = useQueryClient();
  const feedback = useSaveFeedback();
  const [name, setName] = React.useState(category?.name ?? "");
  const [priority, setPriority] = React.useState<Priority>(category?.default_priority ?? "normal");
  const [active, setActive] = React.useState(category?.is_active ?? true);

  const save = useMutation({
    mutationFn: () => flexiDeskService.saveAdminCategory(category?.uuid ?? null, { name: name.trim(), default_priority: priority, is_active: active }),
    onSuccess: () => {
      feedback.clear();
      queryClient.invalidateQueries({ queryKey: [...flexiDeskKeys.all, "admin"] });
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.categories() });
      if (!category) setName("");
      onDone();
    },
    onError: feedback.fail,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto_auto] sm:items-end">
      <Field label="Category name" error={feedback.fields.name}>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required className={fieldInput} />
      </Field>
      <Field label="Default priority">
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={fieldInput}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>
      <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
      </label>
      <button type="submit" disabled={save.isPending || name.trim() === ""} className={primaryButton}>{save.isPending ? "Saving…" : category ? "Save" : "Add category"}</button>
      {feedback.error && !feedback.fields.name && <p role="alert" className="text-sm text-red-700 sm:col-span-4">{feedback.error}</p>}
    </form>
  );
}

function ResolverPicker({ value, valueName, onPick }: { value: string | null; valueName: string | null; onPick: (uuid: string | null, name: string | null) => void }) {
  const [term, setTerm] = React.useState("");
  const results = useQuery({
    queryKey: flexiDeskKeys.routingTargets(term),
    queryFn: () => flexiDeskService.getRoutingTargets(term),
    enabled: term.trim().length >= 2,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">Default resolver</p>
      <p className="text-sm text-gray-900">
        {value ? valueName ?? "Assigned" : "Nobody (the ticket goes to the unassigned queue)"}
        {value && <button type="button" onClick={() => onPick(null, null)} className="ml-2 text-xs text-gray-500 underline">Clear</button>}
      </p>
      <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search a person by name…" aria-label="Search for a default resolver" className={fieldInput} />
      {term.trim().length >= 2 && (
        <ul className="max-h-36 overflow-auto rounded-lg border border-gray-200 bg-white text-sm">
          {results.isPending ? <li className="px-3 py-2 text-gray-500">Searching…</li> : (results.data?.users ?? []).length === 0 ? <li className="px-3 py-2 text-gray-500">No matches.</li> : (
            results.data!.users.map((u) => (
              <li key={u.uuid}><button type="button" onClick={() => { onPick(u.uuid, u.name); setTerm(""); }} className="block w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">{u.name}</button></li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function SubCategoryForm({ categoryUuid, sub, onDone }: { categoryUuid: string; sub?: AdminSubCategory; onDone: () => void }) {
  const queryClient = useQueryClient();
  const feedback = useSaveFeedback();
  const [name, setName] = React.useState(sub?.name ?? "");
  const [active, setActive] = React.useState(sub?.is_active ?? true);
  const [resolver, setResolver] = React.useState<{ uuid: string | null; name: string | null }>({ uuid: sub?.default_resolver_uuid ?? null, name: sub?.default_resolver_name ?? null });

  const save = useMutation({
    mutationFn: () => flexiDeskService.saveAdminSubCategory(sub?.uuid ?? null, { category_uuid: categoryUuid, name: name.trim(), default_resolver_uuid: resolver.uuid, is_active: active }),
    onSuccess: () => {
      feedback.clear();
      queryClient.invalidateQueries({ queryKey: [...flexiDeskKeys.all, "admin"] });
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.categories() });
      if (!sub) {
        setName("");
        setResolver({ uuid: null, name: null });
      }
      onDone();
    },
    onError: feedback.fail,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2">
      <Field label="Sub-category name" error={feedback.fields.name}>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required className={fieldInput} />
      </Field>
      <ResolverPicker value={resolver.uuid} valueName={resolver.name} onPick={(uuid, n) => setResolver({ uuid, name: n })} />
      {feedback.fields.default_resolver_uuid && <p role="alert" className="text-xs text-red-700 sm:col-span-2">{feedback.fields.default_resolver_uuid}</p>}
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active</label>
      <div className="flex items-center justify-end gap-2">
        {feedback.error && !feedback.fields.name && !feedback.fields.default_resolver_uuid && <p role="alert" className="mr-auto text-sm text-red-700">{feedback.error}</p>}
        <button type="button" onClick={onDone} className={secondaryButton}>Cancel</button>
        <button type="submit" disabled={save.isPending || name.trim() === ""} className={primaryButton}>{save.isPending ? "Saving…" : sub ? "Save" : "Add sub-category"}</button>
      </div>
    </form>
  );
}

function CategoryCard({ category, subs }: { category: AdminCategory; subs: AdminSubCategory[] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [editingSub, setEditingSub] = React.useState<string | "new" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [...flexiDeskKeys.all, "admin"] });
    queryClient.invalidateQueries({ queryKey: flexiDeskKeys.categories() });
  };
  const fail = (err: unknown) => setError(parseApiError(err)?.message ?? "That did not work. Please try again.");
  const removeCategory = useMutation({ mutationFn: () => flexiDeskService.deleteAdminCategory(category.uuid), onSuccess: refresh, onError: fail });
  const removeSub = useMutation({ mutationFn: (uuid: string) => flexiDeskService.deleteAdminSubCategory(uuid), onSuccess: refresh, onError: fail });

  return (
    <li className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      {editing ? (
        <div className="space-y-2">
          <CategoryForm category={category} onDone={() => setEditing(false)} />
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-500 underline">Cancel</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900">{category.name} {!category.is_active && <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-600">Hidden from employees</span>}</h3>
            <p className="text-xs text-gray-500">Default priority: {category.default_priority}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className={secondaryButton}>Edit</button>
            <button type="button" disabled={removeCategory.isPending} onClick={() => { if (window.confirm(`Delete “${category.name}”? This cannot be undone.`)) removeCategory.mutate(); }} className={secondaryButton}>Delete</button>
          </div>
        </div>
      )}

      <ul className="space-y-2 border-t border-gray-100 pt-3">
        {subs.map((s) => (
          <li key={s.uuid}>
            {editingSub === s.uuid ? (
              <SubCategoryForm categoryUuid={category.uuid} sub={s} onDone={() => setEditingSub(null)} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-gray-800">{s.name} {!s.is_active && <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">Off</span>}
                  <span className="ml-2 text-xs text-gray-500">{s.default_resolver_uuid ? `Resolver: ${s.default_resolver_name ?? "assigned"}` : "No default resolver"}</span></span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => setEditingSub(s.uuid)} className="text-xs text-gray-600 underline">Edit</button>
                  <button type="button" disabled={removeSub.isPending} onClick={() => { if (window.confirm(`Delete “${s.name}”?`)) removeSub.mutate(s.uuid); }} className="text-xs text-gray-600 underline">Delete</button>
                </span>
              </div>
            )}
          </li>
        ))}
        {subs.length === 0 && <li className="text-xs text-gray-500">No sub-categories.</li>}
      </ul>
      {editingSub === "new" ? (
        <SubCategoryForm categoryUuid={category.uuid} onDone={() => setEditingSub(null)} />
      ) : (
        <button type="button" onClick={() => setEditingSub("new")} className="text-xs text-indigo-700 underline">Add a sub-category</button>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</p>}
    </li>
  );
}

export default function CategorySettingsPage() {
  const categories = useQuery({ queryKey: flexiDeskKeys.adminCategories(), queryFn: flexiDeskService.listAdminCategories, retry: false });
  const subs = useQuery({ queryKey: flexiDeskKeys.adminSubCategories(), queryFn: flexiDeskService.listAdminSubCategories, retry: false });

  const failed = categories.isError || subs.isError;

  return (
    <SettingsShell title="Categories" intro="What employees can raise a ticket about. Switch a category off to hide it from the new-ticket form without losing its history.">
      <section aria-labelledby="add-category" className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 id="add-category" className="text-sm font-medium text-gray-900">New category</h2>
        <CategoryForm onDone={() => undefined} />
      </section>

      {failed ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Could not load the categories. You may not have permission to manage settings.</p>
      ) : categories.isPending || subs.isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (categories.data ?? []).length === 0 ? (
        <p className="text-sm text-gray-500">No categories yet. Add the first one above.</p>
      ) : (
        <ul className="space-y-3">
          {(categories.data ?? []).map((c) => (
            <CategoryCard key={c.uuid} category={c} subs={(subs.data ?? []).filter((s) => s.category_uuid === c.uuid)} />
          ))}
        </ul>
      )}
    </SettingsShell>
  );
}
