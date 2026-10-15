// components/payroll-run-stepper/Step2Ingest.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { forwardRef, useImperativeHandle } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Calendar,
  FileEdit,
  HandCoins,
  Wallet,
  Database,
} from "lucide-react";
import type { StepHandle } from "@/types/stepper";

/* ----------------------------------------------------------------------- */
/* Types                                                                    */
/* ----------------------------------------------------------------------- */

interface IngestSource {
  key: string;
  name: string;
  status: "READY" | "SYNCED" | "FAILED" | "PENDING";
  records: number;
  impact: number;
  subtitle: string;
  pending?: number;
  lop_days?: number;
  drilldown: string | null;
}

interface SummaryRow {
  source: string;
  records: number;
  net_impact: number;
  integrity: string;
}

interface IngestStatus {
  sources: IngestSource[];
  summary_table: SummaryRow[];
  total: {
    label: string;
    records: number;
    integrated_impact: number;
  };
  meta: {
    total_employees: number;
    cutoff_locked_at: string | null;
    failed_sources: any[];
    all_synced: boolean;
    cutoff_warning: string | null;
  };
  ingested_at: string | null;
  status: string;
  message: string;
}

/* ----------------------------------------------------------------------- */
/* Props                                                                    */
/* ----------------------------------------------------------------------- */

interface Step2Props {
  workflowUuid?: string;
}

/* ----------------------------------------------------------------------- */
/* Small presentational helpers (kept consistent with Step1)               */
/* ----------------------------------------------------------------------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Shared pill styling for both source status and summary-table integrity values. */
function toneClasses(value: string) {
  const tones: Record<string, string> = {
    SYNCED: "border-green-200 bg-green-50 text-green-700",
    READY: "border-green-200 bg-green-50 text-green-700",
    LOCKED: "border-indigo-200 bg-indigo-50 text-indigo-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    FAILED: "border-red-200 bg-red-50 text-red-700",
  };
  return tones[value] ?? "border-gray-200 bg-gray-50 text-gray-600";
}

function Pill({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${toneClasses(
        value
      )}`}
    >
      {value}
    </span>
  );
}

/** Icon shown in the card's top-left badge, resolved from the source key. */
function SourceIcon({ sourceKey }: { sourceKey: string }) {
  const key = sourceKey.toLowerCase();
  if (key.includes("attend") || key.includes("time")) return <Clock className="h-5 w-5 text-gray-700" />;
  if (key.includes("leave")) return <Calendar className="h-5 w-5 text-gray-700" />;
  if (key.includes("manual")) return <FileEdit className="h-5 w-5 text-orange-600" />;
  if (key.includes("loan")) return <HandCoins className="h-5 w-5 text-gray-700" />;
  if (key.includes("expense")) return <Wallet className="h-5 w-5 text-gray-700" />;
  return <Database className="h-5 w-5 text-gray-700" />;
}

function formatMoney(value: number) {
  const amount = Math.abs(value).toLocaleString();
  return `${value < 0 ? "-" : ""}PKR ${amount}`;
}

/* ----------------------------------------------------------------------- */
/* Step Component                                                           */
/* ----------------------------------------------------------------------- */

const Step2Ingest = forwardRef<StepHandle, Step2Props>(
  function Step2Ingest({ workflowUuid }, ref) {
    const queryClient = useQueryClient();

    // ---------- Fetch ingest status ----------
    const { data: ingestStatus, isLoading: isLoadingStatus } = useQuery({
      queryKey: ["workflow-ingest", workflowUuid],
      queryFn: async () => {
        const { data } = await api.get(
          `/pay-edge/payroll-workflows/${workflowUuid}/ingest`
        );
        return data.data as IngestStatus;
      },
      enabled: !!workflowUuid,
      refetchInterval: false,
    });

    // ---------- Re‑sync single source ----------
    // NOTE: mutationFn's argument (the source key) is captured by react-query
    // as `resyncMutation.variables`. We use that — together with `isPending`
    // — to know *which* source is currently in flight, so only the button
    // for that source shows a spinner/disabled state instead of all of them.
    const resyncMutation = useMutation({
      mutationFn: async (sourceKey: string) => {
        await api.post(
          `/pay-edge/payroll-workflows/${workflowUuid}/ingest/re-sync`,
          { source: sourceKey }
        );
        return sourceKey;
      },
      onSuccess: (sourceKey) => {
        toast.success(`${sourceKey} re‑sync initiated.`);
        queryClient.invalidateQueries({
          queryKey: ["workflow-ingest", workflowUuid],
        });
      },
      onError: (error: any) => {
        showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Re‑sync failed." });
      },
    });

    const isResyncing = (sourceKey: string) =>
      resyncMutation.isPending && resyncMutation.variables === sourceKey;

    // ---------- Final ingest (called on Next) ----------
    const finalIngestMutation = useMutation({
      mutationFn: async () => {
        await api.post(`/pay-edge/payroll-workflows/${workflowUuid}/ingest`);
      },
      onError: (error: any) => {
        showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Ingest submission failed." });
      },
    });

    // ---------- Expose beforeNext to stepper ----------
    useImperativeHandle(ref, () => ({
      beforeNext: async () => {
        await finalIngestMutation.mutateAsync();
        toast.success("Ingestion completed. Proceeding to next step.");
      },
    }), [finalIngestMutation]);

    // ---------- Render ----------
    if (!workflowUuid) {
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 py-8 text-center text-sm text-gray-500">
          No workflow selected. Please complete Step 1 first.
        </div>
      );
    }

    if (isLoadingStatus) {
      return (
        <div className="space-y-3 py-2">
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
        </div>
      );
    }

    if (!ingestStatus) {
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 py-8 text-center text-sm text-gray-500">
          Unable to load ingestion data.
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Sources grid */}
        <Section
          title="Data sources"
          description="Sync each source before moving on to computation."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ingestStatus.sources.map((source) => {
              const pending = isResyncing(source.key);

              return (
                <div
                  key={source.key}
                  className="flex flex-col rounded-xl border border-gray-200 bg-white p-5"
                >
                  {/* Header: icon + status pill */}
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <SourceIcon sourceKey={source.key} />
                    </div>
                    <Pill value={source.status} />
                  </div>

                  {/* Title + subtitle */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-900">{source.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{source.subtitle}</p>
                  </div>

                  {/* Stat boxes */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Records
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {source.records}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Impact
                      </p>
                      <p
                        className={`mt-1 text-lg font-semibold ${
                          source.impact < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatMoney(source.impact)}
                      </p>
                    </div>
                  </div>

                  {/* Action button — always re-sync */}
                  <button
                    type="button"
                    onClick={() => resyncMutation.mutate(source.key)}
                    disabled={pending}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#1E1B4B] py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {pending ? "Syncing…" : "Re-sync"}
                  </button>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Summary */}
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {ingestStatus.total.label}
          </p>
          <div className="mt-2 flex items-center gap-6 text-sm">
            <span className="font-semibold text-gray-900">
              {ingestStatus.total.records}
              <span className="ml-1 font-normal text-gray-500">total records</span>
            </span>
            <span className="font-semibold text-gray-900">
              {formatMoney(ingestStatus.total.integrated_impact)}
              <span className="ml-1 font-normal text-gray-500">integrated impact</span>
            </span>
          </div>
        </div>

        {/* Summary table */}
        {ingestStatus.summary_table?.length > 0 && (
          <Section
            title="Summary"
            description="Snapshot of records and integrity per source for this run."
          >
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2.5">Source</th>
                    <th className="px-4 py-2.5">Records</th>
                    <th className="px-4 py-2.5">Net Impact</th>
                    <th className="px-4 py-2.5">Integrity</th>
                  </tr>
                </thead>
                <tbody>
                  {ingestStatus.summary_table.map((row, idx) => (
                    <tr
                      key={row.source}
                      className={idx > 0 ? "border-t border-gray-100" : ""}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{row.source}</td>
                      <td className="px-4 py-3 text-gray-700">{row.records}</td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          row.net_impact < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatMoney(row.net_impact)}
                      </td>
                      <td className="px-4 py-3">
                        <Pill value={row.integrity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Cutoff lock notice */}
        {ingestStatus.meta.cutoff_warning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {ingestStatus.meta.cutoff_warning}
            {ingestStatus.meta.cutoff_locked_at && (
              <span className="mt-1 block text-xs text-amber-700">
                Locked at {new Date(ingestStatus.meta.cutoff_locked_at).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Optional: all‑synced indicator */}
        {ingestStatus.meta.all_synced && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            All sources have been synced.
          </div>
        )}
      </div>
    );
  }
);

export default Step2Ingest;