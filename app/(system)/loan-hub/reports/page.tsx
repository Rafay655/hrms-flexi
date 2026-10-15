"use client";

/**
 * Reports — selector over the §9 report endpoints with a generic table renderer
 * and a recovery-schedule bar chart. Data: GET /loans/reports/*.
 */

import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Download } from "lucide-react";
import { loanHubService } from "@/services/loan-hub";
import { num, pkr } from "@/lib/loan-hub";

type Row = Record<string, string | number | null>;

const REPORTS: Array<{ key: string; label: string }> = [
  { key: "portfolio-summary", label: "Portfolio Summary" },
  { key: "aging", label: "Aging Analysis" },
  { key: "disbursement", label: "Disbursement Register" },
  { key: "default-risk", label: "Default Risk" },
  { key: "department-analysis", label: "Department Analysis" },
  { key: "recovery-schedule", label: "Recovery Schedule (12 mo)" },
  { key: "closure-summary", label: "Closure Summary" },
  { key: "interest-income", label: "Interest Income" },
  { key: "perquisite-tax", label: "FBR Perquisite Tax" },
  { key: "guarantor-exposure", label: "Guarantor Exposure" },
  { key: "monthly-recovery", label: "Actual vs Expected Recovery" },
];

const MONEY_KEYS = new Set([
  "outstanding", "avg_emi", "principal_amount", "overdue_amount", "shortfall_total",
  "expected_recovery", "principal", "interest_paid", "total_principal", "total_interest",
  "total_exposure", "expected", "actual", "loan_amount",
]);

function humanize(k: string): string {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Helper to safely format values for Tooltip ──────
const formatTooltipValue = (value: unknown): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return pkr(isNaN(num) ? 0 : num);
};

export default function LoanReports() {
  const [report, setReport] = useState("portfolio-summary");
  const [exporting, setExporting] = useState<"csv" | "xlsx" | "pdf" | null>(null);

  const exportAs = async (format: "csv" | "xlsx" | "pdf") => {
    setExporting(format);
    try {
      await loanHubService.downloadReport(report, format);
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Export failed." });
    } finally {
      setExporting(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["loan-hub", "report", report],
    queryFn: () => loanHubService.report<Row[]>(report),
  });

  const rows = Array.isArray(data) ? data : [];
  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">LoanHub · Reports</nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Reports &amp; Analytics</h1>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <div className="flex flex-wrap gap-2">
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setReport(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                report === r.key ? "bg-brand-800 text-white" : "bg-white text-gray-600 ring-1 ring-gray-100 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => exportAs("csv")}
            disabled={exporting !== null || rows.length === 0}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> {exporting === "csv" ? "Exporting…" : "CSV"}
          </button>
          <button
            onClick={() => exportAs("xlsx")}
            disabled={exporting !== null || rows.length === 0}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> {exporting === "xlsx" ? "Exporting…" : "Excel"}
          </button>
          <button
            onClick={() => exportAs("pdf")}
            disabled={exporting !== null || rows.length === 0}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> {exporting === "pdf" ? "Exporting…" : "PDF"}
          </button>
        </div>
      </div>

      {report === "recovery-schedule" && rows.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Expected Recovery — next 12 months</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows as Array<{ month: string; expected_recovery: number }>}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={formatTooltipValue} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="expected_recovery" fill="#322E53" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-50" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-gray-400">No data for this report.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  {columns.map((c) => (
                    <th key={c} className={`px-4 py-2.5 font-medium ${MONEY_KEYS.has(c) ? "text-right" : ""}`}>
                      {humanize(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-brand-100/30">
                    {columns.map((c) => (
                      <td key={c} className={`px-4 py-2.5 ${MONEY_KEYS.has(c) ? "text-right tabular-nums text-gray-800" : "text-gray-600"}`}>
                        {row[c] == null ? "—" : MONEY_KEYS.has(c) ? pkr(num(row[c])) : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}