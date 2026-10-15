"use client";

import  { useMemo, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  BarChart3,
  List,
  Info,
  ShieldCheck,
} from "lucide-react";

interface RejectionReason {
  code: string;
  label: string;
  description: string;
  requiresComment: boolean;
  usageCount: number;
  isActive: boolean;
}

const DEFAULT_REASONS: RejectionReason[] = [
  {
    code: "COVERAGE",
    label: "Insufficient Coverage",
    description: "Team attendance below required threshold.",
    requiresComment: true,
    usageCount: 142,
    isActive: true,
  },
  {
    code: "WORKLOAD",
    label: "High Workload",
    description: "Critical project deadlines or seasonal peak.",
    requiresComment: true,
    usageCount: 88,
    isActive: true,
  },
  {
    code: "NOTICE",
    label: "Short Notice",
    description: "Request does not meet advance notice policy.",
    requiresComment: false,
    usageCount: 65,
    isActive: true,
  },
  {
    code: "BALANCE",
    label: "Insufficient Balance",
    description: "Requested days exceed available quota.",
    requiresComment: false,
    usageCount: 34,
    isActive: true,
  },
  {
    code: "POLICY",
    label: "Policy Restriction",
    description: "Violation of specific HR leave policies.",
    requiresComment: true,
    usageCount: 12,
    isActive: true,
  },
  {
    code: "BLACKOUT",
    label: "Blackout Period",
    description: "Requested dates fall within a restricted window.",
    requiresComment: false,
    usageCount: 45,
    isActive: true,
  },
  {
    code: "DOCUMENT",
    label: "Missing Documentation",
    description: "Required proof (e.g. medical certificate) not provided.",
    requiresComment: true,
    usageCount: 22,
    isActive: true,
  },
  {
    code: "CONFLICT",
    label: "Schedule Conflict",
    description: "Conflicts with mandatory training or events.",
    requiresComment: true,
    usageCount: 18,
    isActive: true,
  },
  {
    code: "OTHER",
    label: "Other Reason",
    description: "Misc reasons requiring detailed explanation.",
    requiresComment: true,
    usageCount: 156,
    isActive: true,
  },
];

type StatusFilter = "all" | "active" | "inactive";

type ReasonForm = {
  code: string;
  label: string;
  description: string;
  requiresComment: boolean;
  isActive: boolean;
};

const initialForm: ReasonForm = {
  code: "",
  label: "",
  description: "",
  requiresComment: false,
  isActive: true,
};

export default function RejectionReasonCategories() {
  const [reasons, setReasons] = useState<RejectionReason[]>(DEFAULT_REASONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<RejectionReason | null>(null);
  const [form, setForm] = useState<ReasonForm>(initialForm);

  const [deleteCode, setDeleteCode] = useState<string | null>(null);

  const filteredReasons = useMemo(() => {
    const q = search.trim().toLowerCase();

    return reasons.filter((reason) => {
      const matchesSearch =
        !q ||
        reason.code.toLowerCase().includes(q) ||
        reason.label.toLowerCase().includes(q) ||
        reason.description.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && reason.isActive) ||
        (statusFilter === "inactive" && !reason.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [reasons, search, statusFilter]);

  const activeCount = reasons.filter((r) => r.isActive).length;
  const inactiveCount = reasons.filter((r) => !r.isActive).length;

  const topReason = useMemo(() => {
    if (!reasons.length) return null;
    return [...reasons].sort((a, b) => b.usageCount - a.usageCount)[0];
  }, [reasons]);

  const openCreateModal = () => {
    setEditingReason(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (reason: RejectionReason) => {
    setEditingReason(reason);
    setForm({
      code: reason.code,
      label: reason.label,
      description: reason.description,
      requiresComment: reason.requiresComment,
      isActive: reason.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReason(null);
    setForm(initialForm);
  };

  const handleToggleActive = (code: string) => {
    setReasons((prev) =>
      prev.map((r) =>
        r.code === code ? { ...r, isActive: !r.isActive } : r
      )
    );
  };

  const handleSave = () => {
    const code = form.code.trim().toUpperCase();
    const label = form.label.trim();
    const description = form.description.trim();

    if (!code || !label) {
      alert("Code and Label are required.");
      return;
    }

    const duplicate = reasons.some(
      (r) =>
        r.code.toUpperCase() === code &&
        (!editingReason || r.code !== editingReason.code)
    );

    if (duplicate) {
      alert("A rejection reason with this code already exists.");
      return;
    }

    if (editingReason) {
      setReasons((prev) =>
        prev.map((r) =>
          r.code === editingReason.code
            ? {
                ...r,
                code,
                label,
                description,
                requiresComment: form.requiresComment,
                isActive: form.isActive,
              }
            : r
        )
      );
    } else {
      setReasons((prev) => [
        {
          code,
          label,
          description,
          requiresComment: form.requiresComment,
          usageCount: 0,
          isActive: form.isActive,
        },
        ...prev,
      ]);
    }

    closeModal();
  };

  const confirmDelete = () => {
    if (!deleteCode) return;
    setReasons((prev) => prev.filter((r) => r.code !== deleteCode));
    setDeleteCode(null);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Rejection Reasons
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Standardize feedback for rejected leave applications and keep decline reasons consistent.
                </p>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" />
              Add Reason
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <List className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Total Categories
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {reasons.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Active Reasons
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {activeCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Inactive Reasons
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {inactiveCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-800">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Top Reason
                  </div>
                  <div className="mt-1 text-sm font-semibold text-brand-900">
                    {topReason ? topReason.label : "N/A"}
                  </div>
                  {topReason && (
                    <div className="text-[11px] text-brand-700">
                      {topReason.usageCount} times used
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search by code, label, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-700">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              >
                <option value="all">All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="border-b border-gray-200 px-6 py-3">
            <div className="text-sm text-brand-700">
              Showing{" "}
              <span className="font-semibold text-brand-900">
                {filteredReasons.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-brand-900">
                {reasons.length}
              </span>{" "}
              reasons
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Code
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Reason Label
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Description
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Requires Comment
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Usage
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-300/40 bg-white">
                {filteredReasons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <Info className="mx-auto h-8 w-8 text-brand-300" />
                        <div className="mt-3 text-sm font-semibold text-brand-900">
                          No rejection reasons found
                        </div>
                        <div className="mt-1 text-sm text-brand-700">
                          Try changing your search or filter criteria.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReasons.map((reason) => (
                    <tr
                      key={reason.code}
                      className="transition-colors hover:bg-brand-100"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md border border-gray-200 bg-brand-100 px-2.5 py-1 font-mono text-xs font-semibold text-brand-900">
                          {reason.code}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-brand-900">
                          {reason.label}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-xs text-sm text-brand-700">
                          {reason.description}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        {reason.requiresComment ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-sm text-brand-700">No</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="text-sm font-semibold text-brand-900">
                          {reason.usageCount}
                        </div>
                        <div className="text-[11px] text-brand-700">Times</div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(reason.code)}
                          className={`relative inline-flex h-6 w-11 rounded-full transition ${
                            reason.isActive ? "bg-brand-800" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                              reason.isActive ? "left-5" : "left-0.5"
                            }`}
                          />
                        </button>
                        <div className="mt-1 text-[11px] text-brand-700">
                          {reason.isActive ? "Active" : "Inactive"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(reason)}
                            className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            disabled={reason.usageCount > 0}
                            onClick={() => setDeleteCode(reason.code)}
                            className={`rounded-lg border p-2 transition ${
                              reason.usageCount > 0
                                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                : "border-gray-200 bg-white text-red-600 hover:bg-red-50"
                            }`}
                            title={
                              reason.usageCount > 0
                                ? "Cannot delete used reasons"
                                : "Delete"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Info block */}
        <div className="rounded-xl border border-gray-200 bg-brand-900 p-5 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/10 p-2">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Guidance
              </h3>
              <p className="mt-2 text-sm leading-6 text-brand-100">
                Keep rejection reasons short, consistent, and policy-aligned. Use
                “requires comment” for cases where approvers must provide extra
                context.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-brand-900">
                    {editingReason ? "Edit Rejection Reason" : "Add Rejection Reason"}
                  </h3>
                  <p className="text-sm text-brand-700">
                    Configure the code, label, behavior, and status.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-brand-900">
                    Reason Code <span className="text-brand-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. BUDGET_CAP"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 font-mono text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-brand-900">
                    Display Label <span className="text-brand-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    placeholder="e.g. Budgetary Constraint"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-900">
                  Approver Guidance
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Explain when approvers should use this rejection reason..."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <div className="text-sm font-semibold text-brand-900">
                      Requires Comment
                    </div>
                    <div className="text-[11px] text-brand-700">
                      Force approvers to add custom notes.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        requiresComment: !prev.requiresComment,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 rounded-full transition ${
                      form.requiresComment ? "bg-brand-800" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        form.requiresComment ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <div className="text-sm font-semibold text-brand-900">
                      Active Status
                    </div>
                    <div className="text-[11px] text-brand-700">
                      Make this reason available for use.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: !prev.isActive,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 rounded-full transition ${
                      form.isActive ? "bg-brand-800" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        form.isActive ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                {editingReason ? "Update Reason" : "Save Reason"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteCode && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-semibold text-brand-900">
                Delete Rejection Reason?
              </h3>
              <p className="mt-1 text-sm text-brand-700">
                This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-5 text-sm text-brand-700">
              You are about to remove{" "}
              <span className="font-semibold text-brand-900">{deleteCode}</span>.
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteCode(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}