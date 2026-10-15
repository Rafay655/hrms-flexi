"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LogOut,
  SearchIcon,
  DownloadIcon,
  PlusIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  FileCheck,
  Wallet,
  CheckCircle2,
  Clock3,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_PER_PAGE = 15;

const EXIT_TYPES = [
  "Resignation",
  "Termination",
  "Retirement",
  "Contract-End",
  "Death",
  "Absconding",
] as const;

const EXIT_INITIATED_BY = ["Employee", "Manager", "HR", "System"] as const;

const EXIT_REASONS = [
  "Better Opportunity",
  "Personal",
  "Health",
  "Performance",
  "Misconduct",
  "Restructuring",
  "Other",
] as const;

const CLEARANCE_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Waived",
] as const;

const FNF_STATUSES = [
  "Pending",
  "Calculated",
  "Approved",
  "Paid",
  "Disputed",
] as const;

const PROCESS_STAGES = [
  "Initiated",
  "Notice Period",
  "Clearance",
  "FnF",
  "Completed",
] as const;

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ExitType = (typeof EXIT_TYPES)[number];
type ExitInitiatedBy = (typeof EXIT_INITIATED_BY)[number];
type ExitReason = (typeof EXIT_REASONS)[number];
type ClearanceStatus = (typeof CLEARANCE_STATUSES)[number];
type FnFStatus = (typeof FNF_STATUSES)[number];
type ProcessStage = (typeof PROCESS_STAGES)[number];

type ApiExitStats = {
  total: number;
  initiated: number;
  notice_period: number;
  clearance_in_progress: number;
  completed: number;
  by_type?: Record<string, number>;
};

type ApiEmployee = {
  id: string;
  employee_code: string;
  name: string;
  email: string;
};

type ApiCreatedBy = {
  id: number;
  name: string;
};

type ApiExitItem = {
  id: string;
  exit_type: string;
  initiated_by: string;
  status: string;
  status_label: string;

  employee: ApiEmployee | null;

  resignation_date: string | null;
  notice_period_days: number;
  notice_period_waived: boolean;
  notice_waiver_reason: string | null;
  last_working_date: string | null;

  exit_reason: string | null;
  exit_reason_detail: string | null;

  exit_interview_scheduled: boolean;
  exit_interview_date: string | null;

  clearance_percentage: number;
  clearance_completed_at: string | null;

  blacklisted: boolean;
  blacklist_reason: string | null;
  rehire_eligible: boolean;

  created_by: ApiCreatedBy | null;
  created_at: string;
  updated_at: string;
};

type ApiPagination = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

type ExitListResponse = {
  success: boolean;
  message: string;
  data: {
    items: ApiExitItem[];
    pagination: ApiPagination;
  };
};

type ExitStatsResponse = {
  success: boolean;
  message: string;
  data: ApiExitStats;
};

type ExitRow = {
  sr: number;
  id: string;

  employee_id: string;
  employee_name: string;
  employee_code: string;
  employee_email: string;

  designation: string;
  department: string;
  manager: string;

  exit_type: ExitType;
  exit_initiated_by: ExitInitiatedBy;
  exit_reason_primary: ExitReason;
  exit_reason_detail: string;

  resignation_date: string | null;
  last_working_date: string | null;
  notice_period_days: number;
  notice_period_waived: boolean;
  notice_waiver_reason: string | null;

  status: string;
  status_label: string;
  process_stage: ProcessStage;

  clearance_status: ClearanceStatus;
  clearance_progress: number;
  clearance_completed_at: string | null;

  fnf_status: FnFStatus;
  fnf_progress: number;

  rehire_eligible: boolean;
  blacklist_flag: boolean;
  blacklist_reason: string | null;
  experience_letter_issued: boolean;

  exit_interview_scheduled: boolean;
  exit_interview_date: string | null;

  created_by_name: string;
  created_at: string;
  updated_at: string;
};

type RawExitRow = Omit<ExitRow, "sr">;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function useDebounced<T>(value: T, delay = 450) {
  const [d, setD] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return d;
}

function getInitials(name: string) {
  if (!name || name === "-") return "NA";

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toTitleCase(value?: string | null) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
    });
}

function mapApiStatusToStage(status?: string | null): ProcessStage {
  switch (status) {
    case "initiated":
      return "Initiated";
    case "notice_period":
      return "Notice Period";
    case "clearance_in_progress":
      return "Clearance";
    case "completed":
      return "Completed";
    default:
      return "Initiated";
  }
}

function mapApiExitType(type?: string | null): ExitType {
  const normalized = toTitleCase(type);

  if (normalized === "Contract End") return "Contract-End";

  if (
    normalized === "Resignation" ||
    normalized === "Termination" ||
    normalized === "Retirement" ||
    normalized === "Death" ||
    normalized === "Absconding"
  ) {
    return normalized as ExitType;
  }

  return "Resignation";
}

function mapApiInitiatedBy(value?: string | null): ExitInitiatedBy {
  const normalized = toTitleCase(value);

  if (
    normalized === "Employee" ||
    normalized === "Manager" ||
    normalized === "HR" ||
    normalized === "System"
  ) {
    return normalized as ExitInitiatedBy;
  }

  return "HR";
}

function mapApiReason(value?: string | null): ExitReason {
  const normalized = toTitleCase(value);

  if (
    normalized === "Better Opportunity" ||
    normalized === "Personal" ||
    normalized === "Health" ||
    normalized === "Performance" ||
    normalized === "Misconduct" ||
    normalized === "Restructuring" ||
    normalized === "Other"
  ) {
    return normalized as ExitReason;
  }

  return "Other";
}

function mapApiExitToRow(item: ApiExitItem): RawExitRow {
  const clearanceProgress = Number(item.clearance_percentage || 0);
  const processStage = mapApiStatusToStage(item.status);

  let clearanceStatus: ClearanceStatus = "Not Started";

  if (clearanceProgress >= 100) {
    clearanceStatus = "Completed";
  } else if (clearanceProgress > 0) {
    clearanceStatus = "In Progress";
  }

  return {
    id: item.id,

    employee_id: item.employee?.id || "",
    employee_name: item.employee?.name || "-",
    employee_code: item.employee?.employee_code || "-",
    employee_email: item.employee?.email || "-",

    designation: "-",
    department: "-",
    manager: "-",

    exit_type: mapApiExitType(item.exit_type),
    exit_initiated_by: mapApiInitiatedBy(item.initiated_by),
    exit_reason_primary: mapApiReason(item.exit_reason),
    exit_reason_detail: item.exit_reason_detail || "-",

    resignation_date: item.resignation_date,
    last_working_date: item.last_working_date,
    notice_period_days: item.notice_period_days || 0,
    notice_period_waived: Boolean(item.notice_period_waived),
    notice_waiver_reason: item.notice_waiver_reason,

    status: item.status,
    status_label: item.status_label || toTitleCase(item.status),
    process_stage: processStage,

    clearance_status: clearanceStatus,
    clearance_progress: clearanceProgress,
    clearance_completed_at: item.clearance_completed_at,

    fnf_status: item.status === "completed" ? "Paid" : "Pending",
    fnf_progress: item.status === "completed" ? 100 : 0,

    rehire_eligible: Boolean(item.rehire_eligible),
    blacklist_flag: Boolean(item.blacklisted),
    blacklist_reason: item.blacklist_reason,
    experience_letter_issued: false,

    exit_interview_scheduled: Boolean(item.exit_interview_scheduled),
    exit_interview_date: item.exit_interview_date,

    created_by_name: item.created_by?.name || "-",
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function getExitTypeClass(type: ExitType) {
  switch (type) {
    case "Resignation":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Termination":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    case "Retirement":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Contract-End":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Death":
      return "bg-brand-900 text-white border-transparent hover:bg-brand-900";
    case "Absconding":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getClearanceClass(status: ClearanceStatus) {
  switch (status) {
    case "Not Started":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "In Progress":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Completed":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Waived":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getFnFClass(status: FnFStatus) {
  switch (status) {
    case "Pending":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Calculated":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Approved":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Paid":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "Disputed":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getStageClass(stage: ProcessStage) {
  switch (stage) {
    case "Initiated":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Notice Period":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "Clearance":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "FnF":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "Completed":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

/** Returns true if the given ISO date string is within the last 24 hours */
function isWithin24Hours(createdAt: string | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const now = new Date();
  const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 24;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const Page = () => {
  const router = useRouter();

  const [exits, setExits] = useState<RawExitRow[]>([]);
  const [stats, setStats] = useState<ApiExitStats>({
    total: 0,
    initiated: 0,
    notice_period: 0,
    clearance_in_progress: 0,
    completed: 0,
    by_type: {},
  });

  const [pagination, setPagination] = useState<ApiPagination>({
    total: 0,
    per_page: DEFAULT_PER_PAGE,
    current_page: 1,
    last_page: 1,
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 450);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [exitTypeFilter, setExitTypeFilter] = useState<string>("all");

  const [selectedExit, setSelectedExit] = useState<ExitRow | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const getApiStatus = useCallback(() => {
    if (activeTab === "all") return undefined;
    if (activeTab === "initiated") return "initiated";
    if (activeTab === "notice") return "notice_period";
    if (activeTab === "clearance") return "clearance_in_progress";
    if (activeTab === "completed") return "completed";

    return undefined;
  }, [activeTab]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<ExitStatsResponse>("people-hub/exits/stats");
      setStats(res.data.data);
    } catch (error) {
      console.error(error);
      showApiError(error, { fallbackMessage: "Failed to load exit stats" });
    }
  }, []);

  const fetchExits = useCallback(async () => {
    setIsFetching(true);

    try {
      const params: Record<string, string | number> = {
        page,
        per_page: perPage,
      };

      const status = getApiStatus();

      if (status) params.status = status;
      if (q.trim()) params.search = q.trim();

      if (exitTypeFilter !== "all") {
        params.exit_type = exitTypeFilter.toLowerCase().replace("contract-end", "contract_end");
      }

      const res = await api.get<ExitListResponse>("people-hub/exits", {
        params,
      });

      setExits(res.data.data.items.map(mapApiExitToRow));
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error(error);
      showApiError(error, { fallbackMessage: "Failed to load exit cases" });
    } finally {
      setIsFetching(false);
    }
  }, [page, perPage, q, getApiStatus, exitTypeFilter]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  React.useEffect(() => {
    fetchExits();
  }, [fetchExits]);

  React.useEffect(() => {
    setPage(1);
  }, [perPage, q, activeTab, exitTypeFilter]);

  const totalEntries = pagination.total || 0;
  const totalPages = Math.max(1, pagination.last_page || 1);
  const currentPage = pagination.current_page || page;

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const rows: ExitRow[] = useMemo(() => {
    const start = (currentPage - 1) * perPage;

    return exits.map((exit, idx) => ({
      sr: start + idx + 1,
      ...exit,
    }));
  }, [exits, currentPage, perPage]);

  const totalExits = stats.total || 0;
  const initiatedCount = stats.initiated || 0;
  const noticeCount = stats.notice_period || 0;
  const clearanceCount = stats.clearance_in_progress || 0;
  const fnfCount = 0;
  const completedCount = stats.completed || 0;

  const openCreate = () => {
    router.push("/people-hub/exits/new");
  };

  const openEdit = (item: ExitRow) => {
    router.push(`/people-hub/exits/${item.id}/edit`);
  };

  const openView = (item: ExitRow) => {
    setSelectedExit(item);
  };

  const confirmCancel = async () => {
    if (!cancelId) return;

    try {
      // Use POST to the /cancel endpoint (adjust method if needed)
      await api.post(`people-hub/exits/${cancelId}/cancel`);

      toast.success("Exit cancelled", {
        description: "The employee exit case has been cancelled.",
      });

      setCancelId(null);
      fetchStats();
      fetchExits();
    } catch (error: any) {
      console.error(error);
      showApiError(error, { ...({
        description: error?.response?.data?.message || "Please try again.",
      }), fallbackMessage: "Failed to cancel exit case" });
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Employee",
      "Employee Code",
      "Email",
      "Exit Type",
      "Initiated By",
      "Reason",
      "Reason Detail",
      "Resignation Date",
      "Last Working Date",
      "Notice Period",
      "Notice Waived",
      "Status",
      "Clearance Status",
      "Clearance %",
      "FnF Status",
      "Rehire Eligible",
      "Blacklist",
      "Blacklist Reason",
      "Created By",
      "Created At",
    ];

    const csvRows = rows.map((item) => [
      item.sr,
      item.employee_name,
      item.employee_code,
      item.employee_email,
      item.exit_type,
      item.exit_initiated_by,
      item.exit_reason_primary,
      item.exit_reason_detail,
      formatDate(item.resignation_date),
      formatDate(item.last_working_date),
      item.notice_period_days,
      item.notice_period_waived ? "Yes" : "No",
      item.status_label,
      item.clearance_status,
      item.clearance_progress,
      item.fnf_status,
      item.rehire_eligible ? "Yes" : "No",
      item.blacklist_flag ? "Yes" : "No",
      item.blacklist_reason || "-",
      item.created_by_name,
      formatDate(item.created_at),
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    a.download = "employee_exit_management.csv";
    a.click();
  };

  const columns: ColumnDef<ExitRow>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "Sr.",
        cell: ({ row }) => (
          <span className="font-medium text-brand-900 text-sm">
            {row.original.sr}
          </span>
        ),
      },
      {
        accessorKey: "employee_name",
        header: "Employee",
        cell: ({ row }) => {
          const e = row.original;

          return (
            <div className="flex items-start gap-3 min-w-[250px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white text-xs font-bold flex-shrink-0">
                {getInitials(e.employee_name)}
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-brand-900 text-sm">
                  {e.employee_name}
                </div>

                <div className="text-[11px] text-brand-700 mt-0.5">
                  {e.employee_code}
                </div>

                <div className="text-[11px] text-brand-700 mt-0.5 truncate max-w-[190px]">
                  {e.employee_email}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "exit_type",
        header: "Exit Details",
        cell: ({ row }) => {
          const e = row.original;

          return (
            <div className="min-w-[240px]">
              <div className="flex flex-wrap gap-2">
                <Badge className={getExitTypeClass(e.exit_type)}>
                  {e.exit_type}
                </Badge>

                <Badge className={getStageClass(e.process_stage)}>
                  {e.status_label}
                </Badge>
              </div>

              <div className="mt-2 text-sm font-medium text-brand-900">
                {e.exit_reason_primary}
              </div>

              <div className="text-[11px] text-brand-700 mt-1 line-clamp-2">
                {e.exit_reason_detail}
              </div>

              <div className="text-[11px] text-brand-700 mt-1">
                Initiated by {e.exit_initiated_by}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "last_working_date",
        header: "Notice / Dates",
        cell: ({ row }) => {
          const e = row.original;

          return (
            <div className="min-w-[210px]">
              <div className="text-sm font-semibold text-brand-900">
                LWD: {formatDate(e.last_working_date)}
              </div>

              <div className="text-[12px] text-brand-800 mt-1">
                Resignation: {formatDate(e.resignation_date)}
              </div>

              <div className="text-[11px] text-brand-700 mt-1">
                Notice: {e.notice_period_days} day(s)
              </div>

              {e.notice_period_waived ? (
                <Badge className="mt-2 bg-brand-100 text-brand-800 border-gray-200 hover:bg-brand-100">
                  Notice Waived
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="mx-auto">Actions</div>,
        cell: ({ row }) => {
          const e = row.original;

          const canProcessFnF =
            e.clearance_status === "Completed" && e.fnf_status === "Pending";

          return (
            <div className="flex items-center justify-center gap-1">
              {canProcessFnF && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/pay-edge/final-settlement?emp=${
                        e.employee_code
                      }&name=${encodeURIComponent(e.employee_name)}`
                    )
                  }
                  className="text-brand-900 hover:text-white hover:bg-brand-800 border border-brand-300 gap-1 text-xs"
                  title="Process Final Settlement in Pay Edge"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Process F&F
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openView(e)}
                className="text-brand-800 hover:text-brand-900 hover:bg-brand-100"
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(e)}
                className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              {/* Cancel button – visible only if within 24 hours */}
              {isWithin24Hours(e.created_at) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelId(e.id)}
                  className="text-brand-600 hover:text-brand-900 hover:bg-brand-100"
                  title="Cancel Exit"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <div className="p-3 bg-white min-h-screen">
      <div className="space-y-4">
        <Card className="bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <LogOut className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      Exit Management
                    </h1>

                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      People hub
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-white/80">
                    Manage resignations, terminations, retirement, clearance
                    flow, and full & final settlement tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={handleExportCSV}
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export CSV
                </Button>

                <Button
                  className="bg-white text-brand-900 hover:bg-white/90 gap-2"
                  onClick={openCreate}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Exit Case
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Total Cases
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {totalExits}
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
                  <p className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Initiated
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {initiatedCount}
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
                  <p className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Clearance
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {clearanceCount}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <FileCheck className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    FnF In Process
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {fnfCount}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <Wallet className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-brand-700 font-medium">
                    Completed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {completedCount}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <CheckCircle2 className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Exit Cases Queue
                </CardTitle>
                <CardDescription className="text-brand-700 mt-1">
                  Review and track all employee exits from initiation to final
                  settlement.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1fr_220px_140px]">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />

                <Input
                  placeholder="Search by employee, code, email, exit type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900"
                />
              </div>

              <Select value={exitTypeFilter} onValueChange={setExitTypeFilter}>
                <SelectTrigger className="border-gray-200 text-brand-800 w-full">
                  <SelectValue placeholder="Exit Type" />
                </SelectTrigger>

                <SelectContent className="bg-white">
                  <SelectItem value="all">All Exit Types</SelectItem>
                  {EXIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-brand-700">Show</span>

                <Select
                  value={perPage.toString()}
                  onValueChange={(v) => setPerPage(Number(v))}
                >
                  <SelectTrigger className="w-full border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-white">
                    {[15, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">
                    {showingFrom.toLocaleString()}
                  </span>
                  <span className="text-brand-700"> to </span>
                  <span className="font-semibold text-brand-900">
                    {showingTo.toLocaleString()}
                  </span>
                  <span className="text-brand-700"> of </span>
                  <span className="font-semibold text-brand-900">
                    {totalEntries.toLocaleString()}
                  </span>
                  <span className="text-brand-700"> entries</span>
                </div>

                {isFetching && (
                  <Badge className="gap-1 border-gray-200 bg-white text-brand-800 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" /> Updating...
                  </Badge>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {initiatedCount}
                  </span>{" "}
                  Initiated
                </div>

                <div className="h-3 w-px bg-brand-300" />

                <div className="flex items-center gap-1.5 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {noticeCount}
                  </span>{" "}
                  Notice
                </div>

                <div className="h-3 w-px bg-brand-300" />

                <div className="flex items-center gap-1.5 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {clearanceCount}
                  </span>{" "}
                  Clearance
                </div>

                <div className="h-3 w-px bg-brand-300" />

                <div className="flex items-center gap-1.5 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {completedCount}
                  </span>{" "}
                  Completed
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider cursor-pointer hover:bg-brand-200 transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}

                              {header.column.getIsSorted() === "asc" && (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}

                              {header.column.getIsSorted() === "desc" && (
                                <ChevronLeft className="h-3.5 w-3.5" />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>

                  <tbody className="bg-white divide-y divide-brand-300/50">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="p-0">
                          <EmptyState
                            icon={LogOut}
                            title={
                              isFetching ? "Loading exits..." : "No active exits"
                            }
                            description={
                              isFetching
                                ? "Please wait while exit cases are being loaded."
                                : "Exit cases will appear here when employees resign or are terminated."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-brand-100 transition-colors group align-top"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="py-4 px-5 text-sm align-top"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
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
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-brand-700">
                      Page{" "}
                      <span className="font-semibold text-brand-900">
                        {currentPage}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-brand-900">
                        {totalPages}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={currentPage === 1 || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-200"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center space-x-1 mx-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let p: number;

                            if (totalPages <= 5) p = i + 1;
                            else if (currentPage <= 3) p = i + 1;
                            else if (currentPage >= totalPages - 2)
                              p = totalPages - 4 + i;
                            else p = currentPage - 2 + i;

                            return (
                              <Button
                                key={p}
                                variant={
                                  currentPage === p ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setPage(p)}
                                disabled={isFetching}
                                className={
                                  currentPage === p
                                    ? "bg-brand-800 hover:bg-brand-900 border-brand-800 text-white"
                                    : "border-gray-200 text-brand-800 hover:bg-brand-200"
                                }
                              >
                                {p}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        disabled={currentPage === totalPages || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-200"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm text-brand-700">
                      <span className="font-semibold text-brand-900">
                        {showingFrom.toLocaleString()}
                      </span>
                      {" – "}
                      <span className="font-semibold text-brand-900">
                        {showingTo.toLocaleString()}
                      </span>
                      {" of "}
                      <span className="font-semibold text-brand-900">
                        {totalEntries.toLocaleString()}
                      </span>
                      {" entries"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedExit} onOpenChange={() => setSelectedExit(null)}>
        <DialogContent className="max-w-7xl! w-[80%]! border border-gray-200 bg-white p-0 overflow-hidden">
          {selectedExit && (
            <>
              <div className="bg-brand-900 px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                    <LogOut className="h-4 w-4 opacity-80" />
                    Exit Case Details
                  </DialogTitle>

                  <DialogDescription className="text-brand-300 text-xs mt-1">
                    Review full details of the selected employee exit case.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-brand-700">Employee</div>
                    <div className="mt-1 font-semibold text-brand-900">
                      {selectedExit.employee_name}
                    </div>
                    <div className="text-[11px] text-brand-700">
                      {selectedExit.employee_code}
                    </div>
                    <div className="text-[11px] text-brand-700">
                      {selectedExit.employee_email}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-brand-700">Exit Type</div>
                    <div className="mt-2">
                      <Badge className={getExitTypeClass(selectedExit.exit_type)}>
                        {selectedExit.exit_type}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-brand-700">Status</div>
                    <div className="mt-2">
                      <Badge className={getStageClass(selectedExit.process_stage)}>
                        {selectedExit.status_label}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-brand-700">
                      Last Working Date
                    </div>
                    <div className="mt-1 font-semibold text-brand-900">
                      {formatDate(selectedExit.last_working_date)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">
                        Employee Information
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Employee Code</span>
                        <span className="font-medium text-brand-900">
                          {selectedExit.employee_code}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Email</span>
                        <span className="font-medium text-brand-900">
                          {selectedExit.employee_email}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Initiated By</span>
                        <span className="font-medium text-brand-900">
                          {selectedExit.exit_initiated_by}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Created By</span>
                        <span className="font-medium text-brand-900">
                          {selectedExit.created_by_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarDays className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">
                        Exit Details
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Reason</span>
                        <span className="font-medium text-brand-900">
                          {selectedExit.exit_reason_primary}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Resignation Date</span>
                        <span className="font-medium text-brand-900">
                          {formatDate(selectedExit.resignation_date)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Notice Period</span>
                        <span className="font-medium text-brand-900">
                          {selectedExit.notice_period_days} days
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Notice Waived</span>
                        <span className="font-medium text-brand-900">
                          {selectedExit.notice_period_waived ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    {selectedExit.notice_waiver_reason ? (
                      <div className="mt-4 rounded-lg bg-brand-100 p-3 text-xs text-brand-800">
                        {selectedExit.notice_waiver_reason}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <LogOut className="h-4 w-4 text-brand-800" />
                    <h3 className="font-semibold text-brand-900">
                      Exit Reason Detail
                    </h3>
                  </div>

                  <p className="text-sm text-brand-700">
                    {selectedExit.exit_reason_detail}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">
                        Clearance Progress
                      </h3>
                    </div>

                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-brand-700">
                        {selectedExit.clearance_status}
                      </span>
                      <span className="font-semibold text-brand-900">
                        {selectedExit.clearance_progress}%
                      </span>
                    </div>

                    <Progress
                      value={selectedExit.clearance_progress}
                      className="h-2"
                    />

                    <div className="mt-3 text-xs text-brand-700">
                      Clearance completed at:{" "}
                      {formatDate(selectedExit.clearance_completed_at)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Wallet className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">
                        FnF Progress
                      </h3>
                    </div>

                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-brand-700">
                        {selectedExit.fnf_status}
                      </span>
                      <span className="font-semibold text-brand-900">
                        {selectedExit.fnf_progress}%
                      </span>
                    </div>

                    <Progress value={selectedExit.fnf_progress} className="h-2" />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="bg-brand-100 text-brand-800 border-gray-200 hover:bg-brand-100">
                        {selectedExit.rehire_eligible
                          ? "Rehire Eligible"
                          : "Rehire Blocked"}
                      </Badge>

                      {selectedExit.blacklist_flag ? (
                        <Badge className="bg-brand-600 text-white border-transparent hover:bg-brand-600">
                          Blacklisted
                        </Badge>
                      ) : (
                        <Badge className="bg-brand-100 text-brand-800 border-gray-200 hover:bg-brand-100">
                          Not Blacklisted
                        </Badge>
                      )}
                    </div>

                    {selectedExit.blacklist_reason ? (
                      <div className="mt-3 rounded-lg bg-brand-100 p-3 text-xs text-brand-800">
                        {selectedExit.blacklist_reason}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-brand-300 bg-gradient-to-r from-brand-100/60 to-white p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-brand-800 p-2.5">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-brand-900">
                          Final Settlement
                        </h3>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-brand-700">Status:</span>
                          <Badge className={getFnFClass(selectedExit.fnf_status)}>
                            {selectedExit.fnf_status}
                          </Badge>
                        </div>

                        <p className="mt-1.5 text-xs text-brand-700">
                          Full &amp; Final calculation, approvals, and payout are
                          handled in Pay Edge.
                        </p>
                      </div>
                    </div>

                    {selectedExit.fnf_status !== "Paid" && (
                      <Button
                        className="bg-brand-800 text-white hover:bg-brand-900 gap-2 shrink-0"
                        onClick={() =>
                          router.push(
                            `/pay-edge/final-settlement?emp=${
                              selectedExit.employee_code
                            }&name=${encodeURIComponent(
                              selectedExit.employee_name
                            )}`
                          )
                        }
                      >
                        Process in Pay Edge
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    onClick={() => setSelectedExit(null)}
                  >
                    Close
                  </Button>

                  <Button
                    className="bg-brand-800 text-white hover:bg-brand-900"
                    onClick={() => {
                      setSelectedExit(null);
                      router.push(`/people-hub/exits/${selectedExit.id}/edit`);
                    }}
                  >
                    Edit Exit Case
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={cancelId !== null}
        onOpenChange={() => setCancelId(null)}
      >
        <AlertDialogContent className="border border-gray-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-900">
              Cancel Exit Case?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-brand-700">
              This action will mark the exit as cancelled. The employee’s record will
              remain, but the exit process will be stopped. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-brand-800 hover:bg-brand-100">
              Keep
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-brand-600 text-white hover:bg-brand-900"
            >
              Cancel Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;