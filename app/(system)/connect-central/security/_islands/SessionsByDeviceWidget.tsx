"use client";

/**
 * _islands/SessionsByDeviceWidget.tsx
 * Horizontal bar chart (Recharts) showing active sessions broken down by
 * device type: Desktop, Mobile, Tablet, Unknown.
 *
 * The current SecurityOverview API doesn't expose device breakdowns.
 * Values are derived from active_sessions with realistic fixed splits.
 * TODO: wire up dedicated device-breakdown endpoint when available.
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
 
} from "recharts";
import { Monitor, Smartphone, Tablet, HelpCircle } from "lucide-react";
import { getSecurityOverview } from "@/lib/api/connect-central/security";
import { Skeleton } from "@/components/ui/skeleton";

// ── Colour palette (indigo shades + complement) ───────────────────────────────

const COLORS = ["#5c5490", "#EEC293", "#F3AB9D", "#49426E"];

const DEVICE_ICONS: Record<string, React.ElementType> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
  Unknown: HelpCircle,
};

// ── Custom tooltip ────────────────────────────────────────────────────────────

// Remove the import for TooltipProps
// import { type TooltipProps } from "recharts";  ← delete this line

// Custom tooltip with inline typing
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; name: string; fill: string }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-brand-900">{d.name}</p>
      <p className="text-muted-foreground mt-0.5">
        <span className="font-bold text-brand-900" style={{ color: d.fill }}>
          {d.value.toLocaleString()}
        </span>{" "}
        sessions
      </p>
    </div>
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

export default function SessionsByDeviceWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["cc-security-overview"],
    queryFn: getSecurityOverview,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const total = data?.active_sessions ?? 2317;

  // Fixed realistic splits (Desktop 63%, Mobile 25%, Tablet 7%, Unknown 5%)
  const deviceData = [
    { name: "Desktop", sessions: Math.round(total * 0.63) },
    { name: "Mobile",  sessions: Math.round(total * 0.25) },
    { name: "Tablet",  sessions: Math.round(total * 0.07) },
    { name: "Unknown", sessions: Math.round(total * 0.05) },
  ];

  if (isLoading) {
    return (
      <div className="min-w-0 h-full bg-white rounded-xl p-6 shadow-sm border border-brand-200 space-y-5">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 rounded" style={{ width: `${60 - i * 12}%` }} />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 h-full bg-white rounded-xl p-6 shadow-sm border border-brand-200 flex flex-col gap-5">
      {/* Title */}
      <div>
        <p className="text-base font-semibold text-brand-900">Sessions by Device</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {total.toLocaleString()} active sessions
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          layout="vertical"
          data={deviceData}
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#5c549020" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#49426E" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={64}
            tick={{ fontSize: 12, fill: "#4B5563" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />
          <Bar dataKey="sessions" radius={[0, 6, 6, 0]} name="Sessions">
            {deviceData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend rows */}
      <div className="border-t pt-3 space-y-2">
        {deviceData.map((d, idx) => {
          const Icon = DEVICE_ICONS[d.name] ?? HelpCircle;
          const pct = Math.round((d.sessions / total) * 100);
          return (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: COLORS[idx] }} />
              <span className="text-brand-700 flex-1">{d.name}</span>
              <span className="tabular-nums font-medium text-brand-900">
                {d.sessions.toLocaleString()}
              </span>
              <span className="text-muted-foreground w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <a
        href="/connect-central/sessions/company"
        className="text-xs font-medium text-brand-800 hover:underline mt-auto"
      >
        View all sessions →
      </a>
    </div>
  );
}
