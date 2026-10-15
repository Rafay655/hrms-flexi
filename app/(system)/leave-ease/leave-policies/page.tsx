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
import toast from "react-hot-toast";

import { useLeaveTypes } from "@/hooks/useLeaveTypes";
import { useGradeBands } from "@/hooks/useGradeBands";
import { useDepartments } from "@/hooks/useDepartments";
import {
  useLeavePolicies,
  useCreateLeavePolicy,
  useUpdateLeavePolicy,
  useDeleteLeavePolicy,
} from "@/hooks/useLeavePolicies";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { LeavePolicy, LeavePolicyFormData, AccrualPeriod } from "@/types/leave-policy";

const DEFAULT_PER_PAGE = 15;

const ACCRUAL_PERIODS: { value: AccrualPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
  { value: "none", label: "None" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function LeavePoliciesPage() {
  // --- Table state ---
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // --- Dropdown data ---
  const { data: leaveTypesRaw, isLoading: isLoadingLeaveTypes } = useLeaveTypes({ per_page: 1000 });
  const leaveTypes = useMemo(() => leaveTypesRaw?.data?.data ?? [], [leaveTypesRaw]);
  const leaveTypeOptions: Option[] = useMemo(
    () =>
      leaveTypes.map((lt: any) => ({
        value: String(lt.uuid ?? lt.id),
        label: `${lt.name} (${lt.code})`,
      })),
    [leaveTypes]
  );

  const { data: gradeBandsRaw, isLoading: isLoadingGradeBands } = useGradeBands({ per_page: 1000 });
  const gradeBands = useMemo(() => gradeBandsRaw?.data ?? [], [gradeBandsRaw]);
  const gradeBandOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...gradeBands.map((gb: any) => ({
        value: String(gb.uuid ?? gb.id),
        label: gb.name,
      })),
    ],
    [gradeBands]
  );

  const { data: departmentsRaw, isLoading: isLoadingDepartments } = useDepartments({ per_page: 1000 });
  const departments = useMemo(() => departmentsRaw?.data ?? [], [departmentsRaw]);
  const departmentOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...departments.map((d: any) => ({
        value: String(d.id),
        label: d.name,
      })),
    ],
    [departments]
  );

  // --- Policies data ---
  const { data, isLoading, isFetching, error } = useLeavePolicies({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const policies = data?.data?.data ?? [];
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = data?.data?.meta?.last_page ?? 1;

  // --- Mutations ---
  const createMutation = useCreateLeavePolicy();
  const updateMutation = useUpdateLeavePolicy();
  const deleteMutation = useDeleteLeavePolicy();

  // --- Modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<LeavePolicy | null>(null);
  const [formData, setFormData] = useState<LeavePolicyFormData>({
    leave_type_id: "",
    grade_band_id: "",
    department_id: "",
    annual_entitlement: 0,
    carry_forward_limit: "",
    encashment_limit: "",
    accrual_rate: "",
    accrual_period: "",
    probation_eligible: false,
    min_service_months: 0,
    max_consecutive_days: "",
    requires_approval: true,
    effective_from: "",
    is_active: true,
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load policies" });
  }, [error]);

  // ---------- Handlers ----------
  const populateForm = (item: LeavePolicy) => {
    setSelectedItem(item);
    setFormData({
      leave_type_id: item.leave_type?.uuid ?? "",
      grade_band_id: item.grade_band_id ?? "",
      department_id: item.department_id ?? "",
      annual_entitlement: item.annual_entitlement,
      carry_forward_limit: item.carry_forward_limit?.toString() ?? "",
      encashment_limit: item.encashment_limit?.toString() ?? "",
      accrual_rate: item.accrual_rate?.toString() ?? "",
      accrual_period: item.accrual_period ?? "",
      probation_eligible: item.probation_eligible,
      min_service_months: item.min_service_months,
      max_consecutive_days: item.max_consecutive_days?.toString() ?? "",
      requires_approval: item.requires_approval,
      effective_from: item.effective_from.split('T')[0] ?? item.effective_from.split(' ')[0],
      is_active: item.is_active,
    });
  };

  const handleView = (item: LeavePolicy) => {
    populateForm(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: LeavePolicy) => {
    populateForm(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      leave_type_id: "",
      grade_band_id: "",
      department_id: "",
      annual_entitlement: 0,
      carry_forward_limit: "",
      encashment_limit: "",
      accrual_rate: "",
      accrual_period: "",
      probation_eligible: false,
      min_service_months: 0,
      max_consecutive_days: "",
      requires_approval: true,
      effective_from: new Date().toISOString().slice(0, 10),
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
    if (modalMode === "create" && !formData.leave_type_id) {
      toast.error("Leave type required"); return;
    }
    if (!formData.effective_from) { toast.error("Effective from required"); return; }

    const payload = { ...formData };
    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.uuid, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  // ---------- Table columns ----------
  const columns: ColumnDef<LeavePolicy & { sr: number }>[] = useMemo(
    () => [
      { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
      {
        id: "leave_type",
        header: "Leave Type",
        cell: ({ row }) => <div className="font-semibold">{row.original.leave_type?.name ?? "—"}</div>,
      },
      { accessorKey: "annual_entitlement", header: "Days/Year", cell: ({ row }) => <span>{row.original.annual_entitlement}</span> },
      {
        id: "grade",
        header: "Grade",
        cell: ({ row }) => <div className="text-sm">{row.original.grade_band?.name ?? "—"}</div>,
      },
      {
        id: "department",
        header: "Department",
        cell: ({ row }) => <div className="text-sm">{row.original.department?.name ?? "—"}</div>,
      },
      {
        accessorKey: "effective_from",
        header: "Effective",
        cell: ({ row }) => row.original.effective_from?.split('T')[0] ?? "—",
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={row.original.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleView(row.original)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.uuid)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return policies.map((p: LeavePolicy, idx: number) => ({ ...p, sr: startSr + idx + 1 }));
  }, [policies, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Leave Policies</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} policies</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Policy
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">{[10,15,25,50,100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
            <span className="text-sm">Showing {showingFrom} to {showingTo} of {totalEntries} entries</span>
            {(isLoading || isFetching) && <Loader2 className="animate-spin h-5 w-5" />}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id} className="py-3 px-4 text-left text-xs font-semibold uppercase cursor-pointer" onClick={h.column.getToggleSortingHandler()}>
                        <div className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === 'asc' ? <ChevronRight className="h-4 w-4" /> : h.column.getIsSorted() === 'desc' ? <ChevronLeft className="h-4 w-4" /> : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={columns.length} className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="py-12 text-center">No policies found</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-4 px-4 text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let num;
                  if (totalPages <= 5) num = i + 1;
                  else if (page <= 3) num = i + 1;
                  else if (page >= totalPages - 2) num = totalPages - 4 + i;
                  else num = page - 2 + i;
                  return <Button key={num} variant={page === num ? "default" : "outline"} size="sm" onClick={() => setPage(num)}>{num}</Button>;
                })}
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add Leave Policy" : modalMode === "edit" ? "Edit Leave Policy" : "View Leave Policy"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "Read-only view." :
               modalMode === "edit" ? "Only policy values can be updated (scope locked)." :
               "Fill in the details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Leave Type (disabled on edit/view) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Leave Type *</label>
              <SearchableSelect
                options={leaveTypeOptions}
                value={formData.leave_type_id || ""}
                onChange={v => setFormData(p => ({ ...p, leave_type_id: v as string }))}
                placeholder="Select leave type"
                groupLabel="Leave Types"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode !== "create" || isLoadingLeaveTypes}
                multiple={false}
              />
            </div>

            {/* Grade Band (disabled on edit/view) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Grade Band</label>
              <SearchableSelect
                options={gradeBandOptions}
                value={formData.grade_band_id ? String(formData.grade_band_id) : ""}
                onChange={v => setFormData(p => ({ ...p, grade_band_id: v === "" ? "" : Number(v) }))}
                placeholder="Select grade band (optional)"
                groupLabel="Grade Bands"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode !== "create" || isLoadingGradeBands}
                multiple={false}
              />
            </div>

            {/* Department (disabled on edit/view) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Department</label>
              <SearchableSelect
                options={departmentOptions}
                value={formData.department_id ? String(formData.department_id) : ""}
                onChange={v => setFormData(p => ({ ...p, department_id: v === "" ? "" : Number(v) }))}
                placeholder="Select department (optional)"
                groupLabel="Departments"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode !== "create" || isLoadingDepartments}
                multiple={false}
              />
            </div>

            {/* Annual Entitlement */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Annual Entitlement *</label>
              <Input type="number" min={0} step="0.1" value={formData.annual_entitlement} onChange={e => setFormData(p => ({ ...p, annual_entitlement: Number(e.target.value) || 0 }))} disabled={modalMode === "view"} />
            </div>

            {/* Accrual Rate */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Accrual Rate</label>
              <Input type="number" step="0.01" min={0} max={99.99} value={formData.accrual_rate} onChange={e => setFormData(p => ({ ...p, accrual_rate: e.target.value }))} disabled={modalMode === "view"} />
            </div>

            {/* Accrual Period */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Accrual Period</label>
              <Select value={formData.accrual_period} onValueChange={v => setFormData(p => ({ ...p, accrual_period: v as AccrualPeriod | '' }))} disabled={modalMode === "view"}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ACCRUAL_PERIODS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Carry Forward Limit */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Carry Fwd Limit</label>
              <Input type="number" step="0.1" min={0} value={formData.carry_forward_limit} onChange={e => setFormData(p => ({ ...p, carry_forward_limit: e.target.value }))} disabled={modalMode === "view"} />
            </div>

            {/* Encashment Limit */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Encashment Limit</label>
              <Input type="number" step="0.1" min={0} value={formData.encashment_limit} onChange={e => setFormData(p => ({ ...p, encashment_limit: e.target.value }))} disabled={modalMode === "view"} />
            </div>

            {/* Max Consecutive Days */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max Consecutive Days</label>
              <Input type="number" min={1} max={365} value={formData.max_consecutive_days} onChange={e => setFormData(p => ({ ...p, max_consecutive_days: e.target.value }))} disabled={modalMode === "view"} placeholder="Optional" />
            </div>

            {/* Min Service Months */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Min Service (months)</label>
              <Input type="number" min={0} max={120} value={formData.min_service_months} onChange={e => setFormData(p => ({ ...p, min_service_months: Number(e.target.value) || 0 }))} disabled={modalMode === "view"} />
            </div>

            {/* Effective From */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Effective From *</label>
              <Input type="date" value={formData.effective_from} onChange={e => setFormData(p => ({ ...p, effective_from: e.target.value }))} disabled={modalMode === "view"} />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.probation_eligible} onCheckedChange={c => setFormData(p => ({ ...p, probation_eligible: !!c }))} disabled={modalMode === "view"} />
              <label className="text-sm">Probation Eligible</label>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.requires_approval} onCheckedChange={c => setFormData(p => ({ ...p, requires_approval: !!c }))} disabled={modalMode === "view"} />
              <label className="text-sm">Requires Approval</label>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.is_active} onCheckedChange={c => setFormData(p => ({ ...p, is_active: !!c }))} disabled={modalMode === "view"} />
              <label className="text-sm">Active</label>
            </div>
          </div>
          <DialogFooter>
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUuid} onOpenChange={() => setDeleteUuid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Policy?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}