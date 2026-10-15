"use client";

/**
 * ESSShell — sidebar + topbar chrome for the /ess route segment.
 *
 * Pure presentation, pure dummy data, no backend. Every value below (user,
 * company, nav items, notification count) is hardcoded so the layout can be
 * reviewed against the mock. Nothing here is wired to a real API yet.
 */

import React from "react";
import {
  LayoutDashboard,
  User,
  ClipboardList,
  CalendarRange,
  FolderOpen,
  Wallet,
  Clock,
  CalendarDays,
  Receipt,
  Landmark,
  ShieldCheck,
  Users,
  Search,
  Bell,
  HelpCircle,
  Settings,
  Building2,
  ChevronDown,
  MessageCircle,
  ArrowRight,
  Menu,
  MoreVertical,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
};

/* -------------------------------------------------------------------------- */
/* Dummy data                                                                  */
/* -------------------------------------------------------------------------- */

const dummyMainNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/ess/dashboard", active: true },
  { icon: User, label: "My Profile", href: "/ess/profile" },
  { icon: ClipboardList, label: "My Requests", href: "/ess/requests" },
  { icon: CalendarRange, label: "My Schedule", href: "/ess/schedule" },
  { icon: FolderOpen, label: "My Documents", href: "/ess/documents" },
  { icon: Wallet, label: "My Payslip", href: "/ess/payslip" },
  { icon: Clock, label: "My Attendance", href: "/ess/attendance" },
];

const dummyMoreServicesNav = [
  { icon: CalendarDays, label: "Leave Management", href: "/ess/leave", iconColor: "text-emerald-400" },
  { icon: Receipt, label: "Expense Management", href: "/ess/expenses", iconColor: "text-orange-400" },
  { icon: Landmark, label: "Loan Management", href: "/ess/loans", iconColor: "text-violet-400" },
  { icon: ShieldCheck, label: "Policies & Forms", href: "/ess/policies", iconColor: "text-sky-400" },
  { icon: Users, label: "Directory", href: "/ess/directory", iconColor: "text-blue-300" },
];

const dummyUser = {
  name: "Zain ul Abideen",
  role: "HR Operations Manager",
  employeeId: "TN-10245",
};

const dummyCompanyName = "TechNova (Pvt.) Ltd.";
const dummyNotificationCount = 12;

/* -------------------------------------------------------------------------- */
/* Shell                                                                       */
/* -------------------------------------------------------------------------- */

export default function ESSShell({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-[#F5F6FA]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col bg-[#1B1140] text-white">
        <div className="flex items-baseline gap-1.5 px-5 py-5">
          <span className="text-2xl font-bold tracking-tight text-white">Flexi</span>
          <span className="text-sm font-bold tracking-wide text-white">HRMS</span>
        </div>

        <div className="mx-3 mb-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium">
          <User className="h-4 w-4" />
          My Work / ESS
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Main
          </p>
          <ul className="space-y-1">
            {dummyMainNav.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-indigo-600 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <p className="mb-2 mt-5 px-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            More Services
          </p>
          <ul className="space-y-1">
            {dummyMoreServicesNav.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-3 mb-3 rounded-xl bg-white/5 p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-4 w-4" />
            Need Help?
          </p>
          <p className="mb-3 text-xs text-white/60">Chat with Ask Flexi or contact support.</p>
          <button className="flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold hover:bg-indigo-500">
            Ask Flexi <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
          <img
            src="https://i.pravatar.cc/72?img=12"
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{dummyUser.name}</p>
            <p className="truncate text-xs text-white/50">{dummyUser.role}</p>
          </div>
          <button className="shrink-0 rounded-md p-1 text-white/40 hover:bg-white/5 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
        <p className="px-4 pb-4 text-[11px] text-white/40">Employee ID: {dummyUser.employeeId}</p>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center gap-4 border-b border-black/5 bg-white px-6 py-3">
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-black/[0.03]">
            <Menu className="h-5 w-5 text-slate-500" />
          </button>

          <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              disabled
              placeholder="Search employees, documents, services..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-400 shadow-sm">
              ⌘K
            </kbd>
          </div>

          <button className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.03]">
            <Bell className="h-4.5 w-4.5 text-slate-600" />
            {dummyNotificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {dummyNotificationCount}
              </span>
            )}
          </button>

          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.03]">
            <HelpCircle className="h-4.5 w-4.5 text-slate-600" />
          </button>

          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.03]">
            <Settings className="h-4.5 w-4.5 text-slate-600" />
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/[0.02]">
            <Building2 className="h-4 w-4 text-slate-500" />
            {dummyCompanyName}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </header>

        {/* Routed page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}