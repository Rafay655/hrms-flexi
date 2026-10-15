"use client";

import { useState, useEffect, useCallback } from "react";
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
  UserPlus,
  TrendingUp,
  Search,
  X,
} from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type ShiftType = "Morning (9-6)" | "Evening (2-11)" | "Night (11-8)" | "General (9-5)";
type SwapStatus = "pending" | "accepted" | "declined" | "cancelled";

interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterShift: ShiftType;
  targetEmployeeId: string | null; // null means open to anyone
  targetEmployeeName?: string;
  targetShift?: ShiftType;
  proposedDate: string; // YYYY-MM-DD
  swapDate: string; // YYYY-MM-DD (optional if same day)
  reason: string;
  status: SwapStatus;
  responderId?: string;
  responderName?: string;
  respondedAt?: string;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  shift: ShiftType;
}

interface Stats {
  pendingSent: number;
  pendingReceived: number;
  accepted: number;
}

// ------------------------------------------------------------------
// Mock Data
// ------------------------------------------------------------------
const mockEmployees: Employee[] = [
  { id: "emp101", name: "John Doe", department: "IT", shift: "Morning (9-6)" },
  { id: "emp102", name: "Jane Smith", department: "Finance", shift: "Evening (2-11)" },
  { id: "emp103", name: "Alice Johnson", department: "HR", shift: "Morning (9-6)" },
  { id: "emp104", name: "Bob Williams", department: "Operations", shift: "Night (11-8)" },
];

const currentUser: Employee = {
  id: "emp101",
  name: "John Doe",
  department: "IT",
  shift: "Morning (9-6)",
};

const mockRequests: ShiftSwapRequest[] = [
  {
    id: "swap1",
    requesterId: "emp101",
    requesterName: "John Doe",
    requesterShift: "Morning (9-6)",
    targetEmployeeId: "emp102",
    targetEmployeeName: "Jane Smith",
    targetShift: "Evening (2-11)",
    proposedDate: "2025-03-28",
    swapDate: "2025-03-28",
    reason: "Need to attend a family event in the evening.",
    status: "pending",
    createdAt: "2025-03-25T09:00:00Z",
  },
  {
    id: "swap2",
    requesterId: "emp103",
    requesterName: "Alice Johnson",
    requesterShift: "Morning (9-6)",
    targetEmployeeId: "emp101",
    targetEmployeeName: "John Doe",
    targetShift: "Morning (9-6)",
    proposedDate: "2025-03-29",
    swapDate: "2025-03-29",
    reason: "I have a doctor's appointment in the morning, can we swap?",
    status: "pending",
    createdAt: "2025-03-25T10:30:00Z",
  },
  {
    id: "swap3",
    requesterId: "emp101",
    requesterName: "John Doe",
    requesterShift: "Morning (9-6)",
    targetEmployeeId: "emp104",
    targetEmployeeName: "Bob Williams",
    targetShift: "Night (11-8)",
    proposedDate: "2025-03-27",
    swapDate: "2025-03-27",
    reason: "Need to work on a project during night shift.",
    status: "accepted",
    responderId: "emp104",
    responderName: "Bob Williams",
    respondedAt: "2025-03-24T14:00:00Z",
    createdAt: "2025-03-24T10:00:00Z",
  },
  {
    id: "swap4",
    requesterId: "emp102",
    requesterName: "Jane Smith",
    requesterShift: "Evening (2-11)",
    targetEmployeeId: null,
    proposedDate: "2025-03-30",
    swapDate: "2025-03-30",
    reason: "Looking for someone to cover my shift.",
    status: "pending",
    createdAt: "2025-03-25T11:00:00Z",
  },
];

// ------------------------------------------------------------------
// Simulated API
// ------------------------------------------------------------------
const fetchShiftSwapRequests = async (): Promise<ShiftSwapRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRequests;
};

const submitSwapRequest = async (data: Omit<ShiftSwapRequest, "id" | "status" | "createdAt">): Promise<ShiftSwapRequest> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const newRequest: ShiftSwapRequest = {
    ...data,
    id: `swap${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  mockRequests.unshift(newRequest);
  return newRequest;
};

const respondToRequest = async (id: string, accept: boolean, responder: Employee): Promise<ShiftSwapRequest> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const req = mockRequests.find(r => r.id === id);
  if (req) {
    req.status = accept ? "accepted" : "declined";
    req.responderId = responder.id;
    req.responderName = responder.name;
    req.respondedAt = new Date().toISOString();
  }
  return req!;
};

const cancelRequest = async (id: string): Promise<ShiftSwapRequest> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const req = mockRequests.find(r => r.id === id);
  if (req) req.status = "cancelled";
  return req!;
};

// ------------------------------------------------------------------
// Components
// ------------------------------------------------------------------

// Request Form Modal
function RequestFormModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    requesterId: currentUser.id,
    requesterName: currentUser.name,
    requesterShift: currentUser.shift,
    targetEmployeeId: "" as string | null,
    targetEmployeeName: "",
    targetShift: "",
    proposedDate: new Date().toISOString().split("T")[0],
    swapDate: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.id !== currentUser.id &&
    (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectEmployee = (emp: Employee) => {
    setFormData({
      ...formData,
      targetEmployeeId: emp.id,
      targetEmployeeName: emp.name,
      targetShift: emp.shift,
    });
    setShowEmployeeDropdown(false);
    setSearchTerm("");
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
            <h3 className="text-lg font-bold text-gray-800">Request Shift Swap</h3>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Current Shift</label>
            <div className="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {currentUser.shift}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Swap With <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowEmployeeDropdown(true);
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  placeholder="Search by name or department..."
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                {formData.targetEmployeeId && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetEmployeeId: null, targetEmployeeName: "", targetShift: "" })}
                    className="text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {showEmployeeDropdown && filteredEmployees.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                  {filteredEmployees.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.department} • {emp.shift}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {formData.targetEmployeeId && (
              <div className="mt-2 text-xs text-green-600">
                Selected: {formData.targetEmployeeName} ({formData.targetShift})
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Proposed Date</label>
              <input
                type="date"
                value={formData.proposedDate}
                onChange={(e) => setFormData({ ...formData, proposedDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Swap Date</label>
              <input
                type="date"
                value={formData.swapDate}
                onChange={(e) => setFormData({ ...formData, swapDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Reason</label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Why do you need to swap shifts?"
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

// Request Card
function RequestCard({
  request,
  onView,
  showActions = false,
  onAccept,
  onDecline,
  onCancel,
}: {
  request: ShiftSwapRequest;
  onView: () => void;
  showActions?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
}) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    accepted: "bg-green-100 text-green-800 border-green-200",
    declined: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3E3B6F]/10">
            <Users size={18} className="text-[#3E3B6F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{request.requesterName}</span>
              <span className="text-xs text-gray-400">{request.requesterShift}</span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(request.proposedDate)} • Swapping with {request.targetEmployeeName || "anyone"}
            </div>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[request.status]}`}>
          {request.status}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600 line-clamp-2">{request.reason}</div>
      <div className="mt-3 flex justify-between items-center">
        <button onClick={onView} className="text-xs text-[#3E3B6F] hover:underline flex items-center gap-1">
          <Eye size={12} /> View Details
        </button>
        {showActions && request.status === "pending" && (
          <div className="flex gap-2">
            {onAccept && (
              <button onClick={onAccept} className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100">
                <ThumbsUp size={12} /> Accept
              </button>
            )}
            {onDecline && (
              <button onClick={onDecline} className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                <ThumbsDown size={12} /> Decline
              </button>
            )}
            {onCancel && (
              <button onClick={onCancel} className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
                <X size={12} /> Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function ShiftSwapManagementPage() {
  const [requests, setRequests] = useState<ShiftSwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my-requests" | "incoming" | "history">("my-requests");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ShiftSwapRequest | null>(null);
  const [stats, setStats] = useState<Stats>({ pendingSent: 0, pendingReceived: 0, accepted: 0 });
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchShiftSwapRequests();
      setRequests(data);
      // Calculate stats
      const sent = data.filter(r => r.requesterId === currentUser.id && r.status === "pending").length;
      const received = data.filter(r => r.targetEmployeeId === currentUser.id && r.status === "pending").length;
      const accepted = data.filter(r => (r.requesterId === currentUser.id || r.targetEmployeeId === currentUser.id) && r.status === "accepted").length;
      setStats({ pendingSent: sent, pendingReceived: received, accepted });
      setLoading(false);
    };
    load();
  }, []);

  const filteredRequests = useCallback(() => {
    if (activeTab === "my-requests") {
      return requests.filter(r => r.requesterId === currentUser.id);
    } else if (activeTab === "incoming") {
      return requests.filter(r => r.targetEmployeeId === currentUser.id && r.status === "pending");
    } else {
      return requests.filter(r => (r.requesterId === currentUser.id || r.targetEmployeeId === currentUser.id) && r.status !== "pending");
    }
  }, [requests, activeTab]);

  const currentRequests = filteredRequests();
  const totalPages = Math.ceil(currentRequests.length / itemsPerPage);
  const paginatedRequests = currentRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSubmitRequest = async (data: any) => {
    const newRequest = await submitSwapRequest(data);
    setRequests(prev => [newRequest, ...prev]);
    setStats(prev => ({ ...prev, pendingSent: prev.pendingSent + 1 }));
    toast.success("Swap request submitted", { icon: <CheckCircle2 size={18} /> });
  };

  const handleRespond = async (id: string, accept: boolean) => {
    const updated = await respondToRequest(id, accept, currentUser);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    // Update stats
    if (accept) {
      setStats(prev => ({ ...prev, pendingReceived: prev.pendingReceived - 1, accepted: prev.accepted + 1 }));
      toast.success("Request accepted", { icon: <CheckCircle2 size={18} /> });
    } else {
      setStats(prev => ({ ...prev, pendingReceived: prev.pendingReceived - 1 }));
      toast.error("Request declined", { icon: <XCircle size={18} /> });
    }
  };

  const handleCancel = async (id: string) => {
    const updated = await cancelRequest(id);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    setStats(prev => ({ ...prev, pendingSent: prev.pendingSent - 1 }));
    toast.success("Request cancelled", { icon: <CheckCircle2 size={18} /> });
  };

  const viewDetails = (request: ShiftSwapRequest) => {
    setSelectedRequest(request);
    toast(`Swap details: ${request.reason}`, { duration: 5000 });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E3B6F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shift swap requests...</p>
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
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">Shift Swap Requests</h1>
              <p className="text-sm text-gray-500">Request to swap shifts with colleagues</p>
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
                <span className="text-xs text-gray-400">Pending Sent</span>
                <User size={18} className="text-yellow-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-yellow-600">{stats.pendingSent}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Pending Received</span>
                <UserPlus size={18} className="text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600">{stats.pendingReceived}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Accepted Swaps</span>
                <CheckCircle2 size={18} className="text-green-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-green-600">{stats.accepted}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {[
              { id: "my-requests", label: "My Requests", icon: User },
              { id: "incoming", label: "Incoming", icon: UserPlus },
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
                <Users size={40} className="mx-auto mb-2 opacity-30" />
                <p>No requests found</p>
              </div>
            ) : (
              paginatedRequests.map(req => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onView={() => viewDetails(req)}
                  showActions={activeTab !== "history"}
                  onAccept={activeTab === "incoming" ? () => handleRespond(req.id, true) : undefined}
                  onDecline={activeTab === "incoming" ? () => handleRespond(req.id, false) : undefined}
                  onCancel={activeTab === "my-requests" && req.status === "pending" ? () => handleCancel(req.id) : undefined}
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
    </>
  );
}