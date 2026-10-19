import type {
  BoardTask,
  TaskBlockState,
  TaskStatus,
} from "./projectedge-board";
import type { DependencyType } from "./projectedge-gantt";

export type TaskDetail = BoardTask & {
  milestone: { id: number; title: string; status: string } | null;
  parent: { id: number; task_code: string; title: string } | null;
  subtasks: Array<{
    id: number;
    task_code: string;
    title: string;
    status: TaskStatus;
    completion_pct: number;
  }>;
  dependencies: Array<{
    id: number;
    depends_on_task_id: number;
    dependency_type: DependencyType;
    lag_days: number;
    blocker?: {
      id: number;
      task_code: string;
      title: string;
      status: string;
    } | null;
  }>;
  block_state: TaskBlockState;
  allowed_transitions: TaskStatus[];
  capabilities: {
    edit: boolean;
    comment: boolean;
    attachments: boolean;
    dependencies: boolean;
    activity: boolean;
  };
  mention_candidates: Array<{ id: number; name: string }>;
  comment_count: number;
  comments: Array<{
    id: number;
    parent_comment_id: number | null;
    body: string;
    mentions: number[];
    author: { id: number; name: string };
    created_at: string;
  }>;
  attachments: Array<{
    id: number;
    file_name: string;
    file_size_kb: number;
    mime_type: string;
    uploaded_by: string | null;
    created_at: string;
  }>;
  attachment_policy: { max_bytes: number; allowed_mimes: string[] };
  time_summary: { estimated_hours: number; logged_hours: number };
  activity: Array<{
    id: number;
    event_type: string;
    actor: string | null;
    created_at: string;
  }>;
};
