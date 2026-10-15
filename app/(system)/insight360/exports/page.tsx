"use client";

import { useMemo, useState, type ComponentType } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleX,
  Clock3,
  Download,
  FileClock,
  FileDown,
  FileSpreadsheet,
  Info,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
  type LucideProps,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { insight360Service } from "@/services/insight360";
import type { Insight360Export } from "@/types/insight360";
import {
  ErrorPanel,
  LoadingPanel,
  reportDisplayName,
  ScopeIndicator,
} from "../_components/Insight360Ui";

type IconComponent = ComponentType<LucideProps>;
const PAGE_REFERENCE_TIME = Date.now();

const TONES = {
  green: { border: "border-l-emerald-600", icon: "bg-emerald-50 text-emerald-700" },
  purple: { border: "border-l-brand-600", icon: "bg-brand-100 text-brand-600" },
  coral: { border: "border-l-rose-500", icon: "bg-rose-50 text-rose-600" },
  orange: { border: "border-l-amber-400", icon: "bg-amber-50 text-amber-600" },
  indigo: { border: "border-l-brand-700", icon: "bg-brand-100 text-brand-700" },
} as const;

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: number; icon: IconComponent; tone: keyof typeof TONES }) {
  const style = TONES[tone];
  return <article className={`flex min-h-24 items-center gap-4 rounded-xl border border-gray-200 border-l-[3px] ${style.border} bg-white p-4 shadow-[0_1px_3px_rgba(30,26,58,0.04)]`}><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${style.icon}`}><Icon aria-hidden="true" className="h-6 w-6" /></span><div><p className="text-xs font-semibold text-brand-900">{title}</p><p className="mt-1 text-2xl font-bold text-brand-900">{value.toLocaleString()}</p></div></article>;
}

function bytes(value: number | null): string {
  if (!value) return "—";
  return value >= 1_048_576 ? `${(value / 1_048_576).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function isExpiringSoon(item: Insight360Export): boolean {
  if (!item.expires_at || item.status !== "complete") return false;
  const remaining = new Date(item.expires_at).getTime() - PAGE_REFERENCE_TIME;
  return remaining > 0 && remaining <= 2 * 24 * 60 * 60 * 1000;
}

function FormatIcon({ format, className = "h-5 w-5" }: { format: Insight360Export["format"]; className?: string }) {
  return format === "xlsx" ? <FileSpreadsheet aria-hidden="true" className={`${className} text-emerald-700`} /> : <FileDown aria-hidden="true" className={`${className} ${format === "pdf" ? "text-rose-600" : "text-teal-700"}`} />;
}

function formatLabel(format: Insight360Export["format"]): string {
  return format === "xlsx" ? "Excel" : format.toUpperCase();
}

function statusView(item: Insight360Export): { label: string; className: string; icon: IconComponent; spin?: boolean } {
  if (item.status === "complete") return { label: "Ready", className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 };
  if (item.status === "processing") return { label: "Processing", className: "bg-brand-100 text-brand-700", icon: LoaderCircle, spin: true };
  if (item.status === "pending") return { label: "Pending", className: "bg-amber-50 text-amber-700", icon: Clock3 };
  if (item.status === "failed") return { label: "Failed", className: "bg-rose-50 text-rose-700", icon: CircleX };
  return { label: "Expired", className: "bg-brand-100 text-gray-600", icon: Clock3 };
}

function progressMessage(item: Insight360Export): string {
  if (item.error_message) return item.error_message;
  if (item.status === "complete") return item.downloaded_at ? "Downloaded successfully" : "File generated successfully";
  if (item.status === "processing") return "Generating file";
  if (item.status === "pending") return "Waiting to start";
  if (item.status === "expired") return "File expired after seven days";
  return "The file could not be generated";
}

export default function Insight360ExportsPage() {
  const company = useAppSelector((state) => state.auth.company);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [createdDate, setCreatedDate] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const exportsQuery = useQuery({
    queryKey: ["insight360", "exports"],
    queryFn: () => insight360Service.exports({ per_page: 200 }),
    refetchInterval: (queryResult) => queryResult.state.data?.items.some((item) => ["pending", "processing"].includes(item.status)) ? 4000 : false,
  });
  const download = useMutation({ mutationFn: (item: Insight360Export) => insight360Service.downloadExport(item.download_url!, item.file_name ?? `insight360.${item.format}`) });
  const items = useMemo(() => exportsQuery.data?.items ?? [], [exportsQuery.data?.items]);
  const filtered = useMemo(() => items.filter((item) => {
    const term = query.trim().toLowerCase();
    const expired = item.status === "expired" || Boolean(item.expires_at && new Date(item.expires_at).getTime() <= PAGE_REFERENCE_TIME);
    const expiryMatch = expiryFilter === "all" || (expiryFilter === "soon" && isExpiringSoon(item)) || (expiryFilter === "expired" && expired) || (expiryFilter === "active" && !expired);
    const statusMatch = statusFilter === "all" || (statusFilter === "generating" ? ["pending", "processing"].includes(item.status) : statusFilter === "ready" ? item.status === "complete" : item.status === statusFilter);
    return (!term || `${item.report_name} ${item.file_name ?? ""}`.toLowerCase().includes(term)) && statusMatch && (formatFilter === "all" || item.format === formatFilter) && (!createdDate || item.created_at.slice(0, 10) === createdDate) && expiryMatch;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [items, query, statusFilter, formatFilter, createdDate, expiryFilter]);
  const readyCount = items.filter((item) => item.status === "complete").length;
  const generatingCount = items.filter((item) => ["pending", "processing"].includes(item.status)).length;
  const failedCount = items.filter((item) => item.status === "failed").length;
  const expiringCount = items.filter(isExpiringSoon).length;
  const downloadedCount = items.filter((item) => item.downloaded_at).length;
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visibleItems = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const polling = exportsQuery.isFetching || generatingCount > 0;

  return <div className="min-h-full bg-brand-100 text-brand-900"><div className="space-y-5">
    <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 xl:flex-row xl:items-center xl:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Downloads</h1><p className="mt-1.5 text-sm text-gray-600">Access generated Excel, CSV and PDF report files before they expire.</p></div><div className="flex flex-wrap items-center gap-3"><ScopeIndicator companyName={company?.name} /><span role="status" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600"><LoaderCircle aria-hidden="true" className={`h-4 w-4 text-brand-600 ${polling ? "animate-spin motion-reduce:animate-none" : ""}`} />{polling ? "Checking for updates…" : "Files are up to date"}<span className="h-2 w-2 rounded-full bg-emerald-700" /></span><button type="button" onClick={() => exportsQuery.refetch()} disabled={exportsQuery.isFetching} className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-50"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${exportsQuery.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />Refresh</button></div></header>

    <p className="flex min-h-11 items-center gap-3 rounded-lg border border-brand-600 bg-brand-100 px-4 text-xs font-medium text-brand-700"><Info aria-hidden="true" className="h-5 w-5 shrink-0" />Generated files are retained for seven days. Download important files before their expiry date.</p>

    <section aria-label="Download summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MetricCard title="Ready to Download" value={readyCount} icon={CheckCircle2} tone="green" /><MetricCard title="Generating" value={generatingCount} icon={LoaderCircle} tone="purple" /><MetricCard title="Failed" value={failedCount} icon={CircleX} tone="coral" /><MetricCard title="Expiring Soon" value={expiringCount} icon={Clock3} tone="orange" /><MetricCard title="Downloaded" value={downloadedCount} icon={Download} tone="indigo" /></section>

    {exportsQuery.isLoading ? <LoadingPanel label="Loading downloads" /> : exportsQuery.error ? <ErrorPanel message="Downloads could not be loaded." /> : <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_3px_12px_rgba(30,26,58,0.05)]"><div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(250px,1.5fr)_repeat(2,minmax(130px,0.7fr))_minmax(180px,0.9fr)_minmax(130px,0.7fr)_auto]"><label className="relative"><span className="sr-only">Search downloads</span><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search report or filename…" className="h-12 w-full rounded-lg border border-gray-200 pl-10 pr-3 text-xs outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15" /></label>{[["Status", statusFilter, setStatusFilter, [["all", "All"], ["ready", "Ready"], ["generating", "Generating"], ["failed", "Failed"], ["expired", "Expired"]]], ["Format", formatFilter, setFormatFilter, [["all", "All"], ["xlsx", "Excel"], ["csv", "CSV"], ["pdf", "PDF"]]]] .map(([label, value, setter, options]) => <label key={label as string} className="relative rounded-lg border border-gray-200 px-3 pt-1.5"><span className="block text-xs text-gray-600">{label as string}</span><select value={value as string} onChange={(event) => { (setter as (value: string) => void)(event.target.value); setPage(1); }} className="h-9 w-full cursor-pointer appearance-none bg-transparent pr-6 text-xs font-medium outline-none">{(options as string[][]).map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5" /></label>)}<label className="rounded-lg border border-gray-200 px-3 pt-1.5"><span className="block text-xs text-gray-600">Created Date</span><input type="date" value={createdDate} onChange={(event) => { setCreatedDate(event.target.value); setPage(1); }} className="h-9 w-full bg-transparent text-xs outline-none" /></label><label className="relative rounded-lg border border-gray-200 px-3 pt-1.5"><span className="block text-xs text-gray-600">Expiry</span><select value={expiryFilter} onChange={(event) => { setExpiryFilter(event.target.value); setPage(1); }} className="h-9 w-full cursor-pointer appearance-none bg-transparent pr-6 text-xs font-medium outline-none"><option value="all">Any</option><option value="active">Active</option><option value="soon">Expiring soon</option><option value="expired">Expired</option></select><ChevronDown aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5" /></label><button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); setFormatFilter("all"); setCreatedDate(""); setExpiryFilter("all"); setPage(1); }} className="transition-colors inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100"><X aria-hidden="true" className="h-4 w-4" />Clear Filters</button></div><div className="border-y border-gray-200 px-4 py-2 text-xs font-bold">{filtered.length} file{filtered.length === 1 ? "" : "s"}</div>{filtered.length === 0 ? <div className="p-10 text-center"><FileClock aria-hidden="true" className="mx-auto h-9 w-9 text-brand-600" /><h2 className="mt-3 font-bold">No downloads found</h2><p className="mt-1 text-sm text-gray-600">Open a report and generate Excel, CSV or PDF output.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] table-fixed text-left text-xs"><caption className="sr-only">Insight360 generated files</caption><thead className="border-b border-gray-200 bg-brand-100"><tr><th className="w-[18%] px-4 py-3">File</th><th className="w-[14%] px-3 py-3">Report</th><th className="w-[7%] px-3 py-3">Format</th><th className="w-[12%] px-3 py-3">Created</th><th className="w-[9%] px-3 py-3">Status</th><th className="w-[17%] px-3 py-3">Progress or Message</th><th className="w-[7%] px-3 py-3">Size</th><th className="w-[8%] px-3 py-3">Expires</th><th className="w-[8%] px-3 py-3">Action</th></tr></thead><tbody>{visibleItems.map((item) => { const status = statusView(item); const StatusIcon = status.icon; const canDownload = item.status === "complete" && Boolean(item.download_url); return <tr key={item.uuid} className="transition-colors border-b border-gray-200 last:border-b-0 hover:bg-brand-100"><td className="px-4 py-3"><span className="flex min-w-0 items-center gap-2"><FormatIcon format={item.format} /><span className="truncate font-semibold text-brand-900" title={item.file_name ?? item.report_name}>{item.file_name ?? `${item.report_name}.${item.format}`}</span></span></td><td className="px-3 py-3 text-gray-700">{reportDisplayName(item.report_name || "Insight360 report")}</td><td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold ${item.format === "xlsx" ? "bg-emerald-50 text-emerald-700" : item.format === "pdf" ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700"}`}><FormatIcon format={item.format} className="h-3 w-3" />{formatLabel(item.format)}</span></td><td className="px-3 py-3">{formatDateTime(item.created_at)}</td><td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold ${status.className}`}><StatusIcon aria-hidden="true" className={`h-3.5 w-3.5 ${status.spin ? "animate-spin motion-reduce:animate-none" : ""}`} />{status.label}</span></td><td className="px-3 py-3 leading-4 text-gray-700">{progressMessage(item)}</td><td className="px-3 py-3">{bytes(item.file_size_bytes)}</td><td className="px-3 py-3">{formatDate(item.expires_at)}</td><td className="px-3 py-3"><button type="button" onClick={() => canDownload && download.mutate(item)} disabled={!canDownload || (download.isPending && download.variables?.uuid === item.uuid)} className="transition-colors inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-brand-600 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-brand-100 disabled:text-gray-400"><Download aria-hidden="true" className="h-3.5 w-3.5" />{download.isPending && download.variables?.uuid === item.uuid ? "Downloading…" : "Download"}</button></td></tr>; })}</tbody></table></div>} {filtered.length > 0 && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3 text-xs text-gray-600"><span>{(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length} files</span><nav aria-label="Download pages" className="flex items-center gap-1"><button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} aria-label="Previous download page" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md disabled:opacity-35"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((item) => <button type="button" key={item} onClick={() => setPage(item)} aria-current={safePage === item ? "page" : undefined} className={`flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md px-2 font-semibold ${safePage === item ? "bg-brand-700 text-white" : "hover:bg-brand-100"}`}>{item}</button>)}<button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} aria-label="Next download page" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md disabled:opacity-35"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button></nav></footer>}</section>}

    {download.isError && <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><CircleAlert aria-hidden="true" className="h-5 w-5" />The file could not be downloaded. It may have expired.</p>}
  </div></div>;
}
