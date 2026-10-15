"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Users,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Sliders,
  Database,
  Info,
  Plus,
  Building,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckSquare,
  Layers3,
  Save,
  AlertTriangle,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

interface EmployeeAssignment {
  id: string;
  name: string;
  avatar: string;
  dept: string;
  grade: string;
  joinDate: string;
  group: string;
  overrides: number;
  status: "Complete" | "Incomplete";
}

const INITIAL_ASSIGNMENTS: EmployeeAssignment[] = Array.from({ length: 50 }, (_, i) => ({
  id: `EMP-${1000 + i}`,
  name: ["Ahmed Khan", "Sara Miller", "Tom Chen", "Anna Bell", "Zoya Malik", "Ali Raza"][i % 6],
  avatar: ["AK", "SM", "TC", "AB", "ZM", "AR"][i % 6],
  dept: ["Engineering", "Product", "Sales", "HR", "Design"][i % 5],
  grade: ["L1", "L2", "L3", "M1", "M2"][i % 5],
  joinDate: "Jan 15, 2022",
  group: i % 4 === 0 ? "Default" : i % 3 === 0 ? "Management Tier" : "Standard Full-Time",
  overrides: i % 7 === 0 ? 2 : 0,
  status: i % 10 === 0 ? "Incomplete" : "Complete",
}));

const PAGE_SIZE_DEFAULT = 10;

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

export default function EmployeeLeaveAssignments() {
  const [assignments, setAssignments] = useState<EmployeeAssignment[]>(INITIAL_ASSIGNMENTS);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [assignmentFilter, setAssignmentFilter] = useState("All Employees");

  const [selectedEmp, setSelectedEmp] = useState<EmployeeAssignment | null>(null);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDept, setBulkDept] = useState("All Departments");
  const [bulkGrade, setBulkGrade] = useState("All Grades");
  const [bulkTargetGroup, setBulkTargetGroup] = useState("Standard Full-Time");
  const [bulkEffectiveDate, setBulkEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const departments = ["All Departments", "Engineering", "Product", "Sales", "HR", "Design"];
  const assignmentFilters = [
    "All Employees",
    "Unassigned Only",
    "With Overrides",
    "Incomplete Settings",
  ];
  const groupOptions = ["Default", "Standard Full-Time", "Management Tier", "Executive Staff"];
  const gradeOptions = ["All Grades", "L1 - L3", "Managers"];

  const stats = useMemo(() => {
    return {
      total: assignments.length,
      complete: assignments.filter((a) => a.status === "Complete").length,
      incomplete: assignments.filter((a) => a.status === "Incomplete").length,
      overrides: assignments.filter((a) => a.overrides > 0).length,
    };
  }, [assignments]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return assignments.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.group.toLowerCase().includes(q);

      const matchesDept =
        departmentFilter === "All Departments" || emp.dept === departmentFilter;

      const matchesAssignment =
        assignmentFilter === "All Employees" ||
        (assignmentFilter === "Unassigned Only" && emp.group === "Default") ||
        (assignmentFilter === "With Overrides" && emp.overrides > 0) ||
        (assignmentFilter === "Incomplete Settings" && emp.status === "Incomplete");

      return matchesSearch && matchesDept && matchesAssignment;
    });
  }, [assignments, search, departmentFilter, assignmentFilter]);

  const bulkFilteredEmployees = useMemo(() => {
    return assignments.filter((emp) => {
      const matchesDept = bulkDept === "All Departments" || emp.dept === bulkDept;
      const matchesGrade =
        bulkGrade === "All Grades" ||
        (bulkGrade === "L1 - L3" && ["L1", "L2", "L3"].includes(emp.grade)) ||
        (bulkGrade === "Managers" && ["M1", "M2"].includes(emp.grade));

      return matchesDept && matchesGrade;
    });
  }, [assignments, bulkDept, bulkGrade]);

  const totalEntries = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);
  const showingFrom = totalEntries > 0 ? startIndex + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(startIndex + pageSize, totalEntries) : 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = (id: string) => {
    setAssignments((prev) => prev.filter((emp) => emp.id !== id));
    if (selectedEmp?.id === id) setSelectedEmp(null);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleSaveSelectedEmployee = () => {
    if (!selectedEmp) return;

    setAssignments((prev) =>
      prev.map((emp) => (emp.id === selectedEmp.id ? selectedEmp : emp))
    );
    setSelectedEmp(null);
  };

  const handleBulkNext = () => {
    if (bulkStep === 1 && selectedIds.length === 0) return;

    if (bulkStep < 3) {
      setBulkStep((prev) => prev + 1);
      return;
    }

    setAssignments((prev) =>
      prev.map((emp) =>
        selectedIds.includes(emp.id)
          ? {
              ...emp,
              group: bulkTargetGroup,
              overrides: 0,
              status: "Complete",
            }
          : emp
      )
    );

    setIsBulkModalOpen(false);
    setBulkStep(1);
    setSelectedIds([]);
    setBulkDept("All Departments");
    setBulkGrade("All Grades");
    setBulkTargetGroup("Standard Full-Time");
  };

  const handleBulkBack = () => {
    setBulkStep((prev) => Math.max(1, prev - 1));
  };

  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("All Departments");
    setAssignmentFilter("All Employees");
    setPage(1);
  };

  React.useEffect(() => {
    setPage(1);
  }, [search, departmentFilter, assignmentFilter, pageSize]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Leave Assignments</h1>
            <p className="mt-1 text-sm text-brand-700">
              Manage group eligibility and individual policy overrides for all staff.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100">
              <Download className="h-4 w-4" />
              Export
            </button>

            <button
              onClick={() => {
                setBulkStep(1);
                setSelectedIds([]);
                setIsBulkModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <CheckSquare className="h-4 w-4" />
              Bulk Assign
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Staff"
            value={stats.total}
            subtitle="Employee assignment records"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Complete"
            value={stats.complete}
            subtitle="Assignments fully configured"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Incomplete"
            value={stats.incomplete}
            subtitle="Require review or setup"
            icon={<AlertCircle className="h-5 w-5" />}
          />
          <StatCard
            title="Overrides"
            value={stats.overrides}
            subtitle="Employees with custom settings"
            icon={<Sliders className="h-5 w-5" />}
          />
        </div>

        {/* Main table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search by name, Employee ID, or group..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {departments.map((dept) => (
                    <option key={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {assignmentFilters.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>

                <button
                  onClick={resetFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>

                <button className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-brand-800 transition hover:bg-brand-100">
                  <Filter className="h-4 w-4" />
                </button>
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
                  <span className="font-semibold text-brand-900">{stats.complete}</span> Complete
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{stats.incomplete}</span>{" "}
                  Incomplete
                </span>
                <span className="h-3 w-px bg-brand-200" />
                <span>
                  <span className="font-semibold text-brand-900">{stats.overrides}</span> Overrides
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Dept / Grade
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Eligibility Group
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Custom Settings
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedData.length > 0 ? (
                  paginatedData.map((emp) => (
                    <tr
                      key={emp.id}
                      className="cursor-pointer transition hover:bg-brand-100"
                      onClick={() => setSelectedEmp(emp)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                            {emp.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-900">{emp.name}</p>
                            <p className="text-[11px] text-brand-700">{emp.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-brand-900">{emp.dept}</p>
                        <p className="text-[11px] uppercase tracking-wider text-brand-700">
                          {emp.grade}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            emp.group === "Default"
                              ? "border-gray-200 bg-gray-50 text-gray-700"
                              : "border-brand-200 bg-brand-50 text-brand-800"
                          }`}
                        >
                          {emp.group}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {emp.overrides > 0 ? (
                          <div className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
                            <Sliders className="h-4 w-4" />
                            +{emp.overrides} overrides
                          </div>
                        ) : (
                          <span className="text-sm italic text-brand-400">None</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            emp.status === "Complete"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {emp.status === "Complete" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          {emp.status}
                        </span>
                      </td>

                      <td
                        className="px-5 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedEmp(emp)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
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
                          No employee assignments found
                        </h3>
                        <p className="mt-1 text-sm text-brand-700">
                          Try changing your filters or search terms.
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

        {/* Edit Drawer */}
        {selectedEmp ? (
          <div className="fixed inset-0 z-[100] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedEmp(null)}
            />
            <div className="absolute right-0 top-0 flex h-full w-full max-w-[650px] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white p-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-800 text-white">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-900">
                      Manage Assignments
                    </h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      {selectedEmp.name} • {selectedEmp.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEmp(null)}
                  className="rounded-lg border border-gray-200 p-2 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Department
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
                      <Building className="h-4 w-4 text-brand-700" />
                      {selectedEmp.dept}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Grade / Level
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
                      <Layers3 className="h-4 w-4 text-brand-700" />
                      {selectedEmp.grade}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Join Date
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
                      <Calendar className="h-4 w-4 text-brand-700" />
                      {selectedEmp.joinDate}
                    </p>
                  </div>
                </div>

                <section className="space-y-4">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    <ShieldCheck className="h-4 w-4" />
                    Eligibility Group
                  </label>

                  <div className="space-y-3">
                    <select
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-brand-900 outline-none focus:border-brand-800"
                      value={selectedEmp.group}
                      onChange={(e) =>
                        setSelectedEmp((prev) =>
                          prev ? { ...prev, group: e.target.value } : prev
                        )
                      }
                    >
                      {groupOptions.map((group) => (
                        <option key={group}>{group}</option>
                      ))}
                    </select>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-start gap-2 text-emerald-700">
                        <Info className="mt-0.5 h-4 w-4" />
                        <p className="text-sm">
                          Includes: Annual Leave (14d), Sick (12d), Casual (10d), Comp-Off
                          (Manual)
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                      <Sliders className="h-4 w-4" />
                      Custom Overrides
                    </label>

                    <button
                      onClick={() =>
                        setSelectedEmp((prev) =>
                          prev ? { ...prev, overrides: prev.overrides + 1 } : prev
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand-800 transition hover:text-brand-900"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Override
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left">
                      <thead className="border-b border-gray-200 bg-white">
                        <tr>
                          <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Leave Type
                          </th>
                          <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Group Value
                          </th>
                          <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                            Override
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                            Annual Leave
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-700">14.0 days</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className="h-9 w-20 rounded-lg border border-gray-200 px-3 text-sm font-medium text-brand-900 outline-none focus:border-brand-800"
                                defaultValue={selectedEmp.overrides > 0 ? 16 : 14}
                              />
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                                Days
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                            Sick Leave
                          </td>
                          <td className="px-5 py-4 text-sm text-brand-700">12.0 days</td>
                          <td className="px-5 py-4">
                            <button className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[11px] font-semibold text-brand-800 transition hover:bg-brand-100">
                              Create Override
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                        Audit Tracking
                      </p>
                      <p className="mt-2 text-sm leading-6 text-amber-700">
                        Changes to assignments are tracked. Effective date for new settings
                        will be the next system cycle unless forced manually.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 bg-white p-6 shrink-0">
                <button
                  onClick={() => setSelectedEmp(null)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveSelectedEmployee}
                  className="inline-flex flex-[2] items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Bulk Assign Modal */}
        {isBulkModalOpen ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsBulkModalOpen(false)}
            />
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="bg-brand-800 p-6 text-white shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <CheckSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Bulk Leave Assignment</h3>
                      <p className="mt-1 text-sm text-white/80">
                        Process multiple employees simultaneously.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsBulkModalOpen(false)}
                    className="rounded-lg border border-white/10 p-2 text-white transition hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="border-b border-gray-200 px-6 py-4 shrink-0">
                <div className="flex justify-center gap-8">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`flex items-center gap-3 ${
                        bulkStep === step ? "text-brand-900" : "text-brand-300"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                          bulkStep === step
                            ? "border-brand-800 bg-brand-50 text-brand-900"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {step}
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {step === 1 ? "Select" : step === 2 ? "Assign" : "Confirm"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {bulkStep === 1 ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Department Filter
                        </p>
                        <select
                          value={bulkDept}
                          onChange={(e) => setBulkDept(e.target.value)}
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                        >
                          {departments.map((dept) => (
                            <option key={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Grade Filter
                        </p>
                        <select
                          value={bulkGrade}
                          onChange={(e) => setBulkGrade(e.target.value)}
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-brand-900 outline-none focus:border-brand-800"
                        >
                          {gradeOptions.map((grade) => (
                            <option key={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200">
                      {bulkFilteredEmployees.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex cursor-pointer items-center justify-between border-b border-gray-200 px-4 py-4 last:border-b-0 hover:bg-brand-100"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(emp.id)}
                              onChange={() => toggleSelect(emp.id)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                            />

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-800">
                              {emp.avatar}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-brand-900">{emp.name}</p>
                              <p className="text-[11px] text-brand-700">
                                {emp.id} • {emp.dept}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-medium text-brand-700">
                            {emp.group}
                          </span>
                        </label>
                      ))}

                      {bulkFilteredEmployees.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-brand-700">
                          No employees match the current filters.
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
                      <p className="text-sm font-semibold text-brand-900">
                        {selectedIds.length} staff selected
                      </p>
                    </div>
                  </div>
                ) : null}

                {bulkStep === 2 ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Target Eligibility Group *
                      </label>
                      <select
                        value={bulkTargetGroup}
                        onChange={(e) => setBulkTargetGroup(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium text-brand-900 outline-none focus:border-brand-800"
                      >
                        {groupOptions.map((group) => (
                          <option key={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Effective From *
                      </label>
                      <input
                        type="date"
                        value={bulkEffectiveDate}
                        onChange={(e) => setBulkEffectiveDate(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium text-brand-900 outline-none focus:border-brand-800"
                      />
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                        <p className="text-sm leading-6 text-amber-700">
                          Bulk assignment will <span className="font-semibold">reset existing individual overrides</span> for the selected employees unless handled separately.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {bulkStep === 3 ? (
                  <div className="space-y-6 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>

                    <div>
                      <h4 className="text-2xl font-semibold text-brand-900">
                        Ready to Process
                      </h4>
                      <p className="mt-1 text-sm text-brand-700">
                        Review the details below before confirming.
                      </p>
                    </div>

                    <div className="grid gap-4 text-left md:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Target Group
                        </p>
                        <p className="mt-2 text-sm font-semibold text-brand-900">
                          {bulkTargetGroup}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Staff Impacted
                        </p>
                        <p className="mt-2 text-sm font-semibold text-brand-900">
                          {selectedIds.length} Employees
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3 border-t border-gray-200 bg-white p-6 shrink-0">
                {bulkStep > 1 ? (
                  <button
                    onClick={handleBulkBack}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                  >
                    Back
                  </button>
                ) : null}

                <button
                  onClick={handleBulkNext}
                  disabled={bulkStep === 1 && selectedIds.length === 0}
                  className="flex-1 rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkStep === 3 ? "Confirm Assignment" : "Next Step"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}