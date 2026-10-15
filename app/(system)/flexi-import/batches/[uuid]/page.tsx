"use client";

/**
 * app/(system)/flexi-import/batches/[uuid]/page.tsx
 * FlexiImport — Batch Detail
 *
 * Live-updating detail view for a single import batch.
 *
 * Sections:
 *   • Header       — import type + filename, large status badge, uploader + date
 *   • Progress     — animated bar, row counts, UX copy for each terminal state
 *   • Approval     — conditional widget (requires_approval batches only)
 *   • Column Map   — collapsible accordion: CSV column → Field Name
 *   • Sample Rows  — first 5 valid rows | first 5 invalid rows (side-by-side)
 *   • Actions      — Download Error Report, Rollback (with confirmation dialog)
 *
 * Polling strategy:
 *   While status is active (uploaded | validating | processing): the batch detail
 *   query refetches every 3 s via TanStack Query refetchInterval. Polling stops
 *   automatically when a terminal status is reached — no manual cleanup needed.
 *
 * Confetti:
 *   Shown once when status transitions to "completed" with zero failed_rows.
 *   Also shown (briefly) when the page first lands on a recently-completed
 *   batch (completed_at within the last 30 seconds).
 *   Implemented with framer-motion — no external canvas-confetti dependency.
 *
 * Accessibility:
 *   • aria-live="polite" on progress region + status messages
 *   • role="alert" on error banners
 *   • color + icon + text for every status indicator
 *   • prefers-reduced-motion: confetti animation respects OS setting
 *   • focus-visible outlines preserved on all interactive elements
 */

import { showApiError } from "@/lib/error-toast";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { useRollbackBatch } from "@/hooks/useFlexiImport";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type BatchStatus =
  | "pending"
  | "validating"
  | "validation_complete"
  | "pending_approval"
  | "approved"
  | "processing"
  | "completed"
  | "failed"
  | "rejected"
  | "rolled_back";

type ApprovalStatus = "pending" | "approved" | "rejected";

interface BatchDetail {
  uuid: string;
  import_type: string;
  file_name: string;
  status: BatchStatus;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  skipped_rows: number;
  progress_percentage: number;
  requires_approval: boolean;
  approval_status: ApprovalStatus | null;
  approval_threshold: number | null;
  initiator_name: string;
  submitted_at: string | null;
  rejection_reason: string | null;
  /** csv_header → field_key */
  column_mapping: Record<string, string>;
  /** field_key → display label */
  field_labels: Record<string, string>;
  import_mode: "skip_errors" | "all_or_nothing";
  is_rollbackable: boolean;
  created_at: string;
  completed_at: string | null;
}

interface BatchRow {
  row_number: number;
  fields: Record<string, string>;
  status: "valid" | "invalid";
  errors?: Record<string, string>;
}

interface LiveProgress {
  status: BatchStatus;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  progress_percentage: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

type StatusCfg = {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
};

const STATUS_CONFIG: Record<BatchStatus, StatusCfg> = {
  pending:             { label: "Pending",         bg: "bg-gray-100",   text: "text-gray-700",   border: "border-gray-200", dot: "bg-gray-400"   },
  validating:          { label: "Validating",       bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200", dot: "bg-blue-500"   },
  validation_complete: { label: "Validated",        bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200",dot: "bg-indigo-500"},
  pending_approval:    { label: "Pending Approval", bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200",dot: "bg-amber-500"  },
  approved:            { label: "Approved",         bg: "bg-teal-100",   text: "text-teal-700",   border: "border-teal-200", dot: "bg-teal-500"   },
  processing:          { label: "Processing",       bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-200", dot: "bg-blue-600"   },
  completed:           { label: "Completed",        bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200",dot: "bg-green-500"  },
  failed:              { label: "Failed",           bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200",  dot: "bg-red-500"    },
  rejected:            { label: "Rejected",         bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200",dot:"bg-orange-500"  },
  rolled_back:         { label: "Rolled Back",      bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-200",dot: "bg-slate-400"  },
};

const IMPORT_TYPE_CFG: Record<string, { label: string; bg: string; text: string }> = {
  employee:   { label: "Employee Import",       bg: "bg-blue-100",    text: "text-blue-700"    },
  flexi_meta: { label: "FlexiMeta Reference",   bg: "bg-purple-100",  text: "text-purple-700"  },
  department: { label: "Department Import",     bg: "bg-teal-100",    text: "text-teal-700"    },
  location:   { label: "Location Import",       bg: "bg-emerald-100", text: "text-emerald-700" },
};

const TERMINAL_STATUSES = new Set<BatchStatus>([
  "completed", "failed", "rejected", "rolled_back",
]);

// Confetti colours
const CONFETTI_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function humaniseType(type: string): string {
  return (IMPORT_TYPE_CFG[type]?.label ?? type.replace(/_/g, " ")).toLowerCase();
}

// ── Confetti overlay (framer-motion, no external library) ─────────────────────

interface ConfettiParticle {
  id: number;
  left: string;
  color: string;
  width: number;
  height: number;
  borderRadius: string;
  duration: number;
  delay: number;
  rotation: number;
}

function ConfettiOverlay({ show }: { show: boolean }) {
  const particles = useMemo<ConfettiParticle[]>(
    () =>
      Array.from({ length: 65 }, (_, i) => {
        const isRect = Math.random() > 0.45;
        const size   = Math.random() * 9 + 4;
        return {
          id:           i,
          left:         `${Math.random() * 100}%`,
          color:        CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          width:        size,
          height:       isRect ? size * 2 : size,
          borderRadius: isRect ? "2px" : "50%",
          duration:     Math.random() * 1.8 + 2,
          delay:        Math.random() * 1.2,
          rotation:     Math.random() * 540,
        };
      }),
    []
  );

  return (
    <AnimatePresence>
      {show && (
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 9999 }}
          aria-hidden="true"
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y:       "112vh",
                opacity: [1, 1, 0.6, 0],
                rotate:  p.rotation,
              }}
              transition={{
                duration: p.duration,
                delay:    p.delay,
                ease:     "easeIn",
              }}
              style={{
                position:     "absolute",
                left:         p.left,
                top:          0,
                width:        p.width,
                height:       p.height,
                borderRadius: p.borderRadius,
                backgroundColor: p.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  size = "sm",
}: {
  status: BatchStatus;
  size?: "sm" | "lg";
}) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status, bg: "bg-gray-100", text: "text-gray-700",
    border: "border-gray-200", dot: "bg-gray-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        cfg.bg, cfg.text, cfg.border,
        size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      )}
    >
      <span className={cn("rounded-full shrink-0", cfg.dot, size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5")} aria-hidden />
      {cfg.label}
    </span>
  );
}

// ── Progress section ──────────────────────────────────────────────────────────

function ProgressSection({
  batch,
  live,
}: {
  batch: BatchDetail;
  live: LiveProgress;
}) {
  const pct         = Math.min(100, Math.max(0, live.progress_percentage));
  const isProcessing = batch.status === "processing";
  const isCompleted  = batch.status === "completed";
  const isFailed     = batch.status === "failed";
  const hasErrors    = live.failed_rows > 0;
  const allSuccess   = isCompleted && !hasErrors;

  return (
    <div
      className="bg-white rounded-xl border border-border p-6"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Section title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Progress</h2>
        {isProcessing && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            <span>Processing…</span>
          </div>
        )}
        {isCompleted && allSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            All rows imported
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            Processed{" "}
            <strong className="text-foreground">
              {live.processed_rows.toLocaleString()}
            </strong>{" "}
            /{" "}
            <strong className="text-foreground">
              {batch.total_rows.toLocaleString()}
            </strong>{" "}
            rows
          </span>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {pct.toFixed(0)}%
          </span>
        </div>

        {/* Animated bar */}
        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isFailed ? "bg-red-500" : hasErrors ? "bg-amber-500" : "bg-green-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Row count breakdown */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden />
          <span className="text-green-700 font-medium">
            {live.successful_rows.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-xs">successful</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />
          <span className={cn("font-medium", live.failed_rows > 0 ? "text-red-600" : "text-muted-foreground")}>
            {live.failed_rows.toLocaleString()}
          </span>
          <span className="text-muted-foreground text-xs">failed</span>
        </div>

        {(batch.skipped_rows ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" aria-hidden />
            <span className="text-muted-foreground font-medium">
              {batch.skipped_rows.toLocaleString()}
            </span>
            <span className="text-muted-foreground text-xs">skipped</span>
          </div>
        )}
      </div>

      {/* ── State-specific messages ── */}

      {/* Processing message */}
      {isProcessing && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-700 leading-relaxed">
            Your import is running in the background. You can leave this page
            and come back — we&apos;ll keep going.
          </p>
        </div>
      )}

      {/* Completed — all success */}
      {isCompleted && allSuccess && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-green-700 leading-relaxed">
            All{" "}
            <strong>{live.successful_rows.toLocaleString()}</strong> rows were
            imported successfully. No errors found.
          </p>
        </div>
      )}

      {/* Completed — with errors */}
      {isCompleted && hasErrors && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-amber-700 leading-relaxed">
            Import complete.{" "}
            <strong>{live.successful_rows.toLocaleString()}</strong> rows were
            imported successfully.{" "}
            <strong>{live.failed_rows.toLocaleString()}</strong> rows had errors
            and were skipped. Download the error report to fix and re-upload.
          </p>
        </div>
      )}

      {/* Failed */}
      {isFailed && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3"
        >
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-red-700 leading-relaxed">
            This import encountered a fatal error and could not be completed.
            No records were written. You can start a new import once the
            underlying issue is resolved.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Approval widget ───────────────────────────────────────────────────────────

function ApprovalWidget({ batch }: { batch: BatchDetail }) {
  const status = batch.approval_status;

  const cfg = {
    pending:  {
      icon: <Clock className="h-5 w-5 text-amber-600 shrink-0" aria-hidden />,
      title: "Awaiting HR Manager Approval",
      bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800",
      badge: "bg-amber-100 text-amber-700",
    },
    approved: {
      icon: <Check className="h-5 w-5 text-green-600 shrink-0" aria-hidden />,
      title: "Import Approved",
      bg: "bg-green-50", border: "border-green-200", text: "text-green-800",
      badge: "bg-green-100 text-green-700",
    },
    rejected: {
      icon: <XCircle className="h-5 w-5 text-red-600 shrink-0" aria-hidden />,
      title: "Import Rejected",
      bg: "bg-red-50", border: "border-red-200", text: "text-red-800",
      badge: "bg-red-100 text-red-700",
    },
  }[status ?? "pending"];

  return (
    <div className={cn("rounded-xl border p-5", cfg.bg, cfg.border)}>
      <div className="flex items-start gap-3">
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className={cn("text-sm font-semibold", cfg.text)}>
              {cfg.title}
            </h2>
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", cfg.badge)}>
              {status ?? "pending"}
            </span>
          </div>

          <p className={cn("text-xs leading-relaxed", cfg.text)}>
            <span className="font-medium">Submitted by</span>{" "}
            {batch.initiator_name}
            {batch.submitted_at && (
              <>
                {" "}on{" "}
                <time dateTime={batch.submitted_at}>
                  {formatDate(batch.submitted_at)}
                </time>
              </>
            )}
          </p>

          {/* Threshold note */}
          {batch.approval_threshold && (
            <p className={cn("text-xs mt-1", cfg.text, "opacity-75")}>
              This import contains{" "}
              <strong>{batch.total_rows.toLocaleString()}</strong> rows and
              exceeds the {batch.approval_threshold.toLocaleString()}-row
              approval threshold.
            </p>
          )}

          {/* Rejection reason */}
          {status === "rejected" && batch.rejection_reason && (
            <div className="mt-3 rounded-lg bg-red-100 border border-red-200 px-3 py-2">
              <p className="text-xs text-red-700 font-medium mb-0.5">
                Rejection reason
              </p>
              <p className="text-xs text-red-700 leading-relaxed">
                {batch.rejection_reason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Column mapping accordion ──────────────────────────────────────────────────

function ColumnMappingAccordion({ batch }: { batch: BatchDetail }) {
  const [expanded, setExpanded] = useState(false);

  const entries = Object.entries(batch.column_mapping);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="column-mapping-body"
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50/60 transition-colors cursor-pointer"
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Column Mapping Used
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {entries.length} column{entries.length !== 1 ? "s" : ""} mapped
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
        )}
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id="column-mapping-body"
            key="mapping-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-6 pb-5 pt-4">
              {entries.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No column mapping recorded for this import.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" aria-label="Column mapping">
                    <thead>
                      <tr className="bg-gray-50/60">
                        <th
                          scope="col"
                          className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide"
                        >
                          CSV Column
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2 text-muted-foreground"
                          aria-hidden
                        />
                        <th
                          scope="col"
                          className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide"
                        >
                          Field Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {entries.map(([csvHeader, fieldKey]) => (
                        <tr key={csvHeader} className="hover:bg-gray-50/40">
                          <td className="px-3 py-2">
                            <span className="font-mono text-foreground">
                              {csvHeader}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-muted-foreground">
                            →
                          </td>
                          <td className="px-3 py-2 text-foreground">
                            {batch.field_labels?.[fieldKey] ?? fieldKey}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sample rows section ───────────────────────────────────────────────────────

interface SampleRowsProps {
  uuid: string;
  hasFailed: boolean;
  fieldLabels: Record<string, string>;
}

function SampleRowsSection({ uuid, hasFailed, fieldLabels }: SampleRowsProps) {
  const { data: validRows, isLoading: validLoading } = useQuery<BatchRow[]>({
    queryKey: ["flexi-import", "batch-rows", uuid, "valid"],
    queryFn: () =>
      api
        .get(`/flexi-import/batches/${uuid}/rows`, {
          params: { status: "valid", per_page: 5 },
        })
        .then((r) => r.data.data as BatchRow[]),
    staleTime: 60_000,
  });

  const { data: invalidRows, isLoading: invalidLoading } = useQuery<BatchRow[]>({
    queryKey: ["flexi-import", "batch-rows", uuid, "invalid"],
    queryFn: () =>
      api
        .get(`/flexi-import/batches/${uuid}/rows`, {
          params: { status: "invalid", per_page: 5 },
        })
        .then((r) => r.data.data as BatchRow[]),
    enabled: hasFailed,
    staleTime: 60_000,
  });

  // Collect all field keys across rows to build table columns
  const validCols  = useMemo(
    () => Array.from(new Set(validRows?.flatMap((r) => Object.keys(r.fields)) ?? [])),
    [validRows]
  );
  const invalidCols = useMemo(
    () => Array.from(new Set(invalidRows?.flatMap((r) => Object.keys(r.fields)) ?? [])),
    [invalidRows]
  );

  const colLabel = (key: string) => fieldLabels[key] ?? key;

  function SampleTable({
    rows,
    cols,
    loading,
    theme,
  }: {
    rows?: BatchRow[];
    cols: string[];
    loading: boolean;
    theme: "green" | "red";
  }) {
    const isGreen = theme === "green";

    return (
      <div className={cn("rounded-xl border overflow-hidden", isGreen ? "border-green-200" : "border-red-200")}>
        {/* Header */}
        <div
          className={cn(
            "px-4 py-3 flex items-center gap-2",
            isGreen ? "bg-green-50 border-b border-green-200" : "bg-red-50 border-b border-red-200"
          )}
        >
          {isGreen ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" aria-hidden />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 shrink-0" aria-hidden />
          )}
          <h3 className={cn("text-sm font-semibold", isGreen ? "text-green-700" : "text-red-700")}>
            {isGreen ? "Valid Rows" : "Invalid Rows"}
          </h3>
          <span className={cn("text-xs ml-auto", isGreen ? "text-green-600" : "text-red-600")}>
            First 5
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : !rows || rows.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted-foreground text-center italic">
              {isGreen ? "No valid rows found." : "No invalid rows found."}
            </p>
          ) : (
            <table className="w-full text-xs" aria-label={isGreen ? "Valid sample rows" : "Invalid sample rows"}>
              <thead>
                <tr className="bg-gray-50/60 border-b border-border">
                  <th scope="col" className="text-left px-3 py-2 text-muted-foreground font-semibold uppercase tracking-wide whitespace-nowrap">
                    Row #
                  </th>
                  {cols.map((col) => (
                    <th key={col} scope="col" className="text-left px-3 py-2 text-muted-foreground font-semibold uppercase tracking-wide whitespace-nowrap">
                      {colLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.row_number} className="hover:bg-gray-50/40">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground font-medium">
                      {row.row_number}
                    </td>
                    {cols.map((col) => {
                      const value = row.fields[col] ?? "";
                      const error = row.errors?.[col];
                      return (
                        <td key={col} className="px-3 py-2 max-w-[160px]">
                          <div
                            className={cn(
                              "truncate",
                              error ? "text-red-600" : "text-foreground"
                            )}
                            title={value}
                          >
                            {value || <span className="italic text-muted-foreground">—</span>}
                          </div>
                          {error && (
                            <div
                              className="text-[10px] text-red-500 mt-0.5 leading-snug"
                              role="alert"
                              aria-label={`Error in ${colLabel(col)}: ${error}`}
                            >
                              {error}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Sample import rows">
      <h2 className="text-base font-semibold text-foreground mb-3">
        Sample Rows
      </h2>
      <div className={cn("grid gap-4", hasFailed ? "md:grid-cols-2" : "grid-cols-1")}>
        <SampleTable
          rows={validRows}
          cols={validCols}
          loading={validLoading}
          theme="green"
        />
        {hasFailed && (
          <SampleTable
            rows={invalidRows}
            cols={invalidCols}
            loading={invalidLoading}
            theme="red"
          />
        )}
      </div>
    </section>
  );
}

// ── Page skeleton ─────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="bg-white rounded-xl border border-border p-6 space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-96 bg-gray-200 rounded" />
      </div>
      <div className="bg-white rounded-xl border border-border p-6 space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-2.5 w-full bg-gray-200 rounded-full" />
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BatchDetailPage() {
  const params    = useParams<{ uuid: string }>();
  const uuid      = params.uuid;
  const router    = useRouter();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showConfetti, setShowConfetti] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const prevStatusRef = useRef<BatchStatus | undefined>(undefined);

  // ── Main batch query (3 s polling while active, stops at terminal status) ──
  const {
    data: batch,
    isLoading,
    isError,
  } = useQuery<BatchDetail>({
    queryKey: ["flexi-import", "batch", uuid],
    queryFn: () =>
      api
        .get(`/flexi-import/batches/${uuid}`)
        .then((r) => r.data.data as BatchDetail),
    staleTime: 0,
    retry: 2,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s && !TERMINAL_STATUSES.has(s as BatchStatus) ? 3_000 : false;
    },
  });

  // ── Status-change confetti ────────────────────────────────────────────────
  useEffect(() => {
    if (!batch) return;
    const isNewCompletion =
      prevStatusRef.current !== "completed" &&
      batch.status === "completed" &&
      batch.failed_rows === 0;
    const isFreshCompletion =
      batch.status === "completed" &&
      batch.failed_rows === 0 &&
      batch.completed_at != null &&
      Date.now() - new Date(batch.completed_at).getTime() < 30_000;
    if (isNewCompletion || (!prevStatusRef.current && isFreshCompletion)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4_500);
    }
    prevStatusRef.current = batch.status;
  }, [batch?.status, batch?.failed_rows]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rollback mutation ─────────────────────────────────────────────────────
  const { mutate: rollbackMutate, isPending: isRollingBack } = useRollbackBatch();
  const rollback = () => rollbackMutate(uuid, { onSuccess: () => setRollbackOpen(false) });

  // ── Error report download ─────────────────────────────────────────────────
  async function handleDownload() {
    try {
      const res = await api.get(`/flexi-import/batches/${uuid}/error-report`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `import-errors-${uuid.slice(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Failed to download error report. Please try again." });
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const progress: LiveProgress = {
    status:              batch?.status ?? "pending",
    processed_rows:      batch?.processed_rows ?? 0,
    successful_rows:     batch?.successful_rows ?? 0,
    failed_rows:         batch?.failed_rows ?? 0,
    progress_percentage: batch?.progress_percentage ?? 0,
  };

  const isTerminal  = batch ? TERMINAL_STATUSES.has(batch.status) : false;
  const hasFailed   = (progress.failed_rows ?? 0) > 0;
  const showProgress = batch && !["pending", "pending_approval"].includes(batch.status);
  const showSampleRows = batch && ["completed", "failed"].includes(batch.status);
  const typeLabel   = batch
    ? (IMPORT_TYPE_CFG[batch.import_type]?.label ?? batch.import_type)
    : "";

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <PageSkeleton />;

  if (isError || !batch) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400 mb-3" aria-hidden />
        <h1 className="text-lg font-semibold text-foreground mb-1">
          Batch not found
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          This import batch does not exist or you don&apos;t have permission to
          view it.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Confetti overlay — framer-motion particles */}
      <ConfettiOverlay show={showConfetti} />

      <div className="space-y-6 max-w-5xl">

        {/* ── Back nav + actions ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/flexi-import/batches"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Import History
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Error Report */}
            {isTerminal && hasFailed && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white text-sm font-medium text-foreground hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                Download Error Report
              </button>
            )}

            {/* Rollback */}
            {batch.is_rollbackable && (
              <button
                type="button"
                onClick={() => setRollbackOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Rollback
              </button>
            )}
          </div>
        </div>

        {/* ── Header card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {/* Import type pill + filename */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {(() => {
                  const tc = IMPORT_TYPE_CFG[batch.import_type];
                  return tc ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tc.bg} ${tc.text}`}>
                      {tc.label}
                    </span>
                  ) : null;
                })()}
                <StatusBadge status={batch.status} size="lg" />
              </div>

              {/* File name */}
              <h1
                className="text-lg font-bold text-foreground font-mono break-all leading-snug"
                title={batch.file_name}
              >
                {batch.file_name}
              </h1>

              {/* Meta */}
              <p className="text-xs text-muted-foreground mt-2">
                Uploaded by{" "}
                <span className="font-medium text-foreground">
                  {batch.initiator_name}
                </span>
                {" · "}
                <time
                  dateTime={batch.created_at}
                  title={formatDateTime(batch.created_at)}
                >
                  {formatDateTime(batch.created_at)}
                </time>
              </p>

              {/* Import mode chip */}
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                  {batch.import_mode === "all_or_nothing"
                    ? "Mode: All-or-nothing"
                    : "Mode: Skip errors"}
                </span>
              </div>
            </div>

            {/* Total rows widget */}
            <div className="shrink-0 text-center sm:text-right">
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {batch.total_rows.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                total rows
              </p>
            </div>
          </div>
        </div>

        {/* ── Progress section ─────────────────────────────────────────── */}
        {showProgress && (
          <ProgressSection batch={batch} live={progress} />
        )}

        {/* ── Approval widget ──────────────────────────────────────────── */}
        {batch.requires_approval && (
          <ApprovalWidget batch={batch} />
        )}

        {/* ── Column mapping accordion ─────────────────────────────────── */}
        {Object.keys(batch.column_mapping).length > 0 && (
          <ColumnMappingAccordion batch={batch} />
        )}

        {/* ── Sample rows ──────────────────────────────────────────────── */}
        {showSampleRows && (
          <SampleRowsSection
            uuid={uuid}
            hasFailed={hasFailed}
            fieldLabels={batch.field_labels ?? {}}
          />
        )}

        {/* ── Action footer ────────────────────────────────────────────── */}
        {(isTerminal && hasFailed) || batch.is_rollbackable ? (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            {isTerminal && hasFailed && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-white text-sm font-medium text-foreground hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4 text-muted-foreground" aria-hidden />
                Download Error Report
              </button>
            )}
            {batch.is_rollbackable && (
              <button
                type="button"
                onClick={() => setRollbackOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Rollback Import
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Rollback confirmation dialog ──────────────────────────────── */}
      <Dialog
        open={rollbackOpen}
        onOpenChange={(open) => !isRollingBack && setRollbackOpen(open)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
              Rollback Import?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="pt-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This will remove{" "}
                  <strong className="text-foreground">
                    {progress.successful_rows.toLocaleString()}
                  </strong>{" "}
                  <strong className="text-foreground">
                    {humaniseType(batch.import_type)}
                  </strong>{" "}
                  records that were created by this import. This cannot be
                  undone. Affected employees will lose system access.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 my-2">
            <p className="text-xs text-red-700">
              <span className="font-semibold">File: </span>
              <span className="font-mono">{batch.file_name}</span>
            </p>
            <p className="text-xs text-red-600 mt-1">
              <span className="font-semibold">{typeLabel}</span> ·{" "}
              {progress.successful_rows.toLocaleString()} records will be
              permanently deleted
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRollbackOpen(false)}
              disabled={isRollingBack}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isRollingBack}
              onClick={() => rollback()}
            >
              {isRollingBack ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
                  Rolling back…
                </>
              ) : (
                "Yes, Rollback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
