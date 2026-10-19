"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { ProjectEdgeProjectTabs } from "@/components/projectedge/ProjectTabs";
import { ProjectEdgeStatePanel } from "@/components/projectedge/StatePanel";
import { ProjectStatusBadge } from "@/components/projectedge/ProjectStatusBadge";
import { projectEdgeService } from "@/services/projectedge";
import { useAppSelector } from "@/store/hooks";

export function ProjectEdgeProjectWorkspaceShell({ projectId, children }: { projectId: number; children: ReactNode }) {
  const auth = useAppSelector((state) => state.auth);
  const permissions = auth.permissions;
  const canView = Boolean(auth.token && auth.user?.id && auth.company?.id) && permissions.includes("projectedge.project.view");
  const scope = [auth.company?.id, auth.user?.id, [...permissions].sort()];
  const projectQuery = useQuery({
    queryKey: ["projectedge", "project", projectId, scope],
    queryFn: () => projectEdgeService.project(projectId),
    enabled: canView && Number.isInteger(projectId) && projectId > 0,
    refetchOnMount: "always",
  });

  if (!canView) {
    return <ProjectEdgeStatePanel description="Sign in with a company and ProjectEdge project-view access to open this workspace." kind="error" title="Project access required" />;
  }
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return <ProjectEdgeStatePanel action={{ label: "Back to projects", href: "/projectedge/projects" }} description="The project address is not valid." kind="error" title="Project not found" />;
  }
  if (projectQuery.isPending || projectQuery.isFetching) {
    return <div aria-busy="true" className="space-y-4" role="status"><span className="sr-only">Loading project workspace</span><div className="h-40 animate-pulse rounded-2xl bg-slate-200" /><div className="h-14 animate-pulse rounded-xl bg-slate-200" /><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /></div>;
  }
  if (projectQuery.isError) {
    return <ProjectEdgeStatePanel action={{ label: "Try again", onClick: () => projectQuery.refetch() }} description="This project may no longer exist, may be outside your company, or may not be visible to your role." kind="error" title="Project unavailable" />;
  }

  const project = projectQuery.data;
  return (
    <div className="space-y-4">
      <ProjectEdgePageHeader
        action={permissions.includes("projectedge.task.create") ? { label: "Add task", href: `/projectedge/projects/${projectId}/tasks?create=1`, icon: <Plus aria-hidden="true" /> } : undefined}
        breadcrumbs={[{ label: "Projects", href: "/projectedge/projects" }, { label: project.project_code }]}
        description={project.description || `${project.department?.name ?? "Project"} · Managed by ${project.manager?.name ?? "an assigned manager"}`}
        title={project.title}
      />
      <div className="flex flex-wrap items-center gap-2 px-1 text-sm text-slate-600">
        <ProjectStatusBadge status={project.status} />
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{project.priority} priority</span>
        <span>{project.start_date} to {project.end_date ?? "open-ended"}</span>
      </div>
      <ProjectEdgeProjectTabs projectId={projectId} />
      {children}
    </div>
  );
}
