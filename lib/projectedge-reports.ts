import type { ReportId, ReportValue } from "@/types/projectedge-reports";

export const REPORTS: {
  id: ReportId;
  title: string;
  permissions: string[];
  any?: string[];
  requiredProject?: boolean;
  dated?: boolean;
}[] = [
  {
    id: "project-status",
    title: "Project Status Dashboard",
    permissions: ["projectedge.project.view"],
  },
  {
    id: "gantt-progress",
    title: "Gantt Progress Report",
    permissions: ["projectedge.project.view", "projectedge.gantt.view"],
    requiredProject: true,
  },
  {
    id: "department-completion",
    title: "Task Completion by Department",
    permissions: ["projectedge.project.view", "projectedge.task.view"],
    any: ["projectedge.delay.submit", "projectedge.delay.approve"],
    dated: true,
  },
  {
    id: "delayed-tasks",
    title: "Delayed Tasks Summary",
    permissions: ["projectedge.project.view", "projectedge.task.view"],
    any: ["projectedge.delay.submit", "projectedge.delay.approve"],
    dated: true,
  },
  {
    id: "time-utilization",
    title: "Time Utilization Report",
    permissions: ["projectedge.project.view", "projectedge.task.view"],
    any: ["projectedge.time.log", "projectedge.time.approve"],
    dated: true,
  },
  {
    id: "cost-burn",
    title: "Project Cost Burn Report",
    permissions: ["projectedge.project.view", "projectedge.budget.view"],
    requiredProject: true,
  },
  {
    id: "resource-capacity",
    title: "Resource Capacity Report",
    permissions: ["projectedge.resource.view"],
    dated: true,
  },
  {
    id: "milestone-achievement",
    title: "Milestone Achievement Log",
    permissions: ["projectedge.project.view"],
    dated: true,
  },
  {
    id: "my-productivity",
    title: "My Productivity Summary",
    permissions: ["projectedge.task.view"],
    dated: true,
  },
];

export function canReadReport(id: ReportId, permissions: string[]): boolean {
  const report = REPORTS.find((r) => r.id === id)!;
  return (
    permissions.includes("projectedge.report.view") &&
    report.permissions.every((p) => permissions.includes(p)) &&
    (!report.any || report.any.some((p) => permissions.includes(p))) &&
    (id !== "my-productivity" ||
      ["time", "delay"].every((group) =>
        permissions.some(
          (p) =>
            p ===
              `projectedge.${group}.${group === "time" ? "log" : "submit"}` ||
            p === `projectedge.${group}.approve`,
        ),
      ))
  );
}

export const reportValue = (value: ReportValue): string =>
  value === null
    ? "Unavailable"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : String(value);
export const reportLabel = (key: string): string =>
  key.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
