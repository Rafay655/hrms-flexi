"use client";

/**
 * FlexiDesk (system shell) — tickets for HR / resolvers.
 *
 * Four views over the API (all authorized server-side; the API answers 403 to callers without the
 * permission and this page shows an honest "no access" state):
 *   - All tickets   (flexidesk.ticket.view-all)
 *   - Unassigned    (flexidesk.ticket.view-all)
 *   - My queue      (flexidesk.ticket.view-assigned) — filterable by SLA state and escalated-only
 *   - Exceptions    (flexidesk.ticket.view-all) — escalations with no target, and tickets with no SLA
 * Each row opens the resolver workspace.
 */

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { formatTicketDate, parseApiError } from "@/lib/flexi-desk";
import { TicketStatusBadge } from "@/components/flexi-desk/TicketStatusBadge";
import { SlaBadge } from "@/components/flexi-desk/SlaBadge";
import type { ExceptionType, FlexiDeskTicket, Paginated, SlaState, TicketListParams } from "@/types/flexi-desk.types";

type View = "all" | "unassigned" | "queue" | "exceptions";

const VIEWS: { key: View; label: string }[] = [
  { key: "all", label: "All tickets" },
  { key: "unassigned", label: "Unassigned" },
  { key: "queue", label: "My queue" },
  { key: "exceptions", label: "Exceptions" },
];

const SLA_FILTERS: { value: "" | SlaState; label: string }[] = [
  { value: "", label: "Any SLA state" },
  { value: "breached", label: "Breached" },
  { value: "at_risk", label: "At risk" },
  { value: "paused", label: "Paused" },
  { value: "ok", label: "Within SLA" },
  { value: "none", label: "No SLA" },
];

const EXCEPTION_FILTERS: { value: "" | ExceptionType; label: string }[] = [
  { value: "", label: "All exceptions" },
  { value: "escalation_target_missing", label: "Escalation had no target" },
  { value: "sla_not_configured", label: "No SLA configured" },
];

export default function FlexiDeskTicketsPage() {
  const [view, setView] = React.useState<View>("all");
  const [page, setPage] = React.useState(1);
  const [slaState, setSlaState] = React.useState<"" | SlaState>("");
  const [escalatedOnly, setEscalatedOnly] = React.useState(false);
  const [exceptionType, setExceptionType] = React.useState<"" | ExceptionType>("");

  const params = React.useMemo<TicketListParams>(
    () => ({ page, ...(view === "queue" && slaState ? { sla_state: slaState } : {}), ...(view === "queue" && escalatedOnly ? { escalated: true } : {}) }),
    [page, view, slaState, escalatedOnly],
  );

  const tickets = useQuery<Paginated<FlexiDeskTicket>>({
    queryKey:
      view === "all"
        ? flexiDeskKeys.allTickets(params)
        : view === "unassigned"
          ? flexiDeskKeys.unassigned(params)
          : view === "queue"
            ? flexiDeskKeys.queue(params)
            : flexiDeskKeys.exceptions(exceptionType || "all", params),
    queryFn: () =>
      view === "all"
        ? flexiDeskService.getAllTickets(params)
        : view === "unassigned"
          ? flexiDeskService.getUnassignedTickets(params)
          : view === "queue"
            ? flexiDeskService.getQueue(params)
            : flexiDeskService.getExceptions(exceptionType || undefined, params),
    retry: false,
  });

  const forbidden = (tickets.error as { response?: { status?: number } } | null)?.response?.status === 403;
  const rows = tickets.data?.data ?? [];
  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">FlexiDesk tickets</h1>
        <p className="mt-1 text-sm text-gray-500">Employee support requests across HR, IT, Payroll and Admin.</p>
      </div>

      <div role="tablist" aria-label="Ticket views" className="flex gap-1 border-b border-gray-200">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            role="tab"
            aria-selected={view === v.key}
            onClick={() => { setView(v.key); resetPage(); }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              view === v.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "queue" && (
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="sla-filter" className="sr-only">SLA state</label>
            <select id="sla-filter" value={slaState} onChange={(e) => { setSlaState(e.target.value as "" | SlaState); resetPage(); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
              {SLA_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={escalatedOnly} onChange={(e) => { setEscalatedOnly(e.target.checked); resetPage(); }} />
            Escalated only
          </label>
        </div>
      )}

      {view === "exceptions" && (
        <div>
          <label htmlFor="exception-filter" className="sr-only">Exception type</label>
          <select id="exception-filter" value={exceptionType} onChange={(e) => { setExceptionType(e.target.value as "" | ExceptionType); resetPage(); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
            {EXCEPTION_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      )}

      {forbidden ? (
        <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          You do not have permission to view this list.
        </div>
      ) : tickets.isError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {parseApiError(tickets.error)?.message ?? "Could not load tickets. Please try again."}
        </div>
      ) : tickets.isPending ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500" aria-busy="true">Loading tickets…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">No tickets to show.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">Ticket</th>
                <th scope="col" className="px-4 py-3">Subject</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Priority</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">SLA</th>
                <th scope="col" className="px-4 py-3">Assignee</th>
                <th scope="col" className="px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((t) => (
                <tr key={t.uuid}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">
                    <Link href={`/flexi-desk/tickets/${t.uuid}`} className="underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                      {t.ticket_number}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-900">
                    {t.subject}
                    {(t.escalation_level ?? 0) > 0 && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">Level {t.escalation_level}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{t.priority}</td>
                  <td className="px-4 py-3"><TicketStatusBadge status={t.status} audience="resolver" /></td>
                  <td className="px-4 py-3">{t.sla ? <SlaBadge state={t.sla.state} /> : "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.assignee?.name ?? (view === "unassigned" && t.abilities.reassign ? (
                      <Link href={`/flexi-desk/tickets/${t.uuid}#assign-ticket`} className="font-medium text-indigo-700 underline">Assign…</Link>
                    ) : "Unassigned")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{t.sla?.configured ? formatTicketDate(t.sla.due_at) : "No SLA"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tickets.data && tickets.data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {tickets.data.current_page} of {tickets.data.last_page}</span>
          <button type="button" disabled={page >= tickets.data.last_page} onClick={() => setPage((p) => p + 1)} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
