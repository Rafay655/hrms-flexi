/**
 * app/(system)/flexi-import/_components/status.tsx
 * FlexiImport — shared status + import-type vocabulary.
 *
 * Single source of truth for batch-status colours, labels, and badges so the
 * dashboard, batch list, and batch detail render identically. On-brand palette:
 * brand purple (#322E53) for settled/internal states, peach (#EEC293) / salmon
 * (#F3AB9D) for in-flight + attention states, emerald for success, clay-red for
 * failure. Matches the DMS dashboard design language.
 */

import { cn } from "@/lib/utils";

export type FiStatus =
  | "pending"
  | "uploaded"
  | "validating"
  | "validation_complete"
  | "pending_approval"
  | "approved"
  | "processing"
  | "completed"
  | "failed"
  | "rejected"
  | "rolled_back";

type StatusMeta = {
  label: string;
  /** Solid hex for chart cells + legend dots. */
  color: string;
  /** Pill classes (bg + text + ring) for badges. */
  badge: string;
};

export const FI_STATUS_META: Record<string, StatusMeta> = {
  pending:             { label: "Pending",          color: "#CBD5E1", badge: "bg-slate-100 text-slate-600 ring-slate-200" },
  uploaded:            { label: "Uploaded",         color: "#C7BFE0", badge: "bg-[#F1EEF8] text-brand-700 ring-[#E2DAF1]" },
  validating:          { label: "Validating",       color: "#9F93C8", badge: "bg-[#EFEAF7] text-brand-700 ring-[#E2DAF1]" },
  validation_complete: { label: "Ready for review",        color: "#5C5490", badge: "bg-[#EDECF2] text-brand-800 ring-[#DAD7E6]" },
  pending_approval:    { label: "Pending Approval", color: "#F3AB9D", badge: "bg-[#FCEDE9] text-[#b4452f] ring-[#F6D8D0]" },
  approved:            { label: "Approved",         color: "#49426E", badge: "bg-[#EDECF2] text-brand-800 ring-[#DAD7E6]" },
  processing:          { label: "Processing",       color: "#EEC293", badge: "bg-[#FBF1E3] text-[#9a6b2f] ring-[#F2E3CC]" },
  completed:           { label: "Completed",        color: "#3F9D7A", badge: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  failed:              { label: "Failed",           color: "#D9694F", badge: "bg-[#FCEEEA] text-[#b4452f] ring-[#F4D5CC]" },
  rejected:            { label: "Rejected",         color: "#C2705E", badge: "bg-orange-50 text-orange-700 ring-orange-100" },
  rolled_back:         { label: "Rolled Back",      color: "#94A3B8", badge: "bg-slate-100 text-slate-500 ring-slate-200" },
};

/** Order used for the lifecycle donut + legend (success-first, terminals last). */
export const FI_STATUS_ORDER: FiStatus[] = [
  "completed",
  "processing",
  "validating",
  "uploaded",
  "validation_complete",
  "approved",
  "pending_approval",
  "failed",
  "rejected",
  "rolled_back",
];

export function statusMeta(status: string): StatusMeta {
  return FI_STATUS_META[status] ?? { label: status, color: "#CBD5E1", badge: "bg-slate-100 text-slate-600 ring-slate-200" };
}

export function StatusBadge({
  status,
  size = "sm",
  truncate = false,
  className,
}: {
  status: string;
  size?: "sm" | "md";
  truncate?: boolean;
  className?: string;
}) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        meta.badge,
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden="true"
      />
      <span className={truncate ? "min-w-0 truncate" : undefined}>{meta.label}</span>
    </span>
  );
}

// ── Import types ──────────────────────────────────────────────────────────────

export const IMPORT_TYPE_META: Record<string, { label: string; badge: string }> = {
  employees:            { label: "Employees",       badge: "bg-[#EDECF2] text-brand-800 ring-[#DAD7E6]" },
  employee:             { label: "Employees",       badge: "bg-[#EDECF2] text-brand-800 ring-[#DAD7E6]" },
  flexi_meta_entities:  { label: "Reference Data",  badge: "bg-[#FBF1E3] text-[#9a6b2f] ring-[#F2E3CC]" },
  flexi_meta:           { label: "Reference Data",  badge: "bg-[#FBF1E3] text-[#9a6b2f] ring-[#F2E3CC]" },
  department:           { label: "Departments",     badge: "bg-[#EFEAF7] text-brand-700 ring-[#E2DAF1]" },
  location:             { label: "Locations",       badge: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
};

export function importTypeMeta(type: string): { label: string; badge: string } {
  return (
    IMPORT_TYPE_META[type] ?? {
      label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      badge: "bg-slate-100 text-slate-600 ring-slate-200",
    }
  );
}

export function ImportTypePill({ type, className }: { type: string; className?: string }) {
  const meta = importTypeMeta(type);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
