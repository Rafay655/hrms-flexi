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
  UploadCloud,
  X,
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
  useLeaveRequests,
  useCreateLeaveRequest,
  useUpdateLeaveRequest,
  useDeleteLeaveRequest,
} from "@/hooks/useLeaveRequests";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { LeaveRequest, LeaveRequestFormData, HalfDaySession, LeaveRequestStatus } from "@/types/leave-request";

const DEFAULT_PER_PAGE = 15;

const STATUSES: { value: LeaveRequestStatus | 'all'; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "revoked", label: "Revoked" },
];

const HALF_DAY_SESSIONS: { value: HalfDaySession; label: string }[] = [
  { value: "am", label: "AM" },
  { value: "pm", label: "PM" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function LeaveRequestsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dropdown data
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

  // Requests data
  const { data, isLoading, isFetching, error } = useLeaveRequests({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const requests = data?.data?.data ?? [];
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = data?.data?.meta?.last_page ?? 1;

  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();
  const deleteMutation = useDeleteLeaveRequest();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<LeaveRequest | null>(null);
  const [formData, setFormData] = useState<LeaveRequestFormData>({
    employee_id: "",
    leave_type_id: "",
    from_date: "",
    to_date: "",
    is_half_day: false,
    half_day_session: "",
    reason: "",
    attachment: null,
    reviewer_id: "",
  });
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load requests" });
  }, [error]);

  const isEditable = (status: LeaveRequestStatus) => status === 'draft' || status === 'pending';

  const populateForm = (item: LeaveRequest) => {
    setSelectedItem(item);
    setFormData({
      employee_id: item.employee?.id ?? item.employee?.uuid ?? "",
      leave_type_id: item.leave_type?.uuid ?? item.leave_type?.id ?? "",
      from_date: item.from_date.split('T')[0] ?? item.from_date.split(' ')[0],
      to_date: item.to_date.split('T')[0] ?? item.to_date.split(' ')[0],
      is_half_day: item.is_half_day,
      half_day_session: item.half_day_session ?? "",
      reason: item.reason ?? "",
      attachment: null,            // can't prefill File from path
      reviewer_id: item.reviewer?.id ?? "",
    });
    setAttachmentPreview(item.attachment_path ?? null);
  };

  const handleView = (item: LeaveRequest) => {
    populateForm(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: LeaveRequest) => {
    populateForm(item);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      employee_id: "",
      leave_type_id: "",
      from_date: "",
      to_date: "",
      is_half_day: false,
      half_day_session: "",
      reason: "",
      attachment: null,
      reviewer_id: "",
    });
    setAttachmentPreview(null);
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
    if (!formData.employee_id) { toast.error("Employee required"); return; }
    if (!formData.leave_type_id) { toast.error("Leave type required"); return; }
    if (!formData.from_date) { toast.error("From date required"); return; }
    if (!formData.to_date) { toast.error("To date required"); return; }
    if (formData.to_date < formData.from_date) { toast.error("To date must be after from date"); return; }
    if (formData.is_half_day && !formData.half_day_session) { toast.error("Half day session required"); return; }

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

  const columns: ColumnDef<LeaveRequest & { sr: number }>[] = useMemo(() => [
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
    {
      id: "leave_type",
      header: "Leave Type",
      cell: ({ row }) => <div className="font-semibold">{row.original.leave_type?.name ?? "—"}</div>,
    },
    {
      id: "dates",
      header: "Period",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.from_date} – {row.original.to_date}
          {row.original.is_half_day && ` (${row.original.half_day_session})`}
        </div>
      ),
    },
    { accessorKey: "total_days", header: "Days", cell: ({ row }) => <span>{row.original.total_days}</span> },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={
            status === "approved" ? "bg-green-100 text-green-800" :
            status === "rejected" ? "bg-red-100 text-red-800" :
            status === "cancelled" ? "bg-gray-100 text-gray-800" :
            status === "revoked" ? "bg-yellow-100 text-yellow-800" :
            "bg-blue-100 text-blue-800"
          }>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleView(request)}><Eye className="h-4 w-4" /></Button>
            {isEditable(request.status) && (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(request)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(request.uuid)}><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        );
      },
    },
  ], []);

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return requests.map((r: LeaveRequest, idx: number) => ({ ...r, sr: startSr + idx + 1 }));
  }, [requests, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Leave Requests</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} requests</p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> New Request
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
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {STATUSES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
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
                  <tr><td colSpan={columns.length} className="py-12 text-center">No requests found</td></tr>
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
              {modalMode === "create" ? "New Leave Request" : modalMode === "edit" ? "Edit Leave Request" : "View Leave Request"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "Read-only view." : modalMode === "edit" ? "Only editable if status is draft/pending." : "Fill in the details."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Employee */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Employee *</label>
              <SearchableSelect
                options={employeeOptions}
                value={formData.employee_id || ""}
                onChange={v => setFormData(p => ({ ...p, employee_id: v as string }))}
                placeholder="Select employee"
                groupLabel="Employees"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || isLoadingEmployees}
                multiple={false}
              />
            </div>
            {/* Leave Type */}
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
                disabled={modalMode === "view" || isLoadingLeaveTypes}
                multiple={false}
              />
            </div>
            {/* From Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">From Date *</label>
              <Input type="date" value={formData.from_date} onChange={e => setFormData(p => ({ ...p, from_date: e.target.value }))} disabled={modalMode === "view"} />
            </div>
            {/* To Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">To Date *</label>
              <Input type="date" value={formData.to_date} onChange={e => setFormData(p => ({ ...p, to_date: e.target.value }))} disabled={modalMode === "view"} min={formData.from_date} />
            </div>
            {/* Half Day */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.is_half_day} onCheckedChange={c => setFormData(p => ({ ...p, is_half_day: !!c }))} disabled={modalMode === "view"} />
              <label className="text-sm">Half Day</label>
            </div>
            {/* Half Day Session */}
            {formData.is_half_day && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Session *</label>
                <Select value={formData.half_day_session} onValueChange={v => setFormData(p => ({ ...p, half_day_session: v as HalfDaySession | '' }))} disabled={modalMode === "view"}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{HALF_DAY_SESSIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {/* Reason */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium">Reason</label>
              <Input value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} disabled={modalMode === "view"} maxLength={1000} />
            </div>
            {/* Attachment (File Upload) */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium">Attachment (PDF)</label>
              {modalMode === "view" ? (
                attachmentPreview ? (
                  <div className="flex items-center gap-2">
                    <a href={attachmentPreview} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">View attachment</a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No attachment</p>
                )
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-4 transition hover:border-primary/50 hover:bg-muted/30">
                  {attachmentPreview ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UploadCloud className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">File selected</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAttachmentPreview(null);
                          setFormData(p => ({ ...p, attachment: null }));
                        }}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-background px-4 py-8 text-center">
                      <UploadCloud className="mb-2 h-8 w-8 text-primary" />
                      <p className="text-sm font-semibold">Upload attachment</p>
                      <p className="mt-1 text-xs text-muted-foreground">PDF up to 5 MB</p>
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          if (file) {
                            setFormData(p => ({ ...p, attachment: file }));
                            setAttachmentPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
            {/* Reviewer ID */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium">Reviewer (User UUID)</label>
              <Input value={formData.reviewer_id} onChange={e => setFormData(p => ({ ...p, reviewer_id: e.target.value }))} disabled={modalMode === "view"} placeholder="Optional" />
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
          <AlertDialogHeader><AlertDialogTitle>Delete Request?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. Only draft/pending requests can be deleted.</AlertDialogDescription></AlertDialogHeader>
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