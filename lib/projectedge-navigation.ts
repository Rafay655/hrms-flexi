export type ProjectEdgeNavigationItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  permissions: string[];
};

const item = (
  key: string,
  label: string,
  href: string,
  icon: string,
  permissions: string[],
): ProjectEdgeNavigationItem => ({ key, label, href, icon, permissions });

export const projectEdgeNavigation = [
  item("overview", "Overview", "/projectedge", "LayoutDashboard", [
    "projectedge.project.view",
  ]),
  item("projects", "Projects", "/projectedge/projects", "FolderKanban", [
    "projectedge.project.view",
  ]),
  item("my-tasks", "My tasks", "/projectedge/my-tasks", "ListChecks", [
    "projectedge.task.view",
  ]),
  item("timesheets", "Timesheets", "/projectedge/timesheets", "Clock3", [
    "projectedge.time.log",
    "projectedge.time.approve",
  ]),
  item("delays", "Delay tracker", "/projectedge/delays", "TriangleAlert", [
    "projectedge.delay.submit",
    "projectedge.delay.approve",
  ]),
  item("resources", "Resources", "/projectedge/resources", "UsersRound", [
    "projectedge.resource.view",
  ]),
  item("reports", "Reports", "/projectedge/reports", "ChartNoAxesCombined", [
    "projectedge.report.view",
  ]),
] satisfies ProjectEdgeNavigationItem[];

export const visibleProjectEdgeNavigation = (
  permissions: string[],
): ProjectEdgeNavigationItem[] =>
  projectEdgeNavigation.filter((navigationItem) =>
    navigationItem.permissions.some((permission) =>
      permissions.includes(permission),
    ),
  );

export const projectEdgeProjectTabs = [
  item("overview", "Overview", "", "LayoutDashboard", [
    "projectedge.project.view",
  ]),
  item("gantt", "Gantt", "/gantt", "GanttChartSquare", [
    "projectedge.gantt.view",
  ]),
  item("board", "Board", "/board", "Columns3", ["projectedge.task.view"]),
  item("tasks", "Tasks", "/tasks", "ListChecks", ["projectedge.task.view"]),
  item("milestones", "Milestones", "/milestones", "Milestone", [
    "projectedge.project.view",
  ]),
  item("resources", "Resources", "/resources", "UsersRound", [
    "projectedge.resource.view",
  ]),
  item("budget", "Budget", "/budget", "BadgeDollarSign", [
    "projectedge.budget.view",
  ]),
  item("activity", "Activity", "/activity", "History", [
    "projectedge.activity.view",
  ]),
] satisfies ProjectEdgeNavigationItem[];

export const visibleProjectEdgeProjectTabs = (
  permissions: string[],
): ProjectEdgeNavigationItem[] =>
  projectEdgeProjectTabs.filter((tab) =>
    tab.permissions.some((permission) => permissions.includes(permission)),
  );

export const isProjectEdgePathActive = (
  pathname: string,
  href: string,
): boolean => {
  if (href === "/projectedge") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
};
