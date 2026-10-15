"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  User,
  UserCog,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type RosterChangeStatus = "pending" | "approved" | "rejected";
type RosterType = "Morning (9-6)" | "Evening (2-11)" | "Night (11-8)" | "General (9-5)" | "Day Off";

interface RosterChangeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  currentRoster: RosterType;
  proposedRoster: RosterType;
  reason: string;
  evidenceUrl?: string;
  status: RosterChangeStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

// ------------------------------------------------------------------
// Mock Data
// ------------------------------------------------------------------
const mockRequests: RosterChangeRequest[] = [
  {
    id: "rc1",
    employeeId: "emp101",
    employeeName: "John Doe",
    department: "IT",
    date: "2025-03-30",
    currentRoster: "Morning (9-6)",
    proposedRoster: "Evening (2-11)",
    reason: "Need to attend a family function in the morning.",
    status: "pending",
    createdAt: "2025-03-25T10:00:00Z",
  },
  {
    id: "rc2",
    employeeId: "emp102",
    employeeName: "Jane Smith",
    department: "Finance",
    date: "2025-03-28",
    currentRoster: "Evening (2-11)",
    proposedRoster: "Morning (9-6)",
    reason: "Medical appointment in the evening.",
    status: "approved",
    approvedBy: "Manager A",
    approvedAt: "2025-03-24T14:00:00Z",
    createdAt: "2025-03-23T09:00:00Z",
  },
  {
    id: "rc3",
    employeeId: "emp101",
    employeeName: "John Doe",
    department: "IT",
    date: "2025-03-25",
    currentRoster: "Morning (9-6)",
    proposedRoster: "Day Off",
    reason: "Personal day off request.",
    status: "rejected",
    rejectionReason: "Too many requests already approved for that day.",
    createdAt: "2025-03-22T11:00:00Z",
  },
  {
    id: "rc4",
    employeeId: "emp103",
    employeeName: "Alice Johnson",
    department: "HR",
    date: "2025-04-01",
    currentRoster: "Morning (9-6)",
    proposedRoster: "Evening (2-11)",
    reason: "Need to pick up kids from school in the morning.",
    status: "pending",
    createdAt: "2025-03-25T14:30:00Z",
  },
];

const mockRosters: RosterType[] = ["Morning (9-6)", "Evening (2-11)", "Night (11-8)", "General (9-5)", "Day Off"];

// Current user (employee)
const currentUser = {
  id: "emp101",
  name: "John Doe",
  department: "IT",
  role: "employee", // or "manager"
};

// Manager for approvals (demo)
const manager = {
  id: "mgr001",
  name: "Manager A",
};

// ------------------------------------------------------------------
// Simulated API
// ------------------------------------------------------------------
const fetchRosterChangeRequests = async (): Promise<RosterChangeRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRequests;
};

const submitRosterChangeRequest = async (data: Omit<RosterChangeRequest, "id" | "status" | "createdAt">): Promise<RosterChangeRequest> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const newRequest: RosterChangeRequest = {
    ...data,
    id: `rc${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  mockRequests.unshift(newRequest);
  return newRequest;
};

const approveRequest = async (id: string, approverName: string): Promise<RosterChangeRequest> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const req = mockRequests.find(r => r.id === id);
  if (req) {
    req.status = "approved";
    req.approvedBy = approverName;
    req.approvedAt = new Date().toISOString();
  }
  return req!;
};

const rejectRequest = async (id: string, reason: string): Promise<RosterChangeRequest> => {
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

// Request Form Modal
function RequestFormModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    employeeId: currentUser.id,
    employeeName: currentUser.name,
    department: currentUser.department,
    date: new Date().toISOString().split("T")[0],
    currentRoster: "Morning (9-6)" as RosterType,
    proposedRoster: "Evening (2-11)" as RosterType,
    reason: "",
    evidenceUrl: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // In real app, upload file and get URL
      setFormData({ ...formData, evidenceUrl: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Request Roster Change</h3>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Current Roster</label>
            <select
              value={formData.currentRoster}
              onChange={(e) => setFormData({ ...formData, currentRoster: e.target.value as RosterType })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              {mockRosters.map(roster => (
                <option key={roster} value={roster}>{roster}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Proposed Roster *</label>
            <select
              value={formData.proposedRoster}
              onChange={(e) => setFormData({ ...formData, proposedRoster: e.target.value as RosterType })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              required
            >
              {mockRosters.map(roster => (
                <option key={roster} value={roster}>{roster}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Reason *</label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Explain why you need this change..."
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Upload Evidence (Optional)</label>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <Upload size={14} /> Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && <span className="text-xs text-gray-500">{file.name}</span>}
            </div>
            <p className="mt-1 text-[10px] text-gray-400">Supporting documents (screenshots, approvals, etc.)</p>
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

// Request Card
function RequestCard({
  request,
  onView,
  showActions = false,
  onApprove,
  onReject,
}: {
  request: RosterChangeRequest;
  onView: () => void;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
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
            <Calendar size={18} className="text-[#3E3B6F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{request.employeeName}</span>
              <span className="text-xs text-gray-400">{request.department}</span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(request.date)} • {request.currentRoster} → {request.proposedRoster}
            </div>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600 line-clamp-2">{request.reason}</div>
      {request.evidenceUrl && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <Upload size={12} /> Evidence attached
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
export default function RosterChangeManagementPage() {
  const [requests, setRequests] = useState<RosterChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my-requests" | "pending-approvals" | "history">("my-requests");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RosterChangeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 });
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchRosterChangeRequests();
      setRequests(data);
      // Calculate stats for current user
      const userRequests = data.filter(r => r.employeeId === currentUser.id);
      const pending = userRequests.filter(r => r.status === "pending").length;
      const approved = userRequests.filter(r => r.status === "approved").length;
      const rejected = userRequests.filter(r => r.status === "rejected").length;
      setStats({ pending, approved, rejected });
      setLoading(false);
    };
    load();
  }, []);

  // Filter requests based on active tab
  const filteredRequests = useCallback(() => {
    if (activeTab === "my-requests") {
      return requests.filter(r => r.employeeId === currentUser.id);
    } else if (activeTab === "pending-approvals") {
      // For demo, show all pending (manager view)
      return requests.filter(r => r.status === "pending");
    } else {
      return requests.filter(r => r.status !== "pending");
    }
  }, [requests, activeTab]);

  const currentRequests = filteredRequests();
  const totalPages = Math.ceil(currentRequests.length / itemsPerPage);
  const paginatedRequests = currentRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSubmitRequest = async (data: any) => {
    const newRequest = await submitRosterChangeRequest(data);
    setRequests(prev => [newRequest, ...prev]);
    setStats(prev => ({ ...prev, pending: prev.pending + 1 }));
    toast.success("Roster change request submitted", { icon: <CheckCircle2 size={18} /> });
  };

  const handleApprove = async (id: string) => {
    const updated = await approveRequest(id, manager.name);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    // Update stats only if it's the current user's request (or just recalc)
    if (updated.employeeId === currentUser.id) {
      setStats(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
    }
    toast.success("Request approved", { icon: <CheckCircle2 size={18} /> });
  };

  const handleReject = async (id: string, reason: string) => {
    const updated = await rejectRequest(id, reason);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    if (updated.employeeId === currentUser.id) {
      setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
    }
    toast.error("Request rejected", { icon: <XCircle size={18} /> });
    setShowRejectModal(false);
  };

  const openRejectModal = (request: RosterChangeRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const viewDetails = (request: RosterChangeRequest) => {
    setSelectedRequest(request);
    // For demo, simple toast; could open a detail modal
    toast(`Reason: ${request.reason}`, { duration: 5000 });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E3B6F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading roster change requests...</p>
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
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">Roster Change Requests</h1>
              <p className="text-sm text-gray-500">Request changes to your work schedule</p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#3E3B6F] px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-[#2C2A4A] transition-colors"
            >
              <Plus size={16} /> New Request
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Pending</span>
                <Clock size={18} className="text-yellow-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Approved</span>
                <CheckCircle2 size={18} className="text-green-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-green-600">{stats.approved}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Rejected</span>
                <XCircle size={18} className="text-red-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-red-600">{stats.rejected}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {[
              { id: "my-requests", label: "My Requests", icon: User },
              { id: "pending-approvals", label: "Pending Approvals", icon: UserCog },
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
                <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                <p>No requests found</p>
              </div>
            ) : (
              paginatedRequests.map(req => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onView={() => viewDetails(req)}
                  showActions={activeTab === "pending-approvals"}
                  onApprove={activeTab === "pending-approvals" ? () => handleApprove(req.id) : undefined}
                  onReject={activeTab === "pending-approvals" ? () => openRejectModal(req) : undefined}
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

      {/* Request Form Modal */}
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