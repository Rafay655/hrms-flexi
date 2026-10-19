"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { projectEdgeService } from "@/services/projectedge";
import type {
  ReportId,
  ReportFilters,
  ReportExportFormat,
  ReportExportJob,
} from "@/types/projectedge-reports";

export function ReportExports({
  id,
  filters,
  scope,
}: {
  id: ReportId;
  filters: ReportFilters;
  scope: string;
}) {
  const [format, setFormat] = useState<ReportExportFormat>("pdf");
  const [job, setJob] = useState<ReportExportJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, []);
  const status = useQuery({
    queryKey: ["projectedge", "export", scope, job?.uuid],
    queryFn: ({ signal }) =>
      projectEdgeService.reportExportStatus(job!.uuid, signal),
    enabled: job !== null,
    retry: false,
    refetchInterval: (query) =>
      !query.state.error &&
      ["pending", "processing"].includes(query.state.data?.status ?? "pending")
        ? 5000
        : false,
  });
  // A failed refresh must never leave a cached download button available.
  const current = status.isError ? null : (status.data ?? job);
  const waiting =
    current !== null && ["pending", "processing"].includes(current.status);
  async function request() {
    const signal = lifetime.current!.signal;
    setBusy(true);
    setError("");
    try {
      const result = await projectEdgeService.requestReportExport(
        id,
        filters,
        format,
        signal,
      );
      if (!signal.aborted) setJob(result);
    } catch {
      if (!signal.aborted)
        setError(
          "Export could not be queued. Check access and size limits, or narrow the report scope.",
        );
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }
  async function download() {
    if (current?.status !== "complete" || status.isFetching) return;
    const signal = lifetime.current!.signal;
    setBusy(true);
    setError("");
    try {
      const blob = await projectEdgeService.downloadReportExport(
        current.uuid,
        signal,
      );
      if (signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        current.file_name ?? `projectedge-${id}.${current.format}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (!signal.aborted)
        setError(
          "Download unavailable. The export may have expired or your access may have changed. Request a new export.",
        );
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="pe-card space-y-3 p-5" aria-label="Report exports">
      <h2 className="text-lg font-semibold">Export complete report</h2>
      <p className="text-sm text-slate-600">
        All matching rows, not just this page. Files expire after seven days;
        access is checked again at download. Excel: 10,000 rows. PDF: 2,000 rows
        (Gantt: 500). PNG: 500 tasks.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          Export format
          <select
            className="pe-input block min-h-11"
            value={format}
            onChange={(event) =>
              setFormat(event.target.value as ReportExportFormat)
            }
            disabled={busy || waiting}
          >
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel (.xlsx)</option>
            {id === "gantt-progress" ? (
              <option value="png">Gantt snapshot (.png)</option>
            ) : null}
          </select>
        </label>
        <Button
          className="pe-button-primary min-h-11"
          disabled={busy || waiting || status.isFetching}
          onClick={() => void request()}
        >
          Queue export
        </Button>
        {current?.status === "complete" ? (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy || status.isFetching}
            onClick={() => void download()}
          >
            Download export
          </Button>
        ) : null}
        {job ? (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy || status.isFetching}
            onClick={() => void status.refetch()}
          >
            Refresh export status
          </Button>
        ) : null}
      </div>
      {current ? (
        <p role="status">
          Export: {current.status}
          {current.status === "complete"
            ? ` · ${current.record_count} rows · expires ${current.expires_at}`
            : ""}
          {waiting ? " · Generation requires the audit queue worker." : ""}
        </p>
      ) : null}
      {current?.status === "failed" ? (
        <p role="alert">
          {current.error_message ?? "Export failed. Request a new export."}
        </p>
      ) : null}
      {status.isError ? (
        <p role="alert">
          Export status unavailable. Check your access, refresh status or
          request a new export. Cached downloads are hidden.
        </p>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
