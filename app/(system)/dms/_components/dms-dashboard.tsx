"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Clock, PenLine, FolderTree, Layers, CircleAlert, CalendarClock } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/ui/searchable-select";

import { useDmsDashboard } from "@/hooks/use-dms-dashboard";
import { parseApiError } from "@/lib/api-error";

const colors = ["#322E53", "#5c5490", "#EEC293", "#F3AB9D", "#49426E", "#f7c9b9"];
const tooltipStyle = { borderRadius: 10, border: "1px solid #5c549040", fontSize: 12 };
const axis = { fontSize: 11, fill: "#49426E" };
const number = (value: number) => value.toLocaleString("en-US");
function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <Card className="h-full min-w-0"><CardHeader><CardTitle className="text-base font-semibold text-brand-900">{title}</CardTitle><CardDescription className="text-xs">{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card>;
}

export default function DmsDashboard() {
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const query = useDmsDashboard(period);
  if (query.isPending) return <div role="status" className="p-8 text-brand-800">Loading DMS dashboard…</div>;
  if (query.isError) return <div role="alert" className="p-8 text-red-700"><p>{parseApiError(query.error).message}</p><Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>Try again</Button></div>;
  const dashboard = query.data;
  const currentDateParts = new Intl.DateTimeFormat("en-US", { timeZone: dashboard.timezone, year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const year = Number(currentDateParts.find(part => part.type === "year")?.value);
  const month = Number(currentDateParts.find(part => part.type === "month")?.value);
  const monthOptions = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1));
    return { value: date.toISOString().slice(0, 7), label: date.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" }) };
  });
  if (!monthOptions.some(option => option.value === dashboard.month)) monthOptions.push({ value: dashboard.month, label: dashboard.month_label });
  const data = {
    periodLabel: dashboard.month_label,
    statuses: dashboard.status_breakdown.map(item => ({ key: item.status, name: item.label, value: item.count })),
    trend: dashboard.trend.months.map((month, index) => ({ month: dashboard.trend.labels[index] || month, uploaded: dashboard.trend.uploaded[index] ?? 0, verified: dashboard.trend.verified[index] ?? 0 })),
    types: [...dashboard.document_types.map(item => ({ name: item.label, value: item.count })), ...(dashboard.document_types_other > 0 ? [{ name: "Other", value: dashboard.document_types_other }] : [])],
    folders: dashboard.folder_distribution.folders.map(item => ({ name: item.label, value: item.count, percentage: item.percentage })),
    signatures: dashboard.signatures, compliance: dashboard.compliance,
    batches: dashboard.recent_batches.map(item => ({ ...item, name: item.batch_name, total: item.total_files, success: item.processed })),
    documents: dashboard.recent_documents.map(item => ({ uuid: item.uuid, reference: item.reference_number, code: item.owner?.employee_code, owner: item.owner?.name || "—", name: item.title, type: item.document_type?.name || "Unclassified", date: new Date(item.uploaded_at).toLocaleDateString("en-GB", { timeZone: dashboard.timezone, day: "2-digit", month: "short", year: "numeric" }), folder: item.folder?.name, status: item.verification_status })),
  };
  const total = dashboard.status_total;
  const recent = data.documents.filter((document) => (status === "all" || document.status === status) && `${document.owner} ${document.name} ${document.type} ${document.reference ?? ""} ${document.code ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const stats = [
    { title: "Documents uploaded", value: dashboard.kpi.documents_uploaded, note: "Uploaded in selected month", icon: FileText, bg: "from-[#322E53] to-[#49426E]", light: false },
    { title: "Verified documents", value: dashboard.kpi.verified_documents, note: "Selected uploads now verified", icon: ShieldCheck, bg: "from-[#49426E] to-[#5c5490]", light: false },
    { title: "Pending verification", value: dashboard.kpi.pending_verification, note: "Selected uploads awaiting review", icon: Clock, bg: "from-[#EEC293] to-[#e8b57a]", light: true },
    { title: "Pending signatures", value: dashboard.kpi.pending_signatures, note: "Open requests at reporting date", icon: PenLine, bg: "from-[#F3AB9D] to-[#ef9083]", light: true },
    { title: "Expiring documents", value: dashboard.kpi.expiring_documents, note: "Due in the next 30 days", icon: CalendarClock, bg: "from-[#5c5490] to-[#49426E]", light: false },
    { title: "Folders", value: dashboard.kpi.folders, note: "Accessible document folders", icon: FolderTree, bg: "from-[#322E53] to-[#5c5490]", light: false },
  ];

  return <div className="flex min-h-screen flex-col gap-6 bg-white p-4 md:p-8">
    <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
      <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight text-brand-900">DMS</h1></div><p className="mt-1 text-sm text-muted-foreground">Documents, folders, signatures, bulk uploads and compliance.</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="w-44"><SearchableSelect aria-label="Dashboard month" value={period ?? dashboard.month} onChange={setPeriod} allowAll={false} options={monthOptions} /></div><Button asChild className="bg-brand-800 text-white hover:bg-brand-900"><Link href="/dms/documents"><FileText className="h-4 w-4" />View documents</Link></Button></div>
    </header>
    <p className="rounded-lg border border-brand-300 bg-brand-100/40 px-4 py-3 text-xs text-brand-800">{data.periodLabel}{dashboard.is_current_month ? " · Month to date" : ""}. Upload metrics cover the selected month; signatures, folders and compliance show the current snapshot as of {new Date(dashboard.snapshot_at).toLocaleString("en-GB", { timeZone: dashboard.timezone })} ({dashboard.timezone}).</p>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{stats.map((stat) => <Card key={stat.title} className={`gap-0 border-0 bg-gradient-to-br ${stat.bg} py-0 shadow-lg`}><div className={`p-5 ${stat.light ? "text-[#322E53]" : "text-white"}`}><stat.icon className="mb-4 h-6 w-6 opacity-90" /><p className="text-3xl font-semibold">{number(stat.value)}</p><p className="mt-1 text-sm font-medium">{stat.title}</p><p className="mt-2 text-[11px] opacity-80">{stat.note}</p></div></Card>)}</div>
    <nav aria-label="DMS shortcuts" className="flex flex-wrap gap-2">{[{ href: "/dms/documents", label: "Documents", icon: FileText }, { href: "/dms/folders", label: "Folders", icon: FolderTree }, { href: "/dms/pending-signatures", label: "Pending signatures", icon: PenLine }, { href: "/dms/bulk-upload", label: "Bulk upload", icon: Layers }, { href: "/dms/compliance", label: "Compliance", icon: ShieldCheck }].map((item) => <Button key={item.href} variant="outline" asChild className="border-brand-700 text-brand-800 hover:bg-brand-100"><Link href={item.href}><item.icon className="h-4 w-4" />{item.label}</Link></Button>)}</nav>

    <div className="grid gap-6 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2"><Panel title="Document uploads & verification" description={dashboard.trend.note}>
        <div className="h-72" role="img" aria-label={`Monthly activity: ${data.trend.map((item) => `${item.month}: ${item.uploaded} uploaded, ${item.verified} verified`).join("; ")}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
          <defs><linearGradient id="dms-uploaded" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[0]} stopOpacity={0.25} /><stop offset="100%" stopColor={colors[0]} stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#5c549020" /><XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="uploaded" name="Uploaded" stroke={colors[0]} strokeWidth={2.5} fill="url(#dms-uploaded)" /><Area type="monotone" dataKey="verified" name="Verified" stroke={colors[2]} strokeWidth={2.5} fill="transparent" />
        </AreaChart></ResponsiveContainer></div><div className="mt-3 flex justify-center gap-5 text-xs text-brand-700"><span>● Uploaded</span><span className="text-[#9b632d]">● Verified</span></div>
      </Panel></div>
      <Panel title="Verification status" description="Current verification status of documents uploaded in the selected month.">
        <div className="relative h-48" role="img" aria-label={data.statuses.map((item) => `${item.name}: ${item.value}`).join(", ")}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.statuses} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={2}>{data.statuses.map((item, index) => <Cell key={item.key} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold text-brand-900">{number(total)}</span><span className="text-xs text-muted-foreground">Documents</span></div></div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">{data.statuses.map((item, index) => <div key={item.key} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} /><span className="text-muted-foreground">{item.name}</span><span className="ml-auto font-semibold">{item.value}</span></div>)}</div>
      </Panel>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Needs attention" description="Outstanding document tasks at the reporting date."><div className="space-y-4">{[{ label: "Awaiting verification", value: dashboard.needs_attention.awaiting_verification.count, icon: Clock, note: dashboard.needs_attention.awaiting_verification.hint }, { label: "Awaiting signature", value: dashboard.needs_attention.awaiting_signature.count, icon: PenLine, note: dashboard.needs_attention.awaiting_signature.hint }, { label: "Missing documents", value: dashboard.needs_attention.missing_documents.count, icon: CircleAlert, note: dashboard.needs_attention.missing_documents.hint }, { label: "Expired documents", value: dashboard.needs_attention.expired_documents.count, icon: CalendarClock, note: dashboard.needs_attention.expired_documents.hint }].map((item) => <div key={item.label} className="flex gap-3 rounded-lg bg-brand-100/40 p-3"><item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><div className="flex-1"><p className="text-sm font-medium text-brand-900">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div><span className="text-lg font-semibold text-brand-800">{item.value}</span></div>)}</div></Panel>
      <Panel title="Document types" description="Breakdown of uploads in the selected month."><div className="h-72" role="img" aria-label={data.types.map((item) => `${item.name}: ${item.value}`).join(", ")}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.types} layout="vertical" margin={{ left: 0, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#5c549020" /><XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} /><YAxis dataKey="name" type="category" width={95} tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="Documents" fill={colors[1]} radius={[0, 4, 4, 0]} barSize={18} /></BarChart></ResponsiveContainer></div></Panel>
      <Panel title="Folder distribution" description="Where the selected month's uploads are stored."><div className="space-y-5">{data.folders.map((folder, index) => <div key={folder.name}><div className="mb-2 flex justify-between text-sm"><span className="text-brand-800">{folder.name}</span><span className="font-semibold">{folder.value} <span className="text-xs font-normal text-muted-foreground">({Math.round(folder.percentage)}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full" style={{ width: `${folder.percentage}%`, background: colors[index] }} /></div></div>)}</div><div className="mt-6 rounded-lg border border-brand-300 p-3"><p className="text-sm font-medium text-brand-900">Organised document storage</p><p className="mt-1 text-xs text-muted-foreground">Personal employee records and shared company documents, managed through your DMS folders.</p></div></Panel>
    </div>

    <div className="grid gap-6 lg:grid-cols-3"><div className="lg:col-span-2"><Panel title="Bulk uploads" description="Recent upload batches created in the selected month."><div className="space-y-4">{!data.batches.length && <p className="py-8 text-center text-sm text-muted-foreground">No bulk uploads in this month.</p>}{data.batches.map((batch) => <div key={batch.uuid} className="rounded-lg border border-brand-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-brand-900">{batch.name}</p><Badge variant="outline">{batch.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{batch.total} files in this batch</p><div className="my-3 h-2 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-700" style={{ width: `${Math.min(100, Math.max(0, batch.progress_percentage))}%` }} /></div><p className="text-xs text-brand-700">{batch.success} uploaded · {batch.failed} failed · {batch.remaining} remaining</p></div>)}</div><Button asChild variant="link" className="mt-3 px-0 text-brand-800"><Link href="/dms/bulk-upload">Open bulk uploads<ArrowRight className="h-4 w-4" /></Link></Button></Panel></div>
      <Panel title="Signature requests" description="Current signature request snapshot."><p className="text-4xl font-semibold text-brand-900">{data.signatures.total}</p><p className="mt-1 text-xs text-muted-foreground">Document signature requests</p><div className="my-6 space-y-4">{[{ label: "Pending", value: data.signatures.pending }, { label: "Signed", value: data.signatures.signed }, { label: "Declined", value: data.signatures.declined }, { label: "Expired", value: data.signatures.expired }].map((item) => <div key={item.label} className="flex justify-between border-b border-brand-100 pb-3 text-sm"><span className="text-muted-foreground">{item.label}</span><span className="font-semibold text-brand-900">{item.value}</span></div>)}</div><p className="text-xs leading-relaxed text-muted-foreground">Review documents and complete your assigned signing requests in Pending Signatures.</p><Button asChild variant="link" className="mt-3 px-0 text-brand-800"><Link href="/dms/pending-signatures">Open pending signatures<ArrowRight className="h-4 w-4" /></Link></Button></Panel>
    </div>

    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base font-semibold text-brand-900">Recent documents</CardTitle><CardDescription className="mt-1 text-xs">Latest activity in the selected month.</CardDescription></div><Button asChild variant="outline" size="sm"><Link href="/dms/documents">View all documents<ArrowRight className="h-4 w-4" /></Link></Button></div><div className="mt-3 flex flex-col gap-3 sm:flex-row"><Input aria-label="Search documents" className="sm:max-w-sm" placeholder="Search owner, document or reference…" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="sm:w-56"><SearchableSelect aria-label="Filter documents by status" value={status} onChange={setStatus} allowAll={false} options={[{ value: "all", label: "All statuses" }, ...data.statuses.map((item) => ({ value: item.key, label: item.name }))]} /></div></div></CardHeader>
      <CardContent><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-brand-200 bg-brand-100/50 text-xs text-brand-700"><tr>{["Document", "Owner", "Type", "Uploaded", "Folder", "Verification"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-brand-100">{recent.map((document) => <tr key={document.uuid} className="hover:bg-brand-100/30"><td className="whitespace-nowrap px-4 py-4 text-xs text-brand-700">{document.name}</td><td className="px-4 py-4"><p className="whitespace-nowrap font-medium text-brand-900">{document.owner}</p><p className="mt-1 text-xs text-muted-foreground">{document.code ?? document.reference ?? "—"}</p></td><td className="whitespace-nowrap px-4 py-4">{document.type}</td><td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{document.date}</td><td className="whitespace-nowrap px-4 py-4 text-xs">{document.folder ?? "—"}</td><td className="whitespace-nowrap px-4 py-4"><Badge variant="outline" className={document.status === "verified" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : document.status === "pending" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700"}>{document.status}</Badge></td></tr>)}{!recent.length && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No documents match your filters.</td></tr>}</tbody></table></div><p className="mt-4 text-xs text-muted-foreground">Showing {recent.length} of {data.documents.length} recent documents.</p></CardContent>
    </Card>
  </div>;
}
