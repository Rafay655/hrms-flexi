// app/(system)/pay-edge/payroll-periods/page.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  Eye,
  Pencil,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  CalendarDays,
  Clock,
  Users,
  Banknote,
  Workflow,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  usePayrollPeriodsList,
  useCreatePayrollPeriod,
  useUpdatePayrollPeriod,
} from "@/hooks/usePayrollPeriods";
import type { PayrollPeriod, PeriodFormPayload } from "@/types/payroll-period";

/* ----------------------------------------------------------------------- */
/* Default form                                                            */
/* ----------------------------------------------------------------------- */

const DEFAULT_FORM: PeriodFormPayload = {
  period_month: new Date().getMonth() + 1,
  period_year: new Date().getFullYear(),
  start_date: "",
  end_date: "",
  attendance_cutoff_date: "",
  processing_deadline: "",
  notes: "",
  auto_create_workflow: false,
  workflow_run_type: "regular",
};

/* ----------------------------------------------------------------------- */
/* UI helpers                                                              */
/* ----------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "border-blue-200 bg-blue-50 text-blue-700",
    processing: "border-amber-200 bg-amber-50 text-amber-700",
    review: "border-orange-200 bg-orange-50 text-orange-700",
    locked: "border-purple-200 bg-purple-50 text-purple-700",
    paid: "border-green-200 bg-green-50 text-green-700",
    reversed: "border-red-200 bg-red-50 text-red-700",
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize ${map[status] ?? "border-gray-200"}`}>
      {status}
    </Badge>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </Label>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <Icon className="h-4 w-4 text-[#1E1B4B]" />
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Main Page Component                                                      */
/* ----------------------------------------------------------------------- */

export default function PayrollPeriodsPage() {
  const queryClient = useQueryClient();

  // ── Table state ──────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // ── Modal states ─────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);
  const [viewPeriod, setViewPeriod] = useState<PayrollPeriod | null>(null);

  // ── Form state ───────────────────────────────────
  const [form, setForm] = useState<PeriodFormPayload>(DEFAULT_FORM);

  // ── Data fetching via hooks ─────────────────────
  const { data, isLoading, isFetching } = usePayrollPeriodsList(page, perPage);
  const periods: PayrollPeriod[] = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // ── Mutations via hooks ─────────────────────────
  const createMutation = useCreatePayrollPeriod();
  const updateMutation = useUpdatePayrollPeriod();

  // ── Close & reset form ──────────────────────────
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPeriod(null);
    setForm(DEFAULT_FORM);
    setFormMode("create");
  };

  const openCreate = () => {
    setFormMode("create");
    setForm(DEFAULT_FORM);
    setEditingPeriod(null);
    setIsFormOpen(true);
  };

  const openEdit = (period: PayrollPeriod) => {
    setFormMode("edit");
    setEditingPeriod(period);
    setForm({
      period_month: period.period_month,
      period_year: period.period_year,
      start_date: period.start_date,
      end_date: period.end_date,
      attendance_cutoff_date: period.attendance_cutoff_date,
      processing_deadline: period.processing_deadline,
      notes: period.notes ?? "",
      auto_create_workflow: period.has_active_workflow,
      workflow_run_type: (period.active_workflow?.run_type as "regular" | "supplementary" | "bonus" | undefined) ?? "regular",
    });
    setIsFormOpen(true);
  };

  // Determine editable statuses
  const isEditable = (status: string) =>
    ["open", "processing", "review"].includes(status);

  // ── Columns definition ────────────────────────────
  const columns: ColumnDef<PayrollPeriod & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "SR. NO.",
        cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.sr}</div>,
      },
      {
        accessorKey: "period_label",
        header: "Period",
        cell: ({ row }) => (
          <div className="font-semibold text-gray-900">{row.original.period_label}</div>
        ),
      },
      {
        id: "dates",
        header: "Dates",
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">
            {row.original.start_date} → {row.original.end_date}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "active_workflow",
        header: "Active Workflow",
        cell: ({ row }) => {
          const wf = row.original.active_workflow;
          return wf ? (
            <div className="text-xs text-gray-700">
              {wf.run_type} · Step: {wf.processing_step}
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const period = row.original;
          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewPeriod(period)}>
                    <Eye className="mr-2 h-3.5 w-3.5" /> View
                  </DropdownMenuItem>
                  {isEditable(period.status) && (
                    <DropdownMenuItem onClick={() => openEdit(period)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  // ── Add serial numbers ───────────────────────────
  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return periods.map((p, idx) => ({ ...p, sr: startSr + idx + 1 }));
  }, [periods, page, perPage]);

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

  const isFormValid =
    !!form.start_date &&
    !!form.end_date &&
    !!form.attendance_cutoff_date &&
    !!form.processing_deadline;

  const handleSubmit = () => {
    if (formMode === "create") {
      createMutation.mutate(form, {
        onSuccess: () => {
          toast.success("Period created.");
          closeForm();
        },
        onError: (err: any) => {
          showApiError(err, { fallbackMessage: err?.response?.data?.message ?? "Could not create period." });
        },
      });
    } else if (editingPeriod) {
      updateMutation.mutate(
        { uuid: editingPeriod.id, payload: form },
        {
          onSuccess: () => {
            toast.success("Period updated.");
            closeForm();
          },
          onError: (err: any) => {
            showApiError(err, { fallbackMessage: err?.response?.data?.message ?? "Could not update period." });
          },
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Payroll Periods
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} periods · Manage processing cycles
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" /> New Period
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search periods..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => {
                  setPerPage(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full border-gray-300">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-600">Showing</span>
              <span className="font-semibold mx-1">{showingFrom}</span>
              <span className="text-gray-600">to</span>
              <span className="font-semibold mx-1">{showingTo}</span>
              <span className="text-gray-600">of</span>
              <span className="font-semibold mx-1">{totalEntries}</span>
              <span className="text-gray-600">entries</span>
            </div>
            {(isLoading || isFetching) && (
              <Badge className="ml-2">
                <Loader2 className="h-3 w-3 animate-spin" />
              </Badge>
            )}
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronLeft className="h-4 w-4" />
                            ) : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading periods...</p>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center text-gray-500">
                        No payroll periods found.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-4 px-6 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && rows.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="border-gray-300">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="border-gray-300">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = page - 2 + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={
                              page === pageNum
                                ? "bg-[#1E1B4B] hover:bg-[#2A2675]"
                                : "border-gray-300 hover:bg-gray-100"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="border-gray-300">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="border-gray-300">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{showingFrom}</span> – <span className="font-semibold">{showingTo}</span> of{" "}
                    <span className="font-semibold">{totalEntries}</span> entries
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Create / Edit Period Modal ─────────────── */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E1B4B]">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {formMode === "create" ? "New Payroll Period" : "Edit Payroll Period"}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {formMode === "create"
                    ? "Define a new processing cycle."
                    : "Update the processing cycle details."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
            {/* Period identity */}
            <div className="space-y-3">
              <SectionHeading icon={CalendarDays} title="Period" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Month *</FieldLabel>
                  <Select
                    value={form.period_month.toString()}
                    onValueChange={(v) => setForm({ ...form, period_month: Number(v) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(0, i).toLocaleString("default", { month: "long" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Year *</FieldLabel>
                  <Input
                    type="number"
                    value={form.period_year}
                    onChange={(e) => setForm({ ...form, period_year: Number(e.target.value) })}
                    min={2000}
                    max={2100}
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <SectionHeading icon={Clock} title="Key Dates" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Start Date *</FieldLabel>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>End Date *</FieldLabel>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>Attendance Cutoff *</FieldLabel>
                  <Input
                    type="date"
                    value={form.attendance_cutoff_date}
                    onChange={(e) => setForm({ ...form, attendance_cutoff_date: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>Processing Deadline *</FieldLabel>
                  <Input
                    type="date"
                    value={form.processing_deadline}
                    onChange={(e) => setForm({ ...form, processing_deadline: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <SectionHeading icon={Info} title="Notes" />
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Optional notes..."
              />
            </div>

            {/* Workflow – read‑only during edit */}
            <div className="space-y-3">
              <SectionHeading icon={Workflow} title="Workflow" />
              <div className={`rounded-lg border border-gray-200 p-4 ${formMode === "edit" ? "bg-gray-50/50" : ""}`}>
                <label
                  className={`flex items-start gap-3 text-sm ${
                    formMode === "edit" ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.auto_create_workflow ?? false}
                    onChange={(e) =>
                      setForm({ ...form, auto_create_workflow: e.target.checked })
                    }
                    disabled={formMode === "edit"}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#1E1B4B] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span>
                    <span className="font-medium text-gray-900">Auto-create workflow</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {formMode === "edit"
                        ? "Workflow settings cannot be modified after the period has been created."
                        : "Automatically starts a processing workflow as soon as this period is created."}
                    </span>
                  </span>
                </label>
                {form.auto_create_workflow && (
                  <div className="mt-4 pl-7">
                    <FieldLabel>Workflow Run Type</FieldLabel>
                    <Select
                      value={form.workflow_run_type ?? "regular"}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          workflow_run_type: v as "regular" | "supplementary" | "bonus",
                        })
                      }
                      disabled={formMode === "edit"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="supplementary">Supplementary</SelectItem>
                        <SelectItem value="bonus">Bonus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <Button variant="outline" onClick={closeForm} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !isFormValid}
              className="bg-[#1E1B4B] hover:bg-[#2A2675] text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {formMode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : formMode === "create" ? (
                "Create Period"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Period Modal ──────────────────────── */}
      <Dialog open={!!viewPeriod} onOpenChange={() => setViewPeriod(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
          {viewPeriod && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E1B4B]">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{viewPeriod.period_label}</DialogTitle>
                      <DialogDescription className="mt-0.5">
                        Payroll period overview
                      </DialogDescription>
                    </div>
                  </div>
                  <StatusBadge status={viewPeriod.status} />
                </div>
              </DialogHeader>

              <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
                <div className="space-y-3">
                  <SectionHeading icon={Clock} title="Key Dates" />
                  <div className="grid grid-cols-2 gap-3">
                    <DetailTile label="Start Date" value={viewPeriod.start_date} />
                    <DetailTile label="End Date" value={viewPeriod.end_date} />
                    <DetailTile label="Cutoff Date" value={viewPeriod.attendance_cutoff_date} />
                    <DetailTile label="Deadline" value={viewPeriod.processing_deadline} />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionHeading icon={Banknote} title="Financials" />
                  <div className="grid grid-cols-2 gap-3">
                    <DetailTile
                      label="Employees"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {viewPeriod.employee_count ?? "—"}
                        </span>
                      }
                    />
                    <DetailTile
                      label="Total Net"
                      value={
                        viewPeriod.total_net
                          ? `PKR ${Number(viewPeriod.total_net).toLocaleString()}`
                          : "—"
                      }
                    />
                  </div>
                </div>

                {viewPeriod.has_active_workflow && viewPeriod.active_workflow ? (
                  <div className="space-y-3">
                    <SectionHeading icon={Workflow} title="Active Workflow" />
                    <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Run Type</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {viewPeriod.active_workflow.run_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Step</span>
                        <span className="font-medium text-gray-900">
                          {viewPeriod.active_workflow.processing_step}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Started</span>
                        <span className="font-medium text-gray-900">
                          {new Date(viewPeriod.active_workflow.started_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400">
                    <Info className="h-4 w-4" />
                    No active workflow for this period.
                  </div>
                )}
              </div>

              <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <Button variant="outline" onClick={() => setViewPeriod(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}