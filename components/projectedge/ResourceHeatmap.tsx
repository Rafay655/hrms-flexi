"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Minus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import {
  dateFromDay,
  dayNumber,
  todayInCompany,
} from "@/lib/projectedge-gantt";
import {
  filterResourceRows,
  resourceRows,
  resourceStates,
  resourceWeeks,
  utilizationState,
  type UtilizationState,
} from "@/lib/projectedge-resources";
import type {
  ResourceMatrix,
  ResourceWeek,
} from "@/types/projectedge-resources";
import { ProjectEdgeStatePanel } from "./StatePanel";

const number = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
const format = (value: number) => number.format(value);
const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
const percentage = (row?: ResourceWeek) =>
  row?.utilization_pct !== null &&
  row?.utilization_pct !== undefined &&
  Number.isFinite(row.utilization_pct)
    ? `${format(row.utilization_pct)}%`
    : "—";

function resourceFailure(error: unknown): string {
  if (isAxiosError(error))
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      "The resource matrix could not load. Please retry."
    );
  return "The resource matrix could not load. Please retry.";
}

export function ResourceHeatmap({ projectId }: { projectId?: number }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const companyId = useAppSelector((state) => state.auth.company?.id);
  const timezone =
    useAppSelector((state) => state.auth.company?.timezone) ?? undefined;
  const canView = permissions.includes("projectedge.resource.view");
  const [date, setDate] = useState(() => todayInCompany(timezone));
  const [count, setCount] = useState<4 | 8>(4);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [state, setState] = useState<UtilizationState | "all">("all");
  const weeks = resourceWeeks(date, count);
  const query = useQuery({
    queryKey: ["projectedge", "resource-matrices", companyId, weeks[0], count],
    queryFn: ({ signal }) => projectEdgeService.resourceMatrices(weeks, signal),
    enabled: canView,
  });

  if (!canView)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Resource access required"
        description="Ask your administrator for ProjectEdge resource-view access."
      />
    );

  const matrices = query.data ?? [];
  const allRows = resourceRows(matrices);
  const selectedProject =
    projectId ?? (projectFilter ? Number(projectFilter) : undefined);
  const rows = filterResourceRows(allRows, {
    search,
    projectId: selectedProject,
    state,
  });
  const projects = new Map<number, string>();
  for (const matrix of matrices)
    for (const row of matrix.resources)
      for (const allocation of row.projects)
        projects.set(
          allocation.project_id,
          `${allocation.project_code ?? `Project ${allocation.project_id}`} — ${allocation.project_title ?? "Untitled project"}`,
        );
  const cells = rows
    .flatMap((row) => row.weeks)
    .filter((row): row is ResourceWeek => !!row);
  const overloaded = cells.filter(
    (row) => utilizationState(row) === "overloaded",
  ).length;
  const caution = cells.filter(
    (row) => utilizationState(row) === "caution",
  ).length;
  const unconfigured = cells.filter(
    (row) => row.capacity_status !== "configured",
  ).length;
  const clearFilters = () => {
    setSearch("");
    setProjectFilter("");
    setState("all");
  };
  return (
    <section className="space-y-4" aria-label="Resource utilization heatmap">
      <div className="flex flex-wrap items-end gap-3">
        <Button
          variant="outline"
          aria-label="Previous resource period"
          onClick={() => setDate(dateFromDay(dayNumber(weeks[0]) - count * 7))}
        >
          Previous
        </Button>
        <label className="text-sm">
          Starting week containing
          <input
            type="date"
            className="mt-1 block min-h-11 rounded border px-3"
            value={date}
            onChange={(event) => {
              if (event.target.value) setDate(event.target.value);
            }}
          />
        </label>
        <label className="text-sm">
          Weeks
          <select
            className="mt-1 block min-h-11 rounded border px-3"
            value={count}
            onChange={(event) => setCount(Number(event.target.value) as 4 | 8)}
          >
            <option value={4}>4 weeks</option>
            <option value={8}>8 weeks</option>
          </select>
        </label>
        <Button
          variant="outline"
          aria-label="Next resource period"
          onClick={() => setDate(dateFromDay(dayNumber(weeks[0]) + count * 7))}
        >
          Next
        </Button>
        <Button
          variant="outline"
          onClick={() => setDate(todayInCompany(timezone))}
        >
          This week
        </Button>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          {query.isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      <p className="text-sm text-slate-600">
        {weeks[0]} – {dateFromDay(dayNumber(weeks[count - 1]) + 6)}. Utilization
        uses all company project allocations and server-calculated capacity
        after schedules, holidays and leave. Each overlapping allocation
        contributes its full weekly hours; partial weeks are not prorated.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Employee code
          <input
            type="search"
            placeholder="Search employee code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-1 block min-h-11 rounded border px-3"
          />
        </label>
        {!projectId && (
          <label className="min-w-0 text-sm">
            Project
            <select
              className="mt-1 block min-h-11 max-w-full rounded border px-3"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="">All projects</option>
              {[...projects.entries()]
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="text-sm">
          Utilization state
          <select
            className="mt-1 block min-h-11 rounded border px-3"
            value={state}
            onChange={(event) =>
              setState(event.target.value as UtilizationState | "all")
            }
          >
            <option value="all">All states</option>
            {Object.entries(resourceStates).map(([value, entry]) => (
              <option key={value} value={value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      </div>
      {selectedProject && (
        <p className="text-sm">
          Showing employees allocated to{" "}
          {projects.get(selectedProject) ?? `project ${selectedProject}`} during
          this period. Cells and details retain their company-wide totals.
        </p>
      )}
      <div
        className="flex flex-wrap gap-2 text-xs"
        aria-label="Utilization legend"
      >
        {Object.entries(resourceStates).map(([key, entry]) => (
          <span
            key={key}
            className={`${entry.className} rounded border px-3 py-2`}
          >
            {entry.label}
            {key === "healthy"
              ? " <80%"
              : key === "caution"
                ? " 80–100%"
                : key === "overloaded"
                  ? " >100% or zero capacity with allocation"
                  : ""}
          </span>
        ))}
      </div>
      {query.isPending ? (
        <div role="status" aria-busy="true" className="pe-card min-h-56 p-6">
          Loading all resource weeks…
        </div>
      ) : query.isError ? (
        <ProjectEdgeStatePanel
          kind="error"
          title="Resource heatmap unavailable"
          description={`${resourceFailure(query.error)} All weeks must load before the matrix is shown.`}
          action={{
            label: "Retry",
            onClick: () => {
              void query.refetch();
            },
          }}
        />
      ) : (
        <>
          <div
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
            aria-label="Filtered resource summary"
          >
            {[
              ["Employees", rows.length],
              ["Overloaded employee-weeks", overloaded],
              ["Caution employee-weeks", caution],
              ["Unconfigured employee-weeks", unconfigured],
            ].map(([label, value]) => (
              <div className="pe-card p-4" key={label}>
                <p className="text-sm text-slate-600">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <p role="status" className="text-sm text-slate-600">
            {rows.length} of {allRows.length} allocated employees shown. State
            filters match any week in the period. “No allocation” means no
            overlapping allocation was returned; capacity was not measured for
            that cell.
          </p>
          {!rows.length ? (
            <ProjectEdgeStatePanel
              kind="empty"
              title={
                allRows.length
                  ? "No resources match these filters"
                  : "No allocations in this period"
              }
              description={
                allRows.length
                  ? "Change the filters or choose another resource period."
                  : "Only employees with overlapping project allocations appear. Choose another period to view planned allocations."
              }
              action={
                allRows.length
                  ? { label: "Reset filters", onClick: clearFilters }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border bg-white md:block">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Employee utilization by week. Activate a cell for allocation
                    and capacity details.
                  </caption>
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th scope="col" className="min-w-40 p-3 text-left">
                        Employee
                      </th>
                      {matrices.map((matrix) => (
                        <th
                          scope="col"
                          key={matrix.week_start}
                          className="min-w-44 p-3 text-center"
                        >
                          {shortDate(matrix.week_start)} –{" "}
                          {shortDate(matrix.week_end)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.employeeId}
                        className="border-b last:border-b-0"
                      >
                        <th scope="row" className="p-3 text-left">
                          {row.employeeCode}
                        </th>
                        {matrices.map((matrix, index) => (
                          <td key={matrix.week_start} className="p-2">
                            <ResourceCell
                              employeeCode={row.employeeCode}
                              matrix={matrix}
                              row={row.weeks[index]}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="space-y-3 md:hidden"
                aria-label="Mobile resource list"
              >
                {rows.map((row) => (
                  <article className="pe-card p-3" key={row.employeeId}>
                    <h3 className="mb-2 font-semibold">{row.employeeCode}</h3>
                    <div className="space-y-2">
                      {matrices.map((matrix, index) => (
                        <div key={matrix.week_start}>
                          <p className="mb-1 text-sm">
                            {shortDate(matrix.week_start)} –{" "}
                            {shortDate(matrix.week_end)}
                          </p>
                          <ResourceCell
                            employeeCode={row.employeeCode}
                            matrix={matrix}
                            row={row.weeks[index]}
                            mobile
                          />
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

function ResourceCell({
  employeeCode,
  matrix,
  row,
  mobile = false,
}: {
  employeeCode: string;
  matrix: ResourceMatrix;
  row?: ResourceWeek;
  mobile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const state = utilizationState(row);
  const display = resourceStates[state];
  const Icon =
    state === "healthy"
      ? CheckCircle2
      : state === "caution" || state === "overloaded"
        ? AlertTriangle
        : state === "no_allocation"
          ? Minus
          : CircleHelp;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`${display.className} min-h-20 w-full cursor-pointer rounded-lg border p-3 text-center transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current motion-reduce:transition-none`}
          aria-label={`${mobile ? "Mobile: " : ""}${employeeCode}, week ${matrix.week_start}, ${percentage(row)}, ${display.label}`}
        >
          <span className="block text-lg font-semibold">{percentage(row)}</span>
          <span className="flex items-center justify-center gap-1 text-xs">
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {display.label}
          </span>
          {row?.capacity_status === "unconfigured" &&
            state === "overloaded" && (
              <span className="block text-xs">Capacity unconfigured</span>
            )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="projectedge-shell max-h-[min(75vh,600px)] w-[min(420px,calc(100vw-2rem))] overflow-y-auto motion-reduce:animate-none"
        align="center"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id={titleId} className="font-semibold">
            {employeeCode} · {matrix.week_start}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            aria-label="Close resource details"
            onClick={() => setOpen(false)}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <p id={descriptionId} className="mb-3 text-sm">
          {matrix.week_start} – {matrix.week_end} · {display.label} ·{" "}
          {percentage(row)}
        </p>
        {!row ? (
          <p className="text-sm">
            No overlapping allocation was returned for this week. Available
            capacity is not reported by this matrix; this is not a measured 0%
            utilization.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              {[
                [
                  "Available capacity",
                  `${format(row.available_capacity_hours)} h`,
                ],
                ["Scheduled hours", `${format(row.scheduled_hours)} h`],
                ["Leave hours", `${format(row.leave_hours)} h`],
                ["Allocated hours", `${format(row.allocated_hours)} h`],
                [
                  "Remaining capacity",
                  `${format(row.remaining_capacity_hours)} h`,
                ],
                ["Capacity configuration", row.capacity_status],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-600">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {row.utilization_pct === null && (
              <p className="pe-state-warning rounded border p-2">
                Percentage is undefined when capacity is zero and hours are
                allocated. No percentage has been inferred.
              </p>
            )}
            {row.capacity_status === "unconfigured" && (
              <p className="pe-state-info rounded border p-2">
                Capacity is unconfigured. Check the employee’s TimeSync roster
                or shift assignment; no default 40-hour capacity is assumed.
              </p>
            )}
            <section aria-label="Project allocations">
              <h4 className="font-semibold">Projects and roles</h4>
              {row.projects.length ? (
                <ul className="mt-2 space-y-3">
                  {row.projects.map((allocation) => (
                    <li
                      key={allocation.allocation_id}
                      className="rounded border p-3"
                    >
                      <p className="font-semibold">
                        {allocation.project_code} — {allocation.project_title}
                      </p>
                      <p>
                        Role: {allocation.role_on_project ?? "Not specified"}
                      </p>
                      <p>{format(allocation.allocated_hours)} h / week</p>
                      <p>
                        {allocation.allocation_start} –{" "}
                        {allocation.allocation_end}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No project allocations.</p>
              )}
            </section>
            {row.capacity_days.length > 0 && (
              <details>
                <summary className="min-h-11 cursor-pointer py-3 font-semibold">
                  Daily capacity basis
                </summary>
                <ul className="space-y-2">
                  {row.capacity_days.map((day) => (
                    <li key={day.date}>
                      {day.date} · {day.source.replaceAll("_", " ")}
                      <br />
                      Scheduled {format(day.scheduled_hours)} h · Leave{" "}
                      {format(day.leave_hours)} h · Available{" "}
                      {format(day.available_hours)} h
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
