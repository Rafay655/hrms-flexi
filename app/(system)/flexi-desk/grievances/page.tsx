"use client";

/**
 * FlexiDesk (system shell) — grievance list for HR, investigators and committee members.
 * The API scopes the list in SQL to the cases the caller may open. Rows carry number, type, stage and dates only:
 * no narrative and no people. Opening a case is a separate, recorded step.
 */

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { GRIEVANCE_STAGES, formatTicketDate, grievanceStatusLabel, grievanceTypeLabel, parseApiError } from "@/lib/flexi-desk";
import { GrievanceStatusBadge } from "@/components/flexi-desk/GrievanceParts";
import type { GrievanceStatus } from "@/types/flexi-desk.types";

export default function GrievanceListPage() {
  const [status, setStatus] = React.useState<"" | GrievanceStatus>("");
  const [page, setPage] = React.useState(1);
  const params = React.useMemo(() => ({ page, ...(status ? { status } : {}) }), [page, status]);

  const grievances = useQuery({
    queryKey: flexiDeskKeys.grievances(params),
    queryFn: () => flexiDeskService.getGrievances(params),
    retry: false,
  });

  const forbidden = (grievances.error as { response?: { status?: number } } | null)?.response?.status === 403;
  const rows = grievances.data?.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Grievances</h1>
          <p className="mt-1 text-sm text-gray-500">Formal, confidential cases you are allowed to handle.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/flexi-desk/grievances/report" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50">Statistics</Link>
          <Link href="/flexi-desk/grievances/committees" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50">Committees</Link>
        </div>
      </div>

      <div>
        <label htmlFor="stage-filter" className="sr-only">Stage</label>
        <select id="stage-filter" value={status} onChange={(e) => { setStatus(e.target.value as "" | GrievanceStatus); setPage(1); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">All stages</option>
          {GRIEVANCE_STAGES.map((s) => <option key={s} value={s}>{grievanceStatusLabel(s)}</option>)}
        </select>
      </div>

      {forbidden ? (
        <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">You do not have permission to view grievances.</div>
      ) : grievances.isError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{parseApiError(grievances.error)?.message ?? "Could not load grievances. Please try again."}</div>
      ) : grievances.isPending ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500" aria-busy="true">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">No grievances to show.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">Case</th>
                <th scope="col" className="px-4 py-3">Type</th>
                <th scope="col" className="px-4 py-3">Stage</th>
                <th scope="col" className="px-4 py-3">Filed</th>
                <th scope="col" className="px-4 py-3">Intake due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((g) => (
                <tr key={g.uuid}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    <Link href={`/flexi-desk/grievances/${g.uuid}`} className="underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{g.grievance_number}</Link>
                    {g.is_identity_masked && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">Confidential</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{grievanceTypeLabel(g.grievance_type)}</td>
                  <td className="px-4 py-3"><GrievanceStatusBadge status={g.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatTicketDate(g.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{g.status === "filed" ? formatTicketDate(g.intake_due_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {grievances.data && grievances.data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {grievances.data.current_page} of {grievances.data.last_page}</span>
          <button type="button" disabled={page >= grievances.data.last_page} onClick={() => setPage((p) => p + 1)} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
