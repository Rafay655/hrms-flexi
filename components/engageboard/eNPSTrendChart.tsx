"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EnpsScore } from "@/types/engageboard-enps.types";

/**
 * <eNPSTrendChart/> — 03-design-system.md §4 row 2. Direct precedent:
 * `frontend/components/loan-hub/LoanPortfolioChart.tsx` (ResponsiveContainer +
 * recharts, typed data prop, explicit empty state, formatter) — same
 * conventions carried over here with a line chart instead of a donut, since
 * the underlying data is a score-over-time series, not a point-in-time split.
 * Benchmark target is rendered as a `<ReferenceLine/>` overlay (the "benchmark-
 * band overlay" the design system calls for) when `benchmarkTarget` is passed.
 */
export function EnpsTrendChart({
  data,
  benchmarkTarget,
}: {
  data: EnpsScore[];
  benchmarkTarget?: number | null;
}) {
  const points = data
    .filter((d) => !d.suppressed && d.enps_score !== undefined && d.score_date)
    .map((d) => ({
      date: d.score_date as string,
      label: new Intl.DateTimeFormat("en-PK", { month: "short", year: "2-digit" }).format(
        new Date(`${d.score_date}T00:00:00`),
      ),
      score: Number(d.enps_score),
      campaign: d.campaign_title ?? "",
    }));

  if (!points.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
        No eNPS data yet — launch a campaign to get started.
      </div>
    );
  }

  const summary = `eNPS trend across ${points.length} campaign${points.length === 1 ? "" : "s"}, most recent score ${
    points[points.length - 1].score
  }.`;

  return (
    <div>
      <div className="h-[220px]" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[-100, 100]} tick={{ fontSize: 12 }} width={40} />
            <Tooltip
              formatter={(value: unknown) => [`${value}`, "eNPS score"]}
              labelFormatter={(label) => String(label)}
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            {benchmarkTarget !== null && benchmarkTarget !== undefined && (
              <ReferenceLine
                y={benchmarkTarget}
                stroke="var(--engageboard-tier-gold)"
                strokeDasharray="4 4"
                label={{ value: `Target ${benchmarkTarget}`, position: "insideTopRight", fontSize: 11, fill: "var(--engageboard-tier-gold)" }}
              />
            )}
            <ReferenceLine y={0} stroke="var(--border)" />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--chart-1)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--chart-1)" }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className="sr-only">{summary}</span>
    </div>
  );
}

export default EnpsTrendChart;
