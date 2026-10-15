// app/people-hub/probation/page.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  Clock3,
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
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  ShieldCheck,
  FileText,
} from "lucide-react";

const DEFAULT_PER_PAGE = 10;

const PROBATION_STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Review Due", value: "review_due" },
  { label: "Extended", value: "extended" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Terminated", value: "terminated" },
] as const;

const HR_DECISION_OPTIONS = [
  { label: "All Decisions", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Extended", value: "extended" },
  { label: "Terminated", value: "terminated" },
] as const;

type ProbationStatus =
  | "active"
  | "review_due"
  | "extended"
  | "confirmed"
  | "terminated"
  | string;

type HrDecision =
  | "pending"
  | "confirmed"
  | "extended"
  | "terminated"
  | null
  | string;

type ProbationStats = {
  total: number;
  active: number;
  review_due: number;
  extended: number;
  confirmed: number;
  terminated: number;
};

type ApiProbationRecord = {
  id: string;
  employee: {
    id: string;
    name: string | null;
    employee_code: string | null;
    avatar_initials: string | null;
    manager: string | null;
  };
  timeline: {
    probation_start: string | null;
    original_end_date: string | null;
    current_end_date: string | null;
    review_scheduled_date: string | null;
  };
  review: {
    manager_recommendation: string | null;
    hr_decision: HrDecision;
    decision_date: string | null;
  };
  extensions: {
    count: number;
    days: number | null;
    reason: string | null;
  };
  manager: string | null;
  confirmation_letter_ref: string | null;
  status: ProbationStatus;
};

type ProbationRow = {
  sr: number;
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  avatar_initials: string;
  designation: string;
  department: string;
  manager: string;

  probation_start: string | null;
  original_end_date: string | null;
  current_end_date: string | null;
  review_scheduled_date: string | null;
  review_conducted_date: string | null;

  manager_recommendation: string | null;
  hr_decision: HrDecision;
  decision_date: string | null;

  extension_count: number;
  extension_days: number | null;
  extension_reason: string | null;

  confirmation_letter_id: string | null;
  termination_reason: string | null;

  status: ProbationStatus;
  raw: ApiProbationRecord;
};

type ProbationStatsResponse = {
  success: boolean;
  message: string;
  data: ProbationStats;
};

type ProbationListResponse = {
  success: boolean;
  message: string;
  data: {
    data: ApiProbationRecord[];
    links?: {
      first?: string | null;
      last?: string | null;
      prev?: string | null;
      next?: string | null;
    };
    meta: {
      current_page: number;
      from: number | null;
      last_page: number;
      path: string;
      per_page: number;
      to: number | null;
      total: number;
    };
  };
};

function getCompanyUuid() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("company_uuid") ||
    localStorage.getItem("companyUuid") ||
    "6eca7723-dee6-411b-918a-830915d8605a"
  );
}

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function getInitials(name: string, fallback?: string | null) {
  if (fallback && fallback.trim()) return fallback.trim().toUpperCase();

  if (!name || name === "—") return "EM";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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

function titleCase(value?: string | null) {
  if (!value) return "Pending";

  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusClass(status: ProbationStatus) {
  switch (status) {
    case "active":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "review_due":
      return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100";
    case "extended":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "confirmed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
    case "terminated":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
    default:
      return "bg-brand-100 text-brand-800 border-gray-200";
  }
}

function getDecisionClass(status: HrDecision) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
    case "extended":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    case "terminated":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
    case "pending":
    case null:
    default:
      return "bg-brand-100 text-brand-800 border-gray-200";
  }
}

function getDaysRemaining(date?: string | null) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(endDate.getTime())) return null;

  const diffMs = endDate.getTime() - today.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function mapProbationRecordToRow(
  item: ApiProbationRecord,
  sr: number
): ProbationRow {
  return {
    sr,
    id: item.id,
    employee_id: item.employee?.id || "",
    employee_name: item.employee?.name || "Unnamed Employee",
    employee_code: item.employee?.employee_code || "—",
    avatar_initials: item.employee?.avatar_initials || "",
    designation: "—",
    department: "—",
    manager: item.employee?.manager || item.manager || "—",

    probation_start: item.timeline?.probation_start || null,
    original_end_date: item.timeline?.original_end_date || null,
    current_end_date: item.timeline?.current_end_date || null,
    review_scheduled_date: item.timeline?.review_scheduled_date || null,
    review_conducted_date: null,

    manager_recommendation: item.review?.manager_recommendation || null,
    hr_decision: item.review?.hr_decision || "pending",
    decision_date: item.review?.decision_date || null,

    extension_count: item.extensions?.count || 0,
    extension_days: item.extensions?.days || null,
    extension_reason: item.extensions?.reason || null,

    confirmation_letter_id: item.confirmation_letter_ref || null,
    termination_reason: null,

    status: item.status || "active",
    raw: item,
  };
}

const probationService = {
  stats: async () => {
    const companyUuid = getCompanyUuid();

    const response = await api.get<ProbationStatsResponse>("/probation/stats", {
      headers: {
        Accept: "application/json",
        "X-Company-ID": companyUuid,
      },
    });

    return response.data;
  },

  list: async ({
    page,
    perPage,
    search,
    status,
  }: {
    page: number;
    perPage: number;
    search: string;
    status: string;
  }) => {
    const companyUuid = getCompanyUuid();

    const response = await api.get<ProbationListResponse>("/probation", {
      params: {
        page,
        per_page: perPage,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
      },
      headers: {
        Accept: "application/json",
        "X-Company-ID": companyUuid,
      },
    });

    return response.data;
  },
};

const Page = () => {
  const router = useRouter();

  const [stats, setStats] = useState<ProbationStats>({
    total: 0,
    active: 0,
    review_due: 0,
    extended: 0,
    confirmed: 0,
    terminated: 0,
  });

  const [rowsData, setRowsData] = useState<ProbationRow[]>([]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isFetching, setIsFetching] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");

  const [selectedRecord, setSelectedRecord] = useState<ProbationRow | null>(
    null
  );

  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showingFrom, setShowingFrom] = useState(0);
  const [showingTo, setShowingTo] = useState(0);

  const currentPage = Math.min(page, totalPages);

  const activeStatus = activeTab !== "all" ? activeTab : statusFilter;

  async function fetchStats() {
    try {
      const response = await probationService.stats();

      if (!response.success) {
        throw new Error(response.message || "Failed to load probation stats.");
      }

      setStats(response.data);
    } catch (error: any) {
      showApiError(error, { ...({
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load probation stats.",
      }), fallbackMessage: "Unable to load probation stats" });
    }
  }

  async function fetchProbationRecords() {
    try {
      setIsFetching(true);

      const response = await probationService.list({
        page,
        perPage,
        search: q,
        status: activeStatus,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to load probation records."
        );
      }

      const payload = response.data;
      const meta = payload.meta;

      setTotalEntries(meta.total || 0);
      setTotalPages(meta.last_page || 1);
      setShowingFrom(meta.from || 0);
      setShowingTo(meta.to || 0);

      setRowsData(
        (payload.data || []).map((item, index) =>
          mapProbationRecordToRow(
            item,
            (meta.current_page - 1) * meta.per_page + index + 1
          )
        )
      );
    } catch (error: any) {
      showApiError(error, { ...({
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load probation records.",
      }), fallbackMessage: "Unable to load probation records" });

      setRowsData([]);
      setTotalEntries(0);
      setTotalPages(1);
      setShowingFrom(0);
      setShowingTo(0);
    } finally {
      setIsFetching(false);
    }
  }

  React.useEffect(() => {
    fetchStats();
  }, []);

  React.useEffect(() => {
    fetchProbationRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, q, activeStatus]);

  React.useEffect(() => {
    setPage(1);
  }, [perPage, q, activeTab, statusFilter, decisionFilter]);

  const rows = useMemo(() => {
    if (decisionFilter === "all") return rowsData;

    return rowsData.filter((row) => row.hr_decision === decisionFilter);
  }, [rowsData, decisionFilter]);

  const openCreate = () => {
    router.push("/people-hub/probation/new");
  };

  const openEdit = (record: ProbationRow) => {
    router.push(`/people-hub/probation/${record.id}/edit`);
  };

  const openView = (record: ProbationRow) => {
    setSelectedRecord(record);
  };

  const handleExportCSV = () => {
    const headers = [
      "Sr",
      "Employee",
      "Employee Code",
      "Manager",
      "Probation Start",
      "Original End Date",
      "Current End Date",
      "Review Scheduled",
      "Manager Recommendation",
      "HR Decision",
      "Decision Date",
      "Extension Count",
      "Extension Days",
      "Confirmation Letter",
      "Status",
    ];

    const csvRows = rows.map((item) => [
      item.sr,
      item.employee_name,
      item.employee_code,
      item.manager,
      formatDate(item.probation_start),
      formatDate(item.original_end_date),
      formatDate(item.current_end_date),
      formatDate(item.review_scheduled_date),
      item.manager_recommendation || "Pending",
      titleCase(item.hr_decision),
      formatDate(item.decision_date),
      item.extension_count,
      item.extension_days || 0,
      item.confirmation_letter_id || "",
      titleCase(item.status),
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
    a.download = "probation_management.csv";
    a.click();
  };

  const columns: ColumnDef<ProbationRow>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "Sr.",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-brand-900">
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
            <div className="flex min-w-[240px] items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-xs font-bold text-white">
                {getInitials(e.employee_name, e.avatar_initials)}
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-brand-900">
                  {e.employee_name}
                </div>

                <div className="mt-0.5 text-[11px] text-brand-700">
                  {e.employee_code} • Manager: {e.manager}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "probation_start",
        header: "Timeline",
        cell: ({ row }) => {
          const e = row.original;
          const daysRemaining = getDaysRemaining(e.current_end_date);

          let badgeClass =
            "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100";

          let badgeLabel: React.ReactNode =
            daysRemaining === null ? "No end date" : `${daysRemaining} days left`;

          if (daysRemaining !== null && daysRemaining <= 0) {
            badgeClass =
              "bg-red-100 text-red-700 border-red-300 hover:bg-red-100";
            badgeLabel = (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> OVERDUE
              </span>
            );
          } else if (daysRemaining !== null && daysRemaining < 10) {
            badgeClass =
              "bg-red-100 text-red-700 border-red-300 hover:bg-red-100";
            badgeLabel = (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {daysRemaining} days left
              </span>
            );
          } else if (daysRemaining !== null && daysRemaining <= 30) {
            badgeClass =
              "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100";
          }

          return (
            <div className="min-w-[220px] space-y-1.5">
              <Badge className={badgeClass}>{badgeLabel}</Badge>

              <div className="text-sm font-semibold text-brand-900">
                Start: {formatDate(e.probation_start)}
              </div>

              <div className="mt-0.5 text-[12px] text-brand-800">
                Original End: {formatDate(e.original_end_date)}
              </div>

              <div className="mt-1 text-[11px] text-brand-700">
                Current End: {formatDate(e.current_end_date)}
              </div>

              <div className="text-[11px] text-brand-700">
                Review Due: {formatDate(e.review_scheduled_date)}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "manager_recommendation",
        header: "Review & Decision",
        cell: ({ row }) => {
          const e = row.original;

          return (
            <div className="min-w-[220px] space-y-2">
              <div>
                <div className="text-[11px] text-brand-700">
                  Manager Recommendation
                </div>

                <div className="text-sm font-medium text-brand-900">
                  {e.manager_recommendation || "Pending"}
                </div>
              </div>

              <div>
                <Badge className={getDecisionClass(e.hr_decision)}>
                  {titleCase(e.hr_decision)}
                </Badge>
              </div>

              <div className="text-[11px] text-brand-700">
                {e.decision_date
                  ? `Decision: ${formatDate(e.decision_date)}`
                  : "Decision pending"}
              </div>
            </div>
          );
        },
      },
    
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const e = row.original;

     

          return (
            <div className=" space-y-2">
              <Badge className={getStatusClass(e.status)}>
                {titleCase(e.status)}
              </Badge>

            
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="mx-auto">Actions</div>,
        cell: ({ row }) => {
          const e = row.original;

          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openView(e)}
                className="text-brand-800 hover:bg-brand-100 hover:text-brand-900"
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(e)}
                className="text-brand-700 hover:bg-brand-100 hover:text-brand-900"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
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
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <Card className="overflow-hidden border border-gray-200 bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] shadow-sm">
          <div className="p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Clock3 className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      Probation Management
                    </h1>

                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      PeopleHub
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-white/80">
                    Manage probation review triggers, extensions, confirmation decisions, and probation terminations.
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
                  className="gap-2 bg-white text-brand-900 hover:bg-white/90"
                  onClick={openCreate}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Probation Record
                </Button>
              </div>
            </div>
          </div>
        </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card className="border border-gray-200 shadow-sm">
  <CardContent className="p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
          Total
        </p>
        <p className="mt-2 text-3xl font-bold text-brand-900">
          {stats.total}
        </p>
      </div>
      <div className="rounded-xl bg-brand-100 p-3">
        <FileText className="h-5 w-5 text-brand-800" />
      </div>
    </div>
  </CardContent>
</Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Active
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.active}
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
                    Review Due
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.review_due}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <AlertTriangle className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Extended
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.extended}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <CalendarDays className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Confirmed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.confirmed}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <CheckCircle2 className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    Terminated
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">
                    {stats.terminated}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-100 p-3">
                  <ShieldCheck className="h-5 w-5 text-brand-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="space-y-4 border-b border-gray-200">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Probation Queue
                </CardTitle>

                <CardDescription className="mt-1 text-brand-700">
                  Track upcoming reviews, extension cases, confirmations, and probation terminations.
                </CardDescription>
              </div>

              {/* <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full xl:w-auto">
                <TabsList className="h-auto bg-brand-100 p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="review_due" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
                    Review Due
                  </TabsTrigger>
                  <TabsTrigger value="extended" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
                    Extended
                  </TabsTrigger>
                  <TabsTrigger value="confirmed" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
                    Confirmed
                  </TabsTrigger>
                  <TabsTrigger value="terminated" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
                    Terminated
                  </TabsTrigger>
                </TabsList>
              </Tabs> */}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 xl:grid-cols-[1fr_220px_140px]">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <Input
                  placeholder="Search by employee code, employee name, manager, status..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="border-gray-200 pl-10 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full border-gray-200 text-brand-800">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {PROBATION_STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                <SelectTrigger className="w-full border-gray-200 text-brand-800">
                  <SelectValue placeholder="HR Decision" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {HR_DECISION_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}

              <div className="flex items-center gap-2">
                <span className="text-sm text-brand-700">Show</span>
                <Select value={perPage.toString()} onValueChange={(value) => setPerPage(Number(value))}>
                  <SelectTrigger className="w-full border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[10, 25, 50, 100].map((number) => (
                      <SelectItem key={number} value={number.toString()}>
                        {number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-brand-700">Showing </span>
                  <span className="font-semibold text-brand-900">{showingFrom.toLocaleString()}</span>
                  <span className="text-brand-700"> to </span>
                  <span className="font-semibold text-brand-900">{showingTo.toLocaleString()}</span>
                  <span className="text-brand-700"> of </span>
                  <span className="font-semibold text-brand-900">{totalEntries.toLocaleString()}</span>
                  <span className="text-brand-700"> entries</span>
                </div>

                {isFetching ? (
                  <Badge className="gap-1 border-gray-200 bg-white text-xs text-brand-800">
                    <Loader2 className="h-3 w-3 animate-spin" /> Updating...
                  </Badge>
                ) : null}
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex items-center gap-1.5 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">{stats.review_due}</span> Review Due
                </div>
                <div className="h-3 w-px bg-brand-300" />
                <div className="flex items-center gap-1.5 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">{stats.extended}</span> Extended
                </div>
                <div className="h-3 w-px bg-brand-300" />
                <div className="flex items-center gap-1.5 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">{stats.confirmed}</span> Confirmed
                </div>
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
                            className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800 transition-colors hover:bg-brand-200"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}

                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                              ) : null}

                              {header.column.getIsSorted() === "desc" ? (
                                <ChevronLeft className="h-3.5 w-3.5" />
                              ) : null}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>

                  <tbody className="divide-y divide-brand-300/50 bg-white">
                    {isFetching ? (
                      <tr>
                        <td colSpan={columns.length} className="p-10 text-center">
                          <div className="flex items-center justify-center gap-2 text-sm text-brand-700">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading probation records...
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="p-0">
                          <EmptyState
                            icon={Clock3}
                            title="No probation records"
                            description="New joiners on probation will be tracked here."
                          />
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="group align-top transition-colors hover:bg-brand-100"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-5 py-4 align-top text-sm">
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

              {rows.length > 0 ? (
                <div className="border-t border-gray-200 px-5 py-4">
                  <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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

                      <div className="mx-1 flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, index) => {
                            let pageNumber: number;

                            if (totalPages <= 5) pageNumber = index + 1;
                            else if (currentPage <= 3) pageNumber = index + 1;
                            else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + index;
                            } else {
                              pageNumber = currentPage - 2 + index;
                            }

                            return (
                              <Button
                                key={pageNumber}
                                variant={
                                  currentPage === pageNumber
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setPage(pageNumber)}
                                disabled={isFetching}
                                className={
                                  currentPage === pageNumber
                                    ? "border-brand-800 bg-brand-800 text-white hover:bg-brand-900"
                                    : "border-gray-200 text-brand-800 hover:bg-brand-200"
                                }
                              >
                                {pageNumber}
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
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={() => setSelectedRecord(null)}
      >
        <DialogContent className="max-w-7xl! w-[80%]! overflow-hidden border border-gray-200 bg-white p-0">
          {selectedRecord ? (
            <>
              <div className="bg-brand-900 px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
                    <Clock3 className="h-4 w-4 opacity-80" />
                    Probation Record Details
                  </DialogTitle>

                  <DialogDescription className="mt-1 text-xs text-brand-300">
                    Review probation dates, recommendations, and decision flow.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-brand-700">Employee</div>
                    <div className="mt-1 font-semibold text-brand-900">
                      {selectedRecord.employee_name}
                    </div>
                    <div className="text-[11px] text-brand-700">
                      {selectedRecord.employee_code}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-brand-700">Status</div>
                    <div className="mt-2">
                      <Badge className={getStatusClass(selectedRecord.status)}>
                        {titleCase(selectedRecord.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-brand-700">HR Decision</div>
                    <div className="mt-2">
                      <Badge
                        className={getDecisionClass(
                          selectedRecord.hr_decision
                        )}
                      >
                        {titleCase(selectedRecord.hr_decision)}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-brand-700">
                      Extension Count
                    </div>
                    <div className="mt-1 font-semibold text-brand-900">
                      {selectedRecord.extension_count}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">
                        Probation Timeline
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Start Date</span>
                        <span className="font-medium text-brand-900">
                          {formatDate(selectedRecord.probation_start)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Original End</span>
                        <span className="font-medium text-brand-900">
                          {formatDate(selectedRecord.original_end_date)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Current End</span>
                        <span className="font-medium text-brand-900">
                          {formatDate(selectedRecord.current_end_date)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">
                          Review Scheduled
                        </span>
                        <span className="font-medium text-brand-900">
                          {formatDate(selectedRecord.review_scheduled_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">
                        Decision Details
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">
                          Manager Recommendation
                        </span>
                        <span className="font-medium text-brand-900">
                          {selectedRecord.manager_recommendation || "Pending"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Decision Date</span>
                        <span className="font-medium text-brand-900">
                          {formatDate(selectedRecord.decision_date)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">Extension Days</span>
                        <span className="font-medium text-brand-900">
                          {selectedRecord.extension_days || 0}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-brand-700">
                          Confirmation Letter
                        </span>
                        <span className="font-medium text-brand-900">
                          {selectedRecord.confirmation_letter_id ||
                            "Not Generated"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">
                        Extension Reason
                      </h3>
                    </div>

                    <div className="text-sm leading-6 text-brand-900">
                      {selectedRecord.extension_reason ||
                        "No extension reason added."}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">
                        Termination Reason
                      </h3>
                    </div>

                    <div className="text-sm leading-6 text-brand-900">
                      {selectedRecord.termination_reason ||
                        "No termination reason added."}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    onClick={() => setSelectedRecord(null)}
                  >
                    Close
                  </Button>

                  <Button
                    className="bg-brand-800 text-white hover:bg-brand-900"
                    onClick={() => {
                      setSelectedRecord(null);
                      router.push(
                        `/people-hub/probation/${selectedRecord.id}/edit`
                      );
                    }}
                  >
                    Edit Probation Record
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;