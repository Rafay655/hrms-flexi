"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import {
  REPORTS,
  canReadReport,
  reportValue,
  reportLabel,
} from "@/lib/projectedge-reports";
import type {
  ReportId,
  ReportFilters,
  ProjectEdgeReport,
} from "@/types/projectedge-reports";
import { ProjectEdgeStatePanel } from "./StatePanel";
import { BudgetBurndown } from "./BudgetBurndown";
import { ReportExports } from "./ReportExports";

export function Reports() {
  const scope = useAppSelector(
    (s) =>
      `${s.auth.company?.id}-${s.auth.user?.id}-${s.auth.permissions.join(",")}`,
  );
  return <ReportWorkspace key={scope} scope={scope} />;
}

function ReportWorkspace({ scope }: { scope: string }) {
  const permissions = useAppSelector((s) => s.auth.permissions);
  const [id, setId] = useState<ReportId>(
    () =>
      REPORTS.find((r) => canReadReport(r.id, permissions))?.id ??
      "project-status",
  );
  const [project, setProject] = useState<{ id: number; title: string } | null>(
    null,
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectPage, setProjectPage] = useState(1);
  const [applied, setApplied] = useState<ReportFilters | null>(null);
  const [error, setError] = useState("");
  const definition = REPORTS.find((r) => r.id === id)!;
  const allowed = canReadReport(id, permissions);
  const showProjects =
    id !== "my-productivity" &&
    permissions.includes("projectedge.project.view") &&
    allowed;
  const projects = useQuery({
    queryKey: [
      "projectedge",
      "report-projects",
      scope,
      projectSearch,
      projectPage,
    ],
    queryFn: ({ signal }) =>
      projectEdgeService.projects(
        { search: projectSearch, page: projectPage, per_page: 25 },
        signal,
      ),
    enabled: showProjects,
    retry: false,
  });
  const query = useQuery({
    queryKey: ["projectedge", "report", scope, id, applied],
    queryFn: ({ signal }) => projectEdgeService.report(id, applied!, signal),
    enabled: allowed && applied !== null,
    retry: false,
  });
  const reset = () => {
    setApplied(null);
    setError("");
  };
  if (!permissions.includes("projectedge.report.view"))
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Report access required"
        description="Ask an administrator for the existing report-view permission and the source permissions appropriate to your role."
      />
    );
  const options = projects.isError ? [] : (projects.data?.items ?? []);
  const data =
    !query.isError && applied !== null && allowed ? query.data : undefined;
  const selected =
    project && !projects.isError && !options.some((p) => p.id === project.id)
      ? project
      : null;
  return (
    <div className="space-y-5">
      <form
        className="pe-card space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!allowed) return;
          if (definition.requiredProject && !project) {
            setError("Select a project for this report.");
            return;
          }
          if ((from && !to) || (to && !from) || (from && to && from > to)) {
            setError("Choose both dates, with the end on or after the start.");
            return;
          }
          setError("");
          setApplied({
            ...(project && showProjects ? { project_id: project.id } : {}),
            ...(definition.dated && from && to ? { from, to } : {}),
            page: 1,
            per_page: 25,
          });
        }}
      >
        <label className="block space-y-1 text-sm font-medium">
          Report
          <select
            className="pe-input min-h-11 w-full"
            value={id}
            onChange={(event) => {
              reset();
              setId(event.target.value as ReportId);
              setProject(null);
              setFrom("");
              setTo("");
            }}
          >
            {REPORTS.map((report) => (
              <option key={report.id} value={report.id}>
                {report.title}
                {!canReadReport(report.id, permissions)
                  ? " — source access required"
                  : ""}
              </option>
            ))}
          </select>
        </label>
        {!allowed ? (
          <ProjectEdgeStatePanel
            kind="access"
            title="Source access required"
            description="Report permission does not grant access to tasks, time, delays, resources or costs. This report requires its existing source permissions."
          />
        ) : null}
        {showProjects ? (
          <fieldset className="space-y-3 rounded-xl border p-3">
            <legend className="px-1 text-sm font-semibold">
              Project scope
            </legend>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 space-y-1 text-sm">
                Find projects
                <input
                  className="pe-input min-h-11 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <Button
                type="button"
                className="min-h-11"
                onClick={() => {
                  if (projectSearch === search.trim() && projectPage === 1)
                    void projects.refetch();
                  setProjectSearch(search.trim());
                  setProjectPage(1);
                }}
              >
                Find projects
              </Button>
            </div>
            <label className="block space-y-1 text-sm">
              Project
              {definition.requiredProject ? " (required)" : " (optional)"}
              <select
                className="pe-input min-h-11 w-full"
                value={project?.id ?? ""}
                onChange={(e) => {
                  reset();
                  const choice = options.find(
                    (p) => p.id === Number(e.target.value),
                  );
                  setProject(
                    choice
                      ? {
                          id: choice.id,
                          title: `${choice.project_code} · ${choice.title}`,
                        }
                      : null,
                  );
                }}
              >
                <option value="">
                  {definition.requiredProject
                    ? "Select a project"
                    : "All authorized records"}
                </option>
                {selected ? (
                  <option value={selected.id}>{selected.title}</option>
                ) : null}
                {options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} · {p.title}
                  </option>
                ))}
              </select>
            </label>
            {projects.isPending ? (
              <p role="status">Loading project choices…</p>
            ) : null}
            {projects.isError ? (
              <p role="alert">
                Project choices unavailable. Search again to retry.
              </p>
            ) : null}
            {projects.data && !projects.isError ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Button
                  type="button"
                  className="min-h-11"
                  variant="outline"
                  disabled={projectPage <= 1}
                  onClick={() => setProjectPage((p) => p - 1)}
                >
                  Previous projects
                </Button>
                <span>
                  Project page {projects.data.meta.current_page} of{" "}
                  {projects.data.meta.last_page}
                </span>
                <Button
                  type="button"
                  className="min-h-11"
                  variant="outline"
                  disabled={projectPage >= projects.data.meta.last_page}
                  onClick={() => setProjectPage((p) => p + 1)}
                >
                  Next projects
                </Button>
              </div>
            ) : null}
          </fieldset>
        ) : null}
        {definition.dated && allowed ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              From date
              <input
                type="date"
                className="pe-input min-h-11 w-full"
                value={from}
                onChange={(e) => {
                  reset();
                  setFrom(e.target.value);
                }}
              />
            </label>
            <label className="space-y-1 text-sm">
              To date
              <input
                type="date"
                className="pe-input min-h-11 w-full"
                value={to}
                onChange={(e) => {
                  reset();
                  setTo(e.target.value);
                }}
              />
            </label>
            <p className="text-sm text-slate-600 sm:col-span-2">
              {id === "resource-capacity"
                ? "Maximum 56 days; full Monday–Sunday weeks. Leave blank for four weeks starting this week."
                : id === "department-completion" ||
                    id === "milestone-achievement"
                  ? "Optional current planned-date cohort, maximum 366 days. Blank includes all current records."
                  : "Maximum 366 days. Leave blank for month-to-date. The report explains which date field is filtered."}
            </p>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="pe-button-primary min-h-11"
          disabled={!allowed || query.isFetching}
        >
          Generate report
        </Button>
      </form>
      {applied !== null && query.isPending && allowed ? (
        <p role="status" aria-busy="true">
          Calculating report…
        </p>
      ) : null}
      {applied !== null && query.isError && allowed ? (
        <ProjectEdgeStatePanel
          kind="error"
          title="Report unavailable"
          description="No cached results are shown. Check project access and date limits, then retry. Your access or the selected records may have changed."
          action={{
            label: "Retry report",
            onClick: () => {
              void query.refetch();
            },
          }}
        />
      ) : null}
      {data ? (
        <>
          <ReportTable data={data} title={definition.title} />
          {permissions.includes("projectedge.report.export") ? (
            <ReportExports
              key={`${scope}-${id}-${JSON.stringify(data.filters)}`}
              scope={scope}
              id={id}
              filters={data.filters}
            />
          ) : null}
          {data.report === "cost-burn" && data.cost_burn ? (
            <BudgetBurndown
              summary={data.cost_burn}
              money={(value) =>
                `${value}${data.currency ? ` ${data.currency}` : " (currency not configured)"}`
              }
            />
          ) : null}
          <div
            className="flex flex-wrap items-center gap-3 text-sm"
            aria-label="Report pagination"
          >
            <Button
              variant="outline"
              className="min-h-11"
              disabled={query.isFetching || data.meta.current_page <= 1}
              onClick={() =>
                setApplied((a) => ({ ...a, page: data.meta.current_page - 1 }))
              }
            >
              Previous results
            </Button>
            <span role="status">
              Page {data.meta.current_page} of {data.meta.last_page} ·{" "}
              {data.meta.total} rows
            </span>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={
                query.isFetching ||
                data.meta.current_page >= data.meta.last_page
              }
              onClick={() =>
                setApplied((a) => ({ ...a, page: data.meta.current_page + 1 }))
              }
            >
              Next results
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={query.isFetching}
              onClick={() => {
                void query.refetch();
              }}
            >
              Refresh report
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ReportTable({
  data,
  title,
}: {
  data: ProjectEdgeReport;
  title: string;
}) {
  return (
    <section className="pe-card space-y-4 p-5" aria-label={title}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-slate-600">
        As of {data.as_of} · {data.timezone}
        {data.currency ? ` · Amounts in ${data.currency}` : ""} · Generated{" "}
        {data.generated_at}
      </p>
      {Object.keys(data.summary).length ? (
        <dl className="grid gap-3 sm:grid-cols-3">
          {Object.entries(data.summary).map(([key, value]) => (
            <div className="rounded-xl border p-3" key={key}>
              <dt className="text-sm text-slate-600">{reportLabel(key)}</dt>
              <dd className="text-lg font-semibold">{reportValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6">
        <h3 className="font-semibold">Calculation and scope notes</h3>
        <ul className="list-disc space-y-1 pl-5">
          {data.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
      {data.rows.length ? (
        <div
          className="overflow-x-auto rounded-xl border"
          role="region"
          aria-label="Scrollable report table"
          tabIndex={0}
        >
          <table className="w-max min-w-full text-left text-sm">
            <caption className="sr-only">{title} results</caption>
            <thead className="bg-slate-50">
              <tr>
                {data.columns.map((column) => (
                  <th
                    className="whitespace-nowrap px-4 py-3"
                    scope="col"
                    key={column.key}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr className="border-t" key={index}>
                  {data.columns.map((column) => (
                    <td
                      className="min-w-40 max-w-md whitespace-pre-wrap px-4 py-3 align-top [overflow-wrap:anywhere]"
                      key={column.key}
                    >
                      {reportValue(row[column.key] ?? null)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ProjectEdgeStatePanel
          kind="empty"
          title="No report rows"
          description="There are no authorized records matching this report scope. Empty results do not imply unused employee capacity."
        />
      )}
    </section>
  );
}
