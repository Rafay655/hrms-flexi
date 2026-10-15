"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
  User,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type OvertimeStatus = "pending" | "approved" | "rejected";

interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  hours: number;
  reason: string;
  project?: string;
  status: OvertimeStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface OvertimeStats {
  totalHoursThisMonth: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

// ------------------------------------------------------------------
// Mock Data
// ------------------------------------------------------------------
const mockRequests: OvertimeRequest[] = [
  {
    id: "ot1",
    employeeId: "emp101",
    employeeName: "John Doe",
    department: "IT",
    date: "2025-03-20",
    startTime: "18:00",
    endTime: "20:00",
    hours: 2,
    reason: "Critical server migration",
    project: "Infra Upgrade",
    status: "pending",
    createdAt: "2025-03-19T10:00:00Z",
  },
  {
    id: "ot2",
    employeeId: "emp102",
    employeeName: "Jane Smith",
    department: "Finance",
    date: "2025-03-18",
    startTime: "17:30",
    endTime: "20:00",
    hours: 2.5,
    reason: "Quarterly closing",
    status: "approved",
    approvedBy: "Manager A",
    approvedAt: "2025-03-19T09:00:00Z",
    createdAt: "2025-03-18T14:00:00Z",
  },
  {
    id: "ot3",
    employeeId: "emp101",
    employeeName: "John Doe",
    department: "IT",
    date: "2025-03-15",
    startTime: "19:00",
    endTime: "22:00",
    hours: 3,
    reason: "Bug fix deployment",
    project: "Web App",
    status: "rejected",
    rejectionReason: "Approval not granted due to budget constraints",
    createdAt: "2025-03-14T16:00:00Z",
  },
  {
    id: "ot4",
    employeeId: "emp103",
    employeeName: "Alice Johnson",
    department: "HR",
    date: "2025-03-22",
    startTime: "18:00",
    endTime: "20:30",
    hours: 2.5,
    reason: "Recruitment drive prep",
    status: "pending",
    createdAt: "2025-03-21T09:30:00Z",
  },
  {
    id: "ot5",
    employeeId: "emp102",
    employeeName: "Jane Smith",
    department: "Finance",
    date: "2025-03-10",
    startTime: "17:00",
    endTime: "19:00",
    hours: 2,
    reason: "Audit support",
    status: "approved",
    approvedBy: "Manager A",
    approvedAt: "2025-03-11T10:00:00Z",
    createdAt: "2025-03-09T11:00:00Z",
  },
];

// Mock current user (in real app from auth)
const currentUser = {
  id: "emp101",
  name: "John Doe",
  department: "IT",
  role: "employee", // or "manager"
};

// Helper to calculate stats
const calculateStats = (requests: OvertimeRequest[], userId: string): OvertimeStats => {
  const userRequests = requests.filter(r => r.employeeId === userId);
  const currentMonth = new Date().getMonth();
  const thisMonthRequests = userRequests.filter(r => new Date(r.date).getMonth() === currentMonth);
  const totalHoursThisMonth = thisMonthRequests.reduce((sum, r) => sum + r.hours, 0);
  const pendingCount = userRequests.filter(r => r.status === "pending").length;
  const approvedCount = userRequests.filter(r => r.status === "approved").length;
  const rejectedCount = userRequests.filter(r => r.status === "rejected").length;
  return { totalHoursThisMonth, pendingCount, approvedCount, rejectedCount };
};

// Simulated API functions
const fetchOvertimeRequests = async (): Promise<OvertimeRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRequests;
};

const submitOvertimeRequest = async (data: Omit<OvertimeRequest, "id" | "status" | "createdAt">): Promise<OvertimeRequest> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const newRequest: OvertimeRequest = {
    ...data,
    id: `ot${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  mockRequests.unshift(newRequest);
  return newRequest;
};

const approveRequest = async (id: string, approverName: string): Promise<OvertimeRequest> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const req = mockRequests.find(r => r.id === id);
  if (req) {
    req.status = "approved";
    req.approvedBy = approverName;
    req.approvedAt = new Date().toISOString();
  }
  return req!;
};

const rejectRequest = async (id: string, reason: string): Promise<OvertimeRequest> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const req = mockRequests.find(r => r.id === id);
  if (req) {
    req.status = "rejected";
    req.rejectionReason = reason;
  }
  return req!;
};

// ------------------------------------------------------------------
// Components
// ------------------------------------------------------------------

// Overtime Request Form Modal
function RequestFormModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "18:00",
    endTime: "20:00",
    reason: "",
    project: "",
  });

  const calculateHours = () => {
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = calculateHours();
    if (hours <= 0) {
      toast.error("End time must be after start time");
      return;
    }
    if (!formData.reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    onSubmit({
      ...formData,
      hours,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h3 className="text-lg font-bold text-gray-800">Request Overtime</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <XCircle size={20} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-2 text-center">
            <span className="text-xs text-gray-500">Total hours: </span>
            <span className="font-bold text-gray-800">{calculateHours()} h</span>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Project / Task (optional)</label>
            <input
              type="text"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g., Server migration"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Reason *</label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Why is overtime needed?"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 rounded-xl bg-[#3E3B6F] py-2 text-sm font-bold text-white hover:bg-[#2C2A4A]">
              Submit Request
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Request Card (for listings)
function RequestCard({ request, onView, showActions = false, onApprove, onReject }: { request: OvertimeRequest; onView: () => void; showActions?: boolean; onApprove?: () => void; onReject?: () => void }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3E3B6F]/10">
            <Clock size={18} className="text-[#3E3B6F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{request.employeeName}</span>
              <span className="text-xs text-gray-400">{request.department}</span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(request.date)} • {request.startTime} – {request.endTime} ({request.hours}h)
            </div>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>
      <div className="mt-3 text-sm text-gray-600 line-clamp-2">{request.reason}</div>
      {request.project && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <FileText size={12} /> {request.project}
        </div>
      )}
      <div className="mt-3 flex justify-between items-center">
        <button onClick={onView} className="text-xs text-[#3E3B6F] hover:underline flex items-center gap-1">
          <Eye size={12} /> View Details
        </button>
        {showActions && request.status === "pending" && (
          <div className="flex gap-2">
            <button onClick={onApprove} className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100">
              <ThumbsUp size={12} /> Approve
            </button>
            <button onClick={onReject} className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
              <ThumbsDown size={12} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function OvertimeManagementPage() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my-requests" | "pending-approvals" | "history">("my-requests");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [stats, setStats] = useState<OvertimeStats>({ totalHoursThisMonth: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 });

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchOvertimeRequests();
      setRequests(data);
      setStats(calculateStats(data, currentUser.id));
      setLoading(false);
    };
    load();
  }, []);

  // Filter requests based on active tab
  const filteredRequests = useCallback(() => {
    if (activeTab === "my-requests") {
      return requests.filter(r => r.employeeId === currentUser.id);
    } else if (activeTab === "pending-approvals") {
      // For demo, show all pending (if manager) – here we show all pending for simplicity
      return requests.filter(r => r.status === "pending");
    } else {
      return requests.filter(r => r.status !== "pending");
    }
  }, [requests, activeTab]);

  const currentRequests = filteredRequests();
  const totalPages = Math.ceil(currentRequests.length / itemsPerPage);
  const paginatedRequests = currentRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSubmitRequest = async (data: any) => {
    const newRequest = await submitOvertimeRequest(data);
    setRequests(prev => [newRequest, ...prev]);
    setStats(calculateStats([...requests, newRequest], currentUser.id));
    toast.success("Overtime request submitted", { icon: <CheckCircle2 size={18} /> });
  };

  const handleApprove = async (id: string) => {
    const updated = await approveRequest(id, "Manager");
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    toast.success("Request approved", { icon: <CheckCircle2 size={18} /> });
    setStats(calculateStats(requests.map(r => r.id === id ? updated : r), currentUser.id));
  };

  const handleReject = async (id: string, reason: string) => {
    const updated = await rejectRequest(id, reason);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    toast.error("Request rejected", { icon: <XCircle size={18} /> });
    setStats(calculateStats(requests.map(r => r.id === id ? updated : r), currentUser.id));
    setShowRejectModal(false);
  };

  const openRejectModal = (request: OvertimeRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const viewDetails = (request: OvertimeRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(false); // Use same modal but for view? Better separate modal. For simplicity, we'll reuse reject modal for view only.
    // Actually we'll create a detail modal later. For now, just alert.
    toast(`Details: ${request.reason}`, { duration: 3000 });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E3B6F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading overtime requests...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">Overtime Management</h1>
              <p className="text-sm text-gray-500">Submit and manage overtime requests</p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#3E3B6F] px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-[#2C2A4A] transition-colors"
            >
              <Plus size={16} /> New Request
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Total Hours (This Month)</span>
                <TrendingUp size={18} className="text-[#3E3B6F]" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-800">{stats.totalHoursThisMonth.toFixed(1)}h</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Pending</span>
                <Clock size={18} className="text-yellow-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Approved</span>
                <CheckCircle2 size={18} className="text-green-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-green-600">{stats.approvedCount}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Rejected</span>
                <XCircle size={18} className="text-red-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-red-600">{stats.rejectedCount}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {[
              { id: "my-requests", label: "My Requests", icon: User },
              { id: "pending-approvals", label: "Pending Approvals", icon: Users },
              { id: "history", label: "History", icon: Clock },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setPage(1); }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-[#3E3B6F] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Listing */}
          <div className="space-y-4">
            {paginatedRequests.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-400">
                <Zap size={40} className="mx-auto mb-2 opacity-30" />
                <p>No requests found</p>
              </div>
            ) : (
              paginatedRequests.map(req => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onView={() => viewDetails(req)}
                  showActions={activeTab === "pending-approvals"}
                  onApprove={() => handleApprove(req.id)}
                  onReject={() => openRejectModal(req)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-50"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 disabled:opacity-50"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RequestFormModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleSubmitRequest}
      />

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-800">Reject Request</h3>
              <p className="mt-1 text-sm text-gray-500">Please provide a reason for rejection</p>
              <textarea
                className="mt-4 w-full rounded-xl border border-gray-200 p-3 text-sm"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason..."
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                  className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
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