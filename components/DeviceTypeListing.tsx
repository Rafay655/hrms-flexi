"use client";
import { MetaActions, MetaAction } from "@/components/flexi-meta/meta-actions";

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

import {
  useDeviceTypes,
  useCreateDeviceType,
  useUpdateDeviceType,
  useDeleteDeviceType,
} from "@/hooks/useDeviceTypes";
import type { DeviceType, DeviceTypeFormData, DeviceTypeFunction } from "@/types/device-type";

const DEFAULT_PER_PAGE = 10;

const PROTOCOL_OPTIONS = [
  { value: "zkteco_sdk", label: "ZKTeco SDK" },
  { value: "rest_api", label: "REST API" },
  { value: "csv_import", label: "CSV Import" },
  { value: "standalone_app", label: "Standalone App" },
];

const FUNCTION_OPTIONS: { value: DeviceTypeFunction; label: string }[] = [
  { value: "fingerprint", label: "Fingerprint" },
  { value: "face", label: "Face" },
  { value: "card", label: "Card" },
  { value: "pin", label: "PIN" },
];

// Debounce hook
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const DeviceTypeListingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isFetching, error } = useDeviceTypes({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  const deviceTypes = data?.data?.data ?? [];
  const totalEntries = data?.data?.meta?.total ?? 0;
  const totalPages = data?.data?.meta?.last_page ?? 1;

  const createMutation = useCreateDeviceType();
  const updateMutation = useUpdateDeviceType();
  const deleteMutation = useDeleteDeviceType();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(null);
  const [formData, setFormData] = useState<DeviceTypeFormData>({
    code: "",
    name: "",
    manufacturer: "",
    communication_protocol: "",
    is_biometric: false,
    supported_functions: [],
    status: "active",
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load device types." });
  }, [error]);

  // CRUD Handlers
  const handleView = (dt: DeviceType) => {
    setSelectedDevice(dt);
    setFormData({
      code: dt.code,
      name: dt.name,
      manufacturer: dt.manufacturer ?? "",
      communication_protocol: dt.communication_protocol,
      is_biometric: dt.is_biometric,
      supported_functions: dt.supported_functions ?? [],
      status: dt.status,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (dt: DeviceType) => {
    setSelectedDevice(dt);
    setFormData({
      code: dt.code,
      name: dt.name,
      manufacturer: dt.manufacturer ?? "",
      communication_protocol: dt.communication_protocol,
      is_biometric: dt.is_biometric,
      supported_functions: dt.supported_functions ?? [],
      status: dt.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedDevice(null);
    setFormData({
      code: "",
      name: "",
      manufacturer: "",
      communication_protocol: "",
      is_biometric: false,
      supported_functions: [],
      status: "active",
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => setDeleteUuid(uuid);
  const confirmDelete = () => {
    if (deleteUuid) {
      deleteMutation.mutate(deleteUuid, {
        onSuccess: () => setDeleteUuid(null),
        onError: () => setDeleteUuid(null),
      });
    }
  };

  const toggleFunction = (func: DeviceTypeFunction) => {
    setFormData((prev) => ({
      ...prev,
      supported_functions: prev.supported_functions.includes(func)
        ? prev.supported_functions.filter((f) => f !== func)
        : [...prev.supported_functions, func],
    }));
  };

  const handleSave = () => {
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();
    const trimmedManufacturer = formData.manufacturer.trim();

    if (!trimmedCode) { toast.error("Code is required."); return; }
    if (trimmedCode.length > 50) { toast.error("Code cannot exceed 50 characters."); return; }
    if (!trimmedName) { toast.error("Name is required."); return; }
    if (trimmedName.length > 150) { toast.error("Name cannot exceed 150 characters."); return; }
    if (trimmedManufacturer.length > 100) { toast.error("Manufacturer cannot exceed 100 characters."); return; }
    if (!formData.communication_protocol) { toast.error("Communication protocol is required."); return; }

    const payload: DeviceTypeFormData = {
      code: trimmedCode,
      name: trimmedName,
      manufacturer: trimmedManufacturer,
      communication_protocol: formData.communication_protocol as DeviceTypeFormData['communication_protocol'],
      is_biometric: formData.is_biometric,
      supported_functions: formData.supported_functions,
      status: formData.status,
    };

    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (modalMode === "edit" && selectedDevice) {
      updateMutation.mutate(
        { uuid: selectedDevice.uuid, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const columns: ColumnDef<DeviceType & { sr: number }>[] = useMemo(
    () => [
      { accessorKey: "sr", header: "SR.", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
      { accessorKey: "code", header: "CODE", cell: ({ row }) => <div className="font-mono">{row.original.code}</div> },
      { accessorKey: "name", header: "NAME", cell: ({ row }) => <div className="font-semibold">{row.original.name}</div> },
      { accessorKey: "manufacturer", header: "MANUFACTURER", cell: ({ row }) => <div>{row.original.manufacturer ?? "—"}</div> },
      {
        accessorKey: "communication_protocol",
        header: "PROTOCOL",
        cell: ({ row }) => {
          const opt = PROTOCOL_OPTIONS.find(o => o.value === row.original.communication_protocol);
          return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">{opt?.label ?? row.original.communication_protocol}</Badge>;
        },
      },
      {
        accessorKey: "is_biometric",
        header: "BIOMETRIC",
        cell: ({ row }) => (row.original.is_biometric ? <Badge className="bg-green-100 text-green-800">Yes</Badge> : <Badge className="bg-gray-100 text-gray-800">No</Badge>),
      },
     
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => (
          <Badge className={row.original.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">ACTIONS</div>,
        cell: ({ row }) => (
          <MetaActions>
            <MetaAction label="View" onSelect={() => handleView(row.original)} ><Eye className="h-4 w-4" /></MetaAction>
            <MetaAction label="Edit" onSelect={() => handleEdit(row.original)} ><Pencil className="h-4 w-4" /></MetaAction>
            <MetaAction label="Delete" onSelect={() => handleDelete(row.original.uuid)} ><Trash2 className="h-4 w-4" /></MetaAction>
          </MetaActions>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return deviceTypes.map((dt, idx) => ({ ...dt, sr: startSr + idx + 1 }));
  }, [deviceTypes, page, perPage]);

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
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold">Device Types</CardTitle>
              <p className="text-sm text-gray-500">{totalEntries} device types</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                <PlusIcon className="mr-2 h-4 w-4" /> Add Device Type
              </Button>
              <Button variant="outline"><DownloadIcon className="mr-2 h-4 w-4" /> Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search and Per Page */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>{[10, 25, 50, 100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between">
            <span>Showing {showingFrom} to {showingTo} of {totalEntries} entries</span>
            {(isLoading || isFetching) && <Loader2 className="animate-spin" />}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" ? <ChevronRight className="h-4 w-4" /> : header.column.getIsSorted() === "desc" ? <ChevronLeft className="h-4 w-4" /> : null}
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
                  <tr><td colSpan={columns.length} className="py-12 text-center">No device types found</td></tr>
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
            <div className="flex flex-col md:flex-row justify-between items-center mt-4">
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
                  return (
                    <Button key={num} variant={page === num ? "default" : "outline"} size="sm" onClick={() => setPage(num)}>
                      {num}
                    </Button>
                  );
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto rounded-xl text-sm text-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {modalMode === "create" ? "Add Device Type" : modalMode === "edit" ? "Edit Device Type" : "View Device Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "Read-only view." : "Fill in the details."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Code *</label>
              <Input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} disabled={modalMode === "view"} maxLength={50} />
            </div>
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Name *</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} disabled={modalMode === "view"} maxLength={150} />
            </div>
            {/* Manufacturer */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Manufacturer</label>
              <Input value={formData.manufacturer} onChange={e => setFormData(p => ({ ...p, manufacturer: e.target.value }))} disabled={modalMode === "view"} maxLength={100} />
            </div>
            {/* Communication Protocol */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Protocol *</label>
              <Select value={formData.communication_protocol} onValueChange={v => setFormData(p => ({ ...p, communication_protocol: v as any }))} disabled={modalMode === "view"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select protocol" /></SelectTrigger>
                <SelectContent>
                  {PROTOCOL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Is Biometric */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Biometric</label>
              <Select value={formData.is_biometric ? "yes" : "no"} onValueChange={v => setFormData(p => ({ ...p, is_biometric: v === "yes" }))} disabled={modalMode === "view"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as "active" | "inactive" }))} disabled={modalMode === "view"}>
                <SelectTrigger ><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Supported Functions (checkboxes) */}
          <div className="space-y-2 mt-2">
            <label className="block text-sm font-medium text-slate-700">Supported Functions</label>
            <div className="flex flex-wrap gap-4 mt-3">
              {FUNCTION_OPTIONS.map(fn => (
                <label key={fn.value} className="block text-sm font-medium text-slate-700">
                  <Checkbox
                    checked={formData.supported_functions.includes(fn.value)}
                    onCheckedChange={() => toggleFunction(fn.value)}
                    disabled={modalMode === "view"}
                  />
                  {fn.label}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-6">
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
      <AlertDialog open={deleteUuid !== null} onOpenChange={() => setDeleteUuid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-slate-900">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeviceTypeListingPage;