"use client";

/**
 * _components/SFNav.tsx
 * SystemFlex — primary module navigation sidebar.
 *
 * 4 top-level nav items (flat — no nested groups needed at this stage):
 *   NotifyHub · Settings · System Health · Backups
 *
 * Visual identity:
 *   Background  : var(--brand-800)  #322E53  Flexi dark purple
 *   Active item : brand-500/20 background + brand-500 text (peach gold)
 *   Inactive    : white/60, hover white/90 + white/5 bg
 *
 * Mirrors CCNav structure; keep in sync if that component is refactored.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Settings2,
  Activity,
  HardDrive,
  Shield,
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
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "notify-hub",
    label: "NotifyHub",
    href: "/system-flex/notify-hub",
    icon: Bell,
    description: "Notification template registry",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/system-flex/settings",
    icon: Settings2,
    description: "Company & system settings",
  },
  {
    id: "health",
    label: "System Health",
    href: "/system-flex/health",
    icon: Activity,
    description: "Queue depth, jobs, DB status",
  },
  {
    id: "backup",
    label: "Backups",
    href: "/system-flex/backup",
    icon: HardDrive,
    description: "VaultGuard backup jobs & runs",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SFNav() {
  const pathname = usePathname();

  /**
   * A route is active when the pathname starts with its href.
   * This correctly marks /system-flex/notify-hub/page as active
   * for the notify-hub item without needing exact matching.
   */
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside
      className="w-52 shrink-0 flex flex-col"
      style={{ backgroundColor: "var(--brand-800)" }}
      aria-label="SystemFlex navigation"
    >
      {/* Module header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--brand-500)" }}
            aria-hidden="true"
          >
            {/* Shield icon uses brand-800 on brand-500 bg for contrast */}
            <Shield
              className="h-3.5 w-3.5"
              style={{ color: "var(--brand-800)" }}
            />
          </div>
          <span className="text-xs font-bold tracking-widest text-white/80 uppercase leading-tight">
            SystemFlex
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
        aria-label="SystemFlex menu"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

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
          Module 1.3 · Super admin only
        </p>
      </div>
    </aside>
  );
}
