"use client";

/**
 * FlexiDesk (system shell) — grievance statistics for HR leadership (flexidesk.report.view).
 *
 * Aggregate only: counts, percentages and averages. The API withholds small counts (fewer than the minimum cell size)
 * and this page shows them as withheld, never as zero, so nothing here can point at an individual. There is no case
 * text, no names and no per-person or per-committee breakdown to show.
 */

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { GRIEVANCE_TYPES, formatReportCell, formatReportMetric, grievanceStatusLabel, grievanceTypeLabel, parseApiError } from "@/lib/flexi-desk";
import type { GrievanceStatus, GrievanceType, ReportCell } from "@/types/flexi-desk.types";

function CellTable({ title, rows, minCell }: { title: string; rows: { label: string; cell: ReportCell | undefined }[]; minCell: number }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5" aria-label={title}>
      <h2 className="mb-2 text-sm font-medium text-gray-900">{title}</h2>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="py-1.5 pr-3 text-left font-normal text-gray-700">{r.label}</th>
              <td className={`py-1.5 text-right ${r.cell?.suppressed ? "text-gray-400" : "text-gray-900"}`}>{formatReportCell(r.cell, minCell)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function GrievanceReportPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const params = React.useMemo(() => ({ ...(from ? { from } : {}), ...(to ? { to } : {}) }), [from, to]);

  const report = useQuery({
    queryKey: flexiDeskKeys.grievanceReport(from, to),
    queryFn: () => flexiDeskService.getGrievanceReport(params),
    retry: false,
  });

  const forbidden = (report.error as { response?: { status?: number } } | null)?.response?.status === 403;
  const r = report.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/flexi-desk/grievances" className="text-sm text-gray-500 hover:underline">← Grievances</Link>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Grievance statistics</h1>
        <p className="mt-1 text-sm text-gray-500">Totals and trends only. Small counts are withheld to protect the people involved.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="rep-from" className="mb-1 block text-xs text-gray-500">From</label>
          <input id="rep-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label htmlFor="rep-to" className="mb-1 block text-xs text-gray-500">To</label>
          <input id="rep-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
        </div>
        <p className="text-xs text-gray-500">Defaults to the last 12 months; at most 24 months.</p>
      </div>

      {forbidden ? (
        <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">You do not have permission to view grievance statistics.</div>
      ) : report.isError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{parseApiError(report.error)?.message ?? "Could not load the statistics."}</div>
      ) : report.isPending || !r ? (
        <div className="text-sm text-gray-500" aria-busy="true">Loading…</div>
      ) : (
        <>
          <p className="text-xs text-gray-500">{r.window.from} to {r.window.to}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-gray-500">Grievances filed</div><div className="text-2xl font-semibold text-gray-900">{r.total}</div></div>
            <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-gray-500">Still open</div><div className="text-2xl font-semibold text-gray-900">{formatReportCell(r.open_cases, r.min_cell_size)}</div></div>
            <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-gray-500">Intake review overdue</div><div className="text-2xl font-semibold text-gray-900">{formatReportCell(r.awaiting_intake_review_overdue, r.min_cell_size)}</div></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CellTable title="By stage" minCell={r.min_cell_size} rows={Object.keys(r.by_status).map((k) => ({ label: grievanceStatusLabel(k as GrievanceStatus), cell: r.by_status[k] }))} />
            <CellTable title="By type" minCell={r.min_cell_size} rows={GRIEVANCE_TYPES.map((t) => ({ label: grievanceTypeLabel(t.value as GrievanceType), cell: r.by_type[t.value] }))} />
          </div>

          <CellTable title="Filed per month" minCell={r.min_cell_size} rows={Object.keys(r.by_month).map((k) => ({ label: k, cell: r.by_month[k] }))} />

          <section className="rounded-lg border border-gray-200 bg-white p-5" aria-label="Rates">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-gray-500">Average days from filing to ruling</dt><dd className="text-gray-900">{formatReportMetric(r.avg_days_filing_to_ruling)}</dd></div>
              <div><dt className="text-xs text-gray-500">Rulings that were appealed</dt><dd className="text-gray-900">{formatReportMetric(r.appeal_rate_percent, "%")}</dd></div>
              <div><dt className="text-xs text-gray-500">Filed with confidential handling</dt><dd className="text-gray-900">{formatReportMetric(r.confidential_handling_percent, "%")}</dd></div>
            </dl>
          </section>

          <p className="text-xs text-gray-500">{r.notes}</p>
        </>
      )}
    </div>
  );
}
