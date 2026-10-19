"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EnpsScore } from "@/types/engageboard-enps.types";
import { classifyEnpsScore } from "./eNPSScoreGauge";

const SUPPRESSED_FILL = "var(--muted-foreground)";

/**
 * <SegmentBreakdown/> — 03-design-system.md §4 row 3. Horizontal bar, one bar
 * per department/location/grade. Suppressed segments (n<5, EB-SEC-005/006 —
 * `EnpsScoreResource` already withholds every numeric field server-side) are
 * rendered as a distinct greyed-out "insufficient data (n<5)" bar rather than
 * omitted from the list entirely — this is the suppression-reuse principle
 * whose violation caused real bugs in G11/G22 (per this node's brief), so the
 * omission-vs-grey-bar distinction is deliberate, not a style choice.
 */
export function SegmentBreakdown({ scores }: { scores: EnpsScore[] }) {
  if (!scores.length) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-gray-400">
        No segment data yet.
      </div>
    );
  }

  const rows = scores.map((s) => ({
    key: s.uuid,
    name: s.segment_value ?? s.segment_type,
    score: s.suppressed ? 0 : Number(s.enps_score ?? 0),
    suppressed: s.suppressed,
  }));

  return (
    <div className="flex flex-col gap-1">
      <div style={{ height: Math.max(160, rows.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
            <XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: unknown, _name: unknown, item: any) =>
                item?.payload?.suppressed ? ["Insufficient data (n<5)", "eNPS"] : [`${value}`, "eNPS score"]) as never}
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            <Bar dataKey="score" radius={4} isAnimationActive={false}>
              {rows.map((row) => (
                <Cell key={row.key} fill={row.suppressed ? SUPPRESSED_FILL : classifyEnpsScore(row.score).colorVar} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm">
            <span className="text-gray-600">{row.name}</span>
            {row.suppressed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                Insufficient data (n&lt;5)
              </span>
            ) : (
              <span className="font-semibold tabular-nums text-gray-800">
                {row.score} · {classifyEnpsScore(row.score).label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SegmentBreakdown;
