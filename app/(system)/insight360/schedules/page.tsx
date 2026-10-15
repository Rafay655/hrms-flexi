"use client";

import { Suspense, useMemo, useState, type ComponentType } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileDown,
  FileSpreadsheet,
  Globe2,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  Users,
  X,
  type LucideProps,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { insight360Service } from "@/services/insight360";
import type { Insight360Export, Insight360Schedule, Insight360SchedulePayload } from "@/types/insight360";
import {
  ErrorPanel,
  LoadingPanel,
  reportDisplayName,
  ScopeIndicator,
} from "../_components/Insight360Ui";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type IconComponent = ComponentType<LucideProps>;
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Karachi";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TONES = {
  purple: { border: "border-l-brand-700", icon: "bg-brand-100 text-brand-600" },
  orange: { border: "border-l-amber-400", icon: "bg-amber-50 text-amber-600" },
  lavender: { border: "border-l-brand-600", icon: "bg-brand-100 text-brand-600" },
  coral: { border: "border-l-rose-300", icon: "bg-rose-50 text-rose-500" },
  green: { border: "border-l-emerald-500", icon: "bg-emerald-50 text-emerald-700" },
} as const;

const FIELD_CLASS = "mt-1.5 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15";

function MetricCard({ title, value, description, icon: Icon, tone }: { title: string; value: string | number; description: string; icon: IconComponent; tone: keyof typeof TONES }) {
  const style = TONES[tone];
  return <article className={`flex min-h-36 items-center gap-4 rounded-xl border border-gray-200 border-l-[3px] ${style.border} bg-white p-4 shadow-[0_1px_3px_rgba(30,26,58,0.04)]`}><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${style.icon}`}><Icon aria-hidden="true" className="h-6 w-6" /></span><div className="min-w-0"><p className="text-xs font-semibold text-brand-900">{title}</p><p className="mt-1 text-xl font-bold leading-6 tracking-tight text-brand-900">{value}</p><p className="mt-2 text-xs leading-4 text-gray-600">{description}</p></div></article>;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatTime(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
}

function scheduleStatus(schedule: Insight360Schedule): { label: string; className: string; dot: string } {
  if (!schedule.is_active) return { label: "Paused", className: "bg-amber-50 text-amber-700", dot: "bg-amber-500" };
  if (schedule.last_status === "failed") return { label: "Failed", className: "bg-rose-50 text-rose-700", dot: "bg-rose-600" };
  return { label: "Active", className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-700" };
}

function FormatIcon({ format, className = "h-4 w-4" }: { format: Insight360Export["format"]; className?: string }) {
  return format === "xlsx" ? <FileSpreadsheet aria-hidden="true" className={`${className} text-emerald-700`} /> : <FileDown aria-hidden="true" className={`${className} ${format === "pdf" ? "text-rose-600" : "text-teal-700"}`} />;
}

function Insight360SchedulesPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const company = useAppSelector((state) => state.auth.company);
  const initialReport = searchParams.get("report") ?? "";
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialReport));
  const [editing, setEditing] = useState<Insight360Schedule | null>(null);
  const [reportUuid, setReportUuid] = useState(initialReport);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<Insight360Schedule["frequency"]>("weekly");
  const [day, setDay] = useState(1);
  const [runTime, setRunTime] = useState("07:00");
  const [format, setFormat] = useState<Insight360Export["format"]>("xlsx");
  const [recipientIds, setRecipientIds] = useState<number[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [nextDate, setNextDate] = useState("");
  const [page, setPage] = useState(1);

  const schedules = useQuery({ queryKey: ["insight360", "schedules"], queryFn: insight360Service.schedules });
  const definitions = useQuery({ queryKey: ["insight360", "definitions", "schedule"], queryFn: () => insight360Service.definitions({ per_page: 200, status: "active" }) });
  const recipients = useQuery({ queryKey: ["insight360", "recipients"], queryFn: insight360Service.recipients });
  const reports = useMemo(() => definitions.data?.items ?? [], [definitions.data?.items]);
  const scheduleItems = useMemo(() => schedules.data?.items ?? [], [schedules.data?.items]);
  const selectedReportUuid = reportUuid || reports[0]?.uuid || "";
  const selectedReport = reports.find((report) => report.uuid === selectedReportUuid);
  const visibleRecipients = (recipients.data ?? []).filter((person) => `${person.name} ${person.email}`.toLowerCase().includes(recipientSearch.trim().toLowerCase()));
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["insight360", "schedules"] });

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  function openCreate() {
    setEditing(null); setReportUuid(initialReport); setName(""); setFrequency("weekly"); setDay(1); setRunTime("07:00"); setFormat("xlsx"); setRecipientIds([]); setRecipientSearch(""); setDrawerOpen(true);
  }

  function openEdit(schedule: Insight360Schedule) {
    setEditing(schedule); setReportUuid(schedule.report.uuid); setName(schedule.name); setFrequency(schedule.frequency); setDay(schedule.day_of_week ?? schedule.day_of_month ?? 1); setRunTime(schedule.run_time.slice(0, 5)); setFormat(schedule.format); setRecipientIds(schedule.recipient_user_ids); setRecipientSearch(""); setDrawerOpen(true);
  }

  const save = useMutation({
    mutationFn: (payload: Insight360SchedulePayload) => editing ? insight360Service.updateSchedule(editing.uuid, payload) : insight360Service.createSchedule(payload),
    onSuccess: () => { closeDrawer(); refresh(); },
  });
  const runNow = useMutation({ mutationFn: insight360Service.runScheduleNow, onSuccess: refresh });
  const toggle = useMutation({ mutationFn: ({ uuid, active }: { uuid: string; active: boolean }) => insight360Service.updateSchedule(uuid, { is_active: active }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: insight360Service.deleteSchedule, onSuccess: refresh });

  const filtered = useMemo(() => scheduleItems.filter((schedule) => {
    const term = query.trim().toLowerCase();
    const status = scheduleStatus(schedule).label.toLowerCase();
    return (!term || `${schedule.name} ${schedule.report.name}`.toLowerCase().includes(term)) && (statusFilter === "all" || status === statusFilter) && (frequencyFilter === "all" || schedule.frequency === frequencyFilter) && (formatFilter === "all" || schedule.format === formatFilter) && (!nextDate || schedule.next_run_at?.slice(0, 10) === nextDate);
  }).sort((a, b) => new Date(a.next_run_at ?? "9999-12-31").getTime() - new Date(b.next_run_at ?? "9999-12-31").getTime()), [scheduleItems, query, statusFilter, frequencyFilter, formatFilter, nextDate]);
  const upcoming = scheduleItems.filter((item) => item.is_active && item.next_run_at).sort((a, b) => new Date(a.next_run_at!).getTime() - new Date(b.next_run_at!).getTime());
  const activeCount = scheduleItems.filter((item) => item.is_active).length;
  const pausedCount = scheduleItems.filter((item) => !item.is_active).length;
  const failedCount = scheduleItems.filter((item) => item.last_status === "failed").length;
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visibleSchedules = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const canSave = Boolean(selectedReportUuid && name.trim() && recipientIds.length && !save.isPending);

  if (schedules.isLoading || definitions.isLoading || recipients.isLoading) return <div className="bg-white p-6"><LoadingPanel label="Loading scheduled deliveries" /></div>;
  if (schedules.error || definitions.error || recipients.error) return <div className="bg-white p-6"><ErrorPanel message="Schedules or recipients could not be loaded." /></div>;

  function submitSchedule(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    save.mutate({ report_uuid: selectedReportUuid, name: name.trim(), frequency, day_of_week: frequency === "weekly" ? day : null, day_of_month: ["monthly", "quarterly"].includes(frequency) ? day : null, run_time: runTime, timezone: DEFAULT_TIMEZONE, format, recipient_user_ids: recipientIds, filters: editing?.filters ?? [], is_active: editing?.is_active ?? true });
  }

  return <div className="min-h-full bg-brand-100 text-brand-900"><div className="space-y-5">
    <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 xl:flex-row xl:items-center xl:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Schedules</h1><p className="mt-1.5 text-sm text-gray-600">Automate recurring report generation and delivery to authorised colleagues.</p></div><div className="flex flex-wrap items-center gap-3"><ScopeIndicator companyName={company?.name} /><span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800"><Globe2 aria-hidden="true" className="h-4 w-4 text-brand-700" />{DEFAULT_TIMEZONE}</span><button type="button" onClick={openCreate} className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"><Plus aria-hidden="true" className="h-4 w-4" />Create Schedule</button></div></header>

    <section aria-label="Schedule summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MetricCard title="Active Schedules" value={activeCount} description="Currently running as scheduled" icon={CalendarClock} tone="purple" /><MetricCard title="Next Delivery" value={upcoming[0] ? formatDateTime(upcoming[0].next_run_at) : "None scheduled"} description="Earliest upcoming delivery" icon={Clock3} tone="orange" /><MetricCard title="Paused" value={pausedCount} description="Temporarily paused schedules" icon={Pause} tone="lavender" /><MetricCard title="Failed Last Run" value={failedCount} description="Requires attention and review" icon={CircleAlert} tone="coral" /><MetricCard title="Upcoming Deliveries" value={upcoming.length} description="Active schedules with a next run" icon={Send} tone="green" /></section>

    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_3px_12px_rgba(30,26,58,0.05)]"><div className="flex items-center justify-between"><h2 className="text-base font-bold">Upcoming Deliveries</h2><span className="text-xs font-semibold text-brand-700">Next {Math.min(3, upcoming.length)}</span></div>{upcoming.length === 0 ? <div className="py-8 text-center text-sm text-gray-600">No active deliveries are scheduled.</div> : <div className="mt-4 grid gap-4 lg:grid-cols-3">{upcoming.slice(0, 3).map((schedule, index) => <article key={schedule.uuid} className="relative rounded-lg border border-gray-200 bg-brand-100 p-4"><span className={`absolute left-0 top-5 h-3 w-3 -translate-x-1/2 rounded-full ${index === 0 ? "bg-brand-600" : index === 1 ? "bg-amber-500" : "bg-emerald-700"}`} /><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-brand-900">{schedule.name}</h3><p className="mt-1 text-xs text-gray-600">{reportDisplayName(schedule.report.name)}</p></div><span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Scheduled</span></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600"><span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-4 w-4" />{formatDate(schedule.next_run_at)}</span><span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-4 w-4" />{formatTime(schedule.run_time)}</span><span className="inline-flex items-center gap-1.5"><FormatIcon format={schedule.format} />{schedule.format.toUpperCase()}</span><span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="h-4 w-4" />{schedule.recipient_user_ids.length} recipient{schedule.recipient_user_ids.length === 1 ? "" : "s"}</span></div></article>)}</div>}</section>

    <section aria-label="Schedule filters" className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_3px_12px_rgba(30,26,58,0.05)] md:grid-cols-2 xl:grid-cols-[minmax(250px,1.5fr)_repeat(3,minmax(125px,0.65fr))_minmax(170px,0.9fr)_auto]"><label className="relative"><span className="sr-only">Search schedules</span><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search schedule or report name…" className="h-12 w-full rounded-lg border border-gray-200 pl-10 pr-3 text-xs outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15" /></label>{[["Status", statusFilter, setStatusFilter, [["all", "All"], ["active", "Active"], ["paused", "Paused"], ["failed", "Failed"]]], ["Frequency", frequencyFilter, setFrequencyFilter, [["all", "All"], ["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"], ["quarterly", "Quarterly"]]], ["Format", formatFilter, setFormatFilter, [["all", "All"], ["xlsx", "Excel"], ["csv", "CSV"], ["pdf", "PDF"]]]] .map(([label, value, setter, options]) => <label key={label as string} className="relative rounded-lg border border-gray-200 px-3 pt-1.5"><span className="block text-xs text-gray-600">{label as string}</span><select value={value as string} onChange={(event) => { (setter as (value: string) => void)(event.target.value); setPage(1); }} className="h-9 w-full cursor-pointer appearance-none bg-transparent pr-6 text-xs font-medium outline-none">{(options as string[][]).map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5" /></label>)}<label className="rounded-lg border border-gray-200 px-3 pt-1.5"><span className="block text-xs text-gray-600">Next Delivery</span><input type="date" value={nextDate} onChange={(event) => { setNextDate(event.target.value); setPage(1); }} className="h-9 w-full bg-transparent text-xs outline-none" /></label><button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); setFrequencyFilter("all"); setFormatFilter("all"); setNextDate(""); setPage(1); }} className="transition-colors inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100"><X aria-hidden="true" className="h-4 w-4" />Clear Filters</button></section>

    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_3px_12px_rgba(30,26,58,0.05)]"><div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4"><h2 className="text-base font-bold">All Schedules</h2><span className="text-xs text-gray-600">{filtered.length} schedule{filtered.length === 1 ? "" : "s"}</span></div>{filtered.length === 0 ? <div className="p-10 text-center"><CalendarClock aria-hidden="true" className="mx-auto h-9 w-9 text-brand-600" /><h3 className="mt-3 font-bold">No schedules found</h3><p className="mt-1 text-sm text-gray-600">Create a schedule or adjust the filters above.</p><button type="button" onClick={openCreate} className="mt-5 min-h-11 cursor-pointer rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white">Create schedule</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] table-fixed text-left text-xs"><caption className="sr-only">Scheduled Insight360 reports</caption><thead className="border-b border-gray-200 bg-brand-100"><tr><th className="w-[17%] px-5 py-3">Schedule</th><th className="w-[15%] px-3 py-3">Report</th><th className="w-[9%] px-3 py-3">Frequency</th><th className="w-[9%] px-3 py-3">Delivery Time</th><th className="w-[9%] px-3 py-3">Recipients</th><th className="w-[8%] px-3 py-3">Format</th><th className="w-[10%] px-3 py-3">Next Delivery</th><th className="w-[10%] px-3 py-3">Last Run</th><th className="w-[7%] px-3 py-3">Status</th><th className="w-[12%] px-3 py-3">Actions</th></tr></thead><tbody>{visibleSchedules.map((schedule) => { const status = scheduleStatus(schedule); return <tr key={schedule.uuid} className="transition-colors border-b border-gray-200 last:border-b-0 hover:bg-brand-100"><td className="px-5 py-3"><span className="flex items-center gap-2 font-semibold"><span className={`h-2 w-2 rounded-full ${status.dot}`} />{schedule.name}</span></td><td className="px-3 py-3 text-gray-700">{reportDisplayName(schedule.report.name)}</td><td className="px-3 py-3 capitalize">{schedule.frequency}</td><td className="px-3 py-3">{formatTime(schedule.run_time)}</td><td className="px-3 py-3">{schedule.recipient_user_ids.length} recipient{schedule.recipient_user_ids.length === 1 ? "" : "s"}</td><td className="px-3 py-3"><span className="inline-flex items-center gap-1.5"><FormatIcon format={schedule.format} />{schedule.format.toUpperCase()}</span></td><td className="px-3 py-3">{formatDate(schedule.next_run_at)}</td><td className="px-3 py-3"><span className={schedule.last_status === "failed" ? "text-red-700" : ""}>{formatDate(schedule.last_run_at)}<br />{schedule.last_status ? schedule.last_status.replaceAll("_", " ") : "Not run"}</span></td><td className="px-3 py-3"><span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></td><td className="px-3 py-3"><div className="flex gap-1"><button type="button" onClick={() => runNow.mutate(schedule.uuid)} aria-label={`Run ${schedule.name} now`} title="Run now" className="transition-colors flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-brand-700 hover:bg-brand-100"><Play aria-hidden="true" className="h-3.5 w-3.5" /></button><button type="button" onClick={() => openEdit(schedule)} aria-label={`Edit ${schedule.name}`} title="Edit" className="transition-colors flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-brand-700 hover:bg-brand-100"><Pencil aria-hidden="true" className="h-3.5 w-3.5" /></button><button type="button" onClick={() => toggle.mutate({ uuid: schedule.uuid, active: !schedule.is_active })} aria-label={schedule.is_active ? `Pause ${schedule.name}` : `Resume ${schedule.name}`} title={schedule.is_active ? "Pause" : "Resume"} className="transition-colors flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-brand-700 hover:bg-brand-100">{schedule.is_active ? <Pause aria-hidden="true" className="h-3.5 w-3.5" /> : <Play aria-hidden="true" className="h-3.5 w-3.5" />}</button><button type="button" onClick={() => { if (window.confirm(`Delete “${schedule.name}”?`)) remove.mutate(schedule.uuid); }} aria-label={`Delete ${schedule.name}`} title="Delete" className="transition-colors flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-red-700 hover:bg-red-50"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /></button></div></td></tr>; })}</tbody></table></div>} {filtered.length > 0 && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3 text-xs text-gray-600"><span>{(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length} schedules</span><nav aria-label="Schedule pages" className="flex items-center gap-1"><button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} aria-label="Previous schedule page" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md disabled:opacity-35"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((item) => <button type="button" key={item} onClick={() => setPage(item)} aria-current={safePage === item ? "page" : undefined} className={`flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md px-2 font-semibold ${safePage === item ? "bg-brand-700 text-white" : "hover:bg-brand-100"}`}>{item}</button>)}<button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} aria-label="Next schedule page" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md disabled:opacity-35"><ChevronRight aria-hidden="true" className="h-4 w-4" /></button></nav></footer>}</section>

    <Sheet open={drawerOpen} onOpenChange={(open) => { if (!open) closeDrawer(); else setDrawerOpen(true); }}><SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[460px]"><form onSubmit={submitSchedule} className="flex min-h-full flex-col"><SheetHeader className="border-b border-gray-200 p-5 text-left"><SheetTitle className="text-xl font-bold text-brand-900">{editing ? "Edit Schedule" : "Create Schedule"}</SheetTitle><SheetDescription>Configure a recurring report delivery using recipients who already have access.</SheetDescription></SheetHeader><div className="flex-1 space-y-6 p-5"><section><h3 className="flex items-center gap-2 text-sm font-bold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700">1</span>Report</h3><div className="mt-3 space-y-3"><label className="block text-xs font-semibold">Report<select value={selectedReportUuid} onChange={(event) => setReportUuid(event.target.value)} className={FIELD_CLASS}>{reports.map((report) => <option key={report.uuid} value={report.uuid}>{reportDisplayName(report.name)}</option>)}</select></label><label className="block text-xs font-semibold">Schedule Name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Monthly attendance summary" className={FIELD_CLASS} /></label>{selectedReport && ["salary", "pii"].includes(selectedReport.sensitivity) && <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />This report contains {selectedReport.sensitivity === "salary" ? "salary and payroll" : "personally identifiable"} data. Ensure recipients have appropriate access.</p>}</div></section><section className="border-t border-gray-200 pt-5"><h3 className="flex items-center gap-2 text-sm font-bold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700">2</span>Recurrence</h3><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Frequency<select value={frequency} onChange={(event) => setFrequency(event.target.value as Insight360Schedule["frequency"])} className={FIELD_CLASS}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label>{frequency === "weekly" ? <label className="text-xs font-semibold">Weekday<select value={day} onChange={(event) => setDay(Number(event.target.value))} className={FIELD_CLASS}>{WEEKDAYS.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></label> : frequency !== "daily" ? <label className="text-xs font-semibold">Day of Month<input type="number" min={1} max={31} value={day} onChange={(event) => setDay(Number(event.target.value))} className={FIELD_CLASS} /></label> : <div />}<label className="text-xs font-semibold">Run Time<input type="time" required value={runTime} onChange={(event) => setRunTime(event.target.value)} className={FIELD_CLASS} /></label><label className="text-xs font-semibold">Timezone<input readOnly value={DEFAULT_TIMEZONE} className={`${FIELD_CLASS} bg-brand-100`} /></label></div></section><section className="border-t border-gray-200 pt-5"><h3 className="flex items-center gap-2 text-sm font-bold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700">3</span>Output</h3><fieldset className="mt-3"><legend className="text-xs font-semibold">Format</legend><div className="mt-2 grid grid-cols-3 gap-2">{(["xlsx", "csv", "pdf"] as const).map((item) => <label key={item} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs font-semibold ${format === item ? "border-brand-600 bg-brand-100" : "border-gray-200"}`}><FormatIcon format={item} /><span>{item === "xlsx" ? "Excel" : item.toUpperCase()}</span><input type="radio" name="schedule-format" value={item} checked={format === item} onChange={() => setFormat(item)} className="ml-auto accent-brand-700" /></label>)}</div></fieldset></section><section className="border-t border-gray-200 pt-5"><h3 className="flex items-center gap-2 text-sm font-bold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700">4</span>Recipients</h3><label className="relative mt-3 block"><span className="sr-only">Search recipients</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-600" /><input value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} placeholder="Search recipients…" className="h-11 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-xs outline-none focus:border-brand-700" /></label><div className="mt-2 flex items-center justify-between text-xs"><span>{recipientIds.length} selected</span>{recipientIds.length > 0 && <button type="button" onClick={() => setRecipientIds([])} className="min-h-8 cursor-pointer font-semibold text-brand-700">Clear all</button>}</div><div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200">{visibleRecipients.map((person) => <label key={person.id} className="transition-colors grid min-h-11 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-gray-200 px-3 text-xs last:border-0 hover:bg-brand-100"><input type="checkbox" checked={recipientIds.includes(person.id)} onChange={(event) => setRecipientIds((current) => event.target.checked ? [...current, person.id] : current.filter((id) => id !== person.id))} className="h-4 w-4 accent-brand-700" /><span className="min-w-0"><span className="block font-semibold">{person.name}</span><span className="block truncate text-xs text-gray-600">{person.email}</span></span><CheckCircle2 aria-label="Eligible recipient" className="h-4 w-4 text-emerald-700" /></label>)}</div></section><section className="border-t border-gray-200 pt-5"><h3 className="flex items-center gap-2 text-sm font-bold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700">5</span>Review</h3><p className="mt-3 rounded-lg bg-brand-100 p-3 text-xs leading-5 text-gray-700">Send <strong>{selectedReport ? reportDisplayName(selectedReport.name) : "the selected report"}</strong> as <strong>{format === "xlsx" ? "Excel" : format.toUpperCase()}</strong> {frequency} at <strong>{formatTime(runTime)}</strong> to <strong>{recipientIds.length} recipient{recipientIds.length === 1 ? "" : "s"}</strong>.</p></section>{save.isError && <p role="alert" className="flex gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800"><CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />The schedule could not be saved. Check recipient access and try again.</p>}</div><SheetFooter className="sticky bottom-0 border-t border-gray-200 bg-white p-5"><button type="button" onClick={closeDrawer} className="min-h-11 flex-1 cursor-pointer rounded-lg border border-brand-600 text-sm font-semibold text-brand-700">Cancel</button><button type="submit" disabled={!canSave} className="transition-colors min-h-11 flex-1 cursor-pointer rounded-lg bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">{save.isPending ? "Saving…" : editing ? "Save Changes" : "Save Schedule"}</button></SheetFooter></form></SheetContent></Sheet>
  </div></div>;
}

export default function Insight360SchedulesPage() {
  return <Suspense fallback={<div className="bg-white p-6"><LoadingPanel label="Loading scheduled deliveries" /></div>}><Insight360SchedulesPageContent /></Suspense>;
}
