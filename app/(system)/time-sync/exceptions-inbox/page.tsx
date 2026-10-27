"use client";

import { ExceptionRegularizationModal } from "./components/exception-regularization-modal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileClock,
  MoreVertical,
  Filter,
  Inbox,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/ui/searchable-select";
import { AppLoader } from "@/components/ui/app-loader";
import { ApiErrorState } from "@/components/ui/api-error-state";
import { useAppSelector } from "@/store/hooks";
import { employeeService } from "@/services/employee.service";
import { departmentService } from "@/services/department.service";
import { attendanceExceptionService } from "@/services/attendance-exception.service";
import {
  regularizationTypeForException,
  exceptionLabel,
  exceptionSeverityTone,
  exceptionStatusTone,
  validateExceptionRange,
} from "@/lib/attendance-exception";
import type {
  AttendanceException,
  ExceptionCategory,
  ExceptionFilters,
  ExceptionSeverity,
  ExceptionStatus,
} from "@/types/attendance-exception";

const categories: { value: ExceptionCategory; label: string }[] = [
  { value: "all", label: "All exceptions" },
  { value: "missing_punch", label: "Missing punch" },
  { value: "late_early", label: "Late / early" },
  { value: "geo_violation", label: "Geo violations" },
  { value: "fraud_alerts", label: "Fraud alerts" },
];
const severities = ["high", "medium", "low"].map((value) => ({
  value,
  label: exceptionLabel(value),
}));
const defaultRange = () => {
  const day = format(subDays(new Date(), 1), "yyyy-MM-dd");
  return { date_from: day, date_to: day };
};
async function allDepartments(signal?: AbortSignal) {
  const first = await departmentService.getAll({ page: 1, per_page: 100 });
  const rows = [...first.data];
  for (let page = 2; page <= first.meta.last_page; page++) {
    if (signal?.aborted) throw new Error("Request cancelled");
    rows.push(
      ...(await departmentService.getAll({ page, per_page: 100 })).data,
    );
  }
  return rows;
}
function explanation(row: AttendanceException) {
  for (const value of [row.message, row.description, row.details])
    if (typeof value === "string" && value.trim()) return value;
  return "";
}
export default function ExceptionsInboxPage() {
  const company = useAppSelector((state) => state.auth.company?.id);
  const timeZone =
    useAppSelector((state) => state.auth.company?.timezone) || "Asia/Karachi";
  return (
    <ExceptionsInbox key={company} company={company} timeZone={timeZone} />
  );
}
function ExceptionsInbox({
  company,
  timeZone,
}: {
  company?: string;
  timeZone: string;
}) {
  const [filters, setFilters] = useState<ExceptionFilters>(() => ({
    ...defaultRange(),
    page: 1,
    per_page: 25,
    category: "all",
    status: "all",
  }));
  const [dates, setDates] = useState(() => defaultRange());
  const [rangeError, setRangeError] = useState("");
  const [search, setSearch] = useState("");
  const [regularization, setRegularization] =
    useState<AttendanceException | null>(null);
  const [advanced, setAdvanced] = useState(false);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((previous) =>
          previous.search === (search.trim() || undefined)
            ? previous
            : { ...previous, search: search.trim() || undefined, page: 1 },
        ),
      350,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ["attendance-exceptions", company, filters],
    queryFn: ({ signal }) => attendanceExceptionService.list(filters, signal),
    retry: false,
  });
  const employees = useQuery({
    queryKey: ["exception-employees", company],
    queryFn: ({ signal }) => employeeService.getAllForBatches(signal),
    enabled: advanced,
    retry: false,
  });
  const departments = useQuery({
    queryKey: ["exception-departments", company],
    queryFn: ({ signal }) => allDepartments(signal),
    enabled: advanced,
    retry: false,
  });
  const rows = query.data?.data ?? [],
    meta = query.data?.meta,
    summary = meta?.summary;
  const total = meta?.total ?? 0,
    pages = Math.max(1, meta?.last_page ?? 1);
  const from = rows.length ? (filters.page - 1) * filters.per_page + 1 : 0;
  const to = rows.length ? from + rows.length - 1 : 0;
  const set = <K extends keyof ExceptionFilters>(
    key: K,
    value: ExceptionFilters[K],
  ) => setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  const clear = () => {
    const range = defaultRange();
    setSearch("");
    setDates(range);
    setRangeError("");
    setFilters({
      ...range,
      category: "all",
      status: "all",
      page: 1,
      per_page: filters.per_page,
    });
  };
  const busy =
    query.isFetching || (search.trim() || undefined) !== filters.search;
  const advancedCount = [
    filters.type,
    filters.min_severity,
    filters.employee_id,
    filters.department_id,
  ].filter(Boolean).length;
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => Math.max(1, Math.min(filters.page - 2, pages - 4)) + index,
  );
  const paginate = (page: number) =>
    setFilters((previous) => ({ ...previous, page }));
  const pageButton = (
    label: string,
    page: number,
    Icon: typeof ChevronLeft,
    disabled: boolean,
  ) => (
    <Button
      variant="outline"
      size="sm"
      aria-label={label}
      disabled={busy || disabled}
      onClick={() => paginate(page)}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="p-3">
      <Card className="overflow-hidden border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-brand-700">
                <ShieldAlert className="h-4 w-4" />
                TimeSync
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Exceptions Inbox
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                A clear view of attendance exceptions that need your attention.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <form
            className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(160px,200px)_minmax(160px,200px)_auto_1fr]"
            onSubmit={(event) => {
              event.preventDefault();
              const error = validateExceptionRange(
                dates.date_from,
                dates.date_to,
              );
              setRangeError(error);
              if (!error)
                setFilters((previous) => ({ ...previous, ...dates, page: 1 }));
            }}
          >
            <div className="min-w-0 space-y-1.5">
              <label
                htmlFor="exceptions-from"
                className="block text-xs font-medium text-gray-600"
              >
                From date
              </label>
              <Input
                id="exceptions-from"
                type="date"
                value={dates.date_from}
                aria-invalid={Boolean(rangeError)}
                onChange={(event) => {
                  setRangeError("");
                  setDates((previous) => ({
                    ...previous,
                    date_from: event.target.value,
                  }));
                }}
                className="h-9 w-full min-w-0"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label
                htmlFor="exceptions-to"
                className="block text-xs font-medium text-gray-600"
              >
                To date
              </label>
              <Input
                id="exceptions-to"
                type="date"
                value={dates.date_to}
                aria-invalid={Boolean(rangeError)}
                onChange={(event) => {
                  setRangeError("");
                  setDates((previous) => ({
                    ...previous,
                    date_to: event.target.value,
                  }));
                }}
                className="h-9 w-full min-w-0"
              />
            </div>
            <Button
              type="submit"
              className="h-9 w-full bg-brand-900 hover:bg-brand-800 sm:w-auto sm:justify-self-start"
            >
              Apply dates
            </Button>
            <div className="flex min-h-9 flex-wrap items-center gap-2 sm:justify-end xl:justify-start">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const day = format(subDays(new Date(), 1), "yyyy-MM-dd");
                  setDates({ date_from: day, date_to: day });
                  setRangeError("");
                  setFilters((previous) => ({
                    ...previous,
                    date_from: day,
                    date_to: day,
                    page: 1,
                  }));
                }}
              >
                Yesterday
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const range = {
                    date_from: format(subDays(new Date(), 6), "yyyy-MM-dd"),
                    date_to: format(new Date(), "yyyy-MM-dd"),
                  };
                  setDates(range);
                  setRangeError("");
                  setFilters((previous) => ({
                    ...previous,
                    ...range,
                    page: 1,
                  }));
                }}
              >
                Last 7 days
              </Button>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2 xl:col-span-4">
              Choose up to 62 days, then apply the date range.
            </p>
          </form>
          {rangeError && (
            <p role="alert" className="text-sm text-red-600">
              {rangeError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Total exceptions", value: meta?.total, icon: Inbox },
              {
                label: "High severity",
                value: summary?.by_severity?.high,
                icon: ShieldAlert,
              },
              {
                label: "Medium severity",
                value: summary?.by_severity?.medium,
                icon: AlertTriangle,
              },
              {
                label: "Affected employees",
                value: summary?.affected_employees,
                icon: Users,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-brand-600/10 bg-brand-100/50 p-4"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{label}</span>
                  <Icon
                    className={`h-4 w-4 ${label === "High severity" ? "text-rose-600" : "text-brand-600"}`}
                  />
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-900">
                  {query.isPending
                    ? "…"
                    : value == null
                      ? meta?.total === 0
                        ? "0"
                        : "—"
                      : value.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Across current filters
                </p>
              </div>
            ))}
          </div>
          <div
            className="flex flex-wrap gap-1 rounded-lg border bg-brand-100/60 p-1"
            aria-label="Exception categories"
          >
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                aria-pressed={filters.category === category.value}
                onClick={() => set("category", category.value)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${filters.category === category.value ? "bg-brand-900 text-white shadow-sm" : "text-brand-700 hover:bg-white"}`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search exceptions"
                placeholder="Search employee, code, or exception…"
                maxLength={200}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <SearchableSelect
              aria-label="Filter by status"
              widthClass="w-full sm:w-40"
              allLabel="All statuses"
              value={filters.status === "all" ? "" : (filters.status ?? "")}
              options={["pending", "escalated", "resolved"].map((value) => ({
                value,
                label: exceptionLabel(value),
              }))}
              onChange={(value) =>
                set("status", (value || "all") as ExceptionStatus)
              }
            />
            <SearchableSelect
              aria-label="Filter by severity"
              widthClass="w-full sm:w-40"
              allLabel="All severities"
              value={filters.severity ?? ""}
              options={severities}
              onChange={(value) =>
                set(
                  "severity",
                  (value || undefined) as ExceptionSeverity | undefined,
                )
              }
            />
            <Button
              variant="outline"
              size="sm"
              aria-expanded={advanced}
              aria-controls="exception-advanced"
              onClick={() => setAdvanced(!advanced)}
            >
              <Filter className="mr-2 h-4 w-4" />
              More filters{advancedCount ? ` (${advancedCount})` : ""}
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              Reset
            </Button>
          </div>
          {advanced && (
            <div
              id="exception-advanced"
              className="grid gap-4 rounded-xl border bg-brand-100/40 p-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="min-w-0 space-y-1.5">
                <label
                  htmlFor="exceptions-employee"
                  className="text-xs font-medium"
                >
                  Employee
                </label>
                <SearchableSelect
                  id="exceptions-employee"
                  widthClass="w-full"
                  allLabel="All employees"
                  disabled={employees.isPending}
                  options={(employees.data ?? []).map((item) => ({
                    value: String(item.uuid),
                    label: `${item.name} · ${item.employee_code}`,
                  }))}
                  value={filters.employee_id ?? ""}
                  onChange={(value) => set("employee_id", value || undefined)}
                />
                {employees.isError && (
                  <ApiErrorState
                    error={employees.error}
                    onRetry={() => void employees.refetch()}
                  />
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <label
                  htmlFor="exceptions-department"
                  className="text-xs font-medium"
                >
                  Department
                </label>
                <SearchableSelect
                  id="exceptions-department"
                  widthClass="w-full"
                  allLabel="All departments"
                  disabled={departments.isPending}
                  options={(departments.data ?? []).map((item) => ({
                    value: String(item.id),
                    label: item.name,
                  }))}
                  value={
                    filters.department_id == null
                      ? ""
                      : String(filters.department_id)
                  }
                  onChange={(value) =>
                    set("department_id", value ? Number(value) : undefined)
                  }
                />
                {departments.isError && (
                  <ApiErrorState
                    error={departments.error}
                    onRetry={() => void departments.refetch()}
                  />
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <label
                  htmlFor="exceptions-min-severity"
                  className="text-xs font-medium"
                >
                  Minimum severity
                </label>
                <SearchableSelect
                  id="exceptions-min-severity"
                  widthClass="w-full"
                  allLabel="Any severity"
                  options={severities}
                  value={filters.min_severity ?? ""}
                  onChange={(value) =>
                    set(
                      "min_severity",
                      (value || undefined) as ExceptionSeverity | undefined,
                    )
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Includes the chosen level and higher.
                </p>
              </div>
              <div className="min-w-0 space-y-1.5">
                <label
                  htmlFor="exceptions-type"
                  className="text-xs font-medium"
                >
                  Exception type
                </label>
                <SearchableSelect
                  id="exceptions-type"
                  widthClass="w-full"
                  allLabel="All types"
                  options={Object.keys(summary?.by_type ?? {}).map((value) => ({
                    value,
                    label: exceptionLabel(value),
                  }))}
                  value={filters.type ?? ""}
                  onChange={(value) => set("type", value || undefined)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Types returned for the current filters.
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-600/10 bg-brand-100/50 p-3 text-sm text-muted-foreground">
            <span>
              Showing{" "}
              <strong className="text-brand-900">
                {from}–{to}
              </strong>{" "}
              of{" "}
              <strong className="text-brand-900">
                {total.toLocaleString()}
              </strong>{" "}
              exceptions
              <span className="ml-2 text-xs">
                · {filters.date_from} to {filters.date_to}
              </span>
            </span>
            {query.isFetching && (
              <AppLoader variant="inline" label="Loading exceptions…" />
            )}
          </div>
          <div
            className="overflow-hidden rounded-lg border border-gray-200"
            aria-busy={query.isFetching}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <caption className="sr-only">
                  Attendance exceptions inbox
                </caption>
                <thead className="border-b bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {[
                      "SR",
                      "Employee",
                      "Date",
                      "Exception",
                      "Severity",
                      "Status",
                      "Actions",
                    ].map((label) => (
                      <th key={label} scope="col" className="px-6 py-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {query.isPending ? (
                    <tr>
                      <td colSpan={7}>
                        <AppLoader label="Loading exceptions inbox…" />
                      </td>
                    </tr>
                  ) : query.isError ? (
                    <tr>
                      <td colSpan={7} className="p-6">
                        <ApiErrorState
                          error={query.error}
                          onRetry={() => void query.refetch()}
                        />
                      </td>
                    </tr>
                  ) : !rows.length ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center">
                        <Inbox className="mx-auto h-9 w-9 text-brand-600" />
                        <p className="mt-3 font-semibold text-brand-900">
                          No exceptions found
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {query.data?.message &&
                          query.data.message !==
                            "Attendance anomalies retrieved successfully."
                            ? query.data.message
                            : "Try a different date range or adjust your filters."}
                        </p>
                        <Button
                          className="mt-4"
                          size="sm"
                          variant="outline"
                          onClick={clear}
                        >
                          Reset filters
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => (
                      <tr
                        key={row.id ?? index}
                        className="text-sm transition hover:bg-brand-100/40"
                      >
                        <td className="px-6 py-4 text-muted-foreground">
                          {from + index}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-xs font-semibold text-[#EEC293]">
                              {row.employee.name
                                .split(" ")
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <p
                                className="max-w-56 truncate font-semibold text-gray-900"
                                title={row.employee.name}
                              >
                                {row.employee.name}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {row.employee.employee_code}
                              </p>
                              {row.employee.department && (
                                <p className="mt-0.5 max-w-56 truncate text-[11px] text-muted-foreground">
                                  {typeof row.employee.department === "string"
                                    ? row.employee.department
                                    : row.employee.department.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                          {row.date?.slice(0, 10) || "—"}
                        </td>
                        <td className="max-w-80 px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {row.label || exceptionLabel(row.type)}
                          </p>
                          <p className="mt-0.5 text-xs text-brand-600">
                            {row.exception_code || row.id}
                          </p>
                          {explanation(row) && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {explanation(row)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${exceptionSeverityTone(row.severity)}`}
                          >
                            <AlertCircle className="h-3 w-3" />
                            {exceptionLabel(row.severity)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${exceptionStatusTone(row.status)}`}
                          >
                            {exceptionLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {regularizationTypeForException(row.type) &&
                          row.status !== "resolved" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={`Actions for ${row.exception_code || row.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => setRegularization(row)}
                                >
                                  <FileClock className="mr-2 h-4 w-4" />
                                  Request regularization
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-muted-foreground italic">
                              No actions
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 rounded-lg border-t bg-gray-50 px-4 py-4 text-sm text-muted-foreground lg:flex-row">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <SearchableSelect
                aria-label="Exceptions per page"
                widthClass="w-24"
                allowAll={false}
                options={[10, 25, 50, 100, 200].map((value) => ({
                  value: String(value),
                  label: String(value),
                }))}
                value={String(filters.per_page)}
                onChange={(value) => set("per_page", Number(value))}
              />
              <span>entries</span>
            </div>
            <nav
              aria-label="Exceptions pagination"
              className="flex flex-wrap justify-center gap-2"
            >
              {pageButton("First page", 1, ChevronsLeft, filters.page <= 1)}
              {pageButton(
                "Previous page",
                filters.page - 1,
                ChevronLeft,
                filters.page <= 1,
              )}
              {numbers.map((number) => (
                <Button
                  key={number}
                  variant={number === filters.page ? "default" : "outline"}
                  size="sm"
                  aria-label={`Page ${number}`}
                  aria-current={number === filters.page ? "page" : undefined}
                  disabled={busy}
                  onClick={() => paginate(number)}
                >
                  {number}
                </Button>
              ))}
              {pageButton(
                "Next page",
                filters.page + 1,
                ChevronRight,
                filters.page >= pages,
              )}
              {pageButton(
                "Last page",
                pages,
                ChevronsRight,
                filters.page >= pages,
              )}
            </nav>
            <span>
              Page {filters.page} of {pages}
            </span>
          </div>
        </CardContent>
      </Card>
      {regularization && (
        <ExceptionRegularizationModal
          exception={regularization}
          company={company}
          timeZone={timeZone}
          onClose={() => setRegularization(null)}
        />
      )}
    </div>
  );
}
