"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { useEmployees } from "@/hooks/useEmployees";
import { useCompOffs, useMyCompOffs, useCreateCompOff } from "@/hooks/useCompOffs";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { CompOff, CompOffStatus, CreditType } from "@/types/comp-off";
import type { CompOffFormData } from "@/services/comp-off.service";

const DEFAULT_PER_PAGE = 15;

const STATUS_OPTIONS: { value: CompOffStatus | 'all'; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_approval", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const CREDIT_TYPES: { value: CreditType; label: string }[] = [
  { value: "full_day", label: "Full Day" },
  { value: "half_day", label: "Half Day" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const TableSection = ({
  table,
  columns,
  isLoading,
  rows,
  showingFrom,
  showingTo,
  totalEntries,
  page,
  totalPages,
  setPage,
}: any) => (
  <>
    <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
      <span className="text-sm">Showing {showingFrom} to {showingTo} of {totalEntries} entries</span>
      {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
    </div>
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg: any) => (
            <tr key={hg.id}>
              {hg.headers.map((h: any) => (
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
            table.getRowModel().rows.map((row: any) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell: any) => (
                  <td key={cell.id} className="py-4 px-4 text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {!isLoading && totalEntries > 0 && (
      <div className="flex justify-between items-center mt-4">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let num;
            if (totalPages <= 5) num = i + 1;
            else if (page <= 3) num = i + 1;
            else if (page >= totalPages - 2) num = totalPages - 4 + i;
            else num = page - 2 + i;
            return <Button key={num} variant={page === num ? "default" : "outline"} size="sm" onClick={() => setPage(num)}>{num}</Button>;
          })}
          <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
        </div>
      </div>
    )}
  </>
);

export default function CompOffPage() {
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const params = {
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  const { data: myData, isLoading: isLoadingMy, isFetching: isFetchingMy } = useMyCompOffs(params);
  const { data: allData, isLoading: isLoadingAll, isFetching: isFetchingAll } = useCompOffs(params);
  const createMutation = useCreateCompOff();

  // Employee dropdown
  const { data: employeesRaw } = useEmployees({ per_page: 1000, detailed: 0 });
  const employees = employeesRaw ?? [];
  const employeeOptions: Option[] = useMemo(
    () => employees.map((e: any) => ({ value: e.uuid, label: `${e.employee_code} – ${e.name}` })),
    [employees]
  );

  const isLoading = activeTab === "my" ? isLoadingMy : isLoadingAll;
  const isFetching = activeTab === "my" ? isFetchingMy : isFetchingAll;

  const rawRecords = activeTab === "my"
    ? myData?.data || []
    : allData?.data?.data || [];

  const totalEntries = activeTab === "my"
    ? rawRecords.length
    : allData?.data?.meta?.total ?? 0;

  const totalPages = activeTab === "my"
    ? Math.ceil(rawRecords.length / perPage)
    : allData?.data?.meta?.last_page ?? 1;

  const paginatedRecords = useMemo(() => {
    if (activeTab === "my") {
      const start = (page - 1) * perPage;
      return rawRecords.slice(start, start + perPage);
    }
    return rawRecords;
  }, [rawRecords, activeTab, page, perPage]);

  // View modal
  const [viewItem, setViewItem] = useState<CompOff | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CompOffFormData>({
    employee_id: "",
    holiday_date: "",
    hours_worked: 0,
    shift_duration: 0,
    credit_type: "full_day",
    expires_at: null,
    source_event_data: null,
  });

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, statusFilter, activeTab]);

  const handleView = (item: CompOff) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  const handleCreate = () => {
    setCreateForm({
      employee_id: "",
      holiday_date: "",
      hours_worked: 0,
      shift_duration: 0,
      credit_type: "full_day",
      expires_at: null,
      source_event_data: null,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveCreate = () => {
    if (!createForm.employee_id) { toast.error("Employee required"); return; }
    if (!createForm.holiday_date) { toast.error("Holiday date required"); return; }
    if (createForm.hours_worked <= 0) { toast.error("Hours worked required"); return; }
    if (createForm.shift_duration <= 0) { toast.error("Shift duration required"); return; }

    createMutation.mutate(createForm, { onSuccess: () => setIsCreateModalOpen(false) });
  };

  const columns: ColumnDef<CompOff & { sr: number }>[] = useMemo(
    () => [
      { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.employee?.employee_code}</div>
            <div className="text-xs text-gray-500">{row.original.employee?.id}</div>
          </div>
        ),
      },
      { accessorKey: "holiday_date", header: "Date", cell: ({ row }) => row.original.holiday_date },
      { accessorKey: "hours_worked", header: "Hours", cell: ({ row }) => `${row.original.hours_worked} / ${row.original.shift_duration}` },
      {
        accessorKey: "credit_type",
        header: "Credit",
        cell: ({ row }) => <Badge variant="outline">{row.original.credit_type} ({row.original.credit_days}d)</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge className={
              status === "approved" ? "bg-green-100 text-green-800" :
              status === "rejected" ? "bg-red-100 text-red-800" :
              status === "expired" ? "bg-gray-100 text-gray-800" :
              "bg-yellow-100 text-yellow-800"
            }>
              {status.replace('_', ' ')}
            </Badge>
          );
        },
      },
      { accessorKey: "expires_at", header: "Expires", cell: ({ row }) => row.original.expires_at?.split(' ')[0] ?? "—" },
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
    return paginatedRecords.map((r, idx) => ({ ...r, sr: startSr + idx + 1 }));
  }, [paginatedRecords, page, perPage]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
  });

  const showingFrom = totalEntries > 0 ? (page - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  const FilterBar = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input placeholder="Search by employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>
      <div className="w-full md:w-48">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent className="bg-white">{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
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
  );

  const tableProps = { table, columns, isLoading, rows, showingFrom, showingTo, totalEntries, page, totalPages, setPage };

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Comp‑Off Records</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} records</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Comp‑Off
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "my" | "all")} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="my">My Comp‑Off</TabsTrigger>
              <TabsTrigger value="all">All Comp‑Off</TabsTrigger>
            </TabsList>
            <TabsContent value="my" className="mt-0">
              <FilterBar />
              <TableSection {...tableProps} />
            </TabsContent>
            <TabsContent value="all" className="mt-0">
              <FilterBar />
              <TableSection {...tableProps} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Comp‑Off Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <div className="flex justify-between"><span className="font-medium">Employee:</span><span>{viewItem.employee?.employee_code}</span></div>
              <div className="flex justify-between"><span className="font-medium">Date:</span><span>{viewItem.holiday_date}</span></div>
              <div className="flex justify-between"><span className="font-medium">Hours:</span><span>{viewItem.hours_worked} / {viewItem.shift_duration}</span></div>
              <div className="flex justify-between"><span className="font-medium">Credit:</span><span>{viewItem.credit_type} ({viewItem.credit_days}d)</span></div>
              <div className="flex justify-between"><span className="font-medium">Status:</span><Badge>{viewItem.status}</Badge></div>
              {viewItem.approved_by_user && <div className="flex justify-between"><span className="font-medium">Approved By:</span><span>{viewItem.approved_by_user.name}</span></div>}
              {viewItem.expires_at && <div className="flex justify-between"><span className="font-medium">Expires:</span><span>{viewItem.expires_at.split(' ')[0]}</span></div>}
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
            <DialogTitle>Add Comp‑Off Record</DialogTitle>
            <DialogDescription>Manually enter a holiday work record.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Employee *</label>
              <SearchableSelect
                options={employeeOptions}
                value={createForm.employee_id}
                onChange={v => setCreateForm(p => ({ ...p, employee_id: v as string }))}
                placeholder="Select employee"
                groupLabel="Employees"
                allowAll={false}
                widthClass="w-full"
                multiple={false}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Holiday Date *</label>
              <Input type="date" value={createForm.holiday_date} onChange={e => setCreateForm(p => ({ ...p, holiday_date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hours Worked *</label>
                <Input type="number" min={0} max={24} step={0.5} value={createForm.hours_worked} onChange={e => setCreateForm(p => ({ ...p, hours_worked: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shift Duration *</label>
                <Input type="number" min={0} max={24} step={0.5} value={createForm.shift_duration} onChange={e => setCreateForm(p => ({ ...p, shift_duration: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Credit Type</label>
              <Select value={createForm.credit_type} onValueChange={v => setCreateForm(p => ({ ...p, credit_type: v as CreditType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CREDIT_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Expires At</label>
              <Input type="date" value={createForm.expires_at ?? ""} onChange={e => setCreateForm(p => ({ ...p, expires_at: e.target.value || null }))} />
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