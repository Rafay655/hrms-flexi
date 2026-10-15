"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  MoreHorizontal,
  X,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileText,
  Download,
  Edit2,
  XCircle,
  RotateCw,
  CalendarDays,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplyLeaveWizard } from "@/components/leaveease/ApplyLeaveWizard";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum LeaveType {
  ANNUAL = "Annual Leave",
  SICK = "Sick Leave",
  CASUAL = "Casual Leave",
  UNPAID = "Unpaid Leave",
  COMP_OFF = "Comp-Off",
  SHORT = "Short Leave",
}

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  reasonCategory: string;
  status: ApprovalStatus;
  appliedDate: string;
  appliedOnFormatted: string;
}

const REQUESTS_DATA: LeaveRequest[] = Array.from({ length: 15 }, (_, i) => ({
  id: `LV-2025-${1000 + i}`,
  type: [
    LeaveType.ANNUAL,
    LeaveType.SICK,
    LeaveType.CASUAL,
    LeaveType.UNPAID,
    LeaveType.COMP_OFF,
    LeaveType.SHORT,
  ][i % 6],
  startDate: "2025-02-10",
  endDate: "2025-02-12",
  days: (i % 3) + 1,
  reason: i % 2 === 0 ? "Annual family trip to the coast." : "Urgent personal matters at home.",
  reasonCategory: i % 2 === 0 ? "Vacation" : "Personal",
  status: [
    ApprovalStatus.APPROVED,
    ApprovalStatus.PENDING,
    ApprovalStatus.REJECTED,
    ApprovalStatus.CANCELLED,
  ][i % 4],
  appliedDate: "2025-01-10",
  appliedOnFormatted: i === 0 ? "2 days ago" : "Jan 13, 2025",
}));

const tabs = ["All", "Pending", "Approved", "Rejected", "Cancelled"] as const;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getStatusClasses(status: ApprovalStatus) {
  switch (status) {
    case ApprovalStatus.APPROVED:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case ApprovalStatus.PENDING:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case ApprovalStatus.REJECTED:
      return "bg-rose-50 text-rose-700 border-rose-200";
    case ApprovalStatus.CANCELLED:
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
}

function getStatusIcon(status: ApprovalStatus) {
  switch (status) {
    case ApprovalStatus.APPROVED:
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case ApprovalStatus.PENDING:
      return <Clock3 className="h-3.5 w-3.5" />;
    case ApprovalStatus.REJECTED:
      return <AlertCircle className="h-3.5 w-3.5" />;
    case ApprovalStatus.CANCELLED:
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getStatusClasses(
        status
      )}`}
    >
      {getStatusIcon(status)}
      {status === ApprovalStatus.PENDING && "Pending"}
      {status === ApprovalStatus.APPROVED && "Approved"}
      {status === ApprovalStatus.REJECTED && "Rejected"}
      {status === ApprovalStatus.CANCELLED && "Cancelled"}
    </Badge>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  gradient,
}: {
  label: string;
  value: string | number;
  helper: string;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.32 }}
      className={`rounded-2xl p-5 text-white shadow-lg ${gradient}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
        {label}
      </p>
      <h3 className="mt-2 text-3xl font-bold tracking-tight">{value}</h3>
      <p className="mt-1 text-xs text-white/70">{helper}</p>
    </motion.div>
  );
}

function RequestDetailPanel({
  selectedRequest,
  onClose,
  onModify,
  onCancel,
  onResubmit,
}: {
  selectedRequest: LeaveRequest | null;
  onClose: () => void;
  onModify: (request: LeaveRequest) => void;
  onCancel: (id: string) => void;
  onResubmit: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {selectedRequest && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#111827]/35 backdrop-blur-[3px]" onClick={onClose} />

          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col border-l border-gray-200 bg-white shadow-2xl"
          >
            <div className="border-b border-gray-200 bg-gradient-to-br from-[#322E53] via-[#322E53] to-[#5c5490] px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Leave Request
                  </p>
                  <h3 className="mt-1 text-xl font-bold">{selectedRequest.id}</h3>
                  <div className="mt-3">
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/10 p-2 text-white/75 transition hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Request Details
                </h4>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">{selectedRequest.type}</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Duration
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {selectedRequest.days} {selectedRequest.days > 1 ? "Days" : "Day"}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Dates
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {selectedRequest.startDate} — {selectedRequest.endDate}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Applied On
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {selectedRequest.appliedOnFormatted}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Reason & Documents
                </h4>

                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Category
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedRequest.reasonCategory}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Reason
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-700">{selectedRequest.reason}</p>
                  </div>

                  <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-900 transition hover:bg-gray-50">
                    <Download className="h-4 w-4" />
                    application_docs.pdf
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Approval Trail
                </h4>

                <div className="relative mt-5 space-y-6 pl-6 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-gray-200">
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                    <p className="text-sm font-semibold text-gray-800">Submitted</p>
                    <p className="text-xs text-gray-500">Jan 13, 2025 • 10:30 AM</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500" />
                    <p className="text-sm font-semibold text-gray-800">Manager Review</p>
                    <p className="text-xs text-gray-500 italic">Ahmed Khan is reviewing this request</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-gray-200" />
                    <p className="text-sm font-semibold text-gray-400">Decision Pending</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="grid grid-cols-2 gap-3">
                {selectedRequest.status === ApprovalStatus.PENDING && (
                  <>
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl border-gray-200 text-gray-700"
                      onClick={() => onModify(selectedRequest)}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Modify
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      onClick={() => onCancel(selectedRequest.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}

                {selectedRequest.status === ApprovalStatus.REJECTED && (
                  <Button
                    className="col-span-2 h-11 rounded-xl bg-gradient-to-r from-[#443763] to-[#5c5490] text-white"
                    onClick={() => onResubmit(selectedRequest.id)}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Resubmit Request
                  </Button>
                )}

                {selectedRequest.status === ApprovalStatus.APPROVED && (
                  <Button
                    variant="outline"
                    className="col-span-2 h-11 rounded-xl border-gray-200 text-gray-700"
                    onClick={() => onCancel(selectedRequest.id)}
                  >
                    Cancel Request
                  </Button>
                )}

                {selectedRequest.status === ApprovalStatus.CANCELLED && (
                  <button className="col-span-2 h-11 cursor-not-allowed rounded-xl bg-gray-100 text-sm font-semibold text-gray-400">
                    Request Finalized
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
export default function MyRequests() {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>(REQUESTS_DATA);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Pending" && r.status === ApprovalStatus.PENDING) ||
        (activeTab === "Approved" && r.status === ApprovalStatus.APPROVED) ||
        (activeTab === "Rejected" && r.status === ApprovalStatus.REJECTED) ||
        (activeTab === "Cancelled" && r.status === ApprovalStatus.CANCELLED);

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.id.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.reasonCategory.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === ApprovalStatus.PENDING).length,
      approved: requests.filter((r) => r.status === ApprovalStatus.APPROVED).length,
      rejected: requests.filter((r) => r.status === ApprovalStatus.REJECTED).length,
    };
  }, [requests]);

  const handleCancel = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: ApprovalStatus.CANCELLED } : req))
    );

    setSelectedRequest((prev) =>
      prev?.id === id ? { ...prev, status: ApprovalStatus.CANCELLED } : prev
    );
  };

  const handleResubmit = (id: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: ApprovalStatus.PENDING } : req))
    );

    setSelectedRequest((prev) =>
      prev?.id === id ? { ...prev, status: ApprovalStatus.PENDING } : prev
    );
  };

  const handleModify = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowWizard(true);
  };

  const handleWizardSubmit = () => {
    setShowWizard(false);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
  };

  return (
    <div
      className="min-h-screen bg-white p-4 lg:p-8"
      style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-brand-900">My Leave Requests</h2>
            <p className="mt-1 text-sm text-brand-700">
              Track, review, and manage your leave application lifecycle.
            </p>
          </div>

          <Button
            onClick={() => setShowWizard(true)}
            className="h-11 rounded-xl bg-gradient-to-r from-[#443763] to-[#5c5490] px-5 text-white shadow-md shadow-[#443763]/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Apply Leave
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Requests"
            value={stats.total}
            helper="All request records"
            gradient="bg-gradient-to-br from-[#443763] via-[#5c5490] to-[#A085E0]"
          />
          <SummaryCard
            label="Pending"
            value={stats.pending}
            helper="Awaiting approval"
            gradient="bg-gradient-to-br from-[#EEC293] via-[#DEAD68] to-[#FFC574]"
          />
          <SummaryCard
            label="Approved"
            value={stats.approved}
            helper="Confirmed requests"
            gradient="bg-gradient-to-br from-[#49426E] via-[#49426E] to-[#CEE7BE]"
          />
          <SummaryCard
            label="Rejected"
            value={stats.rejected}
            helper="Needs resubmission"
            gradient="bg-gradient-to-br from-[#F3AB9D] via-[#F3AB9D] to-[#FCA6A2]"
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                    activeTab === tab
                      ? "bg-brand-900 text-white shadow-sm"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search request ID, type, category..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </motion.div>

        {/* Listing */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-brand-900">Leave Request Listing</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800">
                <CalendarDays className="h-3.5 w-3.5" />
                Current Cycle Overview
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Request ID
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Leave Type
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Applied On
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="cursor-pointer transition hover:bg-gray-50/80"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-mono text-xs font-bold text-brand-900">{request.id}</p>
                          <p className="mt-1 text-[11px] text-gray-400">{request.reasonCategory}</p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-gray-800">{request.type}</span>
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {request.startDate} — {request.endDate}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-gray-700">
                          {request.days} {request.days > 1 ? "Days" : "Day"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={request.status} />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock3 className="h-4 w-4 text-gray-400" />
                          {request.appliedOnFormatted}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-brand-900"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <MoreHorizontal className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                          <FileText className="h-8 w-8" />
                        </div>
                        <h4 className="mt-4 text-base font-semibold text-gray-700">
                          No requests match your filters
                        </h4>
                        <p className="mt-1 max-w-md text-sm text-gray-500">
                          Try changing the current tab or search value, or create a fresh leave request.
                        </p>
                        <button
                          onClick={() => setShowWizard(true)}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                        >
                          <Plus className="h-4 w-4" />
                          Apply for Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bottom helper */}
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-violet-50 via-white to-amber-50 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                Smart Tip
              </p>
              <h4 className="mt-1 text-base font-semibold text-brand-900">
                Apply early to avoid approval delays
              </h4>
              <p className="mt-1 text-sm text-brand-700">
                Requests submitted earlier usually move faster through the approval chain.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm font-medium text-brand-900">
              View Leave Policy
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      <RequestDetailPanel
        selectedRequest={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onModify={handleModify}
        onCancel={handleCancel}
        onResubmit={handleResubmit}
      />

      <ApplyLeaveWizard
        isOpen={showWizard}
        onClose={handleWizardClose}
        onSubmit={handleWizardSubmit}
        selectedLeaveType={selectedRequest?.type ?? LeaveType.ANNUAL}
      />
    </div>
  );
}