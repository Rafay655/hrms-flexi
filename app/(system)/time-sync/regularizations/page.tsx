"use client";

import { showApiError } from "@/lib/error-toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  PlusIcon,
  Eye,
  Clock,
  CalendarDays,
  FileText,
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
import {
  useMyRegularizations,
  useRegularizations,
  useCreateRegularization,
} from "@/hooks/useRegularizations";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { Regularization, RegularizationFormData, CorrectionType } from "@/types/regularization";

const DEFAULT_PER_PAGE = 10;

const CORRECTION_TYPES: { value: CorrectionType; label: string }[] = [
  { value: "add_in", label: "Add In Punch" },
  { value: "add_out", label: "Add Out Punch" },
  { value: "correct_in", label: "Correct In Punch" },
  { value: "correct_out", label: "Correct Out Punch" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function RegularizationsPage() {
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");

  // Filters
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [correctionTypeFilter, setCorrectionTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch employees (for create modal)
  const { data: employeesRaw, isLoading: isLoadingEmployees } = useEmployees({ per_page: 1000, detailed: 0 });
  const employees = employeesRaw ?? [];
  const employeeOptions: Option[] = useMemo(
    () => employees.map(e => ({ value: e.uuid, label: `${e.employee_code} – ${e.name}` })),
    [employees]
  );

  // Queries based on tab
  const myParams = {
    page,
    per_page: perPage,
    status: statusFilter !== "all" ? statusFilter : undefined,
    correction_type: correctionTypeFilter !== "all" ? correctionTypeFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const teamParams = { ...myParams }; // same for team

  const { data: myData, isLoading: isLoadingMy, isFetching: isFetchingMy, error: errorMy } = useMyRegularizations(myParams);
  const { data: teamData, isLoading: isLoadingTeam, isFetching: isFetchingTeam, error: errorTeam } = useRegularizations(teamParams);

  const currentData = activeTab === "my" ? myData : teamData;
  const isLoading = activeTab === "my" ? isLoadingMy : isLoadingTeam;
  const isFetching = activeTab === "my" ? isFetchingMy : isFetchingTeam;
  const error = activeTab === "my" ? errorMy : errorTeam;

  const regularizations = currentData?.data ?? [];
  const totalEntries = currentData?.meta?.total ?? 0;
  const totalPages = currentData?.meta?.last_page ?? 1;

  const createMutation = useCreateRegularization();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Regularization | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState<RegularizationFormData>({
    employee_id: "",
    attendance_date: "",
    correction_type: "",
    requested_in: "",
    requested_out: "",
    reason: "",
    supporting_doc_path: "",
  });

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [perPage, statusFilter, correctionTypeFilter, dateFrom, dateTo, activeTab]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load regularizations" });
  }, [error]);

  // Handlers
  const handleCreate = () => {
    setFormData({
      employee_id: "",
      attendance_date: "",
      correction_type: "",
      requested_in: "",
      requested_out: "",
      reason: "",
      supporting_doc_path: "",
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.employee_id) return toast.error("Employee is required");
    if (!formData.attendance_date) return toast.error("Attendance date is required");
    if (!formData.correction_type) return toast.error("Correction type is required");
    if (!formData.reason.trim()) return toast.error("Reason is required");
    if (formData.reason.trim().length > 2000) return toast.error("Reason max 2000 chars");

    createMutation.mutate(formData, { onSuccess: () => setIsModalOpen(false) });
  };

  const handleView = (item: Regularization) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  // Table columns (shared)
  const columns: ColumnDef<Regularization & { sr: number }>[] = useMemo(
    () => [
      { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.employee?.name ?? row.original.employee_id}</div>
            <div className="text-xs text-gray-500">{row.original.employee?.employee_code}</div>
          </div>
        ),
      },
      {
        accessorKey: "attendance_date",
        header: "Date",
        cell: ({ row }) => row.original.attendance_date.split("T")[0] ?? row.original.attendance_date.split(" ")[0],
      },
      {
        accessorKey: "correction_type",
        header: "Type",
        cell: ({ row }) => {
          const opt = CORRECTION_TYPES.find(o => o.value === row.original.correction_type);
          return <Badge variant="outline" className="bg-blue-50 text-blue-800">{opt?.label ?? row.original.correction_type}</Badge>;
        },
      },
      {
        id: "requested",
        header: "Requested Time",
        cell: ({ row }) => {
          const inn = row.original.requested_in ? new Date(row.original.requested_in).toLocaleString() : "—";
          const out = row.original.requested_out ? new Date(row.original.requested_out).toLocaleString() : "—";
          return (
            <div className="text-sm">
              <span>In: {inn}</span><br /><span>Out: {out}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={
                status === "approved"
                  ? "bg-green-100 text-green-800"
                  : status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : status === "submitted"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.original.reason}>
            {row.original.reason}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleView(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return regularizations.map((r: Regularization, idx: number ) => ({ ...r, sr: startSr + idx + 1 }));
  }, [regularizations, page, perPage]);

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

  const FilterBar = () => (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <div className="w-full md:w-60">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-white">
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full md:w-68">
        <Select value={correctionTypeFilter} onValueChange={setCorrectionTypeFilter}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Correction Type" /></SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Types</SelectItem>
            {CORRECTION_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full md:w-40">
        <Input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          placeholder="From"
        />
      </div>
      <div className="w-full md:w-40">
        <Input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          placeholder="To"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Show</span>
        <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
          <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white">{[10,15,25,50,100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="p-3">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Attendance Regularizations</CardTitle>
              <p className="text-sm text-gray-500">{totalEntries} records</p>
            </div>
            {activeTab === "my" && (
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                <PlusIcon className="mr-2 h-4 w-4" /> New Request
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
       <Tabs value={activeTab} onValueChange={v => setActiveTab(v as "my" | "team")} className="w-full">
  <TabsList className="mb-4">
    <TabsTrigger value="my">My Regularizations</TabsTrigger>
    <TabsTrigger value="team">Team Regularizations</TabsTrigger>
  </TabsList>

  {/* ---- MY TAB ---- */}
  <TabsContent value="my" className="mt-0">
    <FilterBar />
    <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
      <span className="text-sm">Showing {showingFrom} to {showingTo} of {totalEntries} entries</span>
      {(isLoading || isFetching) && <Loader2 className="animate-spin h-5 w-5" />}
    </div>
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
  </TabsContent>

  {/* ---- TEAM TAB ---- */}
  <TabsContent value="team" className="mt-0">
    <FilterBar />
    <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
      <span className="text-sm">Showing {showingFrom} to {showingTo} of {totalEntries} entries</span>
      {(isLoading || isFetching) && <Loader2 className="animate-spin h-5 w-5" />}
    </div>
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
  </TabsContent>
</Tabs>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Regularization Request</DialogTitle>
            <DialogDescription>Submit a correction for missing or wrong punches.</DialogDescription>
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
              <label className="text-sm font-medium">Attendance Date *</label>
              <Input type="date" value={formData.attendance_date} onChange={e => setFormData(p => ({ ...p, attendance_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Correction Type *</label>
              <Select value={formData.correction_type} onValueChange={v => setFormData(p => ({ ...p, correction_type: v as CorrectionType }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CORRECTION_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Requested In</label>
                <Input type="datetime-local" value={formData.requested_in} onChange={e => setFormData(p => ({ ...p, requested_in: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Requested Out</label>
                <Input type="datetime-local" value={formData.requested_out} onChange={e => setFormData(p => ({ ...p, requested_out: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason *</label>
              <Textarea value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} maxLength={2000} rows={3} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Supporting Doc Path</label>
              <Input value={formData.supporting_doc_path} onChange={e => setFormData(p => ({ ...p, supporting_doc_path: e.target.value }))} placeholder="/path/to/file" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal (Detail) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Regularization Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Employee:</span>
                <span>{viewItem.employee?.name} ({viewItem.employee?.employee_code})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{viewItem.attendance_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Type:</span>
                <span>{viewItem.correction_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Requested In:</span>
                <span>{viewItem.requested_in ? new Date(viewItem.requested_in).toLocaleString() : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Requested Out:</span>
                <span>{viewItem.requested_out ? new Date(viewItem.requested_out).toLocaleString() : "—"}</span>
              </div>
              <div>
                <span className="font-medium">Reason:</span>
                <p className="mt-1 text-sm text-gray-600">{viewItem.reason}</p>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={viewItem.status === "approved" ? "bg-green-100" : viewItem.status === "rejected" ? "bg-red-100" : "bg-yellow-100"}>
                  {viewItem.status}
                </Badge>
              </div>
              {viewItem.decided_by_user && (
                <div className="flex justify-between">
                  <span className="font-medium">Decided By:</span>
                  <span>{viewItem.decided_by_user.name}</span>
                </div>
              )}
              {viewItem.rejection_reason && (
                <div>
                  <span className="font-medium">Rejection Reason:</span>
                  <p className="text-sm text-red-600">{viewItem.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}