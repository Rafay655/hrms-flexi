"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

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
  MoreVertical, RefreshCw,
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

import { AppLoader } from "@/components/ui/app-loader";
import { ApiErrorState } from "@/components/ui/api-error-state";
import { leaveTypeService } from "@/services/leave-type.service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
} from "@/hooks/useLeaveTypes";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type { LeaveType, LeaveTypeFormData, GenderRestriction } from "@/types/leave-type";

const DEFAULT_PER_PAGE = 10;

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

  const genderOptions: Option[] = [{value:"male",label:"Male"},{value:"female",label:"Female"}];
  const [detailBusy, setDetailBusy] = useState(false);
  // Leave types data
  const { data, isLoading, isFetching, error, refetch } = useLeaveTypes({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_active: isActiveParam,
  });

  const leaveTypes = useMemo(() => data?.data?.data ?? [], [data]);
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = Math.max(1, data?.data?.meta?.last_page ?? 1);
  if (data && !isFetching && page > totalPages) setPage(totalPages);

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
    is_encashable: false,
    carry_forward_allowed: false,
    requires_attachment: false,
    min_days_notice: 0,
    allow_half_day: false,
    is_gender_specific: false,
    gender_restriction: "",
    is_active: true,
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  const handleView = async (row: LeaveType, mode: "view" | "edit" = "view") => {
    if (detailBusy) return;
    setDetailBusy(true);
    try {
    const item = await leaveTypeService.getById(row.uuid || row.id);
    setSelectedItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      is_paid: item.is_paid,
      is_encashable: item.is_encashable,
      carry_forward_allowed: item.carry_forward_allowed,
      requires_attachment: item.requires_attachment,
      min_days_notice: item.min_days_notice,
      allow_half_day: item.allow_half_day,
      is_gender_specific: item.is_gender_specific,
      gender_restriction: item.gender_restriction ?? "",
      is_active: item.is_active,
    });
    setModalMode(mode);
    setIsModalOpen(true);
    } catch (error) { showApiError(error); } finally { setDetailBusy(false); }
  };

  const handleEdit = (item: LeaveType) => void handleView(item, "edit");
  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      name: "",
      code: "",
      is_paid: false,
      is_encashable: false,
      carry_forward_allowed: false,
      requires_attachment: false,
      min_days_notice: 0,
      allow_half_day: false,
      is_gender_specific: false,
      gender_restriction: "",
      is_active: true,
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => setDeleteUuid(uuid);
  const confirmDelete = () => {
    if (deleteUuid) {
      deleteMutation.mutate(deleteUuid, { onSuccess: () => { setDeleteUuid(null); if (leaveTypes.length === 1 && page > 1) setPage(page - 1); } });
    }
  };

  const handleSave = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
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

    if (!Number.isInteger(formData.min_days_notice) || formData.min_days_notice < 0 || formData.min_days_notice > 255) { toast.error("Minimum notice must be a whole number between 0 and 255"); return; }
    const payload = { ...formData, name: trimmedName, code: trimmedCode };
    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.uuid || selectedItem.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const columns: ColumnDef<LeaveType & { sr: number }>[] = [
    { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
    { accessorKey: "code", header: "Code", cell: ({ row }) => <div className="font-mono font-semibold">{row.original.code}</div> },
    { accessorKey: "name", header: "Name", cell: ({ row }) => <div className="font-semibold">{row.original.name}</div> },
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
        <div className="flex justify-end"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${row.original.name}`} disabled={detailBusy}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void handleView(row.original)}><Eye className="mr-2 h-4 w-4" />View details</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(row.original.uuid || row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu></div>
      ),
    },
  ];

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
              <CardTitle className="text-2xl font-semibold text-gray-900">Leave Types</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} leave types</p>
            </div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button><Button size="sm" className="bg-[#1E1B4B] hover:bg-[#2A2675]" onClick={handleCreate}><PlusIcon className="mr-2 h-4 w-4" />Create leave type</Button></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1"><SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input aria-label="Search leave types" placeholder="Search by name or code…" value={search} onChange={e => {setSearch(e.target.value);setPage(1);}} className="pl-10" /></div>
            <div className="flex items-center gap-2 text-sm text-gray-600"><span>Show</span><SearchableSelect aria-label="Leave types per page" allowAll={false} widthClass="w-28" value={String(perPage)} onChange={v => {setPerPage(Number(v));setPage(1);}} options={[10,25,50,100].map(n=>({value:String(n),label:String(n)}))} /><span>entries</span></div><div className="basis-full" />
            <SearchableSelect aria-label="Filter by status" allLabel="All statuses" value={activeFilter === "all" ? "" : activeFilter} onChange={v=>{setActiveFilter(v || "all");setPage(1);}} options={[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]} widthClass="w-full sm:w-56" />
            {(search || activeFilter !== "all") && <Button variant="ghost" size="sm" onClick={()=>{setSearch("");setActiveFilter("all");setPage(1);}}>Clear filters</Button>}
          </div>
          {/* Stats Bar */}
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
                  <tr><td colSpan={columns.length} className="py-12 text-center"><AppLoader label="Loading leave types…" /></td></tr>
                ) : error ? (<tr><td colSpan={columns.length} className="p-6"><ApiErrorState error={error} onRetry={() => void refetch()} /></td></tr>) : rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="py-12 text-center">No leave types found</td></tr>
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
                  return <Button key={num} variant={page === num ? "default" : "outline"} size="sm" className={page === num ? "bg-[#1E1B4B] hover:bg-[#2A2675]" : ""} disabled={isFetching} onClick={() => setPage(num)}>{num}</Button>;
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
      <Dialog open={isModalOpen} onOpenChange={open => {if (!createMutation.isPending && !updateMutation.isPending) setIsModalOpen(open);}}>
        <DialogContent className="sm:max-w-[740px] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
          <DialogHeader className="shrink-0 border-b bg-gray-50/70 px-6 py-4">
            <DialogTitle>{modalMode === "create" ? "Add Leave Type" : modalMode === "edit" ? "Edit Leave Type" : "View Leave Type"}</DialogTitle>
            <DialogDescription>{modalMode === "view" ? "Review identity, capabilities and request rules." : "Define the leave identity and the capabilities available to its policies."}</DialogDescription>
          </DialogHeader>
          <fieldset disabled={modalMode === "view" || createMutation.isPending || updateMutation.isPending} className="min-h-0 overflow-y-auto p-6 space-y-5">
            <section className="space-y-4" aria-labelledby="leave-basics">
              <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E1B4B]/5 text-xs font-semibold text-[#1E1B4B]">01</span><h3 id="leave-basics" className="text-sm font-semibold text-gray-900">Basic details</h3></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><label htmlFor="leave-type-name" className="text-sm font-medium text-gray-700">Leave name <span className="text-red-500">*</span></label><Input id="leave-type-name" required maxLength={100} placeholder="e.g. Annual leave" value={formData.name} onChange={e=>setFormData(p=>({...p,name:e.target.value}))} /></div>
                <div className="space-y-1.5"><label htmlFor="leave-type-code" className="text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></label><Input id="leave-type-code" required maxLength={20} placeholder="e.g. AL" value={formData.code} onChange={e=>setFormData(p=>({...p,code:e.target.value}))} /></div>
              </div>
              <label htmlFor="leave-type-active" className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2.5"><span><span className="block text-sm font-medium text-gray-800">Active leave type</span><span className="block text-xs text-gray-500">Available for use in leave policies.</span></span><Checkbox id="leave-type-active" checked={formData.is_active} onCheckedChange={v=>setFormData(p=>({...p,is_active:v === true}))} /></label>
            </section>
            <section className="space-y-4 border-t border-gray-100 pt-5" aria-labelledby="leave-entitlement">
              <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E1B4B]/5 text-xs font-semibold text-[#1E1B4B]">02</span><h3 id="leave-entitlement" className="text-sm font-semibold text-gray-900">Leave capabilities</h3></div>
              <p className="text-xs text-gray-500">Configure entitlement, numeric limits and accrual in Leave Policies.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([{key:"is_paid",label:"Paid leave",hint:"Leave days are paid."},{key:"is_encashable",label:"Encashment",hint:"Allow unused leave to be encashed."},{key:"allow_half_day",label:"Half-day leave",hint:"Allow requests for half a day."},{key:"carry_forward_allowed",label:"Carry forward",hint:"Allow unused days to carry forward."}] as const).map(item=><label key={item.key} htmlFor={`leave-${item.key}`} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5"><span><span className="block text-sm font-medium text-gray-800">{item.label}</span><span className="block text-xs text-gray-500">{item.hint}</span></span><Checkbox id={`leave-${item.key}`} checked={formData[item.key]} onCheckedChange={v=>setFormData(p=>({...p,[item.key]:v === true}))} /></label>)}
              </div>
            </section>
            <section className="space-y-4 border-t border-gray-100 pt-5" aria-labelledby="leave-eligibility">
              <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E1B4B]/5 text-xs font-semibold text-[#1E1B4B]">03</span><h3 id="leave-eligibility" className="text-sm font-semibold text-gray-900">Request rules & eligibility</h3></div>
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><label htmlFor="leave-notice" className="text-sm font-medium text-gray-700">Minimum notice (days)</label><Input id="leave-notice" type="number" min={0} max={255} step={1} value={formData.min_days_notice} onChange={e=>setFormData(p=>({...p,min_days_notice:Number(e.target.value)}))} /><p className="text-xs text-gray-500">Set to 0 for no advance notice.</p></div>
                <label htmlFor="leave-attachment" className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5"><span><span className="block text-sm font-medium text-gray-800">Attachment required</span><span className="block text-xs text-gray-500">Require a supporting document.</span></span><Checkbox id="leave-attachment" checked={formData.requires_attachment} onCheckedChange={v=>setFormData(p=>({...p,requires_attachment:v === true}))} /></label>
              </div>
              <label htmlFor="leave-gender-specific" className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5"><span><span className="block text-sm font-medium text-gray-800">Gender-specific eligibility</span><span className="block text-xs text-gray-500">Restrict this leave type to a selected gender.</span></span><Checkbox id="leave-gender-specific" checked={formData.is_gender_specific} onCheckedChange={v=>setFormData(p=>({...p,is_gender_specific:v === true}))} /></label>
              {formData.is_gender_specific && <div className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/70 p-3"><label htmlFor="leave-gender" className="text-sm font-medium text-gray-700">Eligible gender <span className="text-red-500">*</span></label><SearchableSelect id="leave-gender" options={genderOptions} value={formData.gender_restriction || ""} onChange={v=>setFormData(p=>({...p,gender_restriction:v as GenderRestriction}))} placeholder="Select gender" allowAll={false} widthClass="w-full sm:w-[260px]" disabled={modalMode === "view" || createMutation.isPending || updateMutation.isPending} /></div>}
            </section>
          </fieldset>
          <DialogFooter className="shrink-0 border-t bg-gray-50/70 px-6 py-4">
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" disabled={createMutation.isPending || updateMutation.isPending} onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="bg-[#1E1B4B] hover:bg-[#2A2675]" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {modalMode === "create" ? "Create leave type" : "Save changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUuid} onOpenChange={open => {if (!open && !deleteMutation.isPending) setDeleteUuid(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Leave Type?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={e => {e.preventDefault();confirmDelete();}} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
