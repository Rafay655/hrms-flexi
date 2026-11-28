"use client";

/**
 * _components/FINav.tsx
 * FlexiImport — primary module navigation sidebar.
 *
 * 4 top-level nav items (flat):
 *   Dashboard · Import History
 *
 * Visual identity mirrors SFNav exactly:
 *   Background  : var(--brand-800)  #322E53  Flexi dark purple
 *   Active item : rgba(238,194,147,0.15) background + var(--brand-500) text
 *   Inactive    : white/60, hover white/90 + white/5 bg
 *
 * isActive logic:
 *   Dashboard ("/flexi-import") uses exact match — startsWith would mark it
 *   active for every sub-route. All other items use startsWith.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  History,
  FileInput,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Nav item definitions ──────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/flexi-import",
    icon: BarChart3,
    description: "Import overview and KPIs",
    exact: true,
  },
  {
    id: "batches",
    label: "Import History",
    href: "/flexi-import/batches",
    icon: History,
    description: "All import batches and their status",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function FINav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside
      className="w-52 shrink-0 flex flex-col"
      style={{ backgroundColor: "var(--brand-800)" }}
      aria-label="FlexiImport navigation"
    >
      {/* Module header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--brand-500)" }}
            aria-hidden="true"
          >
            <FileInput
              className="h-3.5 w-3.5"
              style={{ color: "var(--brand-800)" }}
            />
          </div>
          <span className="text-xs font-bold tracking-widest text-white/80 uppercase leading-tight">
            FlexiImport
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
        aria-label="FlexiImport menu"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.description}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "font-semibold"
                  : "text-white/60 hover:text-white/90 hover:bg-white/5"
              )}
              style={
                active
                  ? {
                      backgroundColor: "rgba(238,194,147,0.15)",
                      color: "var(--brand-500)",
                    }
                  : {}
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-relaxed">
          Module 1.7 · HR teams
        </p>
      </div>
    </aside>
  );
}
