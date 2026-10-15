"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  X,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Info,
  Search,
  Eye,
  Briefcase,
} from "lucide-react";

type AppliesTo = "All" | string[];
type TypesBlocked = "All" | string[];
type PeriodStatus = "Active" | "Upcoming" | "Expired";

interface BlackoutPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  appliesTo: AppliesTo;
  typesBlocked: TypesBlocked;
  allowExceptions: boolean;
  status: PeriodStatus;
  reason: string;
}

interface FormState {
  name: string;
  startDate: string;
  endDate: string;
  departmentMode: "All" | "Selected";
  departments: string[];
  leaveTypeMode: "All" | "Selected";
  leaveTypes: string[];
  allowExceptions: boolean;
  reason: string;
}

const DEPARTMENTS = [
  "Finance",
  "Accounts",
  "Engineering",
  "Product",
  "QA",
  "Logistics",
  "Operations",
  "Sales",
  "HR",
  "Design",
];

const LEAVE_TYPES = [
  "Annual Leave",
  "Casual Leave",
  "Sick Leave",
  "Study Leave",
  "Comp-Off",
  "Maternity Leave",
];

const INITIAL_BLACKOUTS: BlackoutPeriod[] = [
  {
    id: "BK-001",
    name: "Year-End Financial Close",
    startDate: "2024-12-25",
    endDate: "2025-01-05",
    appliesTo: ["Finance", "Accounts"],
    typesBlocked: "All",
    allowExceptions: false,
    status: "Expired",
    reason: "Critical reporting window for annual audit prep.",
  },
  {
    id: "BK-002",
    name: "Annual Strategy Retreat",
    startDate: "2025-02-15",
    endDate: "2025-02-20",
    appliesTo: "All",
    typesBlocked: ["Annual Leave", "Casual Leave"],
    allowExceptions: true,
    status: "Upcoming",
    reason: "Mandatory attendance for all staff planning sessions.",
  },
  {
    id: "BK-003",
    name: "Software Launch Freeze",
    startDate: "2025-03-01",
    endDate: "2025-03-15",
    appliesTo: ["Engineering", "Product", "QA"],
    typesBlocked: "All",
    allowExceptions: true,
    status: "Upcoming",
    reason: "Code freeze period for major v4.0 release.",
  },
  {
    id: "BK-004",
    name: "Warehouse Stock Take",
    startDate: "2025-01-20",
    endDate: "2025-01-22",
    appliesTo: ["Logistics", "Operations"],
    typesBlocked: "All",
    allowExceptions: false,
    status: "Active",
    reason: "Bi-annual inventory verification process.",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getStatusFromDates(startDate: string, endDate: string): PeriodStatus {
  const today = new Date();
  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return "Upcoming";
  if (current < start) return "Upcoming";
  if (current > end) return "Expired";
  return "Active";
}

function getMonthName(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function buildBlackoutId(index: number) {
  return `BK-${String(index + 1).padStart(3, "0")}`;
}

function buildInitialForm(period?: BlackoutPeriod | null): FormState {
  if (!period) {
    return {
      name: "",
      startDate: "",
      endDate: "",
      departmentMode: "All",
      departments: [],
      leaveTypeMode: "All",
      leaveTypes: [],
      allowExceptions: false,
      reason: "",
    };
  }

  return {
    name: period.name,
    startDate: period.startDate,
    endDate: period.endDate,
    departmentMode: period.appliesTo === "All" ? "All" : "Selected",
    departments: period.appliesTo === "All" ? [] : [...period.appliesTo],
    leaveTypeMode: period.typesBlocked === "All" ? "All" : "Selected",
    leaveTypes: period.typesBlocked === "All" ? [] : [...period.typesBlocked],
    allowExceptions: period.allowExceptions,
    reason: period.reason,
  };
}

export default function BlackoutPeriods() {
  const [periods, setPeriods] = useState<BlackoutPeriod[]>(INITIAL_BLACKOUTS);
  const [view, setView] = useState<"calendar" | "list">("list");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BlackoutPeriod | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<BlackoutPeriod | null>(null);

  const [form, setForm] = useState<FormState>(buildInitialForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [calendarYear, setCalendarYear] = useState(2025);
  const [calendarMonth, setCalendarMonth] = useState(1); // Feb 2025 to match sample

  const totalActive = useMemo(
    () => periods.filter((p) => getStatusFromDates(p.startDate, p.endDate) === "Active").length,
    [periods]
  );

  const filteredPeriods = useMemo(() => {
    const q = search.trim().toLowerCase();

    return periods
      .map((period) => ({
        ...period,
        status: getStatusFromDates(period.startDate, period.endDate),
      }))
      .filter((period) => {
        const appliesText =
          period.appliesTo === "All" ? "all" : period.appliesTo.join(" ");
        const typesText =
          period.typesBlocked === "All" ? "all" : period.typesBlocked.join(" ");

        const matchesSearch =
          !q ||
          period.name.toLowerCase().includes(q) ||
          period.id.toLowerCase().includes(q) ||
          period.reason.toLowerCase().includes(q) ||
          appliesText.toLowerCase().includes(q) ||
          typesText.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "All" || period.status === statusFilter;

        return matchesSearch && matchesStatus;
      });
  }, [periods, search, statusFilter]);

  const calendarCells = useMemo(() => {
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);

    const cells: Array<{
      date: Date | null;
      periods: BlackoutPeriod[];
    }> = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ date: null, periods: [] });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarYear, calendarMonth, day);
      const dateString = `${calendarYear}-${pad(calendarMonth + 1)}-${pad(day)}`;

      const dayPeriods = periods.filter((period) => {
        return dateString >= period.startDate && dateString <= period.endDate;
      });

      cells.push({
        date,
        periods: dayPeriods.map((p) => ({
          ...p,
          status: getStatusFromDates(p.startDate, p.endDate),
        })),
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, periods: [] });
    }

    return cells;
  }, [calendarYear, calendarMonth, periods]);

  const openCreateModal = () => {
    setEditingPeriod(null);
    setForm(buildInitialForm());
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (period: BlackoutPeriod) => {
    setEditingPeriod(period);
    setForm(buildInitialForm(period));
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPeriod(null);
    setErrors({});
  };

  const toggleArrayValue = (values: string[], value: string) => {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.startDate) nextErrors.startDate = "Start date is required.";
    if (!form.endDate) nextErrors.endDate = "End date is required.";

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = "End date must be after start date.";
    }

    if (form.departmentMode === "Selected" && form.departments.length === 0) {
      nextErrors.departments = "Select at least one department.";
    }

    if (form.leaveTypeMode === "Selected" && form.leaveTypes.length === 0) {
      nextErrors.leaveTypes = "Select at least one leave type.";
    }

    if (!form.reason.trim()) nextErrors.reason = "Reason is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const payload: BlackoutPeriod = {
      id: editingPeriod ? editingPeriod.id : buildBlackoutId(periods.length),
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      appliesTo:
        form.departmentMode === "All" ? "All" : [...form.departments],
      typesBlocked:
        form.leaveTypeMode === "All" ? "All" : [...form.leaveTypes],
      allowExceptions: form.allowExceptions,
      status: getStatusFromDates(form.startDate, form.endDate),
      reason: form.reason.trim(),
    };

    if (editingPeriod) {
      setPeriods((prev) =>
        prev.map((item) => (item.id === editingPeriod.id ? payload : item))
      );
      if (selectedPeriod?.id === editingPeriod.id) {
        setSelectedPeriod(payload);
      }
    } else {
      setPeriods((prev) => [payload, ...prev]);
    }

    closeModal();
  };

  const handleDelete = (id: string) => {
    setPeriods((prev) => prev.filter((item) => item.id !== id));
    if (selectedPeriod?.id === id) {
      setSelectedPeriod(null);
    }
  };

  const prevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const nextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const getStatusBadgeClasses = (status: PeriodStatus) => {
    switch (status) {
      case "Active":
        return "bg-red-100 text-red-700";
      case "Upcoming":
        return "bg-amber-100 text-amber-700";
      case "Expired":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Blackout Periods
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Prevent leave applications during critical business windows.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setView("calendar")}
                  className={cn(
                    "rounded-md px-3 py-2 transition",
                    view === "calendar"
                      ? "bg-brand-800 text-white"
                      : "text-brand-700 hover:bg-brand-100"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "rounded-md px-3 py-2 transition",
                    view === "list"
                      ? "bg-brand-800 text-white"
                      : "text-brand-700 hover:bg-brand-100"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                Create Blackout
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Total Periods
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {periods.length} configured
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Active
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {totalActive} currently running
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                Exceptions
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                {
                  periods.filter((period) => period.allowExceptions).length
                } periods allow exceptions
              </p>
            </div>
          </div>
        </div>

        {view === "list" ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search blackout name, id, reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
              >
                <option>All</option>
                <option>Active</option>
                <option>Upcoming</option>
                <option>Expired</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm">
                <span className="text-brand-700">Showing </span>
                <span className="font-semibold text-brand-900">
                  {filteredPeriods.length}
                </span>
                <span className="text-brand-700"> blackout periods</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Blackout Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Duration
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Applies To
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Blocked Types
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Exceptions
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Status
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredPeriods.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Briefcase className="h-10 w-10 text-brand-300" />
                          <p className="text-sm font-semibold text-brand-900">
                            No blackout periods found
                          </p>
                          <p className="text-sm text-brand-700">
                            Try adjusting your search or status filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPeriods.map((period) => (
                      <tr key={period.id} className="transition-colors hover:bg-brand-100">
                        <td className="px-5 py-3.5 text-sm">
                          <div>
                            <div className="font-semibold text-brand-900">
                              {period.name}
                            </div>
                            <div className="text-[11px] font-mono text-brand-700">
                              {period.id}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-sm text-brand-700">
                          <div>{formatDate(period.startDate)}</div>
                          <div className="text-[11px]">to {formatDate(period.endDate)}</div>
                        </td>

                        <td className="px-5 py-3.5 text-sm">
                          {period.appliesTo === "All" ? (
                            <span className="inline-flex rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                              All Staff
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {period.appliesTo.map((dept) => (
                                <span
                                  key={dept}
                                  className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-brand-700"
                                >
                                  {dept}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-sm text-brand-700">
                          {period.typesBlocked === "All"
                            ? "All Leave Types"
                            : period.typesBlocked.join(", ")}
                        </td>

                        <td className="px-5 py-3.5 text-center text-sm">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              period.allowExceptions
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {period.allowExceptions ? "Allowed" : "Strict"}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center text-sm">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              getStatusBadgeClasses(period.status)
                            )}
                          >
                            {period.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center text-sm">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedPeriod(period)}
                              className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(period)}
                              className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(period.id)}
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                              title="Delete"
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
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="rounded-lg border border-gray-200 p-2 text-brand-700 transition hover:bg-brand-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <h3 className="text-2xl font-bold text-brand-900">
                  {getMonthName(calendarYear, calendarMonth)}
                </h3>

                <button
                  onClick={nextMonth}
                  className="rounded-lg border border-gray-200 p-2 text-brand-700 transition hover:bg-brand-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-brand-700">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-500" />
                  Strictly Blocked
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-200" />
                  Exceptions Allowed
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-gray-200">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div
                  key={day}
                  className="border-b border-r border-gray-200 bg-gray-50 px-3 py-3 text-center text-xs font-semibold tracking-wider text-brand-700 last:border-r-0"
                >
                  {day}
                </div>
              ))}

              {calendarCells.map((cell, index) => {
                const period = cell.periods[0];
                const hasPeriod = !!period;
                const strict = hasPeriod && !period.allowExceptions;

                return (
                  <div
                    key={index}
                    className={cn(
                      "relative min-h-[112px] border-r border-b border-gray-200 bg-white p-3",
                      index % 7 === 6 && "border-r-0"
                    )}
                  >
                    {cell.date ? (
                      <>
                        <div
                          className={cn(
                            "text-sm font-semibold",
                            hasPeriod ? "text-red-700" : "text-brand-700"
                          )}
                        >
                          {cell.date.getDate()}
                        </div>

                        {hasPeriod && (
                          <>
                            <button
                              onClick={() => setSelectedPeriod(period)}
                              className="mt-2 w-full rounded-md px-2 py-2 text-left text-[11px] font-medium transition hover:bg-red-50"
                            >
                              <div className="line-clamp-2 text-red-700">
                                {period.name}
                              </div>
                            </button>

                            <div
                              className={cn(
                                "absolute inset-x-0 bottom-0 h-1",
                                strict ? "bg-red-500" : "bg-red-200"
                              )}
                            />
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">
                      {editingPeriod ? "Edit Blackout Period" : "New Blackout Period"}
                    </h2>
                    <p className="mt-0.5 text-sm text-brand-700">
                      Configure date-based leave restrictions.
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[72vh] overflow-y-auto p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Name / Reference *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      placeholder="e.g. Year-End Close 2025"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Target Departments
                    </p>

                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            departmentMode: "All",
                            departments: [],
                          }))
                        }
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition",
                          form.departmentMode === "All"
                            ? "bg-brand-800 text-white"
                            : "border border-gray-200 text-brand-700 hover:bg-brand-100"
                        )}
                      >
                        All Departments
                      </button>

                      <button
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            departmentMode: "Selected",
                          }))
                        }
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition",
                          form.departmentMode === "Selected"
                            ? "bg-brand-800 text-white"
                            : "border border-gray-200 text-brand-700 hover:bg-brand-100"
                        )}
                      >
                        Selected Departments
                      </button>
                    </div>

                    {form.departmentMode === "Selected" && (
                      <div className="flex flex-wrap gap-2">
                        {DEPARTMENTS.map((dept) => {
                          const active = form.departments.includes(dept);
                          return (
                            <button
                              key={dept}
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  departments: toggleArrayValue(prev.departments, dept),
                                }))
                              }
                              className={cn(
                                "rounded-lg border px-3 py-2 text-sm transition",
                                active
                                  ? "border-brand-800 bg-brand-100 text-brand-900"
                                  : "border-gray-200 text-brand-700 hover:bg-brand-100"
                              )}
                            >
                              {dept}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {errors.departments && (
                      <p className="mt-2 text-xs text-red-600">{errors.departments}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Blocked Leave Types
                    </p>

                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            leaveTypeMode: "All",
                            leaveTypes: [],
                          }))
                        }
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition",
                          form.leaveTypeMode === "All"
                            ? "bg-brand-800 text-white"
                            : "border border-gray-200 text-brand-700 hover:bg-brand-100"
                        )}
                      >
                        All Leave Types
                      </button>

                      <button
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            leaveTypeMode: "Selected",
                          }))
                        }
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition",
                          form.leaveTypeMode === "Selected"
                            ? "bg-brand-800 text-white"
                            : "border border-gray-200 text-brand-700 hover:bg-brand-100"
                        )}
                      >
                        Selected Leave Types
                      </button>
                    </div>

                    {form.leaveTypeMode === "Selected" && (
                      <div className="flex flex-wrap gap-2">
                        {LEAVE_TYPES.map((type) => {
                          const active = form.leaveTypes.includes(type);
                          return (
                            <button
                              key={type}
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  leaveTypes: toggleArrayValue(prev.leaveTypes, type),
                                }))
                              }
                              className={cn(
                                "rounded-lg border px-3 py-2 text-sm transition",
                                active
                                  ? "border-brand-800 bg-brand-100 text-brand-900"
                                  : "border-gray-200 text-brand-700 hover:bg-brand-100"
                              )}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {errors.leaveTypes && (
                      <p className="mt-2 text-xs text-red-600">{errors.leaveTypes}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-brand-900">
                          Allow Exceptions?
                        </p>
                        <p className="mt-0.5 text-[11px] text-brand-700">
                          If enabled, leave requests can still be routed for special approval.
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            allowExceptions: !prev.allowExceptions,
                          }))
                        }
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          form.allowExceptions ? "bg-brand-800" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            form.allowExceptions ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Internal Reason *
                    </label>
                    <textarea
                      rows={4}
                      value={form.reason}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, reason: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800 resize-none"
                      placeholder="Why is this period restricted?"
                    />
                    {errors.reason && (
                      <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-[2] rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  {editingPeriod ? "Update Restriction" : "Save Blackout Period"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Drawer */}
        {selectedPeriod && (
          <div className="fixed inset-0 z-[220] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedPeriod(null)}
            />

            <div className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l border-gray-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                    <Info className="h-5 w-5 text-white" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">
                      Blackout Detail
                    </h2>
                    <p className="mt-0.5 text-sm text-brand-700">
                      {selectedPeriod.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPeriod(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-700 transition hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Blackout ID
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {selectedPeriod.id}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {getStatusFromDates(selectedPeriod.startDate, selectedPeriod.endDate)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      Start Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {formatDate(selectedPeriod.startDate)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                      End Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-900">
                      {formatDate(selectedPeriod.endDate)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Applies To
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {selectedPeriod.appliesTo === "All"
                      ? "All Staff"
                      : selectedPeriod.appliesTo.join(", ")}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Blocked Leave Types
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {selectedPeriod.typesBlocked === "All"
                      ? "All Leave Types"
                      : selectedPeriod.typesBlocked.join(", ")}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Exceptions
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">
                    {selectedPeriod.allowExceptions ? "Allowed" : "Strictly blocked"}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Internal Reason
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-800/90">
                        {selectedPeriod.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => {
                    setSelectedPeriod(null);
                    openEditModal(selectedPeriod);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  Edit
                </button>

                <button
                  onClick={() => setSelectedPeriod(null)}
                  className="rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}