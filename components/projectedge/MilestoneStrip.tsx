"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import { ProjectEdgeStatePanel } from "./StatePanel";
import type {
  MilestoneHealth,
  ProjectMilestone,
} from "@/types/projectedge-milestones";

export const MILESTONE_HEALTH: Record<
  MilestoneHealth,
  { label: string; className: string }
> = {
  on_track: { label: "On track", className: "pe-state-info" },
  at_risk: { label: "At risk", className: "pe-state-warning" },
  missed: { label: "Missed", className: "pe-state-danger" },
  achieved: { label: "Achieved", className: "pe-state-success" },
};
export function MilestoneHealthBadge({ health }: { health: MilestoneHealth }) {
  const state = MILESTONE_HEALTH[health];
  return (
    <span
      className={`${state.className} rounded-full border px-3 py-1 text-sm`}
    >
      {state.label}
    </span>
  );
}
export function MilestoneProgress({
  milestone,
}: {
  milestone: ProjectMilestone;
}) {
  const { progress } = milestone;
  return (
    <div className="space-y-2">
      <p className="text-sm">
        {progress.completed_tasks} / {progress.total_tasks} terminal tasks ·{" "}
        {progress.progress_pct}%
      </p>
      <div
        role="progressbar"
        aria-label={`${milestone.title} task progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.progress_pct}
        className="h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full bg-indigo-700"
          style={{
            width: `${Math.max(0, Math.min(100, progress.progress_pct))}%`,
          }}
        />
      </div>
      <p className="text-xs text-slate-600">
        {progress.done_tasks} done · {progress.cancelled_tasks} cancelled
      </p>
    </div>
  );
}
export function MilestoneStrip({ projectId }: { projectId: number }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canView = permissions.includes("projectedge.project.view");
  const query = useQuery({
    queryKey: ["projectedge", "milestone-report", projectId],
    queryFn: ({ signal }) =>
      projectEdgeService.milestoneReport(projectId, signal),
    enabled: canView && Number.isInteger(projectId) && projectId > 0,
  });
  if (!canView || !Number.isInteger(projectId) || projectId <= 0) return null;
  if (query.isPending) return <p role="status">Loading milestones…</p>;
  if (query.isError)
    return (
      <ProjectEdgeStatePanel
        kind="error"
        title="Milestones unavailable"
        description="Delivery checkpoints could not be loaded."
        action={{ label: "Retry milestones", onClick: () => query.refetch() }}
      />
    );
  return (
    <section aria-label="Milestone strip" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>Delivery milestones</h2>
        <Link
          href={`/projectedge/projects/${projectId}/milestones`}
          className="inline-flex min-h-11 items-center underline"
        >
          View milestone manager
        </Link>
      </div>
      {query.data.milestones.length ? (
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.milestones.map((milestone) => (
            <li key={milestone.id} className="pe-card space-y-3 border p-4">
              <Link
                className="inline-flex min-h-11 items-center font-semibold underline"
                href={`/projectedge/projects/${projectId}/milestones?milestone=${milestone.id}`}
              >
                {milestone.sort_order + 1}. {milestone.title}
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <MilestoneHealthBadge health={milestone.health} />
                {milestone.is_gate ? (
                  <span className="inline-flex items-center gap-1 text-sm">
                    <LockKeyhole aria-hidden="true" className="size-4" />
                    Gate{" "}
                    {milestone.status === "achieved"
                      ? "released"
                      : "not achieved"}
                  </span>
                ) : null}
              </div>
              <p className="text-sm">
                Due {milestone.due_date} · {milestone.status}
              </p>
              <MilestoneProgress milestone={milestone} />
            </li>
          ))}
        </ol>
      ) : (
        <p>
          No milestones defined. Open the manager to plan delivery checkpoints.
        </p>
      )}
    </section>
  );
}
