import type { ProjectEdgeTask, ProjectEdgePerson } from "./projectedge";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "on_hold"
  | "cancelled";
export interface BoardTask extends ProjectEdgeTask {
  status: TaskStatus;
  description: string | null;
  milestone_id: number | null;
  parent_task_id: number | null;
  assigned_to: number;
  assignee?: ProjectEdgePerson | null;
  start_date: string | null;
  estimated_hours: number;
  logged_hours: number;
  kanban_column: number;
}
export type BoardMove = {
  id: number;
  status: TaskStatus;
  position: number;
  reorder: boolean;
  changeStatus: boolean;
  delay_reason?: string;
  confirm_completion?: boolean;
};
export type Blocker = {
  blocker_type?: string;
  blocker_task_id?: number;
  blocker_task_code?: string;
  blocker_title?: string;
  milestone_id?: number;
  milestone_title?: string;
  message?: string;
};
export type TaskBlockState = {
  task_id: number;
  is_blocked: boolean;
  blocking_chain: Blocker[];
  reasons: string[];
};
export type BoardFailure = {
  message: string;
  reasons: string[];
  blockers: Blocker[];
  hint?: string;
};
