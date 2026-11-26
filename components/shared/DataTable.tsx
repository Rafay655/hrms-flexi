"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ──────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ──────────────────────────────────────────────────────────── */
export type DataTableColumn<T> = {
  key: keyof T;
  header: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

export interface DataTableProps<T extends { id: string | number }> {
  title: string;
  description?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  searchKeys: (keyof T)[];
  searchPlaceholder?: string;
  onAdd: () => void;
  addLabel?: string;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  isLoading?: boolean;
  defaultPerPage?: number;
  renderForm: (
    mode: "create" | "edit",
    item?: T,
    onClose?: () => void
  ) => React.ReactNode;
  exportFilename?: string;
  renderRowActions?: (row: T, actions: { edit: () => void; delete: () => void }) => React.ReactNode;
  dialogClassName?: string;
}

/* ──────────────────────────────────────────────────────────── */
/*  Hook: debounced value                                        */
/* ──────────────────────────────────────────────────────────── */
function useDebounced<V>(value: V, delay = 400): V {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ──────────────────────────────────────────────────────────── */
/*  CSV Export                                                   */
/* ──────────────────────────────────────────────────────────── */
function exportToCsv<T extends { id: string | number }>(
  rows: T[],
  columns: DataTableColumn<T>[],
  filename: string
) {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((r) =>
      columns.map((c) => escape(r[c.key] as unknown)).join(",")
    )
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ──────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ──────────────────────────────────────────────────────────── */
export function DataTable<T extends { id: string | number }>({
  title,
  description,
  columns,
  data,
  searchKeys,
  searchPlaceholder = "Search...",
  onAdd,
  addLabel = "Add New",
  onEdit,
  onDelete,
  isLoading = false,
  defaultPerPage = 10,
  renderForm,
  exportFilename,
  renderRowActions,
  dialogClassName,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 400);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Dialog state
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editItem, setEditItem] = useState<T | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  // Filter + sort
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let result = data;
    if (needle) {
      result = data.filter((row) =>
        searchKeys.some((k) => {
          const v = row[k];
          return v != null && String(v).toLowerCase().includes(needle);
        })
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
        });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [data, q, searchKeys, sortKey, sortDir]);

  // Pagination
  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, totalEntries);
  const paged = filtered.slice(startIdx, endIdx);

  useEffect(() => {
    setPage(1);
  }, [q, perPage]);

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleAddClick = () => {
    setMode("create");
    setEditItem(undefined);
    onAdd();
  };

  const handleEditClick = (item: T) => {
    setMode("edit");
    setEditItem(item);
    onEdit(item);
  };

  const closeDialog = () => {
    setMode(null);
    setEditItem(undefined);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportToCsv(filtered, columns, exportFilename ?? title.replace(/\s+/g, "-").toLowerCase());
  };

  return (
    <div className="p-3">
      <Card className="border border-gray-200 shadow-sm">
        {/* ── Header ─────────────────────────────────────── */}
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">{title}</h2>
              {description && (
                <p className="text-sm text-brand-700 mt-1">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAddClick}
                className="bg-brand-800 hover:bg-brand-900 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                {addLabel}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* ── Search + Per Page ─────────────────────────── */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-200 focus:border-brand-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-700">Show</span>
              <Select
                value={String(perPage)}
                onValueChange={(v) => setPerPage(Number(v))}
              >
                <SelectTrigger className="w-20 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {[10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-brand-700">entries</span>
            </div>
          </div>

          {/* ── Record count ──────────────────────────────── */}
          <div className="rounded-lg border border-brand-200 bg-brand-100/40 px-4 py-2.5 mb-4 text-sm text-brand-700">
            Showing{" "}
            <span className="font-semibold text-brand-900">
              {totalEntries === 0 ? 0 : startIdx + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-brand-900">{endIdx}</span> of{" "}
            <span className="font-semibold text-brand-900">{totalEntries}</span>{" "}
            records
          </div>

          {/* ── Table / Loading / Empty ───────────────────── */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table data-ui-table="professional" className="w-full text-sm">
                <thead className="bg-brand-50 border-b border-gray-200">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={String(col.key)}
                        onClick={() => toggleSort(col.key)}
                        style={col.width ? { width: col.width } : undefined}
                        className="py-3 px-6 text-left text-xs font-semibold text-brand-700 uppercase tracking-wider cursor-pointer select-none hover:bg-brand-100 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          {col.header}
                          {sortKey === col.key &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ))}
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-6 text-right text-xs font-semibold text-brand-700 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`sk-${i}`}>
                        {columns.map((col) => (
                          <td key={String(col.key)} className="py-4 px-6">
                            <div className="h-4 w-3/4 rounded bg-brand-100 animate-pulse" />
                          </td>
                        ))}
                        <td className="py-4 px-6">
                          <div className="h-4 w-16 ml-auto rounded bg-brand-100 animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : paged.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
                            <Inbox className="h-6 w-6 text-brand-700" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-900">
                              No records found
                            </p>
                            <p className="text-xs text-brand-700 mt-0.5">
                              {q
                                ? "Try adjusting your search."
                                : "Get started by adding your first record."}
                            </p>
                          </div>
                          {!q && (
                            <Button
                              onClick={handleAddClick}
                              className="bg-brand-800 hover:bg-brand-900 text-white gap-2 mt-1"
                            >
                              <Plus className="h-4 w-4" />
                              {addLabel}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paged.map((row) => (
                      <tr
                        key={String(row.id)}
                        className="hover:bg-brand-50 transition-colors"
                      >
                        {columns.map((col) => (
                          <td
                            key={String(col.key)}
                            className="py-3 px-6 text-sm text-brand-900"
                          >
                            {col.render
                              ? col.render(row[col.key], row)
                              : (row[col.key] as React.ReactNode)}
                          </td>
                        ))}
                        <td className="py-3 px-6">
                          {renderRowActions ? renderRowActions(row, { edit: () => handleEditClick(row), delete: () => setDeleteTarget(row) }) : <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(row)}
                              className="h-8 w-8 p-0 text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(row)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ────────────────────────────────── */}
          {totalEntries > 0 && (
            <div data-table-pagination className="mt-4 rounded-b-lg">
              <p className="text-xs text-brand-700">
                Page{" "}
                <span className="font-semibold text-brand-900">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-brand-900">
                  {totalPages}
                </span>
              </p>
              <nav aria-label="Table pagination" data-table-pagination-controls className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="First page"
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-gray-200"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Previous page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 border-gray-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Next page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-gray-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Last page"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 border-gray-200"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </nav>
              <p>{startIdx + 1}–{endIdx} of {totalEntries.toLocaleString()} entries</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create/Edit Dialog ─────────────────────────── */}
      <Dialog open={mode !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className={dialogClassName ?? "sm:max-w-[640px] bg-white"}>
          <DialogHeader>
            <DialogTitle className="text-brand-900">
              {mode === "create" ? `${addLabel}` : `Edit ${title.replace(/s$/, "")}`}
            </DialogTitle>
          </DialogHeader>
          {mode && renderForm(mode, editItem, closeDialog)}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ─────────────────────────────── */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-900">
              Delete record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-brand-700">
              This action cannot be undone. The record will be permanently
              removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-brand-800 hover:bg-brand-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DataTable;
