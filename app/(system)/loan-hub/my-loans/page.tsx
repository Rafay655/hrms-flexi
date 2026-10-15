"use client";

/**
 * ESS — My Loans: the employee's own loans + applications. Data: GET /loans/my.
 */

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import { loanHubService } from "@/services/loan-hub";
import { num, pkr } from "@/lib/loan-hub";
import { LoanStatusBadge } from "@/components/loan-hub/LoanStatusBadge";

export default function MyLoans() {
  const { data, isLoading } = useQuery({
    queryKey: ["loan-hub", "my"],
    queryFn: loanHubService.getMine,
  });

  const loans = data?.loans ?? [];
  const applications = data?.applications ?? [];
  const totalOutstanding = loans.reduce((s, l) => s + num(l.outstanding_balance), 0);

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">LoanHub · My Loans</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">My Loans &amp; Advances</h1>
          <p className="text-sm text-gray-500">Total outstanding: <span className="font-semibold tabular-nums text-gray-700">{pkr(totalOutstanding)}</span></p>
        </div>
        <Link href="/loan-hub/apply" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> Apply
        </Link>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/60" />
      ) : (
        <>
          <Section title="Active &amp; Closed Loans">
            {loans.length === 0 ? (
              <Empty text="You have no loans yet." />
            ) : (
              loans.map((l) => (
                <Link key={l.uuid} href={`/loan-hub/${l.uuid}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-brand-100/40">
                  <span className="flex-1 font-medium text-brand-900">{l.loan_number}</span>
                  <span className="text-xs text-gray-400">{l.loan_type?.name}</span>
                  <span className="text-sm tabular-nums text-gray-700">{pkr(l.outstanding_balance)}</span>
                  <LoanStatusBadge status={l.status} />
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                </Link>
              ))
            )}
          </Section>

          <Section title="My Applications">
            {applications.length === 0 ? (
              <Empty text="No applications yet." />
            ) : (
              applications.map((a) => (
                <Link key={a.uuid} href={`/loan-hub/applications/${a.uuid}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-brand-100/40">
                  <span className="flex-1 font-medium text-brand-900">{a.application_number ?? "Draft"}</span>
                  <span className="text-xs text-gray-400">{a.loan_type?.name}</span>
                  <span className="text-sm tabular-nums text-gray-700">{pkr(a.requested_amount)}</span>
                  <LoanStatusBadge status={a.status} kind="application" />
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                </Link>
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-800" dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-10 text-center text-sm text-gray-400">{text}</p>;
}
