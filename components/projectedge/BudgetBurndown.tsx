"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { burndownGeometry } from "@/lib/projectedge-budget";
import type { BudgetReport } from "@/types/projectedge-budget";

export function BudgetBurndown({
  summary,
  money,
}: {
  summary: Pick<BudgetReport["summary"], "planned" | "remaining" | "burndown">;
  money: (value: string) => string;
}) {
  const [page, setPage] = useState(0);
  const title = useId(),
    description = useId();
  const { points } = summary.burndown;
  const geometry = burndownGeometry(points, summary.planned);
  const lastPage = Math.max(0, Math.ceil(points.length / 25) - 1);
  const currentPage = Math.min(page, lastPage);
  const pagePoints = points.slice(currentPage * 25, (currentPage + 1) * 25);
  return (
    <section className="pe-card space-y-4 p-4 md:p-6" aria-labelledby={title}>
      <h2 id={title} className="text-lg font-semibold">
        Budget burndown
      </h2>
      <p id={description} className="text-sm text-slate-600">
        Remaining budget after cumulative approved labor costs, grouped by work
        date. Dashed line: project budget ceiling. Solid line: remaining
        balance. This is not an approval-date history or a forecast. Reported{" "}
        {summary.burndown.reported_on}.
      </p>
      {summary.burndown.includes_future_dates && (
        <p className="pe-state-warning rounded border p-3 text-sm">
          This report includes future-dated approved entries. Their approved
          cost is included in the totals and appears on the associated work
          date.
        </p>
      )}
      {!summary.burndown.has_approved_costs ? (
        <p role="status" className="rounded border border-dashed p-6 text-sm">
          No approved time costs yet. The opening balance is the planned project
          budget.
        </p>
      ) : (
        <figure aria-label="Remaining budget chart">
          <svg
            role="img"
            aria-label="Budget ceiling and remaining balance by approved work date"
            aria-describedby={description}
            viewBox="0 0 720 280"
            className="w-full"
            style={{ minHeight: 220 }}
          >
            <title>Budget ceiling and remaining balance</title>
            <line
              x1={geometry.left}
              y1={geometry.zeroY}
              x2={geometry.left + geometry.width}
              y2={geometry.zeroY}
              stroke="var(--pe-border)"
            />
            <line
              x1={geometry.left}
              y1={geometry.top}
              x2={geometry.left}
              y2={geometry.top + geometry.height}
              stroke="var(--pe-border)"
            />
            <line
              x1={geometry.left}
              y1={geometry.plannedY}
              x2={geometry.left + geometry.width}
              y2={geometry.plannedY}
              stroke="var(--pe-brand-500)"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <path
              d={geometry.path}
              stroke="var(--pe-brand-900)"
              strokeWidth={3}
              fill="none"
            />
            <text
              x={geometry.left - 8}
              y={geometry.top + 6}
              textAnchor="end"
              fill="var(--pe-muted-ink)"
              fontSize={11}
            >
              {new Intl.NumberFormat("en", { notation: "compact" }).format(
                geometry.high,
              )}
            </text>
            <text
              x={geometry.left - 8}
              y={geometry.top + geometry.height}
              textAnchor="end"
              fill="var(--pe-muted-ink)"
              fontSize={11}
            >
              {new Intl.NumberFormat("en", { notation: "compact" }).format(
                geometry.low,
              )}
            </text>
            <text
              x={geometry.left}
              y={250}
              textAnchor="start"
              fill="var(--pe-muted-ink)"
              fontSize={12}
            >
              {points[0]?.date}
            </text>
            <text
              x={geometry.left + geometry.width}
              y={250}
              textAnchor="end"
              fill="var(--pe-muted-ink)"
              fontSize={12}
            >
              {points.at(-1)?.date}
            </text>
          </svg>
          <figcaption className="text-sm">
            Latest reported remaining balance:{" "}
            {money(points.at(-1)?.remaining ?? summary.remaining)}. Exact values
            are available in the table below.
          </figcaption>
        </figure>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer py-3 font-semibold">
          View burndown data table
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Approved cost and remaining budget by work date
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-2 text-left">
                  Date
                </th>
                <th scope="col" className="p-2 text-left">
                  Basis
                </th>
                <th scope="col" className="p-2 text-right">
                  Cumulative actual
                </th>
                <th scope="col" className="p-2 text-right">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody>
              {pagePoints.map((point) => (
                <tr key={`${point.kind}-${point.date}`} className="border-t">
                  <th scope="row" className="p-2 text-left font-normal">
                    {point.date}
                  </th>
                  <td className="p-2">
                    {point.kind === "opening_balance"
                      ? "Opening balance"
                      : "Approved work date"}
                  </td>
                  <td className="p-2 text-right">{money(point.actual)}</td>
                  <td className="p-2 text-right">{money(point.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {points.length > 25 && (
          <div className="mt-3 flex items-center gap-3">
            <Button
              variant="outline"
              disabled={!currentPage}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous burn points
            </Button>
            <span className="text-sm" role="status">
              Page {currentPage + 1} of {lastPage + 1}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === lastPage}
              onClick={() => setPage(currentPage + 1)}
            >
              Next burn points
            </Button>
          </div>
        )}
      </details>
    </section>
  );
}
