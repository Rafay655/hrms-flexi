"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visibleProjectEdgeProjectTabs } from "@/lib/projectedge-navigation";
import { useAppSelector } from "@/store/hooks";

export function ProjectEdgeProjectTabs({ projectId }: { projectId: number }) {
  const pathname = usePathname();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const base = `/projectedge/projects/${projectId}`;
  const tabs = visibleProjectEdgeProjectTabs(permissions);

  return (
    <nav aria-label="Project sections" className="pe-card overflow-x-auto border p-1">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`;
          const active = tab.href === "" ? pathname === base : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                active ? "bg-indigo-700 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
              href={href}
              key={tab.key}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
