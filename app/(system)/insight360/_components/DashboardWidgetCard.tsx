"use client";

import { BarChart3, Clock3, RefreshCw, TableProperties } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Insight360WidgetData } from "@/types/insight360";

// Categorical series, fixed order, never cycled beyond slot 6. Defined as
// tokens in globals.css and validated for colour-blind separation and >=3:1
// contrast on both the light and dark chart surfaces — see the comment there
// before changing or reordering these.
const CHART_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)", "var(--chart-6)",
];

const WIDGET_TITLES: Record<string, string> = {
  employment_status_mix: "Employment Status Distribution",
  attendance_status_mix: "Attendance Status Today",
  leave_status_mix: "Leave Request Status",
};

const PROVIDER_LABELS: Record<string, string> = {
  people_hub: "PeopleHub",
  time_sync: "TimeSync",
  leave_ease: "LeaveEase",
  pay_edge: "PayEdge",
};

function widgetTitle(widget: Insight360WidgetData): string {
  return WIDGET_TITLES[widget.widget_key] ?? widget.name;
}

function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider.replaceAll("_", " ");
}

export type DashboardWidgetRow = Record<string, unknown> & {
  category: string;
  value: number;
};

export function numericWidgetValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatWidgetValue(value: unknown, widget: Insight360WidgetData): string {
  const amount = numericWidgetValue(value);
  if (widget.display_config.format === "currency") {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: widget.display_config.currency ?? "PKR",
      notation: Math.abs(amount) >= 1_000_000 ? "compact" : "standard",
      maximumFractionDigits: Math.abs(amount) >= 1_000_000 ? 1 : 0,
    }).format(amount);
  }
  if (widget.display_config.format === "minutes") {
    const hours = Math.floor(amount / 60);
    const minutes = Math.round(amount % 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  }
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 1 }).format(amount);
}

export function widgetRows(widget: Insight360WidgetData): DashboardWidgetRow[] {
  const categoryKey = widget.display_config.category_key ?? widget.data.columns[0] ?? "";
  const valueKey = widget.display_config.value_key ?? widget.data.columns.at(-1) ?? "";

  return widget.data.rows.map((row) => ({
    ...row,
    category: String(row[categoryKey] ?? "Not set").replaceAll("_", " "),
    value: numericWidgetValue(row[valueKey]),
  }));
}

export function widgetFreshness(widget: Insight360WidgetData, includeDate = false): string {
  if (!widget.freshness.data_as_of) return "Just now";
  return new Intl.DateTimeFormat("en-PK", includeDate
    ? { dateStyle: "medium", timeStyle: "short" }
    : { hour: "numeric", minute: "2-digit" }).format(new Date(widget.freshness.data_as_of));
}

function WidgetHeader({ widget, canRefresh, refreshing, onRefresh }: {
  widget: Insight360WidgetData;
  canRefresh: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={`${widget.widget_key}-title`} className="truncate text-sm font-semibold text-brand-900 sm:text-base">
          {widgetTitle(widget)}
        </h2>
        <p className="mt-0.5 text-xs font-semibold text-brand-600">{providerLabel(widget.primary_provider)}</p>
      </div>
      {canRefresh && widget.refresh_tier !== "live" && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label={`Refresh ${widgetTitle(widget)}`}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-brand-100 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} />
        </button>
      )}
    </header>
  );
}

function EmptyChart() {
  return (
    <div className="flex min-h-56 flex-1 items-center justify-center rounded-xl bg-brand-100 px-5 text-center text-sm text-gray-500">
      <BarChart3 aria-hidden="true" className="mr-2 h-5 w-5 text-brand-600" />
      No records are available for the current company scope.
    </div>
  );
}

function DonutVisual({ widget, rows }: { widget: Insight360WidgetData; rows: DashboardWidgetRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="grid min-h-60 gap-4 sm:grid-cols-[minmax(180px,0.9fr)_minmax(180px,1.1fr)] sm:items-center">
      <div className="relative h-56 min-w-0" aria-label={`${widget.name} donut chart`} role="img">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="category" innerRadius={60} outerRadius={88} paddingAngle={1} stroke="var(--card)" strokeWidth={2} isAnimationActive={false}>
              {rows.map((row, index) => <Cell key={`${row.category}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => formatWidgetValue(value, widget)} />
          </PieChart>
        </ResponsiveContainer>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-brand-900">{new Intl.NumberFormat("en-PK").format(total)}</span>
          <span className="text-xs text-gray-500">records</span>
        </div>
      </div>
      <ul className="space-y-3" aria-label={`${widget.name} legend`}>
        {rows.slice(0, 6).map((row, index) => (
          <li key={`${row.category}-legend`} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
            <span className="truncate capitalize text-gray-600">{row.category}</span>
            <span className="font-semibold text-brand-900">
              {formatWidgetValue(row.value, widget)}
              {total > 0 && <span className="ml-1 font-normal text-gray-500">({Math.round((row.value / total) * 100)}%)</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HorizontalBarVisual({ widget, rows }: { widget: Insight360WidgetData; rows: DashboardWidgetRow[] }) {
  return (
    <div className="h-64 w-full" aria-label={`${widget.name} bar chart`} role="img">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 28, bottom: 8, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="category" width={105} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(value) => String(value).replace(/\b\w/g, (letter) => letter.toUpperCase())} />
          <Tooltip formatter={(value) => formatWidgetValue(value, widget)} />
          <Bar dataKey="value" fill={widget.widget_key === "leave_status_mix" ? "var(--chart-6)" : "var(--chart-1)"} radius={[0, 7, 7, 0]} maxBarSize={18} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DefaultBarVisual({ widget, rows }: { widget: Insight360WidgetData; rows: DashboardWidgetRow[] }) {
  return (
    <div className="h-64 w-full" aria-label={`${widget.name} chart`} role="img">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 18, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={42} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value) => formatWidgetValue(value, widget)} />
          <Bar dataKey="value" fill="var(--chart-1)" radius={[7, 7, 0, 0]} maxBarSize={48}  isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardWidgetCard({ widget, canRefresh, refreshing, onRefresh }: {
  widget: Insight360WidgetData;
  canRefresh: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const rows = widgetRows(widget);
  const useDonut = widget.widget_key === "attendance_status_mix" || widget.widget_type === "donut" && widget.widget_key !== "employment_status_mix";
  const useHorizontalBars = widget.widget_key === "employment_status_mix" || widget.widget_key === "leave_status_mix";

  return (
    <article aria-labelledby={`${widget.widget_key}-title`} className="flex h-full min-h-[330px] flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(30,26,58,0.06)]">
      <WidgetHeader widget={widget} canRefresh={canRefresh} refreshing={refreshing} onRefresh={onRefresh} />

      <div className="mt-3 flex flex-1 flex-col">
        {rows.length === 0 ? <EmptyChart /> : useDonut ? (
          <DonutVisual widget={widget} rows={rows} />
        ) : useHorizontalBars ? (
          <HorizontalBarVisual widget={widget} rows={rows} />
        ) : (
          <DefaultBarVisual widget={widget} rows={rows} />
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />As of {widgetFreshness(widget, true)}</span>
        <details className="group relative">
          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
            View data <TableProperties aria-hidden="true" className="h-3.5 w-3.5" />
          </summary>
          <div className="absolute bottom-11 right-0 z-20 max-h-64 w-72 overflow-auto rounded-xl border border-gray-200 bg-white p-3 shadow-xl sm:w-80">
            <table className="w-full text-left text-xs">
              <thead><tr className="text-gray-500"><th className="pb-2 font-semibold">Category</th><th className="pb-2 text-right font-semibold">Value</th></tr></thead>
              <tbody>{rows.map((row, index) => <tr key={`${row.category}-table-${index}`} className="border-t border-gray-200"><td className="py-2 capitalize text-gray-700">{row.category}</td><td className="py-2 text-right font-semibold text-brand-900">{formatWidgetValue(row.value, widget)}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </footer>
    </article>
  );
}
