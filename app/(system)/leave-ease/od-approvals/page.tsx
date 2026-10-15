"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  MapPin,
  FileText,
  X,
  Plane,
  Briefcase,
  Globe,
  ShieldCheck,
  ArrowRight,
  CheckSquare,
  Search,
  ChevronRight,
} from "lucide-react";

interface ApprovalRequest {
  id: string;
  employee: string;
  avatar: string;
  dept: string;
  role: string;
  type: "Official Duty" | "Local Travel" | "Inter-city Travel" | "International Travel";
  startDate: string;
  endDate: string;
  destination: string;
  purpose: string;
  submitted: string;
  slaHours: number;
  itinerary?: { from: string; to: string; mode: string; date: string }[];
  passport?: { number: string; expiry: string; isValid: boolean };
  visa?: { status: string; type: string };
  conflicts: string[];
}

const MOCK_PENDING: ApprovalRequest[] = [
  {
    id: "ODT-9001",
    employee: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    role: "Senior Dev",
    type: "International Travel",
    startDate: "Mar 15, 2025",
    endDate: "Mar 22, 2025",
    destination: "Dubai, UAE",
    purpose: "Tech Summit 2025 Speaker",
    submitted: "2h ago",
    slaHours: 18,
    itinerary: [
      { from: "Karachi (KHI)", to: "Dubai (DXB)", mode: "Flight EK601", date: "Mar 15" },
      { from: "Dubai (DXB)", to: "Karachi (KHI)", mode: "Flight EK602", date: "Mar 22" },
    ],
    passport: { number: "PK882291", expiry: "Dec 2028", isValid: true },
    visa: { status: "Have Visa", type: "Business" },
    conflicts: ["Overlaps with Q1 Sprint Planning"],
  },
  {
    id: "ODT-9002",
    employee: "Sara Miller",
    avatar: "SM",
    dept: "Product",
    role: "PM",
    type: "Official Duty",
    startDate: "Feb 18, 2025",
    endDate: "Feb 18, 2025",
    destination: "Local Client HQ",
    purpose: "Quarterly Sync Meeting",
    submitted: "4h ago",
    slaHours: 42,
    conflicts: [],
  },
  {
    id: "ODT-9003",
    employee: "Tom Chen",
    avatar: "TC",
    dept: "Operations",
    role: "Lead",
    type: "Inter-city Travel",
    startDate: "Feb 25, 2025",
    endDate: "Feb 27, 2025",
    destination: "Lahore Branch",
    purpose: "Site Audit",
    submitted: "1d ago",
    slaHours: -2,
    itinerary: [
      { from: "Karachi", to: "Lahore", mode: "Business Train", date: "Feb 25" },
      { from: "Lahore", to: "Karachi", mode: "Business Train", date: "Feb 27" },
    ],
    conflicts: ["Sarah Miller on Annual Leave"],
  },
];

function getSlaBadge(hours: number) {
  if (hours < 0) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (hours < 24) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function getTypeBadge(type: ApprovalRequest["type"]) {
  switch (type) {
    case "Official Duty":
      return "bg-brand-100 text-brand-800 border-gray-200";
    case "International Travel":
      return "bg-violet-50 text-violet-700 border-violet-100";
    case "Local Travel":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "Inter-city Travel":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function ODTravelApprovalPanel() {
  const [requests, setRequests] = useState<ApprovalRequest[]>(MOCK_PENDING);
  const [viewingRequest, setViewingRequest] = useState<ApprovalRequest | null>(null);
  const [search, setSearch] = useState("");

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((req) => {
      if (!q) return true;
      return (
        req.employee.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q) ||
        req.dept.toLowerCase().includes(q) ||
        req.destination.toLowerCase().includes(q) ||
        req.type.toLowerCase().includes(q)
      );
    });
  }, [requests, search]);

  const handleAction = (id: string, action: "approve" | "reject") => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    if (viewingRequest?.id === id) setViewingRequest(null);
    console.log(`${action} request`, id);
  };

  const overdueCount = requests.filter((r) => r.slaHours < 0).length;
  const urgentCount = requests.filter((r) => r.slaHours >= 0 && r.slaHours < 24).length;
  const internationalCount = requests.filter((r) => r.type === "International Travel").length;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  OD / Travel Approvals
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Review and authorize official duty and travel assignments.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Pending Action
              </div>
              <div className="mt-1 text-xl font-bold text-amber-900">
                {requests.length}
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Pending
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {requests.length}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Overdue
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {overdueCount}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Under 24h SLA
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {urgentCount}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                International Cases
              </div>
              <div className="mt-2 text-lg font-bold text-brand-900">
                {internationalCount}
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by employee, request ID, department, destination, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="text-sm text-brand-700">
              Showing <span className="font-semibold text-brand-900">{filteredRequests.length}</span> request(s)
            </div>
          </div>
        </div>

        {/* Main table */}
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
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Dates
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Destination
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
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-300">
                        <CheckSquare className="h-8 w-8" />
                      </div>
                      <div className="mt-4 text-sm font-semibold text-brand-900">
                        No pending OD / Travel approvals
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        All requests in the current queue have been processed.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="transition-colors hover:bg-brand-100">
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

                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getTypeBadge(req.type)}`}>
                          {req.type}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-brand-900">
                          {req.startDate}
                        </div>
                        <div className="text-[11px] text-brand-700">
                          to {req.endDate}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-brand-900">
                          <MapPin className="h-4 w-4 text-brand-700" />
                          {req.destination}
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
                            title="Approve"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setViewingRequest(req)}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
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

        {/* Detail modal */}
        {viewingRequest && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getTypeBadge(viewingRequest.type)}`}>
                    {viewingRequest.type === "Official Duty" ? (
                      <Briefcase className="h-5 w-5" />
                    ) : (
                      <Plane className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-brand-900">
                      Review Request: {viewingRequest.id}
                    </h3>
                    <p className="text-sm text-brand-700">
                      Submitted {viewingRequest.submitted}
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

              <div className="max-h-[75vh] overflow-y-auto">
                <div className="grid gap-6 p-6">
                  {/* Employee header */}
                  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-lg font-semibold text-brand-900">
                      {viewingRequest.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-brand-900">
                        {viewingRequest.employee}
                      </div>
                      <div className="text-sm text-brand-700">
                        {viewingRequest.role} • {viewingRequest.dept}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Type
                      </div>
                      <div className="mt-1 text-sm font-semibold text-brand-900">
                        {viewingRequest.type}
                      </div>
                    </div>
                  </div>

                  {/* Core details */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-200 px-5 py-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                          Travel Details
                        </h4>
                      </div>

                      <div className="grid gap-4 p-5">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Travel Period
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-sm font-semibold text-brand-900">
                            <span>{viewingRequest.startDate}</span>
                            <ArrowRight className="h-4 w-4 text-brand-700" />
                            <span>{viewingRequest.endDate}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Destination
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-brand-900">
                            <MapPin className="h-4 w-4 text-brand-700" />
                            {viewingRequest.destination}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                            Purpose Details
                          </div>
                          <div className="mt-2 text-sm leading-6 text-brand-700">
                            {viewingRequest.purpose}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-200 px-5 py-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                          Compliance Checks
                        </h4>
                      </div>

                      <div className="grid gap-4 p-5 text-sm">
                        {viewingRequest.type === "International Travel" && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-brand-700">
                                <Globe className="h-4 w-4" />
                                Passport Validity
                              </span>
                              <span className={viewingRequest.passport?.isValid ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
                                {viewingRequest.passport?.isValid ? "Valid" : "Expired"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-brand-700">
                                <FileText className="h-4 w-4" />
                                Visa Status
                              </span>
                              <span className="font-semibold text-brand-900">
                                {viewingRequest.visa?.status || "--"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-brand-700">
                                <Clock className="h-4 w-4" />
                                Advance Notice
                              </span>
                              <span className="font-semibold text-emerald-700">
                                Met (14d+)
                              </span>
                            </div>
                          </>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-brand-700">
                            <AlertTriangle className="h-4 w-4" />
                            Coverage Conflict
                          </span>
                          <span className={viewingRequest.conflicts.length > 0 ? "font-semibold text-amber-700" : "font-semibold text-emerald-700"}>
                            {viewingRequest.conflicts.length > 0
                              ? `${viewingRequest.conflicts.length} Alert`
                              : "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Itinerary */}
                  {viewingRequest.itinerary && (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-200 px-5 py-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-800">
                          <Plane className="h-4 w-4" />
                          Full Itinerary
                        </h4>
                      </div>

                      <div className="space-y-3 p-5">
                        {viewingRequest.itinerary.map((leg, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-brand-100"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                              <Plane className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-brand-900">
                                {leg.from} → {leg.to}
                              </div>
                              <div className="text-[11px] text-brand-700">
                                {leg.mode} • {leg.date}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TimeSync impact */}
                  <div className="rounded-xl border border-gray-200 bg-brand-900 p-6 text-white shadow-sm">
                    <div className="flex items-center gap-2 text-brand-100">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        TimeSync Impact Preview
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                          Attendance Sync
                        </div>
                        <div className="mt-2 text-sm leading-6 text-brand-100">
                          Travel dates will be marked as <span className="font-semibold text-white">OD / Travel</span>. Regular attendance rules and punch requirements will be bypassed for the approved period.
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                          Payroll & Leave
                        </div>
                        <div className="mt-2 text-sm leading-6 text-brand-100">
                          No leave balance deduction. Per diem or travel advance can be routed separately after approval.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval chain */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                        Approval Chain
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 p-5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white">
                          1
                        </div>
                        <span className="text-xs font-semibold uppercase text-brand-900">
                          Self-Submission
                        </span>
                      </div>

                      <ChevronRight className="h-4 w-4 text-brand-700" />

                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold text-white">
                          2
                        </div>
                        <span className="text-xs font-semibold uppercase text-brand-900">
                          Manager (You)
                        </span>
                      </div>

                      <ChevronRight className="h-4 w-4 text-brand-700" />

                      <div className="flex items-center gap-2 opacity-50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-[10px] font-semibold text-white">
                          3
                        </div>
                        <span className="text-xs font-semibold uppercase text-brand-900">
                          HR Operations
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  onClick={() => handleAction(viewingRequest.id, "reject")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Request
                </button>

                <button
                  onClick={() => handleAction(viewingRequest.id, "approve")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve & Sync
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}