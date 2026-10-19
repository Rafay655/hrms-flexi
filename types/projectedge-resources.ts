export interface ResourceProjectAllocation {
  allocation_id: number;
  project_id: number;
  project_code: string | null;
  project_title: string | null;
  role_on_project: string | null;
  allocated_hours: number;
  allocation_start: string;
  allocation_end: string;
}

export interface ResourceWeek {
  // The matrix uses the PeopleHub public UUID, not the numeric employee PK.
  employee_id: string;
  employee_code: string;
  available_capacity_hours: number;
  scheduled_hours: number;
  leave_hours: number;
  allocated_hours: number;
  remaining_capacity_hours: number;
  utilization_pct: number | null;
  is_overallocated: boolean;
  capacity_status: "configured" | "unconfigured";
  projects: ResourceProjectAllocation[];
  capacity_days: Array<{
    date: string;
    source: string;
    scheduled_hours: number;
    leave_hours: number;
    available_hours: number;
  }>;
}

export interface ResourceMatrix {
  week_start: string;
  week_end: string;
  resources: ResourceWeek[];
  summary: {
    resource_count: number;
    overallocated_count: number;
    unconfigured_capacity_count: number;
  };
}
