"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PartyPopper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CelebrationCard } from "@/components/engageboard/CelebrationCard";
import { engageBoardCelebrationsService } from "@/services/engageboard-celebrations.service";
import { cn } from "@/lib/utils";
import type { TeamEvent } from "@/types/engageboard-celebrations.types";

const WINDOWS = [
  { label: "Today", days: 0 },
  { label: "Next 7 days", days: 7 },
  { label: "Next 30 days", days: 30 },
];

function keyFor(event: TeamEvent, index: number): string {
  return `${event.employee?.id ?? "unknown"}-${event.event_type}-${event.event_date ?? index}`;
}

/**
 * GET /engageboard/celebrations/upcoming?days=N — CelebrationController's own
 * docblock (Round 1 review fix): computed LIVE from PeopleHub data on every
 * call, genuinely returns future not-yet-occurred events within the window,
 * not just today's.
 */
export default function CelebrationsPage() {
  const [days, setDays] = useState(30);

  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ["engageboard", "celebrations", "upcoming", days],
    queryFn: () => engageBoardCelebrationsService.upcoming(days),
    staleTime: 60_000,
  });

  const sorted = useMemo(
    () => [...events].sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? "")),
    [events],
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          EngageBoard · Celebrations
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Celebrations</h1>
        <p className="text-sm text-gray-500">Birthdays and work anniversaries across the company.</p>
      </div>

      <div className="flex gap-2">
        {WINDOWS.map((w) => (
          <button
            key={w.days}
            type="button"
            onClick={() => setDays(w.days)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              days === w.days
                ? "border-brand-700 bg-brand-900 text-white"
                : "border-gray-200 text-gray-500 hover:bg-brand-100/50",
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-gray-500">Could not load celebrations. Please refresh.</p>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <PartyPopper className="mx-auto mb-2 h-6 w-6 text-gray-300" />
          <p className="text-sm text-gray-500">No celebrations in this window.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((event, index) => (
          <CelebrationCard key={keyFor(event, index)} event={event} />
        ))}
      </div>
    </div>
  );
}
