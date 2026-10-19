"use client";

/**
 * FlexiDesk admin dashboard (flexidesk.report.view): today's picture and the two lists an admin acts on.
 * The poor-CSAT list needs the CSAT report permission as well, and carries the ticket and rating only, never the employee's
 * words. The average CSAT is "Not enough data" until five people have answered.
 */

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { formatReportValue, formatTicketDate, parseApiError } from "@/lib/flexi-desk";
import { StatCard } from "@/components/flexi-desk/ReportViews";

export default function AdminDashboardPage() {
  const q = useQuery({ queryKey: flexiDeskKeys.dashboard(), queryFn: flexiDeskService.getDashboard, retry: false, refetchInterval: 60_000 });

  if (q.isPending) return <p className="p-6 text-sm text-gray-500">Loading…</p>;
  if (q.isError) return <p role="alert" className="m-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{parseApiError(q.error)?.message ?? "Could not load the dashboard. You may not have permission to view reports."}</p>;

  const { cards, poor_csat, recent_escalations, period } = q.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">FlexiDesk overview</h1>
          <p className="mt-1 text-sm text-gray-600">Where things stand right now. {period}</p>
        </div>
        <Link href="/flexi-desk/reports" className="text-sm text-indigo-700 underline">All reports</Link>
      </header>

      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Open tickets" value={String(cards.open)} />
        <StatCard label="Unassigned" value={String(cards.unassigned)} hint="Open, with nobody working on them." />
        <StatCard label="At risk" value={String(cards.at_risk)} hint="Warned that the SLA is close to breaching." />
        <StatCard label="Breached" value={String(cards.breached)} hint="Open and past the SLA." />
        <StatCard label="Average resolution" value={formatReportValue(cards.avg_resolution_hours, "hours")} />
        <StatCard label="CSAT average" value={formatReportValue(cards.csat_average, "rating")} hint="Shown once five people have answered." />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="esc" className="rounded-lg border border-gray-200 bg-white">
          <h2 id="esc" className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-900">Recent escalations</h2>
          {recent_escalations.length === 0 ? <p className="p-4 text-sm text-gray-500">No escalations yet.</p> : (
            <ul className="divide-y divide-gray-100">
              {recent_escalations.map((e, i) => (
                <li key={`${e.ticket_uuid}-${i}`} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                  <Link href={`/flexi-desk/tickets/${e.ticket_uuid}`} className="font-medium text-indigo-700 underline">{e.ticket_number}</Link>
                  <span className="text-gray-600">Level {e.level} · {e.triggered_by === "sla_breach" ? "SLA breach" : e.triggered_by}</span>
                  <span className="text-xs text-gray-500">{formatTicketDate(e.escalated_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="poor" className="rounded-lg border border-gray-200 bg-white">
          <h2 id="poor" className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-900">Low satisfaction ratings</h2>
          {poor_csat === null ? <p className="p-4 text-sm text-gray-500">You need the CSAT report permission to see this list.</p>
            : poor_csat.length === 0 ? <p className="p-4 text-sm text-gray-500">No low ratings in the last 30 days.</p> : (
              <ul className="divide-y divide-gray-100">
                {poor_csat.map((p) => (
                  <li key={p.ticket_uuid} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                    <Link href={`/flexi-desk/tickets/${p.ticket_uuid}`} className="font-medium text-indigo-700 underline">{p.ticket_number}</Link>
                    <span className="text-gray-600">{p.category ?? "No category"}</span>
                    <span className="font-medium text-red-700" aria-label={`Rated ${p.rating} out of 5`}>{p.rating} / 5</span>
                  </li>
                ))}
              </ul>
            )}
        </section>
      </div>
    </div>
  );
}
