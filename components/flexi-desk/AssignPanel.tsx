"use client";

/**
 * Hand a ticket to someone (flexidesk.ticket.reassign). This is how an HR admin clears the unassigned queue.
 *
 * The picker offers only people who can actually work tickets, with how many open tickets each already holds so the load can
 * be spread. Whether the panel is shown at all comes from the ticket's server-computed `abilities.reassign`, and a finished
 * (resolved or closed) ticket is never offered for reassignment. The API stays the authority on every rule.
 */

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { parseApiError, workloadLabel } from "@/lib/flexi-desk";
import type { TicketAssignee } from "@/types/flexi-desk.types";

const input = "w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function AssignPanel({ ticketUuid, currentAssignee, onAssigned }: { ticketUuid: string; currentAssignee: string | null; onAssigned: (name: string) => void }) {
  const queryClient = useQueryClient();
  const [term, setTerm] = React.useState("");
  const [picked, setPicked] = React.useState<TicketAssignee | null>(null);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const people = useQuery({
    queryKey: flexiDeskKeys.ticketAssignees(term),
    queryFn: () => flexiDeskService.getTicketAssignees(term),
    staleTime: 15_000,
    retry: false,
  });

  const assign = useMutation({
    mutationFn: () => flexiDeskService.assignTicket(ticketUuid, picked!.uuid, note),
    onSuccess: () => {
      const name = picked!.name;
      setError(null);
      setPicked(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.all });
      onAssigned(name);
    },
    onError: (err) => setError(parseApiError(err)?.message ?? "Could not assign the ticket. Please try again."),
  });

  return (
    <section aria-labelledby="assign-ticket" className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
      <div>
        <h2 id="assign-ticket" className="text-sm font-medium text-gray-900">{currentAssignee ? "Reassign this ticket" : "Assign this ticket"}</h2>
        <p className="text-xs text-gray-500">{currentAssignee ? `Currently with ${currentAssignee}.` : "Nobody is handling it yet."} Only people who can work tickets are listed.</p>
      </div>

      <label className="block text-xs text-gray-500">
        Find a person
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Type a name…" className={`${input} mt-1`} />
      </label>

      {people.isError ? (
        <p role="alert" className="text-sm text-red-700">Could not load the people list. You may not have permission to assign tickets.</p>
      ) : (
        <ul className="max-h-48 divide-y divide-gray-100 overflow-auto rounded-lg border border-gray-200 text-sm" aria-label="People who can take this ticket">
          {people.isPending ? <li className="px-3 py-2 text-gray-500">Loading…</li> : (people.data ?? []).length === 0 ? <li className="px-3 py-2 text-gray-500">No one matches.</li> : (
            people.data!.map((p) => (
              <li key={p.uuid}>
                <button type="button" onClick={() => setPicked(p)} aria-pressed={picked?.uuid === p.uuid}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${picked?.uuid === p.uuid ? "bg-indigo-50" : ""}`}>
                  <span className="text-gray-900">{p.name}</span>
                  <span className="text-xs text-gray-500">{workloadLabel(p.open_tickets)}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <label className="block text-xs text-gray-500">
        Note for the history (optional)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className={`${input} mt-1`} />
      </label>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</p>}
      <div className="flex justify-end">
        <button type="button" disabled={!picked || assign.isPending} onClick={() => assign.mutate()}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          {assign.isPending ? "Assigning…" : picked ? `Assign to ${picked.name}` : "Choose a person"}
        </button>
      </div>
    </section>
  );
}
