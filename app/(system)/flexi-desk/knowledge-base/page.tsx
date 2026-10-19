"use client";

/**
 * FlexiDesk (system shell) — Knowledge Base for editors: every status, plus article health.
 * Health separates what people READ from what actually RESOLVED things: deflections are counted only where an employee accepted a
 * suggestion and did not raise a ticket, and a not-helpful ratio needs at least five votes before it is shown or flagged.
 */

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { formatNotHelpful, formatTicketDate, parseApiError } from "@/lib/flexi-desk";
import type { KbStatus } from "@/types/flexi-desk.types";

type Tab = "articles" | "health";

const STATUS_LABEL: Record<KbStatus, string> = { draft: "Draft", published: "Published", archived: "Archived" };
const STATUS_TONE: Record<KbStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-emerald-50 text-emerald-700",
  archived: "bg-amber-50 text-amber-800",
};

export default function KnowledgeBaseAdminPage() {
  const [tab, setTab] = React.useState<Tab>("articles");
  const [status, setStatus] = React.useState<"" | KbStatus>("");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const params = React.useMemo(() => ({ page, ...(status ? { status } : {}), ...(q.trim() ? { q: q.trim() } : {}) }), [page, status, q]);

  const articles = useQuery({ queryKey: flexiDeskKeys.kbArticles(params), queryFn: () => flexiDeskService.getKbArticles(params), retry: false, enabled: tab === "articles" });
  const health = useQuery({ queryKey: flexiDeskKeys.kbAnalytics(), queryFn: () => flexiDeskService.getKbAnalytics(), retry: false, enabled: tab === "health" });

  const active = tab === "articles" ? articles : health;
  const forbidden = (active.error as { response?: { status?: number } } | null)?.response?.status === 403;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Knowledge base</h1>
          <p className="mt-1 text-sm text-gray-500">Help articles employees see before raising a ticket, and how well they work.</p>
        </div>
        <Link href="/flexi-desk/knowledge-base/new" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">New article</Link>
      </div>

      <div role="tablist" aria-label="Knowledge base views" className="flex gap-1 border-b border-gray-200">
        {([["articles", "Articles"], ["health", "Article health"]] as [Tab, string][]).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {forbidden ? (
        <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">You do not have permission to manage the knowledge base.</div>
      ) : active.isError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{parseApiError(active.error)?.message ?? "Could not load. Please try again."}</div>
      ) : tab === "articles" ? (
        <>
          <div className="flex flex-wrap gap-3">
            <label className="sr-only" htmlFor="kb-admin-search">Search</label>
            <input id="kb-admin-search" type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search articles…" className="min-w-[14rem] rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            <label className="sr-only" htmlFor="kb-admin-status">Status</label>
            <select id="kb-admin-status" value={status} onChange={(e) => { setStatus(e.target.value as "" | KbStatus); setPage(1); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
              <option value="">Any status</option>
              {(Object.keys(STATUS_LABEL) as KbStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          {articles.isPending ? <div className="text-sm text-gray-500" aria-busy="true">Loading…</div> : (articles.data?.data ?? []).length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">No articles yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr><th scope="col" className="px-4 py-3">Title</th><th scope="col" className="px-4 py-3">Category</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Views</th><th scope="col" className="px-4 py-3">Updated</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(articles.data?.data ?? []).map((a) => (
                    <tr key={a.uuid}>
                      <td className="px-4 py-3"><Link href={`/flexi-desk/knowledge-base/${a.uuid}`} className="underline hover:no-underline">{a.title}</Link></td>
                      <td className="px-4 py-3 text-gray-600">{a.category?.name ?? "—"}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${a.status ? STATUS_TONE[a.status] : ""}`}>{a.status ? STATUS_LABEL[a.status] : "—"}</span></td>
                      <td className="px-4 py-3 text-gray-600">{a.views ?? 0}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatTicketDate(a.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {articles.data && articles.data.last_page > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
              <span>Page {articles.data.current_page} of {articles.data.last_page}</span>
              <button type="button" disabled={page >= articles.data.last_page} onClick={() => setPage((p) => p + 1)} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      ) : health.isPending || !health.data ? (
        <div className="text-sm text-gray-500" aria-busy="true">Loading…</div>
      ) : (
        <>
          <p className="text-xs text-gray-500">{health.data.window.from} to {health.data.window.to} (deflections). {health.data.notes}</p>
          <div className="grid gap-4 sm:grid-cols-4">
            {([["Views", health.data.totals.views], ["Votes", health.data.totals.votes], ["Deflections", health.data.totals.deflections], ["Need review", health.data.totals.needs_review]] as [string, number][]).map(([label, n]) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-gray-500">{label}</div><div className="text-2xl font-semibold text-gray-900">{n}</div></div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr><th scope="col" className="px-4 py-3">Article</th><th scope="col" className="px-4 py-3">Views</th><th scope="col" className="px-4 py-3">Helpful</th><th scope="col" className="px-4 py-3">Deflections</th><th scope="col" className="px-4 py-3">Flags</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {health.data.articles.map((r) => (
                  <tr key={r.uuid}>
                    <td className="px-4 py-3"><Link href={`/flexi-desk/knowledge-base/${r.uuid}`} className="underline hover:no-underline">{r.title}</Link></td>
                    <td className="px-4 py-3 text-gray-600">{r.views}</td>
                    <td className="px-4 py-3 text-gray-600">{r.helpful} yes · {r.not_helpful} no <span className="block text-xs text-gray-400">{formatNotHelpful(r.not_helpful_ratio)}</span></td>
                    <td className="px-4 py-3 text-gray-600">{r.deflections}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.needs_review && <span className="mr-1 rounded bg-red-50 px-1.5 py-0.5 text-red-700">Needs review</span>}
                      {r.stale && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">Not reviewed lately</span>}
                      {!r.needs_review && !r.stale && <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
