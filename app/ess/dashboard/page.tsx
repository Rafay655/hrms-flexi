"use client";

import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown,
  LogIn,
  LogOut,
  CalendarDays,
  AlertTriangle,
  FileText,
  BellRing,
  Receipt,
  Wallet,
  Radar,
  MoreHorizontal,
  Megaphone,
  Send,
  Landmark,
  ShieldCheck,
  Users,
  FolderOpen,
  Grid3x3,
} from "lucide-react";

const dummyUserName = "Zain";

const dummyToday = {
  punchIn: "09:02 AM",
  dateLabel: "Friday, 8 Aug 2026",
  workedToday: "2h 17m",
  breakTaken: "00h 00m",
  shiftStart: "09:00 AM",
  shiftEnd: "06:00 PM",
  shiftType: "Flexible",
  location: "Head Office – Lahore",
  status: "On Duty" as const,
};

const dummyAttention = [
  {
    icon: CalendarDays,
    tone: "amber",
    title: "Leave request awaiting approval",
    subtitle: "Annual Leave (14 Aug 2026)",
    badge: "Awaiting",
  },
  {
    icon: AlertTriangle,
    tone: "red",
    title: "Attendance exception",
    subtitle: "Early exit on 07 Aug 2026",
    badge: "Action Required",
  },
  {
    icon: FileText,
    tone: "blue",
    title: "Document expiring soon",
    subtitle: "CNIC will expire in 18 days",
    badge: "Update",
  },
  {
    icon: BellRing,
    tone: "violet",
    title: "Policy acknowledgement pending",
    subtitle: "Code of Conduct Policy",
    badge: "Pending",
  },
];

const dummyQuickActions = [
  { icon: CalendarDays, label: "Request\nLeave", tone: "green" },
  { icon: Receipt, label: "Submit\nExpense", tone: "orange" },
  { icon: Wallet, label: "Payslip", tone: "blue" },
  { icon: Radar, label: "Attendance", tone: "violet" },
  { icon: MoreHorizontal, label: "More", tone: "slate" },
];

const dummySnapshot = [
  {
    icon: CalendarDays,
    tone: "green",
    label: "Leave Balance",
    value: "12.5",
    unit: "Days Available",
    cta: "View Details",
  },
  {
    icon: Radar,
    tone: "blue",
    label: "Attendance",
    value: "92%",
    unit: "This Month",
    cta: "View Details",
  },
  {
    icon: Wallet,
    tone: "violet",
    label: "Latest Payslip",
    value: "PKR 78,560",
    unit: "July 2026",
    cta: "View Payslip",
  },
  {
    icon: Receipt,
    tone: "orange",
    label: "Claims / Expenses",
    value: "2",
    unit: "Pending",
    cta: "View Details",
  },
];

const dummyRequests = [
  {
    icon: CalendarDays,
    tone: "green",
    title: "Casual Leave",
    subtitle: "14 Aug 2026 (1 Day)",
    status: "Awaiting Manager",
    statusTone: "amber",
  },
  {
    icon: Receipt,
    tone: "orange",
    title: "Expense Claim",
    subtitle: "Travel to Karachi",
    status: "Finance Review",
    statusTone: "blue",
  },
  {
    icon: Clock,
    tone: "slate",
    title: "Attendance Correction",
    subtitle: "Early In – 05 Aug 2026",
    status: "Approved",
    statusTone: "green",
  },
];

const dummyCompanyUpdates = [
  {
    icon: FileText,
    title: "Policy Update: Remote Work Guidelines",
    subtitle: "Updated on 06 Aug 2026",
    tag: "New",
  },
  {
    icon: CalendarDays,
    title: "Independence Day – Office Timings",
    subtitle: "Updated on 04 Aug 2026",
    tag: "New",
  },
];

const dummyAskFlexiPrompts = [
  "How many leave days do I have?",
  "What is the overtime policy?",
  "How to claim medical reimbursement?",
  "Show my last 3 payslips",
];

const dummyServices = [
  { icon: CalendarDays, label: "Leave\nManagement", tone: "green" },
  { icon: Receipt, label: "Expense\nManagement", tone: "orange" },
  { icon: Landmark, label: "Loan\nManagement", tone: "violet" },
  { icon: Radar, label: "Attendance\nManagement", tone: "blue" },
  { icon: ShieldCheck, label: "Policies &\nForms", tone: "sky" },
  { icon: FolderOpen, label: "Documents\n& Letters", tone: "red" },
  { icon: Users, label: "Directory", tone: "indigo" },
  { icon: Grid3x3, label: "More\nServices", tone: "slate" },
];

/* -------------------------------------------------------------------------- */
/* Tone → color helpers                                                       */
/* -------------------------------------------------------------------------- */

const toneStyles: Record<string, { bg: string; text: string; iconBg: string }> = {
  green: { bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", iconBg: "bg-amber-100" },
  red: { bg: "bg-red-50", text: "text-red-700", iconBg: "bg-red-100" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", iconBg: "bg-violet-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", iconBg: "bg-orange-100" },
  slate: { bg: "bg-slate-50", text: "text-slate-600", iconBg: "bg-slate-100" },
  sky: { bg: "bg-sky-50", text: "text-sky-700", iconBg: "bg-sky-100" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", iconBg: "bg-indigo-100" },
};

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const t = toneStyles[tone] ?? toneStyles.slate;
  return (
    <span className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${t.bg} ${t.text}`}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function EssDashboardPage() {
  return (
    <div className="space-y-3 text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Good morning, {dummyUserName}! <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with you today.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-black/[0.02]">
          <Calendar className="h-4 w-4 text-slate-400" />
          {dummyToday.dateLabel}
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Today + Needs Your Attention */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="-mb-[1px] inline-block border-b-2 border-indigo-600 pb-2 text-base font-semibold">
              Today
            </h2>
            <Badge tone="green">{dummyToday.status}</Badge>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3 sm:border-r sm:border-black/5 sm:pr-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{dummyToday.punchIn}</p>
                <p className="text-xs text-slate-400">{dummyToday.dateLabel}</p>
              </div>
              <button className="flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                View Attendance <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Worked Today</p>
                  <p className="text-lg font-semibold">{dummyToday.workedToday}</p>
                  <p className="mt-1 text-xs text-slate-400">Break: {dummyToday.breakTaken}</p>
                </div>

                <div className="flex-1">
                  <p className="text-xs text-slate-400">Shift</p>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {dummyToday.shiftStart} – {dummyToday.shiftEnd}
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                      {dummyToday.shiftType}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Location</p>
                  <p className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {dummyToday.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                  <LogIn className="h-4 w-4" /> Punch In
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 px-5 py-2.5 text-sm font-medium text-slate-400">
                  <LogOut className="h-4 w-4" /> Punch Out
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Needs Your Attention</h2>
            <a href="#" className="text-sm font-medium text-indigo-600 hover:underline">
              View All
            </a>
          </div>
          <ul className="space-y-3">
            {dummyAttention.map((item) => {
              const t = toneStyles[item.tone];
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.iconBg}`}>
                      <Icon className={`h-4.5 w-4.5 ${t.text}`} />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <Badge tone={item.tone}>{item.badge}</Badge>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Quick Actions + My Work Snapshot */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.9fr_1.4fr]">
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Quick Actions</h2>
            <a href="#" className="text-sm font-medium text-indigo-600 hover:underline">
              Customize
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {dummyQuickActions.map((action) => {
              const t = toneStyles[action.tone];
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl ${t.bg} px-3 py-4 text-center hover:brightness-95`}
                >
                  <Icon className={`h-5 w-5 ${t.text}`} />
                  <span className={`whitespace-pre-line text-xs font-semibold leading-tight ${t.text}`}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">My Work Snapshot</h2>
            <button className="flex items-center gap-1 text-sm font-medium text-slate-500">
              This Month <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {dummySnapshot.map((item) => {
              const t = toneStyles[item.tone];
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-black/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${t.iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 ${t.text}`} />
                    </span>
                  </div>
                  <p className="text-lg font-semibold">{item.value}</p>
                  <p className="text-xs text-slate-400">{item.unit}</p>
                  <a href="#" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
                    {item.cta} <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* My Requests + Company feed + Ask Flexi */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">My Requests</h2>
            <a href="#" className="text-sm font-medium text-indigo-600 hover:underline">
              View All
            </a>
          </div>
          <ul className="space-y-4">
            {dummyRequests.map((req) => {
              const t = toneStyles[req.tone];
              const Icon = req.icon;
              return (
                <li key={req.title} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.iconBg}`}>
                      <Icon className={`h-4.5 w-4.5 ${t.text}`} />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{req.title}</p>
                      <p className="text-xs text-slate-400">{req.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone={req.statusTone}>{req.status}</Badge>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </li>
              );
            })}
          </ul>
          <a href="#" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
            Go to Requests Center <ChevronRight className="h-4 w-4" />
          </a>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">From HRPSP / Company</h2>
            <a href="#" className="text-sm font-medium text-indigo-600 hover:underline">
              View All
            </a>
          </div>

          <div className="mb-4 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
            <div className="mb-2 flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                New Announcement
              </span>
            </div>
            <p className="text-sm font-semibold">Wellness Week 2026</p>
            <p className="mt-1 text-xs text-white/80">
              Join us from 18–22 Aug for wellness sessions, health checkups &amp; more.
            </p>
            <a href="#" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline">
              Know More <ChevronRight className="h-3 w-3" />
            </a>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>
          </div>

          <ul className="space-y-3">
            {dummyCompanyUpdates.map((update) => {
              const Icon = update.icon;
              return (
                <li key={update.title} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium leading-snug">{update.title}</p>
                      <p className="text-xs text-slate-400">{update.subtitle}</p>
                    </div>
                  </div>
                  <Badge tone="green">{update.tag}</Badge>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Ask Flexi */}
        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-3 bottom-20 select-none text-6xl opacity-90"
          >
            🤖
          </span>

          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold">Ask Flexi</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
              BETA
            </span>
          </div>

          <div className="mb-4 flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
              🤖
            </span>
            <div>
              <p className="text-sm font-medium">Hello {dummyUserName}! How can I help you today?</p>
              <p className="mt-1 text-xs text-slate-400">
                Ask anything about HR policies, leaves, payroll, benefits and more.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {dummyAskFlexiPrompts.map((prompt) => (
              <button
                key={prompt}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-black/[0.02]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-auto flex items-center gap-2 rounded-xl border border-black/10 p-1.5">
            <input
              disabled
              placeholder="Type your question here..."
              className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-400"
            />
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      {/* Your Services */}
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Your Services</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {dummyServices.map((service) => {
            const t = toneStyles[service.tone];
            const Icon = service.icon;
            return (
              <button
                key={service.label}
                className="flex items-center gap-2 rounded-xl border border-black/5 px-3 py-3 text-left hover:bg-black/[0.02]"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.iconBg}`}>
                  <Icon className={`h-4 w-4 ${t.text}`} />
                </span>
                <span className="whitespace-pre-line text-xs font-medium leading-tight">
                  {service.label}
                </span>
                <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}