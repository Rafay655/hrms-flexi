export type DependencyType = "FS" | "SS" | "FF" | "SF";
export type GanttTask = {
  id: number;
  code: string;
  title: string;
  parent_task_id: number | null;
  milestone_id: number | null;
  start_date: string | null;
  end_date: string;
  status: string;
  completion_pct: number;
  is_blocked: boolean;
  estimated_hours: number;
  assignee: import("./projectedge").ProjectEdgePerson | null;
  earliest_start: string;
  earliest_finish: string;
  latest_start: string;
  latest_finish: string;
  earliest_start_day: number;
  earliest_finish_day: number;
  latest_start_day: number;
  latest_finish_day: number;
  duration_days: number;
  total_float_days: number;
  is_critical: boolean;
};
export type GanttMilestone = {
  id: number;
  title: string;
  due_date: string;
  is_gate: boolean;
  status: string;
  sort_order: number;
};
export type GanttDependency = {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  type: DependencyType;
  lag_days: number;
};
export type ProjectEdgeGantt = {
  project: {
    id: number;
    code: string;
    title: string;
    start_date: string;
    end_date: string | null;
    status: string;
    completion_pct: number;
  };
  schedule: {
    duration_days: number;
    forecast_end_date: string | null;
    project_slack_days: number | null;
    critical_task_ids: number[];
  };
  tasks: GanttTask[];
  milestones: GanttMilestone[];
  dependencies: GanttDependency[];
};
