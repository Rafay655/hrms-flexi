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
import { useLeaveTypes } from "@/hooks/useLeaveTypes";
import {
  useLeaveEncashments,
  useCreateLeaveEncashment,
} from "@/hooks/useLeaveEncashments";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { LeaveEncashment, LeaveEncashmentFormData } from "@/types/leave-encashment";

const DEFAULT_PER_PAGE = 15;

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function LeaveEncashmentPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Company UUID – in a real app this may come from context; we use a state for flexibility.
  const [companyUuid, setCompanyUuid] = useState("");

  // Dropdowns
  const { data: employeesRaw, isLoading: isLoadingEmployees } = useEmployees({ per_page: 1000, detailed: 0 });
  const employees = employeesRaw ?? [];
  const employeeOptions: Option[] = useMemo(
    () => employees.map((e: any) => ({ value: e.uuid, label: `${e.employee_code} – ${e.name}` })),
    [employees]
  );

  const { data: leaveTypesRaw, isLoading: isLoadingLeaveTypes } = useLeaveTypes({ per_page: 1000 });
  const leaveTypes = useMemo(() => leaveTypesRaw?.data?.data ?? [], [leaveTypesRaw]);
  const leaveTypeOptions: Option[] = useMemo(
    () => leaveTypes.map((lt: any) => ({ value: String(lt.uuid ?? lt.id), label: `${lt.name} (${lt.code})` })),
    [leaveTypes]
  );

  // Data fetch – only when companyUuid is present
 const { data, isLoading, isFetching, error } = useLeaveEncashments({
    page,
    per_page: perPage,
    company_id: companyUuid || undefined,
  });

  const records = data?.data ?? [];   // directly under data
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const createMutation = useCreateLeaveEncashment();

  // View modal
  const [viewItem, setViewItem] = useState<LeaveEncashment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<LeaveEncashmentFormData>({
    company_id: "",
    employee_id: "",
    leave_type_id: "",
    year: new Date().getFullYear(),
    days_encashed: 0,
    rate_per_day: "",
  });

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, companyUuid]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load encashment records" });
  }, [error]);

  const handleView = (item: LeaveEncashment) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      company_id: companyUuid || "",
      employee_id: "",
      leave_type_id: "",
      year: new Date().getFullYear(),
      days_encashed: 0,
      rate_per_day: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveCreate = () => {
    if (!formData.company_id) { toast.error("Company UUID required"); return; }
    if (!formData.employee_id) { toast.error("Employee required"); return; }
    if (!formData.leave_type_id) { toast.error("Leave type required"); return; }
    if (!formData.year || formData.year < 2020 || formData.year > 2099) { toast.error("Year between 2020-2099"); return; }
    if (formData.days_encashed <= 0) { toast.error("Days to encash required"); return; }

    createMutation.mutate(formData, { onSuccess: () => setIsCreateModalOpen(false) });
  };

  const columns: ColumnDef<LeaveEncashment & { sr: number }>[] = useMemo(
    () => [
      { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.employee?.name ?? "—"}</div>
            <div className="text-xs text-gray-500">{row.original.employee?.id}</div>
          </div>
        ),
      },
      {
        id: "leave_type",
        header: "Leave Type",
        cell: ({ row }) => <span>{row.original.leave_type?.name ?? "—"}</span>,
      },
      { accessorKey: "year", header: "Year", cell: ({ row }) => row.original.year },
      { accessorKey: "days_encashed", header: "Days", cell: ({ row }) => row.original.days_encashed },
      { accessorKey: "amount", header: "Amount", cell: ({ row }) => row.original.amount.toLocaleString() },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={row.original.status === "approved" ? "bg-green-100 text-green-800" : row.original.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "created_by",
        header: "Created By",
        cell: ({ row }) => <span>{row.original.created_by ?? "—"}</span>,
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
              <CardTitle className="text-2xl font-bold text-gray-900">Leave Encashments</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} records</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> New Encashment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Company UUID filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-64">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Company UUID</label>
              <Input
                value={companyUuid}
                onChange={e => setCompanyUuid(e.target.value)}
                placeholder="Enter company UUID"
                className="w-full"
              />
            </div>
            <div className="relative flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Search</label>
              <SearchIcon className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-sm text-gray-600 pb-1">Show</span>
              <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">{[10,15,25,50,100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-sm text-gray-600 pb-1">entries</span>
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
            <DialogTitle>Encashment Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <div className="flex justify-between"><span className="font-medium">Employee:</span><span>{viewItem.employee?.name}</span></div>
              <div className="flex justify-between"><span className="font-medium">Leave Type:</span><span>{viewItem.leave_type?.name}</span></div>
              <div className="flex justify-between"><span className="font-medium">Year:</span><span>{viewItem.year}</span></div>
              <div className="flex justify-between"><span className="font-medium">Days Encashed:</span><span>{viewItem.days_encashed}</span></div>
              <div className="flex justify-between"><span className="font-medium">Rate/Day:</span><span>{viewItem.rate_per_day?.toLocaleString() ?? "—"}</span></div>
              <div className="flex justify-between"><span className="font-medium">Amount:</span><span>{viewItem.amount?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="font-medium">Status:</span><Badge>{viewItem.status}</Badge></div>
              <div className="flex justify-between"><span className="font-medium">Created By:</span><span>{viewItem.created_by}</span></div>
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>New Leave Encashment</DialogTitle>
            <DialogDescription>Record employee leave encashment details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Company UUID *</label>
              <Input
                value={formData.company_id}
                onChange={e => setFormData(p => ({ ...p, company_id: e.target.value }))}
                placeholder="Enter company UUID"
              />
            </div>
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
              <label className="text-sm font-medium">Leave Type *</label>
              <SearchableSelect
                options={leaveTypeOptions}
                value={formData.leave_type_id}
                onChange={v => setFormData(p => ({ ...p, leave_type_id: v as string }))}
                placeholder="Select leave type"
                groupLabel="Leave Types"
                allowAll={false}
                widthClass="w-full"
                disabled={isLoadingLeaveTypes}
                multiple={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Year *</label>
                <Input type="number" min={2020} max={2099} value={formData.year} onChange={e => setFormData(p => ({ ...p, year: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Days to Encash *</label>
                <Input type="number" min={0.5} step={0.5} value={formData.days_encashed} onChange={e => setFormData(p => ({ ...p, days_encashed: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rate Per Day (optional)</label>
              <Input type="number" min={0} value={formData.rate_per_day} onChange={e => setFormData(p => ({ ...p, rate_per_day: e.target.value }))} />
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