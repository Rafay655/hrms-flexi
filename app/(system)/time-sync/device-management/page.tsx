"use client";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  KeyRound,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  Trash2,
  Unplug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchableSelect from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import { useAttendanceDevices } from "@/hooks/useAttendanceDevices";
import { canSyncDevice, deviceDate } from "@/lib/attendance-device";
import type { AttendanceDeviceFilters } from "@/types/attendance-device";
import {
  DeviceFormModal,
  DeviceError,
  primaryButton,
} from "./components/device-form-modal";
import {
  DeviceActionModal,
  DeviceBadge,
  DeviceDetailModal,
  type DeviceAction,
} from "./components/device-detail-modal";
type Modal =
  | { mode: "create" }
  | { mode: "view" | "edit"; uuid: string }
  | { mode: "action"; uuid: string; action: DeviceAction };
export default function AttendanceDeviceListingPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AttendanceDeviceFilters>({
    page: 1,
    per_page: 10,
  });
  const [modal, setModal] = useState<Modal | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = search.trim() || undefined;
      setFilters((previous) =>
        previous.search === value
          ? previous
          : { ...previous, search: value, page: 1 },
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useAttendanceDevices(filters);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const page = meta?.current_page ?? filters.page ?? 1;
  const pages = Math.max(1, meta?.last_page ?? 1);
  const total = meta?.total ?? 0;
  const from = rows.length
    ? (meta?.from ??
      (page - 1) * (meta?.per_page ?? filters.per_page ?? 10) + 1)
    : 0;
  const to = rows.length ? (meta?.to ?? from + rows.length - 1) : 0;
  const first = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => first + index,
  );
  const textPending = (search.trim() || undefined) !== filters.search;
  const paginationBusy = query.isFetching || !meta || textPending;
  const hasFilters = Boolean(search || filters.is_active !== undefined);
  if (
    meta &&
    !query.isPlaceholderData &&
    meta.current_page > pages &&
    filters.page !== pages
  )
    setFilters({ ...filters, page: pages });
  function filter(patch: Partial<AttendanceDeviceFilters>) {
    setFilters((previous) => ({ ...previous, ...patch, page: 1 }));
  }
  function clear() {
    setSearch("");
    setFilters((previous) => ({ page: 1, per_page: previous.per_page }));
  }
  function paginate(value: number) {
    setFilters((previous) => ({ ...previous, page: value }));
  }
  return (
    <div className="min-w-0 max-w-full p-3">
      <Card className="min-w-0 border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Attendance Devices Directory
              </CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                {total.toLocaleString()} devices · Manage connections and
                attendance synchronization
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "mr-2 h-4 w-4",
                    query.isFetching && "animate-spin",
                  )}
                />
                Refresh
              </Button>
              <Button
                size="sm"
                className={primaryButton}
                onClick={() => setModal({ mode: "create" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create device
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 basis-full sm:basis-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search attendance devices"
                placeholder="Search devices…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <SearchableSelect
                aria-label="Devices per page"
                allowAll={false}
                widthClass="w-28"
                value={String(filters.per_page ?? 10)}
                options={[10, 25, 50, 100].map((value) => ({
                  value: String(value),
                  label: String(value),
                }))}
                onChange={(value) => filter({ per_page: Number(value) })}
              />
              <span>entries</span>
            </div>
            <div className="basis-full" />
            <SearchableSelect
              aria-label="Filter devices by status"
              allLabel="All statuses"
              widthClass="w-full sm:w-56"
              value={
                filters.is_active === undefined ? "" : String(filters.is_active)
              }
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ]}
              onChange={(value) =>
                filter({ is_active: value === "" ? undefined : Number(value) })
              }
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear filters
              </Button>
            )}
          </div>
          <DeviceError error={query.error} retry={() => void query.refetch()} />
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600"
          >
            <span>
              Showing <strong className="text-gray-900">{from}</strong> to{" "}
              <strong className="text-gray-900">{to}</strong> of{" "}
              <strong className="text-gray-900">
                {total.toLocaleString()}
              </strong>{" "}
              entries
            </span>
            {query.isFetching && (
              <Badge
                variant="outline"
                className="gap-1 border-blue-200 bg-blue-50"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading…
              </Badge>
            )}
          </div>
          <div
            className="overflow-hidden rounded-lg border border-gray-200"
            aria-busy={query.isFetching}
          >
            <div className="min-w-0">
              <table className="w-full table-fixed ">
                <colgroup>
                  <col className="w-24 " />
                  <col />
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[18%]" />
                  <col className="w-24" />
                </colgroup>
                <caption className="sr-only">Attendance devices</caption>
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    {[
                      "SR. NO.",
                      "Device",
                      "Branch",
                      "Last sync",
                      "Status",
                      "Actions",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className={cn(
                          "px-2 py-3 sm:px-3",
                          label === "Actions" && "text-right",
                        )}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {query.isPending ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading devices…
                        </p>
                      </td>
                    </tr>
                  ) : !rows.length ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <Server className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 font-medium">
                          {query.isError
                            ? "Unable to load devices"
                            : "No devices found"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {hasFilters
                            ? "Try another search or clear your filters."
                            : "Create an attendance device to get started."}
                        </p>
                        {!query.isError && (
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={
                              hasFilters
                                ? clear
                                : () => setModal({ mode: "create" })
                            }
                          >
                            {hasFilters ? "Clear filters" : "Create device"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    rows.map((device, index) => (
                      <tr
                        key={device.id}
                        className="group text-xs sm:text-sm [overflow-wrap:anywhere] transition-colors hover:bg-gray-50"
                      >
                        <td className="px-2 py-4 sm:px-3 font-medium text-muted-foreground">
                          {from + index}
                        </td>
                        <td className="px-2 py-4 sm:px-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setModal({ mode: "view", uuid: device.id })
                                }
                                title={device.friendly_name}
                                className="block w-full truncate text-left font-semibold text-gray-900 hover:underline"
                              >
                                {device.friendly_name}
                              </button>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {device.hardware_device_id} ·{" "}
                                {device.device_type?.name ||
                                  device.device_name ||
                                  "No device type"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4 sm:px-3">
                          <p>{device.branch?.name ?? "—"}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {device.internal_location_name}
                          </p>
                        </td>
                        <td className="px-2 py-4 sm:px-3">
                          <p className="text-xs">
                            {deviceDate(device.last_synced_at)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {device.last_sync_count == null
                              ? "No sync result"
                              : `${device.last_sync_count} punches in last sync`}
                          </p>
                        </td>
                        <td className="px-2 py-4 sm:px-3">
                          <div className="flex flex-col items-start gap-1">
                            <DeviceBadge active={device.is_active}>
                              {device.is_active ? "Active" : "Inactive"}
                            </DeviceBadge>
                            <span className="text-xs text-muted-foreground">
                              Sync{" "}
                              {device.sync_enabled ? "enabled" : "disabled"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-4 sm:px-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                aria-label={`Actions for ${device.friendly_name}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onSelect={() =>
                                  setModal({ mode: "view", uuid: device.id })
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  setModal({ mode: "edit", uuid: device.id })
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  setModal({
                                    mode: "action",
                                    uuid: device.id,
                                    action: "test",
                                  })
                                }
                              >
                                <Unplug className="mr-2 h-4 w-4" />
                                Test connection
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canSyncDevice(device)}
                                onSelect={() =>
                                  setModal({
                                    mode: "action",
                                    uuid: device.id,
                                    action: "sync",
                                  })
                                }
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sync now
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  setModal({
                                    mode: "action",
                                    uuid: device.id,
                                    action: "rotate-key",
                                  })
                                }
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Rotate API key
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() =>
                                  setModal({
                                    mode: "action",
                                    uuid: device.id,
                                    action: "delete",
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 rounded-b-lg border-t border-gray-200 bg-gray-50 px-2 py-4 sm:px-3 md:flex-row">
            <p className="text-sm text-gray-600">
              Page <strong className="text-gray-900">{page}</strong> of{" "}
              <strong className="text-gray-900">{pages}</strong>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="First page"
                disabled={paginationBusy || page <= 1}
                onClick={() => paginate(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label="Previous page"
                disabled={paginationBusy || page <= 1}
                onClick={() => paginate(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {numbers.map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={page === value ? "default" : "outline"}
                  aria-label={`Page ${value}`}
                  aria-current={page === value ? "page" : undefined}
                  disabled={paginationBusy}
                  className={
                    page === value
                      ? primaryButton
                      : "border-gray-300 hover:bg-gray-100"
                  }
                  onClick={() => paginate(value)}
                >
                  {value}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                aria-label="Next page"
                disabled={paginationBusy || page >= pages}
                onClick={() => paginate(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label="Last page"
                disabled={paginationBusy || page >= pages}
                onClick={() => paginate(pages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              {from} – {to} of {total.toLocaleString()} entries
            </p>
          </div>
        </CardContent>
      </Card>
      {modal?.mode === "create" && (
        <DeviceFormModal onClose={() => setModal(null)} />
      )}
      {modal?.mode === "edit" && (
        <DeviceFormModal
          key={modal.uuid}
          uuid={modal.uuid}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.mode === "view" && (
        <DeviceDetailModal
          key={modal.uuid}
          uuid={modal.uuid}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ mode: "edit", uuid: modal.uuid })}
        />
      )}
      {modal?.mode === "action" && (
        <DeviceActionModal
          key={`${modal.uuid}-${modal.action}`}
          uuid={modal.uuid}
          action={modal.action}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
