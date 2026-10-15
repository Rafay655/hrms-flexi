"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
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
  PlusIcon,
  Eye,
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
import { useLwp, useCreateLwp } from "@/hooks/useLwp";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { LwpRecord, LwpFormData } from "@/types/lwp";

const DEFAULT_PER_PAGE = 15;

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function LwpPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Employee dropdown for create form
  const { data: employeesRaw, isLoading: isLoadingEmployees } = useEmployees({ per_page: 1000, detailed: 0 });
  const employees = employeesRaw ?? [];
  const employeeOptions: Option[] = useMemo(
    () => employees.map((e: any) => ({ value: e.uuid, label: `${e.employee_code} – ${e.name}` })),
    [employees]
  );

  // LWP data
  const { data, isLoading, isFetching, error } = useLwp({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const records = data?.data?.data ?? [];
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = data?.data?.meta?.last_page ?? 1;

  const createMutation = useCreateLwp();

  // View modal
  const [viewItem, setViewItem] = useState<LwpRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<LwpFormData>({
    employee_id: "",
    absence_date: "",
    lwp_days: 1,
    hr_notes: "",
  });

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load LWP records" });
  }, [error]);

  const handleView = (item: LwpRecord) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      employee_id: "",
      absence_date: "",
      lwp_days: 1,
      hr_notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveCreate = () => {
    if (!formData.employee_id) { toast.error("Employee required"); return; }
    if (!formData.absence_date) { toast.error("Absence date required"); return; }
    if (formData.lwp_days < 0.5 || formData.lwp_days > 30) { toast.error("LWP days must be between 0.5 and 30"); return; }
    if (!formData.hr_notes.trim()) { toast.error("HR notes required"); return; }
    if (formData.hr_notes.length > 2000) { toast.error("HR notes max 2000 characters"); return; }

    createMutation.mutate(formData, { onSuccess: () => setIsCreateModalOpen(false) });
  };

  const columns: ColumnDef<LwpRecord & { sr: number }>[] = useMemo(
    () => [
      { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.employee?.name ?? row.original.employee?.uuid}</div>
            <div className="text-xs text-gray-500">{row.original.employee?.uuid}</div>
          </div>
        ),
      },
      { accessorKey: "absence_date", header: "Date", cell: ({ row }) => row.original.absence_date },
      { accessorKey: "lwp_days", header: "LWP Days", cell: ({ row }) => row.original.lwp_days },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => <Badge variant="outline" className={row.original.source === "auto" ? "bg-blue-50" : "bg-gray-50"}>{row.original.source}</Badge>,
      },
      {
        accessorKey: "payroll_included",
        header: "Payroll",
        cell: ({ row }) => <Badge className={row.original.payroll_included ? "bg-green-100 text-green-800" : "bg-gray-300 text-brand-900"}>{row.original.payroll_included ? "Included" : "Excluded"}</Badge>,
      },
      {
        id: "created_by",
        header: "Created By",
        cell: ({ row }) => <span>{row.original.created_by?.name ?? "—"}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleView(row.original)}><Eye className="h-4 w-4" /></Button>
          </div>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return records.map((r, idx) => ({ ...r, sr: startSr + idx + 1 }));
  }, [records, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Leave Without Pay (LWP)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} records</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add LWP Record
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
                  <tr><td colSpan={columns.length} className="py-12 text-center">No records found</td></tr>
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

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>LWP Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <div className="flex justify-between"><span className="font-medium">Employee:</span><span>{viewItem.employee?.name ?? viewItem.employee?.uuid}</span></div>
              <div className="flex justify-between"><span className="font-medium">Date:</span><span>{viewItem.absence_date}</span></div>
              <div className="flex justify-between"><span className="font-medium">LWP Days:</span><span>{viewItem.lwp_days}</span></div>
              <div className="flex justify-between"><span className="font-medium">Source:</span><span>{viewItem.source}</span></div>
              <div className="flex justify-between"><span className="font-medium">Payroll:</span><span>{viewItem.payroll_included ? "Included" : "Excluded"}</span></div>
              <div><span className="font-medium">HR Notes:</span><p className="text-sm text-gray-600 mt-1">{viewItem.hr_notes ?? "—"}</p></div>
              <div className="flex justify-between"><span className="font-medium">Created By:</span><span>{viewItem.created_by?.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="font-medium">Created At:</span><span>{new Date(viewItem.created_at).toLocaleString()}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add LWP Record</DialogTitle>
            <DialogDescription>Manually record an unpaid absence.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Employee *</label>
              <SearchableSelect
                options={employeeOptions}
                value={formData.employee_id}
                onChange={v => setFormData(p => ({ ...p, employee_id: v as string }))}
                placeholder="Select employee"
                groupLabel="Employees"
                allowAll={false}
                widthClass="w-full"
                disabled={isLoadingEmployees}
                multiple={false}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Absence Date *</label>
              <Input type="date" value={formData.absence_date} onChange={e => setFormData(p => ({ ...p, absence_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">LWP Days *</label>
              <Input type="number" min={0.5} max={30} step={0.5} value={formData.lwp_days} onChange={e => setFormData(p => ({ ...p, lwp_days: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">HR Notes *</label>
              <textarea
                value={formData.hr_notes}
                onChange={e => setFormData(p => ({ ...p, hr_notes: e.target.value }))}
                maxLength={2000}
                rows={3}
                className="w-full border rounded-md p-2 text-sm"
                placeholder="Reason for LWP..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}