"use client";

import Link from "next/link";
import { Suspense, useMemo, useState, type ComponentType } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  BookOpen,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileBarChart,
  Grid2X2,
  LayoutGrid,
  List,
  LockKeyhole,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
  type LucideProps,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { insight360Service } from "@/services/insight360";
import type {
  Insight360Provider,
  Insight360ReportDefinition,
  Insight360Sensitivity,
} from "@/types/insight360";
import {
  categoryDisplayName,
  ErrorPanel,
  LoadingPanel,
  reportDescription,
  reportDisplayName,
  ScopeIndicator,
} from "../_components/Insight360Ui";

type ViewMode = "table" | "grid";
type SortKey = "name" | "category" | "primary_provider";
type SortDirection = "asc" | "desc";
type IconComponent = ComponentType<LucideProps>;

const SUGGESTED_SEARCHES = [
  { label: "Attendance summary", query: "attendance" },
  { label: "Employee headcount", query: "employee" },
  { label: "Leave balance", query: "leave" },
  { label: "Payroll variance", query: "payroll" },
  { label: "New joiners", query: "joining" },
  { label: "Department turnover", query: "department" },
];

const PROVIDER_LABELS: Record<string, string> = {
  people_hub: "PeopleHub",
  flexi_hq: "Flexi HQ",
  flexi_meta: "FlexiMeta",
  time_sync: "TimeSync",
  leave_ease: "LeaveEase",
  pay_edge: "PayEdge",
  expense_hub: "ExpenseHub",
  audit_trail: "Audit Trail",
  system_flex: "SystemFlex",
  catalogue_wave: "Insight360",
};

const PROVIDER_STYLES: Record<string, string> = {
  people_hub: "bg-brand-100 text-brand-600",
  flexi_hq: "bg-blue-50 text-blue-700",
  flexi_meta: "bg-brand-100 text-brand-800",
  time_sync: "bg-blue-50 text-blue-700",
  leave_ease: "bg-emerald-50 text-emerald-700",
  pay_edge: "bg-emerald-50 text-emerald-700",
  expense_hub: "bg-rose-50 text-orange-700",
  audit_trail: "bg-amber-50 text-amber-700",
  system_flex: "bg-brand-100 text-brand-700",
  catalogue_wave: "bg-brand-100 text-brand-700",
};

const SENSITIVITY_LABELS: Record<Insight360Sensitivity, string> = {
  internal: "Internal",
  employee: "Employee Data",
  pii: "PII Protected",
  salary: "Salary Restricted",
};

const CADENCE_LABELS: Record<Insight360ReportDefinition["refresh_tier"], string> = {
  live: "Live",
  cached_15m: "Every 15 minutes",
  nightly: "Nightly",
  on_demand: "On demand",
};

const SUMMARY_CARD_STYLES = {
  purple: {
    border: "border-l-brand-700",
    icon: "bg-brand-100 text-brand-600",
  },
  orange: {
    border: "border-l-amber-400",
    icon: "bg-amber-50 text-amber-600",
  },
  lavender: {
    border: "border-l-brand-600",
    icon: "bg-brand-100 text-brand-600",
  },
  coral: {
    border: "border-l-rose-300",
    icon: "bg-rose-50 text-rose-500",
  },
} as const;

function providerLabel(value: string): string {
  return PROVIDER_LABELS[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="relative block min-w-0 rounded-lg border border-gray-200 bg-white px-3 pt-1.5 focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/15">
      <span className="block text-xs font-medium leading-3 text-gray-600">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full cursor-pointer appearance-none bg-transparent pr-7 text-xs font-medium text-brand-900 outline-none"
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 text-brand-700" />
    </label>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: IconComponent;
  tone: keyof typeof SUMMARY_CARD_STYLES;
}) {
  const style = SUMMARY_CARD_STYLES[tone];
  return (
    <article className={`flex min-h-36 items-center gap-4 rounded-xl border border-gray-200 border-l-[3px] ${style.border} bg-white p-5 shadow-[0_1px_3px_rgba(30,26,58,0.04)]`}>
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
        <Icon aria-hidden="true" className="h-7 w-7" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-900">{title}</p>
        <p className="mt-1 text-3xl font-bold leading-none tracking-tight text-brand-900">{value.toLocaleString()}</p>
        <p className="mt-3 text-xs leading-5 text-gray-600">{description}</p>
      </div>
    </article>
  );
}

function AccessLevel({ sensitivity }: { sensitivity: Insight360Sensitivity }) {
  const Icon = sensitivity === "salary" ? LockKeyhole : sensitivity === "pii" ? ShieldCheck : sensitivity === "employee" ? Users : Building2;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-brand-900">
      <Icon aria-hidden="true" className="h-4 w-4 text-brand-900" />
      {SENSITIVITY_LABELS[sensitivity]}
    </span>
  );
}

function AvailabilityBadge({ provider }: { provider?: Insight360Provider }) {
  const state = provider?.readiness ?? "ready";
  if (state === "partial") {
    return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"><CircleAlert aria-hidden="true" className="h-3.5 w-3.5" />Limited</span>;
  }
  if (state === "unavailable") {
    return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded bg-brand-100 px-2.5 py-1 text-xs font-semibold text-gray-600"><CircleAlert aria-hidden="true" className="h-3.5 w-3.5" />Needs dependency</span>;
  }
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />Available</span>;
}

function SortButton({
  label,
  sortKey,
  activeKey,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  onSort: (key: SortKey) => void;
}) {
  return (
    <button type="button" onClick={() => onSort(sortKey)} className="transition-colors inline-flex min-h-9 cursor-pointer items-center gap-1 rounded px-1 text-left font-semibold text-brand-900 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
      {label}<ArrowUpDown aria-hidden="true" className={`h-3 w-3 ${activeKey === sortKey ? "text-brand-700" : "text-gray-400"}`} />
    </button>
  );
}

function ReportTable({
  reports,
  providerMap,
  sortKey,
  onSort,
}: {
  reports: Insight360ReportDefinition[];
  providerMap: Map<string, Insight360Provider>;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1110px] table-fixed text-left text-xs">
        <thead className="border-b border-gray-200 bg-brand-100">
          <tr>
            <th className="w-[18%] px-5 py-2"><SortButton label="Report" sortKey="name" activeKey={sortKey} onSort={onSort} /></th>
            <th className="w-[10%] px-3 py-2"><SortButton label="Business Area" sortKey="category" activeKey={sortKey} onSort={onSort} /></th>
            <th className="w-[18%] px-3 py-2 font-semibold text-brand-900">Description</th>
            <th className="w-[10%] px-3 py-2"><SortButton label="Source Module" sortKey="primary_provider" activeKey={sortKey} onSort={onSort} /></th>
            <th className="w-[10%] px-3 py-2 font-semibold text-brand-900">Refresh Cadence</th>
            <th className="w-[12%] px-3 py-2 font-semibold text-brand-900">Access Level</th>
            <th className="w-[10%] px-3 py-2 font-semibold text-brand-900">Availability</th>
            <th className="w-[12%] px-3 py-2 font-semibold text-brand-900">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.uuid} className="border-b border-gray-200 bg-white transition-colors last:border-b-0 hover:bg-brand-100">
              <td className="px-5 py-3 align-middle">
                <div className="flex min-w-0 items-center gap-3">
                  <FileBarChart aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-700" />
                  <div className="min-w-0">
                    <Link href={`/insight360/definitions/${report.uuid}`} className="line-clamp-2 font-semibold leading-4 text-brand-900 hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                      {reportDisplayName(report.name)}
                    </Link>
                    {report.is_system && <span className="mt-1 inline-flex rounded border border-gray-200 bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">System Report</span>}
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-gray-700">{categoryDisplayName(report.category)}</td>
              <td className="px-3 py-3 leading-4 text-gray-600">{reportDescription(report.name, report.description)}</td>
              <td className="px-3 py-3"><span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${PROVIDER_STYLES[report.primary_provider] ?? "bg-brand-100 text-brand-700"}`}>{providerLabel(report.primary_provider)}</span></td>
              <td className="px-3 py-3 text-gray-700">{CADENCE_LABELS[report.refresh_tier]}</td>
              <td className="px-3 py-3"><AccessLevel sensitivity={report.sensitivity} /></td>
              <td className="px-3 py-3"><AvailabilityBadge provider={providerMap.get(report.primary_provider)} /></td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <Link href={`/insight360/definitions/${report.uuid}`} className="transition-colors inline-flex min-h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-brand-800 hover:border-brand-600 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Open Report</Link>
                  <Link href={`/insight360/definitions/${report.uuid}`} target="_blank" aria-label={`Open ${reportDisplayName(report.name)} in a new tab`} className="transition-colors flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><MoreVertical aria-hidden="true" className="h-4 w-4" /></Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportGrid({ reports, providerMap }: { reports: Insight360ReportDefinition[]; providerMap: Map<string, Insight360Provider> }) {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => (
        <article key={report.uuid} className="flex min-h-56 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(30,26,58,0.04)] transition-colors hover:border-brand-600">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700"><FileBarChart aria-hidden="true" className="h-5 w-5" /></span>
            <AvailabilityBadge provider={providerMap.get(report.primary_provider)} />
          </div>
          <h2 className="mt-4 text-sm font-bold text-brand-900">{reportDisplayName(report.name)}</h2>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-600">{reportDescription(report.name, report.description)}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-brand-100 px-2 py-1 font-semibold text-brand-700">{categoryDisplayName(report.category)}</span>
            <span className={`rounded px-2 py-1 font-semibold ${PROVIDER_STYLES[report.primary_provider] ?? "bg-brand-100 text-brand-700"}`}>{providerLabel(report.primary_provider)}</span>
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <AccessLevel sensitivity={report.sensitivity} />
            <Link href={`/insight360/definitions/${report.uuid}`} className="transition-colors inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-gray-200 px-3 text-xs font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Open Report</Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function pageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 3) return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

function ReportLibrary() {
  const searchParams = useSearchParams();
  const company = useAppSelector((state) => state.auth.company);
  const [query, setQuery] = useState(searchParams.get("q") ?? searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [provider, setProvider] = useState("all");
  const [sensitivity, setSensitivity] = useState("all");
  const [cadence, setCadence] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const definitionsQuery = useQuery({
    queryKey: ["insight360", "definitions", "library"],
    queryFn: () => insight360Service.definitions({ per_page: 200, status: "active" }),
  });
  const providersQuery = useQuery({
    queryKey: ["insight360", "providers", "library"],
    queryFn: insight360Service.providers,
  });

  const reports = useMemo(() => definitionsQuery.data?.items ?? [], [definitionsQuery.data?.items]);
  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const providerMap = useMemo(() => new Map(providers.map((item) => [item.key, item])), [providers]);
  const categories = useMemo(() => Array.from(new Set(reports.map((report) => report.category))).sort((a, b) => categoryDisplayName(a).localeCompare(categoryDisplayName(b))), [reports]);
  const sourceModules = useMemo(() => Array.from(new Set(reports.map((report) => report.primary_provider))).sort((a, b) => providerLabel(a).localeCompare(providerLabel(b))), [reports]);
  const restrictedCount = reports.filter((report) => report.sensitivity !== "internal").length;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reports
      .filter((report) => {
        const searchable = [report.name, report.category, report.description ?? "", report.primary_provider, providerLabel(report.primary_provider)].join(" ").toLowerCase();
        return (!term || searchable.includes(term))
          && (category === "all" || report.category === category)
          && (provider === "all" || report.primary_provider === provider)
          && (sensitivity === "all" || report.sensitivity === sensitivity)
          && (cadence === "all" || report.refresh_tier === cadence);
      })
      .sort((left, right) => {
        const leftValue = sortKey === "category" ? categoryDisplayName(left.category) : sortKey === "primary_provider" ? providerLabel(left.primary_provider) : reportDisplayName(left.name);
        const rightValue = sortKey === "category" ? categoryDisplayName(right.category) : sortKey === "primary_provider" ? providerLabel(right.primary_provider) : reportDisplayName(right.name);
        return leftValue.localeCompare(rightValue) * (sortDirection === "asc" ? 1 : -1);
      });
  }, [reports, query, category, provider, sensitivity, cadence, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visibleReports = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const hasFilters = Boolean(query) || category !== "all" || provider !== "all" || sensitivity !== "all" || cadence !== "all";

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setProvider("all");
    setSensitivity("all");
    setCadence("all");
    setPage(1);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  }

  if (definitionsQuery.isLoading) return <div className="min-h-full bg-white p-6"><LoadingPanel label="Loading the report catalogue" /></div>;
  if (definitionsQuery.error) return <div className="min-h-full bg-white p-6"><ErrorPanel message="The report catalogue is not available right now." /></div>;

  return (
    <div className="min-h-full bg-brand-100 text-brand-900">
      <div className="space-y-5">
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Reports</h1>
            <p className="mt-1.5 text-sm text-gray-600">Find, filter and open trusted workforce reports across every available business area.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ScopeIndicator companyName={company?.name} />
            <Link href="/insight360/overview#start-here" className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><BookOpen aria-hidden="true" className="h-4 w-4" />Reporting Guide</Link>
            <Link href="/insight360/definitions/new" className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"><Plus aria-hidden="true" className="h-4 w-4" />Build Custom Report</Link>
          </div>
        </header>

        <section aria-label="Report catalogue summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Available Reports" value={definitionsQuery.data?.meta.total ?? reports.length} description="Active report definitions available within your current scope." icon={FileBarChart} tone="purple" />
          <SummaryCard title="Business Areas" value={categories.length} description="Reporting categories represented across Insight360." icon={Grid2X2} tone="orange" />
          <SummaryCard title="Source Modules" value={sourceModules.length} description="Connected modules currently providing report definitions." icon={Boxes} tone="lavender" />
          <SummaryCard title="Restricted Reports" value={restrictedCount} description="Salary, PII or employee reports requiring elevated access." icon={LockKeyhole} tone="coral" />
        </section>

        <section aria-label="Search and filter reports" className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_3px_12px_rgba(30,26,58,0.06)]">
          <div className="grid gap-3 xl:grid-cols-[minmax(280px,1.65fr)_repeat(4,minmax(135px,0.78fr))_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search reports</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search by report name, business question or keyword…" className="h-12 w-full rounded-lg border-2 border-brand-700 bg-white pl-10 pr-10 text-xs text-brand-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-brand-700/20" />
              {query && <button type="button" onClick={() => { setQuery(""); setPage(1); }} aria-label="Clear search" className="absolute right-1 top-0 flex h-12 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><X aria-hidden="true" className="h-4 w-4" /></button>}
            </label>
            <FilterSelect id="report-topic" label="Topic" value={category} onChange={(value) => { setCategory(value); setPage(1); }}><option value="all">All business areas</option>{categories.map((item) => <option key={item} value={item}>{categoryDisplayName(item)}</option>)}</FilterSelect>
            <FilterSelect id="report-provider" label="Source Module" value={provider} onChange={(value) => { setProvider(value); setPage(1); }}><option value="all">All modules</option>{sourceModules.map((item) => <option key={item} value={item}>{providerLabel(item)}</option>)}</FilterSelect>
            <FilterSelect id="report-sensitivity" label="Sensitivity" value={sensitivity} onChange={(value) => { setSensitivity(value); setPage(1); }}><option value="all">All access levels</option>{Object.entries(SENSITIVITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</FilterSelect>
            <FilterSelect id="report-cadence" label="Refresh Cadence" value={cadence} onChange={(value) => { setCadence(value); setPage(1); }}><option value="all">All cadences</option>{Object.entries(CADENCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</FilterSelect>
            <button type="button" onClick={clearFilters} disabled={!hasFilters} className="transition-colors inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-default disabled:opacity-45"><X aria-hidden="true" className="h-4 w-4" />Clear Filters</button>
            <div className="inline-flex min-h-12 rounded-lg border border-gray-200 bg-white p-1" aria-label="Report view">
              <button type="button" onClick={() => setViewMode("table")} aria-label="Table view" aria-pressed={viewMode === "table"} className={`transition-colors flex h-10 w-10 cursor-pointer items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${viewMode === "table" ? "border border-brand-600 bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-brand-100"}`}><List aria-hidden="true" className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode("grid")} aria-label="Grid view" aria-pressed={viewMode === "grid"} className={`transition-colors flex h-10 w-10 cursor-pointer items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${viewMode === "grid" ? "border border-brand-600 bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-brand-100"}`}><LayoutGrid aria-hidden="true" className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-brand-100 pt-4 lg:flex-row lg:items-center">
            <p className="min-w-36 text-lg font-bold text-brand-900" aria-live="polite">{filtered.length.toLocaleString()} reports</p>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="mr-1 text-xs text-gray-500">Suggested searches:</span>
              {SUGGESTED_SEARCHES.map((suggestion) => <button key={suggestion.label} type="button" onClick={() => { setQuery(suggestion.query); setPage(1); }} className="transition-colors min-h-8 cursor-pointer rounded-full bg-brand-100 px-3 text-xs font-medium text-brand-900 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">{suggestion.label}</button>)}
            </div>
          </div>
        </section>

        <section aria-label="Reports" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_3px_12px_rgba(30,26,58,0.05)]">
          {filtered.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Search aria-hidden="true" className="h-6 w-6" /></span>
              <h2 className="mt-4 text-lg font-bold text-brand-900">No reports match these filters</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-gray-600">Try a broader keyword or clear your filters to return to the full catalogue.</p>
              <button type="button" onClick={clearFilters} className="transition-colors mt-5 min-h-11 cursor-pointer rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Clear filters</button>
            </div>
          ) : viewMode === "table" ? <ReportTable reports={visibleReports} providerMap={providerMap} sortKey={sortKey} onSort={handleSort} /> : <ReportGrid reports={visibleReports} providerMap={providerMap} />}

          {filtered.length > 0 && (
            <footer className="flex flex-col gap-4 border-t border-gray-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <label className="inline-flex items-center gap-2">Rows per page:
                  <span className="relative">
                    <select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }} className="h-10 cursor-pointer appearance-none rounded-md border border-gray-200 bg-white pl-3 pr-8 font-medium text-brand-900 outline-none focus:ring-2 focus:ring-brand-700"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-brand-700" />
                  </span>
                </label>
                <span>{((safePage - 1) * perPage + 1).toLocaleString()}–{Math.min(safePage * perPage, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()} reports</span>
              </div>
              <nav aria-label="Report pages" className="flex items-center gap-1">
                <button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} aria-label="Previous page" className="transition-colors flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-default disabled:opacity-35"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
                {pageNumbers(safePage, totalPages).map((item, index) => item === "ellipsis" ? <span key={`ellipsis-${index}`} className="flex h-10 w-8 items-center justify-center text-xs text-gray-600">…</span> : <button key={item} type="button" onClick={() => setPage(item)} aria-label={`Page ${item}`} aria-current={safePage === item ? "page" : undefined} className={`transition-colors flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${safePage === item ? "bg-brand-700 text-white" : "text-brand-900 hover:bg-brand-100"}`}>{item}</button>)}
                <button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} aria-label="Next page" className="transition-colors flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-default disabled:opacity-35"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
              </nav>
            </footer>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Insight360CataloguePage() {
  return <Suspense fallback={<div className="min-h-full bg-white p-6"><LoadingPanel label="Opening reports" /></div>}><ReportLibrary /></Suspense>;
}
