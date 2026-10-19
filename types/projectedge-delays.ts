import type { ProjectEdgeTask } from "./projectedge";

export type DelayTask = ProjectEdgeTask & {
  assignee?: { id: number; name: string } | null;
  delay_submission?: { allowed: boolean };
};
export type TaskDelay = {
  id: number;
  task_id: number;
  task: {
    id: number;
    task_code: string;
    title: string;
    status: string;
    assignee: { id: number; name: string } | null;
    project_id: number;
    project: {
      id: number;
      project_code: string;
      title: string;
      end_date: string | null;
      status: string;
    };
    milestone: { id: number; title: string; due_date: string | null } | null;
  };
  original_due_date: string;
  current_due_date: string;
  new_due_date: string;
  stale: boolean;
  approval_blocked_reason: string | null;
  capabilities: { approve: boolean; reject: boolean };
  submitted_by: number;
  submitter: { id: number; name: string } | null;
  reviewer?: { id: number; name: string } | null;
  reason: string;
  delay_days: number;
  approval_status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};
