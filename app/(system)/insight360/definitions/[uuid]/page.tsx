"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Clock3, Copy, ExternalLink, Filter, RefreshCw, Share2, Table2 } from "lucide-react";
import { insight360Service } from "@/services/insight360";
import { useAppSelector } from "@/store/hooks";
import type { Insight360Filter } from "@/types/insight360";
import { ErrorPanel, LoadingPanel, refreshCadenceLabel, reportDescription, reportDisplayName } from "../../_components/Insight360Ui";
import { ReportFilterBar } from "../../_components/ReportFilterBar";
import { ReportResultTable } from "../../_components/ReportResultTable";
import { canVisualizePreview, ReportResultVisualization } from "../../_components/ReportResultVisualization";
import { ReportDeliveryPanel } from "../../_components/ReportDeliveryPanel";

function normalizeFilters(filters: Insight360Filter[]): Insight360Filter[] {
  return filters.map((filter) => {
    if (["is_null", "not_null"].includes(filter.operator)) return { field: filter.field, operator: filter.operator };
    if (["in", "not_in", "between"].includes(filter.operator)) return { ...filter, value: String(filter.value ?? "").split(",").map((value) => value.trim()).filter(Boolean) };
    return filter;
  });
}

export default function Insight360DefinitionPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [filters, setFilters] = useState<Insight360Filter[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Insight360Filter[]>([]);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"visual" | "table">("visual");
  const [shareEmail, setShareEmail] = useState("");
  const [shareCanExport, setShareCanExport] = useState(false);
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canShareExternally = permissions.includes("insight360.share.external");
  const definitionQuery = useQuery({ queryKey: ["insight360", "definition", uuid], queryFn: () => insight360Service.definition(uuid) });
  const definition = definitionQuery.data;
  const fieldsQuery = useQuery({ queryKey: ["insight360", "fields", definition?.primary_provider], queryFn: () => insight360Service.fields(definition!.primary_provider), enabled: Boolean(definition?.primary_provider) });
  const previewQuery = useQuery({
    queryKey: ["insight360", "preview", uuid, page, appliedFilters],
    queryFn: () => insight360Service.preview(uuid, { page, per_page: 25, filters: appliedFilters }),
    enabled: Boolean(definition),
  });
  const externalShare = useMutation({ mutationFn: () => insight360Service.shareExternally(uuid, { email: shareEmail.trim() || undefined, can_export: shareCanExport }) });
  const preview = previewQuery.data;
  const canVisualize = preview ? canVisualizePreview(preview) : false;
  const effectiveView = view === "visual" && !canVisualize ? "table" : view;
  const hasDraftChanges = useMemo(() => JSON.stringify(normalizeFilters(filters)) !== JSON.stringify(appliedFilters), [filters, appliedFilters]);

  function applyFilters() {
    const next = normalizeFilters(filters);
    setAppliedFilters(next);
    setPage(1);
    setFiltersOpen(false);
    if (!hasDraftChanges && page === 1) previewQuery.refetch();
  }

  if (definitionQuery.isLoading) return <div className="min-h-full bg-brand-100 p-6"><LoadingPanel label="Opening report" /></div>;
  if (definitionQuery.error || !definition) return <div className="min-h-full bg-brand-100 p-6"><ErrorPanel message="This report was not found or you do not have access to it." /></div>;

  return (
    <div className="min-h-full bg-brand-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <Link href="/insight360/catalogue" className="transition-colors inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-brand-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> All reports</Link>

        <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl"><p className="text-sm font-semibold text-brand-700">{definition.category}</p><h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">{reportDisplayName(definition.name)}</h1><p className="mt-2 text-base leading-7 text-gray-600">{reportDescription(definition.name, definition.description)}</p><div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500"><span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" className="h-4 w-4" />Updates {refreshCadenceLabel(definition.refresh_tier).toLowerCase()}</span>{preview && <><span>{preview.meta.total.toLocaleString()} result{preview.meta.total === 1 ? "" : "s"}</span><span>Data as of {new Date(preview.run.data_as_of).toLocaleString()}</span></>}</div></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setFiltersOpen((open) => !open)} className={`transition-colors inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${filtersOpen || filters.length > 0 ? "border-brand-300 bg-brand-100 text-brand-900" : "border-gray-300 bg-white text-brand-800 hover:bg-brand-100"}`}><Filter aria-hidden="true" className="h-4 w-4" />Filters{filters.length > 0 ? ` (${filters.length})` : ""}</button><button type="button" onClick={() => previewQuery.refetch()} disabled={previewQuery.isFetching} className="transition-colors inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-60"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${previewQuery.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />{previewQuery.isFetching ? "Refreshing…" : "Refresh data"}</button></div>
          </div>
        </header>

        {filtersOpen && (
          <div className="space-y-3">
            <ReportFilterBar fields={fieldsQuery.data ?? []} filters={filters} onChange={setFilters} disabled={previewQuery.isFetching} title="Choose filters" description="Narrow the report to the records you need, then apply your changes." />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => { setFilters(appliedFilters); setFiltersOpen(false); }} className="transition-colors min-h-11 rounded-xl px-4 text-sm font-semibold text-gray-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Cancel</button><button type="button" onClick={applyFilters} disabled={previewQuery.isFetching} className="transition-colors min-h-11 rounded-xl bg-brand-800 px-5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-50">Apply filters</button></div>
          </div>
        )}

        {preview && <ReportDeliveryPanel reportUuid={uuid} filters={appliedFilters} />}

        {canShareExternally && preview && (
          <details className="group rounded-xl border border-gray-200 bg-white shadow-sm">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700"><Share2 aria-hidden="true" className="h-4 w-4" />Share outside Flexi HRMS <span className="ml-auto text-xs font-normal text-gray-500 group-open:hidden">For eligible summary reports</span></summary>
            <div className="border-t border-gray-200 p-4 sm:p-5"><p className="max-w-3xl text-sm leading-6 text-gray-600">Create a seven-day public link. Employee-level, salary, and personally identifiable reports are always blocked.</p><form onSubmit={(event) => { event.preventDefault(); externalShare.mutate(); }} className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end"><label className="flex-1 text-sm font-semibold text-gray-800">Recipient email (optional)<input type="email" value={shareEmail} onChange={(event) => setShareEmail(event.target.value)} placeholder="partner@example.com" className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 px-3 text-base font-normal outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-300" /></label><label className="flex min-h-11 items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={shareCanExport} onChange={(event) => setShareCanExport(event.target.checked)} className="h-4 w-4 accent-brand-700" />Allow CSV download</label><button type="submit" disabled={externalShare.isPending} className="transition-colors inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-50"><ExternalLink aria-hidden="true" className="h-4 w-4" />{externalShare.isPending ? "Creating…" : "Create link"}</button></form>{externalShare.error && <p role="alert" className="mt-3 text-sm text-rose-700">This report cannot be shared publicly, or the link could not be created.</p>}{externalShare.data && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-sm font-semibold text-emerald-900">Public link created · expires {new Date(externalShare.data.expires_at).toLocaleString()}</p><div className="mt-2 flex gap-2"><input aria-label="Public report link" readOnly value={externalShare.data.public_url} className="min-h-10 min-w-0 flex-1 rounded-lg border border-emerald-300 bg-white px-3 text-sm" /><button type="button" onClick={() => navigator.clipboard.writeText(externalShare.data.public_url)} className="transition-colors inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-400 bg-white px-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><Copy aria-hidden="true" className="h-4 w-4" />Copy</button></div></div>}</div>
          </details>
        )}

        {previewQuery.isLoading ? <LoadingPanel label="Running the latest report" /> : previewQuery.error ? <ErrorPanel message="The report could not run. Check your data access and try again." /> : preview ? (
          <section aria-labelledby="report-output-title" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="report-output-title" className="text-xl font-semibold text-brand-900">Report output</h2><p className="mt-1 text-sm text-gray-600">Switch between a visual summary and the complete data table.</p></div><div className="inline-flex self-start rounded-xl border border-gray-300 bg-white p-1" role="group" aria-label="Report view"><button type="button" onClick={() => setView("visual")} disabled={!canVisualize} aria-pressed={effectiveView === "visual"} className={`transition-colors inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-40 ${effectiveView === "visual" ? "bg-brand-800 text-white" : "text-gray-700 hover:bg-brand-100"}`}><BarChart3 aria-hidden="true" className="h-4 w-4" />Visual</button><button type="button" onClick={() => setView("table")} aria-pressed={effectiveView === "table"} className={`transition-colors inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${effectiveView === "table" ? "bg-brand-800 text-white" : "text-gray-700 hover:bg-brand-100"}`}><Table2 aria-hidden="true" className="h-4 w-4" />Table</button></div></div>
            {effectiveView === "visual" ? <ReportResultVisualization preview={preview} /> : <ReportResultTable preview={preview} onPage={setPage} disabled={previewQuery.isFetching} />}
          </section>
        ) : null}
      </div>
    </div>
  );
}
