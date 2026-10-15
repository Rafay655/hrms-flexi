"use client";

/**
 * components/expense-hub/ListControls.tsx — shared search bar, filter shell and
 * pagination footer for ExpenseHub list pages.
 */

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { PageMeta } from "@/types/expense-hub";

export function ListToolbar({
  search,
  onSearch,
  placeholder = "Search…",
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
        />
      </div>
      {children}
    </div>
  );
}

/** A compact labelled filter <select> for the toolbar. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
    >
      <option value="">{label}: All</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Pagination({
  meta,
  onPage,
  isFetching,
}: {
  meta?: PageMeta;
  onPage: (page: number) => void;
  isFetching?: boolean;
}) {
  if (!meta) return null;

  const { current_page, last_page, total, from, to } = meta;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 text-sm" aria-live="polite">
      <p className="text-gray-500">
        {total === 0 ? "No results" : `Showing ${from ?? 0}–${to ?? 0} of ${total}`}
        {isFetching && <span className="ml-2 text-gray-400">updating…</span>}
      </p>
      {last_page > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(current_page - 1)}
            disabled={current_page <= 1}
            aria-label="Previous page"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-gray-600 tabular-nums">
            Page {current_page} of {last_page}
          </span>
          <button
            type="button"
            onClick={() => onPage(current_page + 1)}
            disabled={current_page >= last_page}
            aria-label="Next page"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
