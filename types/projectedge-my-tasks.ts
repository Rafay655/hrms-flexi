import type { ProjectEdgeTask } from "./projectedge";
import type { TaskStatus } from "./projectedge-board";

export type PersonalTask = ProjectEdgeTask & {
  status: TaskStatus;
  milestone: {
    id: number;
    title: string;
    due_date: string | null;
    status: string;
  } | null;
};
