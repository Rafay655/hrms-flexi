"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogFooter,
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
import {
  DownloadIcon,
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
  X,
  Sparkles,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import toast from "react-hot-toast";

import { useShifts } from "@/hooks/useShifts";
import {
  useRosterTemplates,
  useCreateRosterTemplate,
  useUpdateRosterTemplate,
  useDeleteRosterTemplate,
} from "@/hooks/useRosterTemplates";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type {
  RosterTemplate,
  RosterTemplateFormData,
  PatternDay,
  Weekday,
  TemplateType,
} from "@/types/roster-template";

const DEFAULT_PER_PAGE = 10;

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
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

  const { data: shiftsRaw, isLoading: isLoadingShifts } = useShifts({ per_page: 1000 });

  const shifts = useMemo(() => {
    if (!shiftsRaw) return [];
    return shiftsRaw?.data?.data ?? [];
  }, [shiftsRaw]);

  const shiftOptions: Option[] = useMemo(
    () => [
      { value: "", label: "Off" },
      ...shifts.map((s: any) => ({
        value: s.uuid ?? s.id,
        label: `${s.name} (${s.code})`,
      })),
    ],
    [shifts]
  );

  const { data, isLoading, isFetching, error } = useRosterTemplates({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    template_type: templateTypeParam,
    is_active: isActiveParam,
  });

  const templates = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const createMutation = useCreateRosterTemplate();
  const updateMutation = useUpdateRosterTemplate();
  const deleteMutation = useDeleteRosterTemplate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<RosterTemplate | null>(null);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  const [formData, setFormData] = useState<RosterTemplateFormData>({
    name: "",
    template_type: "",
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    pattern_data: [],
    auto_generate: false,
    is_active: true,
  });

  const isReadOnly = modalMode === "view";
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, typeFilter, activeFilter]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load templates" });
  }, [error]);

  const resetForm = () => {
    setFormData({
      name: "",
      template_type: "",
      working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      pattern_data: [],
      auto_generate: false,
      is_active: true,
    });
  };

  const fillForm = (item: RosterTemplate) => {
    setFormData({
      name: item.name ?? "",
      template_type: item.template_type ?? "",
      working_days: item.working_days ?? [],
      pattern_data: item.pattern_data?.map((p) => ({ ...p })) ?? [],
      auto_generate: !!item.auto_generate,
      is_active: !!item.is_active,
    });
  };

  const addPatternRow = () => {
    setFormData((prev) => ({
      ...prev,
      pattern_data: [...prev.pattern_data, { day: "monday", shift_id: null, is_off: true }],
    }));
  };

  const removePatternRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pattern_data: prev.pattern_data.filter((_, i) => i !== index),
    }));
  };

  const updatePatternRow = (index: number, field: keyof PatternDay, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.pattern_data];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "shift_id") {
        updated[index].is_off = value === "" || value === null;
      }

      if (field === "is_off" && value === true) {
        updated[index].shift_id = null;
      }

      return { ...prev, pattern_data: updated };
    });
  };

  const handleView = (item: RosterTemplate) => {
    setSelectedItem(item);
    fillForm(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: RosterTemplate) => {
    setSelectedItem(item);
    fillForm(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteUuid) return;
    deleteMutation.mutate(deleteUuid, {
      onSuccess: () => setDeleteUuid(null),
    });
  };

  const toggleWorkingDay = (day: Weekday) => {
    setFormData((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }));
  };

  const handleSave = () => {
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }

    if (trimmedName.length > 100) {
      toast.error("Name must be 100 characters or less");
      return;
    }

    if (!formData.template_type) {
      toast.error("Template type is required");
      return;
    }

    if (formData.working_days.length === 0) {
      toast.error("Select at least one working day");
      return;
    }

    if (formData.pattern_data.length === 0) {
      toast.error("Add at least one pattern row");
      return;
    }

    const payload = {
      ...formData,
      name: trimmedName,
      pattern_data: formData.pattern_data.map((row) => ({
        ...row,
        shift_id: row.is_off ? null : row.shift_id || null,
      })),
    };

    if (modalMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
      return;
    }

    if (selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return templates.map((template: any, index: number) => ({
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
          <div className="flex min-w-[170px] flex-wrap gap-1.5">
            {row.original.working_days?.length ? (
              row.original.working_days.map((day) => (
                <Badge
                  key={day}
                  variant="outline"
                  className="rounded-full border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  {day.slice(0, 3)}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-slate-400">-</span>
            )}
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
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleView(row.original)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteUuid(row.original.id)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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

  const activeCount = rows.filter((template) => template.is_active).length;
  const autoGenerateCount = rows.filter((template) => template.auto_generate).length;
  const totalPatternRows = rows.reduce(
    (sum, template) => sum + (template.pattern_data?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="overflow-hidden rounded-3xl bg-brand-900 shadow-xl shadow-brand-900/10">
          <div className="relative px-5 py-6 sm:px-7 lg:px-8">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_28%),radial-gradient(circle_at_80%_0%,white,transparent_22%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                  <Sparkles className="h-3.5 w-3.5" />
                  TimeSync Configuration
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Roster Template Management
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-white/70">
                  Create reusable roster patterns, configure working days, and assign shift patterns for future schedules.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Total</div>
                  <div className="mt-1 text-2xl font-bold text-white">{totalEntries.toLocaleString()}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Active</div>
                  <div className="mt-1 text-2xl font-bold text-white">{activeCount}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Patterns</div>
                  <div className="mt-1 text-2xl font-bold text-white">{totalPatternRows}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-950">Template Directory</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {showingFrom} to {showingTo} of {totalEntries.toLocaleString()} roster templates
                  {isFetching && !isLoading ? " • Refreshing..." : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  className="h-11 gap-2 rounded-xl bg-brand-900 px-4 font-semibold text-white shadow-lg shadow-brand-900/20 hover:bg-brand-800"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Template
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_170px_180px_190px]">
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search roster templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none transition focus-visible:bg-white focus-visible:ring-brand-900/20"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-brand-900/20">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Types</SelectItem>
                  {TEMPLATE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-brand-900/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <span className="text-xs font-medium text-slate-500">Rows</span>
                <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                  <SelectTrigger className="h-9 w-full border-0 px-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[10, 15, 25, 50, 100].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium ring-1 ring-slate-200">
                  <CalendarDays className="h-4 w-4 text-brand-900" />
                  Page {page} of {totalPages}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium ring-1 ring-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {activeFilter === "all" ? "All templates" : activeFilter === "active" ? "Active only" : "Inactive only"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium ring-1 ring-slate-200">
                  <Sparkles className="h-4 w-4 text-brand-900" />
                  {autoGenerateCount} auto generate
                </span>
              </div>
              {(isLoading || isFetching) && (
                <div className="flex items-center gap-2 text-sm font-medium text-brand-900">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading data
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="bg-slate-50">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-200">
                        {hg.headers.map((h) => (
                          <th
                            key={h.id}
                            className="whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1.5">
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {h.column.getIsSorted() === "asc" ? (
                                <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                              ) : h.column.getIsSorted() === "desc" ? (
                                <ChevronRight className="h-3.5 w-3.5 -rotate-90" />
                              ) : null}
                            </div>
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
                            <Loader2 className="h-6 w-6 animate-spin text-brand-900" />
                            <span className="text-sm font-medium">Loading roster templates...</span>
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
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
                            <td key={cell.id} className="px-4 py-3.5 align-middle text-sm text-slate-700">
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
                    disabled={page === 1}
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
                    disabled={page === totalPages}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-5xl">
          <DialogHeader className="relative overflow-hidden bg-brand-900 px-6 py-6 text-white">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_28%),radial-gradient(circle_at_85%_0%,white,transparent_24%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                  <Sparkles className="h-3.5 w-3.5" />
                  Roster Pattern Setup
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                  {modalMode === "create"
                    ? "Add Roster Template"
                    : modalMode === "edit"
                      ? "Edit Roster Template"
                      : "View Roster Template"}
                </DialogTitle>
                <DialogDescription className="mt-1 max-w-2xl text-sm text-white/70">
                  {isReadOnly
                    ? "Review reusable roster settings, working days, and day-wise shift pattern details."
                    : "Configure reusable roster settings, select working days, and map day-wise shifts in one clean flow."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(92vh-170px)] overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Template Information</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Basic roster template identity and generation settings.</p>
                  </div>
                  <Badge className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-900 hover:bg-brand-50">
                    {modalMode === "create" ? "New" : modalMode === "edit" ? "Editing" : "Read Only"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={isReadOnly}
                      maxLength={100}
                      placeholder="Enter template name"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-brand-900/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Type *</label>
                    <Select
                      value={formData.template_type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, template_type: value as TemplateType }))
                      }
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus:ring-brand-900/20">
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {TEMPLATE_TYPES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    <Checkbox
                      checked={formData.auto_generate}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, auto_generate: checked === true }))
                      }
                      disabled={isReadOnly}
                    />
                    Auto Generate
                  </label>

                  <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    <Checkbox
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_active: checked === true }))
                      }
                      disabled={isReadOnly}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-950">Working Days *</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Choose the days that are normally included in this roster template.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                  {WEEKDAYS.map((day) => {
                    const checked = formData.working_days.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => toggleWorkingDay(day.value)}
                        className={cx(
                          "flex h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70",
                          checked
                            ? "border-brand-900 bg-brand-900 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-900/40 hover:bg-white"
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Pattern Data *</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Add day-wise shifts or mark selected days as off.</p>
                  </div>

                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPatternRow}
                      className="h-9 rounded-xl border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50"
                    >
                      <PlusIcon className="mr-1.5 h-4 w-4" />
                      Add Row
                    </Button>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  {formData.pattern_data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-800">No pattern row added</p>
                      {!isReadOnly && (
                        <p className="mt-1 text-sm text-slate-500">Click Add Row to configure the first pattern day.</p>
                      )}
                    </div>
                  ) : (
                    formData.pattern_data.map((row, index) => (
                      <div
                        key={`${row.day}-${index}`}
                        className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-12 md:items-end"
                      >
                        <div className="space-y-1.5 md:col-span-3">
                          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Day</label>
                          <Select
                            value={row.day}
                            onValueChange={(value) => updatePatternRow(index, "day", value)}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none focus:ring-brand-900/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {WEEKDAYS.map((day) => (
                                <SelectItem key={day.value} value={day.value}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5 md:col-span-5">
                          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Shift</label>
                          <SearchableSelect
                            options={shiftOptions}
                            value={row.shift_id || ""}
                            onChange={(value) => updatePatternRow(index, "shift_id", value as string)}
                            placeholder="Select shift"
                            groupLabel="Shifts"
                            allowAll={false}
                            widthClass="w-full"
                            disabled={isReadOnly || isLoadingShifts || row.is_off}
                            multiple={false}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label
                            className={cx(
                              "flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-3 text-sm font-semibold transition",
                              row.is_off ? "border-amber-200 text-amber-700" : "border-slate-200 text-slate-600"
                            )}
                          >
                            <Checkbox
                              checked={row.is_off}
                              onCheckedChange={(checked) => updatePatternRow(index, "is_off", checked === true)}
                              disabled={isReadOnly}
                            />
                            Off
                          </label>
                        </div>

                        <div className="flex justify-end md:col-span-2">
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-11 rounded-xl px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => removePatternRow(index)}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            {isReadOnly ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-10 rounded-xl border-slate-200 px-5 text-sm font-semibold"
              >
                Close
              </Button>
            ) : (
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="h-10 rounded-xl border-slate-200 px-5 text-sm font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-900/20 hover:bg-brand-800"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Template
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUuid} onOpenChange={() => setDeleteUuid(null)}>
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
              onClick={confirmDelete}
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
