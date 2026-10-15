"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Users,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Layers3,
  CheckCircle2,
} from "lucide-react";
import  EligibilityGroupForm  from "@/components/leaveease/EligibilityGroupForm";

/** ---------------- Types ---------------- */

export type EligibilityGroup = {
  id: string;
  name: string;
  description?: string;
  priority: number;
  criteria: {
    employmentTypes: string[];
    grades: string[];
    gradeRange: { from: string; to: string };
    departments: string[];
    locations: string[];
    gender: "Any" | "Male" | "Female";
    minTenure: number;
    probationStatus: "Include" | "Exclude" | "Only Probation";
  };
  leaveTypes: string[];
  allTypes: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "eligibility_groups_v1";
const DEFAULT_PAGE_SIZE = 10;

const uid = () => `EG-${Math.floor(100000 + Math.random() * 900000)}`;

/** ---------------- Seed ---------------- */

const seedGroups = (): EligibilityGroup[] => [
  {
    id: uid(),
    name: "HQ Permanent Staff",
    description: "For permanent HQ employees across core departments.",
    priority: 1,
    criteria: {
      employmentTypes: ["Permanent"],
      grades: [],
      gradeRange: { from: "L1", to: "L5" },
      departments: ["Engineering", "Product"],
      locations: ["HQ"],
      gender: "Any",
      minTenure: 0,
      probationStatus: "Include",
    },
    leaveTypes: ["ANNUAL", "CASUAL", "SICK"],
    allTypes: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uid(),
    name: "Contractors (Limited)",
    description: "Contract staff: only sick + casual.",
    priority: 2,
    criteria: {
      employmentTypes: ["Contract"],
      grades: [],
      gradeRange: { from: "L1", to: "L7" },
      departments: [],
      locations: [],
      gender: "Any",
      minTenure: 0,
      probationStatus: "Include",
    },
    leaveTypes: ["CASUAL", "SICK"],
    allTypes: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** ---------------- Storage helpers ---------------- */

function loadGroups(): EligibilityGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedGroups();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedGroups();
    return parsed;
  } catch {
    return seedGroups();
  }
}

function saveGroups(groups: EligibilityGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

/** ---------------- Confirm Dialog ---------------- */

function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-5">
          <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
          <p className="mt-1 text-sm text-brand-700">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/** ---------------- Small UI helpers ---------------- */

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-brand-900">{value}</p>
          <p className="mt-1 text-sm text-brand-700">{subtitle}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

/** ---------------- Page ---------------- */

export default function EligibilityGroupsPage() {
  const [groups, setGroups] = useState<EligibilityGroup[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "name" | "updatedAt">("priority");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EligibilityGroup | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const initial = loadGroups();
    setGroups(initial);
  }, []);

  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...groups];

    if (q) {
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.description || "").toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q)
      );
    }

    if (sortBy === "priority") list.sort((a, b) => a.priority - b.priority);
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "updatedAt") list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return list;
  }, [groups, search, sortBy]);

  const overlapsWarning = useMemo(() => {
    const seen = new Set<number>();
    for (const g of groups) {
      if (seen.has(g.priority)) return true;
      seen.add(g.priority);
    }
    return false;
  }, [groups]);

  const stats = useMemo(() => {
    const allTypesGroups = groups.filter((g) => g.allTypes).length;
    const limitedGroups = groups.filter((g) => !g.allTypes).length;
    const departmentsCovered = new Set(
      groups.flatMap((g) => g.criteria.departments)
    ).size;

    return {
      total: groups.length,
      allTypesGroups,
      limitedGroups,
      departmentsCovered,
    };
  }, [groups]);

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);
  const showingFrom = totalEntries > 0 ? startIndex + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(startIndex + pageSize, totalEntries) : 0;

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, pageSize]);

  /** CRUD */

  const onCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const onEdit = (group: EligibilityGroup) => {
    setEditing(group);
    setModalOpen(true);
  };

  const onSave = (payload: Omit<EligibilityGroup, "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();

    setGroups((prev) => {
      const exists = prev.some((x) => x.id === payload.id);

      if (exists) {
        return prev.map((x) =>
          x.id === payload.id ? { ...payload, createdAt: x.createdAt, updatedAt: now } : x
        );
      }

      return [{ ...payload, createdAt: now, updatedAt: now }, ...prev];
    });

    setModalOpen(false);
    setEditing(null);
  };

  const onDelete = (id: string) => setDeleteId(id);

  const confirmDelete = () => {
    if (!deleteId) return;
    setGroups((prev) => prev.filter((x) => x.id !== deleteId));
    setDeleteId(null);
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = seedGroups();
    setGroups(fresh);
    setSearch("");
    setSortBy("priority");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-brand-800" />
              <h1 className="text-2xl font-bold text-brand-900">Eligibility Groups</h1>
            </div>
            <p className="mt-1 text-sm text-brand-700">
              Create groups and assign leave type eligibility based on criteria.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={resetDemoData}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Demo Data
            </button>

            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Groups"
            value={stats.total}
            subtitle="Configured eligibility segments"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="All-Type Groups"
            value={stats.allTypesGroups}
            subtitle="Access to all leave types"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Limited Groups"
            value={stats.limitedGroups}
            subtitle="Restricted leave access"
            icon={<Layers3 className="h-5 w-5" />}
          />
          <StatCard
            title="Departments Covered"
            value={stats.departmentsCovered}
            subtitle="Distinct department mappings"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </div>

        {/* Toolbar */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-700"
              />
              <input
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                placeholder="Search by name, description, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "priority" | "name" | "updatedAt")
                }
              >
                <option value="priority">Sort: Priority</option>
                <option value="name">Sort: Name</option>
                <option value="updatedAt">Sort: Updated</option>
              </select>

              <select
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-brand-700">
              Showing <span className="font-semibold text-brand-900">{showingFrom}</span> to{" "}
              <span className="font-semibold text-brand-900">{showingTo}</span> of{" "}
              <span className="font-semibold text-brand-900">{totalEntries}</span> entries
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
              <span>
                <span className="font-semibold text-brand-900">{stats.total}</span> Total
              </span>
              <span className="h-3 w-px bg-brand-200" />
              <span>
                <span className="font-semibold text-brand-900">{stats.allTypesGroups}</span>{" "}
                All Types
              </span>
              <span className="h-3 w-px bg-brand-200" />
              <span>
                <span className="font-semibold text-brand-900">{stats.limitedGroups}</span>{" "}
                Limited
              </span>
            </div>
          </div>
        </div>

        {/* Warning */}
        {overlapsWarning ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Priority overlaps detected
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Two or more groups share the same priority. Resolve this to keep
                  deterministic matching.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Group
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Priority
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Criteria
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Leave Types
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Updated
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {paginated.length > 0 ? (
                  paginated.map((g) => (
                    <tr key={g.id} className="transition hover:bg-brand-100">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-sm">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-brand-900">
                              {g.name}
                            </p>
                            <p className="truncate text-[11px] text-brand-700">
                              {g.id}
                              {g.description ? ` • ${g.description}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
                          {g.priority}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-brand-700">
                        <div className="space-y-1">
                          <div>
                            <span className="font-semibold text-brand-900">Employment:</span>{" "}
                            {g.criteria.employmentTypes.length
                              ? g.criteria.employmentTypes.join(", ")
                              : "Any"}
                          </div>
                          <div>
                            <span className="font-semibold text-brand-900">Grade:</span>{" "}
                            {g.criteria.gradeRange.from} → {g.criteria.gradeRange.to}
                          </div>
                          <div>
                            <span className="font-semibold text-brand-900">Gender:</span>{" "}
                            {g.criteria.gender}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {g.allTypes ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            ALL TYPES
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {g.leaveTypes.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-brand-800"
                              >
                                {t}
                              </span>
                            ))}
                            {g.leaveTypes.length > 3 ? (
                              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                                +{g.leaveTypes.length - 3} more
                              </span>
                            ) : null}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-brand-700">
                        {new Date(g.updatedAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(g)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(g.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                          <Users className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-brand-900">
                          No eligibility groups found
                        </h3>
                        <p className="mt-1 text-sm text-brand-700">
                          Try clearing the search or create a new group.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalEntries > 0 ? (
            <div className="border-t border-gray-200 px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-brand-700">
                  Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-brand-900">{totalPages}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNumber: number;

                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                          currentPage === pageNumber
                            ? "border-brand-800 bg-brand-800 text-white"
                            : "border-gray-200 text-brand-800 hover:bg-brand-100"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-brand-700">
                  <span className="font-semibold text-brand-900">{showingFrom}</span> –{" "}
                  <span className="font-semibold text-brand-900">{showingTo}</span> of{" "}
                  <span className="font-semibold text-brand-900">{totalEntries}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal: Create/Edit */}
        <EligibilityGroupForm
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          initialData={editing}
          onSave={onSave}
        />

        {/* Delete confirm */}
        <ConfirmDialog
          open={!!deleteId}
          title="Delete eligibility group?"
          description="This will permanently remove the group from the demo dataset."
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}