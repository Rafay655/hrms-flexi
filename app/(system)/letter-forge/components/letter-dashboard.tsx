"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Send, Clock, PenLine, LayoutTemplate, Layers, CircleAlert, CheckCheck } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/ui/searchable-select";
import { LetterStatus, LetterError } from "./letter-ui";
import { useLetterDashboard } from "@/hooks/use-generated-letters";
import { parseApiError } from "@/lib/api-error";


const colors = ["#322E53", "#5c5490", "#EEC293", "#F3AB9D", "#49426E", "#f7c9b9"];
const tooltipStyle = { borderRadius: 10, border: "1px solid #5c549040", fontSize: 12 };
const axis = { fontSize: 11, fill: "#49426E" };
const number = (value: number) => value.toLocaleString("en-US");
function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <Card className="h-full min-w-0"><CardHeader><CardTitle className="text-base font-semibold text-brand-900">{title}</CardTitle><CardDescription className="text-xs">{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card>;
}

export default function LetterDashboard() {
  const [period, setPeriod] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const query = useLetterDashboard(period);
  const monthOptions = Array.from({ length: 24 }, (_, index) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return { value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
  });
  if (query.isPending) return <div role="status" className="p-8 text-brand-800">Loading Letter Forge dashboard…</div>;
  if (query.isError) return <div className="p-8"><LetterError message={parseApiError(query.error).message} retry={() => void query.refetch()} /></div>;
  if (!query.data?.success || !query.data.data) return <div className="p-8"><LetterError message={query.data?.message || "Dashboard data is unavailable."} retry={() => void query.refetch()} /></div>;
  const dashboard = query.data.data;
  const data = {
    periodLabel: dashboard.month_label,
    statuses: dashboard.status_breakdown.map(item => ({ key: item.status, name: item.label, value: item.count })),
    trend: dashboard.trend.months.map((month, index) => ({ month: dashboard.trend.labels[index] || month, generated: dashboard.trend.generated[index] ?? 0, dispatched: dashboard.trend.dispatched[index] ?? 0 })),
    types: [...dashboard.top_letter_types.map(item => ({ name: item.label, value: item.count })), ...(dashboard.top_letter_types_other > 0 ? [{ name: "Other", value: dashboard.top_letter_types_other }] : [])],
    channels: dashboard.delivery_channels.channels.map(item => ({ name: item.label, value: item.count, percentage: item.percentage })),
    acknowledgements: { received: dashboard.acknowledgement.acknowledged, pending: dashboard.acknowledgement.pending },
    templates: { total: dashboard.template_library.total, published: dashboard.template_library.published, ready: dashboard.template_library.active_published },
    batches: dashboard.recent_batches.map(item => ({ ...item, name: item.label, total: item.employees, success: item.generated })),
    recentLetters: dashboard.recent_letters.map(item => ({ uuid: item.uuid, reference: item.reference_number || "—", employee: item.employee?.name || "—", code: item.employee?.employee_code || "—", template: item.template?.name || item.template_key, date: item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—", channel: dashboard.delivery_channels.channels.find(channel => channel.channel === item.dispatch_channel)?.label ?? item.dispatch_channel, status: item.status })),
  };
  const total = dashboard.status_total;
  const dispatched = dashboard.kpi.dispatched;
  const recent = data.recentLetters.filter((letter) => (status === "all" || letter.status === status) && `${letter.employee} ${letter.code} ${letter.template} ${letter.reference}`.toLowerCase().includes(search.trim().toLowerCase()));
  const stats = [
    { title: "Letters generated", value: dashboard.kpi.letters_generated, note: "Created in selected month", icon: FileText, bg: "from-[#322E53] to-[#49426E]", light: false },
    { title: "Dispatched", value: dispatched, note: "Currently issued letters", icon: Send, bg: "from-[#49426E] to-[#5c5490]", light: false },
    { title: "Pending approval", value: dashboard.kpi.pending_approval, note: "Awaiting an HR decision", icon: Clock, bg: "from-[#EEC293] to-[#e8b57a]", light: true },
    { title: "Pending signature", value: dashboard.kpi.pending_signature, note: "Awaiting internal signing", icon: PenLine, bg: "from-[#F3AB9D] to-[#ef9083]", light: true },
    { title: "Pending acknowledgement", value: dashboard.kpi.pending_acknowledgement, note: "Issued; receipt not confirmed", icon: CheckCheck, bg: "from-[#5c5490] to-[#49426E]", light: false },
    { title: "Published templates", value: dashboard.kpi.published_templates, note: `${data.templates.total} templates in the library`, icon: LayoutTemplate, bg: "from-[#322E53] to-[#5c5490]", light: false },
  ];

  return <div className="flex min-h-screen flex-col gap-6 bg-white p-4 md:p-8">
    <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
      <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight text-brand-900">Letter Forge</h1></div><p className="mt-1 text-sm text-muted-foreground">Employee letters, approvals, delivery and bulk generation.</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="w-44"><SearchableSelect aria-label="Dashboard month" value={period} onChange={(value) => setPeriod(value)} allowAll={false} options={monthOptions} /></div><Button asChild className="bg-brand-800 text-white hover:bg-brand-900"><Link href="/letter-forge/templates"><LayoutTemplate className="h-4 w-4" />Choose template</Link></Button></div>
    </header>
    <p className="rounded-lg border border-brand-300 bg-brand-100/40 px-4 py-3 text-xs text-brand-800">{data.periodLabel}{dashboard.is_current_month ? " · Month to date" : ""}. Letter metrics cover letters created in the selected month; template inventory is a snapshot.</p>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{stats.map((stat) => <Card key={stat.title} className={`gap-0 border-0 bg-gradient-to-br ${stat.bg} py-0 shadow-lg`}><div className={`p-5 ${stat.light ? "text-[#322E53]" : "text-white"}`}><stat.icon className="mb-4 h-6 w-6 opacity-90" /><p className="text-3xl font-semibold">{number(stat.value)}</p><p className="mt-1 text-sm font-medium">{stat.title}</p><p className="mt-2 text-[11px] opacity-80">{stat.note}</p></div></Card>)}</div>
    <nav aria-label="Letter Forge shortcuts" className="flex flex-wrap gap-2">{[{ href: "/letter-forge/templates", label: "Manage templates", icon: LayoutTemplate }, { href: "/letter-forge/letters", label: "View letters", icon: FileText }, { href: "/letter-forge/letter-batches", label: "Letter batches", icon: Layers }].map((item) => <Button key={item.href} variant="outline" asChild className="border-brand-700 text-brand-800 hover:bg-brand-100"><Link href={item.href}><item.icon className="h-4 w-4" />{item.label}</Link></Button>)}</nav>

    <div className="grid gap-6 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2"><Panel title="Letter generation & delivery" description={dashboard.trend.note}>
        <div className="h-72" role="img" aria-label={`Monthly activity: ${data.trend.map((item) => `${item.month}: ${item.generated} generated, ${item.dispatched} dispatched`).join("; ")}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
          <defs><linearGradient id="lf-generated" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[0]} stopOpacity={0.25} /><stop offset="100%" stopColor={colors[0]} stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#5c549020" /><XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="generated" name="Generated" stroke={colors[0]} strokeWidth={2.5} fill="url(#lf-generated)" /><Area type="monotone" dataKey="dispatched" name="Dispatched" stroke={colors[2]} strokeWidth={2.5} fill="transparent" />
        </AreaChart></ResponsiveContainer></div><div className="mt-3 flex justify-center gap-5 text-xs text-brand-700"><span>● Generated</span><span className="text-[#9b632d]">● Dispatched</span></div>
      </Panel></div>
      <Panel title="Letter status" description="Current status of the selected month's letters.">
        <div className="relative h-48" role="img" aria-label={data.statuses.map((item) => `${item.name}: ${item.value}`).join(", ")}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.statuses} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={2}>{data.statuses.map((item, index) => <Cell key={item.key} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold text-brand-900">{number(total)}</span><span className="text-xs text-muted-foreground">Total letters</span></div></div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">{data.statuses.map((item, index) => <div key={item.key} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} /><span className="text-muted-foreground">{item.name}</span><span className="ml-auto font-semibold">{item.value}</span></div>)}</div>
      </Panel>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Needs attention" description="Outstanding actions for the selected month's letters."><div className="space-y-4">{[{ label: "Awaiting approval", value: dashboard.needs_attention.awaiting_approval.count, icon: Clock, note: dashboard.needs_attention.awaiting_approval.hint }, { label: "Awaiting signature", value: dashboard.needs_attention.awaiting_signature.count, icon: PenLine, note: dashboard.needs_attention.awaiting_signature.hint }, { label: "Awaiting acknowledgement", value: dashboard.needs_attention.awaiting_acknowledgement.count, icon: CheckCheck, note: dashboard.needs_attention.awaiting_acknowledgement.hint }, { label: "Generation failed", value: dashboard.needs_attention.generation_failed.count, icon: CircleAlert, note: dashboard.needs_attention.generation_failed.hint }].map((item) => <div key={item.label} className="flex gap-3 rounded-lg bg-brand-100/40 p-3"><item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /><div className="flex-1"><p className="text-sm font-medium text-brand-900">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div><span className="text-lg font-semibold text-brand-800">{item.value}</span></div>)}</div></Panel>
      <Panel title="Most generated letter types" description="Breakdown of letters created in the selected month."><div className="h-72" role="img" aria-label={data.types.map((item) => `${item.name}: ${item.value}`).join(", ")}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.types} layout="vertical" margin={{ left: 0, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#5c549020" /><XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} /><YAxis dataKey="name" type="category" width={95} tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="Letters" fill={colors[1]} radius={[0, 4, 4, 0]} barSize={18} /></BarChart></ResponsiveContainer></div></Panel>
      <Panel title="Delivery channels" description="Channel used for letters currently dispatched."><div className="space-y-5">{data.channels.map((channel, index) => <div key={channel.name}><div className="mb-2 flex justify-between text-sm"><span className="text-brand-800">{channel.name}</span><span className="font-semibold">{channel.value} <span className="text-xs font-normal text-muted-foreground">({Math.round(channel.percentage)}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, channel.percentage))}%`, background: colors[index] }} /></div></div>)}</div><div className="mt-6 rounded-lg border border-brand-300 p-3"><p className="text-sm font-medium text-brand-900">Employee acknowledgement</p><p className="mt-1 text-xs text-muted-foreground">{data.acknowledgements.received} of {dashboard.acknowledgement.required} required receipts confirmed. Acknowledgement is separate from approval and signing.</p></div></Panel>
    </div>

    <div className="grid gap-6 lg:grid-cols-3"><div className="lg:col-span-2"><Panel title="Bulk generation" description="Recent batches created in the selected month."><div className="space-y-4">{!data.batches.length && <p className="py-8 text-center text-sm text-muted-foreground">No batches in this month.</p>}{data.batches.map((batch) => <div key={batch.uuid} className="rounded-lg border border-brand-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-brand-900">{batch.name}</p><Badge variant="outline">{batch.status.replaceAll("_", " ")}{batch.dry_run && !batch.committed_at ? " · Dry run" : ""}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{batch.eligible} eligible · {batch.skipped} skipped · {batch.total} employees</p><div className="my-3 h-2 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-700" style={{ width: `${(batch.success + batch.failed) / Math.max(batch.eligible, 1) * 100}%` }} /></div><p className="text-xs text-brand-700">{batch.is_committable ? "Eligibility preview ready — awaiting commit" : `${batch.success} generated · ${batch.failed} failed · ${batch.remaining} remaining`}</p></div>)}</div><Button asChild variant="link" className="mt-3 px-0 text-brand-800"><Link href="/letter-forge/letter-batches">Open letter batches<ArrowRight className="h-4 w-4" /></Link></Button></Panel></div>
      <Panel title="Template library" description="Current template inventory."><p className="text-4xl font-semibold text-brand-900">{data.templates.total}</p><p className="mt-1 text-xs text-muted-foreground">Templates across your letter types</p><div className="my-6 space-y-4">{[{ label: "Published", value: data.templates.published }, { label: "Unpublished", value: dashboard.template_library.unpublished }, { label: "Active & published", value: data.templates.ready }].map((item) => <div key={item.label} className="flex justify-between border-b border-brand-100 pb-3 text-sm"><span className="text-muted-foreground">{item.label}</span><span className="font-semibold text-brand-900">{item.value}</span></div>)}</div><p className="text-xs leading-relaxed text-muted-foreground">Only active, published templates can generate letters. Choose a template and use Generate in its action menu.</p><Button asChild variant="link" className="mt-3 px-0 text-brand-800"><Link href="/letter-forge/templates">Open templates<ArrowRight className="h-4 w-4" /></Link></Button></Panel>
    </div>

    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base font-semibold text-brand-900">Recent letters</CardTitle><CardDescription className="mt-1 text-xs">Latest activity in the selected month.</CardDescription></div><Button asChild variant="outline" size="sm"><Link href="/letter-forge/letters">View all letters<ArrowRight className="h-4 w-4" /></Link></Button></div><div className="mt-3 flex flex-col gap-3 sm:flex-row"><Input aria-label="Search letters" className="sm:max-w-sm" placeholder="Search employee, letter or reference…" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="sm:w-56"><SearchableSelect aria-label="Filter letters by status" value={status} onChange={setStatus} allowAll={false} options={[{ value: "all", label: "All statuses" }, ...data.statuses.map((item) => ({ value: item.key, label: item.name }))]} /></div></div></CardHeader>
      <CardContent><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-brand-200 bg-brand-100/50 text-xs text-brand-700"><tr>{["Reference", "Employee", "Letter type", "Created", "Channel", "Status"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-brand-100">{recent.map((letter) => <tr key={letter.uuid} className="hover:bg-brand-100/30"><td className="whitespace-nowrap px-4 py-4 text-xs text-brand-700">{letter.reference}</td><td className="px-4 py-4"><p className="whitespace-nowrap font-medium text-brand-900">{letter.employee}</p><p className="mt-1 text-xs text-muted-foreground">{letter.code}</p></td><td className="whitespace-nowrap px-4 py-4">{letter.template}</td><td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{letter.date}</td><td className="whitespace-nowrap px-4 py-4 text-xs">{letter.channel ?? "—"}</td><td className="whitespace-nowrap px-4 py-4"><LetterStatus status={letter.status} /></td></tr>)}{!recent.length && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No letters match your filters.</td></tr>}</tbody></table></div><p className="mt-4 text-xs text-muted-foreground">Showing {recent.length} of {data.recentLetters.length} recent letters.</p></CardContent>
    </Card>
  </div>;
}
