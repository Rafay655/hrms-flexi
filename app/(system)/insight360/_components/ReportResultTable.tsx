import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Insight360Preview } from "@/types/insight360";

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  return String(value);
}

function formatColumn(column: string): string {
  return column
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ReportResultTable({ preview, onPage, disabled = false }: {
  preview: Insight360Preview;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <section aria-labelledby="preview-results" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div><h2 id="preview-results" className="font-semibold text-brand-900">Report results</h2><p className="mt-1 text-sm text-gray-600">{preview.meta.total} result{preview.meta.total === 1 ? "" : "s"}</p></div>
        <p className="text-xs font-medium text-gray-500">Updated {new Date(preview.run.data_as_of).toLocaleString()}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Insight360 report results</caption>
          <thead className="bg-brand-800 text-white"><tr>{preview.columns.map((column) => <th key={column} className="whitespace-nowrap px-5 py-3.5 font-semibold">{formatColumn(column)}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {preview.rows.map((row, index) => <tr key={index} className="transition-colors hover:bg-brand-100/70">{preview.columns.map((column) => <td key={column} className="whitespace-nowrap px-5 py-3 text-gray-700 tabular-nums">{formatCell(row[column])}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      {preview.rows.length === 0 && <p className="p-10 text-center text-sm text-gray-600">No rows match the current filters.</p>}
      <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
        <p className="text-sm text-gray-600">Page {preview.meta.current_page} of {Math.max(preview.meta.last_page, 1)}</p>
        <div className="flex gap-2">
          <button type="button" disabled={disabled || preview.meta.current_page <= 1} onClick={() => onPage(preview.meta.current_page - 1)} aria-label="Previous result page" className="transition-colors flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-300 text-gray-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
          <button type="button" disabled={disabled || preview.meta.current_page >= preview.meta.last_page} onClick={() => onPage(preview.meta.current_page + 1)} aria-label="Next result page" className="transition-colors flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-300 text-gray-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      </div>
    </section>
  );
}
