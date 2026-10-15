"use client";

import { pkr } from "@/lib/loan-hub";

/**
 * RecoverySummaryCard — §7.3 monthly recovery summary: expected vs collected,
 * with the pending shortfall and a progress bar.
 */
export function RecoverySummaryCard({
  expected,
  actual,
  title = "This Month's Recovery",
}: {
  expected: number;
  actual: number;
  title?: string;
}) {
  const pct = expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;
  const pending = Math.max(0, expected - actual);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Expected" value={pkr(expected)} tone="text-gray-800" />
        <Stat label="Collected" value={pkr(actual)} tone="text-emerald-600" />
        <Stat label="Pending" value={pkr(pending)} tone={pending > 0 ? "text-amber-600" : "text-gray-400"} />
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>Recovery rate</span>
          <span className="font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <p className={`text-base font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}
