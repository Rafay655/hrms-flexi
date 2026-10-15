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
import {
  useAccrualRules,
  useCreateAccrualRule,
  useUpdateAccrualRule,
  useDeleteAccrualRule,
} from "@/hooks/useAccrualRules";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { AccrualRule, AccrualRuleFormData, AccrualFrequency } from "@/types/accrual-rule";

const DEFAULT_PER_PAGE = 15;

const ACCRUAL_FREQUENCIES: { value: AccrualFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half Yearly" },
  { value: "yearly", label: "Yearly" },
  { value: "pro_rata", label: "Pro Rata" },
];

export default function AccrualRulesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Leave types dropdown
  const { data: leaveTypesRaw, isLoading: isLoadingLeaveTypes } = useLeaveTypes({ per_page: 1000 });
  const leaveTypes = useMemo(() => leaveTypesRaw?.data?.data ?? [], [leaveTypesRaw]);
  const leaveTypeOptions: Option[] = useMemo(
    () => leaveTypes.map((lt: any) => ({ value: String(lt.uuid ?? lt.id), label: `${lt.name} (${lt.code})` })),
    [leaveTypes]
  );

  // Data
  const { data, isLoading, isFetching, error } = useAccrualRules({ page, per_page: perPage });

  const rules = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const createMutation = useCreateAccrualRule();
  const updateMutation = useUpdateAccrualRule();
  const deleteMutation = useDeleteAccrualRule();

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedRule, setSelectedRule] = useState<AccrualRule | null>(null);
  const [formData, setFormData] = useState<AccrualRuleFormData>({
    leave_type_uuid: "",
    name: "",
    accrual_frequency: "",
    days_per_accrual: 0,
    max_carry_forward: "",
    carry_forward_expiry_months: "",
    is_prorated_for_new_joiners: false,
    min_service_months_for_accrual: 0,
    is_active: true,
    effective_from: "",
    effective_to: null,
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load accrual rules" });
  }, [error]);

  const handleView = (rule: AccrualRule) => {
    setSelectedRule(rule);
    setFormData({
      leave_type_uuid: rule.leave_type_uuid,
      name: rule.name,
      accrual_frequency: rule.accrual_frequency,
      days_per_accrual: rule.days_per_accrual,
      max_carry_forward: rule.max_carry_forward?.toString() ?? "",
      carry_forward_expiry_months: rule.carry_forward_expiry_months?.toString() ?? "",
      is_prorated_for_new_joiners: rule.is_prorated_for_new_joiners,
      min_service_months_for_accrual: rule.min_service_months_for_accrual,
      is_active: rule.is_active,
      effective_from: rule.effective_from.split('T')[0] ?? rule.effective_from.split(' ')[0],
      effective_to: rule.effective_to ? (rule.effective_to.split('T')[0] ?? rule.effective_to.split(' ')[0]) : null,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (rule: AccrualRule) => {
    handleView(rule);
    setModalMode("edit");
  };

  const handleCreate = () => {
    setSelectedRule(null);
    setFormData({
      leave_type_uuid: "",
      name: "",
      accrual_frequency: "",
      days_per_accrual: 0,
      max_carry_forward: "",
      carry_forward_expiry_months: "",
      is_prorated_for_new_joiners: false,
      min_service_months_for_accrual: 0,
      is_active: true,
      effective_from: "",
      effective_to: null,
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
    const trimmedName = formData.name.trim();
    if (!formData.leave_type_uuid) { toast.error("Leave type required"); return; }
    if (!trimmedName) { toast.error("Name required"); return; }
    if (trimmedName.length > 255) { toast.error("Name max 255 chars"); return; }
    if (!formData.accrual_frequency) { toast.error("Accrual frequency required"); return; }
    if (formData.days_per_accrual < 0.25 || formData.days_per_accrual > 999.99) { toast.error("Days per accrual 0.25–999.99"); return; }
    if (!formData.effective_from) { toast.error("Effective from required"); return; }

    const payload = { ...formData, name: trimmedName };
    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedRule) {
      updateMutation.mutate(
        { uuid: selectedRule.uuid, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const columns: ColumnDef<AccrualRule & { sr: number }>[] = useMemo(() => [
    { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <div className="font-semibold">{row.original.name}</div> },
    {
      id: "leave_type",
      header: "Leave Type",
      cell: ({ row }) => <span>{row.original.leave_type_name ?? "—"}</span>,
    },
    {
      accessorKey: "accrual_frequency",
      header: "Frequency",
      cell: ({ row }) => {
        const opt = ACCRUAL_FREQUENCIES.find(o => o.value === row.original.accrual_frequency);
        return <Badge variant="outline">{opt?.label ?? row.original.accrual_frequency}</Badge>;
      },
    },
    { accessorKey: "days_per_accrual", header: "Days/Accrual", cell: ({ row }) => row.original.days_per_accrual },
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
  ], []);

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return rules.map((r, idx) => ({ ...r, sr: startSr + idx + 1 }));
  }, [rules, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Accrual Rules</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} rules</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-600">Show</span>
            <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">{[10,15,25,50,100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-sm text-gray-600">entries</span>
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
                  <tr><td colSpan={columns.length} className="py-12 text-center">No rules found</td></tr>
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
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add Accrual Rule" : modalMode === "edit" ? "Edit Accrual Rule" : "View Accrual Rule"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "Read-only view." : "Fill in the details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Leave Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Leave Type *</label>
              <SearchableSelect
                options={leaveTypeOptions}
                value={formData.leave_type_uuid || ""}
                onChange={v => setFormData(p => ({ ...p, leave_type_uuid: v as string }))}
                placeholder="Select leave type"
                groupLabel="Leave Types"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || isLoadingLeaveTypes}
                multiple={false}
              />
            </div>
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} disabled={modalMode === "view"} maxLength={255} />
            </div>
            {/* Accrual Frequency */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Accrual Frequency *</label>
              <Select value={formData.accrual_frequency} onValueChange={v => setFormData(p => ({ ...p, accrual_frequency: v as AccrualFrequency | '' }))} disabled={modalMode === "view"}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ACCRUAL_FREQUENCIES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Days Per Accrual */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Days Per Accrual *</label>
              <Input type="number" step="0.01" min={0.25} max={999.99} value={formData.days_per_accrual} onChange={e => setFormData(p => ({ ...p, days_per_accrual: Number(e.target.value) }))} disabled={modalMode === "view"} />
            </div>
            {/* Max Carry Forward */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max Carry Forward</label>
              <Input type="number" step="0.01" min={0} value={formData.max_carry_forward} onChange={e => setFormData(p => ({ ...p, max_carry_forward: e.target.value }))} disabled={modalMode === "view"} placeholder="Optional" />
            </div>
            {/* Carry Forward Expiry Months */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Carry Fwd Expiry (months)</label>
              <Input type="number" min={0} max={24} value={formData.carry_forward_expiry_months} onChange={e => setFormData(p => ({ ...p, carry_forward_expiry_months: e.target.value }))} disabled={modalMode === "view"} placeholder="Optional" />
            </div>
            {/* Min Service Months */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Min Service (months)</label>
              <Input type="number" min={0} max={120} value={formData.min_service_months_for_accrual} onChange={e => setFormData(p => ({ ...p, min_service_months_for_accrual: Number(e.target.value) }))} disabled={modalMode === "view"} />
            </div>
            {/* Effective From */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Effective From *</label>
              <Input type="date" value={formData.effective_from} onChange={e => setFormData(p => ({ ...p, effective_from: e.target.value }))} disabled={modalMode === "view"} />
            </div>
            {/* Effective To */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Effective To</label>
              <Input type="date" value={formData.effective_to ?? ""} onChange={e => setFormData(p => ({ ...p, effective_to: e.target.value || null }))} disabled={modalMode === "view"} min={formData.effective_from} />
            </div>
          </div>
          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.is_prorated_for_new_joiners} onCheckedChange={c => setFormData(p => ({ ...p, is_prorated_for_new_joiners: !!c }))} disabled={modalMode === "view"} />
              <label className="text-sm">Prorated for New Joiners</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={formData.is_active} onCheckedChange={c => setFormData(p => ({ ...p, is_active: !!c }))} disabled={modalMode === "view"} />
              <label className="text-sm">Active</label>
            </div>
          </div>
          <DialogFooter className="mt-4">
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
          <AlertDialogHeader><AlertDialogTitle>Delete Accrual Rule?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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