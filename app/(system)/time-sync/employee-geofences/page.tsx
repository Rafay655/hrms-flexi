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

import { useBranches } from "@/hooks/useBranches";
import {
  useEmployeeGeofences,
  useCreateEmployeeGeofence,
  useUpdateEmployeeGeofence,
  useDeleteEmployeeGeofence,
} from "@/hooks/useEmployeeGeofences";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type {
  EmployeeGeofence,
  EmployeeGeofenceFormData,
  ZoneType,
} from "@/types/employee-geofence";

const DEFAULT_PER_PAGE = 10;

const ZONE_TYPES: { value: ZoneType; label: string }[] = [
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "site", label: "Site" },
  { value: "client", label: "Client" },
  { value: "flexible", label: "Flexible" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const EmployeeGeofenceListingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const isActiveParam = activeFilter === "all" ? undefined : activeFilter === "active" ? 1 : 0;

  // Fetch branches for dropdown
  const { data: branchesRaw, isLoading: isLoadingBranches } = useBranches({ per_page: 1000 });
  const branches = useMemo(() => {
    if (!branchesRaw) return [];
    return branchesRaw?.data?.data ?? [];
  }, [branchesRaw]);
  const branchOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...branches.map((b: any) => ({ value: String(b.uuid ?? b.id), label: b.name })),
    ],
    [branches]
  );

  // Fetch geofences
  const { data, isLoading, isFetching, error } = useEmployeeGeofences({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_active: isActiveParam,
  });

  const geofences = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const createMutation = useCreateEmployeeGeofence();
  const updateMutation = useUpdateEmployeeGeofence();
  const deleteMutation = useDeleteEmployeeGeofence();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedItem, setSelectedItem] = useState<EmployeeGeofence | null>(null);
  const [formData, setFormData] = useState<EmployeeGeofenceFormData>({
    branch_id: "",
    zone_name: "",
    latitude: "",
    longitude: "",
    radius_meters: 300,
    zone_type: "",
    wifi_ssid_list: [],
    is_active: true,
    effective_from: "",
    effective_to: null,
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, activeFilter]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load geofences" });
  }, [error]);

  // Wi‑Fi SSID management
  const addSsid = () => {
    setFormData((prev) => ({
      ...prev,
      wifi_ssid_list: [...prev.wifi_ssid_list, ""],
    }));
  };

  const removeSsid = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      wifi_ssid_list: prev.wifi_ssid_list.filter((_, i) => i !== index),
    }));
  };

  const updateSsid = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.wifi_ssid_list];
      updated[index] = value;
      return { ...prev, wifi_ssid_list: updated };
    });
  };

  const handleView = (item: EmployeeGeofence) => {
    setSelectedItem(item);
    setFormData({
      branch_id: item.branch_id ?? "",
      zone_name: item.zone_name,
      latitude: item.latitude,
      longitude: item.longitude,
      radius_meters: item.radius_meters,
      zone_type: item.zone_type,
      wifi_ssid_list: item.wifi_ssid_list ?? [],
      is_active: item.is_active,
      effective_from: item.effective_from.split('T')[0] ?? item.effective_from.split(' ')[0],
      effective_to: item.effective_to ? (item.effective_to.split('T')[0] ?? item.effective_to.split(' ')[0]) : null,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (item: EmployeeGeofence) => {
    setSelectedItem(item);
    setFormData({
      branch_id: item.branch_id ?? "",
      zone_name: item.zone_name,
      latitude: item.latitude,
      longitude: item.longitude,
      radius_meters: item.radius_meters,
      zone_type: item.zone_type,
      wifi_ssid_list: item.wifi_ssid_list ?? [],
      is_active: item.is_active,
      effective_from: item.effective_from.split('T')[0] ?? item.effective_from.split(' ')[0],
      effective_to: item.effective_to ? (item.effective_to.split('T')[0] ?? item.effective_to.split(' ')[0]) : null,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({
      branch_id: "",
      zone_name: "",
      latitude: "",
      longitude: "",
      radius_meters: 300,
      zone_type: "",
      wifi_ssid_list: [],
      is_active: true,
      effective_from: "",
      effective_to: null,
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
    const trimmedZoneName = formData.zone_name.trim();
    if (!trimmedZoneName) { toast.error("Zone name required"); return; }
    if (trimmedZoneName.length > 150) { toast.error("Zone name ≤ 150 chars"); return; }
    if (!formData.latitude || isNaN(parseFloat(formData.latitude))) { toast.error("Valid latitude required"); return; }
    if (Math.abs(parseFloat(formData.latitude)) > 90) { toast.error("Latitude between -90 and 90"); return; }
    if (!formData.longitude || isNaN(parseFloat(formData.longitude))) { toast.error("Valid longitude required"); return; }
    if (Math.abs(parseFloat(formData.longitude)) > 180) { toast.error("Longitude between -180 and 180"); return; }
    if (!formData.radius_meters || formData.radius_meters < 50 || formData.radius_meters > 5000) { toast.error("Radius 50–5000"); return; }
    if (!formData.zone_type) { toast.error("Zone type required"); return; }
    if (!formData.effective_from) { toast.error("Effective from required"); return; }

    const payload = { ...formData, zone_name: trimmedZoneName };
    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedItem) {
      updateMutation.mutate(
        { uuid: selectedItem.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const columns: ColumnDef<EmployeeGeofence & { sr: number }>[] = useMemo(
    () => [
      { accessorKey: "sr", header: "#", cell: ({ row }) => <div className="font-medium">{row.original.sr}</div> },
      { accessorKey: "zone_name", header: "Zone Name", cell: ({ row }) => <div className="font-semibold">{row.original.zone_name}</div> },
      {
        id: "branch",
        header: "Branch",
        cell: ({ row }) => <div className="text-sm text-gray-700">{row.original.branch?.name ?? "—"}</div>,
      },
      {
        id: "coordinates",
        header: "Coordinates",
        cell: ({ row }) => (
          <div className="text-xs text-gray-500">
            {parseFloat(row.original.latitude).toFixed(4)}, {parseFloat(row.original.longitude).toFixed(4)}
          </div>
        ),
      },
      {
        accessorKey: "radius_meters",
        header: "Radius",
        cell: ({ row }) => <span>{row.original.radius_meters}m</span>,
      },
      {
        accessorKey: "zone_type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline" className="bg-purple-50 text-purple-800">{row.original.zone_type}</Badge>,
      },
      {
        id: "wifi",
        header: "Wi‑Fi",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-0.5">
            {row.original.wifi_ssid_list?.map((ssid, i) => (
              <Badge key={i} className="bg-gray-100 text-gray-700 text-xs">{ssid}</Badge>
            ))}
            {!row.original.wifi_ssid_list?.length && "—"}
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
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleView(row.original)}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return geofences.map((g: any, idx: number) => ({ ...g, sr: startSr + idx + 1 }));
  }, [geofences, page, perPage]);

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
              <CardTitle className="text-2xl font-bold text-gray-900">Employee Geofences</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{totalEntries.toLocaleString()} geofences</p>
            </div>
            <Button permission="employee_geofence.create" onClick={handleCreate} disabled={createMutation.isPending}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Geofence
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
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent className="bg-white"><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
                <SelectTrigger className="w-20"><SelectValue placeholder="10" /></SelectTrigger>
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
          <div className="border rounded-lg overflow-x-auto">
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
                  <tr><td colSpan={columns.length} className="py-12 text-center">No geofences found</td></tr>
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
            <DialogTitle>{modalMode === "create" ? "Add Geofence" : modalMode === "edit" ? "Edit Geofence" : "View Geofence"}</DialogTitle>
            <DialogDescription>{modalMode === "view" ? "Read‑only view." : "Fill in the details."}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Zone Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Zone Name *</label>
              <Input value={formData.zone_name} onChange={e => setFormData(p => ({...p, zone_name: e.target.value}))} disabled={modalMode === "view"} maxLength={150} />
            </div>
            {/* Branch */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Branch</label>
              <SearchableSelect
                options={branchOptions}
                value={formData.branch_id || ""}
                onChange={v => setFormData(p => ({...p, branch_id: v as string}))}
                placeholder="Select branch (optional)"
                groupLabel="Branches"
                allowAll={false}
                widthClass="w-full"
                disabled={modalMode === "view" || isLoadingBranches}
                multiple={false}
              />
            </div>
            {/* Latitude */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Latitude *</label>
              <Input type="number" step="any" value={formData.latitude} onChange={e => setFormData(p => ({...p, latitude: e.target.value}))} disabled={modalMode === "view"} />
            </div>
            {/* Longitude */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Longitude *</label>
              <Input type="number" step="any" value={formData.longitude} onChange={e => setFormData(p => ({...p, longitude: e.target.value}))} disabled={modalMode === "view"} />
            </div>
            {/* Radius */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Radius (m) *</label>
              <Input type="number" min={50} max={5000} value={formData.radius_meters} onChange={e => setFormData(p => ({...p, radius_meters: Number(e.target.value) || 0}))} disabled={modalMode === "view"} />
            </div>
            {/* Zone Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Zone Type *</label>
              <Select value={formData.zone_type} onValueChange={v => setFormData(p => ({...p, zone_type: v as any}))} disabled={modalMode === "view"}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ZONE_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Effective From */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Effective From *</label>
              <Input type="date" value={formData.effective_from} onChange={e => setFormData(p => ({...p, effective_from: e.target.value}))} disabled={modalMode === "view"} />
            </div>
            {/* Effective To */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Effective To</label>
              <Input type="date" value={formData.effective_to ?? ""} onChange={e => setFormData(p => ({...p, effective_to: e.target.value || null}))} disabled={modalMode === "view"} min={formData.effective_from} />
            </div>
            {/* Active */}
            <div className="flex items-center gap-2 pt-4">
              <Checkbox checked={formData.is_active} onCheckedChange={c => setFormData(p => ({...p, is_active: !!c}))} disabled={modalMode === "view"} />
              <label className="text-sm">Active</label>
            </div>
          </div>

          {/* Wi‑Fi SSID list */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Wi‑Fi SSIDs</label>
              {modalMode !== "view" && (
                <Button variant="outline" size="sm" onClick={addSsid}>
                  <PlusIcon className="mr-1 h-4 w-4" /> Add SSID
                </Button>
              )}
            </div>
            {formData.wifi_ssid_list.map((ssid, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={ssid}
                  onChange={e => updateSsid(idx, e.target.value)}
                  disabled={modalMode === "view"}
                  maxLength={100}
                  placeholder="Wi‑Fi SSID"
                />
                {modalMode !== "view" && (
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800" onClick={() => removeSsid(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
          <AlertDialogHeader><AlertDialogTitle>Delete Geofence?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
};

export default EmployeeGeofenceListingPage;