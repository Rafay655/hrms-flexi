"use client";

/**
 * FlexiDesk reports (flexidesk.report.view). Pick a report, set a window (default: the last 30 days, at most 12 months),
 * read it, and export it. The export button downloads exactly what is on screen — the same report, the same window, produced
 * by the same server call — and needs the export permission on top of the view permission. Resolver figures are operational,
 * not a personnel assessment, and small samples are not shown.
 */

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { REPORT_CATALOGUE, defaultReportWindow, parseApiError, reportWindowError } from "@/lib/flexi-desk";
import { EscalationView, HeatmapView, ReopenedView, ResolutionView, ResolverView, SlaView, VolumeView } from "@/components/flexi-desk/ReportViews";
import { Field, fieldInput, primaryButton, secondaryButton } from "@/components/flexi-desk/SettingsParts";
import type {
  EscalationRateReport, HeatmapReport, ReopenedRateReport, ResolutionTimeReport, ResolverPerformanceReport, SlaComplianceReport, TicketVolumeReport,
} from "@/types/flexi-desk.types";

const today = () => new Date().toISOString().slice(0, 10);

function ReportBody({ reportKey, from, to }: { reportKey: string; from: string; to: string }) {
  const q = useQuery({
    queryKey: flexiDeskKeys.report(reportKey, from, to),
    queryFn: () => flexiDeskService.getReport<unknown>(reportKey, from || undefined, to || undefined),
    retry: false,
  });

  if (q.isPending) return <p className="text-sm text-gray-500">Loading…</p>;
  if (q.isError) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{parseApiError(q.error)?.message ?? "Could not load this report. You may not have permission to view reports."}</p>;

  switch (reportKey) {
    case "ticket-volume": return <VolumeView data={q.data as TicketVolumeReport} />;
    case "sla-compliance": return <SlaView data={q.data as SlaComplianceReport} />;
    case "escalation-rate": return <EscalationView data={q.data as EscalationRateReport} />;
    case "resolution-time": return <ResolutionView data={q.data as ResolutionTimeReport} />;
    case "reopened-rate": return <ReopenedView data={q.data as ReopenedRateReport} />;
    case "resolver-performance": return <ResolverView data={q.data as ResolverPerformanceReport} />;
    case "open-ticket-heatmap": return <HeatmapView data={q.data as HeatmapReport} />;
    default: return null;
  }
}

export default function ReportsPage() {
  const params = useSearchParams();
  const initial = REPORT_CATALOGUE.find((r) => r.key === params.get("report") && !r.href)?.key ?? "ticket-volume";
  const [reportKey, setReportKey] = React.useState(initial);
  const [window_, setWindow] = React.useState(defaultReportWindow(today()));
  const [applied, setApplied] = React.useState(window_);
  const [exporting, setExporting] = React.useState<"csv" | "pdf" | null>(null);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const problem = reportWindowError(window_.from, window_.to, today());
  const dirty = applied.from !== window_.from || applied.to !== window_.to;
  const windowless = reportKey === "open-ticket-heatmap";
  const exportDisabled = exporting !== null || (!windowless && (!!problem || dirty));
  const current = REPORT_CATALOGUE.find((r) => r.key === reportKey)!;

  const download = async (format: "csv" | "pdf") => {
    setExporting(format);
    setExportError(null);
    try {
      const { blob, filename } = await flexiDeskService.downloadReport(reportKey, format, applied.from || undefined, applied.to || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setExportError(status === 403 ? "You do not have permission to export reports." : "The export did not work. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      <header>
        <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-600">Ticket and service figures for your organisation. Counts, percentages and averages only.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Reports" className="space-y-1">
          {REPORT_CATALOGUE.map((r) => r.href ? (
            <Link key={r.key} href={r.href} className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <span className="text-xs text-gray-400">{r.code}</span> {r.title} <span className="text-xs text-gray-400">↗</span>
            </Link>
          ) : (
            <button key={r.key} type="button" onClick={() => setReportKey(r.key)} aria-current={r.key === reportKey ? "page" : undefined}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${r.key === reportKey ? "bg-indigo-50 font-medium text-indigo-800" : "text-gray-700 hover:bg-gray-50"}`}>
              <span className="text-xs text-gray-400">{r.code}</span> {r.title}
            </button>
          ))}
        </nav>

        <section aria-labelledby="report-title" className="min-w-0 space-y-4">
          <div>
            <h2 id="report-title" className="text-base font-medium text-gray-900">{current.title}</h2>
            <p className="text-sm text-gray-600">{current.description}</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (!problem) setApplied(window_); }} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
            {windowless ? (
              <p className="text-sm text-gray-600">This report shows work that is open right now, so it has no date range.</p>
            ) : (
              <>
                <Field label="From"><input type="date" value={window_.from} max={today()} onChange={(e) => setWindow({ ...window_, from: e.target.value })} className={fieldInput} /></Field>
                <Field label="To"><input type="date" value={window_.to} max={today()} onChange={(e) => setWindow({ ...window_, to: e.target.value })} className={fieldInput} /></Field>
                <button type="submit" disabled={!!problem} className={primaryButton}>Apply</button>
              </>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" disabled={exportDisabled} onClick={() => download("csv")} className={secondaryButton}>{exporting === "csv" ? "Preparing…" : "Export CSV"}</button>
              <button type="button" disabled={exportDisabled} onClick={() => download("pdf")} className={secondaryButton}>{exporting === "pdf" ? "Preparing…" : "Export PDF"}</button>
            </div>
            {problem && <p role="alert" className="w-full text-sm text-red-700">{problem}</p>}
          </form>
          {!windowless && !problem && dirty && <p className="text-xs text-gray-500">Apply the new dates to update the report. An export always matches what is shown.</p>}
          {exportError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{exportError}</p>}

          <ReportBody reportKey={reportKey} from={applied.from} to={applied.to} />
        </section>
      </div>
    </div>
  );
}
