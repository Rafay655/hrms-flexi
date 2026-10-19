"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FolderKanban, Plus, Target } from "lucide-react";
import { ProjectEdgePageHeader } from "@/components/projectedge/PageHeader";
import { ProjectEdgeStatePanel } from "@/components/projectedge/StatePanel";
import { ProjectStatusBadge } from "@/components/projectedge/ProjectStatusBadge";
import { projectEdgeService } from "@/services/projectedge";
import { useAppSelector } from "@/store/hooks";

const today = () => new Date().toISOString().slice(0, 10);

export default function ProjectEdgeHomePage() {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canCreate = permissions.includes("projectedge.project.create");
  const canViewTasks = permissions.includes("projectedge.task.view");
  const projectsQuery = useQuery({
    queryKey: ["projectedge", "projects", "home"],
    queryFn: () => projectEdgeService.projects({ per_page: 100 }),
  });
  const tasksQuery = useQuery({
    queryKey: ["projectedge", "my-tasks", "home"],
    queryFn: () => projectEdgeService.myTasks({ per_page: 100 }),
    enabled: canViewTasks,
  });

  if (projectsQuery.isPending) return <HomeSkeleton />;
  if (projectsQuery.isError) {
    return <ProjectEdgeStatePanel kind="error" title="Projects are unavailable" description="We could not load your visible projects." action={{ label: "Try again", onClick: () => projectsQuery.refetch() }} />;
  }

  const projects = projectsQuery.data.items;
  const tasks = tasksQuery.data?.items ?? [];
  const activeProjects = projects.filter((project) => project.status === "active");
  const overdueTasks = tasks.filter((task) => task.due_date && task.due_date < today() && !["done", "cancelled"].includes(task.status));
  const blockedTasks = tasks.filter((task) => task.is_blocked && !["done", "cancelled"].includes(task.status));
  const completedProjects = projects.filter((project) => project.status === "completed");

  return (
    <div className="space-y-5">
      <ProjectEdgePageHeader
        action={canCreate ? { label: "New project", href: "/projectedge/projects/new", icon: <Plus aria-hidden="true" /> } : undefined}
        description="Keep projects, deadlines, and personal delivery work visible from one place."
        title="Project delivery at a glance"
      />

      <section aria-label="Project summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FolderKanban} label="Active projects" value={activeProjects.length} detail={`${projects.length} visible in total`} tone="indigo" />
        <Metric icon={AlertTriangle} label="Overdue tasks" value={overdueTasks.length} detail="Assigned to you" tone={overdueTasks.length ? "amber" : "emerald"} />
        <Metric icon={Clock3} label="Blocked tasks" value={blockedTasks.length} detail="Waiting on a dependency or gate" tone={blockedTasks.length ? "rose" : "emerald"} />
        <Metric icon={CheckCircle2} label="Completed projects" value={completedProjects.length} detail="Across your visible portfolio" tone="emerald" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <article className="pe-card overflow-hidden border">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="font-semibold text-slate-950">Recent projects</h2><p className="mt-1 text-sm text-slate-500">The newest work you can access</p></div>
            <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" href="/projectedge/projects">View all <ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link>
          </div>
          {projects.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-600">No projects are visible yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.slice(0, 5).map((project) => (
                <Link className="flex min-h-20 items-center gap-4 px-5 py-4 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600" href={`/projectedge/projects/${project.id}`} key={project.id}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Target aria-hidden="true" className="size-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-950">{project.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{project.project_code} · {project.manager?.name ?? "Manager not available"}</span></span>
                  <ProjectStatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="pe-card border p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">My task focus</h2><p className="mt-1 text-sm text-slate-500">Closest deadlines first</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{tasks.length}</span></div>
          {!canViewTasks ? <p className="mt-6 text-sm leading-6 text-slate-600">Task access is not included in your current permissions.</p> : tasksQuery.isError ? <p className="mt-6 text-sm text-rose-700">Your tasks could not be loaded.</p> : tasks.length === 0 ? <p className="mt-6 text-sm leading-6 text-slate-600">No tasks are currently assigned to you.</p> : (
            <div className="mt-5 space-y-3">{tasks.slice(0, 5).map((task) => <div className="rounded-xl border border-slate-200 p-3" key={task.id}><div className="flex items-start justify-between gap-3"><p className="font-medium text-slate-900">{task.title}</p>{task.is_blocked ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">Blocked</span> : null}</div><p className="mt-1 text-xs text-slate-500">{task.project?.project_code ?? "Project"} · Due {task.due_date ?? "not set"}</p></div>)}</div>
          )}
          {canViewTasks ? <Link className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" href="/projectedge/my-tasks">Open my tasks <ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link> : null}
        </article>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof FolderKanban; label: string; value: number; detail: string; tone: "indigo" | "amber" | "emerald" | "rose" }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-700", amber: "bg-amber-50 text-amber-800", emerald: "bg-emerald-50 text-emerald-700", rose: "bg-rose-50 text-rose-700" };
  return <article className="pe-card border p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-slate-950">{value}</p></div><span className={`grid size-11 place-items-center rounded-xl ${colors[tone]}`}><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-3 text-xs text-slate-500">{detail}</p></article>;
}

function HomeSkeleton() {
  return <div aria-busy="true" className="space-y-5" role="status"><span className="sr-only">Loading ProjectEdge overview</span><div className="h-40 animate-pulse rounded-2xl bg-slate-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div className="h-28 animate-pulse rounded-2xl bg-slate-200" key={index} />)}</div><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /></div>;
}
