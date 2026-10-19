"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import type { EnpsBand, EnpsBandInfo } from "@/types/engageboard-enps.types";

/**
 * eNPS score → band classifier (03-design-system.md §1.1). Pure function,
 * exported for the accompanying vitest unit test — do not re-derive this
 * banding logic anywhere else in the frontend.
 *
 * Bands (score is bounded [-100, +100] per EB-ENPS-023):
 *   < 0        → at-risk
 *   0 - 19      → needs-improvement
 *   20 - 49     → good
 *   50 - 70     → excellent
 *   > 70        → world-class
 */
export function classifyEnpsScore(score: number): EnpsBandInfo {
  let band: EnpsBand;
  let label: string;
  let colorVar: string;

  if (score < 0) {
    band = "at-risk";
    label = "At Risk";
    colorVar = "var(--engageboard-enps-at-risk)";
  } else if (score < 20) {
    band = "needs-improvement";
    label = "Needs Improvement";
    colorVar = "var(--engageboard-enps-needs-improvement)";
  } else if (score < 50) {
    band = "good";
    label = "Good";
    colorVar = "var(--engageboard-enps-good)";
  } else if (score <= 70) {
    band = "excellent";
    label = "Excellent";
    colorVar = "var(--engageboard-enps-excellent)";
  } else {
    band = "world-class";
    label = "World Class";
    colorVar = "var(--engageboard-enps-world-class)";
  }

  return { band, label, colorVar };
}

/**
 * <eNPSScoreGauge/> — 03-design-system.md §4 row 1. Circular gauge built on
 * recharts' RadialBarChart (already a project dependency, no new charting
 * library introduced). The numeric score and the band label are ALWAYS
 * rendered as text next to the gauge — the color banding is a secondary
 * reinforcement, never the sole signal (§7 accessibility checklist).
 */
export function EnpsScoreGauge({
  score,
  delta,
  participation,
  suppressed,
}: {
  score: number | null;
  delta?: number | null;
  participation?: number | null;
  suppressed?: boolean;
}) {
  if (suppressed || score === null) {
    return (
      <div
        className="flex h-[220px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-xs"
        role="img"
        aria-label="eNPS score unavailable — insufficient data"
      >
        <p className="text-sm font-semibold text-gray-500">Insufficient data (n&lt;5)</p>
        <p className="mt-1 max-w-[220px] text-xs text-gray-400">
          Not enough responses yet to show a reliable score for this segment.
        </p>
      </div>
    );
  }

  const { label, colorVar } = classifyEnpsScore(score);
  // RadialBarChart needs a 0-100 domain; eNPS is -100..+100, so remap to 0-100 for the arc fill only.
  const normalized = ((score + 100) / 200) * 100;
  const chartData = [{ name: "eNPS", value: normalized, fill: colorVar }];
  const summary = `Current eNPS score is ${score}, rated ${label}.${
    delta !== null && delta !== undefined ? ` ${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta)} points versus the previous period.` : ""
  }${participation !== null && participation !== undefined ? ` Participation rate ${participation}%.` : ""}`;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <div className="relative mx-auto h-[180px] w-[180px]" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={chartData}
            startAngle={90}
            endAngle={-270}
            barSize={16}
          >
            <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={8} isAnimationActive={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums text-brand-900">{score}</span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">eNPS</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `color-mix(in oklch, ${colorVar} 18%, white)`, color: colorVar }}
        >
          {label}
        </span>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {delta !== null && delta !== undefined && (
            <span className="tabular-nums">
              {delta >= 0 ? "+" : ""}
              {delta} vs previous
            </span>
          )}
          {participation !== null && participation !== undefined && (
            <span className="tabular-nums">{participation}% participation</span>
          )}
        </div>
      </div>
      {/* Screen-reader-accessible summary, per §7 — a visually-hidden text summary of the key insight. */}
      <span className="sr-only">{summary}</span>
    </div>
  );
}

export default EnpsScoreGauge;
