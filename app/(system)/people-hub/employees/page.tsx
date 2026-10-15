"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
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
  Users,
  Building2,
  Mail,
  Phone,
  BriefcaseBusiness,
  UserCheck,
  FileText,
  Sparkles,
} from "lucide-react";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const DEFAULT_PER_PAGE = 15;

// ─── Types ───────────────────────────────────────────────────────────────────

type ApiFieldValueObject = {
  id?: string | number | null;
  value?: string | number | null;
  label?: string | null;
};

type ApiProfileField = {
  label: string;
  type: string;
  tags?: string[];
  is_required?: boolean;
  is_login_email?: boolean;
  value?:
    | string
    | number
    | null
    | ApiFieldValueObject
    | ApiFieldValueObject[];
};

type ApiProfileStep = {
  step_id: number;
  step_name: string;
  icon: string | null;
  order: number;
  fields: Record<string, ApiProfileField>;
};

type ApiOnboardingEmployee = {
  id: string;
  employee_code: string | null;
  company_id: number;
  employment_status: string;
  joining_date: string | null;
  form_mode: "quick" | "detailed" | string;
  user: unknown | null;
  profile?: {
    steps?: ApiProfileStep[];
    orphaned?: unknown;
  };
  created_at: string;
  updated_at: string;
};

type OnboardingListResponse = {
  success: boolean;
  message: string;
  data: ApiOnboardingEmployee[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    from?: number;
    to?: number;
  };
  pagination?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    from?: number;
    to?: number;
  };
};

type EmployeeStatus =
  | "draft"
  | "active"
  | "probation"
  | "inactive"
  | "suspended"
  | "exited"
  | string;

type EmployeeRow = {
  sr: number;
  id: string;
  name: string;
  emp_code: string;
  manager: string;
  designation: string;
  department: string;
  work_mode: string;
  join_date: string | null;
  email: string;
  phone: string;
  employment_type: string;
  type_description: string;
  status: EmployeeStatus;
  form_mode: string;
  created_at: string;
  updated_at: string;
  raw: ApiOnboardingEmployee;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function getInitials(name: string) {
  if (!name || name === "—") return "EM";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeApiValue(value: ApiProfileField["value"]) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          return String(item.label ?? item.value ?? item.id ?? "");
        }
        return String(item ?? "");
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    return String(value.label ?? value.value ?? value.id ?? "");
  }
  return String(value);
}

function getAllFields(employee: ApiOnboardingEmployee) {
  const fields: Record<string, ApiProfileField> = {};
  employee.profile?.steps?.forEach((step) => {
    Object.entries(step.fields || {}).forEach(([key, value]) => {
      fields[key] = value;
    });
  });
  return fields;
}

function getFieldValue(
  employee: ApiOnboardingEmployee,
  systemKey: string,
  fallback = "—"
) {
  const fields = getAllFields(employee);
  const value = normalizeApiValue(fields[systemKey]?.value);
  return value || fallback;
}

function getFieldValueByLabel(
  employee: ApiOnboardingEmployee,
  labels: string[],
  fallback = "—"
) {
  const fields = getAllFields(employee);
  const normalizedLabels = labels.map((item) => item.toLowerCase());
  const found = Object.values(fields).find((field) =>
    normalizedLabels.includes(String(field.label || "").toLowerCase())
  );
  const value = normalizeApiValue(found?.value);
  return value || fallback;
}

function buildEmployeeName(employee: ApiOnboardingEmployee) {
  const firstName = getFieldValue(employee, "field_fn1", "");
  const lastName = getFieldValue(employee, "field_ln1", "");
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || "Unnamed Employee";
}

function mapEmployeeToRow(
  employee: ApiOnboardingEmployee,
  sr: number
): EmployeeRow {
  const designation =
    getFieldValue(employee, "field_dsg", "") ||
    getFieldValueByLabel(employee, ["Designation"], "");
  const department =
    getFieldValue(employee, "field_dp1", "") ||
    getFieldValueByLabel(employee, ["Department"], "");
  const manager =
    getFieldValue(employee, "field_rm1", "") ||
    getFieldValueByLabel(employee, ["Reporting Manager"], "");
  const joiningDate =
    employee.joining_date ||
    getFieldValue(employee, "field_jd1", "") ||
    getFieldValueByLabel(employee, ["Joining Date"], "");
  const employmentType =
    getFieldValue(employee, "field_et1", "") ||
    getFieldValueByLabel(employee, ["Employment Type"], "");

  return {
    sr,
    id: employee.id,
    name: buildEmployeeName(employee),
    emp_code: employee.employee_code || "Draft",
    manager: manager || "—",
    designation: designation || "—",
    department: department || "—",
    work_mode:
      getFieldValue(employee, "field_wm1", "") ||
      getFieldValueByLabel(employee, ["Work Mode"], "—"),
    join_date: joiningDate || null,
    email:
      getFieldValue(employee, "field_em1", "") ||
      getFieldValueByLabel(employee, ["Personal Email", "Email"], "—"),
    phone:
      getFieldValue(employee, "field_mb1", "") ||
      getFieldValueByLabel(employee, ["Mobile Number", "Phone"], "—"),
    employment_type: employmentType || "—",
    type_description:
      employmentType && employmentType !== "—"
        ? `${employmentType} employee record.`
        : "Employee onboarding record.",
    status: employee.employment_status || "draft",
    form_mode: employee.form_mode || "—",
    created_at: employee.created_at,
    updated_at: employee.updated_at,
    raw: employee,
  };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { classes: string; dot: string; label: string }> = {
  active:    { classes: "bg-emerald-50 text-emerald-700 border-emerald-200",     dot: "bg-emerald-500", label: "Active" },
  draft:     { classes: "bg-amber-50 text-amber-700 border-amber-200",           dot: "bg-amber-400",   label: "Draft" },
  probation: { classes: "bg-blue-50 text-blue-700 border-blue-200",              dot: "bg-blue-500",    label: "Probation" },
  inactive:  { classes: "bg-slate-100 text-slate-600 border-slate-200",          dot: "bg-slate-400",   label: "Inactive" },
  suspended: { classes: "bg-orange-50 text-orange-700 border-orange-200",        dot: "bg-orange-500",  label: "Suspended" },
  exited:    { classes: "bg-red-50 text-red-600 border-red-200",                 dot: "bg-red-400",     label: "Exited" },
};

function getStatusConfig(status: EmployeeStatus) {
  return STATUS_CONFIG[String(status).toLowerCase()] ?? {
    classes: "bg-brand-50 text-brand-700 border-brand-200",
    dot: "bg-brand-400",
    label: String(status),
  };
}

// ─── Avatar gradient palette (deterministic from name) ───────────────────────

const AVATAR_GRADIENTS = [
  "from-brand-700 to-brand-900",
  "from-brand-600 to-brand-800",
  "from-brand-800 to-brand-950",
  "from-indigo-600 to-brand-800",
  "from-brand-700 to-indigo-900",
];

function getAvatarGradient(name: string) {
  const code = Array.from(name || "E").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

// ─── Service ──────────────────────────────────────────────────────────────────

const onboardingEmployeeService = {
  list: async ({ page, perPage, search }: { page: number; perPage: number; search: string }) => {
    const companyUuid = getCompanyUuid();
    const response = await api.get<OnboardingListResponse>("/people-hub/onboarding", {
      params: { per_page: perPage, page, search: search || undefined },
      headers: { Accept: "application/json", "X-Company-ID": companyUuid },
    });
    return response.data;
  },
  delete: async (employeeUuid: string) => {
    const companyUuid = getCompanyUuid();
    const response = await api.delete(`/people-hub/onboarding/${employeeUuid}`, {
      headers: { Accept: "application/json", "X-Company-ID": companyUuid },
    });
    return response.data;
  },
};


// ─── UI Helpers ──────────────────────────────────────────────────────────────

function EmployeeAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-900 text-xs font-bold text-white shadow-sm shadow-brand-900/20">
      {getInitials(name)}
    </div>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const cfg = getStatusConfig(status);
  return (
    <Badge className={`rounded-full border px-2.5 py-1 text-xs font-semibold hover:bg-current/0 ${cfg.classes}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </Badge>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  return (
    <Badge className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-900 hover:bg-brand-50">
      {mode}
    </Badge>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function EmployeeListing() {
  const router = useRouter();

  const [rowsData, setRowsData] = useState<EmployeeRow[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 400);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showingFrom, setShowingFrom] = useState(0);
  const [showingTo, setShowingTo] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchEmployees() {
    try {
      setIsFetching(true);
      const response = await onboardingEmployeeService.list({
        page,
        perPage,
        search: debouncedSearch,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch employees.");
      }

      const meta = response.meta || response.pagination;
      const currentPage = meta?.current_page || page;
      const serverPerPage = meta?.per_page || perPage;
      const total = meta?.total ?? response.data.length;
      const lastPage = meta?.last_page || Math.max(1, Math.ceil(total / serverPerPage));

      setTotalEntries(total);
      setTotalPages(lastPage);
      setShowingFrom(meta?.from || (total ? (currentPage - 1) * serverPerPage + 1 : 0));
      setShowingTo(meta?.to || Math.min(currentPage * serverPerPage, total));
      setRowsData(
        (response.data || []).map((employee, index) =>
          mapEmployeeToRow(employee, (currentPage - 1) * serverPerPage + index + 1)
        )
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch employee onboarding records.";
      showApiError(error, { ...({ description: message }), fallbackMessage: "Unable to load employees" });
      setRowsData([]);
      setTotalEntries(0);
      setTotalPages(1);
      setShowingFrom(0);
      setShowingTo(0);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [perPage, debouncedSearch, statusFilter, modeFilter]);

  const rows = useMemo(
    () =>
      rowsData.filter((employee) => {
        if (statusFilter !== "all" && String(employee.status).toLowerCase() !== statusFilter) return false;
        if (modeFilter !== "all" && String(employee.form_mode).toLowerCase() !== modeFilter) return false;
        return true;
      }),
    [rowsData, statusFilter, modeFilter]
  );

  const openView = (employee: EmployeeRow) => router.push(`/people-hub/ess-profile`);
  const openEdit = (employee: EmployeeRow) => router.push(`/people-hub/onboarding/${employee.id}`);
  const openCreate = () => router.push("/people-hub/onboarding");
  const handleDelete = (id: string) => setDeleteId(id);

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await onboardingEmployeeService.delete(deleteId);
      toast.success("Employee draft deleted", { description: "Onboarding record removed." });
      setDeleteId(null);
      fetchEmployees();
    } catch (error: any) {
      showApiError(error, { ...({
        description: error?.response?.data?.message || error?.message || "Failed to delete.",
      }), fallbackMessage: "Unable to delete" });
    } finally {
      setIsDeleting(false);
    }
  }

  const handleExportCSV = () => {
    const headers = [
      "Employee",
      "Employee Code",
      "Manager",
      "Designation",
      "Department",
      "Work Mode",
      "Join Date",
      "Email",
      "Phone",
      "Employment Type",
      "Status",
      "Form Mode",
    ];
    const csvRows = rows.map((employee) => [
      employee.name,
      employee.emp_code,
      employee.manager,
      employee.designation,
      employee.department,
      employee.work_mode,
      formatDate(employee.join_date),
      employee.email,
      employee.phone,
      employee.employment_type,
      employee.status,
      employee.form_mode,
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "employee-onboarding.csv";
    a.click();
  };

  const columns: ColumnDef<EmployeeRow>[] = useMemo(
    () => [
      {
        accessorKey: "sr",
        header: "#",
        cell: ({ row }) => <div className="font-medium text-slate-500">{row.original.sr}</div>,
      },
      {
        accessorKey: "name",
        header: "Employee Name",
        cell: ({ row }) => {
          const employee = row.original;
          return (
            <div className="flex min-w-[260px] items-center gap-3">
              <EmployeeAvatar name={employee.name} />
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{employee.name}</div>
                <div className="mt-0.5 truncate text-xs text-slate-500">
                  {employee.emp_code} • Reports to {employee.manager}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "designation",
        header: "Role",
        cell: ({ row }) => {
          const employee = row.original;
          return (
            <div className="min-w-[180px]">
              <div className="font-semibold text-slate-900">{employee.designation}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="h-3.5 w-3.5 text-brand-900" />
                {employee.department}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Contact",
        cell: ({ row }) => {
          const employee = row.original;
          return (
            <div className="min-w-[220px] space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Mail className="h-3.5 w-3.5 text-brand-900" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{employee.phone}</span>
              </div>
            </div>
          );
        },
      },
    
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
     {
  id: "actions",
  header: () => <div className="text-center">Actions</div>,
  cell: ({ row }) => {
    const employee = row.original;

    return (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-brand-50 hover:text-brand-900"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            <DropdownMenuItem
              onClick={() => openView(employee)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-900"
            >
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => openEdit(employee)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleDelete(employee.id)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
}
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const activeCount = rowsData.filter((employee) => String(employee.status).toLowerCase() === "active").length;
  const draftCount = rowsData.filter((employee) => String(employee.status).toLowerCase() === "draft").length;

  return (
    <div className="min-h-screen  p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="overflow-hidden rounded-3xl bg-brand-900 shadow-xl shadow-brand-900/10">
          <div className="relative px-5 py-6 sm:px-7 lg:px-8">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_28%),radial-gradient(circle_at_80%_0%,white,transparent_22%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                  <Sparkles className="h-3.5 w-3.5" />
                  People Hub
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Employees Management
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-white/70">
                  Manage onboarding records, employee profiles, drafts, employment status, and basic employee information.
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
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/60">Drafts</div>
                  <div className="mt-1 text-2xl font-bold text-white">{draftCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-950">Employee Directory</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {showingFrom} to {showingTo} of {totalEntries.toLocaleString()} records
                  {isFetching && !isLoading ? " • Refreshing..." : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleExportCSV}
                  className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  className="h-11 gap-2 rounded-xl bg-brand-900 px-4 font-semibold text-white shadow-lg shadow-brand-900/20 hover:bg-brand-800"
                  onClick={openCreate}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_180px_190px]">
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by employee name, email, phone, or code..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none transition focus-visible:bg-white focus-visible:ring-brand-900/20"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-brand-900/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="exited">Exited</SelectItem>
                </SelectContent>
              </Select>

              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus:ring-brand-900/20">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="quick">Quick</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <span className="text-sm text-slate-500">Show</span>
                <Select value={perPage.toString()} onValueChange={(value) => setPerPage(Number(value))}>
                  <SelectTrigger className="h-9 w-20 border-0 p-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="15" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[10, 15, 25, 50, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-500">entries</span>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-900 shadow-sm">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Employee onboarding records</p>
                  <p className="text-xs text-slate-500">Filtered by search, status, and onboarding mode.</p>
                </div>
              </div>
              {(isLoading || isFetching) && <Loader2 className="h-5 w-5 animate-spin text-brand-900" />}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b border-slate-200">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex cursor-pointer items-center gap-1.5">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                              ) : header.column.getIsSorted() === "desc" ? (
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
                          <div className="mt-3 text-sm font-medium text-slate-600">Loading employees...</div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="py-16 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <FileText className="h-7 w-7 text-slate-400" />
                          </div>
                          <div className="mt-4 text-sm font-semibold text-slate-900">No employees found</div>
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
                    disabled={page === 1 || isFetching}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    disabled={page === 1 || isFetching}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNumber;
                    if (totalPages <= 5) pageNumber = index + 1;
                    else if (page <= 3) pageNumber = index + 1;
                    else if (page >= totalPages - 2) pageNumber = totalPages - 4 + index;
                    else pageNumber = page - 2 + index;

                    return (
                      <Button
                        key={pageNumber}
                        variant={page === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNumber)}
                        disabled={isFetching}
                        className={
                          page === pageNumber
                            ? "h-9 min-w-9 rounded-lg bg-brand-900 px-3 text-white hover:bg-brand-800"
                            : "h-9 min-w-9 rounded-lg border-slate-200 px-3"
                        }
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                    disabled={page === totalPages || isFetching}
                    className="h-9 rounded-lg border-slate-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages || isFetching}
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

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl border-slate-200 bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-950">Delete employee draft?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will permanently remove the onboarding record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EmployeeListing;
