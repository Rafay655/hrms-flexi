import React from "react";
import { cn } from "@/lib/utils";
import { priorityLabel, ticketStatusLabel, ticketStatusTone } from "@/lib/flexi-desk";
import type { TicketAudience, TicketPriority, TicketStatus } from "@/types/flexi-desk.types";

/** Status is always shown as text; the tone is decoration only (never colour alone). */
export function TicketStatusBadge({ status, audience = "employee" }: { status: TicketStatus; audience?: TicketAudience }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        ticketStatusTone(status),
      )}
    >
      {ticketStatusLabel(status, audience)}
    </span>
  );
}

export function TicketPriorityLabel({ priority }: { priority: TicketPriority }) {
  return <span className="text-xs text-[var(--brand-800)]/60">{priorityLabel(priority)} priority</span>;
}
