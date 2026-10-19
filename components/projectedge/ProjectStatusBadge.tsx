import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
  draft: "pe-state-neutral",
  todo: "pe-state-neutral",
  active: "pe-state-success",
  done: "pe-state-success",
  on_hold: "pe-state-warning",
  in_review: "pe-state-warning",
  completed: "pe-state-info",
  in_progress: "pe-state-info",
  cancelled: "pe-state-danger",
};

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", statusClasses[status] ?? statusClasses.draft)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
