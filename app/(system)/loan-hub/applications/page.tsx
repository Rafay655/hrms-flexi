"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecordsTable, type RecordColumn } from "@/components/loan-hub/RecordsTable";
import { LoanStatusBadge } from "@/components/loan-hub/LoanStatusBadge";
import { loanHubService } from "@/services/loan-hub";
import { num, pkr } from "@/lib/loan-hub";
import type { ApplicationStatus, LoanApplication } from "@/types/loan-hub";

type Tab = "all" | "pending";

const STATUS_OPTIONS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "pending_l1", label: "Pending L1" },
  { value: "pending_l2", label: "Pending L2" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function LoanApplicationsList() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [viewItem, setViewItem] = useState<LoanApplication | null>(null);

  const all = useQuery({ queryKey: ["loan-hub", "applications"], queryFn: () => loanHubService.getApplications(), enabled: tab === "all" });
  const pending = useQuery({ queryKey: ["loan-hub", "approvals", "pending"], queryFn: loanHubService.getPendingApprovals, enabled: tab === "pending" });

  const source = tab === "all" ? all.data ?? [] : pending.data ?? [];
  const loading = tab === "all" ? all.isLoading : pending.isLoading;

  const data = useMemo(
    () => (status === "all" ? source : source.filter((a) => a.status === status)),
    [source, status],
  );

  const empName = (a: LoanApplication) => a.employee?.code ?? `EMP #${a.employee_id}`;

  const columns: RecordColumn<LoanApplication>[] = [
    { key: "number", header: "Application", sortValue: (a) => a.application_number ?? "", searchValue: (a) => `${a.application_number ?? "draft"} ${empName(a)}`, render: (a) => (
      <Link href={`/loan-hub/applications/${a.uuid}`} className="font-medium text-brand-900 hover:underline" onClick={(e) => e.stopPropagation()}>
        {a.application_number ?? "Draft"}
      </Link>
    ) },
    { key: "employee", header: "Employee", searchValue: empName, render: (a) => <span className="text-brand-700">{empName(a)}</span> },
    { key: "type", header: "Type", sortValue: (a) => a.loan_type?.name ?? "", render: (a) => <span className="text-brand-700">{a.loan_type?.name ?? "—"}</span> },
    { key: "amount", header: "Requested", align: "right", sortValue: (a) => num(a.requested_amount), render: (a) => <span className="tabular-nums text-brand-900">{pkr(a.requested_amount)}</span> },
    { key: "status", header: "Status", sortValue: (a) => a.status, render: (a) => <LoanStatusBadge status={a.status} kind="application" /> },
  ];

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">LoanHub · Applications</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Loan Applications</h1>
        </div>
        <Link href="/loan-hub/applications/new">
          <Button className="gap-1.5 bg-brand-800 text-white hover:bg-brand-900">
            <FileText className="h-4 w-4" /> New Application
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-xs">
        {(["all", "pending"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === t ? "bg-brand-800 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {t === "all" ? <FileText className="h-4 w-4" /> : <Inbox className="h-4 w-4" />}
            {t === "all" ? "All Applications" : "My Approvals"}
          </button>
        ))}
      </div>

      <RecordsTable
        columns={columns}
        data={data}
        rowKey={(a) => a.uuid}
        isLoading={loading}
        searchPlaceholder="Search by application no. or employee…"
        emptyTitle={tab === "pending" ? "Nothing to approve" : "No applications"}
        emptyHint={tab === "pending" ? "Applications awaiting your decision appear here." : "Create the first application."}
        onRowClick={(a) => router.push(`/loan-hub/applications/${a.uuid}`)}
        filters={
          <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus | "all")}>
            <SelectTrigger className="w-[170px] border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={(a) => (
          <Button variant="ghost" size="sm" onClick={() => setViewItem(a)} className="h-8 w-8 p-0 text-brand-700 hover:bg-brand-100" title="Quick view">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />

      {/* Quick-view modal */}
      <Dialog open={viewItem !== null} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-900">
              {viewItem?.application_number ?? "Draft"}
              {viewItem && <LoanStatusBadge status={viewItem.status} kind="application" />}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <V label="Employee" value={empName(viewItem)} />
                <V label="Type" value={viewItem.loan_type?.name ?? "—"} />
                <V label="Requested" value={pkr(viewItem.requested_amount)} />
                <V label="Tenure" value={`${viewItem.requested_tenure_months} mo`} />
                <V label="Purpose" value={viewItem.purpose} />
                {viewItem.approved_amount != null && <V label="Approved" value={pkr(viewItem.approved_amount)} />}
              </dl>
              <div className="flex justify-end pt-2">
                <Link href={`/loan-hub/applications/${viewItem.uuid}`}>
                  <Button className="bg-brand-800 text-white hover:bg-brand-900">Open full application</Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function V({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="font-medium capitalize text-brand-900">{value}</dd>
    </div>
  );
}
