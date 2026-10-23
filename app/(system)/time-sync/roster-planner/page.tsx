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
  MoreVertical,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import toast from "react-hot-toast";

import { useEmployees } from "@/hooks/useEmployees";
import { useShifts } from "@/hooks/useShifts";
import { useRosterTemplates } from "@/hooks/useRosterTemplates";
import {
  useRosters,
  useCreateRoster,
  useUpdateRoster,
  useDeleteRoster,
  usePublishRosters,
} from "@/hooks/useRosters";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { RosterAssignment, RosterFormData, RosterStatus } from "@/types/roster";

const DEFAULT_PER_PAGE = 10;

const STATUS_OPTIONS: { value: RosterStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "cancelled", label: "Cancelled" },
];

const RosterListingPage: React.FC = () => {
  // Table state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilterId, setEmployeeFilterId] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const changePage = (value: React.SetStateAction<number>) => { setSelectedIds([]); setPage(value); };

  // Fetch dropdown data
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
  const shifts = useMemo(() => shiftsRaw?.data?.data ?? [], [shiftsRaw]);
  const shiftOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...shifts.map((s) => ({
        value: String(s.uuid ?? s.id),
        label: `${s.name} (${s.code})`,
      })),
    ],
    [shifts]
  );

  const { data: templatesRaw, isLoading: isLoadingTemplates } = useRosterTemplates({
    per_page: 1000,
  });
  const templates = useMemo(() => templatesRaw?.data ?? [], [templatesRaw]);
  const templateOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...templates.map((t) => ({
        value: String(t.id),
        label: t.name,
      })),
    ],
    [templates]
  );

  // Fetch roster data
  const { data, isLoading, isFetching, error, refetch } = useRosters({
    page,
    per_page: perPage,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    employee_id: employeeFilterId || undefined,
  });

  const rosters = useMemo(() => data?.data ?? [], [data]);
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // Mutations
  const createMutation = useCreateRoster();
  const updateMutation = useUpdateRoster();
  const deleteMutation = useDeleteRoster();
  const publishMutation = usePublishRosters();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<RosterAssignment | null>(null);
  const [formData, setFormData] = useState<RosterFormData>({
    employee_id: "",
    shift_id: "",
    roster_date: "",
    is_weekly_off: false,
    is_holiday: false,
    status: "draft",
    notes: "",
    template_id: "",
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [perPage, dateFrom, dateTo, statusFilter, employeeFilterId]);



  // CRUD handlers
  const handleView = (item: RosterAssignment) => {
    setSelectedItem(item);
    setFormData({
      employee_id: String(item.employee_id),
      shift_id: item.shift_id == null ? "" : String(item.shift_id),
      roster_date: item.roster_date.slice(0, 10),
      is_weekly_off: item.is_weekly_off,
      is_holiday: item.is_holiday,
      status: item.status,
      notes: item.notes ?? "",
      template_id: item.template_id == null ? "" : String(item.template_id),
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: RosterAssignment) => {
    setSelectedItem(item);
    setFormData({
      employee_id: String(item.employee_id),
      shift_id: item.shift_id == null ? "" : String(item.shift_id),
      roster_date: item.roster_date.slice(0, 10),
      is_weekly_off: item.is_weekly_off,
      is_holiday: item.is_holiday,
      status: item.status,
      notes: item.notes ?? "",
      template_id: item.template_id == null ? "" : String(item.template_id),
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      employee_id: "",
      shift_id: "",
      roster_date: new Date().toLocaleDateString("en-CA"),
      is_weekly_off: false,
      is_holiday: false,
      status: "draft",
      notes: "",
      template_id: "",
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => setDeleteUuid(uuid);

  const confirmDelete = () => {
    if (deleteUuid) {
      deleteMutation.mutate(deleteUuid, { onSuccess: () => { setDeleteUuid(null); setSelectedIds(ids => ids.filter(id => id !== deleteUuid)); if (rosters.length === 1 && page > 1) setPage(page - 1); } });
    }
  };

  const handleSave = () => {
    if (!formData.employee_id) {
      toast.error("Employee is required");
      return;
    }
    if (!formData.roster_date) {
      toast.error("Roster date is required");
      return;
    }

    if (isSaving) return;
    const payload = { ...formData };

    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  // Bulk publish handler
  const handlePublishSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one roster to publish");
      return;
    }
    publishMutation.mutate(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  // Table columns
  const columns: ColumnDef<RosterAssignment & { sr: number }>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all assignments on this page"
            checked={
              table.getIsAllRowsSelected() ||
              (table.getIsSomeRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => {
              table.toggleAllRowsSelected(!!value);
              if (value) {
                setSelectedIds(
                  table.getRowModel().rows.map((row) => row.original.id)
                );
              } else {
                setSelectedIds([]);
              }
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select assignment for ${row.original.employee?.name ?? row.original.employee_id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              const id = row.original.id;
              setSelectedIds((prev) =>
                value
                  ? [...new Set([...prev, id])]
                  : prev.filter((uid) => uid !== id)
              );
            }}
          />
        ),
      },
      { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.employee?.name ?? row.original.employee_id}</div>
            <div className="text-xs text-gray-500">{row.original.employee?.employee_code}</div>
          </div>
        ),
      },
      {
        id: "shift",
        header: "Shift",
        cell: ({ row }) => (
          <div>
            {row.original.shift ? (
              <div>
                <div className="font-semibold">{row.original.shift.name}</div>
                <div className="text-xs text-gray-500">
                  {row.original.shift.start_time?.slice(0, 5)} – {row.original.shift.end_time?.slice(0, 5)}
                </div>
              </div>
            ) : (
              <span className="text-gray-400 italic">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "roster_date",
        header: "Date",
        cell: ({ row }) => (
          <div>{row.original.roster_date.split("T")[0] ?? row.original.roster_date.split(" ")[0]}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={
                status === "published"
                  ? "bg-green-100 text-green-800"
                  : status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "flags",
        header: "Flags",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.is_weekly_off && <Badge variant="outline" className="text-xs">WO</Badge>}
            {row.original.is_holiday && <Badge variant="outline" className="text-xs">H</Badge>}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${row.original.employee?.name ?? row.original.employee_id}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44"><DropdownMenuItem onSelect={() => handleView(row.original)}><Eye className="mr-2 h-4 w-4" />View details</DropdownMenuItem><DropdownMenuItem onSelect={() => handleEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return rosters.map((r, idx: number) => ({ ...r, sr: startSr + idx + 1 }));
  }, [rosters, page, perPage]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, rowSelection: Object.fromEntries(selectedIds.map(id => [id, true])) },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    getRowId: (row) => String(row.id),
  });

  const showingFrom = totalEntries > 0 ? (page - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Roster Planner Directory
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} assignments
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handlePublishSelected}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? (
                    <AppLoader variant="inline" label="Saving…" />
                  ) : null}
                  Publish Selected ({selectedIds.length})
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button>
              <Button size="sm" className="bg-brand-900 hover:bg-brand-800" onClick={handleCreate} disabled={createMutation.isPending}>
                <PlusIcon className="mr-2 h-4 w-4" /> Add Assignment
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1 space-y-1.5"><label htmlFor="planner-employee" className="text-xs font-medium text-gray-600">Employee</label><SearchableSelect id="planner-employee" options={employeeOptions} value={employeeFilterId} onChange={setEmployeeFilterId} allLabel="All employees" widthClass="w-full" disabled={isLoadingEmployees} /></div>
            <div className="w-full space-y-1.5 sm:w-40"><label htmlFor="planner-from" className="text-xs font-medium text-gray-600">From date</label><Input id="planner-from" type="date" value={dateFrom} max={dateTo || undefined} onChange={event => setDateFrom(event.target.value)} /></div>
            <div className="w-full space-y-1.5 sm:w-40"><label htmlFor="planner-to" className="text-xs font-medium text-gray-600">To date</label><Input id="planner-to" type="date" value={dateTo} min={dateFrom || undefined} onChange={event => setDateTo(event.target.value)} /></div>
            <div className="w-full space-y-1.5 sm:w-40"><label htmlFor="planner-status" className="text-xs font-medium text-gray-600">Status</label><SearchableSelect id="planner-status" options={STATUS_OPTIONS} value={statusFilter === "all" ? "" : statusFilter} allLabel="All statuses" widthClass="w-full" onChange={value => setStatusFilter(value || "all")} /></div>
            <div className="flex h-9 items-center gap-2 text-sm text-gray-600"><span>Show</span><SearchableSelect aria-label="Assignments per page" allowAll={false} widthClass="w-28" options={[10,25,50,100].map(value => ({ value: String(value), label: String(value) }))} value={String(perPage)} onChange={value => setPerPage(Number(value))} /><span>entries</span></div>
            {(dateFrom || dateTo || employeeFilterId || statusFilter !== "all") && <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setEmployeeFilterId(""); setStatusFilter("all"); }}>Clear filters</Button>}
          </div>

          {/* Stats */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 mb-4 flex flex-wrap gap-3 justify-between items-center text-gray-600">
            <span className="text-sm">
              Showing {showingFrom} to {showingTo} of {totalEntries} entries
            </span>
            {(isLoading || isFetching) && (
              <AppLoader variant="inline" label="Loading assignments…" />
            )}
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-x-auto" aria-busy={isFetching}>
            <table className="w-full min-w-[1000px]"><caption className="sr-only">Roster assignments</caption>
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="py-3 px-4 text-left text-xs font-semibold uppercase cursor-pointer"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === "asc" ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : h.column.getIsSorted() === "desc" ? (
                            <ChevronLeft className="h-4 w-4" />
                          ) : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center">
                      <AppLoader label="Loading roster assignments…" />
                    </td>
                  </tr>
                ) : error ? (<tr><td colSpan={columns.length} className="p-6"><ApiErrorState error={error} onRetry={() => void refetch()} /></td></tr>) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center">
                      No roster assignments found
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-4 px-4 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
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
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-center mt-4 border-t bg-gray-50 p-4">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(1)}
                  disabled={isFetching || page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage((p) => Math.max(1, p - 1))}
                  disabled={isFetching || page === 1}
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
                      onClick={() => changePage(num)}
                    >
                      {num}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage((p) => Math.min(totalPages, p + 1))}
                  disabled={isFetching || page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(totalPages)}
                  disabled={isFetching || page === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={open => { if (!isSaving) setIsModalOpen(open); }}>
        <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14 text-left">
            <DialogTitle>
              {modalMode === "create"
                ? "Add Assignment"
                : modalMode === "edit"
                ? "Edit Assignment"
                : "View Assignment"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view"
                ? "Read‑only view."
                : "Choose an employee and date, then assign a shift and scheduling options."}
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={isSaving} className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
            {/* Employee */}
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="assignment-employee" className="text-sm font-medium">Employee *</label>
              <SearchableSelect
                id="assignment-employee"
                options={employeeOptions.some(option => option.value === formData.employee_id) || !formData.employee_id ? employeeOptions : [...employeeOptions, { value: formData.employee_id, label: selectedItem?.employee?.name ?? `Saved employee (${formData.employee_id})` }]}
                value={formData.employee_id}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, employee_id: v as string }))
                }
                placeholder="Select employee"
                groupLabel="Employees"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || isLoadingEmployees}
                multiple={false}
              />
            </div>
            {/* Shift */}
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="assignment-shift" className="text-sm font-medium">Shift</label>
              <SearchableSelect
                id="assignment-shift"
                options={shiftOptions.some(option => option.value === formData.shift_id) || !formData.shift_id ? shiftOptions : [...shiftOptions, { value: formData.shift_id, label: selectedItem?.shift?.name ?? `Saved shift (${formData.shift_id})` }]}
                value={formData.shift_id}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, shift_id: v as string }))
                }
                placeholder="Select shift (optional)"
                groupLabel="Shifts"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || isLoadingShifts}
                multiple={false}
              />
            </div>
            {/* Date */}
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="assignment-date" className="text-sm font-medium">Date *</label>
              <Input id="assignment-date"
                type="date"
                value={formData.roster_date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, roster_date: e.target.value }))
                }
                disabled={modalMode === "view"}
              />
            </div>
            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-gray-50 p-3 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.is_weekly_off}
                  onCheckedChange={(c) =>
                    setFormData((p) => ({ ...p, is_weekly_off: !!c }))
                  }
                  disabled={modalMode === "view"}
                />
                Weekly Off
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formData.is_holiday}
                  onCheckedChange={(c) =>
                    setFormData((p) => ({ ...p, is_holiday: !!c }))
                  }
                  disabled={modalMode === "view"}
                />
                Holiday
              </label>
            </div>
            {/* Status */}
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="assignment-status" className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, status: v as RosterStatus }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger id="assignment-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Template */}
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="assignment-template" className="text-sm font-medium">Template</label>
              <SearchableSelect
                id="assignment-template"
                options={templateOptions.some(option => option.value === formData.template_id) || !formData.template_id ? templateOptions : [...templateOptions, { value: formData.template_id, label: selectedItem?.template?.name ?? `Saved template (${formData.template_id})` }]}
                value={formData.template_id}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, template_id: v as string }))
                }
                placeholder="Select template (optional)"
                groupLabel="Templates"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || isLoadingTemplates}
                multiple={false}
              />
            </div>
            {/* Notes */}
            <div className="min-w-0 space-y-1.5 sm:col-span-2">
              <label htmlFor="assignment-notes" className="text-sm font-medium">Notes</label>
              <textarea id="assignment-notes" className="min-h-24 w-full rounded-md border border-input px-3 py-2 text-sm"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
                disabled={modalMode === "view"}
                maxLength={2000}
              />
            </div>
          </fieldset>
          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" disabled={isSaving} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <AppLoader variant="inline" label="Please wait…" />
                  )}
                  {modalMode === "create" ? "Create assignment" : "Save changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteUuid}
        onOpenChange={open => { if (!open && !deleteMutation.isPending) setDeleteUuid(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={event => { event.preventDefault(); confirmDelete(); }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <AppLoader variant="inline" label="Please wait…" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RosterListingPage;