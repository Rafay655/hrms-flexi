"use client";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  IdCard,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
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
import { useEmployeeBadges } from "@/hooks/use-employee-badges";
import type {
  EmployeeBadge,
  EmployeeBadgeFilters,
} from "@/types/employee-badge";
import {
  BadgeError,
  BulkBadgeModal,
  EditBadgeModal,
  RemoveBadgeModal,
  badgeButton,
} from "./components/badge-modals";
type Modal =
  | { mode: "bulk" }
  | { mode: "edit" | "remove"; employee: EmployeeBadge };
export default function EmployeeBadgesPage() {
  const [search, setSearch] = useState("");
  const [badge, setBadge] = useState("");
  const [filters, setFilters] = useState<EmployeeBadgeFilters>({
    page: 1,
    per_page: 50,
  });
  const [modal, setModal] = useState<Modal | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = search.trim() || undefined,
        nextBadge = badge.trim() || undefined;
      setFilters((previous) =>
        previous.search === nextSearch && previous.badge === nextBadge
          ? previous
          : { ...previous, search: nextSearch, badge: nextBadge, page: 1 },
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [search, badge]);
  const query = useEmployeeBadges(filters);
  const rows = query.data?.data ?? [],
    meta = query.data?.meta;
  const page = meta?.current_page ?? filters.page ?? 1,
    pages = Math.max(1, meta?.last_page ?? 1),
    total = meta?.total ?? 0;
  const from = rows.length
    ? (meta?.from ??
      (page - 1) * (meta?.per_page ?? filters.per_page ?? 50) + 1)
    : 0;
  const to = rows.length ? (meta?.to ?? from + rows.length - 1) : 0;
  const first = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => first + index,
  );
  const pendingFilters =
    (search.trim() || undefined) !== filters.search ||
    (badge.trim() || undefined) !== filters.badge;
  const paginationBusy = query.isFetching || !meta || pendingFilters;
  const hasFilters = Boolean(search || badge || filters.status);
  if (
    meta &&
    !query.isPlaceholderData &&
    meta.current_page > pages &&
    filters.page !== pages
  )
    setFilters({ ...filters, page: pages });
  function filter(patch: Partial<EmployeeBadgeFilters>) {
    setFilters((previous) => ({ ...previous, ...patch, page: 1 }));
  }
  function clear() {
    setSearch("");
    setBadge("");
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
                Employee Badges Directory
              </CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                {total.toLocaleString()} employees · Map device badges to
                employee records
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
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
                className={badgeButton}
                onClick={() => setModal({ mode: "bulk" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign badges
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 basis-full flex-1 sm:basis-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search employees"
                placeholder="Search employee name or code…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <SearchableSelect
                aria-label="Employees per page"
                allowAll={false}
                widthClass="w-28"
                value={String(filters.per_page ?? 50)}
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
              aria-label="Filter badge mapping status"
              widthClass="w-full sm:w-56"
              value={filters.status ?? ""}
              allLabel="All mappings"
              options={[
                { value: "mapped", label: "Mapped" },
                { value: "unmapped", label: "Unmapped" },
              ]}
              onChange={(value) =>
                filter({
                  status: value ? (value as "mapped" | "unmapped") : undefined,
                })
              }
            />
            <Input
              aria-label="Filter by badge ID"
              type="text"
              placeholder="Filter by badge ID…"
              className="w-full sm:w-56"
              value={badge}
              onChange={(event) => setBadge(event.target.value)}
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear filters
              </Button>
            )}
          </div>
          <BadgeError error={query.error} retry={() => void query.refetch()} />
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
            <table className="w-full table-fixed break-words">
              <colgroup>
                <col className="w-10 sm:w-16" />
                <col />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-12 sm:w-16" />
              </colgroup>
              <caption className="sr-only">Employee badge assignments</caption>
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  {[
                    "SR. NO.",
                    "Employee",
                    "Device badge",
                    "Mapping",
                    "Updated",
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
                        Loading employee badges…
                      </p>
                    </td>
                  </tr>
                ) : !rows.length ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <IdCard className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 font-medium">
                        {query.isError
                          ? "Unable to load employee badges"
                          : "No employees found"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hasFilters
                          ? "Try another search or clear your filters."
                          : "Employee records will appear here when available."}
                      </p>
                      {hasFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={clear}
                        >
                          Clear filters
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  rows.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className="group text-xs transition-colors hover:bg-gray-50 sm:text-sm [overflow-wrap:anywhere]"
                    >
                      <td className="px-2 py-4 text-muted-foreground sm:px-3">
                        {from + index}
                      </td>
                      <td className="px-2 py-4 sm:px-3">
                        <button
                          type="button"
                          className="block w-full truncate text-left font-semibold text-gray-900 hover:underline"
                          title={employee.full_name}
                          onClick={() => setModal({ mode: "edit", employee })}
                        >
                          {employee.full_name}
                        </button>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {employee.employee_code}
                        </p>
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                          {employee.employment_status.replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="px-2 py-4 font-mono sm:px-3">
                        {employee.device_badge_id ?? "—"}
                      </td>
                      <td className="px-2 py-4 sm:px-3">
                        <Badge
                          variant="outline"
                          className={
                            employee.has_device_badge
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {employee.has_device_badge ? "Mapped" : "Unmapped"}
                        </Badge>
                      </td>
                      <td className="px-2 py-4 text-xs text-muted-foreground sm:px-3">
                        {employee.updated_at ?? "—"}
                      </td>
                      <td className="px-2 py-4 text-right sm:px-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Actions for ${employee.full_name}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onSelect={() =>
                                setModal({ mode: "edit", employee })
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {employee.has_device_badge
                                ? "Edit badge"
                                : "Assign badge"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={!employee.has_device_badge}
                              onSelect={() =>
                                setModal({ mode: "remove", employee })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove badge
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
          <div className="flex flex-col items-center justify-between gap-4 rounded-b-lg border-t border-gray-200 bg-gray-50 px-3 py-4 md:flex-row">
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
                  className={
                    page === value
                      ? badgeButton
                      : "border-gray-300 hover:bg-gray-100"
                  }
                  disabled={paginationBusy}
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
      {modal?.mode === "bulk" && (
        <BulkBadgeModal onClose={() => setModal(null)} />
      )}
      {modal?.mode === "edit" && (
        <EditBadgeModal
          key={modal.employee.id}
          employee={modal.employee}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.mode === "remove" && (
        <RemoveBadgeModal
          key={modal.employee.id}
          employee={modal.employee}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
