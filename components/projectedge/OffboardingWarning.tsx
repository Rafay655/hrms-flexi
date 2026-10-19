import type { ProjectEdgeProject } from "@/types/projectedge";

export function OffboardingWarning({ warnings }: Pick<ProjectEdgeProject, "warnings">) {
  const warning = warnings.find(({ code }) => code === "OFFBOARDED_EMPLOYEE_HAS_OPEN_TASKS");
  if (!warning) return null;
  return (
    <section role="status" aria-label="Reassignment required" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <h2 className="font-semibold">Reassignment required</h2>
      <p className="mt-1">{warning.message}</p>
      <p className="mt-1">Assignments and task history have been preserved; no automatic reassignment has occurred.</p>
    </section>
  );
}
