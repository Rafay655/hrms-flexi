"use client";

import { showApiError } from "@/lib/error-toast";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Eye,
  Pencil,
  PlusIcon,
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
import {
  useSalaryAssignments,
  useCreateSalaryAssignment,
  useUpdateSalaryAssignment,
} from "@/hooks/useSalaryAssignments";
import { useEmployees } from "@/hooks/useEmployees";
import { useSalaryStructures } from "@/hooks/useSalaryStructures";
import SearchableSelect from "@/components/ui/searchable-select";
import type { SalaryAssignment, UpdateSalaryAssignmentPayload } from "@/types/salary-assignment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react"; 
const DEFAULT_PER_PAGE = 25;

const REVISION_REASONS = [
  "new_hire",
  "promotion",
  "annual_revision",
  "correction",
  "transfer",
] as const;

const STATUS_OPTIONS = ["draft", "pending_approval", "active", "superseded"] as const;

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SalaryAssignmentsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isFetching, error } = useSalaryAssignments({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const assignments = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // ── Create dialog state ────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    employee_uuid: "",
    salary_structure_id: "",
    effective_from: "",
    effective_to: "",
    gross_salary: "",
    currency_code: "PKR",
    revision_reason: "new_hire",
    status: "draft",
  });
  const [selectedStructure, setSelectedStructure] = useState<any>(null);

  const createMutation = useCreateSalaryAssignment();
  const updateMutation = useUpdateSalaryAssignment();

  const { data: employeesData, isLoading: isLoadingEmployees, refetch: refetchEmployees } = useEmployees({ per_page: 1000, detailed: 0 });
  const { data: structuresData, isLoading: isLoadingStructures } = useSalaryStructures({ per_page: 1000 });

  const employeeOptions = useMemo(() => {
    const payload = employeesData as any;
    const list = Array.isArray(payload) ? payload : payload?.data ?? [];
    return list.map((emp: any) => ({
      value: emp.uuid,
      label: `${emp.name} (${emp.employee_code})`,
      gross_salary: emp.gross_salary,
    }));
  }, [employeesData]);

  const structureOptions = useMemo(() => {
    const list = (structuresData as any)?.data ?? [];
    return list.map((s: any) => ({
      value: s.id,
      label: s.name,
    }));
  }, [structuresData]);

  const structuresList = useMemo(() => {
    const payload = structuresData as any;
    return Array.isArray(payload) ? payload : payload?.data ?? [];
  }, [structuresData]);

  const [viewItem, setViewItem] = useState<SalaryAssignment | null>(null);

  // ── Edit state ──────────────────────────────────────
  const [editItem, setEditItem] = useState<SalaryAssignment | null>(null);
  const [editForm, setEditForm] = useState<UpdateSalaryAssignmentPayload & { employee_uuid?: string }>({});
  const [editSelectedStructure, setEditSelectedStructure] = useState<any>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);
  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load salary assignments" });
  }, [error]);

  // ── Create handlers ─────────────────────────────────
  const openAddDialog = () => {
    setCreateForm({
      employee_uuid: "",
      salary_structure_id: "",
      effective_from: new Date().toISOString().slice(0, 10),
      effective_to: "",
      gross_salary: "",
      currency_code: "PKR",
      revision_reason: "new_hire",
      status: "draft",
    });
    setSelectedStructure(null);
    setAddOpen(true);
  };

  const handleEmployeeChange = (employeeUuid: string) => {
    setCreateForm((prev) => ({ ...prev, employee_uuid: employeeUuid }));
    const payload = employeesData as any;
    const list = Array.isArray(payload) ? payload : payload?.data ?? [];
    const emp = list.find((e: any) => e.uuid === employeeUuid);
    setCreateForm((prev) => ({
      ...prev,
      gross_salary: emp?.gross_salary || "0",
    }));
  };

  const handleStructureChange = (structureId: string) => {
    setCreateForm((prev) => ({ ...prev, salary_structure_id: structureId }));
    const struct = structuresList.find((s: any) => s.id === structureId);
    setSelectedStructure(struct || null);
    if (struct?.currency_code) {
      setCreateForm((prev) => ({
        ...prev,
        currency_code: struct.currency_code,
      }));
    }
  };

  const handleCreate = () => {
    if (!createForm.employee_uuid) return toast.error("Employee is required");
    if (!createForm.salary_structure_id) return toast.error("Salary structure is required");
    if (!createForm.effective_from) return toast.error("Effective from date is required");
    if (!createForm.gross_salary || Number(createForm.gross_salary) < 0)
      return toast.error("Gross salary must be a non-negative number");
    if (createForm.effective_to && createForm.effective_to <= createForm.effective_from)
      return toast.error("Effective to must be after effective from");

    const payload = {
      employee_uuid: createForm.employee_uuid,
      salary_structure_id: createForm.salary_structure_id,
      effective_from: createForm.effective_from,
      effective_to: createForm.effective_to || null,
      gross_salary: Number(createForm.gross_salary),
      currency_code: createForm.currency_code || null,
      revision_reason: createForm.revision_reason,
      status: createForm.status,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        setAddOpen(false);
        refetchEmployees();
      },
    });
  };

  // ── Edit handlers ──────────────────────────────────
  const openEditDialog = (assignment: SalaryAssignment) => {
    setEditItem(assignment);
    setEditForm({
      effective_from: assignment.effective_from,
      effective_to: assignment.effective_to || "",
      gross_salary: Number(assignment.gross_salary),
      ctc: Number(assignment.ctc),
      salary_structure_id: assignment.salary_structure_id,
      currency_code: assignment.currency_code,
      revision_reason: assignment.revision_reason,
      status: assignment.status,
    });
    // Store the selected structure for currency auto‑fill
    const struct = structuresList.find((s: any) => s.id === assignment.salary_structure_id);
    setEditSelectedStructure(struct || null);
  };

  const handleEditStructureChange = (structureId: string) => {
    setEditForm((prev) => ({ ...prev, salary_structure_id: structureId }));
    const struct = structuresList.find((s: any) => s.id === structureId);
    setEditSelectedStructure(struct || null);
    if (struct?.currency_code) {
      setEditForm((prev) => ({ ...prev, currency_code: struct.currency_code }));
    }
  };

  const handleEditSubmit = () => {
    if (!editItem) return;

    if (editForm.effective_to && editForm.effective_from &&
        editForm.effective_to <= editForm.effective_from) {
      toast.error("Effective to must be after effective from");
      return;
    }

    const payload: UpdateSalaryAssignmentPayload = {
      effective_from: editForm.effective_from || undefined,
      effective_to: editForm.effective_to || null,
      gross_salary: editForm.gross_salary !== undefined ? editForm.gross_salary : null,
      ctc: editForm.ctc !== undefined ? editForm.ctc : null,
      salary_structure_id: editForm.salary_structure_id || undefined,
      currency_code: editForm.currency_code || null,
      revision_reason: editForm.revision_reason || undefined,
      status: editForm.status || undefined,
    };

    updateMutation.mutate(
      {
        employeeUuid: editItem.employee_id,
        assignmentUuid: editItem.id,
        data: payload,
      },
      {
        onSuccess: () => {
          setEditItem(null);
          setEditSelectedStructure(null);
        },
      }
    );
  };

  // ── Table columns ──────────────────────────────────
  const columns: ColumnDef<SalaryAssignment & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "#",
        cell: ({ row }) => <div className="font-medium">{row.original.sr}</div>,
      },
      {
        accessorKey: "employee_name",
        header: "Employee",
        cell: ({ row }) => <div className="font-semibold">{row.original.employee_name}</div>,
      },
      {
        accessorKey: "salary_structure",
        header: "Structure",
        cell: ({ row }) => <span>{row.original.salary_structure}</span>,
      },
      {
        accessorKey: "gross_salary",
        header: "Gross",
        cell: ({ row }) => (
          <span className="font-mono">
            {Number(row.original.gross_salary).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "ctc",
        header: "CTC",
        cell: ({ row }) => (
          <span className="font-mono">
            {Number(row.original.ctc).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "effective_from",
        header: "From",
        cell: ({ row }) => <span>{row.original.effective_from}</span>,
      },
      {
        accessorKey: "effective_to",
        header: "To",
        cell: ({ row }) => <span>{row.original.effective_to ?? "—"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : status === "superseded"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-blue-100 text-blue-800"
              }
            >
              {status}
            </Badge>
          );
        },
      },
   {
  id: "actions",
  header: () => <div className="text-center">Actions</div>,
  cell: ({ row }) => (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setViewItem(row.original)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Salary Assignments</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} assignments</p>
            </div>
            <Button onClick={openAddDialog}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Assignment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  {[10, 15, 25, 50, 100].map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
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
            {(isLoading || isFetching) && <Loader2 className="animate-spin h-5 w-5" />}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
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
                      No salary assignments found
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-4 px-4 text-sm">
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
            <div className="flex justify-between items-center mt-4">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let num;
                  if (totalPages <= 5) num = i + 1;
                  else if (page <= 3) num = i + 1;
                  else if (page >= totalPages - 2) num = totalPages - 4 + i;
                  else num = page - 2 + i;
                  return (
                    <Button key={num} variant={page === num ? "default" : "outline"} size="sm" onClick={() => setPage(num)}>
                      {num}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Salary Assignment Details</DialogTitle>
            <DialogDescription>Read‑only view</DialogDescription>
          </DialogHeader>
          {viewItem && (
            <div className="grid gap-3 py-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium text-gray-600">Employee</span>
                <span className="col-span-2">{viewItem.employee_name}</span>
                <span className="font-medium text-gray-600">Structure</span>
                <span className="col-span-2">{viewItem.salary_structure}</span>
                <span className="font-medium text-gray-600">Gross</span>
                <span className="col-span-2">{Number(viewItem.gross_salary).toLocaleString()} {viewItem.currency_code}</span>
                <span className="font-medium text-gray-600">CTC</span>
                <span className="col-span-2">{Number(viewItem.ctc).toLocaleString()} {viewItem.currency_code}</span>
                <span className="font-medium text-gray-600">Effective from</span>
                <span className="col-span-2">{viewItem.effective_from}</span>
                <span className="font-medium text-gray-600">Effective to</span>
                <span className="col-span-2">{viewItem.effective_to ?? "—"}</span>
                <span className="font-medium text-gray-600">Status</span>
                <span className="col-span-2">
                  <Badge className={viewItem.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {viewItem.status}
                  </Badge>
                </span>
                <span className="font-medium text-gray-600">Revision reason</span>
                <span className="col-span-2">{viewItem.revision_reason}</span>
                {viewItem.approved_at && (
                  <>
                    <span className="font-medium text-gray-600">Approved at</span>
                    <span className="col-span-2">{viewItem.approved_at}</span>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Dialog ────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assign Salary</DialogTitle>
            <DialogDescription>
              Select an employee and provide the salary details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Employee */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Employee *</label>
              <SearchableSelect
                options={employeeOptions}
                value={createForm.employee_uuid}
                onChange={handleEmployeeChange}
                placeholder="Search employee..."
                groupLabel="Employees"
                allowAll={false}
                disabled={isLoadingEmployees}
                multiple={false}
                className="w-full"
              />
            </div>

            {/* Salary Structure */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Salary Structure *</label>
              <Select
                value={createForm.salary_structure_id}
                onValueChange={handleStructureChange}
                disabled={isLoadingStructures}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select structure" />
                </SelectTrigger>
                <SelectContent>
                  {structureOptions.map((s: any) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Effective dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Effective From *</label>
                <Input
                  type="date"
                  value={createForm.effective_from}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, effective_from: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Effective To</label>
                <Input
                  type="date"
                  value={createForm.effective_to}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, effective_to: e.target.value }))}
                />
              </div>
            </div>

            {/* Gross salary + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gross Salary *</label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={createForm.gross_salary}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, gross_salary: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Currency</label>
                <Input
                  value={createForm.currency_code}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, currency_code: e.target.value.toUpperCase() }))}
                  placeholder="PKR"
                  maxLength={3}
                  readOnly={!!selectedStructure}
                />
              </div>
            </div>

            {/* Revision reason + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Revision Reason *</label>
                <Select
                  value={createForm.revision_reason}
                  onValueChange={(v) => setCreateForm((prev) => ({ ...prev, revision_reason: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVISION_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={createForm.status}
                  onValueChange={(v) => setCreateForm((prev) => ({ ...prev, status: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ──────────────────────────────── */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) { setEditItem(null); setEditSelectedStructure(null); } }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Salary Assignment</DialogTitle>
            <DialogDescription>
              Modify the fields you want to update. Leave blank to keep current value.
            </DialogDescription>
          </DialogHeader>
          {editItem && (
            <div className="grid gap-4 py-4">
              {/* Salary Structure */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Salary Structure</label>
                <Select
                  value={editForm.salary_structure_id || ""}
                  onValueChange={handleEditStructureChange}
                  disabled={isLoadingStructures}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {structureOptions.map((s: any) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Effective dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Effective From</label>
                  <Input
                    type="date"
                    value={editForm.effective_from || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, effective_from: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Effective To</label>
                  <Input
                    type="date"
                    value={editForm.effective_to || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, effective_to: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Gross salary + CTC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Gross Salary</label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={editForm.gross_salary ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, gross_salary: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">CTC</label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={editForm.ctc ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, ctc: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Currency</label>
                <Input
                  value={editForm.currency_code || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, currency_code: e.target.value.toUpperCase() }))
                  }
                  placeholder="PKR"
                  maxLength={3}
                  readOnly={!!editSelectedStructure}
                />
              </div>

              {/* Revision reason + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Revision Reason</label>
                  <Select
                    value={editForm.revision_reason || ""}
                    onValueChange={(v) =>
                      setEditForm((prev) => ({ ...prev, revision_reason: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVISION_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editForm.status || ""}
                    onValueChange={(v) =>
                      setEditForm((prev) => ({ ...prev, status: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}