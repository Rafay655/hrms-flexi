"use client";

import { AppLoader } from "@/components/ui/app-loader";
import { ApiErrorState } from "@/components/ui/api-error-state";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  MoreVertical,
  RefreshCw,
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PlusIcon,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
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
  return date.slice(0, 10);
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
  const employees = useMemo(() => employeesRaw ?? [], [employeesRaw]);

  const employeeOptions: Option[] = useMemo(
    () =>
      employees.map((e) => ({
        value: String(e.uuid),
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
      shifts.map((s) => ({
        value: String(s.uuid ?? s.id),
        label: `${s.name} (${s.code})`,
      })),
    [shifts]
  );

  const { data, isLoading, isFetching, error, refetch } = useShiftAssignments({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_active: isActiveParam,
  });

  const assignments = useMemo(() => data?.data ?? [], [data]);
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

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const [formError, setFormError] = useState("");

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, activeFilter]);



  const fillForm = (item: ShiftAssignment) => {
    setFormError("");
    setSelectedItem(item);
    setFormData({
      employee_id: String(item.employee_id),
      shift_id: String(item.shift_id),
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
    setFormError("");
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
      deleteMutation.mutate(deleteUuid, { onSuccess: () => { setDeleteUuid(null); if (assignments.length === 1 && page > 1) setPage(page - 1); } });
    }
  };

  const handleSave = () => {
    if (isSaving || modalMode === "view") return;
    if (!formData.employee_id) return setFormError("Choose an employee.");
    if (!formData.shift_id) return setFormError("Choose a shift.");
    if (!formData.valid_from) return setFormError("Choose a start date.");
    if (formData.valid_to && formData.valid_to < formData.valid_from) {
      return setFormError("End date must be on or after the start date.");
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
          <div className="max-w-[240px]">
            <div className="font-semibold text-slate-900">
              {row.original.employee?.name ?? row.original.employee_id}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {row.original.employee?.employee_code ?? "—"}
            </div>
          </div>
        ),
      },
      {
        id: "shift",
        header: "Shift",
        cell: ({ row }) => (
          <div className="max-w-[220px]">
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
          <div className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
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
            <div className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
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
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${row.original.employee?.name ?? row.original.employee_id}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44"><DropdownMenuItem onSelect={() => handleView(row.original)}><Eye className="mr-2 h-4 w-4" />View details</DropdownMenuItem><DropdownMenuItem permission="shift_assignment.edit" onSelect={() => handleEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem><DropdownMenuItem permission="shift_assignment.delete" className="text-destructive" onSelect={() => handleDelete(row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
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

  return (
    <div className="p-3">
      <div className="space-y-4">
        <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-gray-900">Shift Assignment Directory</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {totalEntries.toLocaleString()} assignments • Real-time data
                  {isFetching && !isLoading ? " • Refreshing..." : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button>

                <Button
                  className="h-9 gap-2 rounded-lg bg-brand-900 px-4 text-white hover:bg-brand-800"
                  permission="shift_assignment.create" onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  <PlusIcon className="h-4 w-4" />
                  Assign Shift
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1"><SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search shift assignments" placeholder="Search by employee, shift, or code…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="pl-10" /></div>
              <SearchableSelect aria-label="Filter by status" widthClass="w-full sm:w-40" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} value={activeFilter === "all" ? "" : activeFilter} allLabel="All statuses" onChange={value => { setActiveFilter(value || "all"); setPage(1); }} />
              <div className="flex items-center gap-2 text-sm text-gray-600"><span>Show</span><SearchableSelect aria-label="Assignments per page" allowAll={false} widthClass="w-28" value={String(perPage)} options={[10,25,50,100].map(value => ({ value: String(value), label: String(value) }))} onChange={value => { setPerPage(Number(value)); setPage(1); }} /><span>entries</span></div>
              {(search || activeFilter !== "all") && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setActiveFilter("all"); setPage(1); }}>Clear filters</Button>}
            </div>
            <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600"><span>Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of <strong>{totalEntries.toLocaleString()}</strong> entries</span>{isFetching && <AppLoader variant="inline" label="Loading assignments…" />}</div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]"><caption className="sr-only">Shift assignments</caption>
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
                          <AppLoader label="Loading shift assignments…" />
                        </td>
                      </tr>
                    ) : error ? (<tr><td colSpan={columns.length} className="p-6"><ApiErrorState error={error} onRetry={() => void refetch()} /></td></tr>) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100">
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
                    disabled={isFetching || page === 1}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={isFetching || page === 1}
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
                    disabled={isFetching || page === totalPages}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={isFetching || page === totalPages}
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

      <Dialog open={isModalOpen} onOpenChange={open => { if (!isSaving) setIsModalOpen(open); }}>
        <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left"><DialogTitle>{modalMode === "create" ? "Assign shift" : modalMode === "edit" ? "Edit shift assignment" : "Shift assignment details"}</DialogTitle><DialogDescription>Choose an employee and shift, then set when the assignment applies.</DialogDescription></DialogHeader>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => { event.preventDefault(); handleSave(); }} noValidate>
            <fieldset disabled={isSaving || modalMode === "view"} className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5"><label htmlFor="assignment-employee" className="text-sm font-medium">Employee *</label><SearchableSelect id="assignment-employee" allowAll={false} widthClass="w-full" options={employeeOptions.some(option => option.value === formData.employee_id) || !formData.employee_id ? employeeOptions : [...employeeOptions, { value: formData.employee_id, label: selectedItem?.employee?.name ?? `Saved employee (${formData.employee_id})` }]} value={formData.employee_id} placeholder="Choose an employee" disabled={isSaving || modalMode === "view" || isLoadingEmployees} onChange={value => { setFormError(""); setFormData(previous => ({ ...previous, employee_id: value })); }} /></div>
                <div className="min-w-0 space-y-1.5"><label htmlFor="assignment-shift" className="text-sm font-medium">Shift *</label><SearchableSelect id="assignment-shift" allowAll={false} widthClass="w-full" options={shiftOptions.some(option => option.value === formData.shift_id) || !formData.shift_id ? shiftOptions : [...shiftOptions, { value: formData.shift_id, label: selectedItem?.shift?.name ?? `Saved shift (${formData.shift_id})` }]} value={formData.shift_id} placeholder="Choose a shift" disabled={isSaving || modalMode === "view" || isLoadingShifts} onChange={value => { setFormError(""); setFormData(previous => ({ ...previous, shift_id: value })); }} /></div>
              </div>
              <section className="space-y-3 border-t pt-4"><div><h3 className="text-sm font-semibold">Assignment period</h3><p className="mt-1 text-xs text-muted-foreground">Leave the end date empty for an ongoing assignment.</p></div><div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5"><label htmlFor="assignment-from" className="text-sm font-medium">Start date *</label><Input id="assignment-from" type="date" value={formData.valid_from} onChange={event => { setFormError(""); setFormData(previous => ({ ...previous, valid_from: event.target.value })); }} /></div>
                <div className="min-w-0 space-y-1.5"><label htmlFor="assignment-to" className="text-sm font-medium">End date (optional)</label><Input id="assignment-to" type="date" min={formData.valid_from || undefined} value={formData.valid_to ?? ""} onChange={event => { setFormError(""); setFormData(previous => ({ ...previous, valid_to: event.target.value || null })); }} /></div>
              </div></section>
              <label className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3 text-sm"><Checkbox checked={formData.is_active} onCheckedChange={value => setFormData(previous => ({ ...previous, is_active: value === true }))} /><span><span className="block font-medium">Active assignment</span><span className="text-xs text-muted-foreground">Enable this shift assignment for the selected period.</span></span></label>
            </fieldset>
            <DialogFooter className="shrink-0 items-center gap-3 border-t bg-muted/30 px-6 py-4 sm:justify-between"><span className="text-xs text-muted-foreground">{modalMode === "view" ? "Assignment details" : "* Required fields"}</span><div className="flex gap-2"><Button type="button" variant="outline" disabled={isSaving} onClick={() => setIsModalOpen(false)}>{modalMode === "view" ? "Close" : "Cancel"}</Button>{modalMode !== "view" && <Button type="submit" disabled={isSaving} className="bg-brand-900 hover:bg-brand-800">{isSaving ? <AppLoader variant="inline" label="Saving…" /> : modalMode === "create" ? "Assign shift" : "Save changes"}</Button>}</div></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUuid} onOpenChange={open => { if (!open && !deleteMutation.isPending) setDeleteUuid(null); }}>
        <AlertDialogContent className="rounded-lg border-slate-200 bg-white">
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
              onClick={event => { event.preventDefault(); confirmDelete(); }}
              className="rounded-xl bg-rose-600 font-semibold hover:bg-rose-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <AppLoader variant="inline" label="Deleting…" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ShiftAssignmentListingPage;
