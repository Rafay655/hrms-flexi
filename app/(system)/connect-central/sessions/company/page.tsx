"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Monitor,
  Smartphone,
  Code2,
  Terminal,
  Search,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
  X,
  Users,
  Activity,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SessionRevokeDialog from "../../_components/SessionRevokeDialog";
import type { RiskLevel } from "../../_components/RiskBadge";
import { getCompanySessions, bulkRevokeSessions } from "@/lib/api/connect-central/sessions";
import type { DeviceType, CompanySession } from "@/lib/api/connect-central/sessions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CompanySessionRow {
  uuid: string;
  user: { name: string; email: string };
  role: string;
  device_type: DeviceType;
  deviceName: string;
  browser: string;
  ip_address: string;
  country_code: string;
  country_name: string;
  city: string;
  last_activity_at: string;
  created_at: string;
  risk: RiskLevel;
}

// ── API → CompanySessionRow mapping ───────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  it_admin: "IT Admin",
  hr_manager: "HR Manager",
  hr_officer: "HR Officer",
  manager: "Manager",
  finance: "Finance",
  employee: "Employee",
};

function toCompanyRow(s: CompanySession): CompanySessionRow {
  const typeLabel = s.device_type.charAt(0).toUpperCase() + s.device_type.slice(1);
  return {
    uuid: s.uuid,
    user: { name: s.user.name, email: s.user.email },
    role: ROLE_LABELS[s.user.role] ?? s.user.role,
    device_type: s.device_type,
    deviceName: typeLabel,
    browser: "",
    ip_address: s.ip_address,
    country_code: "",
    country_name: s.location_country ?? "",
    city: s.location_city ?? "",
    last_activity_at: s.last_activity_at,
    created_at: s.created_at,
    risk: s.risk_score,
  };
}

// (mock data removed — page is wired to getCompanySessions)

const ROLE_OPTIONS = ["Admin", "Super Admin", "IT Admin", "HR Manager", "HR Officer", "Manager", "Finance", "Employee"];
const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "low",    label: "Low Risk"    },
  { value: "medium", label: "Medium Risk" },
  { value: "high",   label: "High Risk"   },
];
const DEVICE_OPTIONS: { value: DeviceType; label: string }[] = [
  { value: "web",    label: "Web / Desktop" },
  { value: "mobile", label: "Mobile"        },
  { value: "api",    label: "API"           },
  { value: "cli",    label: "CLI"           },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Active now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return "Yesterday";
  return `${Math.floor(s / 86400)}d ago`;
}

function toFlag(code: string): string {
  const base = 0x1f1e6 - 65;
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(base + c.charCodeAt(0))).join("");
}

const DEVICE_ICON: Record<DeviceType, React.ElementType> = {
  web: Monitor, mobile: Smartphone, api: Code2, cli: Terminal,
};

const RISK_CONFIG: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  low:    { bg: "#D1FAE5", text: "#065F46", label: "Low"    },
  medium: { bg: "#FEF3C7", text: "#92400E", label: "Medium" },
  high:   { bg: "#FEE2E2", text: "#991B1B", label: "High"   },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function UserCell({ user }: { user: CompanySessionRow["user"] }) {
  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const hue = (user.name.charCodeAt(0) * 37) % 360;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ backgroundColor: `hsl(${hue},55%,48%)` }}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const adminLike = ["Super Admin", "Admin", "IT Admin"].includes(role);
  return (
    <span
      className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={
        adminLike
          ? { backgroundColor: "#EEF2FF", color: "#4338CA" }
          : { backgroundColor: "#F3F4F6", color: "#374151" }
      }
    >
      {role}
    </span>
  );
}

function RiskPill({ risk }: { risk: RiskLevel }) {
  const cfg = RISK_CONFIG[risk];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.text }} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  accentBar,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  accentBar: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: accentBar }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value.toLocaleString()}</p>
        </div>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

// ── Export CSV ────────────────────────────────────────────────────────────────

function exportToCSV(rows: CompanySessionRow[]) {
  const headers = ["User", "Email", "Role", "Device", "Browser", "IP Address", "City", "Country", "Last Activity", "Risk"];
  const body = rows.map((r) => [
    r.user.name,
    r.user.email,
    r.role,
    r.deviceName,
    r.browser,
    r.ip_address,
    r.city,
    r.country_name,
    new Date(r.last_activity_at).toLocaleString(),
    r.risk,
  ].map((v) => `"${v}"`).join(","));

  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `company-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Column helper ─────────────────────────────────────────────────────────────

const colHelper = createColumnHelper<CompanySessionRow>();

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompanySessionsPage() {
  const queryClient = useQueryClient();

  // ── Filter state ─────────────────────────────────────────────────────────

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  // ── Table state ──────────────────────────────────────────────────────────

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // ── Dialog state ─────────────────────────────────────────────────────────

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [singleRevokeUuid, setSingleRevokeUuid] = useState<string | null>(null);

  // ── Mutation ─────────────────────────────────────────────────────────────

  const { mutateAsync: doRevoke, isPending: revoking } = useMutation({
    mutationFn: (uuids: string[]) => bulkRevokeSessions({ session_uuids: uuids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cc-company-sessions"] });
      setRowSelection({});
      setBulkDialogOpen(false);
      setSingleRevokeUuid(null);
    },
  });

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: apiRows, isLoading } = useQuery({
    queryKey: ["cc-company-sessions"],
    queryFn: () => getCompanySessions(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const rows = useMemo(() => (apiRows ?? []).map(toCompanyRow), [apiRows]);

  // ── Filtered data ─────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    return rows.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.user.name.toLowerCase().includes(q) ||
        row.user.email.toLowerCase().includes(q) ||
        row.ip_address.includes(q) ||
        row.city.toLowerCase().includes(q);

      const matchRole   = roleFilter   === "all" || row.role        === roleFilter;
      const matchDevice = deviceFilter === "all" || row.device_type === deviceFilter;
      const matchRisk   = riskFilter   === "all" || row.risk        === riskFilter;

      return matchSearch && matchRole && matchDevice && matchRisk;
    });
  }, [rows, search, roleFilter, deviceFilter, riskFilter]);

  // ── KPIs (derived from full dataset) ──────────────────────────────────────

  const allData = rows;
  const uniqueUsers = new Set(allData.map((r) => r.user.email)).size;
  const highRisk    = allData.filter((r) => r.risk === "high").length;
  const mobileCount = allData.filter((r) => r.device_type === "mobile").length;

  // ── Column definitions ────────────────────────────────────────────────────

  const columns = useMemo(() => [
    // Checkbox
    colHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? ("indeterminate" as const) : false)
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    }),

    // User
    colHelper.accessor("user", {
      header: "User",
      cell: (info) => <UserCell user={info.getValue()} />,
      enableSorting: false,
    }),

    // Role
    colHelper.accessor("role", {
      header: "Role",
      cell: (info) => <RoleBadge role={info.getValue()} />,
    }),

    // Device
    colHelper.accessor("deviceName", {
      header: "Device",
      cell: (info) => {
        const row = info.row.original;
        const Icon = DEVICE_ICON[row.device_type] ?? Monitor;
        return (
          <div className="flex items-center gap-1.5 text-xs text-gray-700">
            <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="truncate max-w-[100px]">{info.getValue()}</span>
          </div>
        );
      },
    }),

    // IP
    colHelper.accessor("ip_address", {
      header: "IP Address",
      cell: (info) => (
        <span className="font-mono text-[11px] text-gray-500">{info.getValue()}</span>
      ),
    }),

    // Location
    colHelper.accessor("city", {
      header: "Location",
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <span aria-label={`Flag of ${row.country_name}`} className="text-sm">
              {toFlag(row.country_code)}
            </span>
            <span className="truncate max-w-[90px]">{info.getValue()}</span>
          </span>
        );
      },
    }),

    // Last Activity
    colHelper.accessor("last_activity_at", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Active
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: (info) => (
        <span className="text-xs text-gray-500">{relativeTime(info.getValue())}</span>
      ),
    }),

    // Risk
    colHelper.accessor("risk", {
      header: "Risk",
      cell: (info) => <RiskPill risk={info.getValue()} />,
    }),

    // Actions
    colHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="text-xs">View User Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-xs">View Session Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => setSingleRevokeUuid(row.original.uuid)}
            >
              Revoke Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 48,
    }),
  ], []);

  // ── Table instance ────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.uuid,
    enableRowSelection: true,
    manualPagination: false,
  });

  // ── Selection helpers ─────────────────────────────────────────────────────

  const selectedUuids = Object.keys(rowSelection);
  const selectedCount = selectedUuids.length;

  const clearFilters = useCallback(() => {
    setSearch(""); setRoleFilter("all"); setDeviceFilter("all"); setRiskFilter("all");
  }, []);

  const hasFilters = search || roleFilter !== "all" || deviceFilter !== "all" || riskFilter !== "all";

  // ── Revoke targets ────────────────────────────────────────────────────────

  const singleRevokeSession = singleRevokeUuid
    ? rows.find((r) => r.uuid === singleRevokeUuid)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-24">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Company Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor all active sessions across your organisation.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => exportToCSV(filteredData)}
          >
            <Download className="h-3.5 w-3.5" />
            Export Sessions
          </Button>
          {selectedCount > 0 && (
            <Button
              size="sm"
              className="gap-1.5 text-xs text-white"
              style={{ backgroundColor: "var(--cc-danger)" }}
              onClick={() => setBulkDialogOpen(true)}
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Revoke Selected ({selectedCount})
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity}      label="Total Active Sessions" value={allData.length}  iconBg="#EEF2FF" iconColor="#6366F1" accentBar="#6366F1" />
        <StatCard icon={Users}         label="Unique Users"          value={uniqueUsers}      iconBg="#D1FAE5" iconColor="#10B981" accentBar="#10B981" />
        <StatCard icon={AlertTriangle} label="High Risk Sessions"    value={highRisk}         iconBg="#FEE2E2" iconColor="#EF4444" accentBar="#EF4444" />
        <StatCard icon={Smartphone}    label="Mobile Sessions"       value={mobileCount}      iconBg="#FEF3C7" iconColor="#F59E0B" accentBar="#F59E0B" />
      </div>

      {/* ── Filter row ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            className="pl-8 h-9 text-xs"
            placeholder="Search sessions, IP, location…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
          />
        </div>

        {/* Role */}
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Roles</SelectItem>
            {ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Device Type */}
        <Select value={deviceFilter} onValueChange={(v) => { setDeviceFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="Device Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Devices</SelectItem>
            {DEVICE_OPTIONS.map((d) => <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Risk Level */}
        <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Risk Levels</SelectItem>
            {RISK_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Clear */}
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs text-gray-500" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-gray-100 bg-gray-50/60">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
                      style={{ width: header.column.columnDef.size }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-gray-400">
                    Loading sessions…
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-gray-400">
                    No sessions match your filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-50 last:border-0 transition-colors cursor-pointer ${
                      row.getIsSelected()
                        ? "bg-indigo-50/60"
                        : "hover:bg-gray-50/70"
                    }`}
                    onClick={() => row.toggleSelected()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing{" "}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}{" "}
            of {filteredData.length} sessions
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-600 font-medium">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Floating bulk action bar ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className="flex items-center gap-4 px-6 py-3 rounded-2xl shadow-2xl text-white"
              style={{ backgroundColor: "var(--cc-navy)" }}
            >
              <span className="text-sm font-medium">
                {selectedCount} session{selectedCount !== 1 ? "s" : ""} selected
              </span>

              <div className="w-px h-4 bg-white/20" />

              <button
                className="text-xs text-white/70 hover:text-white transition-colors"
                onClick={() => setRowSelection({})}
              >
                Clear Selection
              </button>

              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white border-0"
                onClick={() => setBulkDialogOpen(true)}
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Revoke Selected
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Bulk revoke */}
      <SessionRevokeDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        sessionInfo={`${selectedCount} selected session${selectedCount !== 1 ? "s" : ""}`}
        onConfirm={() => { doRevoke(selectedUuids); }}
        loading={revoking}
      />

      {/* Single row-menu revoke */}
      <SessionRevokeDialog
        open={!!singleRevokeUuid}
        onOpenChange={(open) => { if (!open) setSingleRevokeUuid(null); }}
        sessionInfo={
          singleRevokeSession
            ? `${singleRevokeSession.user.name} · ${singleRevokeSession.deviceName}`
            : undefined
        }
        onConfirm={() => { doRevoke([singleRevokeUuid!]); }}
        loading={revoking}
      />
    </div>
  );
}
