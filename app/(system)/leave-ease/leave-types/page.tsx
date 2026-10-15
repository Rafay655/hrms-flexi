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

import { useGenders } from "@/hooks/useGenders";
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
} from "@/hooks/useLeaveTypes";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { LeaveType, LeaveTypeFormData, GenderRestriction, AccrualType } from "@/types/leave-type";

const DEFAULT_PER_PAGE = 15;

const ACCRUAL_TYPES: { value: AccrualType; label: string }[] = [
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

export default function LeaveTypesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const isActiveParam = activeFilter === "all" ? undefined : activeFilter === "active" ? 1 : 0;

  // Fetch genders for dynamic gender restriction dropdown
  const { data: gendersData, isLoading: isLoadingGenders } = useGenders({ per_page: 1000 });
  const genders = useMemo(() => {
    if (!gendersData) return [];
    return gendersData?.data ?? [];
  }, [gendersData]);

  const genderOptions: Option[] = useMemo(() => {
    return genders
      .filter((g: any) => ['male', 'female'].includes(g.name.toLowerCase()))
      .map((g: any) => ({ value: g.name.toLowerCase(), label: g.name }));
  }, [genders]);

  // Leave types data
  const { data, isLoading, isFetching, error } = useLeaveTypes({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_active: isActiveParam,
  });

  const leaveTypes = data?.data?.data ?? [];
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = data?.data?.meta?.last_page ?? 1;

  const createMutation = useCreateLeaveType();
  const updateMutation = useUpdateLeaveType();
  const deleteMutation = useDeleteLeaveType();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState<LeaveTypeFormData>({
    name: "",
    code: "",
    is_paid: false,
    default_days_per_year: "",
    is_encashable: false,
    carry_forward_allowed: false,
    carry_forward_max_days: "",
    requires_attachment: false,
    min_days_notice: 0,
    allow_half_day: false,
    is_gender_specific: false,
    gender_restriction: "",
    accrual_type: "",
    is_active: true,
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, activeFilter]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load leave types" });
  }, [error]);

  const handleView = (item: LeaveType) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      is_paid: item.is_paid,
      default_days_per_year: item.default_days_per_year?.toString() ?? "",
      is_encashable: item.is_encashable,
      carry_forward_allowed: item.carry_forward_allowed,
      carry_forward_max_days: item.carry_forward_max_days?.toString() ?? "",
      requires_attachment: item.requires_attachment,
      min_days_notice: item.min_days_notice,
      allow_half_day: item.allow_half_day,
      is_gender_specific: item.is_gender_specific,
      gender_restriction: item.gender_restriction ?? "",
      accrual_type: item.accrual_type ?? "",
      is_active: item.is_active,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: LeaveType) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      is_paid: item.is_paid,
      default_days_per_year: item.default_days_per_year?.toString() ?? "",
      is_encashable: item.is_encashable,
      carry_forward_allowed: item.carry_forward_allowed,
      carry_forward_max_days: item.carry_forward_max_days?.toString() ?? "",
      requires_attachment: item.requires_attachment,
      min_days_notice: item.min_days_notice,
      allow_half_day: item.allow_half_day,
      is_gender_specific: item.is_gender_specific,
      gender_restriction: item.gender_restriction ?? "",
      accrual_type: item.accrual_type ?? "",
      is_active: item.is_active,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      name: "",
      code: "",
      is_paid: false,
      default_days_per_year: "",
      is_encashable: false,
      carry_forward_allowed: false,
      carry_forward_max_days: "",
      requires_attachment: false,
      min_days_notice: 0,
      allow_half_day: false,
      is_gender_specific: false,
      gender_restriction: "",
      accrual_type: "",
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
    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim();
    if (!trimmedName) { toast.error("Name required"); return; }
    if (trimmedName.length > 100) { toast.error("Name ≤ 100 chars"); return; }
    if (!trimmedCode) { toast.error("Code required"); return; }
    if (trimmedCode.length > 20) { toast.error("Code ≤ 20 chars"); return; }
    if (formData.is_gender_specific && !formData.gender_restriction) {
      toast.error("Gender restriction required when gender specific");
      return;
    }

    const payload = { ...formData, name: trimmedName, code: trimmedCode };
    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.uuid, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const columns: ColumnDef<LeaveType & { sr: number }>[] = useMemo(() => [
    { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
    { accessorKey: "code", header: "Code", cell: ({ row }) => <div className="font-mono font-semibold">{row.original.code}</div> },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <div className="font-semibold">{row.original.name}</div> },
    {
      id: "days",
      header: "Days/Year",
      cell: ({ row }) => <span>{row.original.default_days_per_year ?? "—"}</span>,
    },
    {
      id: "flags",
      header: "Flags",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.is_paid && <Badge variant="outline" className="bg-green-50">Paid</Badge>}
          {row.original.is_encashable && <Badge variant="outline" className="bg-blue-50">Encash</Badge>}
          {row.original.carry_forward_allowed && <Badge variant="outline" className="bg-purple-50">Carry</Badge>}
          {row.original.requires_attachment && <Badge variant="outline" className="bg-yellow-50">Attach</Badge>}
          {row.original.allow_half_day && <Badge variant="outline" className="bg-teal-50">½Day</Badge>}
        </div>
      ),
    },
    {
      accessorKey: "accrual_type",
      header: "Accrual",
      cell: ({ row }) => <Badge variant="outline">{row.original.accrual_type ?? "—"}</Badge>,
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
    return leaveTypes.map((lt, idx) => ({ ...lt, sr: startSr + idx + 1 }));
  }, [leaveTypes, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Leave Types</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} leave types</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Leave Type
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
            <div className="w-full md:w-48">
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent className="bg-white"><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue placeholder="15" /></SelectTrigger>
                <SelectContent className="bg-white">{[10,15,25,50,100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats Bar */}
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
                  <tr><td colSpan={columns.length} className="py-12 text-center">No leave types found</td></tr>
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
            <DialogTitle>{modalMode === "create" ? "Add Leave Type" : modalMode === "edit" ? "Edit Leave Type" : "View Leave Type"}</DialogTitle>
            <DialogDescription>{modalMode === "view" ? "Read-only view." : "Fill in the details."}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} disabled={modalMode === "view"} maxLength={100} />
            </div>
            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Code *</label>
              <Input value={formData.code} onChange={e => setFormData(p => ({...p, code: e.target.value}))} disabled={modalMode === "view"} maxLength={20} />
            </div>
            {/* Accrual Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Accrual Type</label>
              <Select value={formData.accrual_type} onValueChange={v => setFormData(p => ({...p, accrual_type: v as AccrualType | ''}))} disabled={modalMode === "view"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ACCRUAL_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Default Days Per Year */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Days Per Year</label>
              <Input type="number" step="0.1" value={formData.default_days_per_year} onChange={e => setFormData(p => ({...p, default_days_per_year: e.target.value}))} disabled={modalMode === "view"} />
            </div>
            {/* Is Paid */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.is_paid} onCheckedChange={c => setFormData(p => ({...p, is_paid: !!c}))} disabled={modalMode === "view"} />
              <label className="text-sm">Paid</label>
            </div>
            {/* Is Encashable */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.is_encashable} onCheckedChange={c => setFormData(p => ({...p, is_encashable: !!c}))} disabled={modalMode === "view"} />
              <label className="text-sm">Encashable</label>
            </div>
            {/* Carry Forward */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.carry_forward_allowed} onCheckedChange={c => setFormData(p => ({...p, carry_forward_allowed: !!c}))} disabled={modalMode === "view"} />
              <label className="text-sm">Carry Forward</label>
            </div>
            {/* Carry Forward Max Days */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Carry Fwd Max Days</label>
              <Input type="number" step="0.1" value={formData.carry_forward_max_days} onChange={e => setFormData(p => ({...p, carry_forward_max_days: e.target.value}))} disabled={modalMode === "view"} />
            </div>
            {/* Requires Attachment */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.requires_attachment} onCheckedChange={c => setFormData(p => ({...p, requires_attachment: !!c}))} disabled={modalMode === "view"} />
              <label className="text-sm">Requires Attachment</label>
            </div>
            {/* Allow Half Day */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.allow_half_day} onCheckedChange={c => setFormData(p => ({...p, allow_half_day: !!c}))} disabled={modalMode === "view"} />
              <label className="text-sm">Allow Half Day</label>
            </div>
            {/* Min Days Notice */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Min Days Notice</label>
              <Input type="number" value={formData.min_days_notice} onChange={e => setFormData(p => ({...p, min_days_notice: Number(e.target.value) || 0}))} disabled={modalMode === "view"} />
            </div>
            {/* Is Gender Specific */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.is_gender_specific} onCheckedChange={c => setFormData(p => ({...p, is_gender_specific: !!c}))} disabled={modalMode === "view"} />
              <label className="text-sm">Gender Specific</label>
            </div>
            {/* Gender Restriction (dynamic from useGenders) */}
            {formData.is_gender_specific && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gender Restriction *</label>
                <SearchableSelect
                  options={genderOptions}
                  value={formData.gender_restriction || ""}
                  onChange={(v) => setFormData(p => ({ ...p, gender_restriction: v as GenderRestriction | '' }))}
                  placeholder="Select gender restriction"
                  groupLabel="Genders"
                  allowAll={false}
                  widthClass="w-full"
                  disabled={modalMode === "view" || isLoadingGenders}
                  multiple={false}
                />
              </div>
            )}
            {/* Active */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.is_active} onCheckedChange={c => setFormData(p => ({...p, is_active: !!c}))} disabled={modalMode === "view"} />
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
          <AlertDialogHeader><AlertDialogTitle>Delete Leave Type?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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