export interface TimeEntry {
  id: number;
  task_id: number;
  project_id: number;
  employee_id: number;
  task: { id: number; task_code: string; title: string };
  project: { id: number; project_code: string; title: string };
  employee: { id: number; name: string | null };
  log_date: string;
  hours_logged: number;
  description: string | null;
  billable: boolean;
  status: "draft" | "submitted" | "approved" | "rejected";
  capabilities: {
    edit: boolean;
    submit: boolean;
    delete: boolean;
    approve: boolean;
    reject: boolean;
  };
  rejection_reason: string | null;
  approval_history: Array<{
    id: number;
    event: string;
    status: string;
    actor: string | null;
    at: string;
    reason: string | null;
  }>;
}
export interface TimeEntryInput {
  task_id: number;
  log_date: string;
  hours_logged: number;
  description: string;
  billable: boolean;
}
