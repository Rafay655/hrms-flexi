import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Crumb = { label: string; href?: string };

export function ProjectEdgePageHeader({
  eyebrow = "ProjectEdge",
  title,
  description,
  breadcrumbs = [],
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  breadcrumbs?: Crumb[];
  action?: { label: string; href: string; icon?: ReactNode };
}) {
  return (
    <header className="pe-card border px-5 py-5 sm:px-6">
      {breadcrumbs.length > 0 ? (
        <nav aria-label="Project breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <Link className="rounded-sm font-medium hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" href="/projectedge">
            ProjectEdge
          </Link>
          {breadcrumbs.map((crumb) => (
            <span className="inline-flex items-center gap-1" key={`${crumb.label}-${crumb.href ?? "current"}`}>
              <ChevronRight aria-hidden="true" className="size-3.5" />
              {crumb.href ? (
                <Link className="rounded-sm hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" href={crumb.href}>
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">{eyebrow}</p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {action ? (
          <Button asChild className="pe-button-primary min-h-11 shrink-0">
            <Link href={action.href}>
              {action.icon}
              {action.label}
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
