"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { leaveTypeService } from "@/services/leave-type.service";
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
  MoreVertical, RefreshCw, SearchIcon,
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
import { AppLoader } from "@/components/ui/app-loader";
import { ApiErrorState } from "@/components/ui/api-error-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

const DEFAULT_PER_PAGE = 10;

const ACCRUAL_PERIODS: { value: AccrualPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
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
      leaveTypes.map((lt) => ({
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
      ...gradeBands.map((gb) => ({
        value: String(gb.id),
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
      ...departments.map((d) => ({
        value: String(d.id),
        label: d.name,
      })),
    ],
    [departments]
  );

  // --- Policies data ---
  const { data, isLoading, isFetching, error, refetch } = useLeavePolicies({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const policies = useMemo(() => data?.data?.data ?? [], [data]);
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = Math.max(1, data?.data?.meta?.last_page ?? 1);
  if (data && !isFetching && page > totalPages) setPage(totalPages);

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
  const company = useAppSelector(state => state.auth.company?.id);
  const user = useAppSelector(state => state.auth.user?.id);
  const typeCapabilities = useQuery({
    queryKey: ['leave-types', 'list', 'policy-capabilities', company, user, formData.leave_type_id],
    queryFn: () => leaveTypeService.getById(formData.leave_type_id),
    enabled: isModalOpen && !!formData.leave_type_id,
    staleTime: 0,
  });
  const selectedType = typeCapabilities.data;


  // ---------- Handlers ----------
  const populateForm = (item: LeavePolicy) => {
    setSelectedItem(item);
    setFormData({
      leave_type_id: item.leave_type?.uuid || item.leave_type?.id || "",
      grade_band_id: item.grade_band_id ?? "",
      department_id: item.department_id ?? "",
      annual_entitlement: item.annual_entitlement,
      carry_forward_limit: item.carry_forward_limit?.toString() ?? "",
      encashment_limit: item.encashment_limit?.toString() ?? "",
      accrual_rate: item.accrual_rate?.toString() ?? "",
      accrual_period: item.accrual_rate == null ? "" : ACCRUAL_PERIODS.some(option => option.value === item.accrual_period) ? item.accrual_period! : "",
      probation_eligible: item.probation_eligible,
      min_service_months: item.min_service_months,
      max_consecutive_days: item.max_consecutive_days?.toString() ?? "",
      requires_approval: item.requires_approval,
      effective_from: item.effective_from?.slice(0, 10) || "",
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
      deleteMutation.mutate(deleteUuid, { onSuccess: () => {setDeleteUuid(null);if (policies.length === 1 && page > 1) setPage(page - 1);} });
    }
  };

  const handleSave = () => {
    if (modalMode === "create" && !formData.leave_type_id) {
      toast.error("Leave type required"); return;
    }
    if (!formData.effective_from) { toast.error("Effective from required"); return; }

    if (createMutation.isPending || updateMutation.isPending) return;
    const limits: [string, number | string, number, number, boolean][] = [
      ["Annual entitlement", formData.annual_entitlement, 0, 999.9, false],
      ["Carry-forward limit", formData.carry_forward_limit, 0, 999.9, false],
      ["Encashment limit", formData.encashment_limit, 0, 999.9, false],
      ["Accrual rate", formData.accrual_rate, 0, 99.99, false],
      ["Minimum service", formData.min_service_months, 0, 120, true],
      ["Maximum consecutive days", formData.max_consecutive_days, 1, 365, true],
    ];
    for (const [label,value,min,max,integer] of limits) {
      if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max || (integer && !Number.isInteger(Number(value))))) {toast.error(`${label} must be ${integer ? "a whole number " : ""}between ${min} and ${max}`); return;}
    }
    if (formData.accrual_rate !== "" && !formData.accrual_period) {toast.error("Select an accrual period when an accrual rate is set");return;}
    if (modalMode === "create" && [formData.grade_band_id,formData.department_id].some(id=>id !== "" && (!Number.isInteger(id) || Number(id) < 1))) {toast.error("Select a valid grade band and department");return;}
    if (Number(formData.carry_forward_limit) > 0 || Number(formData.encashment_limit) > 0) {
      if (typeCapabilities.isFetching || typeCapabilities.isError || !selectedType) {toast.error("Wait for leave type capabilities to load before saving positive limits");return;}
      if (Number(formData.carry_forward_limit) > 0 && !selectedType.carry_forward_allowed) {toast.error("Enable carry forward on this Leave Type before setting a positive carry-forward limit");return;}
      if (Number(formData.encashment_limit) > 0 && !selectedType.is_encashable) {toast.error("Enable encashment on this Leave Type before setting a positive encashment limit");return;}
    }
    const payload = { ...formData, accrual_period: formData.accrual_rate === "" ? "" as const : formData.accrual_period };
    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.uuid || selectedItem.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  // ---------- Table columns ----------
  const columns: ColumnDef<LeavePolicy & { sr: number }>[] = [
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
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${row.original.leave_type?.name || "policy"}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={()=>handleView(row.original)}><Eye className="mr-2 h-4 w-4" />View details</DropdownMenuItem><DropdownMenuItem onClick={()=>handleEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem><DropdownMenuItem className="text-red-600" onClick={()=>handleDelete(row.original.uuid || row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
        ),
      },
    ];

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
              <CardTitle className="text-2xl font-semibold text-gray-900">Leave Policies</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} policies</p>
            </div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={isFetching} onClick={()=>void refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button><Button size="sm" className="bg-[#1E1B4B] hover:bg-[#2A2675]" onClick={handleCreate}><PlusIcon className="mr-2 h-4 w-4" />Create policy</Button></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3"><div className="relative min-w-[240px] flex-1"><SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input aria-label="Search leave policies" placeholder="Search policies…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="pl-10" /></div><div className="flex items-center gap-2 text-sm text-gray-600"><span>Show</span><SearchableSelect aria-label="Policies per page" allowAll={false} widthClass="w-28" value={String(perPage)} options={[10,25,50,100].map(n=>({value:String(n),label:String(n)}))} onChange={v=>{setPerPage(Number(v));setPage(1);}} /><span>entries</span></div></div>
          {/* Stats */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 flex justify-between items-center text-sm text-gray-600">
            <span className="text-sm">Showing {showingFrom} to {showingTo} of {totalEntries} entries</span>
            {(isLoading || isFetching) && <AppLoader variant="inline" label="Loading…" />}
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <div className="overflow-x-auto"><table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id} className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 cursor-pointer" onClick={h.column.getToggleSortingHandler()}>
                        <div className={`flex items-center gap-1 ${h.id === "actions" ? "justify-end" : ""}`}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === 'asc' ? <ChevronRight className="h-4 w-4" /> : h.column.getIsSorted() === 'desc' ? <ChevronLeft className="h-4 w-4" /> : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr><td colSpan={columns.length} className="py-12 text-center"><AppLoader label="Loading leave policies…" /></td></tr>
                ) : error ? (<tr><td colSpan={columns.length} className="p-6"><ApiErrorState error={error} onRetry={()=>void refetch()} /></td></tr>) : rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="py-12 text-center">No policies found</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-4 px-6 text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table></div>

          {/* Pagination */}
          {!isLoading && rows.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-between items-center border-t border-gray-200 bg-gray-50 px-6 py-4">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1 || isFetching}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isFetching}><ChevronLeft className="h-4 w-4" /></Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let num;
                  if (totalPages <= 5) num = i + 1;
                  else if (page <= 3) num = i + 1;
                  else if (page >= totalPages - 2) num = totalPages - 4 + i;
                  else num = page - 2 + i;
                  return <Button key={num} variant={page === num ? "default" : "outline"} size="sm" disabled={isFetching} className={page === num ? "bg-[#1E1B4B] hover:bg-[#2A2675]" : ""} onClick={() => setPage(num)}>{num}</Button>;
                })}
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || isFetching}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages || isFetching}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={open=>{if (!createMutation.isPending && !updateMutation.isPending) setIsModalOpen(open);}}>
        <DialogContent className="sm:max-w-[740px] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
          <DialogHeader className="shrink-0 border-b bg-gray-50/70 px-6 py-4">
            <DialogTitle>
              {modalMode === "create" ? "Add Leave Policy" : modalMode === "edit" ? "Edit Leave Policy" : "View Leave Policy"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "Read-only view." :
               modalMode === "edit" ? "Only policy values can be updated (scope locked)." :
               "Set the scope, entitlement and eligibility rules for this policy."}
            </DialogDescription>
          </DialogHeader>
{typeCapabilities.isFetching && formData.leave_type_id && <p role="status" className="px-6 pt-4 text-xs text-gray-500">Checking leave type capabilities…</p>}
{typeCapabilities.error && <div className="px-6 pt-4"><ApiErrorState error={typeCapabilities.error} onRetry={() => void typeCapabilities.refetch()} /></div>}
<fieldset disabled={modalMode === "view" || createMutation.isPending || updateMutation.isPending} className="min-h-0 overflow-y-auto p-6 space-y-5 divide-y divide-gray-100 [&>section+section]:pt-5"><section className="space-y-4"><h3 className="text-sm font-semibold text-[#1E1B4B]">Scope & effective date</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">            {/* Leave Type (disabled on edit/view) */}
            <div className="space-y-1.5">
              <label htmlFor="policy-leave_type_id" className="text-sm font-medium">Leave Type *</label>
              <SearchableSelect
                id="policy-leave_type_id"
                options={leaveTypeOptions}
                value={formData.leave_type_id || ""}
                onChange={v => setFormData(p => ({ ...p, leave_type_id: v as string }))}
                placeholder="Select leave type"
                groupLabel="Leave Types"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode !== "create" || isLoadingLeaveTypes || createMutation.isPending}
                multiple={false}
              />
            </div>

            {/* Effective From */}
            <div className="space-y-1.5">
              <label htmlFor="policy-effective_from" className="text-sm font-medium">Effective From *</label>
              <Input id="policy-effective_from" type="date" value={formData.effective_from} onChange={e => setFormData(p => ({ ...p, effective_from: e.target.value }))} disabled={modalMode === "view"} />
            </div>

            {/* Grade Band (disabled on edit/view) */}
            <div className="space-y-1.5">
              <label htmlFor="policy-grade_band_id" className="text-sm font-medium">Grade Band</label>
              <SearchableSelect
                id="policy-grade_band_id"
                options={gradeBandOptions}
                value={formData.grade_band_id ? String(formData.grade_band_id) : ""}
                onChange={v => setFormData(p => ({ ...p, grade_band_id: v === "" ? "" : Number(v) }))}
                placeholder="Select grade band (optional)"
                groupLabel="Grade Bands"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode !== "create" || isLoadingGradeBands || createMutation.isPending}
                multiple={false}
              />
            </div>

            {/* Department (disabled on edit/view) */}
            <div className="space-y-1.5">
              <label htmlFor="policy-department_id" className="text-sm font-medium">Department</label>
              <SearchableSelect
                id="policy-department_id"
                options={departmentOptions}
                value={formData.department_id ? String(formData.department_id) : ""}
                onChange={v => setFormData(p => ({ ...p, department_id: v === "" ? "" : Number(v) }))}
                placeholder="Select department (optional)"
                groupLabel="Departments"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode !== "create" || isLoadingDepartments || createMutation.isPending}
                multiple={false}
              />
            </div>

</div></section><p className="text-xs text-gray-500">Leave type, grade and department are fixed after creation. Empty grade or department applies to all.</p><section className="space-y-4"><h3 className="text-sm font-semibold text-[#1E1B4B]">Entitlement & accrual</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">            {/* Annual Entitlement */}
            <div className="space-y-1.5">
              <label htmlFor="policy-annual_entitlement" className="text-sm font-medium">Annual Entitlement *</label>
              <Input id="policy-annual_entitlement" type="number" min={0} max={999.9} step="0.1" value={formData.annual_entitlement} onChange={e => setFormData(p => ({ ...p, annual_entitlement: Number(e.target.value) || 0 }))} disabled={modalMode === "view"} />
            </div>

            {/* Carry Forward Limit */}
            <div className="space-y-1.5">
              <label htmlFor="policy-carry_forward_limit" className="text-sm font-medium">Carry Fwd Limit</label>
              <Input id="policy-carry_forward_limit" type="number" step="0.1" min={0} max={selectedType?.carry_forward_allowed === false ? 0 : 999.9} value={formData.carry_forward_limit} onChange={e => setFormData(p => ({ ...p, carry_forward_limit: e.target.value }))} disabled={modalMode === "view"} />
              {selectedType?.carry_forward_allowed === false && <p className="text-xs text-amber-700">Enable carry forward on the Leave Type to set a positive limit.</p>}
            </div>

            {/* Encashment Limit */}
            <div className="space-y-1.5">
              <label htmlFor="policy-encashment_limit" className="text-sm font-medium">Encashment Limit</label>
              <Input id="policy-encashment_limit" type="number" step="0.1" min={0} max={selectedType?.is_encashable === false ? 0 : 999.9} value={formData.encashment_limit} onChange={e => setFormData(p => ({ ...p, encashment_limit: e.target.value }))} disabled={modalMode === "view"} />
              {selectedType?.is_encashable === false && <p className="text-xs text-amber-700">Enable encashment on the Leave Type to set a positive limit.</p>}
            </div>

            {/* Accrual Rate */}
            <div className="space-y-1.5">
              <label htmlFor="policy-accrual_rate" className="text-sm font-medium">Accrual Rate</label>
              <Input id="policy-accrual_rate" type="number" step="0.01" min={0} max={99.99} value={formData.accrual_rate} onChange={e => setFormData(p => ({ ...p, accrual_rate: e.target.value, accrual_period: e.target.value === "" ? "" : p.accrual_period }))} disabled={modalMode === "view"} />
            </div>

            <p className="text-xs text-gray-500 sm:col-span-2">Clear the accrual rate to disable accrual and clear its period.</p>
            {/* Accrual Period */}
            <div className="space-y-1.5">
              <label htmlFor="policy-accrual-period" className="text-sm font-medium">Accrual Period</label>
              <Select value={formData.accrual_period || "unspecified"} onValueChange={v => setFormData(p => ({ ...p, accrual_period: v === "unspecified" ? "" : v as AccrualPeriod }))} disabled={modalMode === "view" || createMutation.isPending || updateMutation.isPending || formData.accrual_rate === ""}>
                <SelectTrigger id="policy-accrual-period" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="unspecified">Not specified</SelectItem>{ACCRUAL_PERIODS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

</div></section><section className="space-y-4"><h3 className="text-sm font-semibold text-[#1E1B4B]">Eligibility & approval</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">            {/* Min Service Months */}
            <div className="space-y-1.5">
              <label htmlFor="policy-min_service_months" className="text-sm font-medium">Min Service (months)</label>
              <Input id="policy-min_service_months" type="number" min={0} max={120} value={formData.min_service_months} onChange={e => setFormData(p => ({ ...p, min_service_months: Number(e.target.value) || 0 }))} disabled={modalMode === "view"} />
            </div>

            {/* Max Consecutive Days */}
            <div className="space-y-1.5">
              <label htmlFor="policy-max_consecutive_days" className="text-sm font-medium">Max Consecutive Days</label>
              <Input id="policy-max_consecutive_days" type="number" min={1} max={365} value={formData.max_consecutive_days} onChange={e => setFormData(p => ({ ...p, max_consecutive_days: e.target.value }))} disabled={modalMode === "view"} placeholder="Optional" />
            </div>

            {/* Checkboxes */}
            <label htmlFor="policy-probation_eligible" className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5"><span><span className="block text-sm font-medium text-gray-800">Probation eligible</span><span className="block text-xs text-gray-500">Allow leave during probation.</span></span><Checkbox id="policy-probation_eligible" checked={formData.probation_eligible} onCheckedChange={v=>setFormData(p=>({...p,probation_eligible:v === true}))} /></label>
            <label htmlFor="policy-requires_approval" className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5"><span><span className="block text-sm font-medium text-gray-800">Approval required</span><span className="block text-xs text-gray-500">Require approval before leave is granted.</span></span><Checkbox id="policy-requires_approval" checked={formData.requires_approval} onCheckedChange={v=>setFormData(p=>({...p,requires_approval:v === true}))} /></label>
            <label htmlFor="policy-is_active" className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5"><span><span className="block text-sm font-medium text-gray-800">Active policy</span><span className="block text-xs text-gray-500">Make this policy available for use.</span></span><Checkbox id="policy-is_active" checked={formData.is_active} onCheckedChange={v=>setFormData(p=>({...p,is_active:v === true}))} /></label>
</div></section></fieldset>
          <div className="shrink-0 border-t border-gray-100 px-6 py-3 text-xs text-gray-500">Policy changes do not reset or credit existing balances, or change the approval hierarchy.</div>
          <DialogFooter className="shrink-0 border-t bg-gray-50/70 px-6 py-4">
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" disabled={createMutation.isPending || updateMutation.isPending} onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="bg-[#1E1B4B] hover:bg-[#2A2675]" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {modalMode === "create" ? "Create policy" : "Save changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUuid} onOpenChange={open=>{if (!open && !deleteMutation.isPending) setDeleteUuid(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Policy?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={e=>{e.preventDefault();confirmDelete();}} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
