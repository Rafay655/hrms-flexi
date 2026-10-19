"use client";

/**
 * Help-article suggestions on the new-TICKET form (never on a grievance).
 *
 * Seeing a suggestion or opening one records nothing. The ONLY thing that records a deflection is the explicit button
 * "This answered my question", which also takes the employee out of the ticket form: a deflection means the employee accepted
 * a suggestion AND did not raise a ticket. (If they had already raised one from this same form, the server would not count it.)
 */

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { parseApiError, shouldSuggest } from "@/lib/flexi-desk";

type Props = { categoryUuid: string; text: string; clientRequestId: string };

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);

  return debounced;
}

export function KbSuggestions({ categoryUuid, text, clientRequestId }: Props) {
  const router = useRouter();
  const query = useDebounced(text.trim().slice(0, 200), 500);
  const [error, setError] = React.useState<string | null>(null);

  const suggestions = useQuery({
    queryKey: flexiDeskKeys.kbSuggest(categoryUuid, query),
    queryFn: () => flexiDeskService.suggestKb(categoryUuid, query),
    enabled: shouldSuggest(categoryUuid, query),
    staleTime: 60_000,
    retry: false,
  });

  const deflect = useMutation({
    mutationFn: (articleUuid: string) => flexiDeskService.deflectKbArticle(articleUuid, clientRequestId),
    onSuccess: () => router.push("/ess/help"),
    onError: (err) => setError(parseApiError(err)?.message ?? "Could not record that. You can carry on with your ticket."),
  });

  const items = suggestions.data ?? [];
  if (suggestions.isError || items.length === 0) {
    return null; // a missing or empty suggestion box must never get in the way of raising a ticket
  }

  return (
    <aside aria-labelledby="kb-suggest-heading" className="space-y-2 rounded-lg border border-sky-200 bg-sky-50 p-4">
      <h2 id="kb-suggest-heading" className="text-sm font-medium text-sky-900">These articles might help before you raise a ticket</h2>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.uuid} className="rounded-lg bg-white p-3 text-sm">
            <a href={`/ess/help/${a.slug}`} target="_blank" rel="noreferrer" className="font-medium text-[var(--brand-800)] underline hover:no-underline">
              {a.title}
            </a>
            {a.summary && <p className="mt-0.5 text-xs text-[var(--brand-800)]/70">{a.summary}</p>}
            <button
              type="button"
              disabled={deflect.isPending}
              onClick={() => deflect.mutate(a.uuid)}
              className="mt-2 rounded border border-sky-300 px-2 py-1 text-xs text-sky-900 hover:bg-sky-100 disabled:opacity-50"
            >
              This answered my question. I will not raise a ticket.
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      <p className="text-xs text-sky-900/70">Opening an article does not change your ticket. You can keep filling in the form below.</p>
    </aside>
  );
}
