"use client";

import { CheckCircle2, Database } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Insight360TrendMetric } from "@/types/insight360";

export function formatMetric(value: number | null, unit: string): string {
  if (value === null) return "Not available";
  if (unit === "PKR") return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value);
  if (unit === "percent") return `${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 1 }).format(value)}%`;
  return `${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 1 }).format(value)} ${unit}`;
}

export function IntelligenceTrendCard({ metric }: { metric: Insight360TrendMetric }) {
  const chartData = metric.points.map((point) => ({
    ...point,
    label: new Intl.DateTimeFormat("en-PK", { month: "short", year: "2-digit" }).format(new Date(`${point.date}T00:00:00`)),
  }));

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Monthly trend</p><h2 className="mt-1 text-lg font-semibold text-brand-900">{metric.label}</h2></div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> Data checked</span>
      </header>
      <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="text-3xl font-semibold tracking-tight text-brand-900">{formatMetric(metric.latest_value, metric.unit)}</p>
        {metric.change !== null && <p className="pb-1 text-sm font-semibold text-gray-600">{metric.change > 0 ? "+" : ""}{formatMetric(metric.change, metric.unit)} vs prior</p>}
      </div>
      {chartData.length === 0 ? <div className="mt-5 flex h-56 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-600"><Database aria-hidden="true" className="mr-2 h-5 w-5" />Update trends to start building history.</div> : <>
        <div className="mt-5 h-56" role="img" aria-label={`${metric.label} monthly trend`}>
          <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 10, bottom: 8, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} width={52} /><Tooltip formatter={(value) => formatMetric(Number(value), metric.unit)} labelFormatter={(label) => String(label)} /><Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 3, fill: "var(--chart-1)" }} activeDot={{ r: 5 }}  isAnimationActive={false} /></LineChart></ResponsiveContainer>
        </div>
        <details className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-sm"><summary className="min-h-8 cursor-pointer font-semibold text-brand-800">View monthly values</summary><table className="mt-2 w-full text-left"><thead><tr className="text-xs uppercase tracking-wide text-gray-500"><th className="py-1">Period</th><th className="py-1 text-right">Value</th><th className="py-1 text-right">Records</th></tr></thead><tbody>{chartData.map((point) => <tr key={point.uuid} className="border-t border-gray-200"><td className="py-2">{point.label}</td><td className="py-2 text-right font-semibold">{formatMetric(point.value, metric.unit)}</td><td className="py-2 text-right">{point.source_count}</td></tr>)}</tbody></table></details>
      </>}
      <p className="mt-4 text-xs text-gray-500">As of {metric.data_as_of ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(metric.data_as_of)) : "not yet calculated"}</p>
    </article>
  );
}
