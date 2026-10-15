"use client";

/**
 * app/(system)/expense-hub/reports/page.tsx — ExpenseHub reports (§22).
 * Tabs over the report endpoints; rows are rendered generically from their keys.
 */

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ShieldAlert,
  Plane,
  Landmark,
  ClipboardList,
  Loader2,
  Inbox,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { expenseHubService } from "@/services/expense-hub";

type Row = Record<string, unknown>;

const TAB_META = {
  summary: { label: "Summary", icon: ClipboardList },
  budget: { label: "Budget vs Actual", icon: BarChart3 },
  violations: { label: "Policy Violations", icon: ShieldAlert },
  travel: { label: "Travel Spend", icon: Plane },
  reimbursement: { label: "Reimbursement Register", icon: Landmark },
} as const;

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <Inbox className="h-8 w-8 text-gray-300" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      <p className="text-sm text-gray-400">Loading report…</p>
    </div>
  );
}

function GenericTable({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows || rows.length === 0) {
    return <EmptyState message={empty} />;
  }
  const cols = Object.keys(rows[0]);
  const fmt = (v: unknown) =>
    v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            {cols.map((c) => (
              <th key={c} className="whitespace-nowrap px-4 py-3">
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="transition-colors hover:bg-brand-50/50">
              {cols.map((c) => (
                <td key={c} className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">
                  {fmt(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportPanel({
  queryKey,
  queryFn,
  empty,
}: {
  queryKey: string[];
  queryFn: () => Promise<unknown>;
  empty: string;
}) {
  const { data, isLoading, isFetching } = useQuery({ queryKey, queryFn });
  const rows = (Array.isArray(data) ? data : (data as { rows?: Row[] })?.rows ?? []) as Row[];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <span className="text-xs font-medium text-gray-400">
          {isLoading ? "Fetching data…" : `${rows.length} row${rows.length === 1 ? "" : "s"}`}
        </span>
        {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-300" />}
      </div>
      {isLoading ? <LoadingState /> : <GenericTable rows={rows} empty={empty} />}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-brand-50/30 p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div>
          <nav className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-500">
            ExpenseHub · Reports
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900">Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live views over claim status, budgets, policy exceptions, and payouts.
          </p>
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
            {(Object.keys(TAB_META) as (keyof typeof TAB_META)[]).map((key) => {
              const { label, icon: Icon } = TAB_META[key];
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="gap-1.5 rounded-lg border border-transparent px-3 py-2 text-sm text-gray-500 transition-colors data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:text-brand-900 data-[state=active]:shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <ReportPanel
              queryKey={["expense-hub", "report", "summary"]}
              queryFn={() => expenseHubService.reportSummary({ group_by: "status" })}
              empty="No claim data yet."
            />
          </TabsContent>
          <TabsContent value="budget" className="mt-4">
            <ReportPanel
              queryKey={["expense-hub", "report", "budget"]}
              queryFn={() => expenseHubService.reportBudgetVsActual()}
              empty="No budgets configured."
            />
          </TabsContent>
          <TabsContent value="violations" className="mt-4">
            <ReportPanel
              queryKey={["expense-hub", "report", "violations"]}
              queryFn={() => expenseHubService.reportPolicyViolations()}
              empty="No policy violations."
            />
          </TabsContent>
          <TabsContent value="travel" className="mt-4">
            <ReportPanel
              queryKey={["expense-hub", "report", "travel"]}
              queryFn={() => expenseHubService.reportTravelSpend()}
              empty="No travel spend yet."
            />
          </TabsContent>
          <TabsContent value="reimbursement" className="mt-4">
            <ReportPanel
              queryKey={["expense-hub", "report", "reimbursement"]}
              queryFn={() => expenseHubService.reportReimbursementRegister()}
              empty="No reimbursements yet."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}