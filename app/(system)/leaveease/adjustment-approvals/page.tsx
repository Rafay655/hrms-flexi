"use client";

import React, { useMemo, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  ArrowRight,
  FileText,
  Download,
  Clock,
  X,
  CheckSquare,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Info,
  Briefcase,
} from "lucide-react";

interface AdjustmentApproval {
  id: string;
  employee: string;
  avatar: string;
  dept: string;
  role: string;
  leaveType: string;
  adjType: "Credit" | "Debit";
  amount: number;
  currentBalance: number;
  reason: string;
  requestedBy: string;
  submittedAt: string;
  slaHours: number;
  justification: string;
  attachment?: string;
}

const MOCK_APPROVALS: AdjustmentApproval[] = [
  {
    id: "ADJ-AP-001",
    employee: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    role: "Staff Engineer",
    leaveType: "Annual Leave",
    adjType: "Credit",
    amount: 6.0,
    currentBalance: 10,
    reason: "Joining Bonus",
    requestedBy: "Sarah Admin",
    submittedAt: "2h ago",
    slaHours: 22,
    justification:
      "Contractual joining bonus specifically negotiated during hiring process for Senior Staff role.",
    attachment: "offer_letter_annex_b.pdf",
  },
  {
    id: "ADJ-AP-002",
    employee: "Sara Ahmed",
    avatar: "SM",
    dept: "Product",
    role: "Product Manager",
    leaveType: "Sick Leave",
    adjType: "Credit",
    amount: 10.0,
    currentBalance: 2,
    reason: "Exception Grant",
    requestedBy: "John Manager",
    submittedAt: "5h ago",
    slaHours: 36,
    justification:
      "Special medical grant approved by leadership due to prolonged recovery period following major surgery.",
    attachment: "medical_cert_ext.pdf",
  },
  {
    id: "ADJ-AP-003",
    employee: "Tariq Mehmood",
    avatar: "TC",
    dept: "Engineering",
    role: "DevOps Lead",
    leaveType: "Annual Leave",
    adjType: "Debit",
    amount: 8.0,
    currentBalance: 24,
    reason: "Correction",
    requestedBy: "Sarah Admin",
    submittedAt: "1d ago",
    slaHours: -4,
    justification:
      "Correction of carry-forward error where 2023 balances were doubled in the migration script.",
    attachment: "audit_report_migration.xlsx",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function calculateNewBalance(req: AdjustmentApproval) {
  return req.adjType === "Credit"
    ? req.currentBalance + req.amount
    : Math.max(0, req.currentBalance - req.amount);
}

export default function AdjustmentApprovalPanel() {
  const [requests, setRequests] = useState<AdjustmentApproval[]>(MOCK_APPROVALS);
  const [viewingRequest, setViewingRequest] = useState<AdjustmentApproval | null>(
    null
  );
  const [decisionFeedback, setDecisionFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("All");

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();

    return requests.filter((req) => {
      const haystack = [
        req.id,
        req.employee,
        req.dept,
        req.role,
        req.leaveType,
        req.reason,
        req.requestedBy,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesReason =
        reasonFilter === "All" || req.reason === reasonFilter;

      return matchesSearch && matchesReason;
    });
  }, [requests, search, reasonFilter]);

  const overdueCount = useMemo(
    () => requests.filter((r) => r.slaHours < 0).length,
    [requests]
  );

  const pendingCount = requests.length;

  const handleAction = (id: string, action: "approve" | "reject") => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setViewingRequest(null);
    setDecisionFeedback("");
  };

  const downloadAttachment = (filename?: string) => {
    if (!filename) return;

    const blob = new Blob([`Mock file for ${filename}`], {
      type: "text/plain;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Adjustment Approvals
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Verify large-scale manual balance overrides through enterprise
                  workflow.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Awaiting Authorization
              </p>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Total Pending
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {pendingCount} requests
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Overdue SLA
              </p>
              <p className="mt-2 text-sm font-semibold text-red-600">
                {overdueCount} requests
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Workflow Scope
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                Threshold and exception-based approvals
              </p>
            </div>
          </div>
        </div>

        {/* Listing */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by employee, ID, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
            >
              <option>All</option>
              <option>Joining Bonus</option>
              <option>Exception Grant</option>
              <option>Correction</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">
                {filteredRequests.length}
              </span>
              <span className="text-brand-700"> approval requests</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    SR
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Leave Type
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Impact
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Reason
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Requested By
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CheckSquare className="h-10 w-10 text-brand-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No pending adjustment authorizations
                        </p>
                        <p className="text-sm text-brand-700">
                          All approval requests are currently cleared.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req, index) => (
                    <tr
                      key={req.id}
                      className="transition-colors hover:bg-brand-100"
                    >
                      <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                        {index + 1}
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
                            {req.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-brand-900">
                              {req.employee}
                            </p>
                            <p className="text-[11px] text-brand-700">
                              {req.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-brand-700">
                        {req.leaveType}
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1 font-semibold",
                            req.adjType === "Credit"
                              ? "text-emerald-600"
                              : "text-red-600"
                          )}
                        >
                          {req.adjType === "Credit" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {req.adjType === "Credit"
                            ? `+${req.amount}`
                            : `-${req.amount}`}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm">
                        <div className="inline-flex items-center gap-2 text-brand-700">
                          <span>{req.currentBalance}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-semibold text-brand-900">
                            {calculateNewBalance(req)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          {req.reason}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-sm">
                        <p className="text-brand-900">{req.requestedBy}</p>
                        <p className="text-[11px] text-brand-700">
                          {req.submittedAt}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAction(req.id, "approve")}
                            className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100"
                            title="Quick Approve"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setViewingRequest(req);
                              setDecisionFeedback("");
                            }}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-brand-700 transition hover:bg-brand-100"
                            title="Review Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {viewingRequest && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 m-0 ">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setViewingRequest(null)}
            />

            <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                    <Sliders className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-brand-900">
                      Adjustment Authorization
                    </h3>
                    <p className="mt-0.5 text-sm text-brand-700">
                      System Request: {viewingRequest.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setViewingRequest(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Employee Header */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-800 text-lg font-bold text-white">
                        {viewingRequest.avatar}
                      </div>

                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-brand-900">
                          {viewingRequest.employee}
                        </h4>
                        <p className="text-sm text-brand-700">
                          {viewingRequest.role} · {viewingRequest.dept}
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Requested By
                        </p>
                        <p className="text-sm font-semibold text-brand-900">
                          {viewingRequest.requestedBy}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detail grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Leave Type
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {viewingRequest.leaveType}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-brand-100 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Impact Preview
                        </p>

                        <div className="mt-3 space-y-3">
                          <div className="flex items-center justify-between text-sm text-brand-700">
                            <span>Current Balance</span>
                            <span className="font-semibold">
                              {viewingRequest.currentBalance} Days
                            </span>
                          </div>

                          <div
                            className={cn(
                              "flex items-center justify-between text-sm font-semibold",
                              viewingRequest.adjType === "Credit"
                                ? "text-emerald-600"
                                : "text-red-600"
                            )}
                          >
                            <span>Requested {viewingRequest.adjType}</span>
                            <span>
                              {viewingRequest.adjType === "Credit" ? "+" : "-"}
                              {viewingRequest.amount} Days
                            </span>
                          </div>

                          <div className="h-px bg-gray-200" />

                          <div className="flex items-center justify-between text-base font-semibold text-brand-900">
                            <span>New Balance</span>
                            <span>{calculateNewBalance(viewingRequest)} Days</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Reason Category
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {viewingRequest.reason}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Decision SLA
                        </p>
                        <p
                          className={cn(
                            "mt-1 inline-flex items-center gap-2 text-sm font-semibold",
                            viewingRequest.slaHours < 0
                              ? "text-red-600"
                              : "text-amber-600"
                          )}
                        >
                          <Clock className="h-4 w-4" />
                          {viewingRequest.slaHours < 0
                            ? "Exceeded"
                            : `${viewingRequest.slaHours} hours remaining`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Justification / Auditor Notes
                    </h4>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-6 text-brand-700">
                      “{viewingRequest.justification}”
                    </div>

                    {viewingRequest.attachment && (
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-brand-700" />
                          <span className="text-sm font-medium text-brand-900">
                            {viewingRequest.attachment}
                          </span>
                        </div>

                        <button
                          onClick={() => downloadAttachment(viewingRequest.attachment)}
                          className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comment */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Decision Feedback (Optional)
                    </h4>
                    <textarea
                      value={decisionFeedback}
                      onChange={(e) => setDecisionFeedback(e.target.value)}
                      className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      placeholder="Provide comments for the HR Admin..."
                    />
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                      <p className="text-sm leading-6 text-amber-800/90">
                        This adjustment exceeds the standard threshold of 5 days. Approving this will immediately update the leave ledger and notify the employee of the override.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 bg-white px-6 py-4">
                <button
                  onClick={() => handleAction(viewingRequest.id, "reject")}
                  className="flex-1 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 inline-flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>

                <button
                  onClick={() => handleAction(viewingRequest.id, "approve")}
                  className="flex-[2] rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900 inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Adjustment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Approval Note
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800/90">
                Large balance adjustments should be reviewed carefully against policy, supporting justification, and leave ledger impact before approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}