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
  CalendarDays,
  ShieldCheck,
  Sparkles,
  UserRound,
  Clock3,
  ArrowRightLeft,
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

import { useEmployees } from "@/hooks/useEmployees";
import { useShifts } from "@/hooks/useShifts";
import {
  useShiftAssignments,
  useCreateShiftAssignment,
  useUpdateShiftAssignment,
  useDeleteShiftAssignment,
} from "@/hooks/useShiftAssignments";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { ShiftAssignment, ShiftAssignmentFormData } from "@/types/shift-assignment";

const DEFAULT_PER_PAGE = 10;

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function formatDateOnly(date?: string | null) {
  if (!date) return "";
  return date.split("T")[0] ?? date.split(" ")[0] ?? date;
}

function ShiftAssignmentListingPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const isActiveParam =
    activeFilter === "all" ? undefined : activeFilter === "active" ? 1 : 0;

  const { data: employeesRaw, isLoading: isLoadingEmployees } = useEmployees({
    per_page: 1000,
    detailed: 0,
  });
  const employees = employeesRaw ?? [];

  const employeeOptions: Option[] = useMemo(
    () =>
      employees.map((e) => ({
        value: e.uuid,
        label: `${e.employee_code} – ${e.name}`,
      })),
    [employees]
  );

  const { data: shiftsRaw, isLoading: isLoadingShifts } = useShifts({ per_page: 1000 });
  const shifts = useMemo(() => {
    if (!shiftsRaw) return [];
    return shiftsRaw?.data?.data ?? [];
  }, [shiftsRaw]);

  const shiftOptions: Option[] = useMemo(
    () =>
      shifts.map((s: any) => ({
        value: s.uuid ?? s.id,
        label: `${s.name} (${s.code})`,
      })),
    [shifts]
  );

  const { data, isLoading, isFetching, error } = useShiftAssignments({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_active: isActiveParam,
  });

  const assignments = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const createMutation = useCreateShiftAssignment();
  const updateMutation = useUpdateShiftAssignment();
  const deleteMutation = useDeleteShiftAssignment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<ShiftAssignment | null>(null);
  const [formData, setFormData] = useState<ShiftAssignmentFormData>({
    employee_id: "",
    shift_id: "",
    valid_from: "",
    valid_to: null,
    is_active: true,
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, activeFilter]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load shift assignments" });
  }, [error]);

  const fillForm = (item: ShiftAssignment) => {
    setSelectedItem(item);
    setFormData({
      employee_id: item.employee_id,
      shift_id: item.shift_id,
      valid_from: formatDateOnly(item.valid_from),
      valid_to: item.valid_to ? formatDateOnly(item.valid_to) : null,
      is_active: item.is_active,
    });
  };

  const handleView = (item: ShiftAssignment) => {
    fillForm(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: ShiftAssignment) => {
    fillForm(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      employee_id: "",
      shift_id: "",
      valid_from: "",
      valid_to: null,
      is_active: true,
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

  const handleSave = () => {
    if (!formData.employee_id) return toast.error("Employee is required.");
    if (!formData.shift_id) return toast.error("Shift is required.");
    if (!formData.valid_from) return toast.error("Valid from is required.");
    if (formData.valid_to && formData.valid_to < formData.valid_from) {
      return toast.error("Valid to must be after valid from.");
    }

    const payload = { ...formData };

    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (modalMode === "edit" && selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const columns: ColumnDef<ShiftAssignment & { sr: number }>[] = useMemo(
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
        id: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <div className="font-semibold text-slate-900">
              {row.original.employee?.name ?? row.original.employee_id}
            </div>
            <div className="mt-0.5 inline-flex rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-brand-900 shadow-sm">
              {row.original.employee?.employee_code ?? "—"}
            </div>
          </div>
        ),
      },
      {
        id: "shift",
        header: "Shift",
        cell: ({ row }) => (
          <div className="min-w-[190px]">
            <div className="font-semibold text-slate-900">
              {row.original.shift?.name ?? row.original.shift_id}
            </div>
            <div className="mt-0.5 text-xs font-medium text-slate-500">
              {row.original.shift?.code ?? "—"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "valid_from",
        header: "Valid From",
        cell: ({ row }) => (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            <CalendarDays className="h-3.5 w-3.5 text-brand-900" />
            {formatDateOnly(row.original.valid_from)}
          </div>
        ),
      },
      {
        accessorKey: "valid_to",
        header: "Valid To",
        cell: ({ row }) => {
          const date = row.original.valid_to;
          if (!date) {
            return (
              <Badge className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-900 hover:bg-brand-50">
                Ongoing
              </Badge>
            );
          }

          return (
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              <CalendarDays className="h-3.5 w-3.5 text-brand-900" />
              {formatDateOnly(date)}
            </div>
          );
        },
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
        cell: ({ row }) => (
          <div className="flex justify-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(row.original)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-brand-50 hover:text-brand-900"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return assignments.map((a, idx) => ({ ...a, sr: startSr + idx + 1 }));
  }, [assignments, page, perPage]);

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
  const activeCount = rows.filter((a) => a.is_active).length;
  const ongoingCount = rows.filter((a) => !a.valid_to).length;

  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-6">
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
                  Shift Assignment Management
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-white/70">
                  Assign shifts to employees, manage validity periods, and monitor active or ongoing employee schedules.
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
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Ongoing</div>
                  <div className="mt-1 text-2xl font-bold text-white">{ongoingCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-950">Assignment Directory</CardTitle>
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
                  Assign Shift
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_190px]">
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by employee, shift, or code..."
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
                  {activeFilter === "all" ? "All assignments" : activeFilter === "active" ? "Active only" : "Inactive only"}
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
                <table className="w-full min-w-[980px]">
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
                          <div className="mt-3 text-sm font-medium text-slate-600">Loading assignments...</div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <ArrowRightLeft className="h-7 w-7 text-slate-400" />
                          </div>
                          <div className="mt-4 text-sm font-semibold text-slate-900">No assignments found</div>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[760px]">
          <DialogHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-950">
                  {modalMode === "create"
                    ? "Add Shift Assignment"
                    : modalMode === "edit"
                      ? "Edit Assignment"
                      : "View Assignment"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  {modalMode === "view"
                    ? "Read-only assignment details."
                    : "Select an employee, choose a shift, and define the assignment validity period."}
                </DialogDescription>
              </div>
              <Badge className="rounded-full bg-brand-900 px-3 py-1 text-white hover:bg-brand-900">
                {modalMode === "create" ? "New" : modalMode === "edit" ? "Editing" : "View"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 px-6 py-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assignment Details</h3>
                  <p className="text-xs text-slate-500">Employee and shift mapping information.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Employee *</label>
                  <SearchableSelect
                    options={employeeOptions}
                    value={formData.employee_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, employee_id: v as string }))}
                    placeholder="Select employee"
                    groupLabel="Employees"
                    allowAll={false}
                    widthClass="w-full"
                    disabled={modalMode === "view" || isLoadingEmployees}
                    multiple={false}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Shift *</label>
                  <SearchableSelect
                    options={shiftOptions}
                    value={formData.shift_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, shift_id: v as string }))}
                    placeholder="Select shift"
                    groupLabel="Shifts"
                    allowAll={false}
                    widthClass="w-full"
                    disabled={modalMode === "view" || isLoadingShifts}
                    multiple={false}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Validity Period</h3>
                  <p className="text-xs text-slate-500">Control when this employee shift assignment starts and ends.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Valid From *</label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData((p) => ({ ...p, valid_from: e.target.value }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Valid To</label>
                  <Input
                    type="date"
                    value={formData.valid_to ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, valid_to: e.target.value || null }))}
                    disabled={modalMode === "view"}
                    min={formData.valid_from}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Active Assignment
                  <Checkbox
                    checked={formData.is_active}
                    onCheckedChange={(c) => setFormData((p) => ({ ...p, is_active: !!c }))}
                    disabled={modalMode === "view"}
                  />
                </label>
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
                  Save Assignment
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

      <AlertDialog open={!!deleteUuid} onOpenChange={() => setDeleteUuid(null)}>
        <AlertDialogContent className="rounded-3xl border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-950">Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This action cannot be undone. The selected shift assignment will be removed permanently.
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

export default ShiftAssignmentListingPage;
