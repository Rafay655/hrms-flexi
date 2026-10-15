"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { Database, ShieldCheck } from "lucide-react";
import { insight360Service } from "@/services/insight360";
import { ErrorPanel, LoadingPanel, PageHeader, ReadinessBadge, sourceAreaLabel } from "../_components/Insight360Ui";

const sourceDescriptions: Record<string, string> = {
  people_hub: "Employee profiles, employment status and workforce movement",
  flexi_hq: "Company structure, departments and reporting lines",
  flexi_meta: "Shared reference lists used across HR records",
  time_sync: "Attendance, shifts, working hours and timesheets",
  leave_ease: "Leave requests, balances, holidays and approvals",
  pay_edge: "Payroll summaries available to authorised users",
  catalogue_wave: "Ready-to-use report collections",
};

const capabilityLabels: Record<string, string> = {
  dimensions: "Report columns",
  filters: "Filters",
  counts: "Totals",
  "date-bucketing": "Date trends",
  hierarchy: "Organisation structure",
  "reference-data": "Reference lists",
  aggregates: "Summaries",
};

export default function Insight360SourcesPage() {
  const providersQuery = useQuery({ queryKey: ["insight360", "providers"], queryFn: insight360Service.providers });
  const providers = providersQuery.data ?? [];
  const fieldQueries = useQueries({ queries: providers.map((provider) => ({ queryKey: ["insight360", "fields", provider.key], queryFn: () => insight360Service.fields(provider.key) })) });

  if (providersQuery.isLoading) return <div className="bg-brand-100 p-6"><LoadingPanel label="Loading data sources" /></div>;
  if (providersQuery.error) return <div className="bg-brand-100 p-6"><ErrorPanel message="Connected data could not be loaded." /></div>;

  return (
    <div className="min-h-full bg-brand-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader eyebrow="Insight360" title="Connected data" description="See which Flexi HRMS areas are available in reports and whether any access is limited." />
        <section className="grid gap-5 lg:grid-cols-3">
          {providers.map((provider, index) => {
            const fields = fieldQueries[index]?.data ?? [];
            return (
              <article key={provider.key} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4"><span className="rounded-xl bg-brand-100 p-3 text-brand-700"><Database aria-hidden="true" className="h-6 w-6" /></span><ReadinessBadge value={provider.readiness} /></div>
                <h2 className="mt-5 text-xl font-semibold text-brand-900">{sourceAreaLabel(provider.key, provider.label)}</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">{sourceDescriptions[provider.key] ?? "Business data available for reporting"}</p>
                <div className="mt-5 flex flex-wrap gap-2">{provider.capabilities.map((capability) => <span key={capability} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{capabilityLabels[capability] ?? capability.replaceAll("-", " ")}</span>)}</div>
                <div className="mt-6 border-t border-gray-100 pt-5"><div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-brand-700" /> Report fields</div><p className="mt-2 text-sm leading-6 text-gray-600">{fieldQueries[index]?.isLoading ? "Checking your access…" : `${fields.length} of ${provider.field_count} fields are available to you.`}</p></div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
