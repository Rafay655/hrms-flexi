"use client";

/**
 * FlexiDesk reports — the body of each report (Sprint 7). Pure presentation of what the API returned: figures the server
 * withheld arrive as null and are said in words ("Not enough data"), never drawn as zero.
 */

import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatReportValue, heatLevel } from "@/lib/flexi-desk";
import type {
  EscalationRateReport,
  HeatmapReport,
  ReopenedRateReport,
  ResolutionTimeReport,
  ResolverPerformanceReport,
  SlaComplianceReport,
  SlaTally,
  TicketVolumeReport,
} from "@/types/flexi-desk.types";

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-900">{caption}</caption>
        <thead className="text-xs text-gray-500">
          <tr>{headers.map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-3 py-3 text-gray-500">No data in this window.</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">{r.map((c, j) => <td key={j} className={`px-3 py-2 ${j === 0 ? "text-gray-900" : "text-gray-700"}`}>{c}</td>)}</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const label = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const pair = (m: Record<string, number>) => Object.entries(m).map(([k, v]) => [label(k), v] as [string, number]);

export function VolumeView({ data }: { data: TicketVolumeReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Tickets raised" value={String(data.total)} /></div>
      <section aria-label="Tickets per day" className="rounded-lg border border-gray-200 bg-white p-3">
        <h3 className="mb-2 text-sm font-medium text-gray-900">Tickets per day</h3>
        {data.by_day.length === 0 ? <p className="text-sm text-gray-500">No tickets in this window.</p> : (
          <div className="h-56" role="img" aria-label={`Bar chart of tickets raised per day; ${data.total} in total`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_day}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name="Tickets" fill="#4f46e5" radius={[3, 3, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <DataTable caption="By status" headers={["Status", "Tickets"]} rows={pair(data.by_status)} />
        <DataTable caption="By priority" headers={["Priority", "Tickets"]} rows={pair(data.by_priority)} />
        <DataTable caption="By category" headers={["Category", "Tickets"]} rows={data.by_category.map((c) => [c.category, c.count])} />
      </div>
    </div>
  );
}

function tallyRow(name: string, t: SlaTally): (string | number)[] {
  return [name, t.with_sla, t.met, t.breached, t.undecided, formatReportValue(t.compliance_percent, "percent")];
}

export function SlaView({ data }: { data: SlaComplianceReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Resolution SLA met" value={formatReportValue(data.resolution.compliance_percent, "percent")} hint={`${data.resolution.met} met, ${data.resolution.breached} breached, ${data.resolution.undecided} still running`} />
        <StatCard label="First-response SLA met" value={formatReportValue(data.response.compliance_percent, "percent")} hint={`${data.response.met} met, ${data.response.breached} breached, ${data.response.undecided} still running`} />
      </div>
      <p className="text-xs text-gray-500">Compliance is met ÷ (met + breached). A ticket still inside its deadline is not counted either way.</p>
      <DataTable caption="Resolution SLA by priority" headers={["Priority", "With SLA", "Met", "Breached", "Running", "Compliance"]} rows={Object.entries(data.by_priority).map(([p, t]) => tallyRow(label(p), t))} />
    </div>
  );
}

export function EscalationView({ data }: { data: EscalationRateReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Escalation rate" value={formatReportValue(data.escalation_rate_percent, "percent")} hint={`${data.escalated_tickets} of ${data.tickets} tickets`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DataTable caption="Escalations by trigger" headers={["Trigger", "Escalations"]} rows={pair(data.by_trigger)} />
        <DataTable caption="Highest level reached" headers={["Level", "Tickets"]} rows={Object.entries(data.highest_level).map(([l, n]) => [`Level ${l}`, n])} />
      </div>
    </div>
  );
}

export function ResolutionView({ data }: { data: ResolutionTimeReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Average resolution" value={formatReportValue(data.average_hours, "hours")} hint="Time the SLA clock was paused is not counted." />
        <StatCard label="Median resolution" value={formatReportValue(data.median_hours, "hours")} />
        <StatCard label="Tickets resolved" value={String(data.resolved)} />
      </div>
      <DataTable caption="By priority" headers={["Priority", "Resolved", "Average"]} rows={Object.entries(data.by_priority).map(([p, v]) => [label(p), v.resolved, formatReportValue(v.average_hours, "hours")])} />
    </div>
  );
}

export function ReopenedView({ data }: { data: ReopenedRateReport }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Reopened rate" value={formatReportValue(data.reopened_rate_percent, "percent")} hint={`${data.reopened_tickets} of ${data.resolved_tickets} resolved tickets`} />
        <StatCard label="Reopened more than once" value={String(data.reopened_more_than_once)} />
      </div>
      <p className="text-xs text-gray-500">Counted from each ticket&apos;s status history, so a ticket that was reopened and is being worked again still counts.</p>
    </div>
  );
}

export function ResolverView({ data }: { data: ResolverPerformanceReport }) {
  const rows = data.resolvers.map((r) => ("insufficient_tickets" in r
    ? ["Insufficient tickets", "—", "—", "—", "—", "—"]
    : [r.resolver.name, r.assigned, r.resolved, formatReportValue(r.avg_first_response_hours, "hours"), formatReportValue(r.avg_resolution_hours, "hours"), r.sla_breached]));

  return (
    <div className="space-y-3">
      <p role="note" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{data.notes}</p>
      <DataTable caption="Workload and timing per resolver" headers={["Resolver", "Assigned", "Resolved", "Avg first response", "Avg resolution", "SLA breached"]} rows={rows} />
    </div>
  );
}

const HEAT = ["bg-gray-50 text-gray-400", "bg-indigo-100 text-indigo-900", "bg-indigo-200 text-indigo-900", "bg-indigo-400 text-white", "bg-indigo-600 text-white"];

export function HeatmapView({ data }: { data: HeatmapReport }) {
  const max = Math.max(0, ...data.cells.map((c) => c.count));
  const priorities = ["low", "normal", "high", "critical"];
  const rowKeys = Array.from(new Set(data.cells.map((c) => `${c.category}|||${c.department}`)));
  const count = (k: string, p: string) => data.cells.find((c) => `${c.category}|||${c.department}` === k && c.priority === p)?.count ?? 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Open tickets right now" value={String(data.total_open)} hint="Not limited by the date filter: open work is open work." /></div>
      {rowKeys.length === 0 ? <p className="text-sm text-gray-500">Nothing is open.</p> : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <caption className="border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-900">Open tickets by category, department and priority</caption>
            <thead className="text-xs text-gray-500"><tr><th scope="col" className="px-3 py-2 text-left font-medium">Category</th><th scope="col" className="px-3 py-2 text-left font-medium">Department</th>{priorities.map((p) => <th key={p} scope="col" className="px-3 py-2 text-center font-medium">{label(p)}</th>)}</tr></thead>
            <tbody>
              {rowKeys.map((k) => {
                const [cat, dept] = k.split("|||");

                return (
                  <tr key={k} className="border-t border-gray-100">
                    <th scope="row" className="px-3 py-2 text-left font-normal text-gray-900">{cat}</th>
                    <td className="px-3 py-2 text-gray-700">{dept}</td>
                    {priorities.map((p) => { const n = count(k, p); return <td key={p} className={`px-3 py-2 text-center font-medium ${HEAT[heatLevel(n, max)]}`}>{n}</td>; })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
