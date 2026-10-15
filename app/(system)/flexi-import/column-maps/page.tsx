"use client";

/**
 * app/(system)/flexi-import/column-maps/page.tsx
 * FlexiImport — Saved Column Mapping Templates.
 *
 * Lists saved column-mapping templates grouped by import_type.
 * Supports inline editing (Framer Motion expand/collapse), set-as-default,
 * and delete with a confirmation dialog.
 *
 * Access gate: bulk-import permission (enforced by layout.tsx).
 *
 * API surface:
 *   GET    /api/v1/flexi-import/column-maps
 *   GET    /api/v1/flexi-import/fields/{import_type}   (always-on, per type)
 *   PUT    /api/v1/flexi-import/column-maps/{id}
 *   POST   /api/v1/flexi-import/column-maps/{id}/set-default
 *   DELETE /api/v1/flexi-import/column-maps/{id}
 */

import { showApiError } from "@/lib/error-toast";
import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Edit2,
  Star,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ColumnMap {
  id: string;
  name: string;
  import_type: string;          // "employee" | "flexi_meta" | ...
  is_default: boolean;
  mapping: Record<string, string>; // csv_header → field_key
  last_used_at: string | null;
  created_at: string;
}

interface FieldDefinition {
  key: string;
  label: string;
  required?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const IMPORT_TYPE_GROUPS = [
  { key: "employees", label: "Employee Import" },
  { key: "flexi_meta_entities", label: "FlexiMeta Reference Data" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "Never used";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "Never used";
  }
}

function mappingToPairs(
  mapping: Record<string, string>
): Array<{ csvHeader: string; fieldKey: string }> {
  return Object.entries(mapping).map(([csvHeader, fieldKey]) => ({
    csvHeader,
    fieldKey,
  }));
}

function pairsToMapping(
  pairs: Array<{ csvHeader: string; fieldKey: string }>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { csvHeader, fieldKey } of pairs) {
    const trimmed = csvHeader.trim();
    if (trimmed) result[trimmed] = fieldKey;
  }
  return result;
}

// ── Edit state shape ──────────────────────────────────────────────────────────

interface EditDraft {
  name: string;
  pairs: Array<{ csvHeader: string; fieldKey: string }>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ColumnMapsPage() {
  const qc = useQueryClient();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ColumnMap | null>(null);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: columnMaps, isLoading } = useQuery<ColumnMap[]>({
    queryKey: ["flexi-import", "column-maps"],
    queryFn: () =>
      api.get("/flexi-import/column-maps").then((r) => {
        const list = (r.data.data ?? r.data) as Array<Record<string, unknown>>;
        // Backend ImportColumnMapResource returns uuid/column_mapping (FI-D3);
        // alias them to the id/mapping this page consumes.
        return (Array.isArray(list) ? list : []).map((m) => ({
          ...m,
          id: m.id ?? m.uuid,
          mapping: m.mapping ?? m.column_mapping,
        })) as ColumnMap[];
      }),
    staleTime: 30_000,
  });

  // Field definitions — always loaded for both types so preview labels resolve
  const { data: employeeFields = [] } = useQuery<FieldDefinition[]>({
    queryKey: ["flexi-import", "fields", "employee"],
    queryFn: () =>
      api
        .get("/flexi-import/fields/employees")
        .then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60_000,
  });

  const { data: flexiMetaFields = [] } = useQuery<FieldDefinition[]>({
    queryKey: ["flexi-import", "fields", "flexi_meta"],
    queryFn: () =>
      api
        .get("/flexi-import/fields/flexi_meta_entities")
        .then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60_000,
  });

  const getFieldDefs = useCallback(
    (importType: string): FieldDefinition[] => {
      if (importType === "employees") return employeeFields;
      if (importType === "flexi_meta_entities") return flexiMetaFields;
      return [];
    },
    [employeeFields, flexiMetaFields]
  );

  // ── Grouped data ───────────────────────────────────────────────────────────
  const grouped = useMemo(
    () =>
      IMPORT_TYPE_GROUPS.map((g) => ({
        ...g,
        items: (columnMaps ?? []).filter((m) => m.import_type === g.key),
      })),
    [columnMaps]
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name: string; mapping: Record<string, string> };
    }) =>
      api.put(`/flexi-import/column-maps/${id}`, {
        name: payload.name,
        column_mapping: payload.mapping,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flexi-import", "column-maps"] });
      toast.success("Template saved.");
      setEditingId(null);
      setEditDraft(null);
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to save template." }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      api.put(`/flexi-import/column-maps/${id}`, { is_default: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flexi-import", "column-maps"] });
      toast.success("Default template updated.");
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to set default." }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/flexi-import/column-maps/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flexi-import", "column-maps"] });
      toast.success("Template deleted.");
      setDeleteTarget(null);
    },
    onError: (apiFailure) => showApiError(apiFailure, { fallbackMessage: "Failed to delete template." }),
  });

  // ── Edit helpers ───────────────────────────────────────────────────────────
  const openEdit = useCallback((map: ColumnMap) => {
    setEditingId(map.id);
    setEditDraft({
      name: map.name,
      pairs: mappingToPairs(map.mapping),
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!editingId || !editDraft) return;
    updateMutation.mutate({
      id: editingId,
      payload: {
        name: editDraft.name,
        mapping: pairsToMapping(editDraft.pairs),
      },
    });
  }, [editingId, editDraft, updateMutation]);

  const updateDraftName = useCallback(
    (name: string) =>
      setEditDraft((prev) => (prev ? { ...prev, name } : prev)),
    []
  );

  const addPair = useCallback(
    () =>
      setEditDraft((prev) =>
        prev
          ? { ...prev, pairs: [...prev.pairs, { csvHeader: "", fieldKey: "" }] }
          : prev
      ),
    []
  );

  const removePair = useCallback(
    (idx: number) =>
      setEditDraft((prev) =>
        prev
          ? { ...prev, pairs: prev.pairs.filter((_, i) => i !== idx) }
          : prev
      ),
    []
  );

  const updatePair = useCallback(
    (idx: number, field: "csvHeader" | "fieldKey", value: string) =>
      setEditDraft((prev) =>
        prev
          ? {
              ...prev,
              pairs: prev.pairs.map((p, i) =>
                i === idx ? { ...p, [field]: value } : p
              ),
            }
          : prev
      ),
    []
  );

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader />
        {[0, 1].map((g) => (
          <section key={g} className="space-y-3">
            <div className="h-4 w-44 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((c) => (
                <div
                  key={c}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 animate-pulse"
                >
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="space-y-1.5">
                    {[0, 1, 2].map((r) => (
                      <div
                        key={r}
                        className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800"
                      />
                    ))}
                  </div>
                  <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader />

        {grouped.map((group) => (
          <section key={group.key}>
            {/* Group heading */}
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {group.label}
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({group.items.length})
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {group.items.length === 0 ? (
              <EmptyState importTypeLabel={group.label} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((map) => (
                  <TemplateCard
                    key={map.id}
                    map={map}
                    isEditing={editingId === map.id}
                    editDraft={editingId === map.id ? editDraft : null}
                    fieldDefs={getFieldDefs(map.import_type)}
                    isSaving={updateMutation.isPending}
                    isSettingDefault={setDefaultMutation.isPending}
                    onEdit={() => openEdit(map)}
                    onCancelEdit={cancelEdit}
                    onSave={handleSave}
                    onSetDefault={() => setDefaultMutation.mutate(map.id)}
                    onDelete={() => setDeleteTarget(map)}
                    onAddPair={addPair}
                    onRemovePair={removePair}
                    onUpdatePair={updatePair}
                    onUpdateDraftName={updateDraftName}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* ── Delete confirmation dialog ──────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-red-500 shrink-0" />
              Delete Template
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    &ldquo;{deleteTarget?.name}&rdquo;
                  </span>
                  ? This cannot be undone.
                </p>
                {deleteTarget?.is_default && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      This is your default template. Setting another template as
                      default first is recommended.
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
              className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Template"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Saved Column Mapping Templates
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Save your CSV column structure once — load it on every import.
      </p>
    </div>
  );
}

function EmptyState({ importTypeLabel }: { importTypeLabel: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 px-6 py-10 text-center">
      <FileText className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        No saved templates for {importTypeLabel} imports.
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
        During your next import, check{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          &ldquo;Save this mapping as a template&rdquo;
        </span>
        .
      </p>
    </div>
  );
}

// ── TemplateCard ──────────────────────────────────────────────────────────────

interface TemplateCardProps {
  map: ColumnMap;
  isEditing: boolean;
  editDraft: EditDraft | null;
  fieldDefs: FieldDefinition[];
  isSaving: boolean;
  isSettingDefault: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onAddPair: () => void;
  onRemovePair: (idx: number) => void;
  onUpdatePair: (idx: number, field: "csvHeader" | "fieldKey", value: string) => void;
  onUpdateDraftName: (name: string) => void;
}

function TemplateCard({
  map,
  isEditing,
  editDraft,
  fieldDefs,
  isSaving,
  isSettingDefault,
  onEdit,
  onCancelEdit,
  onSave,
  onSetDefault,
  onDelete,
  onAddPair,
  onRemovePair,
  onUpdatePair,
  onUpdateDraftName,
}: TemplateCardProps) {
  const mappingEntries = Object.entries(map.mapping);
  const previewEntries = mappingEntries.slice(0, 3);
  const remaining = mappingEntries.length - 3;

  // Resolve field key → human label (falls back to raw key if not found)
  const resolveLabel = (fieldKey: string) =>
    fieldDefs.find((f) => f.key === fieldKey)?.label ?? fieldKey;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white dark:bg-gray-900 transition-shadow duration-200",
        isEditing
          ? "border-blue-400 dark:border-blue-500 shadow-md ring-1 ring-blue-200 dark:ring-blue-900"
          : "border-gray-200 dark:border-gray-700 hover:shadow-sm"
      )}
    >
      {/* ── Always-visible header ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        {/* Name row */}
        <div className="flex items-start gap-2">
          {isEditing && editDraft ? (
            <input
              type="text"
              value={editDraft.name}
              onChange={(e) => onUpdateDraftName(e.target.value)}
              placeholder="Template name"
              className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {map.name}
            </p>
          )}

          {map.is_default && !isEditing && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Default
            </span>
          )}
        </div>

        {/* Last used — only in view mode */}
        {!isEditing && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {relativeDate(map.last_used_at)}
          </p>
        )}

        {/* Mapping preview — only in view mode */}
        {!isEditing && (
          <div className="mt-3 space-y-1.5">
            {previewEntries.map(([csv, fieldKey]) => (
              <div
                key={csv}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
              >
                <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 font-mono truncate max-w-[110px] text-gray-700 dark:text-gray-300">
                  {csv}
                </span>
                <span className="shrink-0 text-gray-300 dark:text-gray-600">
                  →
                </span>
                <span className="truncate">{resolveLabel(fieldKey)}</span>
              </div>
            ))}
            {remaining > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                …and {remaining} more
              </p>
            )}
          </div>
        )}

        {/* Action buttons — only in view mode */}
        {!isEditing && (
          <div className="mt-3 flex items-center gap-0.5 border-t border-gray-100 dark:border-gray-800 pt-2.5">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>

            {!map.is_default && (
              <button
                onClick={onSetDefault}
                disabled={isSettingDefault}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                Set as Default
              </button>
            )}

            <button
              onClick={onDelete}
              className="ml-auto flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* ── Inline edit panel (animated) ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isEditing && editDraft && (
          <motion.div
            key="edit-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-blue-100 dark:border-blue-900/40 px-4 pt-3 pb-4 space-y-3">
              {/* Column labels */}
              <div className="grid grid-cols-[1fr_12px_1fr_24px] gap-x-1.5 px-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  CSV Column
                </span>
                <span />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Field
                </span>
                <span />
              </div>

              {/* Pair rows */}
              <div className="space-y-2">
                {editDraft.pairs.map((pair, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_12px_1fr_24px] items-center gap-x-1.5"
                  >
                    {/* CSV header input */}
                    <input
                      type="text"
                      value={pair.csvHeader}
                      onChange={(e) =>
                        onUpdatePair(idx, "csvHeader", e.target.value)
                      }
                      placeholder="CSV header"
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs font-mono text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />

                    <span className="text-center text-xs text-gray-300 dark:text-gray-600">
                      →
                    </span>

                    {/* Field key dropdown */}
                    <select
                      value={pair.fieldKey}
                      onChange={(e) =>
                        onUpdatePair(idx, "fieldKey", e.target.value)
                      }
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                      <option value="">Select field…</option>
                      {fieldDefs.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                          {f.required ? " *" : ""}
                        </option>
                      ))}
                      {/* Keep the current value visible even if fieldDefs not yet loaded */}
                      {pair.fieldKey &&
                        !fieldDefs.some((f) => f.key === pair.fieldKey) && (
                          <option value={pair.fieldKey}>{pair.fieldKey}</option>
                        )}
                    </select>

                    {/* Remove row */}
                    <button
                      onClick={() => onRemovePair(idx)}
                      disabled={editDraft.pairs.length <= 1}
                      title="Remove row"
                      className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add column */}
              <button
                onClick={onAddPair}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add column
              </button>

              {/* Save / Cancel */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onSave}
                  disabled={isSaving || !editDraft.name.trim()}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: "var(--brand-500)" }}
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={onCancelEdit}
                  disabled={isSaving}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
