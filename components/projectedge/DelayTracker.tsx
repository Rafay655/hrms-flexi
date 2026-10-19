"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { requestedDueDate } from "@/lib/projectedge-delays";
import type { DelayTask, TaskDelay } from "@/types/projectedge-delays";
import { ProjectEdgeStatePanel } from "./StatePanel";

function failure(error: unknown) {
  if (!isAxiosError(error))
    return "The delay action failed. Please retry; your draft has been retained.";
  const parsed = boardFailure(error);
  return [parsed.message, ...parsed.reasons].filter(Boolean).join(" ");
}

export function DelayTracker() {
  const scope = useAppSelector(
    (state) => `${state.auth.company?.id}-${state.auth.user?.id}`,
  );
  return <DelayWorkspace key={scope} scope={scope} />;
}

function DelayWorkspace({ scope }: { scope: string }) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const submit = permissions.includes("projectedge.delay.submit");
  const review = permissions.includes("projectedge.delay.approve");
  const browseTasks =
    submit &&
    permissions.includes("projectedge.task.view") &&
    permissions.includes("projectedge.project.view");
  const [mine, setMine] = useState(!review);
  const ownQueue = mine || !review;
  const [page, setPage] = useState(1);
  const [choosing, setChoosing] = useState(false);
  const [task, setTask] = useState<DelayTask | null>(null);
  const [selected, setSelected] = useState<TaskDelay | null>(null);
  const [receipt, setReceipt] = useState<TaskDelay | null>(null);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["projectedge", "delays", scope, ownQueue, page],
    queryFn: ({ signal }) =>
      projectEdgeService.pendingDelays(ownQueue, page, signal),
    enabled: submit || review,
    retry: false,
  });
  const saved = async (result: TaskDelay) => {
    setReceipt(result);
    // Date changes affect the board, task workspace, schedule and project summary.
    await client.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] === "projectedge",
    });
    setTask(null);
    setSelected(null);
    setChoosing(false);
  };
  if (!submit && !review)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Delay access required"
        description="Delay-submit or delay-approve permission is required."
      />
    );
  return (
    <section className="space-y-5" aria-label="Delay tracker workspace">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Delivery date requests</h2>
          <p className="text-sm text-slate-600">
            Requests do not change task dates until approved. Only pending
            requests are listed.
          </p>
        </div>
        <div className="flex gap-2">
          {browseTasks && (
            <Button
              data-delay-submit
              onClick={() => {
                setReceipt(null);
                setChoosing(true);
              }}
            >
              Submit delay
            </Button>
          )}
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => {
              void query.refetch();
            }}
          >
            {query.isFetching ? "Refreshing…" : "Refresh requests"}
          </Button>
        </div>
      </div>
      {submit && !browseTasks && (
        <p className="pe-state-info rounded border p-3 text-sm">
          Task and project view access are required to choose a task for
          submission. Your own pending requests remain available.
        </p>
      )}
      {review && (
        <div className="flex flex-wrap gap-2" aria-label="Request list scope">
          <Button
            variant={ownQueue ? "outline" : "default"}
            aria-pressed={!ownQueue}
            onClick={() => {
              setMine(false);
              setPage(1);
              setSelected(null);
            }}
          >
            Review queue
          </Button>
          <Button
            variant={ownQueue ? "default" : "outline"}
            aria-pressed={ownQueue}
            onClick={() => {
              setMine(true);
              setPage(1);
              setSelected(null);
            }}
          >
            My pending requests
          </Button>
        </div>
      )}
      <p className="text-sm text-slate-600">
        {ownQueue
          ? "Only requests submitted by you are shown."
          : "Your authorized project-manager / company review scope is applied by the server."}
      </p>
      {receipt && (
        <section
          role="status"
          className="pe-state-success space-y-2 rounded border p-4"
          aria-label="Last confirmed delay action"
        >
          <h3 className="font-semibold">Request {receipt.approval_status}</h3>
          <p>
            {receipt.task.task_code} · {receipt.task.title}
          </p>
          <p>
            Original due: {receipt.original_due_date} · Requested due:{" "}
            {receipt.new_due_date} · Current due: {receipt.current_due_date}
          </p>
          {receipt.reviewer_note && (
            <p className="whitespace-pre-wrap break-words">
              Reviewer note: {receipt.reviewer_note}
            </p>
          )}
          <p className="text-sm">
            This is the last confirmed action in this session, not a complete
            request history.
          </p>
        </section>
      )}
      {query.isPending ? (
        <div className="pe-card min-h-48 p-6" role="status" aria-busy="true">
          Loading pending requests…
        </div>
      ) : query.isError ? (
        <ProjectEdgeStatePanel
          kind="error"
          title="Pending requests unavailable"
          description="The request failed or your access changed. Cached requests are not shown."
          action={{
            label: "Retry requests",
            onClick: () => {
              void query.refetch();
            },
          }}
        />
      ) : (
        <>
          <div className="text-sm" role="status">
            {query.data.meta.total} pending requests · Page {page} of{" "}
            {Math.max(1, query.data.meta.last_page)}
          </div>
          {!query.data.items.length ? (
            <div className="pe-card p-6">
              <h3 className="font-semibold">No pending requests</h3>
              <p className="mt-2 text-sm">
                No requests are awaiting review in this scope. Approved and
                rejected requests are not part of this queue.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {query.data.items.map((delay) => (
                <li key={delay.id} className="pe-card min-w-0 space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="break-words font-semibold">
                        {delay.task.task_code} · {delay.task.title}
                      </h3>
                      <p className="text-sm">
                        {delay.task.project.project_code} ·{" "}
                        {delay.task.project.title}
                      </p>
                    </div>
                    <span className="pe-state-warning rounded border px-2 py-1 text-sm">
                      Pending
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt>Original due</dt>
                      <dd className="font-semibold">
                        {delay.original_due_date}
                      </dd>
                    </div>
                    <div>
                      <dt>Requested due</dt>
                      <dd className="font-semibold">
                        {delay.new_due_date} (+{delay.delay_days} days)
                      </dd>
                    </div>
                    <div>
                      <dt>Current due</dt>
                      <dd>{delay.current_due_date}</dd>
                    </div>
                    <div>
                      <dt>Assignee</dt>
                      <dd>{delay.task.assignee?.name ?? "Unassigned"}</dd>
                    </div>
                    <div>
                      <dt>Requested by</dt>
                      <dd>{delay.submitter?.name ?? "Former user"}</dd>
                    </div>
                  </dl>
                  <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm">
                    {delay.reason}
                  </p>
                  {delay.approval_blocked_reason && (
                    <p className="pe-state-warning rounded border p-2 text-sm">
                      Approval unavailable: {delay.approval_blocked_reason} The
                      request can still be rejected by an authorized reviewer.
                    </p>
                  )}
                  <Button variant="outline" onClick={() => setSelected(delay)}>
                    {review &&
                    (delay.capabilities.approve || delay.capabilities.reject)
                      ? "Review request"
                      : "View request"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={page}
            last={query.data.meta.last_page}
            busy={query.isFetching}
            change={setPage}
            label="requests"
          />
        </>
      )}
      {choosing && !task && browseTasks && (
        <TaskPicker
          scope={scope}
          onClose={() => setChoosing(false)}
          onChoose={setTask}
        />
      )}
      {task && browseTasks && (
        <SubmitDialog
          task={task}
          onClose={() => {
            setTask(null);
            setChoosing(false);
          }}
          onSaved={saved}
        />
      )}
      {selected && !query.isError && (
        <ReviewDialog
          delay={selected}
          allowReview={review}
          onClose={() => setSelected(null)}
          onSaved={saved}
        />
      )}
    </section>
  );
}

function Pagination({
  page,
  last,
  busy,
  change,
  label,
}: {
  page: number;
  last: number;
  busy: boolean;
  change: (page: number) => void;
  label: string;
}) {
  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        disabled={busy || page <= 1}
        onClick={() => change(page - 1)}
      >
        Previous {label}
      </Button>
      <Button
        variant="outline"
        disabled={busy || page >= last}
        onClick={() => change(page + 1)}
      >
        Next {label}
      </Button>
    </div>
  );
}

function DelayDialog({
  title,
  description,
  busy,
  onClose,
  children,
}: {
  title: string;
  description: string;
  busy: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="projectedge-shell max-h-[90vh] overflow-y-auto sm:max-w-xl"
        showCloseButton={!busy}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (opener?.isConnected) opener.focus();
          else
            document
              .querySelector<HTMLButtonElement>("[data-delay-submit]")
              ?.focus();
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function TaskPicker({
  scope,
  onClose,
  onChoose,
}: {
  scope: string;
  onClose: () => void;
  onChoose: (task: DelayTask) => void;
}) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["projectedge", "delay-tasks", scope, search, page],
    queryFn: ({ signal }) =>
      projectEdgeService.delayTasks(search, page, signal),
    retry: false,
  });
  return (
    <DelayDialog
      title="Choose task for delay"
      description="Search accessible tasks by title or code. Only tasks the server permits you to delay can be selected; completed tasks and tasks with pending requests are excluded from selection."
      busy={false}
      onClose={onClose}
    >
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
          setPage(1);
        }}
      >
        <label className="min-w-0 flex-1">
          Task search
          <input
            className="mt-1 min-h-11 w-full rounded border px-3"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={255}
          />
        </label>
        <Button type="submit">Search tasks</Button>
      </form>
      {query.isPending ? (
        <p role="status">Loading tasks…</p>
      ) : query.isError ? (
        <p role="alert">
          Tasks unavailable.{" "}
          <Button
            variant="outline"
            onClick={() => {
              void query.refetch();
            }}
          >
            Retry tasks
          </Button>
        </p>
      ) : (
        <>
          <p className="text-sm">
            Page {page} of {Math.max(1, query.data.meta.last_page)} ·{" "}
            {query.data.meta.total} accessible tasks. Search or change page to
            find another task.
          </p>
          {!query.data.items.length && (
            <p>No tasks found. Try another search.</p>
          )}
          {query.data.items.length > 0 &&
            !query.data.items.some(
              (item) => item.delay_submission?.allowed,
            ) && <p>No eligible tasks on this page.</p>}
          <ul className="space-y-2">
            {query.data.items.map((item) => (
              <li key={item.id} className="rounded border p-3">
                <p className="font-semibold">
                  {item.task_code} · {item.title}
                </p>
                <p className="text-sm">
                  {item.project?.project_code} · {item.project?.title} · Due{" "}
                  {item.due_date} · {item.assignee?.name ?? "Unassigned"}
                </p>
                <Button
                  className="mt-2"
                  variant="outline"
                  disabled={!item.delay_submission?.allowed}
                  onClick={() => onChoose(item)}
                >
                  Choose {item.task_code}
                </Button>
                {!item.delay_submission?.allowed && (
                  <p className="mt-1 text-sm">
                    Not eligible: access, terminal state, or an existing pending
                    request.
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            last={query.data.meta.last_page}
            busy={query.isFetching}
            change={setPage}
            label="tasks"
          />
        </>
      )}
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
    </DelayDialog>
  );
}

function SubmitDialog({
  task,
  onClose,
  onSaved,
}: {
  task: DelayTask;
  onClose: () => void;
  onSaved: (delay: TaskDelay) => Promise<void>;
}) {
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const revised = requestedDueDate(task.due_date, days);
  return (
    <DelayDialog
      title="Submit delay request"
      description={`${task.task_code} · ${task.title}. The server checks ownership, pending requests and the project end date. Dates remain unchanged until approval.`}
      busy={busy}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (lock.current) return;
          if (!revised || !reason.trim() || reason.trim().length > 2000) {
            setError(
              "Enter 1–365 whole delay days and a reason of 1–2000 characters.",
            );
            return;
          }
          lock.current = true;
          setBusy(true);
          setError("");
          try {
            const result = await projectEdgeService.submitDelay(task.id, {
              delay_days: Number(days),
              reason: reason.trim(),
            });
            toast.success("Delay request submitted");
            await onSaved(result);
          } catch (caught) {
            setError(failure(caught));
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        {error && (
          <p
            role="alert"
            className="pe-state-danger rounded border p-3 text-sm"
          >
            {error}
          </p>
        )}
        <p className="text-sm">
          {task.project?.project_code} · {task.project?.title}
        </p>
        <p>
          Current due: {task.due_date} · Requested due:{" "}
          <strong>{revised ?? "Choose valid delay days"}</strong>
        </p>
        <fieldset disabled={busy} className="space-y-3">
          <label className="block">
            Delay days
            <input
              className="mt-1 min-h-11 w-full rounded border px-3"
              inputMode="numeric"
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
          </label>
          <label className="block">
            Reason
            <textarea
              className="mt-1 min-h-28 w-full rounded border p-3"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={2000}
            />
          </label>
        </fieldset>
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Confirm submission"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DelayDialog>
  );
}

function ReviewDialog({
  delay,
  allowReview,
  onClose,
  onSaved,
}: {
  delay: TaskDelay;
  allowReview: boolean;
  onClose: () => void;
  onSaved: (delay: TaskDelay) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const project = delay.task.project;
  const milestone = delay.task.milestone;
  return (
    <DelayDialog
      title="Delay request details"
      description={`${delay.task.task_code} · ${delay.task.title}`}
      busy={busy}
      onClose={onClose}
    >
      <div className="space-y-3 text-sm">
        <p>
          Project: {project.project_code} · {project.title}
        </p>
        <p>
          Assignee: {delay.task.assignee?.name ?? "Unassigned"} · Requested by:{" "}
          {delay.submitter?.name ?? "Former user"}
        </p>
        <p>
          Status: {delay.approval_status} · Delay: {delay.delay_days} calendar
          days
        </p>
        <p>
          Original due: {delay.original_due_date} · Current due:{" "}
          {delay.current_due_date} · Requested due: {delay.new_due_date}
        </p>
        <div>
          <h3 className="font-semibold">Full reason</h3>
          <p className="whitespace-pre-wrap break-words">{delay.reason}</p>
        </div>
        <section
          className="rounded border p-3"
          aria-label="Project impact context"
        >
          <h3 className="font-semibold">Project impact context</h3>
          <p>
            Project deadline: {project.end_date ?? "Not configured"} · Project
            status: {project.status}
          </p>
          {project.end_date && (
            <p>
              {delay.new_due_date > project.end_date
                ? "Requested date exceeds the current project deadline."
                : "Requested date is within the current project deadline."}
            </p>
          )}
          {milestone && (
            <p>
              Milestone: {milestone.title} · Due{" "}
              {milestone.due_date ?? "Not configured"}
              {milestone.due_date &&
                delay.new_due_date > milestone.due_date &&
                " · Requested task date is after this milestone."}
            </p>
          )}
          <p>
            Approval changes this task’s due date only. Project deadlines,
            milestone dates and dependent task dates are not automatically
            moved. No schedule or critical-path impact is inferred here.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              className="underline"
              href={`/projectedge/projects/${project.id}`}
            >
              Project overview
            </Link>
            <Link
              className="underline"
              href={`/projectedge/projects/${project.id}/board?task=${delay.task_id}`}
            >
              Open task board
            </Link>
          </div>
        </section>
        {delay.approval_blocked_reason && (
          <p className="pe-state-warning rounded border p-3">
            Approval unavailable: {delay.approval_blocked_reason}
          </p>
        )}
        {delay.reviewer_note && (
          <p className="whitespace-pre-wrap break-words">
            Reviewer note: {delay.reviewer_note}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="pe-state-danger rounded border p-3 text-sm">
          {error}
        </p>
      )}
      {allowReview &&
        (delay.capabilities.approve || delay.capabilities.reject) && (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!decision || lock.current) return;
              if (note.trim().length > 2000) {
                setError("Reviewer note cannot exceed 2000 characters.");
                return;
              }
              lock.current = true;
              setBusy(true);
              setError("");
              try {
                const result = await projectEdgeService.reviewDelay(
                  delay.id,
                  decision,
                  note,
                );
                toast.success(`Delay request ${result.approval_status}`);
                await onSaved(result);
              } catch (caught) {
                setError(failure(caught));
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          >
            <label className="block">
              Reviewer note (optional)
              <textarea
                className="mt-1 min-h-24 w-full rounded border p-3"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={2000}
                disabled={busy}
              />
            </label>
            {!decision ? (
              <div className="flex gap-3">
                <Button
                  type="button"
                  disabled={!delay.capabilities.approve}
                  onClick={() => setDecision("approve")}
                >
                  Approve request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!delay.capabilities.reject}
                  onClick={() => setDecision("reject")}
                >
                  Reject request
                </Button>
              </div>
            ) : (
              <>
                <p className="font-semibold">
                  {decision === "approve"
                    ? `Confirm changing the task due date to ${delay.new_due_date}?`
                    : "Confirm rejecting this request and keeping the current task due date?"}
                </p>
                <div className="flex gap-3">
                  <Button type="submit" disabled={busy}>
                    {busy
                      ? "Saving decision…"
                      : decision === "approve"
                        ? "Confirm approval"
                        : "Confirm rejection"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setDecision(null)}
                  >
                    Back to review
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      <Button variant="outline" disabled={busy} onClick={onClose}>
        Close request
      </Button>
    </DelayDialog>
  );
}
