"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Eye,
  ThumbsUp,
  ThumbsDown,
  User,
  Users,
  TrendingUp,
  Upload,
  AlertTriangle,
} from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type RegularizationStatus = "pending" | "approved" | "rejected";
type IssueType =
  | "Missing In-Punch"
  | "Missing Out-Punch"
  | "Wrong Punch Time"
  | "Late Arrival"
  | "Early Departure"
  | "Short Day"
  | "Other";

interface RegularizationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  issueType: IssueType;
  proposedInTime: string; // HH:MM
  proposedOutTime: string;
  reason: string;
  evidenceUrl?: string; // optional
  status: RegularizationStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface RegularizationStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

// ------------------------------------------------------------------
// Mock Data
// ------------------------------------------------------------------
const mockRequests: RegularizationRequest[] = [
  {
    id: "reg1",
    employeeId: "emp101",
    employeeName: "John Doe",
    department: "IT",
    date: "2025-03-24",
    issueType: "Missing Out-Punch",
    proposedInTime: "09:05",
    proposedOutTime: "18:15",
    reason: "Forgot to punch out while leaving, remembered later. I left at 6:15 PM.",
    status: "pending",
    createdAt: "2025-03-24T20:00:00Z",
  },
  {
    id: "reg2",
    employeeId: "emp101",
    employeeName: "John Doe",
    department: "IT",
    date: "2025-03-20",
    issueType: "Late Arrival",
    proposedInTime: "09:10",
    proposedOutTime: "18:10",
    reason: "Traffic due to road construction, arrived 10 mins late but stayed extra to compensate.",
    status: "approved",
    approvedBy: "Manager A",
    approvedAt: "2025-03-21T10:00:00Z",
    createdAt: "2025-03-20T12:00:00Z",
  },
  {
    id: "reg3",
    employeeId: "emp102",
    employeeName: "Jane Smith",
    department: "Finance",
    date: "2025-03-22",
    issueType: "Missing In-Punch",
    proposedInTime: "09:00",
    proposedOutTime: "18:00",
    reason: "Biometric device was offline, used web punch but it didn't register.",
    status: "pending",
    createdAt: "2025-03-22T09:30:00Z",
  },
  {
    id: "reg4",
    employeeId: "emp101",
    employeeName: "John Doe",
    department: "IT",
    date: "2025-03-18",
    issueType: "Wrong Punch Time",
    proposedInTime: "09:02",
    proposedOutTime: "18:15",
    reason: "Punched out at 6:15 but system recorded 5:45 due to device glitch.",
    status: "rejected",
    rejectionReason: "Insufficient evidence; please provide logs.",
    createdAt: "2025-03-18T19:00:00Z",
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
const calculateStats = (requests: RegularizationRequest[], userId: string): RegularizationStats => {
  const userRequests = requests.filter(r => r.employeeId === userId);
  const pendingCount = userRequests.filter(r => r.status === "pending").length;
  const approvedCount = userRequests.filter(r => r.status === "approved").length;
  const rejectedCount = userRequests.filter(r => r.status === "rejected").length;
  return { pendingCount, approvedCount, rejectedCount };
};

// Simulated API functions
const fetchRegularizationRequests = async (): Promise<RegularizationRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRequests;
};

const submitRegularizationRequest = async (data: Omit<RegularizationRequest, "id" | "status" | "createdAt">): Promise<RegularizationRequest> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const newRequest: RegularizationRequest = {
    ...data,
    id: `reg${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  mockRequests.unshift(newRequest);
  return newRequest;
};

const approveRequest = async (id: string, approverName: string): Promise<RegularizationRequest> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const req = mockRequests.find(r => r.id === id);
  if (req) {
    req.status = "approved";
    req.approvedBy = approverName;
    req.approvedAt = new Date().toISOString();
  }
  return req!;
};

const rejectRequest = async (id: string, reason: string): Promise<RegularizationRequest> => {
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

// Regularization Request Form Modal
function RequestFormModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    issueType: "Missing Out-Punch" as IssueType,
    proposedInTime: "09:00",
    proposedOutTime: "18:00",
    reason: "",
    evidenceUrl: "",
  });
  const [characterCount, setCharacterCount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCharacterCount(val.length);
    setFormData({ ...formData, reason: val });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // In real app, upload file and get URL
      setFormData({ ...formData, evidenceUrl: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (characterCount < 20) {
      toast.error("Reason must be at least 20 characters");
      return;
    }
    if (!formData.date || !formData.issueType || !formData.proposedInTime || !formData.proposedOutTime) {
      toast.error("Please fill all required fields");
      return;
    }
    onSubmit({
      ...formData,
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
        className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Request Regularization</h3>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <XCircle size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Issue Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.issueType}
              onChange={(e) => setFormData({ ...formData, issueType: e.target.value as IssueType })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              required
            >
              <option>Missing In-Punch</option>
              <option>Missing Out-Punch</option>
              <option>Wrong Punch Time</option>
              <option>Late Arrival</option>
              <option>Early Departure</option>
              <option>Short Day</option>
              <option>Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Proposed In Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.proposedInTime}
                onChange={(e) => setFormData({ ...formData, proposedInTime: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Proposed Out Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.proposedOutTime}
                onChange={(e) => setFormData({ ...formData, proposedOutTime: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Reason for Correction <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={handleReasonChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Explain why the record is incorrect or missing (Minimum 20 characters)..."
              required
            />
            <div className={`mt-1 text-right text-xs ${characterCount >= 20 ? "text-green-600" : "text-red-500"}`}>
              {characterCount} / 20 characters minimum
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Upload Evidence (Optional)
            </label>
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
            <p className="mt-1 text-[10px] text-gray-400">Supporting documents like screenshots, logs, or notes</p>
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
function RequestCard({ request, onView, showActions = false, onApprove, onReject }: { request: RegularizationRequest; onView: () => void; showActions?: boolean; onApprove?: () => void; onReject?: () => void }) {
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
            <AlertTriangle size={18} className="text-[#3E3B6F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{request.employeeName}</span>
              <span className="text-xs text-gray-400">{request.department}</span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(request.date)} • {request.issueType}
            </div>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <Clock size={12} /> Proposed: {request.proposedInTime} – {request.proposedOutTime}
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
export default function RegularizationManagementPage() {
  const [requests, setRequests] = useState<RegularizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my-requests" | "pending-approvals" | "history">("my-requests");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegularizationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [stats, setStats] = useState<RegularizationStats>({ pendingCount: 0, approvedCount: 0, rejectedCount: 0 });

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchRegularizationRequests();
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
    const newRequest = await submitRegularizationRequest(data);
    setRequests(prev => [newRequest, ...prev]);
    setStats(calculateStats([...requests, newRequest], currentUser.id));
    toast.success("Regularization request submitted", { icon: <CheckCircle2 size={18} /> });
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

  const openRejectModal = (request: RegularizationRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const viewDetails = (request: RegularizationRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(false); // Use same modal for view? Better separate modal.
    // For now, simple alert.
    toast(`Reason: ${request.reason}`, { duration: 5000 });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E3B6F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading regularization requests...</p>
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
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">Attendance Regularization</h1>
              <p className="text-sm text-gray-500">Correct missing or incorrect attendance records</p>
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
                <AlertTriangle size={40} className="mx-auto mb-2 opacity-30" />
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