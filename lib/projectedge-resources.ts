import type {
  ResourceMatrix,
  ResourceWeek,
} from "@/types/projectedge-resources";
import { dateFromDay, dayNumber } from "./projectedge-gantt";
import { weekDays } from "./projectedge-time";

export type UtilizationState =
  | "healthy"
  | "caution"
  | "overloaded"
  | "unknown"
  | "no_allocation";
export const resourceStates: Record<
  UtilizationState,
  { label: string; className: string }
> = {
  healthy: { label: "Healthy", className: "pe-state-success" },
  caution: { label: "Caution", className: "pe-state-warning" },
  overloaded: { label: "Overloaded", className: "pe-state-danger" },
  unknown: { label: "Capacity unknown", className: "pe-state-info" },
  no_allocation: { label: "No allocation", className: "pe-state-neutral" },
};

export const resourceWeeks = (date: string, count: 4 | 8): string[] => {
  const monday = dayNumber(weekDays(date)[0]);
  return Array.from({ length: count }, (_, index) =>
    dateFromDay(monday + index * 7),
  );
};

export function utilizationState(row?: ResourceWeek): UtilizationState {
  if (!row) return "no_allocation";
  // Preserve the server's zero-capacity overload signal without fabricating a
  // percentage. Missing configuration must never be displayed as healthy.
  if (row.is_overallocated) return "overloaded";
  if (
    row.capacity_status !== "configured" ||
    row.utilization_pct === null ||
    !Number.isFinite(row.utilization_pct)
  )
    return "unknown";
  if (row.utilization_pct > 100) return "overloaded";
  return row.utilization_pct >= 80 ? "caution" : "healthy";
}

export interface ResourceHeatmapRow {
  employeeId: string;
  employeeCode: string;
  weeks: Array<ResourceWeek | undefined>;
}

export function resourceRows(matrices: ResourceMatrix[]): ResourceHeatmapRow[] {
  const rows = new Map<string, ResourceHeatmapRow>();
  matrices.forEach((matrix, index) => {
    for (const resource of matrix.resources) {
      const row = rows.get(resource.employee_id) ?? {
        employeeId: resource.employee_id,
        employeeCode: resource.employee_code || resource.employee_id,
        weeks: Array.from({ length: matrices.length }, () => undefined),
      };
      row.weeks[index] = resource;
      rows.set(row.employeeId, row);
    }
  });
  return [...rows.values()].sort((a, b) =>
    a.employeeCode.localeCompare(b.employeeCode),
  );
}

export function filterResourceRows(
  rows: ResourceHeatmapRow[],
  filters: {
    search: string;
    projectId?: number;
    state: UtilizationState | "all";
  },
): ResourceHeatmapRow[] {
  const search = filters.search.trim().toLowerCase();
  return rows.filter(
    (row) =>
      row.employeeCode.toLowerCase().includes(search) &&
      (!filters.projectId ||
        row.weeks.some((week) =>
          week?.projects.some(
            (project) => project.project_id === filters.projectId,
          ),
        )) &&
      (filters.state === "all" ||
        row.weeks.some((week) => utilizationState(week) === filters.state)),
  );
}
