export type ProjectEdgeProjectStatus = "draft" | "active" | "on_hold" | "completed" | "cancelled";
export type ProjectEdgePriority = "low" | "medium" | "high" | "critical";
export type ProjectEdgeProjectType =
  | "internal"
  | "hr_initiative"
  | "audit"
  | "compliance"
  | "it"
  | "other";

export type ProjectEdgePerson = {
  id: number;
  name: string;
  avatar?: string | null;
  employee_code?: string;
  employment_status?: string;
};

export interface ProjectEdgeProject {
  id: number;
  project_code: string;
  title: string;
  description: string | null;
  department_id: number;
  department?: ProjectEdgePerson;
  project_type: ProjectEdgeProjectType;
  manager_id: number;
  manager?: ProjectEdgePerson;
  start_date: string;
  end_date: string | null;
  status: ProjectEdgeProjectStatus;
  priority: ProjectEdgePriority;
  completion_pct: number;
  auto_close: boolean;
  is_billable: boolean;
  client_ref: string | null;
  tags: string[];
  warnings: Array<{ code: string; message: string }>;
  participants?: Array<{
    id: number;
    employee_id: number;
    role: string;
    employee?: ProjectEdgePerson;
  }>;
  summary?: {
    completion_pct: number;
    tasks_by_status: Record<string, number>;
    milestone_count: number;
    overdue_tasks: number;
    offboarding_open_tasks?: number;
    budget?: { planned: number; actual: number };
  };
  created_at: string;
  updated_at: string;
}

export interface ProjectEdgeTask {
  id: number;
  project_id: number;
  task_code: string;
  title: string;
  due_date: string | null;
  priority: ProjectEdgePriority;
  status: string;
  completion_pct: number;
  is_blocked: boolean;
  project?: Pick<ProjectEdgeProject, "id" | "project_code" | "title">;
}

export interface ProjectEdgeTaskInput {
  title: string;
  description: string | null;
  assigned_to: number;
  milestone_id: number | null;
  parent_task_id: number | null;
  start_date: string | null;
  due_date: string;
  estimated_hours: number;
  priority: ProjectEdgePriority;
}

export interface ProjectEdgePageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ProjectEdgePaginated<T> {
  items: T[];
  meta: ProjectEdgePageMeta;
}

export interface ProjectEdgeProjectFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: ProjectEdgeProjectStatus | "";
  priority?: ProjectEdgePriority | "";
  department_id?: number;
  manager_id?: number;
}

export interface CreateProjectEdgeProject {
  title: string;
  description?: string;
  department_id: number;
  project_type: ProjectEdgeProjectType;
  manager_id: number;
  start_date: string;
  end_date?: string;
  status: "draft" | "active";
  priority: ProjectEdgePriority;
  auto_close: boolean;
  is_billable: boolean;
  client_ref?: string;
  tags?: string[];
}
