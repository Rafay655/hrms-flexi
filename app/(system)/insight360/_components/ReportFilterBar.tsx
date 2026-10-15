"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Insight360Field, Insight360Filter } from "@/types/insight360";

const operatorLabels: Record<string, string> = {
  eq: "Equals",
  neq: "Does not equal",
  in: "In list",
  not_in: "Not in list",
  gt: "Greater than",
  gte: "At least",
  lt: "Less than",
  lte: "At most",
  before: "Before",
  after: "After",
  between: "Between",
  contains: "Contains",
  is_null: "Is empty",
  not_null: "Is not empty",
};

export function ReportFilterBar({ fields, filters, onChange, disabled = false, title = "Refine this report", description = "Add filters to narrow the results. Your saved report will not be changed." }: {
  fields: Insight360Field[];
  filters: Insight360Filter[];
  onChange: (filters: Insight360Filter[]) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
}) {
  const filterable = fields.filter((field) => field.queryable && field.operators.length > 0);

  function addFilter() {
    const field = filterable[0];
    if (!field) return;
    onChange([...filters, { field: field.key, operator: field.operators[0], value: "" }]);
  }

  function updateFilter(index: number, patch: Partial<Insight360Filter>) {
    const next = filters.map((filter, itemIndex) => itemIndex === index ? { ...filter, ...patch } : filter);
    onChange(next);
  }

  return (
    <section aria-labelledby="runtime-filters" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="runtime-filters" className="font-semibold text-brand-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <button type="button" onClick={addFilter} disabled={disabled || filterable.length === 0} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus aria-hidden="true" className="h-4 w-4" /> Add filter
        </button>
      </div>

      {filters.length === 0 ? (
        <p className="mt-5 rounded-xl bg-brand-100 p-4 text-sm text-gray-700">No filters added. The report will include all records you are allowed to view.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {filters.map((filter, index) => {
            const selected = fields.find((field) => field.key === filter.field) ?? filterable[0];
            const noValue = ["is_null", "not_null"].includes(filter.operator);
            return (
              <div key={`${filter.field}-${index}`} className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1fr_1fr_1.2fr_44px]">
                <label className="text-sm font-medium text-gray-700">Field
                  <select value={filter.field} disabled={disabled} onChange={(event) => {
                    const nextField = fields.find((field) => field.key === event.target.value);
                    updateFilter(index, { field: event.target.value, operator: nextField?.operators[0] ?? "eq", value: "" });
                  }} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300">
                    {filterable.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">Condition
                  <select value={filter.operator} disabled={disabled} onChange={(event) => updateFilter(index, { operator: event.target.value, value: "" })} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300">
                    {(selected?.operators ?? []).map((operator) => <option key={operator} value={operator}>{operatorLabels[operator] ?? operator}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">Value
                  <input value={String(filter.value ?? "")} disabled={disabled || noValue} onChange={(event) => updateFilter(index, { value: event.target.value })} placeholder={["in", "not_in", "between"].includes(filter.operator) ? "Comma-separated values" : "Enter a value"} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 px-3 text-base text-gray-900 placeholder:text-gray-500 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:bg-gray-100" />
                </label>
                <button type="button" onClick={() => onChange(filters.filter((_, itemIndex) => itemIndex !== index))} disabled={disabled} aria-label={`Remove filter ${index + 1}`} className="mt-6 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:cursor-not-allowed disabled:opacity-50">
                  <Trash2 aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
