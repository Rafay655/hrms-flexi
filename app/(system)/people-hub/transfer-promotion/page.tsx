"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { api } from "@/lib/api";

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
  GitBranch,
  ArrowRightLeft,
  TrendingUp,
  SearchIcon,
  PlusIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Briefcase,
  Target,
  UserRound,
} from "lucide-react";

const DEFAULT_PER_PAGE = 15;

const TYPE_FILTERS = {
  all: "",
  promotions: "promotions",
  transfers: "transfers",
} as const;

const PER_PAGE_OPTIONS = [10, 15, 25, 50];

type CareerEventStatus = "pending" | "approved" | "rejected" | "cancelled" | string;
type CareerEventType = "promotion" | "transfer" | "redesignation" | string;

type CareerEventEmployee = {
  id: string;
  employee_code: string;
  name: string;
  avatar: string | null;
  manager: string | null;
};

type AssignmentValue = {
  id: number | string;
  name?: string;
  title?: string;
} | null;

type CareerEventApproval = {
  id: string;
  step_number: number;
  role_label: string;
  status: string;
  notes: string | null;
  decided_at: string | null;
  approver: {
    id: string | number;
    name: string;
  } | null;
};

type CareerEventItem = {
  id: string;
  event_type: CareerEventType;
  event_type_label: string;
  effective_date: string;
  salary_impact: boolean;
  reason: string | null;
  status: CareerEventStatus;
  employee: CareerEventEmployee | null;
  current_assignment: {
    designation: AssignmentValue;
    department: AssignmentValue;
    branch: AssignmentValue;
    grade: AssignmentValue;
  } | null;
  new_assignment: {
    designation: AssignmentValue;
    department: AssignmentValue;
    branch: AssignmentValue;
    grade: AssignmentValue;
    reporting_manager?: AssignmentValue;
  } | null;
  approval_progress: {
    total: number;
    completed: number;
    label: string;
  };
  approvals: CareerEventApproval[];
  previous_values: Record<string, string | number | null> | null;
  new_values: Record<string, string | number | null> | null;
  supporting_documents: string | null;
  created_by: {
    id: number | string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
};

type CareerEventsResponse = {
  success: boolean;
  message: string;
  data: {
    items: CareerEventItem[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  };
};

type CareerEventRow = CareerEventItem & {
  sr: number;
};

function useDebounced<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function getCompanyUuid() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("company_uuid") ||
    localStorage.getItem("companyUuid") ||
    ""
  );
}

function getInitials(name?: string | null) {
  if (!name) return "NA";
  return name
    .split(" ")
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

function getAssignmentLabel(value: AssignmentValue | undefined) {
  if (!value) return "—";
  return value.title || value.name || "—";
}

function getStatusLabel(status?: string | null) {
  if (!status) return "—";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "pending":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "approved":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "rejected":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    case "cancelled":
      return "bg-brand-500 text-white border-transparent hover:bg-brand-500";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

function getEventTypeClass(type?: string | null) {
  switch (type) {
    case "promotion":
      return "bg-brand-800 text-white border-transparent hover:bg-brand-800";
    case "transfer":
    case "department_transfer":
    case "branch_transfer":
      return "bg-brand-700 text-white border-transparent hover:bg-brand-700";
    case "redesignation":
      return "bg-brand-600 text-white border-transparent hover:bg-brand-600";
    default:
      return "bg-brand-700 text-white border-transparent";
  }
}

const careerEventsService = {
  list: async ({
    page,
    perPage,
    search,
    type,
  }: {
    page: number;
    perPage: number;
    search: string;
    type: string;
  }) => {
    const companyUuid = getCompanyUuid();
    const response = await api.get<CareerEventsResponse>("/career-events", {
      params: {
        per_page: perPage,
        page,
        search: search || undefined,
        type: type || undefined,
      },
      headers: {
        Accept: "application/json",
        ...(companyUuid ? { "X-Company-ID": companyUuid } : {}),
      },
    });
    return response.data;
  },
};

// Explicit column widths so table-fixed distributes space correctly
const COL_WIDTHS = {
  sr: "w-[52px]",
  employee: "w-[220px]",
  event: "w-[150px]",
  date: "w-[110px]",
  approval: "w-[160px]",
  status: "w-[110px]",
  actions: "w-[72px]",
};

const CareerEventsPage = () => {
  const router = useRouter();

  const [events, setEvents] = useState<CareerEventItem[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [typeFilter, setTypeFilter] = useState<keyof typeof TYPE_FILTERS>("all");
  const [isFetching, setIsFetching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CareerEventRow | null>(null);

  const [pagination, setPagination] = useState({
    total: 0,
    per_page: DEFAULT_PER_PAGE,
    current_page: 1,
    last_page: 1,
  });

  React.useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, typeFilter]);

  React.useEffect(() => {
    let ignore = false;

    async function fetchCareerEvents() {
      try {
        setIsFetching(true);
        const response = await careerEventsService.list({
          page,
          perPage,
          search: debouncedSearch,
          type: TYPE_FILTERS[typeFilter],
        });

        if (!response.success) {
          throw new Error(response.message || "Failed to load career events.");
        }

        if (ignore) return;

        setEvents(response.data.items || []);
        setPagination(
          response.data.pagination || {
            total: 0,
            per_page: perPage,
            current_page: page,
            last_page: 1,
          }
        );
      } catch (error: any) {
        if (ignore) return;
        showApiError(error, { ...({
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Something went wrong while fetching career events.",
        }), fallbackMessage: "Unable to load career events" });
        setEvents([]);
        setPagination({
          total: 0,
          per_page: perPage,
          current_page: page,
          last_page: 1,
        });
      } finally {
        if (!ignore) setIsFetching(false);
      }
    }

    fetchCareerEvents();
    return () => { ignore = true; };
  }, [page, perPage, debouncedSearch, typeFilter]);

  const rows: CareerEventRow[] = useMemo(() => {
    const start = (pagination.current_page - 1) * pagination.per_page;
    return events.map((event, index) => ({
      ...event,
      sr: start + index + 1,
    }));
  }, [events, pagination.current_page, pagination.per_page]);

  const totalPages = Math.max(1, pagination.last_page || 1);
  const currentPage = Math.min(page, totalPages);
  const totalEntries = pagination.total || 0;
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const pageStats = useMemo(() => ({
    total: totalEntries,
    pending: rows.filter((item) => item.status === "pending").length,
    promotions: rows.filter((item) => item.event_type === "promotion").length,
    transfers: rows.filter((item) =>
      ["transfer", "department_transfer", "branch_transfer"].includes(item.event_type)
    ).length,
  }), [rows, totalEntries]);

  const openCreate = () => router.push("/people-hub/transfer-promotion/new");
  const openView = (event: CareerEventRow) => setSelectedEvent(event);

  const columns: ColumnDef<CareerEventRow>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "Sr.",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-brand-900">
            {row.original.sr}
          </span>
        ),
      },
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => {
          const employee = row.original.employee;
          return (
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-[11px] font-bold text-white">
                {getInitials(employee?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-brand-900">
                  {employee?.name || "—"}
                </div>
                <div className="truncate text-[11px] text-brand-700">
                  {employee?.employee_code || "—"}
                </div>
                {employee?.manager && (
                  <div className="truncate text-[11px] text-brand-700">
                    Manager: {employee.manager}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "event_type",
        header: "Event",
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div className="space-y-1.5">
              <Badge className={getEventTypeClass(event.event_type)}>
                {event.event_type_label || getStatusLabel(event.event_type)}
              </Badge>
              <div className="text-[11px] text-brand-700">
                {event.salary_impact ? "Salary impact" : "No salary impact"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "effective_date",
        header: "Date",
        cell: ({ row }) => (
          <div className="text-sm font-medium text-brand-900 whitespace-nowrap">
            {formatDate(row.original.effective_date)}
          </div>
        ),
      },
      {
        accessorKey: "approval_progress",
        header: "Approval",
        cell: ({ row }) => {
          const event = row.original;
          const total = event.approval_progress?.total || 0;
          const completed = event.approval_progress?.completed || 0;
          const percentage = total > 0 ? (completed / total) * 100 : 0;
          return (
            <div className="w-full">
              <div className="mb-1.5 flex items-center justify-between gap-1 text-xs">
                <span className="text-brand-700">Progress</span>
                <span className="font-semibold text-brand-900 tabular-nums">
                  {event.approval_progress?.label || `${completed}/${total}`}
                </span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={getStatusClass(row.original.status)}>
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="block text-center">Action</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openView(row.original)}
              className="h-8 w-8 p-0 text-brand-800 hover:bg-brand-100 hover:text-brand-900"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  // Column width map for colgroup
  const colWidthStyles = [
    "52px",   // sr
    "220px",  // employee
    "150px",  // event
    "110px",  // date
    "160px",  // approval
    "110px",  // status
    "72px",   // actions
  ];

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">

        {/* ── Hero header ── */}
        <Card className="overflow-hidden border border-gray-200 bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] shadow-sm">
          <div className="p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <GitBranch className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      Transfers & Promotions
                    </h1>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      PeopleHub
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-white/80">
                    Track promotion and transfer requests with approval progress.
                  </p>
                </div>
              </div>

              <Button
                className="w-fit gap-2 bg-white text-brand-900 hover:bg-white/90"
                onClick={openCreate}
              >
                <PlusIcon className="h-4 w-4" />
                Add Event
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { label: "Total Events", value: pageStats.total, icon: <GitBranch className="h-5 w-5 text-brand-800" /> },
            { label: "Pending On Page", value: pageStats.pending, icon: <Clock3 className="h-5 w-5 text-brand-800" /> },
            { label: "Promotions On Page", value: pageStats.promotions, icon: <TrendingUp className="h-5 w-5 text-brand-800" /> },
            { label: "Transfers On Page", value: pageStats.transfers, icon: <ArrowRightLeft className="h-5 w-5 text-brand-800" /> },
          ].map(({ label, value, icon }) => (
            <Card key={label} className="border border-gray-200 shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-brand-900">{value}</p>
                </div>
                <div className="shrink-0 rounded-xl bg-brand-100 p-3">{icon}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main table card ── */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="space-y-4 border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-brand-900">
                  Career Events Queue
                </CardTitle>
                <CardDescription className="mt-1 text-brand-700">
                  Data is loaded directly from the career events API.
                </CardDescription>
              </div>

             
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-6">

            {/* ── Toolbar: search + per-page ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <Input
                  placeholder="Search by employee, code, event type…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-gray-200 pl-10 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                />
              </div>
               <div className="flex w-full flex-col gap-1.5 xl:w-[220px]">
            
                <Select
                  value={typeFilter}
                  onValueChange={(value) =>
                    setTypeFilter(value as keyof typeof TYPE_FILTERS)
                  }
                >
                  <SelectTrigger className="w-full border-gray-200 bg-white text-brand-800">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="promotions">Promotions</SelectItem>
                    <SelectItem value="transfers">Transfers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm text-brand-700">Show</span>
                <Select
                  value={perPage.toString()}
                  onValueChange={(value) => setPerPage(Number(value))}
                >
                  <SelectTrigger className="w-[80px] border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {PER_PAGE_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-brand-700">entries</span>
              </div>
            </div>

            {/* ── Count + loading indicator ── */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5">
              <p className="text-sm text-brand-700">
                Showing{" "}
                <span className="font-semibold text-brand-900">{showingFrom.toLocaleString()}</span>
                {" – "}
                <span className="font-semibold text-brand-900">{showingTo.toLocaleString()}</span>
                {" of "}
                <span className="font-semibold text-brand-900">{totalEntries.toLocaleString()}</span>
                {" entries"}
              </p>

              {isFetching && (
                <Badge className="gap-1.5 border-gray-200 bg-white text-xs text-brand-800 shadow-none">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading…
                </Badge>
              )}
            </div>

            {/* ── Table ── */}
            <div className="relative overflow-x-auto rounded-lg border border-gray-200">
              {isFetching && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
                  <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-brand-800 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading career events…
                  </div>
                </div>
              )}

              <table className="w-full min-w-[800px] table-fixed border-collapse">
                {/* Explicit widths so columns don't shift */}
                <colgroup>
                  {colWidthStyles.map((w, i) => (
                    <col key={i} style={{ width: w }} />
                  ))}
                </colgroup>

                <thead className="border-b border-gray-200 bg-brand-100/70">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <GitBranch className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-brand-800">No career events found</p>
                          <p className="text-sm text-brand-600">
                            Try changing search, event type, or page filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-brand-100/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-3 py-3.5 align-middle text-sm"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* ── Pagination footer ── */}
              {rows.length > 0 && (
                <div className="border-t border-gray-200 px-5 py-4">
                  <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <p className="text-sm text-brand-700">
                      Page{" "}
                      <span className="font-semibold text-brand-900">{currentPage}</span>
                      {" of "}
                      <span className="font-semibold text-brand-900">{totalPages}</span>
                    </p>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={currentPage === 1 || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((v) => Math.max(1, v - 1))}
                        disabled={currentPage === 1 || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p: number;
                        if (totalPages <= 5) p = i + 1;
                        else if (currentPage <= 3) p = i + 1;
                        else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                        else p = currentPage - 2 + i;

                        return (
                          <Button
                            key={p}
                            variant={currentPage === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p)}
                            disabled={isFetching}
                            className={
                              currentPage === p
                                ? "border-brand-800 bg-brand-800 text-white hover:bg-brand-900"
                                : "border-gray-200 text-brand-800 hover:bg-brand-100"
                            }
                          >
                            {p}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                        disabled={currentPage === totalPages || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        disabled={currentPage === totalPages || isFetching}
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-brand-700">
                      <span className="font-semibold text-brand-900">{showingFrom.toLocaleString()}</span>
                      {" – "}
                      <span className="font-semibold text-brand-900">{showingTo.toLocaleString()}</span>
                      {" of "}
                      <span className="font-semibold text-brand-900">{totalEntries.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Detail dialog ── */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-h-[90vh] w-[92vw] max-w-5xl overflow-y-auto border border-gray-200 bg-white p-0">
          {selectedEvent && (
            <>
              <div className="bg-brand-900 px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
                    <GitBranch className="h-4 w-4 opacity-80" />
                    Career Event Details
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs text-brand-300">
                    Full approval and assignment change details.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-5 p-6">

                {/* Row 1: four info chips */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-brand-700">
                      <UserRound className="h-3.5 w-3.5" />
                      Employee
                    </div>
                    <div className="truncate font-semibold text-brand-900">
                      {selectedEvent.employee?.name || "—"}
                    </div>
                    <div className="truncate text-[11px] text-brand-700">
                      {selectedEvent.employee?.employee_code || "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-1 text-xs text-brand-700">Event Type</div>
                    <Badge className={getEventTypeClass(selectedEvent.event_type)}>
                      {selectedEvent.event_type_label || getStatusLabel(selectedEvent.event_type)}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-1 text-xs text-brand-700">Status</div>
                    <Badge className={getStatusClass(selectedEvent.status)}>
                      {getStatusLabel(selectedEvent.status)}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-brand-700">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Effective Date
                    </div>
                    <div className="font-semibold text-brand-900">
                      {formatDate(selectedEvent.effective_date)}
                    </div>
                  </div>
                </div>

                {/* Row 2: current vs new assignment */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    {
                      icon: <Briefcase className="h-4 w-4 text-brand-800" />,
                      title: "Current Assignment",
                      data: selectedEvent.current_assignment,
                    },
                    {
                      icon: <Target className="h-4 w-4 text-brand-800" />,
                      title: "New Assignment",
                      data: selectedEvent.new_assignment,
                    },
                  ].map(({ icon, title, data }) => (
                    <div key={title} className="rounded-xl border border-gray-200 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        {icon}
                        <h3 className="font-semibold text-brand-900">{title}</h3>
                      </div>
                      <dl className="space-y-2 text-sm">
                        {(["designation", "department", "branch"] as const).map((field) => (
                          <div key={field} className="flex items-baseline justify-between gap-4">
                            <dt className="shrink-0 capitalize text-brand-700">{field}</dt>
                            <dd className="text-right font-medium text-brand-900">
                              {getAssignmentLabel(data?.[field])}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>

                {/* Row 3: approvals + reason */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">Approval Steps</h3>
                    </div>
                    <div className="space-y-2">
                      {(selectedEvent.approvals || []).map((approval) => (
                        <div
                          key={approval.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-brand-900">
                              Step {approval.step_number}: {approval.role_label}
                            </div>
                            <div className="truncate text-[11px] text-brand-700">
                              {approval.approver?.name || "Approver not assigned"}
                            </div>
                          </div>
                          <Badge className={`${getStatusClass(approval.status)} shrink-0`}>
                            {getStatusLabel(approval.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-brand-800" />
                      <h3 className="font-semibold text-brand-900">Reason</h3>
                    </div>
                    <p className="text-sm leading-6 text-brand-800">
                      {selectedEvent.reason || "—"}
                    </p>
                    <div className="mt-4 space-y-1 text-xs text-brand-700">
                      <div>Created by: {selectedEvent.created_by?.name || "—"}</div>
                      <div>Created: {formatDate(selectedEvent.created_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CareerEventsPage;