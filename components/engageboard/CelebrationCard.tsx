"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Cake, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamEvent } from "@/types/engageboard-celebrations.types";

/**
 * <CelebrationCard/> — 03-design-system.md §4.
 *
 * Confetti is gated behind useReducedMotion() and is never the sole signal an
 * event occurred: name/event-type/years-of-service render as plain text
 * regardless of whether the animation plays.
 */
export function CelebrationCard({ event }: { event: TeamEvent }) {
  const prefersReducedMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const showConfetti = !prefersReducedMotion && !dismissed;

  const label = useMemo(() => {
    if (event.event_type === "birthday") return "Birthday";
    if (event.years_of_service && event.years_of_service > 0) {
      return `${event.years_of_service}-year work anniversary`;
    }
    return "Work anniversary";
  }, [event.event_type, event.years_of_service]);

  const dateLabel = event.event_date
    ? new Date(event.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  // Confetti geometry is randomized once per mount, not derived from props/state,
  // so it must never be computed inside render itself (a `useMemo` factory
  // calling `Math.random()` is an impure render — React 19's compiler/lint
  // flags this as `react-hooks/purity`). A `useState` lazy initializer runs
  // exactly once, outside of render's purity contract, which is the correct
  // place for one-time non-deterministic setup like this.
  const [confettiPieces] = useState(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 160,
      rotate: Math.random() * 360,
      delay: Math.random() * 0.3,
      color: ["#EEC293", "#F3AB9D", "#322E53", "#8b86ad"][i % 4],
    })),
  );

  return (
    <Card className="relative overflow-hidden p-5">
      {showConfetti && (
        <AnimatePresence>
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {confettiPieces.map((p) => (
              <motion.span
                key={p.id}
                initial={{ y: -20, x: p.x, opacity: 1, rotate: 0 }}
                animate={{ y: 140, opacity: 0, rotate: p.rotate }}
                transition={{ duration: 1.4, delay: p.delay, ease: "easeIn" }}
                onAnimationComplete={() => p.id === confettiPieces.length - 1 && setDismissed(true)}
                className="absolute left-1/2 top-0 h-2 w-2 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      <div className="relative flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            event.event_type === "birthday" ? "bg-brand-400/20 text-brand-700" : "bg-brand-500/20 text-brand-800",
          )}
        >
          {event.event_type === "birthday" ? <Cake className="h-5 w-5" /> : <PartyPopper className="h-5 w-5" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">
            {event.employee?.name ?? "Employee"}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {label}
            {dateLabel ? ` · ${dateLabel}` : ""}
          </p>
          {event.custom_message && (
            <p className="mt-2 text-xs text-gray-600">{event.custom_message}</p>
          )}
        </div>

        <Badge variant="outline" className="shrink-0 text-[10px]">
          {event.event_type === "birthday" ? "Birthday" : "Anniversary"}
        </Badge>
      </div>
    </Card>
  );
}
