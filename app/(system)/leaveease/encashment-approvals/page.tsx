"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  DollarSign,
  Wallet,
  Calculator,
  Clock,
  ShieldCheck,
  Eye,
  X,
  Info,
  CheckSquare,
  Search,
  Download,
} from "lucide-react";

interface EncashmentApprovalRequest {
  id: string;
  employee: string;
  avatar: string;
  dept: string;
  type: string;
  days: number;
  rate: number;
  amount: number;
  currentBalance: number;
  submitted: string;
  slaHours: number;
  payGrade: string;
}

const MOCK_PENDING_ENCASHMENTS: EncashmentApprovalRequest[] = [
  {
    id: "ENC-4001",
    employee: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    type: "Annual Leave",
    days: 5,
    rate: 5000,
    amount: 25000,
    currentBalance: 14,
    submitted: "2h ago",
    slaHours: 18,
    payGrade: "L3",
  },
  {
    id: "ENC-4002",
    employee: "Sara Ahmed",
    avatar: "SM",
    dept: "Product",
    type: "Annual Leave",
    days: 10,
    rate: 6500,
    amount: 65000,
    currentBalance: 22,
    submitted: "5h ago",
    slaHours: 42,
    payGrade: "M1",
  },
  {
    id: "ENC-4003",
    employee: "Tariq Mehmood",
    avatar: "TC",
    dept: "Engineering",
    type: "Comp-Off",
    days: 2,
    rate: 4800,
    amount: 9600,
    currentBalance: 3,
    submitted: "1d ago",
    slaHours: -2,
    payGrade: "L2",
  },
  {
    id: "ENC-4004",
    employee: "Amna Bilal",
    avatar: "AB",
    dept: "Design",
    type: "Annual Leave",
    days: 4,
    amount: 20000,
    rate: 5000,
    currentBalance: 12,
    submitted: "3h ago",
    slaHours: 36,
    payGrade: "L3",
  },
];

function getSlaBadge(hours: number) {
  if (hours < 0) return "bg-red-50 text-red-700 border-red-200";
  if (hours < 24) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function EncashmentApprovalPanel() {
  const [requests, setRequests] = useState<EncashmentApprovalRequest[]>(
    MOCK_PENDING_ENCASHMENTS
  );
  const [viewingRequest, setViewingRequest] =
    useState<EncashmentApprovalRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((req) => {
      if (!q) return true;
      return (
        req.id.toLowerCase().includes(q) ||
        req.employee.toLowerCase().includes(q) ||
        req.dept.toLowerCase().includes(q) ||
        req.type.toLowerCase().includes(q) ||
        req.payGrade.toLowerCase().includes(q)
      );
    });
  }, [requests, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allVisibleSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((req) => selectedIds.includes(req.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredRequests.some((req) => req.id === id))
      );
      return;
    }

    const visibleIds = filteredRequests.map((req) => req.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleAction = (id: string, action: "approve" | "reject") => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));

    if (viewingRequest?.id === id) {
      setViewingRequest(null);
    }

    console.log(`encashment ${action}`, id);
  };

  const handleBulkApprove = () => {
    setRequests((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
    setSelectedIds([]);
  };

  const totalValue = useMemo(
    () => requests.reduce((acc, curr) => acc + curr.amount, 0),
    [requests]
  );

  const overdueCount = requests.filter((r) => r.slaHours < 0).length;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Encashment Approvals
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Verify and authorize leave balance liquidation requests.
                </p>
              </div>
            </div>

            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100">
              <Download className="h-4 w-4" />
              Export Queue
            </button>
          </div>

          {/* Summary strip */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Pending
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {requests.length}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Value
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                PKR {totalValue.toLocaleString()}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Selected
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {selectedIds.length}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-brand-900 p-4 text-white">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                Overdue SLA
              </div>
              <div className="mt-2 text-lg font-bold">{overdueCount}</div>
            </div>
          </div>
        </div>

        {/* Bulk bar */}
        {selectedIds.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-brand-900 px-6 py-4 text-white shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-medium">
                <span className="font-semibold">{selectedIds.length}</span> request(s) selected
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkApprove}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                >
                  <CheckSquare className="h-4 w-4" />
                  Bulk Approve
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by employee, request ID, department, type, or grade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="text-sm text-brand-700">
              Showing{" "}
              <span className="font-semibold text-brand-900">
                {filteredRequests.length}
              </span>{" "}
              request(s)
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
              Pending Encashment Queue
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="w-12 px-5 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Type
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Days
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Balance After
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    SLA
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-300/40 bg-white">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-300">
                        <Wallet className="h-8 w-8" />
                      </div>
                      <div className="mt-4 text-sm font-semibold text-brand-900">
                        No pending encashment approvals
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        All encashment requests have been processed.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="transition-colors hover:bg-brand-100">
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(req.id)}
                          onChange={() => toggleSelect(req.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-900">
                            {req.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-brand-900">
                              {req.employee}
                            </div>
                            <div className="text-[11px] text-brand-700">
                              {req.dept} • {req.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {req.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold text-brand-900">
                        {req.days} d
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-emerald-600">
                          PKR {req.amount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-brand-700">
                          @ PKR {req.rate.toLocaleString()}/d
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="text-sm font-semibold text-brand-900">
                          {req.currentBalance - req.days} d
                        </div>
                        <div className="text-[11px] text-brand-700">
                          of {req.currentBalance} d
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getSlaBadge(req.slaHours)}`}>
                          <Clock className="h-3.5 w-3.5" />
                          {req.slaHours < 0 ? "Overdue" : `${req.slaHours}h`}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, "approve")}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-emerald-600 transition hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setViewingRequest(req)}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
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

        {/* Detail modal */}
        {viewingRequest && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-brand-900">
                      Encashment Review
                    </h3>
                    <p className="text-sm text-brand-700">
                      Request ID: {viewingRequest.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setViewingRequest(null)}
                  className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Employee */}
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-lg font-semibold text-brand-900">
                    {viewingRequest.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-brand-900">
                      {viewingRequest.employee}
                    </div>
                    <div className="text-sm text-brand-700">
                      {viewingRequest.payGrade} • {viewingRequest.dept}
                    </div>
                  </div>
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                    Payroll Grade Linked
                  </span>
                </div>

                {/* Calculation */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Leave Type
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {viewingRequest.type}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Current Balance
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {viewingRequest.currentBalance} Days
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Submitted
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {viewingRequest.submitted}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-brand-700">Requested</span>
                        <span className="font-semibold text-brand-900">
                          {viewingRequest.days} Days
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-brand-700">Rate / Day</span>
                        <span className="font-semibold text-brand-900">
                          PKR {viewingRequest.rate.toLocaleString()}
                        </span>
                      </div>

                      <div className="border-t border-indigo-100 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-indigo-700">
                            Total Payout
                          </span>
                          <span className="text-xl font-bold text-brand-900">
                            PKR {viewingRequest.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h4 className="border-b border-gray-100 pb-4 text-sm font-semibold uppercase tracking-wider text-brand-800">
                    Policy Validation
                  </h4>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-brand-700">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        Eligible Pay Grade
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                        Verified
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-brand-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Min. Balance Retained ({viewingRequest.currentBalance - viewingRequest.days} &gt; 5)
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                        Pass
                      </span>
                    </div>
                  </div>
                </div>

                {/* Integration */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <div className="text-sm font-semibold text-blue-900">
                      PayEdge Integration
                    </div>
                    <div className="mt-1 text-sm leading-6 text-blue-800">
                      Approval will create an auto-earning entry under head{" "}
                      <span className="font-semibold text-brand-900">
                        04-LEAVE-ENCASH
                      </span>{" "}
                      for the next payroll run.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 bg-white px-6 py-5">
                <button
                  onClick={() => handleAction(viewingRequest.id, "reject")}
                  className="flex-1 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(viewingRequest.id, "approve")}
                  className="flex-[1.5] rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}