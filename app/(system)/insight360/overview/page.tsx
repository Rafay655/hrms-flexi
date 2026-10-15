"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Banknote,
  BookOpen,
  Bookmark,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  CircleHelp,
  Download,
  ExternalLink,
  FileBarChart2,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  Search,
  ShieldCheck,
  UserRoundCog,
  Users,
  Workflow,
  X,
  type LucideProps,
} from "lucide-react";
import { insight360Service } from "@/services/insight360";
import { useAppSelector } from "@/store/hooks";
import type { Insight360Export, Insight360ReportDefinition } from "@/types/insight360";
import {
  categoryDisplayName,
  ErrorPanel,
  LoadingPanel,
  reportDescription,
  reportDisplayName,
  ScopeIndicator,
} from "../_components/Insight360Ui";

type IconComponent = ComponentType<LucideProps>;

// The chip label is a human phrase; the query is the single term actually
// matched against report name/category/description. Searching the whole phrase
// (the previous behaviour) matched no report, so every chip returned "no
// results". Same shape as the catalogue page.
const SUGGESTED_SEARCHES = [
  { label: "Attendance summary", query: "attendance" },
  { label: "Employee headcount", query: "employee" },
  { label: "Leave balance", query: "leave" },
  { label: "Payroll variance", query: "payroll" },
  { label: "New joiners", query: "joining" },
  { label: "Department turnover", query: "department" },
];

const TOPIC_GROUPS = [
  { key: "workforce", label: "Workforce", matcher: /employee|workforce|hr report|organisation|organization|recruitment|headcount/ },
  { key: "attendance", label: "Attendance", matcher: /attendance|timesheet|time sync|shift/ },
  { key: "leave", label: "Leave", matcher: /leave|holiday|comp off/ },
  { key: "payroll", label: "Payroll", matcher: /payroll|salary|compensation|earning|deduction|cost to company|\bctc\b/ },
  { key: "compliance", label: "Compliance", matcher: /compliance|statutory|tax|contribution|registration/ },
  { key: "employee-services", label: "Employee Services", matcher: /expense|loan|tour|document|employee service|benefit/ },
  { key: "approvals-workflow", label: "Approvals and Workflow", matcher: /approval|workflow|pending action|turnaround/ },
  { key: "system-audit", label: "System and Audit", matcher: /system|audit|security|activity log|access/ },
] as const;

const PROVIDER_LABELS: Record<string, string> = {
  people_hub: "PeopleHub",
  flexi_hq: "Flexi HQ",
  flexi_meta: "FlexiMeta",
  time_sync: "TimeSync",
  leave_ease: "LeaveEase",
  pay_edge: "PayEdge",
  catalogue_wave: "Insight360",
};

function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function topicPresentation(category: string): {
  title: string;
  description: string;
  icon: IconComponent;
  iconClass: string;
  iconBackground: string;
} {
  const normalized = category.toLowerCase().replaceAll("_", " ");
  if (/attendance|time|timesheet/.test(normalized)) return {
    title: "Attendance",
    description: "Presence, lateness, absences, working time and attendance exceptions.",
    icon: CalendarDays,
    iconClass: "text-brand-700",
    iconBackground: "bg-brand-100",
  };
  if (/leave/.test(normalized)) return {
    title: "Leave",
    description: "Leave requests, balances, trends, utilisation and approvals.",
    icon: CalendarOff,
    iconClass: "text-emerald-700",
    iconBackground: "bg-emerald-50",
  };
  if (/pay|salary|compensation/.test(normalized)) return {
    title: "Payroll",
    description: "Payroll totals, earnings, deductions, variance and readiness.",
    icon: Banknote,
    iconClass: "text-rose-600",
    iconBackground: "bg-rose-50",
  };
  if (/compliance|statutory/.test(normalized)) return {
    title: "Compliance",
    description: "Statutory contribution, registration and compliance reporting.",
    icon: ShieldCheck,
    iconClass: "text-teal-700",
    iconBackground: "bg-teal-50",
  };
  if (/approval|workflow/.test(normalized)) return {
    title: "Approvals and Workflow",
    description: "Pending actions, workflow performance, turnaround time and escalations.",
    icon: Workflow,
    iconClass: "text-brand-700",
    iconBackground: "bg-brand-100",
  };
  if (/expense|loan|employee service|tour|document/.test(normalized)) return {
    title: "Employee Services",
    description: "Loans, expenses, tours, documents and employee service activity.",
    icon: UserRoundCog,
    iconClass: "text-blue-700",
    iconBackground: "bg-blue-50",
  };
  if (/system|audit|security/.test(normalized)) return {
    title: "System and Audit",
    description: "Audit activity, user actions, data changes and system usage.",
    icon: BookOpen,
    iconClass: "text-blue-700",
    iconBackground: "bg-blue-50",
  };
  return {
    title: /employee|workforce|hr report/.test(normalized) ? "Workforce" : categoryDisplayName(category),
    description: "Headcount, employee movement, demographics and organisation structure.",
    icon: Users,
    iconClass: "text-brand-700",
    iconBackground: "bg-brand-100",
  };
}

function formatDate(value: string | null): string {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function exportStatus(exportItem: Insight360Export): { label: string; icon: IconComponent; className: string } {
  if (exportItem.status === "complete") return { label: "Ready", icon: CheckCircle2, className: "text-emerald-700" };
  if (["pending", "processing"].includes(exportItem.status)) return { label: "Generating", icon: LoaderCircle, className: "text-brand-700" };
  return { label: exportItem.status.replaceAll("_", " "), icon: CircleHelp, className: "text-rose-700" };
}

function ReportResultRow({ report }: { report: Insight360ReportDefinition }) {
  return (
    <tr className="border-t border-gray-200 first:border-t-0">
      <td className="px-2 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileBarChart2 aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
          <span className="line-clamp-2 font-semibold text-brand-900">{reportDisplayName(report.name)}</span>
        </div>
      </td>
      <td className="px-2 py-2.5 text-gray-600">{categoryDisplayName(report.category)}</td>
      <td className="px-2 py-2.5 leading-4 text-gray-600"><span className="line-clamp-2">{reportDescription(report.name, report.description)}</span></td>
      <td className="px-2 py-2.5"><span className="inline-flex rounded-md border border-gray-200 bg-brand-100 px-1.5 py-0.5 font-semibold text-brand-700">{providerLabel(report.primary_provider)}</span></td>
      <td className="px-2 py-2.5 text-right">
        <Link href={`/insight360/definitions/${report.uuid}`} className="transition-colors inline-flex min-h-9 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2 font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Open report <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></Link>
      </td>
    </tr>
  );
}

export default function Insight360OverviewPage() {
  const [query, setQuery] = useState("");
  const company = useAppSelector((state) => state.auth.company);
  const definitions = useQuery({
    queryKey: ["insight360", "definitions", "overview"],
    queryFn: () => insight360Service.definitions({ per_page: 200, status: "active" }),
  });
  const saved = useQuery({ queryKey: ["insight360", "saved-views"], queryFn: insight360Service.savedViews });
  const schedules = useQuery({ queryKey: ["insight360", "schedules", "overview"], queryFn: insight360Service.schedules });
  const exportsQuery = useQuery({
    queryKey: ["insight360", "exports", "overview"],
    queryFn: () => insight360Service.exports({ per_page: 6 }),
  });

  const reports = useMemo(() => definitions.data?.items ?? [], [definitions.data?.items]);
  const categories = useMemo(() => {
    const grouped = new Map(TOPIC_GROUPS.map((topic) => [topic.key, [] as Insight360ReportDefinition[]]));
    reports.forEach((report) => {
      const searchable = `${report.name} ${report.category} ${report.primary_provider}`.toLowerCase();
      const topic = TOPIC_GROUPS.find((candidate) => candidate.matcher.test(searchable)) ?? TOPIC_GROUPS[0];
      grouped.get(topic.key)?.push(report);
    });
    return TOPIC_GROUPS.map((topic) => ({ ...topic, reports: grouped.get(topic.key) ?? [] }));
  }, [reports]);
  const filteredReports = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return reports.slice(0, 4);
    return reports.filter((report) => [report.name, report.category, report.description ?? "", report.primary_provider]
      .some((value) => value.toLowerCase().includes(term))).slice(0, 4);
  }, [query, reports]);

  if (definitions.isLoading) return <div className="min-h-full bg-white p-6"><LoadingPanel label="Preparing your reporting overview" /></div>;
  if (definitions.error) return <div className="min-h-full bg-white p-6"><ErrorPanel message="Your reports could not be loaded. Check your connection and try again." /></div>;

  const savedItems = saved.data?.items ?? [];
  const scheduleItems = schedules.data?.items ?? [];
  const exportItems = exportsQuery.data?.items ?? [];
  const activeSchedules = scheduleItems.filter((item) => item.is_active);
  const nextSchedule = activeSchedules
    .filter((item) => item.next_run_at)
    .sort((a, b) => new Date(a.next_run_at ?? 0).getTime() - new Date(b.next_run_at ?? 0).getTime())[0];
  const readyFiles = exportItems.filter((item) => item.status === "complete").length;
  const generatingFiles = exportItems.filter((item) => ["pending", "processing"].includes(item.status)).length;

  return (
    <div className="min-h-full bg-white">
      <div className="space-y-5">
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Reporting Overview</h1>
            <p className="mt-1.5 text-sm text-gray-600">Find reports, resume saved work and manage reporting activity.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ScopeIndicator companyName={company?.name} />
            <a href="#start-here" className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><CircleHelp aria-hidden="true" className="h-4 w-4" />Reporting guide</a>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
          <div className="rounded-xl border border-gray-200 bg-brand-100 p-4 shadow-[0_1px_3px_rgba(30,26,58,0.04)]">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white"><Search aria-hidden="true" className="h-6 w-6" /></span>
              <div>
                <h2 className="text-lg font-bold text-brand-900">What do you want to know?</h2>
                <p className="mt-0.5 text-xs text-gray-600">Search across {definitions.data?.meta.total ?? reports.length} active reports by report name, category or description.</p>
              </div>
            </div>
            <div className="relative mt-3 ml-0 sm:ml-15">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <label htmlFor="overview-report-search" className="sr-only">Search reports</label>
              <input id="overview-report-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports…" autoComplete="off" className="h-11 w-full rounded-lg border border-brand-700 bg-white pl-10 pr-24 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-700/25" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><X aria-hidden="true" className="h-4 w-4" /></button>}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[124px_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-semibold text-brand-900">Suggested searches</p>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:flex-col sm:items-start">
                  {SUGGESTED_SEARCHES.map((suggestion) => <button key={suggestion.label} type="button" onClick={() => setQuery(suggestion.query)} className="min-h-9 cursor-pointer rounded-full border border-gray-200 bg-white px-3 text-left text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">{suggestion.label}</button>)}
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[440px] table-fixed text-left text-xs">
                    <thead className="bg-brand-100 text-gray-500"><tr><th className="w-[24%] px-2 py-2 font-semibold">Report</th><th className="w-[15%] px-2 py-2 font-semibold">Category</th><th className="w-[29%] px-2 py-2 font-semibold">Description</th><th className="w-[15%] px-2 py-2 font-semibold">Source module</th><th className="w-[17%] px-2 py-2 text-right font-semibold">Action</th></tr></thead>
                    <tbody>{filteredReports.map((report) => <ReportResultRow key={report.uuid} report={report} />)}</tbody>
                  </table>
                </div>
                {filteredReports.length === 0 && <p className="px-4 py-6 text-center text-xs text-gray-600">No matching reports. Try a broader phrase.</p>}
                <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 text-xs">
                  <Link href={`/insight360/catalogue${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`} className="font-semibold text-brand-700 hover:underline">View all {query.trim() ? `results for “${query.trim()}”` : "reports"}</Link>
                  <a href="#start-here" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"><CircleHelp aria-hidden="true" className="h-3.5 w-3.5" />Search help</a>
                </div>
              </div>
            </div>
          </div>

          <aside id="start-here" className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(30,26,58,0.04)]">
            <h2 className="text-lg font-bold text-brand-900">Start Here</h2>
            <p className="mt-1 text-xs text-gray-600">Common reporting paths for new and returning users.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-3">
              {[
                { href: "/insight360/catalogue", title: "Find a Report", text: "Browse or search all available report definitions.", action: "Browse reports", icon: FileBarChart2, className: "border-gray-200 bg-brand-100 text-brand-700" },
                { href: "/insight360/dashboard", title: "View Dashboards", text: "Open operational analytics and live workforce indicators.", action: "Open Dashboard", icon: LayoutDashboard, className: "border-amber-200 bg-amber-50 text-amber-700" },
                { href: "/insight360/saved", title: "Open My Reports", text: "Continue with reports you previously saved or configured.", action: "View saved reports", icon: Bookmark, className: "border-rose-200 bg-rose-50 text-rose-700" },
              ].map(({ href, title, text, action, icon: Icon, className }) => (
                <article key={href} className={`flex min-h-52 flex-col rounded-xl border p-3 ${className}`}>
                  <Icon aria-hidden="true" className="h-6 w-6" />
                  <h3 className="mt-3 text-sm font-bold text-brand-900">{title}</h3>
                  <p className="mt-2 text-xs leading-4 text-gray-600">{text}</p>
                  <Link href={href} className="transition-colors mt-auto inline-flex min-h-9 cursor-pointer items-center justify-between rounded-lg border border-current/30 bg-white/75 px-2 text-xs font-semibold hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">{action}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section aria-labelledby="browse-topic-heading">
          <div className="mb-2">
            <h2 id="browse-topic-heading" className="text-lg font-bold text-brand-900">Browse by Topic</h2>
            <p className="text-xs text-gray-600">Explore reports grouped by business area.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => {
              const presentation = topicPresentation(category.label);
              const Icon = presentation.icon;
              const providers = Array.from(new Set(category.reports.map((report) => report.primary_provider))).slice(0, 3);
              const restricted = category.reports.some((report) => report.sensitivity === "salary");
              return (
                <article key={category.key} className="flex min-h-36 flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-[0_1px_2px_rgba(30,26,58,0.04)]">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${presentation.iconBackground}`}><Icon aria-hidden="true" className={`h-5 w-5 ${presentation.iconClass}`} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2"><h3 className="text-xs font-bold text-brand-900">{presentation.title}</h3>{restricted && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-800">Restricted</span>}</div>
                      <p className="mt-0.5 text-xs font-semibold text-brand-700">{category.reports.length} report{category.reports.length === 1 ? "" : "s"}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-4 text-gray-600">{presentation.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <div className="flex flex-wrap gap-1">{providers.map((provider) => <span key={provider} className="rounded border border-gray-200 bg-brand-100 px-1.5 py-0.5 text-xs font-semibold text-brand-700">{providerLabel(provider)}</span>)}</div>
                    <Link href={`/insight360/catalogue?search=${encodeURIComponent(category.label)}`} aria-label={`Open ${presentation.title} reports`} className="transition-colors inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Open <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="continue-working-heading">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div><h2 id="continue-working-heading" className="text-lg font-bold text-brand-900">Continue Working</h2><p className="text-xs text-gray-600">Resume recent saved reports and reporting activity.</p></div>
            <Link href="/insight360/saved" className="transition-colors inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">View all My Reports <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-brand-100 text-gray-500"><tr><th className="px-3 py-2 font-semibold">Report name</th><th className="px-3 py-2 font-semibold">Category</th><th className="px-3 py-2 font-semibold">Company or scope</th><th className="px-3 py-2 font-semibold">Saved on</th><th className="px-3 py-2 font-semibold">Saved state</th><th className="px-3 py-2 text-center font-semibold">Primary action</th></tr></thead>
                <tbody>
                  {savedItems.slice(0, 3).map((view) => (
                    <tr key={view.uuid} className="border-t border-gray-200">
                      <td className="px-3 py-2"><div className="flex items-center gap-2 font-semibold text-brand-900"><Bookmark aria-hidden="true" className="h-4 w-4 text-brand-700" />{view.name}</div></td>
                      <td className="px-3 py-2 text-gray-600">{categoryDisplayName(view.report.category)}</td>
                      <td className="px-3 py-2 text-gray-600">{company?.name || "Permitted company"}</td>
                      <td className="px-3 py-2 text-gray-600">{formatDate(view.created_at)}</td>
                      <td className="px-3 py-2"><span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><Bookmark aria-hidden="true" className="h-3.5 w-3.5" />Saved</span></td>
                      <td className="px-3 py-2 text-center"><Link href={`/insight360/definitions/${view.report.uuid}`} className="transition-colors inline-flex min-h-8 min-w-28 cursor-pointer items-center justify-center rounded-lg border border-brand-600 px-3 font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Continue</Link></td>
                    </tr>
                  ))}
                  {savedItems.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-600">Save a filtered report and it will appear here for one-click access.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-start">
              <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white"><CalendarClock aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="text-base font-bold text-brand-900">Schedules</h2><p className="mt-1 text-xs leading-4 text-gray-600">Manage reports delivered automatically by email or generated on a recurring schedule.</p></div></div>
              <div className="text-center"><p className="text-lg font-bold text-brand-900">{activeSchedules.length}</p><p className="text-xs text-gray-500">Active schedules</p></div>
              <div><p className="text-sm font-bold text-brand-900">{nextSchedule ? formatDate(nextSchedule.next_run_at) : "No delivery queued"}</p><p className="text-xs text-gray-500">Next delivery</p></div>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-brand-900">Recent schedules</p>
              <div className="mt-2 space-y-2">{scheduleItems.slice(0, 3).map((schedule) => <div key={schedule.uuid} className="grid grid-cols-[1fr_auto] gap-3 text-xs"><span className="truncate font-medium text-brand-900">• {schedule.name}</span><span className="capitalize text-gray-500">{schedule.frequency}</span></div>)}{scheduleItems.length === 0 && <p className="text-xs text-gray-500">No report schedules have been created yet.</p>}</div>
            </div>
            <div className="mt-3 flex justify-end"><Link href="/insight360/schedules" className="transition-colors inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg border border-brand-600 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Open Schedules <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></Link></div>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-start">
              <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white"><Download aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="text-base font-bold text-brand-900">Downloads</h2><p className="mt-1 text-xs leading-4 text-gray-600">Access generated Excel, PDF and CSV report files.</p></div></div>
              <div className="text-center"><p className="text-lg font-bold text-brand-900">{readyFiles}</p><p className="text-xs text-gray-500">Ready files</p></div>
              <div className="text-center"><p className="text-lg font-bold text-brand-900">{generatingFiles}</p><p className="text-xs text-gray-500">Generating</p></div>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-brand-900">Recent files</p>
              <div className="mt-2 space-y-2">
                {exportItems.slice(0, 3).map((exportItem) => {
                  const status = exportStatus(exportItem);
                  const StatusIcon = status.icon;
                  const FormatIcon = exportItem.format === "pdf" ? FileText : FileSpreadsheet;
                  return <div key={exportItem.uuid} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-xs"><span className="flex min-w-0 items-center gap-1.5"><FormatIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-700" /><span className="truncate font-medium text-brand-900">{exportItem.file_name || exportItem.report_name}</span></span><span className={`inline-flex items-center gap-1 font-semibold capitalize ${status.className}`}><StatusIcon aria-hidden="true" className={`h-3.5 w-3.5 ${exportItem.status === "processing" ? "animate-spin motion-reduce:animate-none" : ""}`} />{status.label}</span><span className="text-gray-500">{formatFileSize(exportItem.file_size_bytes)}</span></div>;
                })}
                {exportItems.length === 0 && <p className="text-xs text-gray-500">Generated report files will appear here.</p>}
              </div>
            </div>
            <div className="mt-3 flex justify-end"><Link href="/insight360/exports" className="transition-colors inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg border border-brand-600 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Open Downloads <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></Link></div>
          </article>
        </section>
      </div>
    </div>
  );
}
