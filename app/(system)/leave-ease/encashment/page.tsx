"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  RefreshCw,
  Eye,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SearchableSelect from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AppLoader } from "@/components/ui/app-loader";
import { ApiErrorState } from "@/components/ui/api-error-state";
import { useAppSelector } from "@/store/hooks";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useLeaveEncashments,
  useCreateLeaveEncashment,
  leaveEncashmentKeys,
} from "@/hooks/useLeaveEncashments";
import { leaveTypeService } from "@/services/leave-type.service";
import { leaveEncashmentService as service } from "@/services/leave-encashment.service";
import { parseApiError } from "@/lib/api-error";
import { showApiError } from "@/lib/error-toast";
import { companyDate } from "@/lib/web-punch";
import type {
  LeaveEncashment,
  EncashmentFilters,
  LeaveEncashmentFormData,
} from "@/types/leave-encashment";
import type { LeaveType } from "@/types/leave-type";
const navy = "bg-[#1E1B4B] hover:bg-[#2A2675]";
const label = (value: string) => value.replace(/^./, (c) => c.toUpperCase());
const tone = (value: string) =>
  value === "approved" || value === "paid"
    ? "bg-emerald-50 text-emerald-700"
    : value === "rejected"
      ? "bg-rose-50 text-rose-700"
      : "bg-amber-50 text-amber-800";
const amount = (value: number | string | null | undefined) =>
  value == null
    ? "—"
    : Number.isFinite(Number(value))
      ? Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";
export default function Page() {
  return (
    <Suspense fallback={<AppLoader label="Loading encashments…" />}>
      <Route />
    </Suspense>
  );
}
function Route() {
  const params = useSearchParams();
  const company = useAppSelector((s) => s.auth.company);
  const user = useAppSelector((s) => s.auth.user);
  return (
    <Directory
      key={`${company?.id}-${user?.id}-${params.get("view")}`}
      approvals={params.get("view") === "approvals"}
    />
  );
}
function Directory({ approvals }: { approvals: boolean }) {
  const company = useAppSelector((s) => s.auth.company);
  const user = useAppSelector((s) => s.auth.user);
  const permissions = user?.permissions || [];
  const can = (name: string) =>
    permissions.includes(name) || permissions.includes("*");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    if (search.trim() === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);
  const [size, setSize] = useState(15);
  const [status, setStatus] = useState(approvals ? "pending" : "");
  const [employee, setEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [year, setYear] = useState("");
  const [payroll, setPayroll] = useState("");
  const [sort, setSort] = useState("created_at");
  const [direction, setDirection] = useState("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const advancedCount = [
    !!leaveType,
    !!year,
    payroll !== "",
    sort !== "created_at" || direction !== "desc",
  ].filter(Boolean).length;
  const [create, setCreate] = useState(false);
  const [detail, setDetail] = useState<LeaveEncashment | null>(null);
  const [decision, setDecision] = useState<{
    row: LeaveEncashment;
    kind: "approve" | "reject";
  } | null>(null);
  const types = useQuery({
    queryKey: ["leave-encashments", "types", company?.id, user?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const result: LeaveType[] = [];
      let current = 1;
      while (true) {
        const response = await leaveTypeService.getAll({
          page: current,
          per_page: 100,
        });
        result.push(...response.data.data);
        if (current >= response.data.meta.last_page) break;
        current++;
      }
      return result;
    },
    retry: false,
  });
  const filters: EncashmentFilters = {
    search: debouncedSearch || undefined,
    page,
    per_page: size,
    status: status ? (status as EncashmentFilters["status"]) : undefined,
    employee_id: employee || undefined,
    leave_type_id: leaveType || undefined,
    year: year ? Number(year) : undefined,
    payroll_included: payroll === "" ? undefined : (Number(payroll) as 0 | 1),
    sort_by: sort as EncashmentFilters["sort_by"],
    sort_dir: direction as "asc" | "desc",
  };
  const list = useLeaveEncashments(filters);
  const rows = list.data?.data || [];
  const meta = list.data?.meta;
  const pages = Math.max(1, meta?.last_page || 1);
  const current = meta?.current_page || page;
  const total = meta?.total || 0;
  const first = rows.length ? (current - 1) * (meta?.per_page || size) + 1 : 0;
  const last = rows.length ? first + rows.length - 1 : 0;
  if (meta && !list.isFetching && page > pages) setPage(pages);
  const nums = Array.from(
    { length: Math.min(5, pages) },
    (_, i) => Math.max(1, Math.min(current - 2, pages - 4)) + i,
  );
  function filter(set: (value: string) => void, value: string) {
    set(value);
    setPage(1);
  }
  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                {approvals
                  ? "Encashment Approvals"
                  : "Leave Encashments Directory"}
              </CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                {total.toLocaleString()} records • Real-time data
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!company?.id || list.isFetching}
                onClick={() => void list.refetch()}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${list.isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                size="sm"
                className={navy}
                disabled={!can("encashment.create")}
                title={
                  can("encashment.create")
                    ? "Create a new encashment"
                    : "Your account needs encashment.create permission"
                }
                onClick={() => setCreate(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create encashment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-56 flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  aria-label="Search encashments"
                  placeholder="Search employee, leave type or year…"
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <EmployeeFilter
                value={employee}
                onChange={(v) => filter(setEmployee, v)}
              />
              <SearchableSelect
                aria-label="Encashment status"
                widthClass="w-full sm:w-48"
                value={status}
                allLabel="All statuses"
                onChange={(v) => filter(setStatus, v)}
                options={["pending", "approved", "rejected", "paid"].map(
                  (value) => ({ value, label: label(value) }),
                )}
              />
              <Button
                variant="outline"
                size="sm"
                aria-expanded={filtersOpen}
                aria-controls="encashment-advanced-filters"
                className={
                  filtersOpen
                    ? "border-[#1E1B4B] bg-[#1E1B4B]/5 text-[#1E1B4B]"
                    : ""
                }
                onClick={() => setFiltersOpen((value) => !value)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {filtersOpen ? "Hide filters" : "More filters"}
                {advancedCount > 0 && (
                  <span className="ml-2 rounded-full bg-[#1E1B4B] px-1.5 py-0.5 text-[10px] text-white">
                    {advancedCount}
                  </span>
                )}
              </Button>
              {(search || status || employee || advancedCount > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500"
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                    setStatus("");
                    setEmployee("");
                    setLeaveType("");
                    setYear("");
                    setPayroll("");
                    setSort("created_at");
                    setDirection("desc");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                Show
                <select
                  aria-label="Entries per page"
                  className="h-10 rounded-md border border-gray-200 bg-white px-3"
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 15, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                entries
              </div>
            </div>
            {filtersOpen && (
              <div
                id="encashment-advanced-filters"
                className="grid animate-in fade-in slide-in-from-top-1 gap-4 rounded-lg border border-gray-200 bg-gray-50/70 p-4 duration-200 sm:grid-cols-2 xl:grid-cols-4"
              >
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Leave type</Label>
                  <SearchableSelect
                    aria-label="Leave type filter"
                    widthClass="w-full"
                    value={leaveType}
                    allLabel="All leave types"
                    onChange={(v) => filter(setLeaveType, v)}
                    options={(types.data || []).map((t) => ({
                      value: t.uuid || t.id,
                      label: t.name,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Year</Label>
                  <SearchableSelect
                    aria-label="Encashment year"
                    widthClass="w-full"
                    value={year}
                    allLabel="All years"
                    onChange={(v) => filter(setYear, v)}
                    options={Array.from({ length: 80 }, (_, i) => ({
                      value: String(2020 + i),
                      label: String(2020 + i),
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Payroll</Label>
                  <SearchableSelect
                    aria-label="Payroll inclusion"
                    widthClass="w-full"
                    value={payroll}
                    allLabel="All payroll statuses"
                    onChange={(v) => filter(setPayroll, v)}
                    options={[
                      { value: "1", label: "Included in payroll" },
                      { value: "0", label: "Not included" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Sort by</Label>
                  <div className="flex items-center gap-2">
                    <SearchableSelect
                      aria-label="Sort encashments"
                      widthClass="flex-1"
                      allowAll={false}
                      value={sort}
                      onChange={(v) => filter(setSort, v)}
                      options={[
                        "created_at",
                        "year",
                        "days_encashed",
                        "amount",
                        "status",
                      ].map((value) => ({
                        value,
                        label: label(value.replaceAll("_", " ")),
                      }))}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Toggle sort direction"
                      onClick={() =>
                        filter(
                          setDirection,
                          direction === "desc" ? "asc" : "desc",
                        )
                      }
                    >
                      {direction === "desc" ? "↓" : "↑"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!company?.id ? (
            <p className="text-sm text-gray-500">
              Select a company to view encashments.
            </p>
          ) : list.error ? (
            <ApiErrorState
              error={list.error}
              onRetry={() => void list.refetch()}
            />
          ) : (
            <>
              <div className="flex justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                <span>
                  Showing {first} to {last} of {total.toLocaleString()} entries
                </span>
                {list.isFetching && <span className="text-xs">Updating…</span>}
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[1100px]">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      {[
                        "#",
                        "Employee",
                        "Leave type",
                        "Year",
                        "Days",
                        "Rate / day",
                        "Amount",
                        "Status",
                        "Payroll",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {list.isPending ? (
                      <tr>
                        <td colSpan={10} className="py-12">
                          <AppLoader label="Loading encashments…" />
                        </td>
                      </tr>
                    ) : !rows.length ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="py-12 text-center text-sm text-gray-500"
                        >
                          No encashment records found.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, i) => (
                        <tr key={row.uuid} className="hover:bg-gray-50/70">
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {first + i}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {row.employee?.name || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <p className="font-medium">
                              {row.leave_type?.name || "—"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {row.leave_type?.code}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm">{row.year}</td>
                          <td className="px-6 py-4 text-sm">
                            {row.days_encashed}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {amount(row.rate_per_day)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {amount(row.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone(row.status)}`}
                            >
                              {label(row.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {row.payroll_included ? "Included" : "Not included"}
                          </td>
                          <td className="px-6 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Actions for ${row.uuid}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setDetail(row)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                {row.status === "pending" &&
                                  can("encashment.approve") && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setDecision({ row, kind: "approve" })
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}
                                {row.status === "pending" &&
                                  can("encashment.reject") && (
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        setDecision({ row, kind: "reject" })
                                      }
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <footer className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-600 md:flex-row">
            <span>
              Page <strong>{current}</strong> of <strong>{pages}</strong>
            </span>
            <nav
              aria-label="Encashment pagination"
              className="flex flex-wrap justify-center gap-2"
            >
              {[
                { name: "First page", target: 1, icon: ChevronsLeft },
                {
                  name: "Previous page",
                  target: current - 1,
                  icon: ChevronLeft,
                },
              ].map((item) => (
                <Button
                  key={item.name}
                  size="sm"
                  variant="outline"
                  aria-label={item.name}
                  disabled={!meta || list.isFetching || current <= 1}
                  onClick={() => setPage(item.target)}
                >
                  <item.icon className="h-4 w-4" />
                </Button>
              ))}
              {nums.map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={n === current ? "default" : "outline"}
                  className={n === current ? navy : ""}
                  aria-current={n === current ? "page" : undefined}
                  disabled={!meta || list.isFetching}
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              {[
                { name: "Next page", target: current + 1, icon: ChevronRight },
                { name: "Last page", target: pages, icon: ChevronsRight },
              ].map((item) => (
                <Button
                  key={item.name}
                  size="sm"
                  variant="outline"
                  aria-label={item.name}
                  disabled={!meta || list.isFetching || current >= pages}
                  onClick={() => setPage(item.target)}
                >
                  <item.icon className="h-4 w-4" />
                </Button>
              ))}
            </nav>
            <span>
              {first} – {last} of {total.toLocaleString()} entries
            </span>
          </footer>
        </CardContent>
      </Card>
      {create && (
        <CreateModal
          types={types.data || []}
          loading={types.isPending}
          error={types.error}
          retry={() => void types.refetch()}
          onClose={() => setCreate(false)}
        />
      )}
      {detail && <Details row={detail} onClose={() => setDetail(null)} />}
      {decision && (
        <Decision
          row={decision.row}
          kind={decision.kind}
          onClose={() => setDecision(null)}
        />
      )}
    </div>
  );
}
function EmployeeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const employees = useEmployees({ per_page: 1000, detailed: 0 });
  return (
    <div className="w-full sm:w-64">
      <SearchableSelect
        aria-label="Employee filter"
        widthClass="w-full"
        value={value}
        onChange={onChange}
        allLabel="All employees"
        disabled={employees.isPending}
        options={(employees.data || []).map((e) => ({
          value: e.uuid || String(e.id),
          label: `${e.name} (${e.employee_code})`,
        }))}
      />
      {employees.error && (
        <ApiErrorState
          error={employees.error}
          onRetry={() => void employees.refetch()}
        />
      )}
    </div>
  );
}
function CreateModal({
  types,
  loading,
  error,
  retry,
  onClose,
}: {
  types: LeaveType[];
  loading: boolean;
  error: unknown;
  retry: () => void;
  onClose: () => void;
}) {
  const company = useAppSelector((s) => s.auth.company);
  const employees = useEmployees({ per_page: 1000, detailed: 0 });
  const mutation = useCreateLeaveEncashment();
  const [form, setForm] = useState({
    employee_id: "",
    leave_type_id: "",
    year: companyDate(company?.timezone || "Asia/Karachi").slice(0, 4),
    days_encashed: "",
    rate_per_day: "",
  });
  const [validation, setValidation] = useState("");
  const fieldErrors = mutation.error
    ? parseApiError(mutation.error).fieldErrors
    : {};
  const eligible = types.filter((t) => t.is_encashable && t.is_active);
  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidation("");
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const year = Number(form.year),
      days = Number(form.days_encashed);
    if (
      !form.employee_id ||
      !eligible.some((t) => (t.uuid || t.id) === form.leave_type_id)
    ) {
      setValidation("Select an employee and an active encashable leave type.");
      return;
    }
    if (
      !Number.isInteger(year) ||
      year < 2020 ||
      year > 2099 ||
      !Number.isFinite(days) ||
      days < 0.5 ||
      days > 999.9
    ) {
      setValidation(
        "Choose a year from 2020–2099 and between 0.5 and 999.9 days.",
      );
      return;
    }
    const payload: LeaveEncashmentFormData = {
      employee_id: form.employee_id,
      leave_type_id: form.leave_type_id,
      year,
      days_encashed: days,
      rate_per_day: form.rate_per_day,
    };
    mutation.mutate(payload, { onSuccess: onClose });
  }
  const field = (name: string) =>
    fieldErrors[name]?.length ? (
      <p className="text-xs text-red-600">{fieldErrors[name].join(" ")}</p>
    ) : null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b bg-gray-50/70 px-6 py-5">
          <DialogTitle>Create Encashment</DialogTitle>
          <DialogDescription>
            Select eligible leave days. The server validates entitlement and
            calculates the final amount.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-col">
          <div className="space-y-4 overflow-y-auto px-6 py-5">
            {loading || employees.isPending ? (
              <AppLoader label="Loading form options…" />
            ) : error || employees.error ? (
              <ApiErrorState
                error={error || employees.error}
                onRetry={() => {
                  retry();
                  void employees.refetch();
                }}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <SearchableSelect
                    aria-label="Employee"
                    widthClass="w-full"
                    allowAll={false}
                    value={form.employee_id}
                    onChange={(v) => update("employee_id", v)}
                    options={(employees.data || []).map((e) => ({
                      value: e.uuid || String(e.id),
                      label: `${e.name} (${e.employee_code})`,
                    }))}
                    disabled={mutation.isPending}
                  />
                  {field("employee_id")}
                </div>
                <div className="space-y-2">
                  <Label>Leave type *</Label>
                  <SearchableSelect
                    aria-label="Leave type"
                    widthClass="w-full"
                    allowAll={false}
                    value={form.leave_type_id}
                    onChange={(v) => update("leave_type_id", v)}
                    options={eligible.map((t) => ({
                      value: t.uuid || t.id,
                      label: `${t.name} (${t.code})`,
                    }))}
                    disabled={mutation.isPending}
                  />
                  {!eligible.length && (
                    <p className="text-xs text-gray-500">
                      No active encashable leave types are available.
                    </p>
                  )}
                  {field("leave_type_id")}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      {
                        key: "year",
                        text: "Year *",
                        min: 2020,
                        max: 2099,
                        step: "1",
                      },
                      {
                        key: "days_encashed",
                        text: "Days to encash *",
                        min: 0.5,
                        max: 999.9,
                        step: "any",
                      },
                      {
                        key: "rate_per_day",
                        text: "Rate per day (optional)",
                        min: 0,
                        max: undefined,
                        step: "any",
                      },
                    ] as const
                  ).map((item) => (
                    <div className="space-y-2" key={item.key}>
                      <Label htmlFor={`enc-${item.key}`}>{item.text}</Label>
                      <Input
                        id={`enc-${item.key}`}
                        type="number"
                        min={item.min}
                        max={item.max}
                        step={item.step}
                        required={item.key !== "rate_per_day"}
                        value={form[item.key]}
                        disabled={mutation.isPending}
                        onChange={(e) => update(item.key, e.target.value)}
                      />
                      {field(item.key)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Leave the rate blank to use the backend calculation.
                </p>
              </>
            )}
            {validation && (
              <p role="alert" className="text-sm text-red-600">
                {validation}
              </p>
            )}
            {!!mutation.error && (
              <p role="alert" className="text-sm text-red-600">
                {parseApiError(mutation.error).message}
              </p>
            )}
          </div>
          <DialogFooter className="border-t bg-gray-50/70 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={navy}
              disabled={
                mutation.isPending ||
                loading ||
                employees.isPending ||
                !!error ||
                !!employees.error ||
                !eligible.length
              }
            >
              {mutation.isPending ? "Saving…" : "Create encashment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function Details({
  row,
  onClose,
}: {
  row: LeaveEncashment;
  onClose: () => void;
}) {
  const entries = [
    ["Employee", row.employee?.name || "—"],
    ["Leave type", row.leave_type?.name || "—"],
    ["Year", row.year],
    ["Days encashed", row.days_encashed],
    ["Rate per day", amount(row.rate_per_day)],
    ["Amount", amount(row.amount)],
    ["Payroll", row.payroll_included ? "Included" : "Not included"],
    ["Approved by", row.approved_by || "—"],
    ["Approved at", row.approved_at || "—"],
  ];
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b bg-gray-50/70 px-6 py-5">
          <DialogTitle>Encashment Details</DialogTitle>
          <DialogDescription>
            Leave encashment and payroll status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone(row.status)}`}
          >
            {label(row.status)}
          </span>
          <dl className="grid gap-4 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-gray-500">{key}</dt>
                <dd className="mt-1 break-words text-sm font-medium">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {row.rejection_reason && (
            <div>
              <Label>Rejection reason</Label>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                {row.rejection_reason}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="border-t bg-gray-50/70 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function Decision({
  row,
  kind,
  onClose,
}: {
  row: LeaveEncashment;
  kind: "approve" | "reject";
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: () => service.decide(row.uuid, kind, reason),
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: leaveEncashmentKeys.all });
      void client.invalidateQueries({ queryKey: ["leave-ease"] });
      toast.success(
        kind === "approve" ? "Encashment approved" : "Encashment rejected",
      );
      onClose();
    },
    onError: (error: unknown) => {
      showApiError(error);
      void client.invalidateQueries({ queryKey: leaveEncashmentKeys.lists() });
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="border-b bg-gray-50/70 px-6 py-5">
          <DialogTitle>
            {kind === "approve" ? "Approve" : "Reject"} Encashment
          </DialogTitle>
          <DialogDescription>
            {row.employee?.name || "Employee"} · {row.days_encashed} days ·{" "}
            {row.year}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 py-5">
          {kind === "reject" ? (
            <>
              <Label htmlFor="enc-reason">Rejection reason *</Label>
              <Textarea
                id="enc-reason"
                value={reason}
                maxLength={500}
                disabled={mutation.isPending}
                onChange={(e) => setReason(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                5–500 characters · {reason.length}/500
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Confirm approval of this pending encashment.
            </p>
          )}
          {!!mutation.error && (
            <p role="alert" className="text-sm text-red-600">
              {parseApiError(mutation.error).message}
            </p>
          )}
        </div>
        <DialogFooter className="border-t bg-gray-50/70 px-6 py-4">
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className={kind === "reject" ? "bg-red-600 hover:bg-red-700" : navy}
            disabled={
              mutation.isPending ||
              row.status !== "pending" ||
              (kind === "reject" &&
                (reason.trim().length < 5 || reason.trim().length > 500))
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? "Saving…"
              : kind === "approve"
                ? "Approve"
                : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
