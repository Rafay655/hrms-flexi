"use client";

/**
 * app/(system)/expense-hub/page.tsx — ExpenseHub dashboard.
 * Data: GET /api/v1/expense-hub/dashboard (role-scoped cards).
 */

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Plane,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { expenseHubService } from "@/services/expense-hub";
import { pkr } from "@/lib/expense-hub";

const QUICK_LINKS = [
  { href: "/expense-hub/claims", label: "Claims", icon: FileText },
  { href: "/expense-hub/approvals", label: "Approvals", icon: CheckCircle2 },
  { href: "/expense-hub/travel", label: "Travel", icon: Plane },
  { href: "/expense-hub/reports", label: "Reports", icon: Wallet },
];

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <p className="mt-3 text-2xl font-semibold leading-none tracking-tight tabular-nums text-brand-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

export default function ExpenseHubDashboard() {
  const { data, isError } = useQuery({
    queryKey: ["expense-hub", "dashboard"],
    queryFn: expenseHubService.dashboard,
    staleTime: 60_000,
  });

  const emp = data?.employee;
  const ops = data?.operations;
  const mgmt = data?.management;

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">ExpenseHub · Dashboard</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Expenses &amp; Travel</h1>
          <p className="text-sm text-gray-500">Claims, approvals, reimbursements and budget at a glance.</p>
        </div>
        <Link
          href="/expense-hub/claims/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <FileText className="h-4 w-4" /> New Claim
        </Link>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load the dashboard. Please refresh.
        </div>
      )}

      {emp && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-brand-900">My expenses</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Kpi icon={FileText} label="My pending claims" value={String(emp.my_pending_claims)} tone="bg-amber-50 text-amber-700" />
            <Kpi icon={Wallet} label="Reimbursed this month" value={pkr(emp.reimbursed_this_month)} tone="bg-green-50 text-green-700" />
            <Kpi icon={Plane} label="Travel advances" value={pkr(emp.travel_advances)} tone="bg-blue-50 text-blue-700" />
          </div>
        </section>
      )}

      {ops && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-brand-900">Operations</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi icon={CheckCircle2} label="Pending approvals" value={String(ops.pending_approvals)} tone="bg-amber-50 text-amber-700" />
            <Kpi icon={ReceiptText} label="Pending verifications" value={String(ops.pending_verifications)} tone="bg-blue-50 text-blue-700" />
            <Kpi icon={Wallet} label="Reimbursement queue" value={String(ops.reimbursement_queue)} tone="bg-indigo-50 text-indigo-700" />
            <Kpi icon={CreditCard} label="Over-policy claims" value={String(ops.over_policy_claims)} tone="bg-red-50 text-red-700" />
            <Kpi icon={CheckCircle2} label="Reimbursed (month)" value={pkr(ops.reimbursed_total_month)} tone="bg-green-50 text-green-700" />
          </div>
        </section>
      )}

      {mgmt && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-semibold text-brand-900">Committed spend</h2>
          <p className="text-3xl font-semibold tabular-nums text-brand-900">{pkr(mgmt.committed_spend_pkr)}</p>
          {mgmt.spend_by_department.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {mgmt.spend_by_department.map((d) => (
                <li key={d.department_id ?? "none"} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Department #{d.department_id ?? "—"}</span>
                  <span className="font-medium tabular-nums text-brand-900">{pkr(d.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-brand-900 shadow-xs transition-colors hover:border-brand-200"
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-brand-600" /> {label}
            </span>
            <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-brand-600" />
          </Link>
        ))}
      </section>
    </div>
  );
}
