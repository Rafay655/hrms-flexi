"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator, Database, ListFilter, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { insight360Service } from "@/services/insight360";
import type { Insight360Filter, Insight360Sensitivity, Insight360Sort } from "@/types/insight360";
import { ErrorPanel, LoadingPanel, PageHeader, sourceAreaLabel } from "../../_components/Insight360Ui";
import { ReportFilterBar } from "../../_components/ReportFilterBar";

type AggregationFunction = "count" | "count_distinct" | "sum" | "avg" | "min" | "max";
type Aggregation = { field: string; function: AggregationFunction; alias: string };

function reportKey(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeFilters(filters: Insight360Filter[]): Insight360Filter[] {
  return filters.map((filter) => {
    if (["is_null", "not_null"].includes(filter.operator)) return { field: filter.field, operator: filter.operator };
    if (["in", "not_in", "between"].includes(filter.operator)) {
      return { ...filter, value: String(filter.value ?? "").split(",").map((value) => value.trim()).filter(Boolean) };
    }
    return filter;
  });
}

export default function NewInsight360DefinitionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [category, setCategory] = useState("Custom");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("");
  const [sensitivity, setSensitivity] = useState<Insight360Sensitivity>("internal");
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<Aggregation[]>([]);
  const [filters, setFilters] = useState<Insight360Filter[]>([]);
  const [sorts, setSorts] = useState<Insight360Sort[]>([]);

  const providersQuery = useQuery({ queryKey: ["insight360", "providers"], queryFn: insight360Service.providers });
  const executableProviders = useMemo(() => (providersQuery.data ?? []).filter((item) => item.queryable && item.readiness !== "unavailable"), [providersQuery.data]);
  const activeProvider = provider || executableProviders[0]?.key || "";
  const fieldsQuery = useQuery({ queryKey: ["insight360", "fields", activeProvider], queryFn: () => insight360Service.fields(activeProvider), enabled: Boolean(activeProvider) });
  const fields = (fieldsQuery.data ?? []).filter((field) => field.queryable);
  const dimensionFields = fields.filter((field) => field.kind === "dimension");
  const measureFields = fields.filter((field) => field.kind === "measure" && field.aggregations.length > 0);
  const sortTargets = [
    ...dimensions.map((field) => ({ key: field, label: fields.find((item) => item.key === field)?.label ?? field })),
    ...aggregations.map((item) => ({ key: item.alias, label: item.alias.replaceAll("_", " ") })),
  ];

  const create = useMutation({
    mutationFn: insight360Service.createDefinition,
    onSuccess: (definition) => router.push(`/insight360/definitions/${definition.uuid}`),
  });

  function resetProvider(nextProvider: string) {
    setProvider(nextProvider);
    setDimensions([]);
    setAggregations([]);
    setFilters([]);
    setSorts([]);
  }

  function addAggregation() {
    const field = measureFields[0];
    const fn = (field?.aggregations[0] ?? "count") as AggregationFunction;
    if (!field) return;
    setAggregations((current) => [...current, { field: field.key, function: fn, alias: `${fn}_${field.key}` }]);
  }

  if (providersQuery.isLoading) return <div className="bg-brand-100 p-6"><LoadingPanel label="Loading custom report builder" /></div>;
  if (providersQuery.error) return <div className="bg-brand-100 p-6"><ErrorPanel message="Connected data could not be loaded." /></div>;

  const canSave = Boolean(name.trim() && key && activeProvider && (dimensions.length > 0 || aggregations.length > 0) && !create.isPending);

  return (
    <div className="min-h-full bg-brand-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/insight360/catalogue" className="transition-colors inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Report library</Link>
        <PageHeader eyebrow="Custom report" title="Create a report" description="Choose the information you need, add optional totals and filters, then save the report for your company." />

        <form onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;
          create.mutate({
            report_key: key,
            name: name.trim(),
            description: description.trim() || null,
            category: category.trim(),
            primary_provider: activeProvider,
            sensitivity,
            refresh_tier: "on_demand",
            status: "draft",
            definition: {
              fields: dimensions,
              group_by: aggregations.length > 0 ? dimensions : undefined,
              aggregations: aggregations.map((item) => ({ ...item, alias: item.alias || undefined })),
              filters: normalizeFilters(filters),
              sorts,
            },
          });
        }} className="space-y-6">
          <section className="grid gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <label className="text-sm font-semibold text-gray-800">Report name<input required value={name} onChange={(event) => { setName(event.target.value); setKey(reportKey(event.target.value)); }} className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 px-3 text-base font-normal text-gray-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300" /></label>
            <label className="text-sm font-semibold text-gray-800">Category<input required value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 px-3 text-base font-normal text-gray-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300" /></label>
            <label className="text-sm font-semibold text-gray-800">Who can view it<select value={sensitivity} onChange={(event) => setSensitivity(event.target.value as Insight360Sensitivity)} className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-3 text-base font-normal text-gray-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300"><option value="internal">Company users with report access</option><option value="employee">Employee-data access required</option><option value="pii">Personal-data access required</option><option value="salary">Salary access required</option></select></label>
            <label className="text-sm font-semibold text-gray-800 md:col-span-2">Description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-base font-normal text-gray-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300" /></label>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-brand-100 p-2 text-brand-700"><Database aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="font-semibold text-brand-900">1. Choose data and columns</h2><p className="text-sm text-gray-600">Start with a data area, then choose the columns people should see.</p></div></div>
            <label className="mt-5 block text-sm font-semibold text-gray-800">Data area<select value={activeProvider} onChange={(event) => resetProvider(event.target.value)} className="mt-2 min-h-12 w-full max-w-md rounded-xl border border-gray-300 bg-white px-3 text-base font-normal text-gray-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300">{executableProviders.map((item) => <option key={item.key} value={item.key}>{sourceAreaLabel(item.key, item.label)}</option>)}</select></label>
            <fieldset className="mt-6"><legend className="text-sm font-semibold text-gray-800">Report columns</legend><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{dimensionFields.map((field) => <label key={field.key} className="transition-colors flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 hover:bg-brand-100"><input type="checkbox" checked={dimensions.includes(field.key)} onChange={(event) => { setDimensions((current) => event.target.checked ? [...current, field.key] : current.filter((key) => key !== field.key)); setSorts((current) => current.filter((sort) => sort.field !== field.key)); }} className="h-4 w-4 accent-brand-700" /><span className="text-sm font-semibold text-gray-900">{field.label}</span></label>)}</div></fieldset>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-100 p-2 text-brand-700"><Calculator aria-hidden="true" className="h-5 w-5" /></span><div><h2 className="font-semibold text-brand-900">2. Add totals or calculations</h2><p className="text-sm text-gray-600">Optional: count, total or average selected information.</p></div></div><button type="button" onClick={addAggregation} disabled={measureFields.length === 0 || aggregations.length >= 10} className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-50"><Plus aria-hidden="true" className="h-4 w-4" /> Add calculation</button></div>
            {aggregations.length === 0 ? <p className="mt-5 rounded-xl bg-brand-100 p-4 text-sm text-gray-700">No calculations added. The report will show individual records using the columns selected above.</p> : <div className="mt-5 space-y-3">{aggregations.map((aggregation, index) => {
              const measure = measureFields.find((field) => field.key === aggregation.field) ?? measureFields[0];
              return <div key={`${aggregation.field}-${index}`} className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1fr_1fr_1fr_44px]">
                <label className="text-sm font-medium text-gray-700">Field<select value={aggregation.field} onChange={(event) => { const field = measureFields.find((item) => item.key === event.target.value)!; const fn = field.aggregations[0] as AggregationFunction; setAggregations((current) => current.map((item, itemIndex) => itemIndex === index ? { field: field.key, function: fn, alias: `${fn}_${field.key}` } : item)); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900">{measureFields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
                <label className="text-sm font-medium text-gray-700">Calculation<select value={aggregation.function} onChange={(event) => setAggregations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, function: event.target.value as AggregationFunction, alias: `${event.target.value}_${item.field}` } : item))} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900">{(measure?.aggregations ?? []).map((fn) => <option key={fn} value={fn}>{fn.replaceAll("_", " ")}</option>)}</select></label>
                <label className="text-sm font-medium text-gray-700">Column label<input value={aggregation.alias} onChange={(event) => setAggregations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, alias: reportKey(event.target.value) } : item))} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 px-3 font-mono text-base text-gray-900" /></label>
                <button type="button" onClick={() => setAggregations((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove measure ${index + 1}`} className="transition-colors mt-6 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"><Trash2 aria-hidden="true" className="h-5 w-5" /></button>
              </div>;
            })}</div>}
          </section>

          <ReportFilterBar fields={fields} filters={filters} onChange={setFilters} title="3. Add default filters" description="Optional: choose which records should normally appear whenever this report is run." />

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ListFilter aria-hidden="true" className="h-5 w-5 text-brand-700" /><div><h2 className="font-semibold text-brand-900">4. Choose the order</h2><p className="text-sm text-gray-600">Optional: decide how the report should be sorted.</p></div></div><button type="button" disabled={sortTargets.length === 0 || sorts.length >= 5} onClick={() => setSorts((current) => [...current, { field: sortTargets[0].key, direction: "asc" }])} className="transition-colors inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-50"><Plus aria-hidden="true" className="h-4 w-4" /> Add sort</button></div>
            <div className="mt-4 space-y-3">{sorts.map((sort, index) => <div key={`${sort.field}-${index}`} className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-[1fr_180px_44px]"><select aria-label={`Sort field ${index + 1}`} value={sort.field} onChange={(event) => setSorts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, field: event.target.value } : item))} className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900">{sortTargets.map((target) => <option key={target.key} value={target.key}>{target.label}</option>)}</select><select aria-label={`Sort direction ${index + 1}`} value={sort.direction} onChange={(event) => setSorts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, direction: event.target.value as "asc" | "desc" } : item))} className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900"><option value="asc">Ascending</option><option value="desc">Descending</option></select><button type="button" onClick={() => setSorts((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove sort ${index + 1}`} className="transition-colors flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"><Trash2 aria-hidden="true" className="h-5 w-5" /></button></div>)}</div>
          </section>

          <aside className="rounded-xl border border-brand-300 bg-brand-900 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Report summary</p><p className="mt-2 text-lg font-semibold">{dimensions.length} column{dimensions.length === 1 ? "" : "s"} · {aggregations.length} calculation{aggregations.length === 1 ? "" : "s"} · {filters.length} filter{filters.length === 1 ? "" : "s"} · {sorts.length} sort{sorts.length === 1 ? "" : "s"}</p><p className="mt-1 text-sm text-brand-100">After saving, you can run the report and check the results before sharing or scheduling it.</p></aside>

          {create.error && <ErrorPanel message="The report could not be saved. Check the selected columns, calculations, filters and your data access." />}
          <div className="flex justify-end"><button type="submit" disabled={!canSave} className="transition-colors inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><Save aria-hidden="true" className="h-4 w-4" />{create.isPending ? "Saving…" : "Save report"}</button></div>
        </form>
      </div>
    </div>
  );
}
