"use client";
import { showApiError } from "@/lib/error-toast";

import { useEffect, useState } from "react";
import {
  Eye,
  MoreVertical,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SearchableSelect from "@/components/ui/searchable-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLetterBatches } from "@/hooks/use-letter-batches";
import type {
  LetterBatchFilters,
  LetterBatchStatus,
} from "@/types/letter-batch";
import { REGISTERED_TEMPLATE_KEYS } from "@/types/letter-forge";
import { LetterStatus } from "../components/letter-ui";
import { CreateBatchModal } from "../components/create-batch-modal";
import { BatchDetailModal } from "../components/batch-detail-modal";

const statuses = [
  { label: "All statuses", value: "all" },
  { label: "Dry runs", value: "dry_run" },
  { label: "Drafts", value: "draft" },
  { label: "Running", value: "running" },
  { label: "Completed", value: "completed" },
  { label: "Partially failed", value: "partially_failed" },
  { label: "Failed", value: "failed" },
];

export default function LetterBatchesPage() {
  const [filters, setFilters] = useState<LetterBatchFilters>({
    page: 1,
    per_page: 10,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [detailUuid, setDetailUuid] = useState<string | null>(null);
  const query = useLetterBatches(filters);
  const batches = query.data?.data ?? [];
  const meta = query.data?.meta;
  const page = meta?.current_page ?? filters.page ?? 1;
  const lastPage = Math.max(1, meta?.last_page ?? 1);
  const total = meta?.total ?? batches.length;
  const from =
    meta?.from ??
    (batches.length
      ? (page - 1) * (meta?.per_page ?? filters.per_page ?? 10) + 1
      : 0);
  const to = meta?.to ?? (batches.length ? from + batches.length - 1 : 0);
  const firstPage = Math.max(1, Math.min(page - 2, lastPage - 4));
  const pages = Array.from(
    { length: Math.min(5, lastPage) },
    (_, index) => firstPage + index,
  );
  const paginationBusy = query.isFetching || !meta;
  const hasFilters = Boolean(filters.status || filters.template_key);
  const changePage = (next: number) =>
    setFilters((previous) => ({ ...previous, page: next }));
  const clearFilters = () =>
    setFilters((previous) => ({
      ...previous,
      page: 1,
      status: undefined,
      template_key: undefined,
    }));
  useEffect(() => {
    if (query.error)
      showApiError(query.error, {
        id: "batch-list-error",
      });
  }, [query.error]);

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Letter Batches Directory
              </CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                {total.toLocaleString()} batches • Real-time data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                size="sm"
                className="bg-[#1E1B4B] hover:bg-[#2A2675]"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create batch
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <SearchableSelect
              aria-label="Filter batch template"
              widthClass="w-full sm:w-72"
              value={filters.template_key || "all"}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  page: 1,
                  template_key: value === "all" ? undefined : value,
                }))
              }
              allowAll={false}
              options={[
                { value: "all", label: "All templates" },
                ...REGISTERED_TEMPLATE_KEYS.map((entry) => ({
                  value: entry.key,
                  label: entry.label,
                })),
              ]}
            />
            <SearchableSelect
              aria-label="Filter batch status"
              widthClass="w-full sm:w-56"
              value={filters.status || "all"}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  page: 1,
                  status:
                    value === "all" ? undefined : (value as LetterBatchStatus),
                }))
              }
              allowAll={false}
              options={statuses}
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600 sm:ml-auto">
              <span>Show</span>
              <SearchableSelect
                aria-label="Batches per page"
                allowAll={false}
                widthClass="w-28"
                value={String(filters.per_page ?? 10)}
                onChange={(value) =>
                  setFilters((previous) => ({
                    ...previous,
                    page: 1,
                    per_page: Number(value),
                  }))
                }
                options={[10, 25, 50, 100].map((value) => ({
                  value: String(value),
                  label: String(value),
                }))}
              />
              <span>entries</span>
            </div>
          </div>
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600"
          >
            <span>
              Showing <strong className="text-gray-900">{from}</strong> to{" "}
              <strong className="text-gray-900">{to}</strong> of{" "}
              <strong className="text-gray-900">
                {total.toLocaleString()}
              </strong>{" "}
              entries
            </span>
            {query.isFetching && (
              <Badge
                variant="outline"
                className="gap-1 border-blue-200 bg-blue-50"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading…
              </Badge>
            )}
          </div>
          <div
            className="overflow-hidden rounded-lg border border-gray-200"
            aria-busy={query.isFetching}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <caption className="sr-only">Letter generation batches</caption>
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    {[
                      "SR. NO.",
                      "Template",
                      "Status",
                      "Total",
                      "Queued",
                      "Succeeded",
                      "Failed / Skipped",
                    
                      "Actions",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className={`px-6 py-3 ${label === "Actions" ? "text-right" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {query.isPending ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading batches…
                        </p>
                      </td>
                    </tr>
                  ) : query.isError && !query.data ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        Unable to load batches.{" "}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={query.isFetching}
                          onClick={() => void query.refetch()}
                        >
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ) : !batches.length ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 font-medium">No batches found</p>
                        <p className="text-sm text-muted-foreground">
                          {hasFilters
                            ? "Try another filter or clear your filters."
                            : "Create your first batch to generate letters for multiple employees."}
                        </p>
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={
                            hasFilters
                              ? clearFilters
                              : () => setCreateOpen(true)
                          }
                        >
                          {hasFilters ? "Clear filters" : "Create batch"}
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch, index) => (
                      <tr key={batch.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{from + index}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            className="text-left font-semibold hover:underline"
                            onClick={() => setDetailUuid(batch.uuid)}
                          >
                            {REGISTERED_TEMPLATE_KEYS.find(
                              (entry) => entry.key === batch.template_key,
                            )?.label ?? batch.template_key}
                          </button>
                          {/* <p
                            className="mt-1 max-w-56 truncate text-xs text-muted-foreground"
                            title={batch.uuid}
                          >
                            {batch.uuid}
                          </p> */}
                        </td>
                        <td className="px-6 py-4">
                          <LetterStatus status={batch.status} />
                        </td>
                        <td className="px-6 py-4">{batch.total_count}</td>
                        <td className="px-6 py-4">{batch.queued_count}</td>
                        <td className="px-6 py-4">{batch.succeeded_count}</td>
                        <td className="px-6 py-4">
                          {batch.failed_count} / {batch.skipped_count}
                        </td>
                      
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Actions for batch ${batch.uuid}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setDetailUuid(batch.uuid)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {batch.is_committable
                                  ? "Review eligibility"
                                  : "View progress"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 px-6 py-4 text-sm">
            <span>
              Page {page} of {lastPage}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="First page"
                disabled={paginationBusy || page <= 1}
                onClick={() => changePage(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Previous page"
                disabled={paginationBusy || page <= 1}
                onClick={() => changePage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pages.map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={value === page ? "default" : "outline"}
                  className={
                    value === page
                      ? "h-8 min-w-8 bg-[#1E1B4B] hover:bg-[#2A2675]"
                      : "h-8 min-w-8"
                  }
                  aria-current={value === page ? "page" : undefined}
                  disabled={paginationBusy}
                  onClick={() => changePage(value)}
                >
                  {value}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Next page"
                disabled={paginationBusy || page >= lastPage}
                onClick={() => changePage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Last page"
                disabled={paginationBusy || page >= lastPage}
                onClick={() => changePage(lastPage)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
            <span>
              {from} – {to} of {total} entries
            </span>
          </div>
        </CardContent>
      </Card>
      {createOpen && (
        <CreateBatchModal
          onClose={() => setCreateOpen(false)}
          onCreated={(uuid) => {
            setCreateOpen(false);
            setDetailUuid(uuid);
            void query.refetch();
          }}
        />
      )}
      {detailUuid && (
        <BatchDetailModal
          key={detailUuid}
          uuid={detailUuid}
          onClose={() => {
            setDetailUuid(null);
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}
