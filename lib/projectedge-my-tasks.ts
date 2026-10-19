import type { PersonalTask } from "@/types/projectedge-my-tasks";

export type PersonalTaskFilters = {
  status: string;
  project: string;
  blocked: boolean;
  search: string;
  sort: "due" | "priority";
};
const rank = { critical: 0, high: 1, medium: 2, low: 3 };
export function personalTaskResults(
  tasks: PersonalTask[],
  filters: PersonalTaskFilters,
): PersonalTask[] {
  const search = filters.search.trim().toLowerCase();
  return tasks
    .filter(
      (task) =>
        (!filters.status || task.status === filters.status) &&
        (!filters.project || String(task.project_id) === filters.project) &&
        (!filters.blocked || task.is_blocked) &&
        (!search ||
          [
            task.task_code,
            task.title,
            task.project?.project_code,
            task.project?.title,
            task.milestone?.title,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search)),
    )
    .sort((a, b) => {
      const due = (a.due_date ?? "9999-12-31").localeCompare(
        b.due_date ?? "9999-12-31",
      );
      const priority = rank[a.priority] - rank[b.priority];
      return (
        (filters.sort === "priority" ? priority || due : due || priority) ||
        a.id - b.id
      );
    });
}
