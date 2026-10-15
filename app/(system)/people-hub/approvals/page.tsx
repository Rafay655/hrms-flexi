"use client";

import { showApiError } from "@/lib/error-toast";
import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  ShieldCheck,
  SearchIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  GitBranch,
  LogOut,
  Clock3,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*  Config                                                                      */
/* -------------------------------------------------------------------------- */

const DEFAULT_PER_PAGE = 10;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type ApprovalStatus = "pending" | "approved" | "rejected" | "waiting" | string;
type ModuleType = "career_event" | "exit" | string;

type ApprovalStats = {
  pending_total: number;
  career_pending: number;
  exit_pending: number;
  high_priority: number;
};

type ApprovalEmployee = {
  uuid: string;
  employee_code: string | null;
  name: string | null;
  designation: string | null;
  department: string | null;
};

type ApprovalStep = {
  uuid: string;
  step_number: number;
  role_label: string | null;
  role_key: string | null;
  status: ApprovalStatus;
  comments: string | null;
  actioned_by: string | null;
  actioned_at: string | null;
  due_at: string | null;
};

type CareerEventDetails = {
  id?: number;
  uuid?: string;
  event_type?: string | null;
  effective_date?: string | null;
  salary_impact?: boolean | null;
  reason?: string | null;
  effective_reason?: string | null;
  status?: string | null;
  previous_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  total_steps?: number | null;
  completed_steps?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

type ApprovalApiItem = {
  uuid: string;
  module_type: ModuleType;
  sub_type: string | null;
  status: ApprovalStatus;
  current_step: number;
  total_steps: number;
  progress_percent: number;
  employee: ApprovalEmployee | null;
  steps: ApprovalStep[];
  rejection_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  approvable: CareerEventDetails | null;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ApprovalsApiResponse = {
  success: boolean;
  message: string;
  data: {
    stats: ApprovalStats;
    data: ApprovalApiItem[];
    meta: PaginationMeta;
  };
};

type ApprovalRow = {
  sr: number;
  uuid: string;
  module_type: ModuleType;
  module_label: string;
  request_type: string;
  status: ApprovalStatus;
  status_label: string;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  approval_role: string;
  approval_stage: string;
  submitted_on: string;
  due_date: string | null;
  priority: "Low" | "Medium" | "High";
  progress_label: string;
  progress_value: number;
  steps: ApprovalStep[];
  approvable: CareerEventDetails | null;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function useDebounced<T>(value: T, delay = 450) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function titleCase(value?: string | null) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "--";
}

function getModuleLabel(moduleType: ModuleType) {
  switch (moduleType) {
    case "career_event":
      return "Transfer & Promotions";
    case "exit":
    case "employee_exit":
      return "Exit Management";
    default:
      return titleCase(moduleType);
  }
}

function getStatusLabel(status: ApprovalStatus) {
  return titleCase(status);
}

function getCurrentStep(item: ApprovalApiItem) {
  return (
    item.steps.find((step) => step.step_number === item.current_step) ||
    item.steps.find((step) => step.status === "pending") ||
    item.steps[0] ||
    null
  );
}

function getPriority(dueAt?: string | null): "Low" | "Medium" | "High" {
  if (!dueAt) return "Low";

  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return "Low";

  const now = Date.now();
  const diffDays = (due - now) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "High";
  if (diffDays <= 2) return "Medium";
  return "Low";
}

function getStatusClass(status: ApprovalStatus) {
  switch (status) {
    case "pending":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "approved":
      return "bg-emerald-600 text-white border-transparent hover:bg-emerald-600";
    case "rejected":
      return "bg-red-600 text-white border-transparent hover:bg-red-600";
    case "waiting":
      return "bg-slate-500 text-white border-transparent hover:bg-slate-500";
    default:
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
  }
}

function getPriorityClass(priority: "Low" | "Medium" | "High") {
  switch (priority) {
    case "High":
      return "bg-red-600 text-white border-transparent hover:bg-red-600";
    case "Medium":
      return "bg-amber-600 text-white border-transparent hover:bg-amber-600";
    default:
      return "bg-brand-100 text-brand-800 border-gray-200 hover:bg-brand-100";
  }
}

function getModuleClass(moduleType: ModuleType) {
  switch (moduleType) {
    case "career_event":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "exit":
    case "employee_exit":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    default:
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
  }
}

function getAuthHeaders() {
  if (typeof window === "undefined") return {};

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("access_token");

  const companyId =
    localStorage.getItem("company_id") ||
    localStorage.getItem("companyId") ||
    localStorage.getItem("selected_company_id");

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(companyId ? { "X-Company-ID": companyId } : {}),
  };
}

function mapApprovalRow(item: ApprovalApiItem, index: number, page: number, perPage: number): ApprovalRow {
  const currentStep = getCurrentStep(item);
  const completedSteps = item.steps.filter((step) => step.status === "approved").length;
  const progress =
    typeof item.progress_percent === "number" && item.progress_percent > 0
      ? item.progress_percent
      : item.total_steps > 0
      ? Math.round((completedSteps / item.total_steps) * 100)
      : 0;

  const requestType = item.approvable?.event_type || item.sub_type || item.module_type;
  const employeeName = item.employee?.name || item.employee?.employee_code || "—";
  const dueAt = currentStep?.due_at || null;

  return {
    sr: (page - 1) * perPage + index + 1,
    uuid: item.uuid,
    module_type: item.module_type,
    module_label: getModuleLabel(item.module_type),
    request_type: titleCase(String(requestType)),
    status: item.status,
    status_label: getStatusLabel(item.status),
    employee_name: employeeName,
    employee_code: item.employee?.employee_code || "—",
    designation: item.employee?.designation || "—",
    department: item.employee?.department || "—",
    approval_role: currentStep?.role_label || "—",
    approval_stage: `Step ${item.current_step || 1} of ${item.total_steps || item.steps.length || 1}`,
    submitted_on: item.created_at,
    due_date: dueAt,
    priority: getPriority(dueAt),
    progress_label: `${completedSteps}/${item.total_steps || item.steps.length || 0} approvals completed`,
    progress_value: progress,
    steps: item.steps || [],
    approvable: item.approvable || null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Page() {
  const router = useRouter();

  const [rows, setRows] = React.useState<ApprovalRow[]>([]);
  const [stats, setStats] = React.useState<ApprovalStats>({
    pending_total: 0,
    career_pending: 0,
    exit_pending: 0,
    high_priority: 0,
  });
  const [meta, setMeta] = React.useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: DEFAULT_PER_PAGE,
    total: 0,
  });

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounced(search);
  const [moduleFilter, setModuleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [selectedPreview, setSelectedPreview] = React.useState<ApprovalRow | null>(null);

  const fetchApprovals = React.useCallback(async () => {
    try {
      setIsFetching(true);

      const response = await api.get<ApprovalsApiResponse>(
        `/people-hub/approvals`,
        {
          headers: getAuthHeaders(),
          params: {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(moduleFilter !== "all" ? { module_type: moduleFilter } : {}),
            ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          },
        }
      );

      const payload = response.data.data;

      setStats(payload.stats);
      setMeta(payload.meta);
      setRows(payload.data.map((item, index) => mapApprovalRow(item, index, page, perPage)));
    } catch (error) {
      console.error(error);
      showApiError(error, { ...({
        description: "Please check the approvals API or auth token.",
      }), fallbackMessage: "Failed to load approvals" });
      setRows([]);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [page, perPage, debouncedSearch, moduleFilter, statusFilter]);

  React.useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  React.useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, moduleFilter, statusFilter]);

  const showingFrom = meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const showingTo = meta.total > 0 ? Math.min(meta.current_page * meta.per_page, meta.total) : 0;

  const columns = React.useMemo<ColumnDef<ApprovalRow>[]>(
    () => [
      {
        accessorKey: "sr",
        header: "Sr.",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-brand-900">{row.original.sr}</span>
        ),
      },
      {
        accessorKey: "employee_name",
        header: "Employee",
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex min-w-[230px] items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-xs font-bold text-white">
                {getInitials(item.employee_name)}
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-brand-900">
                  {item.employee_name}
                </div>
                <div className="mt-0.5 text-[11px] text-brand-700">
                  {item.employee_code}
                </div>
                <div className="mt-0.5 text-[11px] text-brand-600">
                  {item.designation} • {item.department}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "module_label",
        header: "Module / Type",
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="min-w-[190px] space-y-2">
              <Badge className={getModuleClass(item.module_type)}>{item.module_label}</Badge>
              <div>
                <Badge className="border-gray-200 bg-brand-100 text-brand-800 hover:bg-brand-100">
                  {item.request_type}
                </Badge>
              </div>
            </div>
          );
        },
      },
   
      {
        accessorKey: "submitted_on",
        header: "Timeline",
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="min-w-[165px] text-sm">
              <div className="font-medium text-brand-900">
                Submitted {formatDate(item.submitted_on)}
              </div>
              <div className="mt-1 text-[11px] text-brand-700">
                Due {formatDate(item.due_date)}
              </div>
              <div className="mt-2">
                <Badge className={getPriorityClass(item.priority)}>{item.priority}</Badge>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status / Progress",
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="min-w-[190px] space-y-2">
              <Badge className={getStatusClass(item.status)}>{item.status_label}</Badge>
              <div className="text-[11px] text-brand-700">{item.progress_label}</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                <div
                  className="h-full rounded-full bg-brand-800"
                  style={{ width: `${Math.min(100, Math.max(0, item.progress_value))}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPreview(item)}
                className="text-brand-800 hover:bg-brand-100 hover:text-brand-900"
                title="Quick View"
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/people-hub/approvals/${item.uuid}`)}
                className="text-brand-700 hover:bg-brand-100 hover:text-brand-900"
                title="Open Approval"
              >
                <ShieldCheck className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <Card className="overflow-hidden border border-gray-200 bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] shadow-sm">
          <div className="p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">Approvals Center</h1>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      PeopleHub
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-white/80">
                    Review pending approvals for career events and employee exits.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={fetchApprovals}
                disabled={isFetching}
                className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Pending Approvals
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.pending_total}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <Clock3 className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Career Pending
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.career_pending}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <GitBranch className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Exit Pending
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.exit_pending}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <LogOut className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    High Priority
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.high_priority}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <AlertTriangle className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Approval Queue
                </CardTitle>
                <CardDescription className="mt-1 text-brand-700">
                  Data is loaded from PeopleHub approvals API.
                </CardDescription>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[280px_180px_160px_110px]">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <Input
                    placeholder="Search employee/code..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="border-gray-200 pl-10 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                  />
                </div>

                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-full border-gray-200 text-brand-800">
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="career_event">Career Events</SelectItem>
                    <SelectItem value="exit">Exit Management</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full border-gray-200 text-brand-800">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={perPage.toString()}
                  onValueChange={(value) => setPerPage(Number(value))}
                >
                  <SelectTrigger className="w-full border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[10, 20, 50, 100].map((number) => (
                      <SelectItem key={number} value={number.toString()}>
                        {number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">{showingFrom}</span>
                  <span className="text-brand-700"> to </span>
                  <span className="font-semibold text-brand-900">{showingTo}</span>
                  <span className="text-brand-700"> of </span>
                  <span className="font-semibold text-brand-900">{meta.total}</span>
                  <span className="text-brand-700"> entries</span>
                </div>

                {isFetching && (
                  <Badge className="gap-1 border-gray-200 bg-white text-xs text-brand-800">
                    <Loader2 className="h-3 w-3 animate-spin" /> Updating...
                  </Badge>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>

                  <tbody className="divide-y divide-brand-300/50 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
                            <p className="text-sm font-medium text-brand-800">
                              Loading approvals...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <ShieldCheck className="h-10 w-10 text-brand-300" />
                            <p className="font-medium text-brand-800">No approvals found</p>
                            <p className="text-sm text-brand-600">
                              Try changing your search or filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="align-top transition-colors hover:bg-brand-100"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-5 py-4 text-sm align-top">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {rows.length > 0 && (
                <div className="border-t border-gray-200 px-5 py-4">
                  <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="text-sm text-brand-700">
                      Page <span className="font-semibold text-brand-900">{meta.current_page}</span> of{" "}
                      <span className="font-semibold text-brand-900">{meta.last_page}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={meta.current_page === 1 || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-200"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={meta.current_page === 1 || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
                        disabled={meta.current_page === meta.last_page || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(meta.last_page)}
                        disabled={meta.current_page === meta.last_page || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-200"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm text-brand-700">
                      <span className="font-semibold text-brand-900">{showingFrom}</span>
                      {" – "}
                      <span className="font-semibold text-brand-900">{showingTo}</span>
                      {" of "}
                      <span className="font-semibold text-brand-900">{meta.total}</span>
                      {" entries"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedPreview} onOpenChange={() => setSelectedPreview(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border border-gray-200 bg-white p-0">
          {selectedPreview && (
            <>
              <div className="bg-brand-900 px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 opacity-80" />
                    Approval Preview
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs text-brand-300">
                    Request and approval step summary.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-brand-700">Employee</div>
                  <div className="mt-1 font-semibold text-brand-900">
                    {selectedPreview.employee_name}
                  </div>
                  <div className="text-[11px] text-brand-700">
                    {selectedPreview.employee_code}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-brand-700">Module</div>
                  <div className="mt-2">
                    <Badge className={getModuleClass(selectedPreview.module_type)}>
                      {selectedPreview.module_label}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-brand-700">Request Type</div>
                  <div className="mt-1 font-medium text-brand-900">
                    {selectedPreview.request_type}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-brand-700">Approval Role</div>
                  <div className="mt-1 font-medium text-brand-900">
                    {selectedPreview.approval_role}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-brand-700">Status</div>
                  <div className="mt-2">
                    <Badge className={getStatusClass(selectedPreview.status)}>
                      {selectedPreview.status_label}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-brand-700">Due Date</div>
                  <div className="mt-1 font-medium text-brand-900">
                    {formatDateTime(selectedPreview.due_date)}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Approval Steps
                  </div>

                  <div className="space-y-3">
                    {selectedPreview.steps.map((step) => (
                      <div
                        key={step.uuid}
                        className="flex flex-col justify-between gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center"
                      >
                        <div>
                          <div className="text-sm font-semibold text-brand-900">
                            Step {step.step_number}: {step.role_label || "—"}
                          </div>
                          <div className="text-xs text-brand-700">
                            Due: {formatDateTime(step.due_at)}
                          </div>
                        </div>

                        <Badge className={getStatusClass(step.status)}>
                          {getStatusLabel(step.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPreview.approvable && (
                  <div className="mt-4 rounded-xl border border-gray-200 p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Request Details
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <div className="text-[11px] text-brand-700">Effective Date</div>
                        <div className="font-medium text-brand-900">
                          {formatDate(selectedPreview.approvable.effective_date)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-brand-700">Salary Impact</div>
                        <div className="font-medium text-brand-900">
                          {selectedPreview.approvable.salary_impact ? "Yes" : "No"}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <div className="text-[11px] text-brand-700">Reason</div>
                        <div className="font-medium text-brand-900">
                          {selectedPreview.approvable.reason || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    onClick={() => setSelectedPreview(null)}
                  >
                    Close
                  </Button>

                  <Button
                    className="bg-brand-800 text-white hover:bg-brand-900"
                    onClick={() => {
                      const uuid = selectedPreview.uuid;
                      setSelectedPreview(null);
                      router.push(`/people-hub/approvals/${uuid}`);
                    }}
                  >
                    Open Approval
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
