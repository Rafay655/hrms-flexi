"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Link as LinkIcon,
  FileText,
  AlertTriangle,
  Eye,
  CheckSquare,
  X,
  Info,
  Download,
  Search,
  User,
} from "lucide-react";

interface CompOffRequest {
  id: string;
  employee: string;
  avatar: string;
  dept: string;
  role?: string;
  dateWorked: string;
  type: string;
  amount: string;
  evidence: { linked: boolean; attachment: boolean };
  submitted: string;
  slaHours: number;
  reason: string;
  timeSyncData?: {
    punchIn: string;
    punchOut: string;
    totalHours: string;
    isHoliday: boolean;
    holidayName?: string;
  };
}

const MOCK_PENDING_CO: CompOffRequest[] = [
  {
    id: "CO-REQ-001",
    employee: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    role: "Software Engineer",
    dateWorked: "Dec 25, 2024",
    type: "Worked on Holiday",
    amount: "1.0 day",
    evidence: { linked: true, attachment: true },
    submitted: "2h ago",
    slaHours: 18,
    reason: "Completed urgent deployment for the Year-End Finance module fix.",
    timeSyncData: {
      punchIn: "09:00 AM",
      punchOut: "06:30 PM",
      totalHours: "9.5 hours",
      isHoliday: true,
      holidayName: "Christmas Day",
    },
  },
  {
    id: "CO-REQ-002",
    employee: "Sara Miller",
    avatar: "SM",
    dept: "Product",
    role: "Product Manager",
    dateWorked: "Jan 05, 2025",
    type: "Worked on Weekend",
    amount: "1.0 day",
    evidence: { linked: true, attachment: false },
    submitted: "5h ago",
    slaHours: 36,
    reason: "Strategic planning session for Q1 roadmap.",
    timeSyncData: {
      punchIn: "10:00 AM",
      punchOut: "07:00 PM",
      totalHours: "9.0 hours",
      isHoliday: false,
    },
  },
  {
    id: "CO-REQ-003",
    employee: "Tom Chen",
    avatar: "TC",
    dept: "Engineering",
    role: "Backend Dev",
    dateWorked: "Jan 10, 2025",
    type: "Approved Overtime",
    amount: "0.5 day",
    evidence: { linked: false, attachment: true },
    submitted: "1d ago",
    slaHours: -2,
    reason: "System migration support for core database.",
  },
  {
    id: "CO-REQ-004",
    employee: "Anna Bell",
    avatar: "AB",
    dept: "Design",
    role: "UI Designer",
    dateWorked: "Jan 12, 2025",
    type: "Extra Shift",
    amount: "1.0 day",
    evidence: { linked: false, attachment: false },
    submitted: "3h ago",
    slaHours: 42,
    reason: "Finalizing UI assets for the global rebranding.",
  },
];

export default function CompOffApprovalPanel() {
  const [requests, setRequests] = useState<CompOffRequest[]>(MOCK_PENDING_CO);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingRequest, setViewingRequest] = useState<CompOffRequest | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((req) => {
      if (!q) return true;
      return (
        req.id.toLowerCase().includes(q) ||
        req.employee.toLowerCase().includes(q) ||
        req.dept.toLowerCase().includes(q) ||
        req.type.toLowerCase().includes(q)
      );
    });
  }, [requests, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAction = (id: string, action: "approve" | "reject") => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));

    if (viewingRequest?.id === id) {
      setViewingRequest(null);
    }

    console.log(`Request ${id} ${action}d`);
  };

  const handleBulkApprove = () => {
    setRequests((prev) => prev.filter((req) => !selectedIds.includes(req.id)));
    setSelectedIds([]);
    setIsBulkConfirmOpen(false);
  };

  const allVisibleSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((req) => selectedIds.includes(req.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredRequests.some((req) => req.id === id))
      );
      return;
    }

    const visibleIds = filteredRequests.map((req) => req.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const approvedToday = 3;
  const overdueCount = requests.filter((req) => req.slaHours < 0).length;
  const withEvidenceCount = requests.filter(
    (req) => req.evidence.linked || req.evidence.attachment
  ).length;

  const getAmountNumber = (value: string) => Number.parseFloat(value) || 0;

  const totalPendingDays = requests
    .reduce((sum, req) => sum + getAmountNumber(req.amount), 0)
    .toFixed(1);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Comp-Off Credit Approvals
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Verify extra work hours and approve compensatory off credits.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <Download className="h-4 w-4" />
              Export Queue
            </button>
          </div>

          {/* Summary strip */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Pending Requests
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {requests.length}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Pending Days
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {totalPendingDays}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Overdue SLA
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {overdueCount}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Approved Today
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {approvedToday}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-brand-900 px-6 py-4 text-white shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-medium">
                <span className="font-semibold">{selectedIds.length}</span> request(s) selected
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkConfirmOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                >
                  <CheckSquare className="h-4 w-4" />
                  Bulk Approve
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter/search */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by request ID, employee, department, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="text-sm text-brand-700">
              Evidence available in{" "}
              <span className="font-semibold text-brand-900">{withEvidenceCount}</span> request(s)
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
              Pending Approval Queue
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Date Worked
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Evidence
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
                        <Zap className="h-8 w-8" />
                      </div>
                      <div className="mt-4 text-sm font-semibold text-brand-900">
                        No pending comp-off approvals
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        Everything in the current queue has been cleared.
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
                              {req.dept}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-brand-900">
                        <div>{req.dateWorked}</div>
                        <div className="mt-1 text-[11px] text-brand-700">
                          {req.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                          {req.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                        {req.amount}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {req.evidence.linked && (
                            <span
                              title="Linked to TimeSync"
                              className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-2 text-emerald-600"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </span>
                          )}

                          {req.evidence.attachment && (
                            <span
                              title="Attachment Provided"
                              className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-2 text-brand-800"
                            >
                              <FileText className="h-4 w-4" />
                            </span>
                          )}

                          {!req.evidence.linked && !req.evidence.attachment && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              No Evidence
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {req.slaHours < 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <Clock className="h-3.5 w-3.5" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                            {req.slaHours}h
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(req.id, "approve")}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-emerald-600 transition hover:bg-emerald-50"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAction(req.id, "reject")}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingRequest(req)}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
                            title="Review"
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
            <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-brand-900">
                      Credit Request Review
                    </h3>
                    <p className="text-sm text-brand-700">{viewingRequest.id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingRequest(null)}
                  className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto">
                <div className="grid gap-6 p-6">
                  {/* Employee header */}
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-900">
                      {viewingRequest.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-900">
                        {viewingRequest.employee}
                      </div>
                      <div className="text-[11px] text-brand-700">
                        {viewingRequest.role || "Staff Member"} • {viewingRequest.dept}
                      </div>
                    </div>
                  </div>

                  {/* Info cards */}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Date Worked
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {viewingRequest.dateWorked}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Claim Type
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {viewingRequest.type}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Claim Amount
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {viewingRequest.amount}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Submitted
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-900">
                        {viewingRequest.submitted}
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                        Reason Provided
                      </h4>
                    </div>
                    <div className="p-5 text-sm leading-6 text-brand-700">
                      {viewingRequest.reason}
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                        TimeSync Evidence
                      </h4>
                    </div>

                    <div className="p-5">
                      {viewingRequest.timeSyncData ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                              Punch In
                            </div>
                            <div className="mt-2 text-sm font-semibold text-brand-900">
                              {viewingRequest.timeSyncData.punchIn}
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                              Punch Out
                            </div>
                            <div className="mt-2 text-sm font-semibold text-brand-900">
                              {viewingRequest.timeSyncData.punchOut}
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                              Total Valid Hours
                            </div>
                            <div className="mt-2 text-sm font-semibold text-brand-900">
                              {viewingRequest.timeSyncData.totalHours}
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                              Holiday Context
                            </div>
                            <div className="mt-2 text-sm font-semibold text-brand-900">
                              {viewingRequest.timeSyncData.isHoliday
                                ? viewingRequest.timeSyncData.holidayName || "Public Holiday"
                                : "Regular Non-Holiday"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                          No system punch records found for this date. Manual evidence verification is required.
                        </div>
                      )}

                      {viewingRequest.evidence.attachment && (
                        <button
                          type="button"
                          className="mt-4 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:bg-brand-100"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-brand-800" />
                            <span className="text-sm font-medium text-brand-900">
                              Evidence_Attachment.pdf
                            </span>
                          </div>
                          <Download className="h-4 w-4 text-brand-700" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Outcome preview */}
                  <div className="rounded-xl border border-gray-200 bg-brand-900 p-5 text-white shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                          Impacted Credit
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                          + {viewingRequest.amount}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                          Expiry Rule
                        </div>
                        <div className="mt-2 text-sm font-semibold text-white">
                          90 Days (Mar 25, 2025)
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-brand-100">
                      Approved credit will be added to the employee balance immediately after confirmation.
                    </div>
                  </div>

                  {/* Review note */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 text-brand-800" />
                      <div>
                        <div className="text-sm font-semibold text-brand-900">
                          Reviewer Guidance
                        </div>
                        <div className="mt-1 text-sm leading-6 text-brand-700">
                          Confirm duration, evidence linkage, and policy eligibility before approving the comp-off credit.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => handleAction(viewingRequest.id, "reject")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(viewingRequest.id, "approve")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Credit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk confirm modal */}
        {isBulkConfirmOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckSquare className="h-8 w-8" />
              </div>

              <h4 className="mt-5 text-lg font-semibold text-brand-900">
                Confirm Bulk Approval
              </h4>
              <p className="mt-2 text-sm leading-6 text-brand-700">
                You are about to approve{" "}
                <span className="font-semibold text-brand-900">{selectedIds.length}</span>{" "}
                credit request(s). This action will update employee balances immediately.
              </p>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkConfirmOpen(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  className="flex-1 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}