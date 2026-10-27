"use client";

import { RosterTemplateModal } from "./components/roster-template-modal";
import { ApiErrorState } from "@/components/ui/api-error-state";
import { AppLoader } from "@/components/ui/app-loader";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import SearchableSelect from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
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
import {
  MoreVertical,
  RefreshCw,
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  PlusIcon,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import {
  useRosterTemplates,
  useDeleteRosterTemplate,
} from "@/hooks/useRosterTemplates";
import type {
  RosterTemplate,
  TemplateType,
} from "@/types/roster-template";

const DEFAULT_PER_PAGE = 10;

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "yearly", label: "Yearly" },

];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatTemplateType(value?: string) {
  if (!value) return "-";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

export default function RosterTemplateListingPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const isActiveParam =
    activeFilter === "all" ? undefined : activeFilter === "active" ? 1 : 0;
  const templateTypeParam = typeFilter === "all" ? undefined : typeFilter;

  const { data, isLoading, isFetching, error, refetch } = useRosterTemplates({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    template_type: templateTypeParam,
    is_active: isActiveParam,
  });

  const templates = useMemo(() => data?.data ?? [], [data]);
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, data?.meta?.last_page ?? 1);

  const deleteMutation = useDeleteRosterTemplate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<RosterTemplate | null>(null);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  const handleView = (item: RosterTemplate) => {
    setSelectedItem(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: RosterTemplate) => {
    setSelectedItem(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteUuid) return;
    deleteMutation.mutate(deleteUuid, {
      onSuccess: () => { setDeleteUuid(null); if (templates.length === 1 && page > 1) setPage(page - 1); },
    });
  };

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return templates.map((template, index: number) => ({
      ...template,
      sr: startSr + index + 1,
    }));
  }, [templates, page, perPage]);

  const columns: ColumnDef<RosterTemplate & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: () => <div className="text-center">#</div>,
        cell: ({ row }) => (
          <div className="text-center text-sm font-semibold text-slate-700">
            {row.original.sr}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Template Name",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="text-sm font-semibold text-slate-900">{row.original.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {row.original.pattern_data?.length ?? 0} pattern rows configured
            </p>
          </div>
        ),
      },
      {
        accessorKey: "template_type",
        header: () => <div className="text-center">Type</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className="rounded-full border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"
            >
              {formatTemplateType(row.original.template_type)}
            </Badge>
          </div>
        ),
      },
      {
        id: "working_days",
        header: "Working Days",
        cell: ({ row }) => (
          <div className="max-w-[180px] text-xs capitalize leading-5 text-muted-foreground">
            {row.original.working_days?.map(day => day.slice(0, 3)).join(', ') || 'None'}
          </div>
        ),
      },
      {
        id: "pattern_count",
        header: () => <div className="text-center">Patterns</div>,
        cell: ({ row }) => (
          <div className="text-center text-sm font-medium text-slate-700">
            {row.original.pattern_data?.length ?? 0}
          </div>
        ),
      },
      {
        accessorKey: "auto_generate",
        header: () => <div className="text-center">Auto</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.auto_generate ? (
              <Badge className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                Yes
              </Badge>
            ) : (
              <span className="text-sm text-slate-400">-</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge
              className={cx(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                row.original.is_active
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-50"
              )}
            >
              {row.original.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${row.original.name}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => handleView(row.original)}><Eye className="mr-2 h-4 w-4" />View details</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteUuid(row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  const showingFrom = totalEntries > 0 ? (page - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <div className="space-y-4">
        <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-gray-900">Roster Templates Directory</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {totalEntries.toLocaleString()} templates • Real-time data
                  {isFetching && !isLoading ? " • Refreshing..." : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button>

                <Button
                  className="h-9 gap-2 rounded-lg bg-brand-900 px-4 text-white hover:bg-brand-800"
                  onClick={handleCreate}
                >
                  <PlusIcon className="h-4 w-4" />
                  Create template
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Search roster templates" placeholder="Search roster templates…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="pl-10" />
              </div>
              <SearchableSelect aria-label="Filter by template type" widthClass="w-full sm:w-40" value={typeFilter === "all" ? "" : typeFilter} options={TEMPLATE_TYPES} allLabel="All types" onChange={value => { setTypeFilter(value || "all"); setPage(1); }} />
              <SearchableSelect aria-label="Filter by status" widthClass="w-full sm:w-40" value={activeFilter === "all" ? "" : activeFilter} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} allLabel="All statuses" onChange={value => { setActiveFilter(value || "all"); setPage(1); }} />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <SearchableSelect aria-label="Templates per page" widthClass="w-28" allowAll={false} value={String(perPage)} options={[10, 25, 50, 100].map(value => ({ value: String(value), label: String(value) }))} onChange={value => { setPerPage(Number(value)); setPage(1); }} />
                <span>entries</span>
              </div>
              {(search || typeFilter !== "all" || activeFilter !== "all") && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTypeFilter("all"); setActiveFilter("all"); setPage(1); }}>Clear filters</Button>}
            </div>

            <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600">
              <span>Showing <strong className="text-gray-900">{showingFrom}</strong> to <strong className="text-gray-900">{showingTo}</strong> of <strong className="text-gray-900">{totalEntries.toLocaleString()}</strong> entries</span>
              {isFetching && <AppLoader variant="inline" label="Loading…" />}
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" aria-busy={isFetching}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <caption className="sr-only">Roster templates</caption>
                  <thead className="bg-slate-50">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-200">
                        {hg.headers.map((h) => (
                          <th
                            key={h.id}
                            scope="col"
                            aria-sort={h.column.getIsSorted() === "asc" ? "ascending" : h.column.getIsSorted() === "desc" ? "descending" : "none"}
                            className={`whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 ${h.column.id === "actions" ? "w-20 text-right" : h.column.id === "working_days" ? "w-[180px]" : ""}`}

                          >
                            <button type="button" disabled={!h.column.getCanSort()} onClick={h.column.getToggleSortingHandler()} className={`flex items-center gap-1.5 text-left ${h.column.id === "actions" ? "ml-auto" : ""}`}>
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {h.column.getIsSorted() === "asc" ? (
                                <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                              ) : h.column.getIsSorted() === "desc" ? (
                                <ChevronRight className="h-3.5 w-3.5 -rotate-90" />
                              ) : null}
                            </button>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={columns.length} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                            <AppLoader label="Loading roster templates…" />
                          </div>
                        </td>
                      </tr>
                    ) : error ? (<tr><td colSpan={columns.length} className="p-6"><ApiErrorState error={error} onRetry={() => void refetch()} /></td></tr>) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-4 py-16 text-center">
                          <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8">
                            <p className="text-sm font-semibold text-slate-800">No templates found</p>
                            <p className="mt-1 text-sm text-slate-500">
                              Try changing filters or create a new roster template.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="transition hover:bg-slate-50/80">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className={`px-6 py-4 align-middle text-sm text-slate-700 ${cell.column.id === "working_days" ? "w-[180px]" : ""}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!isLoading && rows.length > 0 && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
                  <span className="font-semibold text-slate-900">{totalPages}</span>
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={isFetching || page === 1}
                    className="h-9 w-9 rounded-lg border-slate-200 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="h-9 w-9 rounded-lg border-slate-200 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNumber: number;

                    if (totalPages <= 5) pageNumber = index + 1;
                    else if (page <= 3) pageNumber = index + 1;
                    else if (page >= totalPages - 2) pageNumber = totalPages - 4 + index;
                    else pageNumber = page - 2 + index;

                    return (
                      <Button
                        key={pageNumber}
                        type="button"
                        variant={page === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNumber)}
                        className={cx(
                          "h-9 min-w-9 rounded-lg px-3 text-sm font-semibold",
                          page === pageNumber
                            ? "bg-brand-900 text-white hover:bg-brand-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={isFetching || page === totalPages}
                    className="h-9 w-9 rounded-lg border-slate-200 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="h-9 w-9 rounded-lg border-slate-200 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isModalOpen && <RosterTemplateModal mode={modalMode} item={selectedItem ?? undefined} onClose={() => setIsModalOpen(false)} />}

      <AlertDialog open={!!deleteUuid} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteUuid(null); }}>
        <AlertDialogContent className="rounded-2xl border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-950">
              Delete Template?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              This action cannot be undone. The selected roster template will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); confirmDelete(); }}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
