"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Inbox,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/**
 * RecordsTable — a read-oriented data table for LoanHub list pages.
 *
 * Provides the "basics": a # index column, a dynamic (debounced) search bar, an
 * optional filter slot, client-side pagination with a per-page selector, sortable
 * columns, hover rows, a loading skeleton and a helpful empty state. Styling mirrors
 * the shared components/shared/DataTable.tsx for cross-module consistency.
 *
 * Row CRUD actions (View / Edit / Delete) are supplied per-row via `actions`.
 */

export type RecordColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  width?: string;
  /** Value used for sorting + search (defaults to render output is NOT searchable). */
  sortValue?: (row: T) => string | number;
  searchValue?: (row: T) => string;
  render: (row: T) => React.ReactNode;
};

export interface RecordsTableProps<T> {
  columns: RecordColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  /** Extra filter controls rendered in the toolbar (page-controlled). */
  filters?: React.ReactNode;
  /** Per-row action buttons (View / Edit / Delete …). */
  actions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  defaultPerPage?: number;
}

function useDebounced<V>(value: V, delay = 350): V {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export function RecordsTable<T>({
  columns,
  data,
  rowKey,
  searchPlaceholder = "Search…",
  filters,
  actions,
  onRowClick,
  isLoading = false,
  emptyTitle = "No records found",
  emptyHint,
  defaultPerPage = 10,
}: RecordsTableProps<T>) {
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const searchableCols = useMemo(() => columns.filter((c) => c.searchValue), [columns]);

  const processed = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = data;
    if (needle && searchableCols.length) {
      rows = data.filter((row) =>
        searchableCols.some((c) => c.searchValue!(row).toLowerCase().includes(needle)),
      );
    }
    const col = columns.find((c) => c.key === sortKey);
    if (col?.sortValue) {
      rows = [...rows].sort((a, b) => {
        const av = col.sortValue!(a);
        const bv = col.sortValue!(b);
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, q, searchableCols, columns, sortKey, sortDir]);

  const total = processed.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, total);
  const paged = processed.slice(startIdx, endIdx);

  useEffect(() => {
    setPage(1);
  }, [q, perPage]);

  const toggleSort = (col: RecordColumn<T>) => {
    if (!col.sortValue) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xs">
      {/* Toolbar: search + filters + per-page */}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-gray-200 focus:border-brand-800"
            aria-label="Search records"
          />
        </div>
        {filters}
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-700">Show</span>
          <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
            <SelectTrigger className="w-[72px] border-gray-200">
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
        </div>
      </div>

      {/* Record count */}
      <div className="bg-brand-100/40 px-4 py-2 text-xs text-brand-700">
        Showing <span className="font-semibold text-brand-900">{total === 0 ? 0 : startIdx + 1}</span>–
        <span className="font-semibold text-brand-900">{endIdx}</span> of{" "}
        <span className="font-semibold text-brand-900">{total}</span> records
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-50">
            <tr>
              <th className="w-12 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-brand-700">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col)}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-700 ${
                    col.align === "right" ? "text-right" : "text-left"
                  } ${col.sortValue ? "cursor-pointer select-none hover:bg-brand-100 transition-colors" : ""}`}
                >
                  <span className={`inline-flex items-center gap-1 ${col.align === "right" ? "justify-end" : ""}`}>
                    {col.header}
                    {sortKey === col.key && (sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                  </span>
                </th>
              ))}
              {actions && <th className="w-px px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-brand-700">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td className="px-4 py-3"><div className="h-4 w-4 animate-pulse rounded bg-brand-100" /></td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3"><div className="h-4 w-3/4 animate-pulse rounded bg-brand-100" /></td>
                  ))}
                  {actions && <td className="px-4 py-3"><div className="ml-auto h-4 w-12 animate-pulse rounded bg-brand-100" /></td>}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 2 : 1)} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
                      <Inbox className="h-6 w-6 text-brand-700" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-brand-900">{emptyTitle}</p>
                      <p className="mt-0.5 text-xs text-brand-700">{q ? "Try adjusting your search or filters." : emptyHint ?? "Nothing here yet."}</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors hover:bg-brand-50 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  <td className="px-4 py-3 tabular-nums text-brand-500">{startIdx + i + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-brand-900 ${col.align === "right" ? "text-right tabular-nums" : ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row">
          <p className="text-xs text-brand-700">
            Page <span className="font-semibold text-brand-900">{current}</span> of{" "}
            <span className="font-semibold text-brand-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={current === 1} className="h-8 w-8 border-gray-200 p-0" aria-label="First page">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1} className="h-8 w-8 border-gray-200 p-0" aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages} className="h-8 w-8 border-gray-200 p-0" aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={current === totalPages} className="h-8 w-8 border-gray-200 p-0" aria-label="Last page">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordsTable;
