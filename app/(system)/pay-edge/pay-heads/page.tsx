// app/(system)/payroll/pay-heads/page.tsx
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

import {
  usePayHeads,
  useCreatePayHead,
  useUpdatePayHead,
  useDeletePayHead,
} from "@/hooks/usePayHeads";
import type {
  PayHead,
  PayHeadFormData,
  PayHeadType,
  PayHeadCategory,
  CalculationType,
  StatutoryCode,
} from "@/types/pay-head";

const DEFAULT_PER_PAGE = 25;

const PAY_HEAD_TYPES: { value: PayHeadType; label: string }[] = [
  { value: "earning", label: "Earning" },
  { value: "deduction", label: "Deduction" },
  { value: "employer_contribution", label: "Contribution" },
];

const PAY_HEAD_CATEGORIES: { value: PayHeadCategory; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "allowance", label: "Allowance" },
  { value: "statutory", label: "Statutory" },
  { value: "voluntary", label: "Voluntary" },
  { value: "bonus", label: "Bonus" },
  { value: "reimbursement", label: "Reimbursement" },
  { value: "other", label: "Other" },
];

const CALCULATION_TYPES: { value: CalculationType; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "percentage_of_basic", label: "% of Basic" },
  { value: "percentage_of_gross", label: "% of Gross" },
  { value: "percentage_of_ctc", label: "% of CTC" },
  { value: "formula", label: "Formula" },
  { value: "slab_based", label: "Slab Based" },
];

const STATUTORY_CODES: { value: StatutoryCode; label: string }[] = [
  { value: "eobi_employee", label: "EOBI Employee" },
  { value: "eobi_employer", label: "EOBI Employer" },
  { value: "pessi", label: "PESSI" },
  { value: "fbr_tax", label: "FBR Tax" },
  { value: "professional_tax", label: "Professional Tax" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function PayHeadsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isFetching, error } = usePayHeads({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const payHeads = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const createMutation = useCreatePayHead();
  const updateMutation = useUpdatePayHead();
  const deleteMutation = useDeletePayHead();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<PayHead | null>(null);
  const [formData, setFormData] = useState<PayHeadFormData>({
    code: "",
    name: "",
    name_urdu: "",
    type: "",
    category: "",
    calculation_type: "",
    formula_expression: "",
    is_taxable: false,
    is_statutory: false,
    statutory_code: "",
    affects_eobi: false,
    affects_pessi: false,
    is_part_of_gross: false,
    is_part_of_ctc: false,
    is_overridable: false,   // ✅ new default
    display_order: 0,
    is_active: true,
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load pay heads" });
  }, [error]);

  const populateForm = (item: PayHead) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      name_urdu: item.name_urdu ?? "",
      type: item.type,
      category: item.category,
      calculation_type: item.calculation_type,
      formula_expression: item.formula_expression ?? "",
      is_taxable: item.is_taxable,
      is_statutory: item.is_statutory,
      statutory_code: item.statutory_code ?? "",
      affects_eobi: item.affects_eobi,
      affects_pessi: item.affects_pessi,
      is_part_of_gross: item.is_part_of_gross,
      is_part_of_ctc: item.is_part_of_ctc,
      is_overridable: item.is_overridable,   // ✅ new field
      display_order: item.display_order,
      is_active: item.is_active,
    });
  };

  const handleView = (item: PayHead) => {
    populateForm(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: PayHead) => {
    populateForm(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      code: "",
      name: "",
      name_urdu: "",
      type: "",
      category: "",
      calculation_type: "",
      formula_expression: "",
      is_taxable: false,
      is_statutory: false,
      statutory_code: "",
      affects_eobi: false,
      affects_pessi: false,
      is_part_of_gross: false,
      is_part_of_ctc: false,
      is_overridable: false,   // ✅ new default
      display_order: 0,
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
    if (!formData.code.trim()) { toast.error("Code required"); return; }
    if (formData.code.trim().length > 20) { toast.error("Code max 20 chars"); return; }
    if (!formData.name.trim()) { toast.error("Name required"); return; }
    if (formData.name.trim().length > 100) { toast.error("Name max 100 chars"); return; }
    if (!formData.type) { toast.error("Type required"); return; }
    if (!formData.category) { toast.error("Category required"); return; }
    if (!formData.calculation_type) { toast.error("Calculation type required"); return; }
    if (formData.calculation_type === "formula" && !formData.formula_expression.trim()) {
      toast.error("Formula expression required when calculation type is formula");
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

  const columns: ColumnDef<PayHead & { sr: number }>[] = useMemo(() => [
    { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
    { accessorKey: "code", header: "Code", cell: ({ row }) => <div className="font-mono font-semibold">{row.original.code}</div> },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <div className="font-semibold">{row.original.name}</div> },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const opt = PAY_HEAD_TYPES.find(o => o.value === row.original.type);
        return <Badge variant="outline" className="bg-blue-50">{opt?.label ?? row.original.type}</Badge>;
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline" className="bg-purple-50">{row.original.category}</Badge>,
    },
    {
      accessorKey: "calculation_type",
      header: "Calc. Type",
      cell: ({ row }) => <span className="text-sm">{row.original.calculation_type}</span>,
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
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], []);

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return payHeads.map((ph, idx) => ({ ...ph, sr: startSr + idx + 1 }));
  }, [payHeads, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Pay Heads</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} pay heads</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Pay Head
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
                  <tr><td colSpan={columns.length} className="py-12 text-center">No pay heads found</td></tr>
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
              {modalMode === "create" ? "Add Pay Head" : modalMode === "edit" ? "Edit Pay Head" : "View Pay Head"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "Read-only view." : "Fill in the details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Code *</label>
              <Input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} disabled={modalMode === "view"} maxLength={20} />
            </div>
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} disabled={modalMode === "view"} maxLength={100} />
            </div>
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type *</label>
              <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v as PayHeadType | "" }))} disabled={modalMode === "view"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PAY_HEAD_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category *</label>
              <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v as PayHeadCategory | "" }))} disabled={modalMode === "view"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PAY_HEAD_CATEGORIES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Calculation Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Calculation Type *</label>
              <Select value={formData.calculation_type} onValueChange={v => setFormData(p => ({ ...p, calculation_type: v as CalculationType | "" }))} disabled={modalMode === "view"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CALCULATION_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Formula Expression (conditional) */}
            {formData.calculation_type === "formula" && (
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium">Formula Expression *</label>
                <Input value={formData.formula_expression} onChange={e => setFormData(p => ({ ...p, formula_expression: e.target.value }))} disabled={modalMode === "view"} />
              </div>
            )}
            {/* Display Order */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Display Order</label>
              <Input type="number" min={0} value={formData.display_order} onChange={e => setFormData(p => ({ ...p, display_order: Number(e.target.value) }))} disabled={modalMode === "view"} />
            </div>
            {/* Statutory Code */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Statutory Code</label>
              <Select
                value={formData.statutory_code || "__none__"}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    statutory_code: v === "__none__" ? "" : (v as StatutoryCode | ""),
                  }))
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {STATUTORY_CODES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {[
              { label: "Is Taxable", key: "is_taxable" },
              { label: "Is Statutory", key: "is_statutory" },
              { label: "Affects EOBI", key: "affects_eobi" },
              { label: "Affects PESSI", key: "affects_pessi" },
              { label: "Part of Gross", key: "is_part_of_gross" },
              { label: "Part of CTC", key: "is_part_of_ctc" },
              { label: "Is Overridable", key: "is_overridable" },   // ✅ new checkbox
              { label: "Active", key: "is_active" },
            ].map(({ label, key }) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={(formData as any)[key]}
                  onCheckedChange={(c) => setFormData(p => ({ ...p, [key]: !!c }))}
                  disabled={modalMode === "view"}
                />
                {label}
              </label>
            ))}
          </div>

          <DialogFooter className="mt-6">
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
          <AlertDialogHeader><AlertDialogTitle>Delete Pay Head?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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