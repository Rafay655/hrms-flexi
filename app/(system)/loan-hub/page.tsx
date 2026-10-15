"use client";


import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Banknote, FileText, Layers, Wallet } from "lucide-react";
import { loanHubService } from "@/services/loan-hub";
import { pkr } from "@/lib/loan-hub";
import { LoanPortfolioChart } from "@/components/loan-hub/LoanPortfolioChart";
import { RecoverySummaryCard } from "@/components/loan-hub/RecoverySummaryCard";

const QUICK_LINKS = [
  { href: "/loan-hub/applications", label: "Applications", icon: FileText },
  { href: "/loan-hub/active", label: "Active Loans", icon: Wallet },
  { href: "/loan-hub/recovery", label: "Recovery", icon: Banknote },
  { href: "/loan-hub/reports", label: "Reports", icon: Layers },
];

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
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

export default function LoanHubDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["loan-hub", "dashboard"],
    queryFn: loanHubService.dashboard,
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">LoanHub · Dashboard</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Loan Portfolio</h1>
          <p className="text-sm text-gray-500">Outstanding loans, recovery and exceptions at a glance.</p>
        </div>
        <Link
          href="/loan-hub/applications/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <FileText className="h-4 w-4" /> New Application
        </Link>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load the dashboard. Please refresh.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading || !data ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-[116px] animate-pulse rounded-2xl bg-white/60" />)
        ) : (
          <>
            <Kpi icon={Wallet} label="Active Loans" value={data.active_count.toLocaleString()} tone="bg-brand-800 text-white" />
            <Kpi icon={Banknote} label="Total Outstanding" value={pkr(data.total_outstanding)} tone="bg-emerald-500 text-white" />
            <Kpi icon={Layers} label="Average Installment" value={pkr(data.avg_emi)} tone="bg-[#EEC293] text-brand-900" />
            <Kpi
              icon={AlertTriangle}
              label="In Default"
              value={data.default_count.toLocaleString()}
              tone={data.default_count > 0 ? "bg-[#D9694F] text-white" : "bg-slate-400 text-white"}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Outstanding by Type</h2>
          {data ? <LoanPortfolioChart data={data.outstanding_by_type} /> : <div className="h-[200px]" />}
        </div>
        <div className="lg:col-span-2">
          {data && <RecoverySummaryCard expected={data.recovery_this_month.expected} actual={data.recovery_this_month.actual} />}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xs lg:col-span-2">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Upcoming Closures (next 3 months)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data && data.upcoming_closures.length > 0 ? (
              data.upcoming_closures.map((l) => (
                <Link
                  key={l.uuid}
                  href={`/loan-hub/${l.uuid}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-brand-100/40"
                >
                  <span className="flex-1 text-sm font-medium text-brand-900">{l.loan_number}</span>
                  <span className="text-xs text-gray-400">EMP #{l.employee_id}</span>
                  <span className="text-sm tabular-nums text-gray-700">{pkr(l.outstanding_balance)}</span>
                  <span className="hidden w-24 text-right text-xs tabular-nums text-gray-400 sm:block">
                    {l.expected_closure_date}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                </Link>
              ))
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-400">No loans closing soon.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Quick Links</h2>
          <div className="flex flex-col gap-1">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-brand-100/50 hover:text-brand-900"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-white group-hover:text-brand-700">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 font-medium">{label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
