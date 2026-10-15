"use client";

import React, { useMemo, useState } from "react";
import {
  UserPlus,
  Calendar,
  CheckSquare,
  Clock,
  History,
  X,
  Search,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Mail,
  Users,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  Trash2,
  Pencil,
  Send,
  UserCheck,
} from "lucide-react";

type DelegationStatus = "Active" | "Pending" | "Completed" | "Declined";
type RequestStatus = "Pending" | "Approved" | "Rejected";

interface DelegationRecord {
  id: string;
  fromUser: string;
  toUser: string;
  avatar: string;
  startDate: string;
  endDate: string;
  types: string[];
  status: DelegationStatus;
  itemsProcessed?: number;
  reason?: string;
  notify?: boolean;
}

interface DelegationRequest {
  id: string;
  managerName: string;
  requesterName: string;
  requesterAvatar: string;
  startDate: string;
  endDate: string;
  types: string[];
  reason?: string;
  status: RequestStatus;
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string;
  department: string;
  designation: string;
}

const REQUEST_TYPES = [
  "Leave",
  "Comp-Off",
  "OD/Travel",
  "Encashment",
  "Balance Adjustment",
];

const USERS: UserOption[] = [
  { id: "USR-101", name: "Sara Ahmed", department: "HR", designation: "HR Manager" },
  { id: "USR-102", name: "Ahmed Khan", department: "Engineering", designation: "Team Lead" },
  { id: "USR-103", name: "Farhan Ali", department: "Operations", designation: "Operations Manager" },
  { id: "USR-104", name: "Lisa Wong", department: "Sales", designation: "Sales Manager" },
  { id: "USR-105", name: "David Park", department: "Marketing", designation: "Marketing Lead" },
  { id: "USR-106", name: "Elena Frost", department: "HR", designation: "HR Business Partner" },
  { id: "USR-107", name: "James Wilson", department: "Operations", designation: "Ops Lead" },
  { id: "USR-108", name: "Priya Das", department: "Engineering", designation: "QA Lead" },
];

const INITIAL_DELEGATED_TO_ME: DelegationRecord[] = [
  {
    id: "DEL-881",
    fromUser: "Farhan Ali",
    toUser: "John Doe",
    avatar: "FA",
    startDate: "2026-04-10",
    endDate: "2026-04-20",
    types: ["Leave", "Comp-Off"],
    status: "Pending",
    reason: "Annual leave coverage",
    notify: true,
  },
];

const INITIAL_HISTORY: DelegationRecord[] = [
  {
    id: "DEL-501",
    fromUser: "John Doe",
    toUser: "Sara Ahmed",
    avatar: "SA",
    startDate: "2025-12-20",
    endDate: "2025-12-28",
    types: ["All Types"],
    status: "Completed",
    itemsProcessed: 12,
    reason: "Year-end vacation",
    notify: true,
  },
  {
    id: "DEL-402",
    fromUser: "John Doe",
    toUser: "Ahmed Khan",
    avatar: "AK",
    startDate: "2025-06-10",
    endDate: "2025-06-15",
    types: ["Leave"],
    status: "Completed",
    itemsProcessed: 5,
    reason: "Conference travel",
    notify: true,
  },
];

const INITIAL_REQUESTS: DelegationRequest[] = [
  {
    id: "REQ-201",
    managerName: "Sara Ahmed",
    requesterName: "John Doe",
    requesterAvatar: "JD",
    startDate: "2026-04-22",
    endDate: "2026-04-26",
    types: ["Leave", "Comp-Off"],
    reason: "I can cover approvals during your leave window.",
    status: "Pending",
    createdAt: "2026-04-07T10:00:00Z",
  },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getStatusPill(status: DelegationStatus | RequestStatus) {
  switch (status) {
    case "Active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Completed":
      return "bg-brand-50 text-brand-800 border-brand-200";
    case "Declined":
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "default",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  const styles = {
    default: {
      iconWrap: "bg-brand-800 text-white",
      value: "text-brand-900",
    },
    success: {
      iconWrap: "bg-emerald-600 text-white",
      value: "text-emerald-700",
    },
    warning: {
      iconWrap: "bg-amber-500 text-white",
      value: "text-amber-700",
    },
  } as const;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            {title}
          </p>
          <p className={`mt-2 text-2xl font-bold ${styles[tone].value}`}>{value}</p>
          <p className="mt-1 text-sm text-brand-700">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone].iconWrap}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  buttonText,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  buttonText?: string;
  onClick?: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-brand-900">{title}</h3>
      <p className="mt-1 text-sm text-brand-700">{description}</p>
      {buttonText && onClick ? (
        <button
          onClick={onClick}
          className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
        >
          {buttonText}
        </button>
      ) : null}
    </div>
  );
}

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-brand-700">{subtitle}</p> : null}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 p-2 text-brand-700 transition hover:bg-brand-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>

        {footer ? <div className="border-t border-gray-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function SearchSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: UserOption[];
  placeholder: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.department.toLowerCase().includes(q) ||
        user.designation.toLowerCase().includes(q)
    );
  }, [options, query]);

  const selected = options.find((u) => u.name === value);

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-700">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 transition hover:border-brand-300"
        >
          <span className={selected ? "text-brand-900" : "text-brand-400"}>
            {selected
              ? `${selected.name} • ${selected.department} • ${selected.designation}`
              : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-brand-700" />
        </button>

        {open ? (
          <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search user..."
                className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-3 text-sm text-brand-900 outline-none focus:border-brand-800"
              />
            </div>

            <div className="mt-2 max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-sm text-brand-700">No users found.</div>
              ) : (
                filtered.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      onChange(user.name);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-brand-100"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-sm font-bold text-white">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-900">{user.name}</p>
                      <p className="text-[11px] text-brand-700">
                        {user.department} • {user.designation}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default function DelegationSettings() {
  const [isDelegationFormOpen, setIsDelegationFormOpen] = useState(false);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);

  const [searchDelegatedToMe, setSearchDelegatedToMe] = useState("");
  const [searchHistory, setSearchHistory] = useState("");

  const [activeDelegation, setActiveDelegation] = useState<DelegationRecord | null>({
    id: "DEL-990",
    fromUser: "John Doe",
    toUser: "Sara Ahmed",
    avatar: "SA",
    startDate: "2026-04-20",
    endDate: "2026-04-25",
    types: ["All Types"],
    status: "Active",
    reason: "Vacation coverage",
    notify: true,
  });

  const [delegatedToMe, setDelegatedToMe] = useState<DelegationRecord[]>(INITIAL_DELEGATED_TO_ME);
  const [history, setHistory] = useState<DelegationRecord[]>(INITIAL_HISTORY);
  const [requestsToManager, setRequestsToManager] =
    useState<DelegationRequest[]>(INITIAL_REQUESTS);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState({
    delegateTo: "",
    startDate: "",
    endDate: "",
    typeMode: "all" as "all" | "specific",
    selectedTypes: ["Leave"],
    reason: "",
    notify: true,
  });

  const [requestData, setRequestData] = useState({
    managerName: "",
    startDate: "",
    endDate: "",
    typeMode: "all" as "all" | "specific",
    selectedTypes: ["Leave"],
    reason: "",
  });

  const [formErrors, setFormErrors] = useState<{
    delegateTo?: string;
    startDate?: string;
    endDate?: string;
    selectedTypes?: string;
  }>({});

  const [requestErrors, setRequestErrors] = useState<{
    managerName?: string;
    startDate?: string;
    endDate?: string;
    selectedTypes?: string;
  }>({});

  const stats = useMemo(() => {
    const activeCount = activeDelegation ? 1 : 0;
    const delegatedToMePending = delegatedToMe.filter((item) => item.status === "Pending").length;
    const completedCount = history.filter((item) => item.status === "Completed").length;
    const requestCount = requestsToManager.filter((item) => item.status === "Pending").length;

    return {
      activeCount,
      delegatedToMePending,
      completedCount,
      requestCount,
    };
  }, [activeDelegation, delegatedToMe, history, requestsToManager]);

  const filteredDelegatedToMe = useMemo(() => {
    const q = searchDelegatedToMe.trim().toLowerCase();
    if (!q) return delegatedToMe;

    return delegatedToMe.filter(
      (item) =>
        item.fromUser.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.types.join(" ").toLowerCase().includes(q)
    );
  }, [delegatedToMe, searchDelegatedToMe]);

  const filteredHistory = useMemo(() => {
    const q = searchHistory.trim().toLowerCase();
    if (!q) return history;

    return history.filter(
      (item) =>
        item.toUser.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.types.join(" ").toLowerCase().includes(q)
    );
  }, [history, searchHistory]);

  const handleTypeToggle = (
    type: string,
    mode: "delegation" | "request"
  ) => {
    if (mode === "delegation") {
      setFormData((prev) => ({
        ...prev,
        selectedTypes: prev.selectedTypes.includes(type)
          ? prev.selectedTypes.filter((t) => t !== type)
          : [...prev.selectedTypes, type],
      }));
      return;
    }

    setRequestData((prev) => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter((t) => t !== type)
        : [...prev.selectedTypes, type],
    }));
  };

  const resetDelegationForm = () => {
    setFormData({
      delegateTo: "",
      startDate: "",
      endDate: "",
      typeMode: "all",
      selectedTypes: ["Leave"],
      reason: "",
      notify: true,
    });
    setFormErrors({});
    setFormMode("create");
  };

  const resetRequestForm = () => {
    setRequestData({
      managerName: "",
      startDate: "",
      endDate: "",
      typeMode: "all",
      selectedTypes: ["Leave"],
      reason: "",
    });
    setRequestErrors({});
  };

  const openCreateForm = () => {
    resetDelegationForm();
    setFormMode("create");
    setIsDelegationFormOpen(true);
  };

  const openEditForm = () => {
    if (!activeDelegation) return;

    setFormMode("edit");
    setFormData({
      delegateTo: activeDelegation.toUser,
      startDate: activeDelegation.startDate,
      endDate: activeDelegation.endDate,
      typeMode: activeDelegation.types.includes("All Types") ? "all" : "specific",
      selectedTypes: activeDelegation.types.includes("All Types") ? ["Leave"] : activeDelegation.types,
      reason: activeDelegation.reason ?? "",
      notify: activeDelegation.notify ?? true,
    });
    setFormErrors({});
    setIsDelegationFormOpen(true);
  };

  const validateDelegationForm = () => {
    const errors: {
      delegateTo?: string;
      startDate?: string;
      endDate?: string;
      selectedTypes?: string;
    } = {};

    if (!formData.delegateTo.trim()) errors.delegateTo = "Delegate is required.";
    if (!formData.startDate) errors.startDate = "Start date is required.";
    if (!formData.endDate) errors.endDate = "End date is required.";

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      errors.endDate = "End date must be after start date.";
    }

    if (formData.typeMode === "specific" && formData.selectedTypes.length === 0) {
      errors.selectedTypes = "Select at least one request type.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRequestForm = () => {
    const errors: {
      managerName?: string;
      startDate?: string;
      endDate?: string;
      selectedTypes?: string;
    } = {};

    if (!requestData.managerName.trim()) errors.managerName = "Manager is required.";
    if (!requestData.startDate) errors.startDate = "Start date is required.";
    if (!requestData.endDate) errors.endDate = "End date is required.";

    if (
      requestData.startDate &&
      requestData.endDate &&
      new Date(requestData.endDate) < new Date(requestData.startDate)
    ) {
      errors.endDate = "End date must be after start date.";
    }

    if (requestData.typeMode === "specific" && requestData.selectedTypes.length === 0) {
      errors.selectedTypes = "Select at least one request type.";
    }

    setRequestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDelegation = () => {
    if (!validateDelegationForm()) return;

    const nextRecord: DelegationRecord = {
      id: formMode === "edit" && activeDelegation ? activeDelegation.id : `DEL-${Date.now()}`,
      fromUser: "John Doe",
      toUser: formData.delegateTo.trim(),
      avatar: getInitials(formData.delegateTo),
      startDate: formData.startDate,
      endDate: formData.endDate,
      types: formData.typeMode === "all" ? ["All Types"] : formData.selectedTypes,
      status: "Active",
      reason: formData.reason.trim(),
      notify: formData.notify,
    };

    if (activeDelegation && formMode === "edit") {
      setHistory((prev) => [
        { ...activeDelegation, status: "Completed", itemsProcessed: activeDelegation.itemsProcessed ?? 0 },
        ...prev,
      ]);
    }

    setActiveDelegation(nextRecord);
    setIsDelegationFormOpen(false);
    resetDelegationForm();
  };

  const handleRequestManagerDelegation = () => {
    if (!validateRequestForm()) return;

    const nextRequest: DelegationRequest = {
      id: `REQ-${Date.now()}`,
      managerName: requestData.managerName.trim(),
      requesterName: "John Doe",
      requesterAvatar: "JD",
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      types: requestData.typeMode === "all" ? ["All Types"] : requestData.selectedTypes,
      reason: requestData.reason.trim(),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    setRequestsToManager((prev) => [nextRequest, ...prev]);
    setIsRequestFormOpen(false);
    resetRequestForm();
  };

  const endDelegationNow = () => {
    if (!activeDelegation) return;

    setHistory((prev) => [
      { ...activeDelegation, status: "Completed", itemsProcessed: activeDelegation.itemsProcessed ?? 0 },
      ...prev,
    ]);
    setActiveDelegation(null);
  };

  const handleDelegatedToMeAction = (id: string, action: "approve" | "decline") => {
    const target = delegatedToMe.find((item) => item.id === id);
    if (!target) return;

    const updatedStatus: DelegationStatus = action === "approve" ? "Active" : "Declined";

    setDelegatedToMe((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: updatedStatus } : item))
    );

    setHistory((prev) => [
      {
        ...target,
        status: updatedStatus === "Active" ? "Completed" : "Declined",
        itemsProcessed: updatedStatus === "Active" ? 0 : undefined,
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Delegation Settings</h1>
            <p className="mt-1 text-sm text-brand-700">
              Assign your approval authority when you are away and request delegation from your manager.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                resetDelegationForm();
                resetRequestForm();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>

            <button
              onClick={() => {
                resetRequestForm();
                setIsRequestFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <Send className="h-4 w-4" />
              Request My Manager
            </button>

            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <UserPlus className="h-4 w-4" />
              Set Up Delegation
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Delegation"
            value={stats.activeCount}
            subtitle="Current delegation rules"
            icon={<ShieldCheck className="h-5 w-5" />}
            tone="success"
          />
          <StatCard
            title="Delegated To Me"
            value={stats.delegatedToMePending}
            subtitle="Awaiting my response"
            icon={<Users className="h-5 w-5" />}
            tone="warning"
          />
          <StatCard
            title="My Requests"
            value={stats.requestCount}
            subtitle="Pending manager actions"
            icon={<Send className="h-5 w-5" />}
          />
          <StatCard
            title="Completed Cycles"
            value={stats.completedCount}
            subtitle="Historical delegation records"
            icon={<History className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-brand-700" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  My Delegations
                </h2>
              </div>

              {activeDelegation ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-800 text-lg font-bold text-white">
                        {activeDelegation.avatar}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-brand-900">
                            Delegated to {activeDelegation.toUser}
                          </h3>
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Live Status: Active
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-brand-700">
                          {formatDate(activeDelegation.startDate)} — {formatDate(activeDelegation.endDate)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeDelegation.types.map((type) => (
                            <span
                              key={type}
                              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-brand-800"
                            >
                              {type}
                            </span>
                          ))}
                        </div>

                        {activeDelegation.reason ? (
                          <p className="mt-3 text-sm text-brand-700">
                            <span className="font-semibold text-brand-900">Reason:</span>{" "}
                            {activeDelegation.reason}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={openEditForm}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                      >
                        <Pencil className="h-4 w-4" />
                        Modify
                      </button>
                      <button
                        onClick={endDelegationNow}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        End Now
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-2 text-amber-700">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <p className="text-sm">
                        Approvals received during this period will automatically appear in{" "}
                        <span className="font-semibold">{activeDelegation.toUser}</span>'s inbox.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No active delegations"
                  description="You are currently processing all your own approvals."
                  buttonText="Set up delegation"
                  onClick={openCreateForm}
                  icon={<UserPlus className="h-5 w-5" />}
                />
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-brand-700" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  My Manager Delegation Requests
                </h2>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className="border-b border-gray-200 bg-white">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Manager
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Date Range
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Types
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Status
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Requested At
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {requestsToManager.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center">
                            <p className="text-sm text-brand-700">No delegation requests submitted yet.</p>
                          </td>
                        </tr>
                      ) : (
                        requestsToManager.map((request) => (
                          <tr key={request.id} className="transition hover:bg-brand-100">
                            <td className="px-5 py-4">
                              <div>
                                <p className="text-sm font-semibold text-brand-900">{request.managerName}</p>
                                <p className="text-[11px] text-brand-700">{request.id}</p>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-brand-700">
                              {formatDate(request.startDate)} to {formatDate(request.endDate)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                {request.types.map((type) => (
                                  <span
                                    key={type}
                                    className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[11px] text-brand-800"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusPill(
                                  request.status
                                )}`}
                              >
                                {request.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-brand-700">
                              {formatDateTime(request.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-700" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Delegated To Me
                  </h2>
                </div>

                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    value={searchDelegatedToMe}
                    onChange={(e) => setSearchDelegatedToMe(e.target.value)}
                    placeholder="Search records..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className="border-b border-gray-200 bg-white">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          From Approver
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Date Range
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Types
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Status
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredDelegatedToMe.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center">
                            <p className="text-sm text-brand-700">No delegated records found.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredDelegatedToMe.map((delegation) => (
                          <tr key={delegation.id} className="transition hover:bg-brand-100">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-sm font-bold text-white">
                                  {delegation.avatar}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-brand-900">
                                    {delegation.fromUser}
                                  </p>
                                  <p className="text-[11px] text-brand-700">{delegation.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-brand-700">
                              {formatDate(delegation.startDate)} to {formatDate(delegation.endDate)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                {delegation.types.map((type) => (
                                  <span
                                    key={type}
                                    className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[11px] text-brand-800"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusPill(
                                  delegation.status
                                )}`}
                              >
                                {delegation.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDelegatedToMeAction(delegation.id, "approve")}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelegatedToMeAction(delegation.id, "decline")}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                                  title="Decline"
                                >
                                  <X className="h-4 w-4" />
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
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-brand-700" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Delegation History
                  </h2>
                </div>

                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    value={searchHistory}
                    onChange={(e) => setSearchHistory(e.target.value)}
                    placeholder="Search history..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className="border-b border-gray-200 bg-white">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Date Range
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Delegate
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Items Processed
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center">
                            <p className="text-sm text-brand-700">No historical records found.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((delegation) => (
                          <tr key={delegation.id} className="transition hover:bg-brand-100">
                            <td className="px-5 py-4 text-sm text-brand-700">
                              {formatDate(delegation.startDate)} - {formatDate(delegation.endDate)}
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                              {delegation.toUser}
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                              {delegation.itemsProcessed ?? 0}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusPill(
                                  delegation.status
                                )}`}
                              >
                                {delegation.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Delegation Logic
              </h2>

              <div className="mt-5 space-y-5">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-brand-700">
                    <span className="font-semibold text-brand-900">Final Authority:</span>{" "}
                    delegated decisions are recorded as processed on behalf of the original approver.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Clock className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-brand-700">
                    <span className="font-semibold text-brand-900">Duration:</span>{" "}
                    delegations automatically expire at 11:59 PM on the selected end date.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Mail className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-brand-700">
                    <span className="font-semibold text-brand-900">Visibility:</span>{" "}
                    your manager may be notified when delegation is configured or requested.
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-5 text-center">
                <button className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 transition hover:text-brand-900">
                  View Full Policy <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-brand-800 p-6 text-white shadow-sm">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Need a long-term proxy?</h3>
                <p className="text-sm text-white/80">
                  For permanent approval authority changes, please contact the HR System Administrator.
                </p>
                <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100">
                  Contact Admin
                </button>
              </div>
            </div>
          </div>
        </div>

        <ModalShell
          open={isDelegationFormOpen}
          onClose={() => setIsDelegationFormOpen(false)}
          title={formMode === "edit" ? "Modify Delegation" : "New Delegation"}
          subtitle="Assign your approval tasks to another approver."
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDelegationFormOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDelegation}
                className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                Save Delegation
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <SearchSelect
              label="Delegate To *"
              value={formData.delegateTo}
              onChange={(val) => setFormData((prev) => ({ ...prev, delegateTo: val }))}
              options={USERS}
              placeholder="Search and select delegate..."
              error={formErrors.delegateTo}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-700">
                  From Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
                {formErrors.startDate ? <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-700">
                  To Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
                {formErrors.endDate ? <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p> : null}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-brand-700">
                Request Types
              </label>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-brand-900">
                  <input
                    type="radio"
                    checked={formData.typeMode === "all"}
                    onChange={() => setFormData((prev) => ({ ...prev, typeMode: "all" }))}
                    className="h-4 w-4 text-brand-800 focus:ring-brand-800"
                  />
                  All Request Types
                </label>

                <label className="flex items-center gap-3 text-sm text-brand-900">
                  <input
                    type="radio"
                    checked={formData.typeMode === "specific"}
                    onChange={() => setFormData((prev) => ({ ...prev, typeMode: "specific" }))}
                    className="h-4 w-4 text-brand-800 focus:ring-brand-800"
                  />
                  Specific Types
                </label>
              </div>

              {formData.typeMode === "specific" ? (
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4">
                  {REQUEST_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm text-brand-900">
                      <input
                        type="checkbox"
                        checked={formData.selectedTypes.includes(type)}
                        onChange={() => handleTypeToggle(type, "delegation")}
                        className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              ) : null}

              {formErrors.selectedTypes ? (
                <p className="mt-1 text-sm text-red-600">{formErrors.selectedTypes}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-700">
                Reason
              </label>
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Vacation, conference, travel, or other context..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
              />
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-sm text-brand-900">
              <input
                type="checkbox"
                checked={formData.notify}
                onChange={(e) => setFormData((prev) => ({ ...prev, notify: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
              />
              Notify delegate via email/app
            </label>
          </div>
        </ModalShell>

        <ModalShell
          open={isRequestFormOpen}
          onClose={() => setIsRequestFormOpen(false)}
          title="Request Manager Delegation"
          subtitle="Ask your manager to delegate approvals to you for a selected period."
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsRequestFormOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestManagerDelegation}
                className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                Send Request
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <SearchSelect
              label="Manager *"
              value={requestData.managerName}
              onChange={(val) => setRequestData((prev) => ({ ...prev, managerName: val }))}
              options={USERS}
              placeholder="Search and select manager..."
              error={requestErrors.managerName}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-700">
                  From Date
                </label>
                <input
                  type="date"
                  value={requestData.startDate}
                  onChange={(e) => setRequestData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
                {requestErrors.startDate ? <p className="mt-1 text-sm text-red-600">{requestErrors.startDate}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-700">
                  To Date
                </label>
                <input
                  type="date"
                  value={requestData.endDate}
                  onChange={(e) => setRequestData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                />
                {requestErrors.endDate ? <p className="mt-1 text-sm text-red-600">{requestErrors.endDate}</p> : null}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-brand-700">
                Request Types
              </label>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-brand-900">
                  <input
                    type="radio"
                    checked={requestData.typeMode === "all"}
                    onChange={() => setRequestData((prev) => ({ ...prev, typeMode: "all" }))}
                    className="h-4 w-4 text-brand-800 focus:ring-brand-800"
                  />
                  All Request Types
                </label>

                <label className="flex items-center gap-3 text-sm text-brand-900">
                  <input
                    type="radio"
                    checked={requestData.typeMode === "specific"}
                    onChange={() => setRequestData((prev) => ({ ...prev, typeMode: "specific" }))}
                    className="h-4 w-4 text-brand-800 focus:ring-brand-800"
                  />
                  Specific Types
                </label>
              </div>

              {requestData.typeMode === "specific" ? (
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4">
                  {REQUEST_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm text-brand-900">
                      <input
                        type="checkbox"
                        checked={requestData.selectedTypes.includes(type)}
                        onChange={() => handleTypeToggle(type, "request")}
                        className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              ) : null}

              {requestErrors.selectedTypes ? (
                <p className="mt-1 text-sm text-red-600">{requestErrors.selectedTypes}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-700">
                Request Reason
              </label>
              <textarea
                rows={3}
                value={requestData.reason}
                onChange={(e) => setRequestData((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why your manager should delegate approvals to you..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
              />
            </div>
          </div>
        </ModalShell>
      </div>
    </div>
  );
}