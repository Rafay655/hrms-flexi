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

import { useBranches } from "@/hooks/useBranches";
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from "@/hooks/useHolidays";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { Holiday, HolidayFormData, HolidayType } from "@/types/holiday";

const DEFAULT_PER_PAGE = 15;

const HOLIDAY_TYPES: { value: HolidayType; label: string }[] = [
  { value: "national", label: "National" },
  { value: "religious", label: "Religious" },
  { value: "regional", label: "Regional" },
  { value: "company", label: "Company" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function HolidaysPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Branches for dropdown
  const { data: branchesRaw, isLoading: isLoadingBranches } = useBranches({ per_page: 1000 });
  const branches = useMemo(() => {
    if (!branchesRaw) return [];
    return branchesRaw?.data?.data ?? [];
  }, [branchesRaw]);
  const branchOptions: Option[] = useMemo(
    () => branches.map((b: any) => ({ value: b.uuid ?? b.id, label: b.name })),
    [branches]
  );

  // Holidays data
  const { data, isLoading, isFetching, error } = useHolidays({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const holidays = data?.data?.data ?? [];
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = data?.data?.meta?.last_page ?? 1;

  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<HolidayFormData>({
    name: "",
    date: "",
    is_optional: false,
    applies_to_all_branches: true,
    branch_id: "",
    holiday_type: "",
    year: new Date().getFullYear().toString(),
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load holidays" });
  }, [error]);

  // Handlers
  const populateForm = (item: Holiday) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      date: item.date.split('T')[0] ?? item.date.split(' ')[0],
      is_optional: item.is_optional,
      applies_to_all_branches: item.applies_to_all_branches,
      branch_id: item.branch_id ?? "",
      holiday_type: item.holiday_type,
      year: item.year?.toString() ?? "",
    });
  };

  const handleView = (item: Holiday) => {
    populateForm(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: Holiday) => {
    populateForm(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      name: "",
      date: "",
      is_optional: false,
      applies_to_all_branches: true,
      branch_id: "",
      holiday_type: "",
      year: new Date().getFullYear().toString(),
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
    if (!trimmedName) { toast.error("Name required"); return; }
    if (trimmedName.length > 100) { toast.error("Name ≤ 100 chars"); return; }
    if (!formData.date) { toast.error("Date required"); return; }
    if (!formData.holiday_type) { toast.error("Holiday type required"); return; }
    if (!formData.applies_to_all_branches && !formData.branch_id) {
      toast.error("Branch is required when not all branches"); return;
    }

    const payload = { ...formData, name: trimmedName };
    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.uuid, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const columns: ColumnDef<Holiday & { sr: number }>[] = useMemo(() => [
    { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <div className="font-semibold">{row.original.name}</div> },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => row.original.date.split('T')[0] ?? row.original.date.split(' ')[0],
    },
    {
      accessorKey: "holiday_type",
      header: "Type",
      cell: ({ row }) => {
        const opt = HOLIDAY_TYPES.find(o => o.value === row.original.holiday_type);
        return <Badge variant="outline" className="bg-blue-50 text-blue-800">{opt?.label ?? row.original.holiday_type}</Badge>;
      },
    },
    {
      id: "optional",
      header: "Optional",
      cell: ({ row }) => (row.original.is_optional ? <Badge className="bg-amber-100 text-amber-800">Optional</Badge> : "—"),
    },
    {
      id: "branch",
      header: "Branch",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.applies_to_all_branches ? "All Branches" : (row.original.branch?.name ?? "—")}
        </div>
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
    return holidays.map((h, idx) => ({ ...h, sr: startSr + idx + 1 }));
  }, [holidays, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Holidays</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} holidays</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Holiday
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
                  <tr><td colSpan={columns.length} className="py-12 text-center">No holidays found</td></tr>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{modalMode === "create" ? "Add Holiday" : modalMode === "edit" ? "Edit Holiday" : "View Holiday"}</DialogTitle>
            <DialogDescription>{modalMode === "view" ? "Read-only view." : "Fill in the details."}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} disabled={modalMode === "view"} maxLength={100} />
            </div>
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date *</label>
              <Input type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} disabled={modalMode === "view"} />
            </div>
            {/* Holiday Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type *</label>
              <Select value={formData.holiday_type} onValueChange={v => setFormData(p => ({...p, holiday_type: v as HolidayType | ''}))} disabled={modalMode === "view"}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{HOLIDAY_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Year */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Year</label>
              <Input type="number" min={2000} max={2100} value={formData.year} onChange={e => setFormData(p => ({...p, year: e.target.value}))} disabled={modalMode === "view"} />
            </div>
            {/* Applies to All Branches */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox
                checked={formData.applies_to_all_branches}
                onCheckedChange={(c) => {
                  setFormData(p => ({
                    ...p,
                    applies_to_all_branches: !!c,
                    branch_id: "", // clear branch when toggled on
                  }));
                }}
                disabled={modalMode === "view"}
              />
              <label className="text-sm">Applies to All Branches</label>
            </div>
            {/* Branch (visible only when NOT all branches) */}
            {!formData.applies_to_all_branches && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Branch *</label>
                <SearchableSelect
                  options={branchOptions}
                  value={formData.branch_id || ""}
                  onChange={v => setFormData(p => ({...p, branch_id: v as string}))}
                  placeholder="Select branch"
                  groupLabel="Branches"
                  allowAll={false}
                  widthClass="w-full"
                  disabled={modalMode === "view" || isLoadingBranches}
                  multiple={false}
                />
              </div>
            )}
            {/* Is Optional */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.is_optional} onCheckedChange={c => setFormData(p => ({...p, is_optional: !!c}))} disabled={modalMode === "view"} />
              <label className="text-sm">Optional</label>
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
          <AlertDialogHeader><AlertDialogTitle>Delete Holiday?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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