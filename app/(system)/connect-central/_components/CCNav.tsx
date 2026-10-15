"use client";

/**
 * _components/CCNav.tsx
 * ConnectCentral — primary module navigation sidebar.
 *
 * 7 nav items organised in 5 groups. Uses --cc-navy background and
 * --cc-accent highlight for the active route.
 */

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  MonitorSmartphone,
  KeyRound,
  Users,
  Lock,
  Settings2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Nav item definitions ──────────────────────────────────────────────────────

type NavChild = {
  label: string;
  href: string;
};

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavChild[];
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "security",
    label: "Security Dashboard",
    icon: ShieldCheck,
    href: "/connect-central/security",
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: MonitorSmartphone,
    children: [
      { label: "My Sessions", href: "/connect-central/sessions" },
      { label: "Company Sessions", href: "/connect-central/sessions/company" },
    ],
  },
  {
    id: "authentication",
    label: "Authentication",
    icon: KeyRound,
    children: [
      { label: "2FA & Recovery", href: "/connect-central/authentication" },
      { label: "2FA Setup Wizard", href: "/connect-central/authentication/2fa-setup" },
      { label: "OAuth / SSO", href: "/connect-central/authentication/oauth" },
    ],
  },
  {
    id: "access",
    label: "Access Control",
    icon: Users,
    children: [
      { label: "Roles & Permissions", href: "/connect-central/access" },
      { label: "Account Locks", href: "/connect-central/access/locks" },
    ],
  },
  {
    id: "policies",
    label: "Policies",
    icon: Settings2,
    children: [
      { label: "Session Policies", href: "/connect-central/policies" },
      { label: "Password Policy", href: "/connect-central/policies/password" },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CCNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/connect-central/security"
      ? pathname === href
      : pathname.startsWith(href);

  const isGroupActive = (item: NavItem) =>
    item.href
      ? isActive(item.href)
      : (item.children ?? []).some((c) => isActive(c.href));

  // Track which groups are open; default-open active group
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    NAV_ITEMS.reduce<Record<string, boolean>>((acc, item) => {
      if (item.children) acc[item.id] = isGroupActive(item);
      return acc;
    }, {})
  );

  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside
      className="w-52 shrink-0 flex flex-col"
      style={{ backgroundColor: "var(--cc-navy)" }}
    >
      {/* Module label */}
      <div className="px-4 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--cc-accent)" }}
          >
            <Lock className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-bold tracking-widest text-white/80 uppercase">
            ConnectCentral
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isGroupActive(item);

          if (!item.children) {
            // Leaf item (Security Dashboard)
            return (
              <Link
                key={item.id}
                href={item.href!}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "text-white font-semibold"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
                style={active ? { backgroundColor: "var(--cc-accent)" } : {}}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          }

          // Collapsible group
          const isOpen = open[item.id];
          return (
            <div key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "text-white font-semibold bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen && (
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                  {item.children!.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-2 py-1.5 rounded text-xs transition-colors",
                          childActive
                            ? "text-white font-medium"
                            : "text-white/50 hover:text-white"
                        )}
                        style={
                          childActive
                            ? { color: "var(--cc-accent)" }
                            : {}
                        }
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-relaxed">
          Security events logged under{" "}
          <code className="text-white/40">connect_central</code>
        </p>
      </div>
    </aside>
  );
}
