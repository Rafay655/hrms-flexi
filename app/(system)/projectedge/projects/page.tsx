"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { ProjectEdgeStatePanel } from "@/components/projectedge/StatePanel";
import { ProjectStatusBadge } from "@/components/projectedge/ProjectStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectEdgeService } from "@/services/projectedge";
import { useAppSelector } from "@/store/hooks";
import type { ProjectEdgePriority, ProjectEdgeProjectStatus } from "@/types/projectedge";

const priorities: Array<ProjectEdgePriority | ""> = ["", "low", "medium", "high", "critical"];
const statuses: Array<ProjectEdgeProjectStatus | ""> = ["", "draft", "active", "on_hold", "completed", "cancelled"];

export default function ProjectListPage() {
  const auth = useAppSelector((state) => state.auth);
  const permissions = auth.permissions;
  const canView = Boolean(auth.token && auth.user?.id && auth.company?.id) && permissions.includes("projectedge.project.view");
  const scope = [auth.company?.id, auth.user?.id, [...permissions].sort()];
  const canCreate = permissions.includes("projectedge.project.create");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectEdgeProjectStatus | "">("");
  const [priority, setPriority] = useState<ProjectEdgePriority | "">("");
  const [page, setPage] = useState(1);

  const projectsQuery = useQuery({
    queryKey: ["projectedge", "projects", scope, { search, status, priority, page }],
    queryFn: () => projectEdgeService.projects({ search: search || undefined, status, priority, page, per_page: 15 }),
    enabled: canView,
    refetchOnMount: "always",
  });
  const clear = () => { setSearch(""); setStatus(""); setPriority(""); setPage(1); };

  if (!canView) {
    return <ProjectEdgeStatePanel description="Sign in with a company and ProjectEdge project-view access to see projects." kind="error" title="Project access required" />;
  }

  return (
    <div className="space-y-5">
      <ProjectEdgePageHeader action={canCreate ? { label: "Create project", href: "/projectedge/projects/new", icon: <Plus aria-hidden="true" /> } : undefined} breadcrumbs={[{ label: "Projects" }]} description="Search, filter, and open the projects visible to your role." title="Projects" />

      <section aria-label="Project filters" className="pe-card border p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto]">
          <label className="relative block"><span className="sr-only">Search projects</span><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="min-h-11 pl-9" onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search code, title, or description" value={search} /></label>
          <label><span className="sr-only">Filter by status</span><select className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => { setStatus(event.target.value as ProjectEdgeProjectStatus | ""); setPage(1); }} value={status}>{statuses.map((value) => <option key={value || "all"} value={value}>{value ? value.replaceAll("_", " ") : "All statuses"}</option>)}</select></label>
          <label><span className="sr-only">Filter by priority</span><select className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => { setPriority(event.target.value as ProjectEdgePriority | ""); setPage(1); }} value={priority}>{priorities.map((value) => <option key={value || "all"} value={value}>{value ? `${value[0].toUpperCase()}${value.slice(1)} priority` : "All priorities"}</option>)}</select></label>
          <Button className="min-h-11" onClick={clear} type="button" variant="outline"><X aria-hidden="true" />Clear</Button>
        </div>
      </section>

      {projectsQuery.isPending || projectsQuery.isFetching ? <ProjectTableSkeleton /> : projectsQuery.isError ? <ProjectEdgeStatePanel action={{ label: "Try again", onClick: () => projectsQuery.refetch() }} description="The project list could not be loaded." kind="error" title="Projects are unavailable" /> : projectsQuery.data.items.length === 0 ? <ProjectEdgeStatePanel action={canCreate && !search && !status && !priority ? { label: "Create the first project", href: "/projectedge/projects/new" } : { label: "Clear filters", onClick: clear }} description={search || status || priority ? "No visible projects match the current filters." : "Create a project to begin planning work, milestones, and resources."} kind="empty" title={search || status || priority ? "No matching projects" : "No projects yet"} /> : (
        <section className="pe-card overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <caption className="sr-only">Visible ProjectEdge projects</caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Project</th><th className="px-5 py-3 font-semibold">Department</th><th className="px-5 py-3 font-semibold">Manager</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Progress</th><th className="px-5 py-3 font-semibold">Dates</th><th className="px-5 py-3"><span className="sr-only">Open</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">{projectsQuery.data.items.map((project) => <tr className="hover:bg-slate-50" key={project.id}><td className="px-5 py-4"><Link className="font-semibold text-slate-950 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" href={`/projectedge/projects/${project.id}`}>{project.title}</Link><span className="mt-1 block text-xs text-slate-500">{project.project_code} · <span className="capitalize">{project.priority}</span></span></td><td className="px-5 py-4 text-slate-600">{project.department?.name ?? "—"}</td><td className="px-5 py-4 text-slate-600">{project.manager?.name ?? "—"}</td><td className="px-5 py-4"><ProjectStatusBadge status={project.status} /></td><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, project.completion_pct)}%` }} /></div><span className="tabular-nums text-slate-600">{project.completion_pct}%</span></div></td><td className="px-5 py-4 text-xs text-slate-600"><span className="block">{project.start_date}</span><span className="mt-1 block">to {project.end_date ?? "open"}</span></td><td className="px-5 py-4"><Link aria-label={`Open ${project.title}`} className="grid size-10 place-items-center rounded-lg text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" href={`/projectedge/projects/${project.id}`}><ArrowRight aria-hidden="true" className="size-4" /></Link></td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">Showing {projectsQuery.data.meta.from}–{projectsQuery.data.meta.to} of {projectsQuery.data.meta.total}</p><div className="flex gap-2"><Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} variant="outline">Previous</Button><Button disabled={page >= projectsQuery.data.meta.last_page} onClick={() => setPage((current) => current + 1)} variant="outline">Next</Button></div></div>
        </section>
      )}
    </div>
  );
}

function ProjectTableSkeleton() { return <div aria-busy="true" className="pe-card border p-5" role="status"><span className="sr-only">Loading projects</span>{Array.from({ length: 6 }).map((_, index) => <div className="mb-3 h-14 animate-pulse rounded-xl bg-slate-100 last:mb-0" key={index} />)}</div>; }
