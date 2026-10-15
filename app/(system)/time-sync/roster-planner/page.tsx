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
  CalendarIcon,
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

  // Fetch dropdown data
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
  const shifts = useMemo(() => shiftsRaw?.data?.data ?? [], [shiftsRaw]);
  const shiftOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...shifts.map((s: any) => ({
        value: s.uuid ?? s.id,
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
      ...templates.map((t: any) => ({
        value: t.uuid ?? t.id,
        label: t.name,
      })),
    ],
    [templates]
  );

  // Fetch roster data
  const { data, isLoading, isFetching, error } = useRosters({
    page,
    per_page: perPage,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    employee_id: employeeFilterId || undefined,
  });

  const rosters = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // Mutations
  const createMutation = useCreateRoster();
  const updateMutation = useUpdateRoster();
  const deleteMutation = useDeleteRoster();
  const publishMutation = usePublishRosters();

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
  }, [perPage, dateFrom, dateTo, statusFilter, employeeFilterId]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load rosters" });
  }, [error]);

  // CRUD handlers
  const handleView = (item: RosterAssignment) => {
    setSelectedItem(item);
    setFormData({
      employee_id: item.employee_id,
      shift_id: item.shift_id ?? "",
      roster_date: item.roster_date.split("T")[0] ?? item.roster_date.split(" ")[0],
      is_weekly_off: item.is_weekly_off,
      is_holiday: item.is_holiday,
      status: item.status,
      notes: item.notes ?? "",
      template_id: item.template_id ?? "",
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: RosterAssignment) => {
    setSelectedItem(item);
    setFormData({
      employee_id: item.employee_id,
      shift_id: item.shift_id ?? "",
      roster_date: item.roster_date.split("T")[0] ?? item.roster_date.split(" ")[0],
      is_weekly_off: item.is_weekly_off,
      is_holiday: item.is_holiday,
      status: item.status,
      notes: item.notes ?? "",
      template_id: item.template_id ?? "",
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      employee_id: "",
      shift_id: "",
      roster_date: new Date().toISOString().slice(0, 10),
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
      deleteMutation.mutate(deleteUuid, { onSuccess: () => setDeleteUuid(null) });
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
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              const id = row.original.id;
              setSelectedIds((prev) =>
                value
                  ? [...prev, id]
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
                  {row.original.shift.start_time} – {row.original.shift.end_time}
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
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleView(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)}>
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
    return rosters.map((r: any, idx: number) => ({ ...r, sr: startSr + idx + 1 }));
  }, [rosters, page, perPage]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    getRowId: (row) => row.id,
  });

  const showingFrom = totalEntries > 0 ? (page - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Roster Management
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} assignments
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handlePublishSelected}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Publish Selected ({selectedIds.length})
                </Button>
              )}
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                <PlusIcon className="mr-2 h-4 w-4" /> Add Assignment
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-48">
              <label className="text-xs text-gray-500">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="text-xs text-gray-500">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="text-xs text-gray-500">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64">
              <label className="text-xs text-gray-500">Employee</label>
              <SearchableSelect
                options={employeeOptions}
                value={employeeFilterId}
                onChange={setEmployeeFilterId}
                placeholder="All employees"
                groupLabel="Employees"
                allowAll={true}
                allLabel="All Employees"
                allValue=""
                widthClass="w-full mt-1"
                disabled={isLoadingEmployees}
                multiple={false}
              />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => setPerPage(Number(v))}
              >
                <SelectTrigger className="w-20">
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
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
            <span className="text-sm">
              Showing {showingFrom} to {showingTo} of {totalEntries} entries
            </span>
            {(isLoading || isFetching) && (
              <Loader2 className="animate-spin h-5 w-5" />
            )}
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
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
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
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
            <div className="flex justify-between items-center mt-4">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
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
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
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
                : "Fill in the details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Employee */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Employee *</label>
              <SearchableSelect
                options={employeeOptions}
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Shift</label>
              <SearchableSelect
                options={shiftOptions}
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date *</label>
              <Input
                type="date"
                value={formData.roster_date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, roster_date: e.target.value }))
                }
                disabled={modalMode === "view"}
              />
            </div>
            {/* Checkboxes */}
            <div className="flex gap-4">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, status: v as RosterStatus }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger>
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
            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
                disabled={modalMode === "view"}
                maxLength={2000}
              />
            </div>
            {/* Template */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Template</label>
              <SearchableSelect
                options={templateOptions}
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
          </div>
          <DialogFooter>
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
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
        onOpenChange={() => setDeleteUuid(null)}
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
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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