import type {
  ResourceMatrix,
  ResourceWeek,
} from "@/types/projectedge-resources";

export const resourceFixture: ResourceWeek = {
  employee_id: "employee-uuid-a",
  employee_code: "EMP-001",
  available_capacity_hours: 40,
  scheduled_hours: 44,
  leave_hours: 4,
  allocated_hours: 20,
  remaining_capacity_hours: 20,
  utilization_pct: 50,
  is_overallocated: false,
  capacity_status: "configured",
  projects: [
    {
      allocation_id: 1,
      project_id: 7,
      project_code: "PE-7",
      project_title: "Launch",
      role_on_project: "Analyst",
      allocated_hours: 20,
      allocation_start: "2026-09-28",
      allocation_end: "2026-10-25",
    },
  ],
  capacity_days: [
    {
      date: "2026-09-28",
      source: "shift_assignment",
      scheduled_hours: 8,
      leave_hours: 0,
      available_hours: 8,
    },
  ],
};

export const resourceMatricesFixture: ResourceMatrix[] = [
  {
    week_start: "2026-09-28",
    week_end: "2026-10-04",
    resources: [
      resourceFixture,
      {
        ...resourceFixture,
        employee_id: "employee-uuid-b",
        employee_code: "EMP-002",
        allocated_hours: 50,
        remaining_capacity_hours: -10,
        utilization_pct: 125,
        is_overallocated: true,
        projects: [
          {
            ...resourceFixture.projects[0],
            allocation_id: 2,
            project_id: 8,
            project_code: "PE-8",
            project_title: "Migration",
            allocated_hours: 50,
          },
        ],
      },
    ],
    summary: {
      resource_count: 2,
      overallocated_count: 1,
      unconfigured_capacity_count: 0,
    },
  },
  {
    week_start: "2026-10-05",
    week_end: "2026-10-11",
    resources: [
      {
        ...resourceFixture,
        allocated_hours: 36,
        remaining_capacity_hours: 4,
        utilization_pct: 90,
      },
    ],
    summary: {
      resource_count: 1,
      overallocated_count: 0,
      unconfigured_capacity_count: 0,
    },
  },
  {
    week_start: "2026-10-12",
    week_end: "2026-10-18",
    resources: [
      {
        ...resourceFixture,
        available_capacity_hours: 0,
        scheduled_hours: 0,
        leave_hours: 0,
        allocated_hours: 20,
        remaining_capacity_hours: -20,
        utilization_pct: null,
        is_overallocated: true,
        capacity_status: "unconfigured",
        capacity_days: [],
      },
    ],
    summary: {
      resource_count: 1,
      overallocated_count: 1,
      unconfigured_capacity_count: 1,
    },
  },
  {
    week_start: "2026-10-19",
    week_end: "2026-10-25",
    resources: [],
    summary: {
      resource_count: 0,
      overallocated_count: 0,
      unconfigured_capacity_count: 0,
    },
  },
];
