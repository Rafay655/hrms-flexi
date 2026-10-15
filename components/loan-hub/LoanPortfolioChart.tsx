"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, pkr } from "@/lib/loan-hub";

type Slice = { code: string; name: string; count: number; outstanding: number };

// ── Helper to safely format Tooltip values ──────────
const formatTooltipValue = (value: unknown): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return pkr(isNaN(num) ? 0 : num);
};

/**
 * LoanPortfolioChart — §7.3 donut of outstanding balance by loan type.
 */
export function LoanPortfolioChart({ data }: { data: Slice[] }) {
  const slices = data.filter((d) => d.outstanding > 0);
  const total = slices.reduce((s, d) => s + d.outstanding, 0);

  if (!slices.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
        No active loans to chart.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="outstanding" nameKey="name" innerRadius={64} outerRadius={92} paddingAngle={2} stroke="none">
              {slices.map((d, i) => (
                <Cell key={d.code} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={formatTooltipValue}
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular-nums text-brand-900">{pkr(total)}</span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">outstanding</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-1">
        {slices.map((d, i) => (
          <div key={d.code} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="flex-1 text-sm text-gray-600">{d.name}</span>
            <span className="text-sm font-semibold tabular-nums text-gray-800">{pkr(d.outstanding)}</span>
            <span className="w-10 text-right text-xs tabular-nums text-gray-400">
              {Math.round((d.outstanding / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Add default export to be safe
export default LoanPortfolioChart;