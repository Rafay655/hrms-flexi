"use client";

/**
 * Resolver: point the requester of a TICKET at a published help article. It adds a reply the requester can read (with a link)
 * and records the attachment. Available for tickets only; nothing like this exists for grievances.
 */

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { parseApiError } from "@/lib/flexi-desk";

export function KbAttachPanel({ ticketUuid }: { ticketUuid: string }) {
  const queryClient = useQueryClient();
  const [q, setQ] = React.useState("");
  const [term, setTerm] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = setTimeout(() => setTerm(q.trim()), 400);
    return () => clearTimeout(id);
  }, [q]);

  const params = React.useMemo(() => ({ q: term, per_page: 5 }), [term]);
  const results = useQuery({
    queryKey: flexiDeskKeys.kbArticles(params),
    queryFn: () => flexiDeskService.getKbArticles(params),
    enabled: term.length >= 3,
    retry: false,
  });

  const attach = useMutation({
    mutationFn: (articleUuid: string) => flexiDeskService.attachKbArticle(ticketUuid, articleUuid),
    onSuccess: () => {
      setMessage("Article sent to the requester.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.thread(ticketUuid) });
    },
    onError: (err) => {
      setMessage(null);
      setError(parseApiError(err)?.message ?? "Could not attach that article.");
    },
  });

  const published = (results.data?.data ?? []).filter((a) => a.status === undefined || a.status === "published");

  return (
    <section aria-labelledby="kb-attach" className="space-y-2 rounded-lg border border-gray-200 bg-white p-5">
      <h2 id="kb-attach" className="text-sm font-medium text-gray-900">Send a help article</h2>
      <label htmlFor="kb-attach-q" className="sr-only">Search articles</label>
      <input id="kb-attach-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search published articles…" className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
      {term.length >= 3 && (
        results.isPending ? <p className="text-xs text-gray-500">Searching…</p> : published.length === 0 ? <p className="text-xs text-gray-500">No published articles match.</p> : (
          <ul className="divide-y divide-gray-100 text-sm">
            {published.map((a) => (
              <li key={a.uuid} className="flex items-center justify-between gap-3 py-1.5">
                <span className="truncate">{a.title}</span>
                <button type="button" disabled={attach.isPending} onClick={() => attach.mutate(a.uuid)} className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50">Send</button>
              </li>
            ))}
          </ul>
        )
      )}
      {message && <p role="status" className="text-xs text-emerald-700">{message}</p>}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </section>
  );
}
