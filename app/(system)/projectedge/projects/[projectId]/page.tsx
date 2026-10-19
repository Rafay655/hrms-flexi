"use client";

import { use, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  Flag,
  Gauge,
  UsersRound,
} from "lucide-react";
import { ProjectEdgeStatePanel } from "@/components/projectedge/StatePanel";
import { projectEdgeService } from "@/services/projectedge";
import { MilestoneStrip } from "@/components/projectedge/MilestoneStrip";
import { PersonLabel } from "@/components/projectedge/PersonLabel";
import { OffboardingWarning } from "@/components/projectedge/OffboardingWarning";
import { useAppSelector } from "@/store/hooks";

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const id = Number(projectId);
  const user = useAppSelector((state) => state.auth.user);
  const permissions = useAppSelector((state) => state.auth.permissions);
  const projectQuery = useQuery({
    queryKey: ["projectedge", "project", id, user?.company?.id, user?.id, [...permissions].sort().join("|")],
    queryFn: () => projectEdgeService.project(id),
    enabled: Boolean(user) && Number.isInteger(id) && id > 0,
  });

  if (projectQuery.isPending)
    return <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />;
  if (projectQuery.isError)
    return (
      <ProjectEdgeStatePanel
        description="Project summary data could not be loaded."
        kind="error"
        title="Overview unavailable"
      />
    );

  const project = projectQuery.data;
  const summary = project.summary;
  const taskTotal = Object.values(summary?.tasks_by_status ?? {}).reduce(
    (total, count) => total + Number(count),
    0,
  );

  return (
    <div className="space-y-5">
      <OffboardingWarning warnings={project.warnings ?? []} />
      <MilestoneStrip projectId={id} />
      <section
        aria-label="Project health"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric
          icon={Gauge}
          label="Completion"
          value={`${project.completion_pct}%`}
          detail="Calculated from project work"
        />
        <Metric
          icon={CheckCircle2}
          label="Tasks"
          value={taskTotal}
          detail={`${summary?.tasks_by_status.done ?? 0} complete`}
        />
        <Metric
          icon={Flag}
          label="Milestones"
          value={summary?.milestone_count ?? 0}
          detail="Defined delivery checkpoints"
        />
        <Metric
          icon={CircleAlert}
          label="Overdue tasks"
          value={summary?.overdue_tasks ?? 0}
          detail="Open work past its due date"
          attention={Boolean(summary?.overdue_tasks)}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <article className="pe-card border p-5 sm:p-6">
          <h2 className="font-semibold text-slate-950">Delivery progress</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current project completion against the planned window
          </p>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Overall completion
            </span>
            <span className="font-semibold tabular-nums text-slate-950">
              {project.completion_pct}%
            </span>
          </div>
          <div
            aria-label="Project completion"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={project.completion_pct}
            className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${Math.min(100, project.completion_pct)}%` }}
            />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info
              icon={CalendarRange}
              label="Timeline"
              value={`${project.start_date} — ${project.end_date ?? "Open"}`}
            />
            <Info
              icon={UsersRound}
              label="Owner"
              value={<PersonLabel person={project.manager} fallback="Not available" />}
            />
          </div>
        </article>
        <article className="pe-card border p-5 sm:p-6">
          <h2 className="font-semibold text-slate-950">Task status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Distribution of work in this project
          </p>
          {taskTotal === 0 ? (
            <p className="mt-8 text-sm leading-6 text-slate-600">
              No tasks have been added yet. Use the project task workspace to
              begin planning delivery.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {Object.entries(summary?.tasks_by_status ?? {}).map(
                ([status, count]) => (
                  <div
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                    key={status}
                  >
                    <span className="text-sm font-medium capitalize text-slate-700">
                      {status.replaceAll("_", " ")}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-950">
                      {count}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  attention = false,
}: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
  detail: string;
  attention?: boolean;
}) {
  return (
    <article className="pe-card border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-950">
            {value}
          </p>
        </div>
        <span
          className={`grid size-10 place-items-center rounded-xl ${attention ? "bg-amber-50 text-amber-800" : "bg-indigo-50 text-indigo-700"}`}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarRange;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <Icon aria-hidden="true" className="size-5 text-indigo-700" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
