"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  CheckCircle2, XCircle, Clock, Users, Calendar,
  FileText, Briefcase, Zap, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, Search, Filter, Eye,
  X, User, Building2, MapPin, CalendarDays, TrendingUp, TrendingDown,
} from "lucide-react";
import { EmployeeLink } from "@/components/shared/EmployeeLink";

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────
type RequestType =
  | "regularization"
  | "overtime"
  | "shift_swap"
  | "roster_change";

type RequestStatus = "pending" | "approved" | "rejected";

interface BaseRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  employeeColor: string;
  department: string;
  submittedDate: string; // YYYY-MM-DD
  reason: string;
  urgent?: boolean;
}

interface RegularizationRequest extends BaseRequest {
  type: "regularization";
  date: string;        // date of attendance issue
  issueType: string;   // Missing Out-Punch, Late Arrival, etc.
  proposedInTime: string;
  proposedOutTime: string;
}

interface OvertimeRequest extends BaseRequest {
  type: "overtime";
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  project?: string;
}

interface ShiftSwapRequest extends BaseRequest {
  type: "shift_swap";
  proposedDate: string;
  swapDate: string;
  requesterShift: string;
  targetShift: string;
  targetEmployeeName: string;
}

interface RosterChangeRequest extends BaseRequest {
  type: "roster_change";
  date: string;
  currentRoster: string;
  proposedRoster: string;
  evidenceUrl?: string;
}

type RequestUnion =
  | RegularizationRequest
  | OvertimeRequest
  | ShiftSwapRequest
  | RosterChangeRequest;

// Employee historical data for stats
interface EmployeeStats {
  recentAttendance: { date: string; status: "present" | "late" | "absent" }[];
  overtimeMTD: number;
  pendingRequestsCount: number;
  performanceScore: number;
  leaveBalance?: number;
  lastPunch?: string;
}

// ─────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────
// Mock employee stats (in real app, fetch from API)
const employeeStatsMap: Record<string, EmployeeStats> = {
  E001: {
    recentAttendance: [
      { date: "2025-03-20", status: "present" },
      { date: "2025-03-21", status: "present" },
      { date: "2025-03-22", status: "present" },
      { date: "2025-03-23", status: "present" },
      { date: "2025-03-24", status: "present" },
      { date: "2025-03-25", status: "present" },
      { date: "2025-03-26", status: "present" },
    ],
    overtimeMTD: 8.5,
    pendingRequestsCount: 1,
    performanceScore: 94,
    leaveBalance: 12,
    lastPunch: "2025-03-26 18:15",
  },
  E003: {
    recentAttendance: [
      { date: "2025-03-20", status: "present" },
      { date: "2025-03-21", status: "late" },
      { date: "2025-03-22", status: "present" },
      { date: "2025-03-23", status: "absent" },
      { date: "2025-03-24", status: "present" },
      { date: "2025-03-25", status: "late" },
      { date: "2025-03-26", status: "present" },
    ],
    overtimeMTD: 2.0,
    pendingRequestsCount: 1,
    performanceScore: 76,
    leaveBalance: 8,
    lastPunch: "2025-03-26 18:10",
  },
  E004: {
    recentAttendance: [
      { date: "2025-03-20", status: "present" },
      { date: "2025-03-21", status: "present" },
      { date: "2025-03-22", status: "present" },
      { date: "2025-03-23", status: "present" },
      { date: "2025-03-24", status: "present" },
      { date: "2025-03-25", status: "present" },
      { date: "2025-03-26", status: "present" },
    ],
    overtimeMTD: 6.0,
    pendingRequestsCount: 1,
    performanceScore: 91,
    leaveBalance: 10,
    lastPunch: "2025-03-26 07:00",
  },
  E007: {
    recentAttendance: [
      { date: "2025-03-20", status: "present" },
      { date: "2025-03-21", status: "present" },
      { date: "2025-03-22", status: "present" },
      { date: "2025-03-23", status: "present" },
      { date: "2025-03-24", status: "present" },
      { date: "2025-03-25", status: "present" },
      { date: "2025-03-26", status: "present" },
    ],
    overtimeMTD: 3.5,
    pendingRequestsCount: 0,
    performanceScore: 97,
    leaveBalance: 15,
    lastPunch: "2025-03-26 18:30",
  },
  E009: {
    recentAttendance: [
      { date: "2025-03-20", status: "present" },
      { date: "2025-03-21", status: "present" },
      { date: "2025-03-22", status: "present" },
      { date: "2025-03-23", status: "present" },
      { date: "2025-03-24", status: "late" },
      { date: "2025-03-25", status: "present" },
      { date: "2025-03-26", status: "late" },
    ],
    overtimeMTD: 1.5,
    pendingRequestsCount: 1,
    performanceScore: 89,
    leaveBalance: 8,
    lastPunch: "2025-03-26 18:20",
  },
};

// Mock requests (no leave)
const pendingRequests: RequestUnion[] = [
  {
    id: "REG001",
    type: "regularization",
    status: "pending",
    employeeId: "E003",
    employeeName: "Humza Ali",
    employeeInitials: "HA",
    employeeColor: "#EEC293",
    department: "Engineering",
    submittedDate: "2025-03-25",
    reason: "System glitch prevented out-punch",
    urgent: true,
    date: "2025-03-24",
    issueType: "Missing Out-Punch",
    proposedInTime: "09:05",
    proposedOutTime: "18:10",
  },
  {
    id: "OT002",
    type: "overtime",
    status: "pending",
    employeeId: "E001",
    employeeName: "Rafay Ahmed",
    employeeInitials: "RA",
    employeeColor: "#322E53",
    department: "Engineering",
    submittedDate: "2025-03-26",
    reason: "Critical server migration",
    urgent: false,
    date: "2025-03-25",
    startTime: "18:00",
    endTime: "22:00",
    hours: 4,
    project: "Infra Upgrade",
  },
  {
    id: "SW001",
    type: "shift_swap",
    status: "pending",
    employeeId: "E004",
    employeeName: "Shaban Akhtar",
    employeeInitials: "SA",
    employeeColor: "#F3AB9D",
    department: "Engineering",
    submittedDate: "2025-03-26",
    reason: "Family commitment in evening",
    urgent: false,
    proposedDate: "2025-03-28",
    swapDate: "2025-03-28",
    requesterShift: "Night",
    targetShift: "Evening",
    targetEmployeeName: "Yousaf Khan",
  },
  {
    id: "RC001",
    type: "roster_change",
    status: "pending",
    employeeId: "E007",
    employeeName: "Zainab Malik",
    employeeInitials: "ZM",
    employeeColor: "#322E53",
    department: "Product",
    submittedDate: "2025-03-25",
    reason: "Need to attend morning school event",
    urgent: true,
    date: "2025-03-30",
    currentRoster: "Morning",
    proposedRoster: "Evening",
  },
  {
    id: "REG002",
    type: "regularization",
    status: "pending",
    employeeId: "E009",
    employeeName: "Ayesha Siddiqui",
    employeeInitials: "AS",
    employeeColor: "#EEC293",
    department: "Design",
    submittedDate: "2025-03-26",
    reason: "Traffic jam, arrived 40 min late but worked extra",
    urgent: false,
    date: "2025-03-26",
    issueType: "Late Arrival",
    proposedInTime: "09:40",
    proposedOutTime: "18:30",
  },
];

// Helper to get display title for each request type
const getRequestTitle = (req: RequestUnion): string => {
  switch (req.type) {
    case "regularization":
      return `Regularization: ${req.issueType}`;
    case "overtime":
      return `Overtime: ${req.hours}h on ${req.date}`;
    case "shift_swap":
      return `Shift Swap: ${req.requesterShift} → ${req.targetShift}`;
    case "roster_change":
      return `Roster Change: ${req.currentRoster} → ${req.proposedRoster}`;
  }
};

const getRequestIcon = (type: RequestType) => {
  switch (type) {
    case "regularization": return <RefreshCw size={14} />;
    case "overtime": return <Zap size={14} />;
    case "shift_swap": return <Users size={14} />;
    case "roster_change": return <Calendar size={14} />;
  }
};

const getTypeLabel = (type: RequestType) => {
  return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

// ─────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0 font-bold text-white"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${color}dd, ${color}88)`,
        border: `2px solid ${color}33`,
        fontSize: size * 0.3,
      }}
    >
      {initials}
    </div>
  );
}

function AttendanceSparkline({ data }: { data: { date: string; status: string }[] }) {
  // Show last 7 days as colored dots
  const colors: Record<string, string> = {
    present: "#22C55E",
    late: "#F59E0B",
    absent: "#EF4444",
  };
  return (
    <div className="flex items-center gap-1">
      {data.slice(-7).map((day, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: colors[day.status] || "#9CA3AF" }}
          title={`${day.date}: ${day.status}`}
        />
      ))}
    </div>
  );
}

function RequestCard({ request, onView, onApprove, onReject }: { request: RequestUnion; onView: () => void; onApprove: () => void; onReject: () => void }) {
  const title = getRequestTitle(request);
  const icon = getRequestIcon(request.type);
  const typeLabel = getTypeLabel(request.type);
  const stats = employeeStatsMap[request.employeeId];
  const recentStatus = stats?.recentAttendance?.slice(-3) || [];

  return (
    <div className="rounded-2xl border border-[#F5E6D0] bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Avatar initials={request.employeeInitials} color={request.employeeColor} size={40} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <EmployeeLink
                employeeId={request.employeeId}
                employeeName={request.employeeName}
                showAvatar
              />
              <span className="text-xs text-gray-400">{request.department}</span>
              {request.urgent && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">URGENT</span>
              )}
            </div>
            <div className="text-sm font-medium text-gray-700 mt-0.5 flex items-center gap-1">
              {icon}
              <span>{title}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Submitted {new Date(request.submittedDate).toLocaleDateString()}
            </div>
            {/* Quick stats line */}
            {stats && (
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> OT: {stats.overtimeMTD}h
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle size={10} /> Pending: {stats.pendingRequestsCount}
                </span>
                <AttendanceSparkline data={stats.recentAttendance} />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            <Eye size={12} /> View
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
          >
            <CheckCircle2 size={12} /> Approve
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            <XCircle size={12} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ request, onClose, onApprove, onReject }: { request: RequestUnion; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const stats = employeeStatsMap[request.employeeId];
  const attendanceTrend = stats?.recentAttendance?.slice(-7) || [];

  // Render specific request details
  const renderDetails = () => {
    switch (request.type) {
      case "regularization":
        return (
          <div className="space-y-3">
            <DetailRow label="Attendance Date" value={new Date(request.date).toLocaleDateString()} />
            <DetailRow label="Issue Type" value={request.issueType} />
            <DetailRow label="Proposed In" value={request.proposedInTime} />
            <DetailRow label="Proposed Out" value={request.proposedOutTime} />
          </div>
        );
      case "overtime":
        return (
          <div className="space-y-3">
            <DetailRow label="Date" value={new Date(request.date).toLocaleDateString()} />
            <DetailRow label="Time" value={`${request.startTime} – ${request.endTime}`} />
            <DetailRow label="Hours" value={`${request.hours}h`} />
            {request.project && <DetailRow label="Project" value={request.project} />}
          </div>
        );
      case "shift_swap":
        return (
          <div className="space-y-3">
            <DetailRow label="Proposed Date" value={new Date(request.proposedDate).toLocaleDateString()} />
            <DetailRow label="Swap Date" value={new Date(request.swapDate).toLocaleDateString()} />
            <DetailRow label="From Shift" value={request.requesterShift} />
            <DetailRow label="To Shift" value={request.targetShift} />
            <DetailRow label="With" value={request.targetEmployeeName} />
          </div>
        );
      case "roster_change":
        return (
          <div className="space-y-3">
            <DetailRow label="Date" value={new Date(request.date).toLocaleDateString()} />
            <DetailRow label="Current Roster" value={request.currentRoster} />
            <DetailRow label="Proposed Roster" value={request.proposedRoster} />
            {request.evidenceUrl && <DetailRow label="Evidence" value={<a href={request.evidenceUrl} className="text-blue-600 underline">View</a>} />}
          </div>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "late": return "bg-yellow-100 text-yellow-800";
      case "absent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#F5E6D0] p-5">
          <div className="flex items-center gap-2">
            {getRequestIcon(request.type)}
            <h3 className="text-lg font-bold text-gray-800">{getRequestTitle(request)}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left column: employee info & stats */}
          <div className="md:w-1/3 border-r border-[#F5E6D0] p-5 bg-gray-50/30">
            <div className="flex items-center gap-3 mb-4">
              <Avatar initials={request.employeeInitials} color={request.employeeColor} size={48} />
              <div>
                <div className="font-bold text-gray-800">
                  <EmployeeLink
                    employeeId={request.employeeId}
                    employeeName={request.employeeName}
                  />
                </div>
                <div className="text-sm text-gray-500">{request.department}</div>
                <div className="text-xs text-gray-400 mt-0.5">ID: {request.employeeId}</div>
              </div>
            </div>

            {stats && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Recent Attendance</div>
                  <div className="space-y-1">
                    {attendanceTrend.map((day, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span>{new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        <span className={`px-2 py-0.5 rounded-full ${getStatusColor(day.status)}`}>
                          {day.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-400">OT (MTD)</div>
                    <div className="text-lg font-bold text-gray-800">{stats.overtimeMTD}h</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Pending Requests</div>
                    <div className="text-lg font-bold text-gray-800">{stats.pendingRequestsCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Performance</div>
                    <div className="text-lg font-bold text-gray-800">{stats.performanceScore}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Leave Balance</div>
                    <div className="text-lg font-bold text-gray-800">{stats.leaveBalance} days</div>
                  </div>
                </div>
                {stats.lastPunch && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> Last punch: {stats.lastPunch}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column: request details */}
          <div className="md:w-2/3 p-5 space-y-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Reason</div>
              <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{request.reason}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Request Details</div>
              {renderDetails()}
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#F5E6D0] p-5">
          <button
            onClick={onApprove}
            className="flex-1 rounded-xl bg-green-100 py-2.5 text-sm font-bold text-green-700 hover:bg-green-200"
          >
            ✓ Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 rounded-xl bg-red-100 py-2.5 text-sm font-bold text-red-700 hover:bg-red-200"
          >
            ✗ Reject
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function ApprovalsInbox() {
  const [requests, setRequests] = useState<RequestUnion[]>(pendingRequests);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<RequestType | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<RequestUnion | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<RequestUnion | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null);

  const filteredRequests = useMemo(() => {
    let filtered = requests.filter(r => r.status === "pending");
    if (typeFilter !== "all") {
      filtered = filtered.filter(r => r.type === typeFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.employeeName.toLowerCase().includes(term) ||
        r.department.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    }
    // Sort by submittedDate
    filtered.sort((a, b) => {
      const dateA = new Date(a.submittedDate).getTime();
      const dateB = new Date(b.submittedDate).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [requests, search, typeFilter, sortOrder]);

  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === "pending");
    return {
      total: pending.length,
      byType: {
        regularization: pending.filter(r => r.type === "regularization").length,
        overtime: pending.filter(r => r.type === "overtime").length,
        shift_swap: pending.filter(r => r.type === "shift_swap").length,
        roster_change: pending.filter(r => r.type === "roster_change").length,
      },
    };
  }, [requests]);

  const handleApprove = (request: RequestUnion) => {
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: "approved" } : r));
    toast.success(`${request.employeeName}'s ${getTypeLabel(request.type)} request approved`);
  };

  const handleReject = (request: RequestUnion, reason: string) => {
    setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: "rejected" } : r));
    toast.error(`${request.employeeName}'s ${getTypeLabel(request.type)} request rejected`);
    setShowRejectModal(false);
    setRejectTarget(null);
    setRejectionReason("");
  };

  const openRejectModal = (request: RequestUnion) => {
    setRejectTarget(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const typeOptions: { value: RequestType | "all"; label: string }[] = [
    { value: "all", label: `All (${stats.total})` },
    { value: "regularization", label: `Regularization (${stats.byType.regularization})` },
    { value: "overtime", label: `Overtime (${stats.byType.overtime})` },
    { value: "shift_swap", label: `Shift Swap (${stats.byType.shift_swap})` },
    { value: "roster_change", label: `Roster Change (${stats.byType.roster_change})` },
  ];

  return (
    <>
     
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">Approvals Inbox</h1>
              <p className="text-sm text-gray-500">Review and manage pending attendance & scheduling requests</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm w-64 focus:ring-2 focus:ring-[#3E3B6F] focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setSortOrder(o => o === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600"
              >
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                {sortOrder === "newest" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Stats / Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  typeFilter === opt.value
                    ? "bg-[#3E3B6F] text-white shadow"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center text-gray-400">
              <CheckCircle2 size={48} className="mx-auto mb-3 opacity-30" />
              <p>No pending requests</p>
              <p className="text-sm mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => (
                <div key={req.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(req.id)}
                    onChange={(e) => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(req.id);
                        else next.delete(req.id);
                        return next;
                      });
                    }}
                    className="mt-4 h-4 w-4 accent-brand-800 flex-shrink-0"
                    aria-label="Select request"
                  />
                  <div className="flex-1 min-w-0">
                    <RequestCard
                      request={req}
                      onView={() => setSelectedRequest(req)}
                      onApprove={() => handleApprove(req)}
                      onReject={() => openRejectModal(req)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-2xl">
          <span className="text-sm font-semibold text-gray-800">
            {selectedIds.size} request{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="h-5 w-px bg-gray-200" />
          <button
            type="button"
            onClick={() => setBulkAction("approve")}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
          >
            Approve All
          </button>
          <button
            type="button"
            onClick={() => setBulkAction("reject")}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Reject All
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      )}

      {/* Bulk confirm AlertDialog */}
      {bulkAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setBulkAction(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {bulkAction === "approve"
                ? `Approve ${selectedIds.size} request${selectedIds.size !== 1 ? "s" : ""}?`
                : `Reject ${selectedIds.size} request${selectedIds.size !== 1 ? "s" : ""}?`}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {bulkAction === "approve"
                ? "This will update attendance records for all selected employees."
                : "All selected requests will be marked as rejected and employees will be notified."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkAction(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const count = selectedIds.size;
                  if (bulkAction === "approve") {
                    setRequests((prev) =>
                      prev.map((r) =>
                        selectedIds.has(r.id) ? { ...r, status: "approved" } : r
                      )
                    );
                    toast.success(`${count} request${count !== 1 ? "s" : ""} approved`);
                  } else {
                    setRequests((prev) =>
                      prev.map((r) =>
                        selectedIds.has(r.id) ? { ...r, status: "rejected" } : r
                      )
                    );
                    toast.success(`${count} request${count !== 1 ? "s" : ""} rejected`);
                  }
                  setSelectedIds(new Set());
                  setBulkAction(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  bulkAction === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <DetailModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onApprove={() => {
              handleApprove(selectedRequest);
              setSelectedRequest(null);
            }}
            onReject={() => {
              openRejectModal(selectedRequest);
              setSelectedRequest(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white shadow-xl"
            >
              <div className="p-5 border-b border-[#F5E6D0]">
                <h3 className="text-lg font-bold text-gray-800">Reject Request</h3>
                <p className="text-sm text-gray-500 mt-1">Please provide a reason for rejection</p>
              </div>
              <div className="p-5">
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#3E3B6F]"
                  placeholder="Reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => handleReject(rejectTarget, rejectionReason)}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}