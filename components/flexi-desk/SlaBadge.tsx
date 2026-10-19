import React from "react";
import { cn } from "@/lib/utils";
import { slaStateLabel, slaStateTone } from "@/lib/flexi-desk";
import type { SlaState } from "@/types/flexi-desk.types";

/** Resolver-side SLA state. Always text; the tone is decoration only. */
export function SlaBadge({ state }: { state: SlaState }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", slaStateTone(state))}>
      {slaStateLabel(state)}
    </span>
  );
}
