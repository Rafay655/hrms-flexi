"use client";

import { useEffect, useId, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import { boardFailure } from "@/lib/projectedge-board";
import { ProjectEdgeStatePanel } from "./StatePanel";
import {
  MilestoneHealthBadge,
  MilestoneProgress,
  MILESTONE_HEALTH,
} from "./MilestoneStrip";
import type {
  ProjectMilestone,
  MilestoneHealth,
  MilestoneInput,
} from "@/types/projectedge-milestones";

type Action =
  | { kind: "create" }
  | {
      kind: "edit" | "achieve" | "defer" | "delete";
      milestone: ProjectMilestone;
    };
export function MilestoneManager({
  projectId,
  initialMilestoneId,
}: {
  projectId: number;
  initialMilestoneId?: number;
}) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canView = permissions.includes("projectedge.project.view");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["projectedge", "milestone-report", projectId],
    queryFn: ({ signal }) =>
      projectEdgeService.milestoneReport(projectId, signal),
    enabled: canView && Number.isInteger(projectId) && projectId > 0,
    retry: false,
  });
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [health, setHealth] = useState("all");
  useEffect(() => {
    if (query.isSuccess && initialMilestoneId) {
      const target = document.getElementById(`milestone-${initialMilestoneId}`);
      target?.scrollIntoView?.({ block: "nearest", behavior: "instant" });
      target?.focus({ preventScroll: true });
    }
  }, [query.isSuccess, initialMilestoneId]);
  async function save(work: () => Promise<unknown>, message: string) {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await work();
      toast.success(message);
      setAction(null);
      await Promise.all(
        [
          "milestone-report",
          "milestones",
          "gantt",
          "board",
          "project",
          "activity",
        ].map((name) =>
          queryClient.invalidateQueries({
            queryKey: ["projectedge", name, projectId],
          }),
        ),
      );
      await Promise.all(
        ["task-detail", "block-state", "my-tasks", "projects"].map((name) =>
          queryClient.invalidateQueries({ queryKey: ["projectedge", name] }),
        ),
      );
    } catch (error) {
      const parsed = boardFailure(error);
      setFailure(
        [parsed.message, parsed.hint, ...parsed.reasons]
          .filter(Boolean)
          .join(" "),
      );
      toast.error(parsed.message);
    } finally {
      setBusy(false);
    }
  }
  function choose(next: Action) {
    setFailure(null);
    setAction(next);
  }
  if (!canView)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Milestone access required"
        description="Project-view permission is required."
      />
    );
  if (!Number.isInteger(projectId) || projectId <= 0)
    return (
      <ProjectEdgeStatePanel
        kind="error"
        title="Invalid project"
        description="Choose a valid project."
      />
    );
  if (query.isPending)
    return (
      <p role="status" aria-busy="true">
        Loading milestone manager…
      </p>
    );
  if (query.isError)
    return (
      <ProjectEdgeStatePanel
        kind="error"
        title="Milestones unavailable"
        description="The project may be inaccessible or the connection failed."
        action={{ label: "Retry milestones", onClick: () => query.refetch() }}
      />
    );
  const canManage = query.data.capabilities.manage;
  const milestones = query.data.milestones;
  return (
    <section aria-label="Milestone manager" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Milestone manager</h2>
          <p className="text-sm text-slate-600">
            Plan checkpoints, review delivery health, and release gates
            explicitly.
          </p>
        </div>
        {canManage ? (
          <Button
            className="pe-button-primary"
            disabled={busy}
            onClick={() => choose({ kind: "create" })}
          >
            Create milestone
          </Button>
        ) : (
          <p className="text-sm">Read-only milestone access.</p>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(Object.keys(MILESTONE_HEALTH) as MilestoneHealth[]).map((value) => (
          <div key={value} className="pe-card border p-4">
            <dt>{MILESTONE_HEALTH[value].label}</dt>
            <dd className="text-2xl font-semibold">
              {query.data.summary[value]}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm">
        Health and task progress are calculated by the server. Done and
        cancelled tasks count as terminal; 100% progress does not achieve a
        milestone or release its gate.
      </p>
      <label className="block max-w-xs">
        <span>Filter milestone health</span>
        <select
          className="mt-1 w-full border p-2"
          value={health}
          onChange={(event) => setHealth(event.target.value)}
        >
          <option value="all">All health states</option>
          {(Object.keys(MILESTONE_HEALTH) as MilestoneHealth[]).map((value) => (
            <option key={value} value={value}>
              {MILESTONE_HEALTH[value].label}
            </option>
          ))}
        </select>
      </label>
      {initialMilestoneId &&
      !milestones.some((item) => item.id === initialMilestoneId) ? (
        <p role="status">
          The linked milestone is no longer available in this project.
        </p>
      ) : null}
      {milestones.length === 0 ? (
        <ProjectEdgeStatePanel
          kind="empty"
          title="No milestones yet"
          description="Add a checkpoint to organize delivery. Gates constrain work in later milestone positions until achieved."
        />
      ) : (
        <ol className="space-y-4">
          {milestones
            .filter((item) => health === "all" || item.health === health)
            .map((milestone) => (
              <li
                key={milestone.id}
                id={`milestone-${milestone.id}`}
                tabIndex={-1}
                className={`pe-card space-y-4 border p-5 ${initialMilestoneId === milestone.id ? "ring-2 ring-indigo-700" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3>
                      {milestone.sort_order + 1}. {milestone.title}
                    </h3>
                    <p className="text-sm">
                      Due {milestone.due_date} · Lifecycle: {milestone.status}
                    </p>
                  </div>
                  <MilestoneHealthBadge health={milestone.health} />
                </div>
                <p className="whitespace-pre-wrap text-sm">
                  {milestone.description || "No description."}
                </p>
                {milestone.is_gate ? (
                  <p className="flex items-center gap-2 text-sm">
                    <LockKeyhole
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                    {milestone.status === "achieved"
                      ? "Gate released."
                      : "Gate not achieved: tasks in later milestone positions remain gated."}
                  </p>
                ) : (
                  <p className="text-sm">Delivery checkpoint — not a gate.</p>
                )}
                <MilestoneProgress milestone={milestone} />
                {milestone.achieved_at ? (
                  <p className="text-sm">
                    Achieved{" "}
                    <time dateTime={milestone.achieved_at}>
                      {new Date(milestone.achieved_at).toLocaleString()}
                    </time>
                  </p>
                ) : null}
                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => choose({ kind: "edit", milestone })}
                    >
                      Edit {milestone.title}
                    </Button>
                    {["pending", "deferred"].includes(milestone.status) ? (
                      <Button
                        className="pe-button-primary"
                        disabled={busy}
                        onClick={() => choose({ kind: "achieve", milestone })}
                      >
                        Achieve {milestone.title}
                      </Button>
                    ) : null}
                    {milestone.status !== "achieved" ? (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => choose({ kind: "defer", milestone })}
                      >
                        Defer {milestone.title}
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => choose({ kind: "delete", milestone })}
                    >
                      Delete {milestone.title}
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
        </ol>
      )}
      {milestones.length > 0 &&
      !milestones.some((item) => health === "all" || item.health === health) ? (
        <p>No milestones match this health filter.</p>
      ) : null}
      {action ? (
        <MilestoneAction
          key={
            "milestone" in action
              ? `${action.kind}-${action.milestone.id}`
              : "create"
          }
          action={action}
          count={milestones.length}
          busy={busy}
          failure={failure}
          onClose={() => {
            if (!busy) setAction(null);
          }}
          onSave={save}
          projectId={projectId}
        />
      ) : null}
    </section>
  );
}

const milestoneSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(255),
  description: z.string(),
  due_date: z.iso.date("Choose a valid due date."),
  is_gate: z.boolean(),
  sort_order: z.string().regex(/^\d+$/, "Choose a position."),
});
const deferSchema = z.object({
  due_date: z.iso.date("Choose a valid date."),
  reason: z.string().max(500),
});
function MilestoneAction({
  action,
  count,
  busy,
  failure,
  onClose,
  onSave,
  projectId,
}: {
  action: Action;
  count: number;
  busy: boolean;
  failure: string | null;
  onClose: () => void;
  onSave: (work: () => Promise<unknown>, message: string) => Promise<void>;
  projectId: number;
}) {
  const id = useId();
  const milestone = "milestone" in action ? action.milestone : null;
  const form = useForm({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: milestone?.title ?? "",
      description: milestone?.description ?? "",
      due_date: milestone?.due_date ?? "",
      is_gate: milestone?.is_gate ?? false,
      sort_order: String(milestone?.sort_order ?? count),
    },
  });
  const defer = useForm({
    resolver: zodResolver(deferSchema),
    defaultValues: { due_date: "", reason: "" },
  });
  const [opener] = useState(() =>
    typeof document === "undefined"
      ? null
      : (document.activeElement as HTMLElement | null),
  );
  const labels = {
    create: "Create milestone",
    edit: "Edit milestone",
    achieve: "Achieve milestone",
    defer: "Defer milestone",
    delete: "Delete milestone",
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="projectedge-shell max-h-[90vh] overflow-y-auto [&>[data-slot=dialog-close]]:size-11"
        showCloseButton={!busy}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          if (opener?.isConnected) {
            event.preventDefault();
            opener.focus();
          }
        }}
      >
        <DialogTitle className="pr-12">{labels[action.kind]}</DialogTitle>
        <DialogDescription>
          {milestone?.title ?? "Add a project delivery checkpoint."}
        </DialogDescription>
        {busy ? <p role="status">Saving milestone…</p> : null}
        {failure ? (
          <p role="alert" className="pe-state-danger rounded-lg p-3 text-sm">
            {failure}
          </p>
        ) : null}
        {["create", "edit"].includes(action.kind) ? (
          <form
            className="pe-milestone-form space-y-3"
            onSubmit={form.handleSubmit((values) => {
              const payload: MilestoneInput = {
                ...values,
                description: values.description || null,
                sort_order: Number(values.sort_order),
              };
              return onSave(
                () =>
                  milestone
                    ? projectEdgeService.updateMilestone(milestone.id, payload)
                    : projectEdgeService.createMilestone(projectId, payload),
                milestone ? "Milestone updated." : "Milestone created.",
              );
            })}
          >
            <label htmlFor={`${id}-title`}>Title</label>
            <input
              id={`${id}-title`}
              {...form.register("title")}
              disabled={busy}
              maxLength={255}
            />
            <ErrorText message={form.formState.errors.title?.message} />
            <label htmlFor={`${id}-description`}>Description</label>
            <textarea
              id={`${id}-description`}
              {...form.register("description")}
              disabled={busy}
            />
            <label htmlFor={`${id}-date`}>Due date</label>
            <input
              id={`${id}-date`}
              type="date"
              {...form.register("due_date")}
              disabled={busy}
            />
            <ErrorText message={form.formState.errors.due_date?.message} />
            <label htmlFor={`${id}-position`}>Sequence position</label>
            <select
              id={`${id}-position`}
              {...form.register("sort_order")}
              disabled={busy}
            >
              {Array.from(
                { length: count + (milestone ? 0 : 1) },
                (_, position) => (
                  <option key={position} value={position}>
                    {position + 1}
                  </option>
                ),
              )}
            </select>
            <ErrorText message={form.formState.errors.sort_order?.message} />
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                {...form.register("is_gate")}
                disabled={busy}
              />
              Gate: block tasks in later milestone positions until achieved.
            </label>
            <p className="text-sm">
              Changing the position or gate flag can change which tasks are
              blocked. Updating dates here does not mark this milestone
              deferred.
            </p>
            <Button type="submit" className="pe-button-primary" disabled={busy}>
              Save milestone
            </Button>
          </form>
        ) : action.kind === "defer" ? (
          <form
            className="pe-milestone-form space-y-3"
            onSubmit={defer.handleSubmit((values) => {
              if (values.due_date <= milestone!.due_date) {
                defer.setError("due_date", {
                  message: "Choose a date after the current due date.",
                });
                return;
              }
              return onSave(
                () =>
                  projectEdgeService.deferMilestone(milestone!.id, {
                    due_date: values.due_date,
                    reason: values.reason || undefined,
                  }),
                "Milestone deferred.",
              );
            })}
          >
            <p>
              Current due date: {milestone!.due_date}. Deferral does not achieve
              or release a gate.
            </p>
            <label htmlFor={`${id}-new-date`}>New due date</label>
            <input
              id={`${id}-new-date`}
              type="date"
              {...defer.register("due_date")}
              disabled={busy}
            />
            <ErrorText message={defer.formState.errors.due_date?.message} />
            <label htmlFor={`${id}-reason`}>Deferral reason (optional)</label>
            <textarea
              id={`${id}-reason`}
              {...defer.register("reason")}
              disabled={busy}
              maxLength={500}
            />
            <ErrorText message={defer.formState.errors.reason?.message} />
            <Button type="submit" className="pe-button-primary" disabled={busy}>
              Confirm defer
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p>
              {action.kind === "achieve"
                ? `Confirm achievement at ${milestone!.progress.progress_pct}% task progress. Achievement is an explicit manager decision, even with unfinished work.${milestone!.is_gate ? " This releases its gate for later milestones." : ""}`
                : "Delete this checkpoint? Linked tasks will be unlinked, not deleted. Remaining positions and gate blocking will be recalculated."}
            </p>
            <Button
              className="pe-button-primary"
              disabled={busy}
              onClick={() =>
                onSave(
                  () =>
                    action.kind === "achieve"
                      ? projectEdgeService.achieveMilestone(milestone!.id)
                      : projectEdgeService.deleteMilestone(milestone!.id),
                  action.kind === "achieve"
                    ? "Milestone achieved."
                    : "Milestone deleted.",
                )
              }
            >
              {action.kind === "achieve" ? "Confirm achieve" : "Confirm delete"}
            </Button>
          </div>
        )}
        <Button
          variant="outline"
          type="button"
          disabled={busy}
          onClick={onClose}
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
function ErrorText({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm text-red-700">
      {message}
    </p>
  ) : null;
}
