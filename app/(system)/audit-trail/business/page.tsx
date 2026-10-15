"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  Info,
  X,
  Plus,
  Minus,
  History,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import {
  eventBadgeClass,
  shortSubject,
  actorLabel,
  renderDiffValue,
} from "@/lib/audit-trail";

/* ------------------------------------------------------------------ */
/*  API types                                                          */
/* ------------------------------------------------------------------ */

type BusinessLog = {
  id: number;
  log_name: string | null;
  description: string | null;
  event: string | null;
  subject_type: string | null;
  subject_id: number | null;
  causer_id: number | null;
  properties: Record<string, unknown> | null;
  created_at: string;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type DiffEntry = {
  field: string;
  old_value: unknown;
  new_value: unknown;
};

/* ------------------------------------------------------------------ */
/*  Helpers — eventBadgeClass / shortSubject / actorLabel / renderDiffValue
    live in @/lib/audit-trail (unit-tested).                            */
/* ------------------------------------------------------------------ */
/*  Fetchers                                                           */
/* ------------------------------------------------------------------ */

type ListResponse = { success: boolean; data: BusinessLog[]; meta?: PaginationMeta };

type Filters = {
  subjectType: string;
  subjectId: string;
  event: string;
  search: string;
  fromDate: string;
  toDate: string;
  page: number;
};

/**
 * Entity-history mode kicks in when BOTH subject_type and subject_id are set —
 * the dedicated /business/entity endpoint returns the full chronological history
 * for that one record. Otherwise we hit the general /business list with filters.
 */
async function fetchBusinessLogs(
  f: Filters,
): Promise<{ data: BusinessLog[]; meta: PaginationMeta }> {
  const isEntity = f.subjectType.trim() !== "" && f.subjectId.trim() !== "";

  const params = new URLSearchParams();
  params.set("page", String(f.page));

  let url: string;
  if (isEntity) {
    url = "/audit-trail/business/entity";
    params.set("subject_type", f.subjectType.trim());
    params.set("subject_id", f.subjectId.trim());
  } else {
    url = "/audit-trail/business";
    if (f.subjectType.trim()) params.set("subject_type", f.subjectType.trim());
    if (f.event.trim()) params.set("event", f.event.trim());
    if (f.search.trim()) params.set("search", f.search.trim());
    if (f.fromDate) params.set("date_from", f.fromDate);
    if (f.toDate) params.set("date_to", f.toDate);
  }

  const { data } = await api.get<ListResponse>(`${url}?${params.toString()}`);
  const rows = Array.isArray(data.data) ? data.data : [];
  const meta = data.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: rows.length || 50,
    total: rows.length,
  };
  return { data: rows, meta };
}

async function fetchDiff(activityId: number): Promise<DiffEntry[]> {
  const { data } = await api.get<{ success: boolean; data: DiffEntry[] }>(
    `/audit-trail/business/${activityId}/diff`,
  );
  return Array.isArray(data.data) ? data.data : [];
}

/* ------------------------------------------------------------------ */
/*  Diff dialog                                                        */
/* ------------------------------------------------------------------ */

function DiffDialog({
  log,
  onClose,
}: {
  log: BusinessLog | null;
  onClose: () => void;
}) {
  const { data: diff, isLoading } = useQuery({
    queryKey: ["business-diff", log?.id],
    queryFn: () => fetchDiff(log!.id),
    enabled: !!log,
  });

  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-900">
            <History className="h-5 w-5" />
            Field changes
            {log && (
              <span
                className={`ml-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${eventBadgeClass(
                  log.event,
                )}`}
              >
                {log.event ?? "—"}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {log && (
          <div className="mb-3 text-sm text-brand-700">
            <span className="font-semibold text-brand-900">
              {shortSubject(log.subject_type)}
            </span>
            {log.subject_id != null && (
              <span className="text-brand-700"> #{log.subject_id}</span>
            )}
            {" · "}
            {actorLabel(log.causer_id)}
            {" · "}
            {format(new Date(log.created_at), "PPpp")}
          </div>
        )}

        {isLoading ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-300" />
          </div>
        ) : !diff || diff.length === 0 ? (
          <div className="py-8 text-center text-sm text-brand-700">
            <Info className="mx-auto mb-2 h-6 w-6 text-brand-300" />
            No field-level changes recorded for this event.
          </div>
        ) : (
          <div className="space-y-2">
            {diff.map((entry) => (
              <div
                key={entry.field}
                className="rounded-lg border border-gray-200 p-3"
              >
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {entry.field}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-1.5 rounded bg-red-50 p-2">
                    <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span className="break-all text-xs text-red-800">
                      {renderDiffValue(entry.old_value)}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 rounded bg-emerald-50 p-2">
                    <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="break-all text-xs text-emerald-800">
                      {renderDiffValue(entry.new_value)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BusinessAuditPage() {
  const [subjectType, setSubjectType] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BusinessLog | null>(null);

  useEffect(() => {
    setPage(1);
  }, [subjectType, subjectId, eventFilter, search, fromDate, toDate]);

  const filters: Filters = {
    subjectType,
    subjectId,
    event: eventFilter,
    search,
    fromDate,
    toDate,
    page,
  };

  const isEntityMode =
    subjectType.trim() !== "" && subjectId.trim() !== "";

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["business-audit", filters],
    queryFn: () => fetchBusinessLogs(filters),
    placeholderData: (prev) => prev,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  };

  function clearFilters() {
    setSubjectType("");
    setSubjectId("");
    setEventFilter("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-gray-200 px-6 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-900">Business Audit</h1>
              <p className="mt-0.5 text-sm text-brand-700">
                Model-level change history — who changed which field on which record.
                Provide a record type and id to view a single record&apos;s full timeline.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-4">
            <input
              type="text"
              placeholder="Record type (e.g. Employee or App\Models\…)"
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value)}
              className="h-10 w-64 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
            />
            <input
              type="number"
              min={1}
              placeholder="Record ID"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="h-10 w-28 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
            />

            {!isEntityMode && (
              <>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="">All Events</option>
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                  <option value="deleted">Deleted</option>
                  <option value="restored">Restored</option>
                </select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="text"
                    placeholder="Search description"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-52 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-700" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </>
            )}

            {isEntityMode && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-100 px-3 py-2 text-xs font-semibold text-brand-800">
                <History className="h-3.5 w-3.5" />
                Entity history mode
              </span>
            )}

            <button
              type="button"
              title="Clear all filters"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-brand-800 transition hover:bg-brand-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
              <Filter className="h-4 w-4" />
              {isEntityMode ? "Record Timeline" : "Change Log"}
              {isFetching && !isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" />
              )}
            </h2>
            <span className="text-sm text-brand-700">
              {meta.total.toLocaleString()} events
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="px-6 py-16 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-300" />
                <div className="mt-3 text-sm text-brand-700">Loading change history…</div>
              </div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Info className="mx-auto h-8 w-8 text-brand-300" />
                <div className="mt-3 text-sm font-semibold text-brand-900">
                  No business audit events found.
                </div>
                <div className="mt-1 text-sm text-brand-700">
                  Adjust the filters, or enter a record type + id for a single record&apos;s timeline.
                </div>
              </div>
            ) : (
              rows.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setSelected(log)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-brand-100"
                >
                  <span
                    className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${eventBadgeClass(
                      log.event,
                    )}`}
                  >
                    {log.event ?? "—"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-brand-900">
                        {shortSubject(log.subject_type)}
                        {log.subject_id != null && (
                          <span className="font-normal text-brand-700"> #{log.subject_id}</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-brand-700">
                      <span>{actorLabel(log.causer_id)}</span>
                      {log.description && (
                        <span className="max-w-md truncate">{log.description}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right text-xs tabular-nums text-brand-700">
                    {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-brand-400" />
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <span className="text-sm text-brand-700">
                Page <span className="font-semibold text-brand-900">{meta.current_page}</span> of{" "}
                <span className="font-semibold text-brand-900">{meta.last_page}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-40"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={page >= meta.last_page || isFetching}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DiffDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
