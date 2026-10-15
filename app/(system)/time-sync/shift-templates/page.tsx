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
  Clock3,
  CalendarDays,
  Moon,
  ShieldCheck,
  Sparkles,
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

import { useShiftArchetypes } from "@/hooks/useShiftArchetypes";
import { useAttendancePolicies } from "@/hooks/useAttendancePolicies";
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
} from "@/hooks/useShifts";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { Shift, ShiftFormData, Weekday } from "@/types/shift";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {  MoreHorizontal} from "lucide-react";
const DEFAULT_PER_PAGE = 15;

const SHIFT_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "rotational", label: "Rotational" },
  { value: "flexible", label: "Flexible" },
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

function ShiftListingPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const isActiveParam = activeFilter === "all" ? undefined : activeFilter === "active" ? 1 : 0;

  // Fetch archetypes
  const { data: archetypesRaw, isLoading: isLoadingArchetypes } = useShiftArchetypes({
    per_page: 1000,
  });
  const archetypes = useMemo(() => {
    if (!archetypesRaw) return [];
    return archetypesRaw?.data?.data ?? [];
  }, [archetypesRaw]);

  const archetypeOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...archetypes.map((a: any) => ({ value: String(a.uuid ?? a.id), label: a.name })),
    ],
    [archetypes]
  );

  // Fetch attendance policies
  const { data: policiesRaw, isLoading: isLoadingPolicies } = useAttendancePolicies({
    per_page: 1000,
  });
  const policies = useMemo(() => {
    if (!policiesRaw) return [];
    return policiesRaw?.data?.data ?? [];
  }, [policiesRaw]);

  const policyOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...policies.map((p: any) => ({ value: String(p.id ?? p.uuid), label: p.policy_name })),
    ],
    [policies]
  );

  // Fetch shifts
  const { data, isLoading, isFetching, error } = useShifts({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_active: isActiveParam,
  });

  const shifts = data?.data?.data ?? [];
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = data?.data?.meta?.last_page ?? 1;

  const createMutation = useCreateShift();
  const updateMutation = useUpdateShift();
  const deleteMutation = useDeleteShift();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<Shift | null>(null);
  const [formData, setFormData] = useState<ShiftFormData & { attendance_policy_id?: string }>({
    shift_archetype_id: "",
    name: "",
    code: "",
    shift_type: "",
    start_time: "09:00",
    end_time: "18:00",
    is_night_shift: false,
    grace_minutes: 15,
    early_out_grace_minutes: 10,
    break_duration_minutes: 60,
    overtime_allowed: false,
    ot_threshold_minutes: 30,
    max_ot_minutes_per_day: "",
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    is_active: true,
    attendance_policy_id: "",
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, activeFilter]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load shifts" });
  }, [error]);

  const fillForm = (item: Shift) => {
    setSelectedItem(item);
    setFormData({
      shift_archetype_id: item.shift_archetype_id ?? "",
      name: item.name,
      code: item.code,
      shift_type: item.shift_type,
      start_time: item.start_time,
      end_time: item.end_time,
      is_night_shift: item.is_night_shift,
      grace_minutes: item.grace_minutes,
      early_out_grace_minutes: item.early_out_grace_minutes,
      break_duration_minutes: item.break_duration_minutes,
      overtime_allowed: item.overtime_allowed,
      ot_threshold_minutes: item.ot_threshold_minutes,
      max_ot_minutes_per_day: item.max_ot_minutes_per_day?.toString() ?? "",
      working_days: item.working_days,
      is_active: item.is_active,
      attendance_policy_id: (item as any).attendance_policy_id ?? "", // if the API returns it
    });
  };

  const handleView = (item: Shift) => {
    fillForm(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: Shift) => {
    fillForm(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      shift_archetype_id: "",
      name: "",
      code: "",
      shift_type: "",
      start_time: "09:00",
      end_time: "18:00",
      is_night_shift: false,
      grace_minutes: 15,
      early_out_grace_minutes: 10,
      break_duration_minutes: 60,
      overtime_allowed: false,
      ot_threshold_minutes: 30,
      max_ot_minutes_per_day: "",
      working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      is_active: true,
      attendance_policy_id: "",
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => setDeleteUuid(uuid);
  const confirmDelete = () => {
    if (deleteUuid) {
      deleteMutation.mutate(deleteUuid, { onSuccess: () => setDeleteUuid(null) });
    }
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
    const trimmedCode = formData.code.trim();
    if (!trimmedName) return toast.error("Name is required.");
    if (trimmedName.length > 100) return toast.error("Name cannot exceed 100 characters.");
    if (!trimmedCode) return toast.error("Code is required.");
    if (trimmedCode.length > 20) return toast.error("Code cannot exceed 20 characters.");
    if (!formData.shift_type) return toast.error("Shift type is required.");
    if (!formData.start_time) return toast.error("Start time is required.");
    if (!formData.end_time) return toast.error("End time is required.");
    if (formData.working_days.length === 0) return toast.error("Select at least one working day.");

    const payload = { ...formData, name: trimmedName, code: trimmedCode };

    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (modalMode === "edit" && selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  // Table columns
  const columns: ColumnDef<Shift & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "#",
        cell: ({ row }) => (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
            {row.original.sr}
          </div>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <div className="inline-flex rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-brand-900 shadow-sm">
            {row.original.code}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Shift Name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900">{row.original.name}</div>
            <div className="mt-0.5 text-xs text-slate-500">
              {row.original.working_days?.length ?? 0} working days
            </div>
          </div>
        ),
      },
      {
        accessorKey: "shift_type",
        header: "Type",
        cell: ({ row }) => (
          <Badge className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-900 hover:bg-brand-50">
            {row.original.shift_type}
          </Badge>
        ),
      },
      {
        id: "timing",
        header: "Timing",
        cell: ({ row }) => (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            <Clock3 className="h-3.5 w-3.5 text-brand-900" />
            {row.original.start_time} – {row.original.end_time}
          </div>
        ),
      },
      {
        id: "archetype",
        header: "Archetype",
        cell: ({ row }) => (
          <div className="max-w-[180px] truncate text-sm font-medium text-slate-700">
            {row.original.shift_archetype?.name ?? "—"}
          </div>
        ),
      },
      {
        accessorKey: "is_night_shift",
        header: "Night",
        cell: ({ row }) =>
          row.original.is_night_shift ? (
            <Badge className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50">
              <Moon className="mr-1 h-3 w-3" /> Yes
            </Badge>
          ) : (
            <Badge className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              No
            </Badge>
          ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.is_active
                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                : "rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            }
          >
            <span
              className={
                row.original.is_active
                  ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"
                  : "mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-500"
              }
            />
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
 {
  id: "actions",
  header: () => <div className="text-center">Actions</div>,
  cell: ({ row }) => {
    const shift = row.original;

    return (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
            >
              <MoreHorizontal className="h-4 w-4 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-44 rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <DropdownMenuItem
              onClick={() => handleView(shift)}
              className="cursor-pointer gap-2 text-sm"
            >
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleEdit(shift)}
              className="cursor-pointer gap-2 text-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => handleDelete(shift.uuid)}
              className="cursor-pointer gap-2 text-sm text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
}
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return shifts.map((s, idx) => ({ ...s, sr: startSr + idx + 1 }));
  }, [shifts, page, perPage]);

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
  const activeCount = rows.filter((s) => s.is_active).length;
  const nightCount = rows.filter((s) => s.is_night_shift).length;

  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Header */}
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
                  Shifts Management
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-white/70">
                  Create, manage, and monitor employee shift rules with timing, overtime, night shift, and working day controls.
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
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Night</div>
                  <div className="mt-1 text-2xl font-bold text-white">{nightCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-950">Shift Directory</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {showingFrom} to {showingTo} of {totalEntries.toLocaleString()} records
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
                  Add Shift
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            {/* Filters */}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_190px]">
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by shift name, code, or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none transition focus-visible:bg-white focus-visible:ring-brand-900/20"
                />
              </div>

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
                    <SelectValue placeholder="15" />
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

            {/* Stats Bar */}
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium ring-1 ring-slate-200">
                  <CalendarDays className="h-4 w-4 text-brand-900" />
                  Page {page} of {totalPages}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium ring-1 ring-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {activeFilter === "all" ? "All records" : activeFilter === "active" ? "Active only" : "Inactive only"}
                </span>
              </div>
              {(isLoading || isFetching) && (
                <div className="flex items-center gap-2 text-sm font-medium text-brand-900">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading data
                </div>
              )}
            </div>

            {/* Table */}
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
                            <div className="flex cursor-pointer items-center gap-1.5">
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {h.column.getIsSorted() === "asc" ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                              ) : h.column.getIsSorted() === "desc" ? (
                                <ChevronLeft className="h-3.5 w-3.5" />
                              ) : null}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-900" />
                          <div className="mt-3 text-sm font-medium text-slate-600">Loading shifts...</div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <CalendarDays className="h-7 w-7 text-slate-400" />
                          </div>
                          <div className="mt-4 text-sm font-semibold text-slate-900">No shifts found</div>
                          <div className="mt-1 text-sm text-slate-500">Try changing search or filters.</div>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="transition hover:bg-slate-50/80">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
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

            {/* Pagination */}
            {!isLoading && rows.length > 0 && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{showingFrom}</span> to{" "}
                  <span className="font-semibold text-slate-800">{showingTo}</span> of{" "}
                  <span className="font-semibold text-slate-800">{totalEntries}</span> entries
                </p>

                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let num;
                    if (totalPages <= 5) num = i + 1;
                    else if (page <= 3) num = i + 1;
                    else if (page >= totalPages - 2) num = totalPages - 4 + i;
                    else num = page - 2 + i;
                    return (
                      <Button
                        key={num}
                        variant={page === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(num)}
                        className={
                          page === num
                            ? "h-9 min-w-9 rounded-lg bg-brand-900 px-3 text-white hover:bg-brand-800"
                            : "h-9 min-w-9 rounded-lg border-slate-200 px-3"
                        }
                      >
                        {num}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[860px]">
          <DialogHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-950">
                  {modalMode === "create" ? "Add Shift" : modalMode === "edit" ? "Edit Shift" : "View Shift"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  {modalMode === "view"
                    ? "Read-only shift configuration details."
                    : "Configure shift timing, overtime settings, and working days."}
                </DialogDescription>
              </div>
              <Badge className="rounded-full bg-brand-900 px-3 py-1 text-white hover:bg-brand-900">
                {modalMode === "create" ? "New" : modalMode === "edit" ? "Editing" : "View"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 px-6 py-5">
            {/* Basic Information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Basic Information</h3>
                  <p className="text-xs text-slate-500">Name, code, type and assigned archetype / policy.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Archetype */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Archetype</label>
                  <SearchableSelect
                    options={archetypeOptions}
                    value={formData.shift_archetype_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, shift_archetype_id: v as string }))}
                    placeholder="Select archetype (optional)"
                    groupLabel="Archetypes"
                    allowAll={false}
                    widthClass="w-full"
                    disabled={modalMode === "view" || isLoadingArchetypes}
                    multiple={false}
                  />
                </div>

                {/* Attendance Policy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Attendance Policy
                  </label>
                  <SearchableSelect
                    options={policyOptions}
                    value={formData.attendance_policy_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, attendance_policy_id: v as string }))}
                    placeholder="Select policy (optional)"
                    groupLabel="Policies"
                    allowAll={false}
                    widthClass="w-full"
                    disabled={modalMode === "view" || isLoadingPolicies}
                    multiple={false}
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={100}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                {/* Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Code *</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={20}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 font-mono focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Type *</label>
                  <Select
                    value={formData.shift_type}
                    onValueChange={(v) => setFormData((p) => ({ ...p, shift_type: v as any }))}
                    disabled={modalMode === "view"}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-brand-900/20">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {SHIFT_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Timing & Rules */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Timing & Rules</h3>
                  <p className="text-xs text-slate-500">Shift duration, grace time, breaks and overtime limits.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Start Time *</label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData((p) => ({ ...p, start_time: e.target.value }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">End Time *</label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData((p) => ({ ...p, end_time: e.target.value }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Break Duration</label>
                  <Input
                    type="number"
                    min={0}
                    max={1440}
                    value={formData.break_duration_minutes}
                    onChange={(e) => setFormData((p) => ({ ...p, break_duration_minutes: Number(e.target.value) || 0 }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Grace Minutes</label>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={formData.grace_minutes}
                    onChange={(e) => setFormData((p) => ({ ...p, grace_minutes: Number(e.target.value) || 0 }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Early Out Grace</label>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={formData.early_out_grace_minutes}
                    onChange={(e) => setFormData((p) => ({ ...p, early_out_grace_minutes: Number(e.target.value) || 0 }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">OT Threshold</label>
                  <Input
                    type="number"
                    min={0}
                    max={1440}
                    value={formData.ot_threshold_minutes}
                    onChange={(e) => setFormData((p) => ({ ...p, ot_threshold_minutes: Number(e.target.value) || 0 }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Max OT / Day</label>
                  <Input
                    type="number"
                    min={0}
                    max={1440}
                    value={formData.max_ot_minutes_per_day}
                    onChange={(e) => setFormData((p) => ({ ...p, max_ot_minutes_per_day: e.target.value }))}
                    disabled={modalMode === "view"}
                    placeholder="Optional"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  {
                    key: "is_night_shift",
                    label: "Night Shift",
                    checked: formData.is_night_shift,
                    onChange: (checked: boolean) => setFormData((p) => ({ ...p, is_night_shift: checked })),
                  },
                  {
                    key: "overtime_allowed",
                    label: "Overtime Allowed",
                    checked: formData.overtime_allowed,
                    onChange: (checked: boolean) => setFormData((p) => ({ ...p, overtime_allowed: checked })),
                  },
                  {
                    key: "is_active",
                    label: "Active Shift",
                    checked: formData.is_active,
                    onChange: (checked: boolean) => setFormData((p) => ({ ...p, is_active: checked })),
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    {item.label}
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(c) => item.onChange(!!c)}
                      disabled={modalMode === "view"}
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* Working Days */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Working Days *</h3>
                  <p className="text-xs text-slate-500">Select at least one weekday for this shift.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                {WEEKDAYS.map((day) => {
                  const selected = formData.working_days.includes(day.value);
                  return (
                    <button
                      type="button"
                      key={day.value}
                      onClick={() => modalMode !== "view" && toggleWorkingDay(day.value)}
                      disabled={modalMode === "view"}
                      className={
                        selected
                          ? "rounded-xl border border-brand-900 bg-brand-900 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/15"
                          : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900"
                      }
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            {modalMode !== "view" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border-slate-200 bg-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-brand-900 px-5 font-semibold text-white hover:bg-brand-800"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Shift
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border-slate-200 bg-white"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUuid} onOpenChange={() => setDeleteUuid(null)}>
        <AlertDialogContent className="rounded-3xl border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-950">Delete Shift?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This action cannot be undone. The selected shift will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-rose-600 font-semibold hover:bg-rose-700"
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

export default ShiftListingPage;