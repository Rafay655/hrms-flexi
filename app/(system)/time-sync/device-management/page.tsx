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
  Server,
  ShieldCheck,
  Sparkles,
  Cpu,
  MapPin,
  Radio,
  Database,
  Network,
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
import { useDeviceTypes } from "@/hooks/useDeviceTypes";
import {
  useAttendanceDevices,
  useCreateAttendanceDevice,
  useUpdateAttendanceDevice,
  useDeleteAttendanceDevice,
} from "@/hooks/useAttendanceDevices";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import type {
  AttendanceDevice,
  AttendanceDeviceFormData,
  DeviceMapping,
  SystemAttribute,
  SyncProtocol,
  DeviceDriver,
} from "@/types/attendance-device";

const DEFAULT_PER_PAGE = 10;

const SYNC_PROTOCOLS: { value: SyncProtocol; label: string }[] = [
  { value: "push_api", label: "Push API" },
  { value: "pull_api", label: "Pull API" },
  { value: "db_api", label: "DB API" },
];

const DEVICE_DRIVERS: { value: DeviceDriver; label: string }[] = [
  { value: "zkteco_sdk", label: "ZKTeco SDK" },
  { value: "rest_api", label: "REST API" },
  { value: "csv_import", label: "CSV Import" },
  { value: "db_direct", label: "DB Direct" },
  { value: "generic_webhook", label: "Generic Webhook" },
];

const SYSTEM_ATTRIBUTES: { value: SystemAttribute; label: string }[] = [
  { value: "employee_id", label: "Employee ID" },
  { value: "punched_at", label: "Punched At" },
  { value: "punch_type", label: "Punch Type" },
  { value: "device_identifier", label: "Device Identifier" },
];

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function formatDriverLabel(value?: string | null) {
  if (!value) return "—";
  return DEVICE_DRIVERS.find((item) => item.value === value)?.label ?? value.replaceAll("_", " ");
}


function AttendanceDeviceListingPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const isActiveParam =
    activeFilter === "all" ? undefined : activeFilter === "active" ? 1 : 0;

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

  const { data: deviceTypesRaw, isLoading: isLoadingDeviceTypes } = useDeviceTypes({
    per_page: 1000,
  });
  const deviceTypes = useMemo(() => {
    if (!deviceTypesRaw) return [];
    return deviceTypesRaw?.data?.data ?? [];
  }, [deviceTypesRaw]);

  const deviceTypeOptions: Option[] = useMemo(
    () => [
      { value: "", label: "— None —" },
      ...deviceTypes.map((dt: any) => ({ value: String(dt.uuid ?? dt.id), label: dt.name })),
    ],
    [deviceTypes]
  );

  const { data, isLoading, isFetching, error } = useAttendanceDevices({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_active: isActiveParam,
  });

  const devices = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  const createMutation = useCreateAttendanceDevice();
  const updateMutation = useUpdateAttendanceDevice();
  const deleteMutation = useDeleteAttendanceDevice();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create");
  const [selectedDevice, setSelectedDevice] = useState<AttendanceDevice | null>(null);
  const [formData, setFormData] = useState<AttendanceDeviceFormData>({
    hardware_device_id: "",
    friendly_name: "",
    device_name: "",
    device_type_id: "",
    model_make: "",
    serial_number: "",
    branch_id: "",
    internal_location_name: "",
    sync_protocol: "",
    device_driver: "",
    ip_address: "",
    port: "",
    sync_frequency_minutes: "",
    ip_whitelist: "",
    deduplication_window_minutes: "",
    auto_retry_on_failure: false,
    sync_enabled: true,
    is_active: true,
    mappings: [],
  });

  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, activeFilter]);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load devices" });
  }, [error]);

  const addMapping = () => {
    setFormData((prev) => ({
      ...prev,
      mappings: [
        ...prev.mappings,
        {
          system_attribute: "employee_id",
          device_key: "",
          is_required: false,
          default_value: null,
          notes: null,
        },
      ],
    }));
  };

  const removeMapping = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      mappings: prev.mappings.filter((_, i) => i !== index),
    }));
  };

  const updateMapping = (index: number, field: keyof DeviceMapping, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.mappings];
      (updated[index] as any)[field] = value;
      return { ...prev, mappings: updated };
    });
  };

  const populateForm = (device: AttendanceDevice) => {
    setFormData({
      hardware_device_id: device.hardware_device_id,
      friendly_name: device.friendly_name,
      device_name: device.device_name ?? "",
      device_type_id: device.device_type_id ?? "",
      model_make: device.model_make ?? "",
      serial_number: device.serial_number ?? "",
      branch_id: device.branch_id ?? "",
      internal_location_name: device.internal_location_name ?? "",
      sync_protocol: device.sync_protocol,
      device_driver: device.device_driver,
      ip_address: device.ip_address ?? "",
      port: device.port?.toString() ?? "",
      sync_frequency_minutes: device.sync_frequency_minutes?.toString() ?? "",
      ip_whitelist: device.ip_whitelist ?? "",
      deduplication_window_minutes: device.deduplication_window_minutes?.toString() ?? "",
      auto_retry_on_failure: device.auto_retry_on_failure,
      sync_enabled: device.sync_enabled,
      is_active: device.is_active,
      mappings: device.mappings?.map((m) => ({ ...m })) ?? [],
    });
  };

  const handleView = (device: AttendanceDevice) => {
    setSelectedDevice(device);
    populateForm(device);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (device: AttendanceDevice) => {
    setSelectedDevice(device);
    populateForm(device);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedDevice(null);
    setFormData({
      hardware_device_id: "",
      friendly_name: "",
      device_name: "",
      device_type_id: "",
      model_make: "",
      serial_number: "",
      branch_id: "",
      internal_location_name: "",
      sync_protocol: "",
      device_driver: "",
      ip_address: "",
      port: "",
      sync_frequency_minutes: "",
      ip_whitelist: "",
      deduplication_window_minutes: "",
      auto_retry_on_failure: false,
      sync_enabled: true,
      is_active: true,
      mappings: [],
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
    if (!formData.hardware_device_id.trim()) return toast.error("Hardware Device ID required");
    if (!formData.friendly_name.trim()) return toast.error("Friendly name required");
    if (formData.friendly_name.trim().length > 150) return toast.error("Friendly name ≤ 150 chars");
    if (!formData.sync_protocol) return toast.error("Sync protocol required");
    if (!formData.device_driver) return toast.error("Device driver required");
    if (formData.port && (parseInt(formData.port) < 1 || parseInt(formData.port) > 65535)) {
      return toast.error("Port must be 1‑65535");
    }

    const payload = { ...formData };

    if (modalMode === "create") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (selectedDevice) {
      updateMutation.mutate(
        { uuid: selectedDevice.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const columns: ColumnDef<AttendanceDevice & { sr: number }>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "#",
        cell: ({ row }) => (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
            {row.original.sr}
          </div>
        ),
      },
      {
        accessorKey: "friendly_name",
        header: "Device",
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <div className="font-semibold text-slate-900">{row.original.friendly_name}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-500">
              {row.original.device_name || row.original.model_make || "—"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "hardware_device_id",
        header: "Hardware ID",
        cell: ({ row }) => (
          <div className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            {row.original.hardware_device_id}
          </div>
        ),
      },
      {
        id: "branch",
        header: "Branch",
        cell: ({ row }) => (
          <div className="min-w-[150px] text-sm font-medium text-slate-700">
            {row.original.branch?.name ?? "—"}
          </div>
        ),
      },
      {
        id: "driver",
        header: "Driver",
        cell: ({ row }) => (
          <Badge className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-900 hover:bg-brand-50">
            {formatDriverLabel(row.original.device_driver)}
          </Badge>
        ),
      },
      {
        id: "sync_enabled",
        header: "Sync",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.sync_enabled
                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            }
          >
            <span
              className={
                row.original.sync_enabled
                  ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"
                  : "mr-1.5 h-1.5 w-1.5 rounded-full bg-slate-400"
              }
            />
            {row.original.sync_enabled ? "On" : "Off"}
          </Badge>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.is_active
                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                : "rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            }
          >
            <span
              className={
                row.original.is_active
                  ? "mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"
                  : "mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-500"
              }
            />
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(row.original)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-brand-50 hover:text-brand-900"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    const startSr = (page - 1) * perPage;
    return devices.map((d: any, idx: number) => ({ ...d, sr: startSr + idx + 1 }));
  }, [devices, page, perPage]);

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
  const activeCount = rows.filter((device: AttendanceDevice) => device.is_active).length;
  const syncEnabledCount = rows.filter((device: AttendanceDevice) => device.sync_enabled).length;

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="overflow-hidden rounded-3xl bg-brand-900 shadow-xl shadow-brand-900/10">
          <div className="relative px-5 py-6 sm:px-7 lg:px-8">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_28%),radial-gradient(circle_at_80%_0%,white,transparent_22%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                  <Sparkles className="h-3.5 w-3.5" />
                  TimeSync Configuration
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Attendance Device Management
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-white/70">
                  Manage biometric devices, sync protocols, network settings, and device field mappings.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Total</div>
                  <div className="mt-1 text-2xl font-bold text-white">{totalEntries.toLocaleString()}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Active</div>
                  <div className="mt-1 text-2xl font-bold text-white">{activeCount}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Sync On</div>
                  <div className="mt-1 text-2xl font-bold text-white">{syncEnabledCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-950">Device Directory</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {showingFrom} to {showingTo} of {totalEntries.toLocaleString()} records
                  {isFetching && !isLoading ? " • Refreshing..." : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  className="h-11 gap-2 rounded-xl bg-brand-900 px-4 font-semibold text-white shadow-lg shadow-brand-900/20 hover:bg-brand-800"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Device
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_190px]">
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by device name, hardware ID, branch, or driver..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none transition focus-visible:bg-white focus-visible:ring-brand-900/20"
                />
              </div>

              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-brand-900/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <span className="text-xs font-medium text-slate-500">Rows</span>
                <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                  <SelectTrigger className="h-9 w-full border-0 px-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[10, 15, 25, 50, 100].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium ring-1 ring-slate-200">
                  <Server className="h-4 w-4 text-brand-900" />
                  Page {page} of {totalPages}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium ring-1 ring-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {activeFilter === "all" ? "All devices" : activeFilter === "active" ? "Active only" : "Inactive only"}
                </span>
              </div>
              {(isLoading || isFetching) && (
                <div className="flex items-center gap-2 text-sm font-medium text-brand-900">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading data
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px]">
                  <thead className="bg-slate-50">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-200">
                        {hg.headers.map((h) => (
                          <th
                            key={h.id}
                            className="whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            <div className="flex cursor-pointer items-center gap-1.5">
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {h.column.getIsSorted() === "asc" ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                              ) : h.column.getIsSorted() === "desc" ? (
                                <ChevronLeft className="h-3.5 w-3.5" />
                              ) : null}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-900" />
                          <div className="mt-3 text-sm font-medium text-slate-600">Loading devices...</div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <Server className="h-7 w-7 text-slate-400" />
                          </div>
                          <div className="mt-4 text-sm font-semibold text-slate-900">No devices found</div>
                          <div className="mt-1 text-sm text-slate-500">Try changing search or filters.</div>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="transition hover:bg-slate-50/80">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!isLoading && rows.length > 0 && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{showingFrom}</span> to{" "}
                  <span className="font-semibold text-slate-800">{showingTo}</span> of{" "}
                  <span className="font-semibold text-slate-800">{totalEntries}</span> entries
                </p>

                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let num;
                    if (totalPages <= 5) num = i + 1;
                    else if (page <= 3) num = i + 1;
                    else if (page >= totalPages - 2) num = totalPages - 4 + i;
                    else num = page - 2 + i;

                    return (
                      <Button
                        key={num}
                        variant={page === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(num)}
                        className={
                          page === num
                            ? "h-9 min-w-9 rounded-lg bg-brand-900 px-3 text-white hover:bg-brand-800"
                            : "h-9 min-w-9 rounded-lg border-slate-200 px-3"
                        }
                      >
                        {num}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[980px]">
          <DialogHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-950">
                  {modalMode === "create"
                    ? "Add Attendance Device"
                    : modalMode === "edit"
                      ? "Edit Attendance Device"
                      : "View Attendance Device"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  {modalMode === "view"
                    ? "Read-only attendance device details."
                    : "Configure device identity, location, sync settings, and device field mappings."}
                </DialogDescription>
              </div>
              <Badge className="rounded-full bg-brand-900 px-3 py-1 text-white hover:bg-brand-900">
                {modalMode === "create" ? "New" : modalMode === "edit" ? "Editing" : "View"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 px-6 py-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Device Identity</h3>
                  <p className="text-xs text-slate-500">Basic device details and hardware information.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Hardware Device ID *</label>
                  <Input
                    value={formData.hardware_device_id}
                    onChange={(e) => setFormData((p) => ({ ...p, hardware_device_id: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={100}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Friendly Name *</label>
                  <Input
                    value={formData.friendly_name}
                    onChange={(e) => setFormData((p) => ({ ...p, friendly_name: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={150}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Device Name</label>
                  <Input
                    value={formData.device_name}
                    onChange={(e) => setFormData((p) => ({ ...p, device_name: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={100}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Device Type</label>
                  <SearchableSelect
                    options={deviceTypeOptions}
                    value={formData.device_type_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, device_type_id: v as string }))}
                    placeholder="Select type (optional)"
                    groupLabel="Device Types"
                    allowAll={false}
                    widthClass="w-full"
                    disabled={modalMode === "view" || isLoadingDeviceTypes}
                    multiple={false}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Model / Make</label>
                  <Input
                    value={formData.model_make}
                    onChange={(e) => setFormData((p) => ({ ...p, model_make: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={100}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Serial Number</label>
                  <Input
                    value={formData.serial_number}
                    onChange={(e) => setFormData((p) => ({ ...p, serial_number: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={100}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Location Details</h3>
                  <p className="text-xs text-slate-500">Assign branch and internal placement for this device.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Branch</label>
                  <SearchableSelect
                    options={branchOptions}
                    value={formData.branch_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, branch_id: v as string }))}
                    placeholder="Select branch (optional)"
                    groupLabel="Branches"
                    allowAll={false}
                    widthClass="w-full"
                    disabled={modalMode === "view" || isLoadingBranches}
                    multiple={false}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Internal Location</label>
                  <Input
                    value={formData.internal_location_name}
                    onChange={(e) => setFormData((p) => ({ ...p, internal_location_name: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={150}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sync & Network Settings</h3>
                  <p className="text-xs text-slate-500">Protocol, driver, network, and retry settings.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Sync Protocol *</label>
                  <Select
                    value={formData.sync_protocol}
                    onValueChange={(v) => setFormData((p) => ({ ...p, sync_protocol: v as any }))}
                    disabled={modalMode === "view"}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:ring-brand-900/20">
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {SYNC_PROTOCOLS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Device Driver *</label>
                  <Select
                    value={formData.device_driver}
                    onValueChange={(v) => setFormData((p) => ({ ...p, device_driver: v as any }))}
                    disabled={modalMode === "view"}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:ring-brand-900/20">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {DEVICE_DRIVERS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">IP Address</label>
                  <Input
                    value={formData.ip_address}
                    onChange={(e) => setFormData((p) => ({ ...p, ip_address: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={45}
                    placeholder="0.0.0.0"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Port</label>
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    value={formData.port}
                    onChange={(e) => setFormData((p) => ({ ...p, port: e.target.value }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Sync Frequency (min)</label>
                  <Input
                    type="number"
                    min={1}
                    max={1440}
                    value={formData.sync_frequency_minutes}
                    onChange={(e) => setFormData((p) => ({ ...p, sync_frequency_minutes: e.target.value }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Deduplication Window (min)</label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={formData.deduplication_window_minutes}
                    onChange={(e) => setFormData((p) => ({ ...p, deduplication_window_minutes: e.target.value }))}
                    disabled={modalMode === "view"}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">IP Whitelist</label>
                  <Input
                    value={formData.ip_whitelist}
                    onChange={(e) => setFormData((p) => ({ ...p, ip_whitelist: e.target.value }))}
                    disabled={modalMode === "view"}
                    maxLength={5000}
                    placeholder="Comma separated IP addresses"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:bg-white focus-visible:ring-brand-900/20"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Auto Retry
                  <Checkbox
                    checked={formData.auto_retry_on_failure}
                    onCheckedChange={(c) => setFormData((p) => ({ ...p, auto_retry_on_failure: !!c }))}
                    disabled={modalMode === "view"}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Sync Enabled
                  <Checkbox
                    checked={formData.sync_enabled}
                    onCheckedChange={(c) => setFormData((p) => ({ ...p, sync_enabled: !!c }))}
                    disabled={modalMode === "view"}
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Active Device
                  <Checkbox
                    checked={formData.is_active}
                    onCheckedChange={(c) => setFormData((p) => ({ ...p, is_active: !!c }))}
                    disabled={modalMode === "view"}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Device Field Mappings</h3>
                    <p className="text-xs text-slate-500">Map device payload keys with system attendance fields.</p>
                  </div>
                </div>

                {modalMode !== "view" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMapping}
                    className="h-9 rounded-xl border-slate-200 bg-white text-slate-700"
                  >
                    <PlusIcon className="mr-1.5 h-4 w-4" />
                    Add Mapping
                  </Button>
                )}
              </div>

              {formData.mappings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <Network className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">No mappings added</p>
                  <p className="mt-1 text-xs text-slate-500">Add mappings when this device sends custom field keys.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.mappings.map((mapping, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_1fr_120px_1fr_1fr_44px] md:items-end">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">System Attr.</label>
                          <Select
                            value={mapping.system_attribute}
                            onValueChange={(v) => updateMapping(idx, "system_attribute", v)}
                            disabled={modalMode === "view"}
                          >
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white focus:ring-brand-900/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {SYSTEM_ATTRIBUTES.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Device Key</label>
                          <Input
                            value={mapping.device_key}
                            onChange={(e) => updateMapping(idx, "device_key", e.target.value)}
                            disabled={modalMode === "view"}
                            className="h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-brand-900/20"
                          />
                        </div>

                        <label className="flex h-10 cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
                          Required
                          <Checkbox
                            checked={mapping.is_required}
                            onCheckedChange={(c) => updateMapping(idx, "is_required", !!c)}
                            disabled={modalMode === "view"}
                          />
                        </label>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Default</label>
                          <Input
                            value={mapping.default_value ?? ""}
                            onChange={(e) => updateMapping(idx, "default_value", e.target.value || null)}
                            disabled={modalMode === "view"}
                            className="h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-brand-900/20"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Notes</label>
                          <Input
                            value={mapping.notes ?? ""}
                            onChange={(e) => updateMapping(idx, "notes", e.target.value || null)}
                            disabled={modalMode === "view"}
                            className="h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-brand-900/20"
                          />
                        </div>

                        {modalMode !== "view" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 rounded-xl p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => removeMapping(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            {modalMode !== "view" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border-slate-200 bg-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-brand-900 px-5 font-semibold text-white hover:bg-brand-800"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Device
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border-slate-200 bg-white"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUuid} onOpenChange={() => setDeleteUuid(null)}>
        <AlertDialogContent className="rounded-3xl border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-950">Delete Device?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This action cannot be undone. The selected attendance device will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-rose-600 font-semibold hover:bg-rose-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AttendanceDeviceListingPage;
