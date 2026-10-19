import axios from "axios";
import type {
  BoardFailure,
  BoardMove,
  BoardTask,
  TaskStatus,
} from "@/types/projectedge-board";

export const BOARD_COLUMNS = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review", label: "In Review" },
  { status: "done", label: "Done" },
] as const;
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

export function sortedColumn(
  tasks: BoardTask[],
  status: TaskStatus,
): BoardTask[] {
  return tasks
    .filter((task) => task.status === status)
    .sort(
      (a, b) =>
        a.kanban_column - b.kanban_column ||
        (a.due_date ?? "").localeCompare(b.due_date ?? "") ||
        a.id - b.id,
    );
}

// Pending display projection only. No dependency/transition rules are inferred in the browser.
export function projectMove(tasks: BoardTask[], move: BoardMove): BoardTask[] {
  const moved = tasks.find((task) => task.id === move.id);
  if (!moved) return tasks;
  const target = sortedColumn(
    tasks.filter((task) => task.id !== move.id),
    move.status,
  );
  target.splice(Math.min(move.position, target.length), 0, {
    ...moved,
    status: move.status,
  });
  const positions = new Map(
    target.map((task, position) => [task.id, position]),
  );
  return tasks.map((task) =>
    task.id === move.id
      ? { ...task, status: move.status, kanban_column: positions.get(task.id)! }
      : positions.has(task.id)
        ? { ...task, kanban_column: positions.get(task.id)! }
        : task,
  );
}

export function boardFailure(error: unknown): BoardFailure {
  if (!axios.isAxiosError(error))
    return {
      message: "The move could not be saved. Refresh the board and try again.",
      reasons: [],
      blockers: [],
    };
  const body = error.response?.data;
  const envelope = body?.error;
  const fieldErrors = envelope?.field_errors ?? body?.errors;
  const fields =
    fieldErrors && typeof fieldErrors === "object"
      ? Object.values(fieldErrors)
          .flat()
          .filter((value): value is string => typeof value === "string")
      : [];
  return {
    message:
      envelope?.message ?? body?.message ?? "The move could not be saved.",
    reasons: Array.isArray(envelope?.context?.reasons)
      ? envelope.context.reasons
      : fields,
    blockers: Array.isArray(envelope?.context?.blocking_chain)
      ? envelope.context.blocking_chain
      : [],
    hint: envelope?.hint,
  };
}
