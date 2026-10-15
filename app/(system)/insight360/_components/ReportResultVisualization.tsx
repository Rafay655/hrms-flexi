"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import type { Insight360Preview } from "@/types/insight360";

const dimensionPriority = ["period_label", "event_date", "attendance_date", "label", "status", "department", "employee_name"];
const metricPriority = [
  "metric_value", "net_amount", "gross_amount", "ctc_amount", "deductions_amount",
  "timesheet_hours", "overtime_minutes", "work_minutes", "leave_days", "available_balance",
  "joiners", "leavers", "opening_value", "closing_value",
];

function title(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function canVisualizePreview(preview: Insight360Preview): boolean {
  if (preview.rows.length === 0) return false;
  return Boolean(dimensionPriority.find((field) => preview.columns.includes(field))
    ?? preview.columns.find((field) => preview.rows.some((row) => typeof row[field] === "string")));
}

export function ReportResultVisualization({ preview }: { preview: Insight360Preview }) {
  if (preview.rows.length === 0) return null;

  const dimension = dimensionPriority.find((field) => preview.columns.includes(field)) ?? preview.columns.find((field) => preview.rows.some((row) => typeof row[field] === "string"));
  const metric = metricPriority.find((field) => preview.columns.includes(field) && preview.rows.some((row) => numericValue(row[field]) !== null));
  if (!dimension) return null;

  const grouped = new Map<string, number>();
  preview.rows.forEach((row) => {
    const label = String(row[dimension] ?? "Not specified");
    grouped.set(label, (grouped.get(label) ?? 0) + (metric ? (numericValue(row[metric]) ?? 0) : 1));
  });
  const chartData = Array.from(grouped, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
  if (chartData.length === 0) return null;

  const measure = metric ? title(metric) : "Records";

  return (
    <section aria-labelledby="visual-summary-title" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800"><BarChart3 aria-hidden="true" className="h-5 w-5" /></span>
        <div>
          <h2 id="visual-summary-title" className="font-semibold text-brand-900">Visual summary</h2>
          <p className="mt-1 text-sm text-gray-600">{measure} by {title(dimension).toLowerCase()}. Showing up to 12 groups from this result page; the complete accessible dataset remains in the table below.</p>
        </div>
      </div>
      <div className="mt-5 h-80 w-full" role="img" aria-label={`${measure} by ${title(dimension)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" angle={-28} textAnchor="end" height={72} interval={0} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis allowDecimals={Boolean(metric)} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={64} />
            <Tooltip formatter={(value) => [new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(value)), measure]} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="value" name={measure} fill="var(--chart-1)" radius={[7, 7, 0, 0]} maxBarSize={54}  isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
