"use client";

/**
 * FlexiDesk (system shell) — satisfaction report (flexidesk.csat.report).
 *
 * Aggregates over SUBMITTED surveys only. The server withholds any figure that rests on fewer than five responses, and an
 * under-sampled resolver is not named at all, so nothing here can point at one person's answer. Feedback text is never
 * part of this report, and CSAT never changes a ticket.
 */

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { csatRowLabel, formatReportMetric, parseApiError } from "@/lib/flexi-desk";
import type { CsatBreakdownRow } from "@/types/flexi-desk.types";

function Breakdown({ title, rows }: { title: string; rows: CsatBreakdownRow[] }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5" aria-label={title}>
      <h2 className="mb-2 text-sm font-medium text-gray-900">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-gray-500">No submitted surveys in this period.</p> : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500"><tr><th scope="col" className="py-1">Name</th><th scope="col" className="py-1 text-right">Responses</th><th scope="col" className="py-1 text-right">Average</th><th scope="col" className="py-1 text-right">Low ratings</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className={r.insufficient_responses ? "text-gray-400" : "text-gray-900"}>
                <th scope="row" className="py-1.5 pr-3 text-left font-normal">{csatRowLabel(r)}</th>
                <td className="py-1.5 text-right">{r.insufficient_responses ? "—" : r.responses}</td>
                <td className="py-1.5 text-right">{r.insufficient_responses ? "—" : r.average_rating}</td>
                <td className="py-1.5 text-right">{r.insufficient_responses ? "—" : `${r.poor_rating_percent}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function CsatReportPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const params = React.useMemo(() => ({ ...(from ? { from } : {}), ...(to ? { to } : {}) }), [from, to]);
  const report = useQuery({ queryKey: flexiDeskKeys.csatReport(from, to), queryFn: () => flexiDeskService.getCsatReport(params), retry: false });

  const forbidden = (report.error as { response?: { status?: number } } | null)?.response?.status === 403;
  const r = report.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/flexi-desk/tickets" className="text-sm text-gray-500 hover:underline">← Tickets</Link>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Satisfaction</h1>
        <p className="mt-1 text-sm text-gray-500">How employees rated resolved tickets. Small groups are withheld to protect the people involved.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div><label htmlFor="cs-from" className="mb-1 block text-xs text-gray-500">From</label><input id="cs-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /></div>
        <div><label htmlFor="cs-to" className="mb-1 block text-xs text-gray-500">To</label><input id="cs-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /></div>
        <p className="text-xs text-gray-500">Defaults to the last 90 days.</p>
      </div>

      {forbidden ? (
        <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">You do not have permission to view satisfaction reports.</div>
      ) : report.isError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{parseApiError(report.error)?.message ?? "Could not load the report."}</div>
      ) : report.isPending || !r ? (
        <div className="text-sm text-gray-500" aria-busy="true">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-gray-500">Surveys sent</div><div className="text-2xl font-semibold">{r.surveys_sent}</div></div>
            <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-gray-500">Answered</div><div className="text-2xl font-semibold">{r.submitted}</div></div>
            <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-gray-500">Average rating</div><div className="text-2xl font-semibold">{formatReportMetric(r.average_rating)}</div></div>
            <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-gray-500">Response rate</div><div className="text-2xl font-semibold">{formatReportMetric(r.response_rate_percent, "%")}</div></div>
          </div>
          <p className="text-xs text-gray-500">
            Low ratings (2 or below): {formatReportMetric(r.poor_rating_percent, "%")}. Not yet answered: {r.pending}. Expired unanswered: {r.expired_unanswered}.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Breakdown title="By category" rows={r.by_category} />
            <Breakdown title="By resolver" rows={r.by_resolver} />
          </div>
          <p className="text-xs text-gray-500">{r.notes}</p>
        </>
      )}
    </div>
  );
}
