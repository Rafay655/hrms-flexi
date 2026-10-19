"use client";

import { useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { ProjectEdgeStatePanel } from "./StatePanel";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { useAppSelector } from "@/store/hooks";
import { projectEdgeService } from "@/services/projectedge";
import {
  BOARD_COLUMNS,
  STATUS_LABELS,
  boardFailure,
  projectMove,
  sortedColumn,
} from "@/lib/projectedge-board";
import type {
  Blocker,
  BoardFailure,
  BoardMove,
  BoardTask,
  TaskStatus,
} from "@/types/projectedge-board";

export function ProjectEdgeKanbanBoard({
  projectId,
  initialTaskId = null,
}: {
  projectId: number;
  initialTaskId?: number | null;
}) {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canView = permissions.includes("projectedge.task.view");
  const canStatus = permissions.includes("projectedge.task.status");
  const canReorder = permissions.includes("projectedge.task.manage");
  const queryClient = useQueryClient();
  const queryKey = ["projectedge", "board", projectId];
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => projectEdgeService.boardTasks(projectId, signal),
    enabled: canView && Number.isInteger(projectId) && projectId > 0,
    refetchOnWindowFocus: false,
  });
  const milestones = useQuery({
    queryKey: ["projectedge", "milestones", projectId],
    queryFn: () => projectEdgeService.projectMilestones(projectId),
    enabled: canView && permissions.includes("projectedge.project.view"),
  });
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(initialTaskId);
  const [dragId, setDragId] = useState<number | null>(null);
  const [requested, setRequested] = useState<BoardMove | null>(null);
  const [failure, setFailure] = useState<BoardFailure | null>(null);
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const mutation = useMutation({
    mutationFn: (move: BoardMove) => projectEdgeService.moveBoardTask(move),
    onMutate: async (move) => {
      setFailure(null);
      setNotice("Saving move…");
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardTask[]>(queryKey);
      if (previous)
        queryClient.setQueryData(queryKey, projectMove(previous, move));
      return { previous };
    },
    onSuccess: () => {
      setRequested(null);
      setNotice("Move saved.");
      toast.success("Move saved.");
    },
    onError: (error, _move, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      const details = boardFailure(error);
      setFailure(details);
      setNotice(
        "Move not saved. The card has been returned to its previous position.",
      );
      toast.error(details.message);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "milestone-report", projectId],
        }),
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "project", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "gantt", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "my-tasks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectedge", "block-state"],
        }),
      ]);
      busy.current = false;
    },
  });
  const tasks = query.data ?? [];
  const filtered = tasks.filter(
    (task) =>
      (!priority || task.priority === priority) &&
      `${task.task_code} ${task.title} ${task.assignee?.name ?? ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const filtering = Boolean(search.trim() || priority);
  const disabled = mutation.isPending || query.isFetching;
  const save = (move: BoardMove) => {
    if (busy.current) return;
    busy.current = true;
    mutation.mutate(move);
  };
  const propose = (id: number, status: TaskStatus, position: number) => {
    if (disabled || busy.current) return;
    const task = tasks.find((candidate) => candidate.id === id);
    if (!task) return;
    const changeStatus = status !== task.status;
    if (
      (changeStatus && !canStatus) ||
      (!changeStatus && (!canReorder || filtering))
    )
      return;
    const move: BoardMove = {
      id,
      status,
      position,
      reorder: canReorder,
      changeStatus,
    };
    if (changeStatus) {
      setFailure(null);
      setRequested(move);
    } else save(move);
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragId(null);
    if (!over || active.id === over.id) return;
    const targetTask = tasks.find((task) => task.id === Number(over.id));
    const column = BOARD_COLUMNS.find(
      (column) => over.id === `column-${column.status}`,
    );
    const status = targetTask?.status ?? column?.status;
    if (!status) return;
    const targetTasks = sortedColumn(
      tasks.filter((task) => task.id !== Number(active.id)),
      status,
    );
    propose(
      Number(active.id),
      status,
      targetTask
        ? Math.max(
            0,
            sortedColumn(tasks, status).findIndex(
              (task) => task.id === targetTask.id,
            ),
          )
        : targetTasks.length,
    );
  };
  const selected = tasks.find((task) => task.id === selectedId);
  const active = tasks.find((task) => task.id === dragId);
  const pendingTask = tasks.find((task) => task.id === requested?.id);
  const titleForMilestone = (task: BoardTask) =>
    milestones.data?.find((milestone) => milestone.id === task.milestone_id)
      ?.title ??
    (task.milestone_id ? `Milestone #${task.milestone_id}` : "No milestone");

  if (!canView)
    return (
      <ProjectEdgeStatePanel
        kind="access"
        title="Board access required"
        description="Your role does not include task access."
      />
    );
  if (!Number.isInteger(projectId) || projectId <= 0)
    return (
      <ProjectEdgeStatePanel
        kind="error"
        title="Project not found"
        description="The project address is not valid."
      />
    );
  if (query.isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        className="pe-card h-96 animate-pulse border bg-slate-100 p-6"
      >
        <span className="sr-only">Loading project board</span>
      </div>
    );
  if (query.isError)
    return (
      <ProjectEdgeStatePanel
        kind="error"
        title="Board unavailable"
        description="We could not load all project tasks. No partial board is shown."
        action={{ label: "Try again", onClick: () => query.refetch() }}
      />
    );

  return (
    <section aria-label="Project Kanban board" className="space-y-4">
      <div className="pe-card flex flex-wrap items-end justify-between gap-3 border p-4">
        <div>
          <h2>Execution board</h2>
          <p className="text-sm text-slate-600">
            {tasks.length} tasks · Drag a handle or use card controls. Changes
            are pending until saved.
          </p>
        </div>
        <label className="text-sm">
          Search tasks
          <input
            className="mt-1 block w-full border px-3"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="text-sm">
          Priority
          <select
            className="mt-1 block border px-3"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="">All priorities</option>
            {["low", "medium", "high", "critical"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOther}
            onChange={(event) => setShowOther(event.target.checked)}
          />
          Show On Hold / Cancelled (
          {
            tasks.filter((task) =>
              ["on_hold", "cancelled"].includes(task.status),
            ).length
          }
          )
        </label>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => query.refetch()}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Refresh board
        </Button>
      </div>
      {filtering && canReorder ? (
        <p className="text-sm text-slate-600">
          Clear filters to reorder cards within a column. Status changes remain
          available.
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="text-sm">
        {notice}
      </p>
      {failure ? (
        <div
          role="alert"
          className="pe-state-danger space-y-2 rounded-xl border p-4"
        >
          <h3>Move not saved</h3>
          <p>{failure.message}</p>
          {failure.reasons.map((reason, index) => (
            <p key={index} className="text-sm">
              {reason}
            </p>
          ))}
          {failure.hint ? <p className="text-sm">{failure.hint}</p> : null}
          <BlockerLinks
            blockers={failure.blockers}
            projectId={projectId}
            onOpen={setSelectedId}
          />
        </div>
      ) : null}
      {tasks.length === 0 ? (
        <ProjectEdgeStatePanel
          kind="empty"
          title="No tasks yet"
          description="Create a task to start tracking delivery on this board."
        />
      ) : filtered.length === 0 ? (
        <ProjectEdgeStatePanel
          kind="empty"
          title="No matching tasks"
          description="Try another search or priority."
          action={{
            label: "Clear filters",
            onClick: () => {
              setSearch("");
              setPriority("");
            },
          }}
        />
      ) : null}
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setDragId(Number(active.id))}
        onDragCancel={() => setDragId(null)}
        onDragEnd={onDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press Space to pick up a card. Use arrow keys to move, Space to drop, and Escape to cancel. You may also use the Move to and Move up/down card controls.",
          },
        }}
      >
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {BOARD_COLUMNS.map(({ status, label }) => (
            <BoardColumn
              key={status}
              status={status}
              label={label}
              tasks={sortedColumn(filtered, status)}
              allTasks={sortedColumn(tasks, status)}
              disabled={disabled}
              canStatus={canStatus}
              canReorder={canReorder && !filtering}
              canDrag={canStatus || (canReorder && !filtering)}
              pendingId={
                mutation.isPending ? mutation.variables?.id : undefined
              }
              milestone={titleForMilestone}
              onOpen={setSelectedId}
              onMove={propose}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {active ? (
            <div className="pe-card max-w-xs border p-4 shadow-xl">
              <p className="text-xs">{active.task_code}</p>
              <p className="font-semibold">{active.title}</p>
              <p className="text-sm">Drop in a column to request a move.</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {showOther ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(["on_hold", "cancelled"] as const).map((status) => (
            <section
              key={status}
              aria-label={STATUS_LABELS[status]}
              className="pe-card space-y-3 border p-4"
            >
              <h3>
                {STATUS_LABELS[status]} ({sortedColumn(filtered, status).length}
                )
              </h3>
              {sortedColumn(filtered, status).map((task) => (
                <BoardCard
                  key={`${task.id}-${task.status}`}
                  task={task}
                  index={0}
                  count={1}
                  disabled={disabled}
                  canStatus={canStatus}
                  canReorder={false}
                  canDrag={false}
                  pending={
                    mutation.isPending && mutation.variables?.id === task.id
                  }
                  milestone={titleForMilestone(task)}
                  onOpen={setSelectedId}
                  onMove={propose}
                />
              ))}
              {sortedColumn(filtered, status).length === 0 ? (
                <p className="text-sm text-slate-600">
                  No tasks in this state.
                </p>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}
      {selected ? (
        <TaskDetailDrawer
          taskId={selected.id}
          projectId={projectId}
          onClose={() => setSelectedId(null)}
          onOpen={setSelectedId}
        />
      ) : null}
      {requested && pendingTask ? (
        <MoveConfirmation
          key={`${requested.id}-${requested.status}`}
          task={pendingTask}
          move={requested}
          pending={mutation.isPending}
          failure={failure}
          projectId={projectId}
          onOpen={(id) => {
            setRequested(null);
            setSelectedId(id);
          }}
          onClose={() => setRequested(null)}
          onSave={save}
        />
      ) : null}
    </section>
  );
}

function BoardColumn({
  status,
  label,
  tasks,
  allTasks,
  ...props
}: {
  status: TaskStatus;
  label: string;
  tasks: BoardTask[];
  allTasks: BoardTask[];
  disabled: boolean;
  canStatus: boolean;
  canReorder: boolean;
  canDrag: boolean;
  pendingId?: number;
  milestone: (task: BoardTask) => string;
  onOpen: (id: number) => void;
  onMove: (id: number, status: TaskStatus, position: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    disabled: props.disabled,
  });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${label} column`}
      className={`pe-card min-h-48 space-y-3 border p-3 ${isOver ? "ring-2 ring-indigo-700" : ""}`}
    >
      <h3 className="flex items-center justify-between px-1">
        {label}
        <span className="pe-state-neutral rounded-full border px-2 text-sm">
          {tasks.length}
        </span>
      </h3>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <BoardCard
            key={`${task.id}-${task.status}`}
            {...props}
            task={task}
            index={allTasks.findIndex((candidate) => candidate.id === task.id)}
            count={allTasks.length}
            milestone={props.milestone(task)}
            pending={props.pendingId === task.id}
          />
        ))}
      </SortableContext>
      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
          No tasks here. Drop a card to request a move.
        </p>
      ) : null}
    </section>
  );
}

function BoardCard({
  task,
  index,
  count,
  disabled,
  canStatus,
  canReorder,
  canDrag,
  pending,
  milestone,
  onOpen,
  onMove,
}: {
  task: BoardTask;
  index: number;
  count: number;
  disabled: boolean;
  canStatus: boolean;
  canReorder: boolean;
  canDrag: boolean;
  pending: boolean;
  milestone: string;
  onOpen: (id: number) => void;
  onMove: (id: number, status: TaskStatus, position: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: disabled || !canDrag });
  const [target, setTarget] = useState<TaskStatus>(task.status);
  return (
    <article
      id={`task-${task.id}`}
      ref={setNodeRef}
      aria-label={`${task.task_code}: ${task.title}`}
      aria-busy={pending}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
      className={`rounded-xl border bg-white p-3 ${pending ? "border-amber-600" : "border-slate-200"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-600">{task.task_code}</span>
        {canDrag ? (
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${task.title}`}
            disabled={disabled}
            className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-md hover:bg-slate-100 focus-visible:outline-2"
          >
            <GripVertical aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className="min-h-11 w-full cursor-pointer text-left font-semibold hover:underline focus-visible:outline-2"
      >
        {task.title}
      </button>
      <div className="my-2 flex flex-wrap gap-2">
        <ProjectStatusBadge status={task.status} />
        <span
          className={`rounded-full border px-2 py-1 text-xs capitalize ${["critical", "high"].includes(task.priority) ? "pe-state-warning" : "pe-state-neutral"}`}
        >
          {task.priority} priority
        </span>
        {task.is_blocked ? (
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className="pe-state-warning inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-lg border px-2 text-xs"
          >
            <LockKeyhole aria-hidden="true" className="size-4" />
            Blocked · View blockers
          </button>
        ) : null}
        {pending ? (
          <span className="text-xs font-semibold">Pending save</span>
        ) : null}
      </div>
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="sr-only">Assignee</dt>
          <dd>{task.assignee?.name ?? "Unassigned"}</dd>
        </div>
        <div>
          <dt className="inline text-slate-600">Due: </dt>
          <dd className="inline">{task.due_date ?? "Not set"}</dd>
        </div>
        <div>
          <dt className="sr-only">Milestone</dt>
          <dd>{milestone}</dd>
        </div>
        <div>
          <dt className="inline text-slate-600">Hours: </dt>
          <dd className="inline">
            {task.estimated_hours} estimated / {task.logged_hours} logged
          </dd>
        </div>
      </dl>
      {canStatus && !["done", "cancelled"].includes(task.status) ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-xs">
            Move {task.task_code} to
            <select
              className="mt-1 block w-full border px-2"
              value={target}
              disabled={disabled}
              onChange={(event) => setTarget(event.target.value as TaskStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <option value={status} key={status}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            disabled={disabled || target === task.status}
            onClick={() => onMove(task.id, target, Number.MAX_SAFE_INTEGER)}
          >
            Move
          </Button>
        </div>
      ) : null}
      {canReorder ? (
        <div className="mt-2 flex gap-2">
          <Button
            variant="ghost"
            disabled={disabled || index === 0}
            aria-label={`Move ${task.title} up`}
            onClick={() => onMove(task.id, task.status, index - 1)}
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            disabled={disabled || index === count - 1}
            aria-label={`Move ${task.title} down`}
            onClick={() => onMove(task.id, task.status, index + 1)}
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : null}
    </article>
  );
}

const moveSchema = z.object({
  delay_reason: z.string().trim().max(500),
  confirm_completion: z.boolean(),
});
function MoveConfirmation({
  task,
  move,
  pending,
  failure,
  projectId,
  onOpen,
  onClose,
  onSave,
}: {
  task: BoardTask;
  move: BoardMove;
  pending: boolean;
  failure: BoardFailure | null;
  projectId: number;
  onOpen: (id: number) => void;
  onClose: () => void;
  onSave: (move: BoardMove) => void;
}) {
  const form = useForm({
    resolver: zodResolver(moveSchema),
    defaultValues: { delay_reason: "", confirm_completion: false },
  });
  const needsConfirmation = move.status === "done" && task.completion_pct < 100;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent
        className="projectedge-shell max-h-[90vh] overflow-y-auto bg-white [&_[data-slot=dialog-close]]:size-11"
        showCloseButton={!pending}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document
            .getElementById(`task-${move.id}`)
            ?.querySelector("button")
            ?.focus();
        }}
      >
        <DialogTitle>
          Move {task.task_code} to {STATUS_LABELS[move.status]}?
        </DialogTitle>
        <DialogDescription>
          The server checks status permissions, dependencies and milestone gates
          before accepting this move.
        </DialogDescription>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            if (needsConfirmation && !values.confirm_completion) {
              form.setError("confirm_completion", {
                message: "Confirm completion to continue.",
              });
              return;
            }
            onSave({
              ...move,
              position: Math.min(move.position, 2147483647),
              ...values,
            });
          })}
        >
          <label className="block text-sm">
            Delay reason (required if past due)
            <textarea
              {...form.register("delay_reason")}
              disabled={pending}
              maxLength={500}
              className="mt-1 min-h-24 w-full border p-3"
            />
          </label>
          {needsConfirmation ? (
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...form.register("confirm_completion")}
                disabled={pending}
              />
              Confirm completion: set progress from {task.completion_pct}% to
              100%.
            </label>
          ) : null}
          {form.formState.errors.confirm_completion ? (
            <p role="alert" className="text-sm text-red-700">
              {form.formState.errors.confirm_completion.message}
            </p>
          ) : null}
          {form.formState.errors.delay_reason ? (
            <p role="alert" className="text-sm text-red-700">
              {form.formState.errors.delay_reason.message}
            </p>
          ) : null}
          {failure ? (
            <div role="alert" className="space-y-2 text-sm text-red-700">
              <p>
                {failure.message} {failure.reasons.join(" ")}
              </p>
              <BlockerLinks
                blockers={failure.blockers}
                projectId={projectId}
                onOpen={onOpen}
              />
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="submit"
              className="pe-button-primary"
              disabled={pending}
            >
              {pending ? "Saving move…" : "Confirm move"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BlockerLinks({
  blockers,
  projectId,
  onOpen,
}: {
  blockers: Blocker[];
  projectId: number;
  onOpen: (id: number) => void;
}) {
  return (
    <ul className="space-y-2">
      {blockers.map((blocker, index) => (
        <li key={index} className="text-sm">
          {blocker.message}{" "}
          {blocker.blocker_task_id ? (
            <a
              href={`/projectedge/projects/${projectId}/board?task=${blocker.blocker_task_id}`}
              onClick={(event) => {
                if (!event.ctrlKey && !event.metaKey) {
                  event.preventDefault();
                  onOpen(blocker.blocker_task_id!);
                }
              }}
              className="inline-flex min-h-11 items-center underline"
            >
              Open{" "}
              {blocker.blocker_task_code ??
                blocker.blocker_title ??
                `task ${blocker.blocker_task_id}`}
            </a>
          ) : blocker.milestone_id ? (
            <a
              href={`/projectedge/projects/${projectId}/milestones?milestone=${blocker.milestone_id}`}
              className="inline-flex min-h-11 items-center underline"
            >
              View gate {blocker.milestone_title}
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
