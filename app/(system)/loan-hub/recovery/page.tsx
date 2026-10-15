"use client";

/**
 * Recovery monitor — this month's recovery summary, the actual-vs-expected trend,
 * and the default-risk exceptions. Data: /loans/dashboard + /loans/reports/*.
 */

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { loanHubService } from "@/services/loan-hub";
import { pkr } from "@/lib/loan-hub";
import { RecoverySummaryCard } from "@/components/loan-hub/RecoverySummaryCard";

type MonthlyRow = { month: string; expected: number; actual: number; recovery_pct: number | null };
type DefaultRow = { loan_number: string; employee_id: number; missed_count: number; shortfall_total: number };

// ── Helper to safely format values for Tooltip ──────
const formatTooltipValue = (value: unknown): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return pkr(isNaN(num) ? 0 : num);
};

export default function RecoveryMonitor() {
  const dashboard = useQuery({ queryKey: ["loan-hub", "dashboard"], queryFn: loanHubService.dashboard });
  const monthly = useQuery({ queryKey: ["loan-hub", "report", "monthly-recovery"], queryFn: () => loanHubService.report<MonthlyRow[]>("monthly-recovery") });
  const defaults = useQuery({ queryKey: ["loan-hub", "report", "default-risk"], queryFn: () => loanHubService.report<DefaultRow[]>("default-risk") });

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">LoanHub · Recovery</nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Monthly Recovery</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {dashboard.data && (
            <RecoverySummaryCard expected={dashboard.data.recovery_this_month.expected} actual={dashboard.data.recovery_this_month.actual} />
          )}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Actual vs Expected — last 6 months</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={formatTooltipValue} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="expected" name="Expected" fill="#EEC293" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Collected" fill="#322E53" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Default Risk — loans with missed installments</h2>
        </div>
        {defaults.isLoading ? (
          <div className="space-y-2 p-5">{[...Array(4)].map((_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-50" />)}</div>
        ) : (defaults.data ?? []).length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">No missed installments — recovery is on track.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-2.5 font-medium">Loan</th>
                <th className="px-4 py-2.5 font-medium">Employee</th>
                <th className="px-4 py-2.5 text-right font-medium">Missed</th>
                <th className="px-4 py-2.5 text-right font-medium">Shortfall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(defaults.data ?? []).map((d) => (
                <tr key={d.loan_number} className="hover:bg-brand-100/30">
                  <td className="px-4 py-2.5 font-medium text-brand-900">{d.loan_number}</td>
                  <td className="px-4 py-2.5 text-gray-600">EMP #{d.employee_id}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-red-600">{d.missed_count}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-gray-800">{pkr(d.shortfall_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}