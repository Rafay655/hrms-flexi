"use client";

/**
 * All loans — search, status filter, indexing, pagination and a View modal.
 * Data: GET /loans/active.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
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
import type { Loan, LoanStatus } from "@/types/loan-hub";

const STATUS_OPTIONS: { value: LoanStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "closed", label: "Closed" },
  { value: "closed_via_ff", label: "Closed (F&F)" },
  { value: "written_off", label: "Written Off" },
];

export default function ActiveLoansList() {
  const router = useRouter();
  const [status, setStatus] = useState<LoanStatus | "all">("all");
  const [viewItem, setViewItem] = useState<Loan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["loan-hub", "loans", status],
    queryFn: () => loanHubService.getLoans(status === "all" ? undefined : { status }),
  });

  const empName = (l: Loan) => l.employee?.code ?? `EMP #${l.employee_id}`;

  const columns: RecordColumn<Loan>[] = [
    { key: "number", header: "Loan", sortValue: (l) => l.loan_number ?? "", searchValue: (l) => `${l.loan_number ?? ""} ${empName(l)}`, render: (l) => (
      <Link href={`/loan-hub/${l.uuid}`} className="font-medium text-brand-900 hover:underline" onClick={(e) => e.stopPropagation()}>{l.loan_number}</Link>
    ) },
    { key: "employee", header: "Employee", searchValue: empName, render: (l) => <span className="text-brand-700">{empName(l)}</span> },
    { key: "type", header: "Type", sortValue: (l) => l.loan_type?.name ?? "", render: (l) => <span className="text-brand-700">{l.loan_type?.name ?? "—"}</span> },
    { key: "principal", header: "Principal", align: "right", sortValue: (l) => num(l.principal_amount), render: (l) => <span className="tabular-nums text-brand-700">{pkr(l.principal_amount)}</span> },
    { key: "outstanding", header: "Outstanding", align: "right", sortValue: (l) => num(l.outstanding_balance), render: (l) => <span className="tabular-nums font-medium text-brand-900">{pkr(l.outstanding_balance)}</span> },
    { key: "installment", header: "Installment", align: "right", sortValue: (l) => num(l.emi_amount), render: (l) => <span className="tabular-nums text-brand-700">{pkr(l.emi_amount)}</span> },
    { key: "status", header: "Status", sortValue: (l) => l.status, render: (l) => <LoanStatusBadge status={l.status} /> },
  ];

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">LoanHub · Loans</nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">All Loans</h1>
      </div>

      <RecordsTable
        columns={columns}
        data={data ?? []}
        rowKey={(l) => l.uuid}
        isLoading={isLoading}
        searchPlaceholder="Search by loan number or employee…"
        emptyTitle="No loans found"
        emptyHint="Loans appear here once applications are approved and disbursed."
        onRowClick={(l) => router.push(`/loan-hub/${l.uuid}`)}
        filters={
          <Select value={status} onValueChange={(v) => setStatus(v as LoanStatus | "all")}>
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
        actions={(l) => (
          <Button variant="ghost" size="sm" onClick={() => setViewItem(l)} className="h-8 w-8 p-0 text-brand-700 hover:bg-brand-100" title="Quick view">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />

      {/* Quick-view modal */}
      <Dialog open={viewItem !== null} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="bg-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-900">
              {viewItem?.loan_number}
              {viewItem && <LoanStatusBadge status={viewItem.status} />}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <V label="Employee" value={empName(viewItem)} />
                <V label="Type" value={viewItem.loan_type?.name ?? "—"} />
                <V label="Principal" value={pkr(viewItem.principal_amount)} />
                <V label="Outstanding" value={pkr(viewItem.outstanding_balance)} />
                <V label="Monthly installment" value={pkr(viewItem.emi_amount)} />
                <V label="Repaid" value={`${viewItem.emis_paid}/${viewItem.total_emis}`} />
              </dl>
              <div className="flex justify-end pt-2">
                <Link href={`/loan-hub/${viewItem.uuid}`}>
                  <Button className="bg-brand-800 text-white hover:bg-brand-900">Open full record</Button>
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
