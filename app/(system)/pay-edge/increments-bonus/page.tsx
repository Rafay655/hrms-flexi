"use client";
import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock3,
  Calculator,
  Wallet,
  Download,
  Eye,
  FileText,
  AlertTriangle,
  Users,
  Building2,
  Save,
  Send,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from "lucide-react";

interface IncrementCycle {
  id: string;
  name: string;
  effectiveDate: string;
  employees: number;
  budget: number;
  allocated: number;
  status: "Draft" | "Pending Approval" | "Approved" | "Published";
}

interface IncrementRow {
  id: string;
  name: string;
  dept: string;
  currentGross: number;
  rating: "A" | "B" | "C" | "D";
  suggestedPerc: number;
  actualPerc: number;
}

type ViewMode = "LIST" | "WORKSHEET";
type CycleStatus = "All" | IncrementCycle["status"];
type WorksheetFilter = "All" | "A - Exceptional" | "Over Budget" | "Zero Increment";

const DEFAULT_PER_PAGE = 10;

const MOCK_CYCLES: IncrementCycle[] = [
  {
    id: "INC-2025-01",
    name: "Annual Performance Review 2025",
    effectiveDate: "2025-01-01",
    employees: 485,
    budget: 15000000,
    allocated: 12450000,
    status: "Draft",
  },
  {
    id: "INC-2024-02",
    name: "Mid-Year Adjustments 2024",
    effectiveDate: "2024-07-01",
    employees: 42,
    budget: 2500000,
    allocated: 2480000,
    status: "Published",
  },
];

const DEFAULT_WORKSHEET: IncrementRow[] = [
  {
    id: "EMP-1001",
    name: "Arsalan Khan",
    dept: "Engineering",
    currentGross: 215000,
    rating: "A",
    suggestedPerc: 15,
    actualPerc: 15,
  },
  {
    id: "EMP-1002",
    name: "Saira Ahmed",
    dept: "HR",
    currentGross: 85000,
    rating: "B",
    suggestedPerc: 10,
    actualPerc: 10,
  },
  {
    id: "EMP-1005",
    name: "Mustafa Kamal",
    dept: "Engineering",
    currentGross: 550000,
    rating: "A",
    suggestedPerc: 15,
    actualPerc: 18,
  },
  {
    id: "EMP-1004",
    name: "Zainab Bibi",
    dept: "Operations",
    currentGross: 92000,
    rating: "C",
    suggestedPerc: 5,
    actualPerc: 5,
  },
  {
    id: "EMP-1003",
    name: "Umar Farooq",
    dept: "Sales",
    currentGross: 45000,
    rating: "B",
    suggestedPerc: 10,
    actualPerc: 8,
  },
];

const formatPKR = (val: number) => `PKR ${Math.round(val).toLocaleString()}`;

const escapeCsv = (value: string | number) => {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const getCycleStatusClasses = (status: IncrementCycle["status"]) => {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Pending Approval":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Approved":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getRatingClasses = (rating: IncrementRow["rating"]) => {
  switch (rating) {
    case "A":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "B":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "C":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "D":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const computeAllocatedAnnual = (rows: IncrementRow[]) =>
  Math.round(
    rows.reduce(
      (sum, row) => sum + (row.currentGross * row.actualPerc) / 100,
      0
    ) * 12
  );

const downloadCsv = (
  filename: string,
  headers: Array<string>,
  rows: Array<Array<string | number>>
) => {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

 const IncrementProcessing: React.FC = () => {
  const [view, setView] = useState<ViewMode>("LIST");
  const [cycles, setCycles] = useState<IncrementCycle[]>(MOCK_CYCLES);
  const [activeCycleId, setActiveCycleId] = useState<string>(MOCK_CYCLES[0].id);
  const [cycleSearch, setCycleSearch] = useState("");
  const [cycleStatusFilter, setCycleStatusFilter] = useState<CycleStatus>("All");
  const [cyclePage, setCyclePage] = useState(1);
  const [cyclePerPage, setCyclePerPage] = useState(DEFAULT_PER_PAGE);

  const [worksheetSearch, setWorksheetSearch] = useState("");
  const [worksheetFilter, setWorksheetFilter] =
    useState<WorksheetFilter>("All");
  const [worksheetPage, setWorksheetPage] = useState(1);
  const [worksheetPerPage, setWorksheetPerPage] = useState(DEFAULT_PER_PAGE);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "Annual Review 2025",
    effectiveDate: "2025-01-01",
    budget: 15000000,
    minPerc: 0,
    defaultPerc: 10,
    maxPerc: 25,
  });

  const [cycleWorksheets, setCycleWorksheets] = useState<Record<string, IncrementRow[]>>({
    "INC-2025-01": DEFAULT_WORKSHEET,
    "INC-2024-02": DEFAULT_WORKSHEET.map((row) => ({
      ...row,
      actualPerc: row.suggestedPerc,
    })),
  });

  const activeCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === activeCycleId) || null,
    [cycles, activeCycleId]
  );

  const activeWorksheet = cycleWorksheets[activeCycleId] || [];

  const cycleStats = useMemo(() => {
    const totalCycles = cycles.length;
    const totalEmployees = cycles.reduce((sum, cycle) => sum + cycle.employees, 0);
    const totalBudget = cycles.reduce((sum, cycle) => sum + cycle.budget, 0);
    const totalAllocated = cycles.reduce((sum, cycle) => sum + cycle.allocated, 0);
    return { totalCycles, totalEmployees, totalBudget, totalAllocated };
  }, [cycles]);

  const filteredCycles = useMemo(() => {
    const needle = cycleSearch.trim().toLowerCase();

    return cycles.filter((cycle) => {
      const matchesSearch =
        !needle ||
        [cycle.id, cycle.name, cycle.effectiveDate, cycle.status]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      const matchesStatus =
        cycleStatusFilter === "All" || cycle.status === cycleStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cycles, cycleSearch, cycleStatusFilter]);

  const cycleTotalEntries = filteredCycles.length;
  const cycleTotalPages = Math.max(1, Math.ceil(cycleTotalEntries / cyclePerPage));
  const cycleCurrentPage = Math.min(cyclePage, cycleTotalPages);
  const cycleShowingFrom =
    cycleTotalEntries > 0 ? (cycleCurrentPage - 1) * cyclePerPage + 1 : 0;
  const cycleShowingTo =
    cycleTotalEntries > 0
      ? Math.min(cycleCurrentPage * cyclePerPage, cycleTotalEntries)
      : 0;

  const paginatedCycles = useMemo(() => {
    const start = (cycleCurrentPage - 1) * cyclePerPage;
    return filteredCycles.slice(start, start + cyclePerPage);
  }, [filteredCycles, cycleCurrentPage, cyclePerPage]);

  const worksheetMetrics = useMemo(() => {
    if (!activeCycle) {
      return { budget: 0, allocated: 0, remaining: 0, employees: 0 };
    }

    const allocated = computeAllocatedAnnual(activeWorksheet);
    return {
      budget: activeCycle.budget,
      allocated,
      remaining: activeCycle.budget - allocated,
      employees: activeWorksheet.length,
    };
  }, [activeCycle, activeWorksheet]);

  const filteredWorksheet = useMemo(() => {
    const needle = worksheetSearch.trim().toLowerCase();

    return activeWorksheet.filter((row) => {
      const matchesSearch =
        !needle ||
        [row.id, row.name, row.dept, row.rating]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      const matchesFilter =
        worksheetFilter === "All"
          ? true
          : worksheetFilter === "A - Exceptional"
          ? row.rating === "A"
          : worksheetFilter === "Over Budget"
          ? row.actualPerc > row.suggestedPerc
          : row.actualPerc === 0;

      return matchesSearch && matchesFilter;
    });
  }, [activeWorksheet, worksheetSearch, worksheetFilter]);

  const worksheetTotalEntries = filteredWorksheet.length;
  const worksheetTotalPages = Math.max(
    1,
    Math.ceil(worksheetTotalEntries / worksheetPerPage)
  );
  const worksheetCurrentPage = Math.min(worksheetPage, worksheetTotalPages);
  const worksheetShowingFrom =
    worksheetTotalEntries > 0
      ? (worksheetCurrentPage - 1) * worksheetPerPage + 1
      : 0;
  const worksheetShowingTo =
    worksheetTotalEntries > 0
      ? Math.min(worksheetCurrentPage * worksheetPerPage, worksheetTotalEntries)
      : 0;

  const paginatedWorksheet = useMemo(() => {
    const start = (worksheetCurrentPage - 1) * worksheetPerPage;
    return filteredWorksheet.slice(start, start + worksheetPerPage);
  }, [filteredWorksheet, worksheetCurrentPage, worksheetPerPage]);

  const handlePercChange = (id: string, value: number) => {
    if (!activeCycle) return;

    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

    setCycleWorksheets((prev) => {
      const currentRows = prev[activeCycle.id] || [];
      const updatedRows = currentRows.map((row) =>
        row.id === id ? { ...row, actualPerc: safeValue } : row
      );

      const newAllocated = computeAllocatedAnnual(updatedRows);

      setCycles((prevCycles) =>
        prevCycles.map((cycle) =>
          cycle.id === activeCycle.id
            ? { ...cycle, allocated: newAllocated }
            : cycle
        )
      );

      return {
        ...prev,
        [activeCycle.id]: updatedRows,
      };
    });
  };

  const openWorksheet = (cycleId: string) => {
    setActiveCycleId(cycleId);
    setWorksheetPage(1);
    setWorksheetSearch("");
    setWorksheetFilter("All");
    setView("WORKSHEET");
  };

  const handleCycleExport = () => {
    downloadCsv(
      "increment-cycles.csv",
      [
        "Sr",
        "Cycle ID",
        "Cycle Name",
        "Effective Date",
        "Employees",
        "Budget",
        "Allocated",
        "Status",
      ],
      filteredCycles.map((cycle, index) => [
        index + 1,
        cycle.id,
        cycle.name,
        cycle.effectiveDate,
        cycle.employees,
        cycle.budget,
        cycle.allocated,
        cycle.status,
      ])
    );
  };

  const handleWorksheetExport = () => {
    if (!activeCycle) return;

    downloadCsv(
      `${activeCycle.id.toLowerCase()}-worksheet.csv`,
      [
        "Employee ID",
        "Employee Name",
        "Department",
        "Current Gross",
        "Rating",
        "Suggested %",
        "Actual %",
        "Increment Amount",
        "New Gross",
      ],
      filteredWorksheet.map((row) => {
        const incrementAmount = Math.round(
          (row.currentGross * row.actualPerc) / 100
        );
        return [
          row.id,
          row.name,
          row.dept,
          row.currentGross,
          row.rating,
          row.suggestedPerc,
          row.actualPerc,
          incrementAmount,
          row.currentGross + incrementAmount,
        ];
      })
    );
  };

  const handleGenerateLetters = (cycle: IncrementCycle) => {
    const worksheet = cycleWorksheets[cycle.id] || [];
    const content = worksheet
      .map((row) => {
        const incrementAmount = Math.round(
          (row.currentGross * row.actualPerc) / 100
        );
        const newGross = row.currentGross + incrementAmount;

        return [
          `Employee: ${row.name} (${row.id})`,
          `Department: ${row.dept}`,
          `Cycle: ${cycle.name}`,
          `Effective Date: ${cycle.effectiveDate}`,
          `Current Gross: ${formatPKR(row.currentGross)}`,
          `Increment %: ${row.actualPerc}%`,
          `Increment Amount: ${formatPKR(incrementAmount)}`,
          `New Gross: ${formatPKR(newGross)}`,
          `----------------------------------------`,
        ].join("\n");
      })
      .join("\n");

    downloadText(`${cycle.id.toLowerCase()}-letters.txt`, content);
  };

  const handleDeleteCycle = (cycleId: string) => {
    setCycles((prev) => prev.filter((cycle) => cycle.id !== cycleId));
    setCycleWorksheets((prev) => {
      const next = { ...prev };
      delete next[cycleId];
      return next;
    });

    if (activeCycleId === cycleId) {
      const nextCycle = cycles.find((cycle) => cycle.id !== cycleId);
      if (nextCycle) setActiveCycleId(nextCycle.id);
      setView("LIST");
    }
  };

  const handleSaveDraft = () => {
    if (!activeCycle) return;
    setCycles((prev) =>
      prev.map((cycle) =>
        cycle.id === activeCycle.id ? { ...cycle, status: "Draft" } : cycle
      )
    );
  };

  const handleSubmitForApproval = () => {
    if (!activeCycle) return;
    setCycles((prev) =>
      prev.map((cycle) =>
        cycle.id === activeCycle.id
          ? { ...cycle, status: "Pending Approval" }
          : cycle
      )
    );
  };

  const handleCreateCycle = () => {
    const nextIndex = cycles.length + 1;
    const yearPart = createForm.effectiveDate.slice(0, 4) || "2025";
    const cycleId = `INC-${yearPart}-${String(nextIndex).padStart(2, "0")}`;

    const seededWorksheet = DEFAULT_WORKSHEET.map((row) => {
      const suggested =
        row.rating === "A"
          ? Math.min(createForm.defaultPerc + 5, createForm.maxPerc)
          : row.rating === "B"
          ? createForm.defaultPerc
          : row.rating === "C"
          ? Math.max(createForm.defaultPerc - 5, createForm.minPerc)
          : createForm.minPerc;

      return {
        ...row,
        suggestedPerc: suggested,
        actualPerc: suggested,
      };
    });

    const newCycle: IncrementCycle = {
      id: cycleId,
      name: createForm.name.trim() || `Increment Cycle ${yearPart}`,
      effectiveDate: createForm.effectiveDate,
      employees: seededWorksheet.length,
      budget: Number(createForm.budget || 0),
      allocated: computeAllocatedAnnual(seededWorksheet),
      status: "Draft",
    };

    setCycles((prev) => [newCycle, ...prev]);
    setCycleWorksheets((prev) => ({
      ...prev,
      [cycleId]: seededWorksheet,
    }));
    setActiveCycleId(cycleId);
    setIsCreateModalOpen(false);
    setView("WORKSHEET");
  };

  if (view === "WORKSHEET") {
    return (
      <div className="min-h-screen bg-white p-3">
        <div className="space-y-4">
          {/* Worksheet Header */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("LIST")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
                >
                  <X className="h-4 w-4" />
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    {activeCycle?.name || "Increment Worksheet"}
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Effective from {activeCycle?.effectiveDate || "-"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </button>

                <button
                  onClick={handleSubmitForApproval}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  <Send className="h-4 w-4" />
                  Submit for Approval
                </button>
              </div>
            </div>

            {/* Budget Cards */}
            <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Annual Budget Pool
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-brand-900">
                    {formatPKR(worksheetMetrics.budget)}
                  </p>
                  <div className="rounded-lg bg-brand-100 p-2">
                    <Wallet className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Total Allocated
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p
                    className={`text-2xl font-bold ${
                      worksheetMetrics.remaining < 0
                        ? "text-red-700"
                        : "text-brand-900"
                    }`}
                  >
                    {formatPKR(worksheetMetrics.allocated)}
                  </p>
                  <div className="rounded-lg bg-brand-100 p-2">
                    <TrendingUp className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Remaining Buffer
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p
                    className={`text-2xl font-bold ${
                      worksheetMetrics.remaining < 0
                        ? "text-red-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {formatPKR(worksheetMetrics.remaining)}
                  </p>
                  <div className="rounded-lg bg-brand-100 p-2">
                    <Building2 className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Employees In Scope
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-bold text-brand-900">
                    {worksheetMetrics.employees}
                  </p>
                  <div className="rounded-lg bg-brand-100 p-2">
                    <Users className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {worksheetMetrics.remaining < 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                <AlertTriangle className="h-4 w-4 text-brand-800" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-900">
                  Budget Warning
                </h4>
                <p className="mt-1 text-sm leading-6 text-brand-700">
                  The current worksheet is over budget. Review employees with
                  higher-than-suggested percentages before submitting.
                </p>
              </div>
            </div>
          )}

          {/* Worksheet Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:w-[280px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="text"
                    placeholder="Search employee, id, department..."
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    value={worksheetSearch}
                    onChange={(e) => {
                      setWorksheetSearch(e.target.value);
                      setWorksheetPage(1);
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                    <Filter className="h-4 w-4 text-brand-700" />
                  </div>

                  <select
                    value={worksheetFilter}
                    onChange={(e) => {
                      setWorksheetFilter(e.target.value as WorksheetFilter);
                      setWorksheetPage(1);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                  >
                    <option value="All">All</option>
                    <option value="A - Exceptional">A - Exceptional</option>
                    <option value="Over Budget">Over Budget</option>
                    <option value="Zero Increment">Zero Increment</option>
                  </select>

                  <select
                    value={worksheetPerPage}
                    onChange={(e) => {
                      setWorksheetPerPage(Number(e.target.value));
                      setWorksheetPage(1);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleWorksheetExport}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm">
                <span className="text-brand-700">Showing </span>
                <span className="font-semibold text-brand-900">
                  {worksheetShowingFrom}
                </span>
                <span className="text-brand-700"> to </span>
                <span className="font-semibold text-brand-900">
                  {worksheetShowingTo}
                </span>
                <span className="text-brand-700"> of </span>
                <span className="font-semibold text-brand-900">
                  {worksheetTotalEntries}
                </span>
                <span className="text-brand-700"> worksheet rows</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {activeWorksheet.filter((row) => row.rating === "A").length}
                  </span>
                  Rated A
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {
                      activeWorksheet.filter(
                        (row) => row.actualPerc > row.suggestedPerc
                      ).length
                    }
                  </span>
                  Over Suggested
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead className="border-b border-gray-200 bg-white">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Employee
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Current Gross
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Rating
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Suggested %
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Actual %
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Increment Amount
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                      New Gross
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedWorksheet.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                            <Calculator className="h-5 w-5 text-brand-800" />
                          </div>
                          <p className="text-sm font-semibold text-brand-900">
                            No worksheet records found
                          </p>
                          <p className="text-sm text-brand-700">
                            Try changing your search or worksheet filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedWorksheet.map((row) => {
                      const incrementAmount = Math.round(
                        (row.currentGross * row.actualPerc) / 100
                      );
                      const isOverSuggested = row.actualPerc > row.suggestedPerc;

                      return (
                        <tr key={row.id} className="hover:bg-brand-100/60">
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-semibold text-brand-900">
                                {row.name}
                              </p>
                              <p className="mt-0.5 text-xs text-brand-700">
                                {row.id} • {row.dept}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-medium text-brand-800">
                            {row.currentGross.toLocaleString()}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getRatingClasses(
                                row.rating
                              )}`}
                            >
                              {row.rating}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-medium text-brand-700">
                            {row.suggestedPerc}%
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-center">
                              <div className="relative">
                                <input
                                  type="number"
                                  value={row.actualPerc}
                                  onChange={(e) =>
                                    handlePercChange(
                                      row.id,
                                      Number(e.target.value || 0)
                                    )
                                  }
                                  className={`w-20 rounded-lg border px-2 py-2 text-center text-sm font-semibold outline-none ${
                                    isOverSuggested
                                      ? "border-red-300 bg-red-50 text-red-700"
                                      : "border-gray-200 bg-white text-brand-900"
                                  }`}
                                />
                                {isOverSuggested && (
                                  <AlertTriangle className="absolute -right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-600" />
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-700">
                            +{incrementAmount.toLocaleString()}
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                            {(row.currentGross + incrementAmount).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {paginatedWorksheet.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-brand-700">
                  Page{" "}
                  <span className="font-semibold text-brand-900">
                    {worksheetCurrentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-brand-900">
                    {worksheetTotalPages}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={worksheetCurrentPage === 1}
                    onClick={() => setWorksheetPage(1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={worksheetCurrentPage === 1}
                    onClick={() =>
                      setWorksheetPage((prev) => Math.max(1, prev - 1))
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from(
                    { length: Math.min(5, worksheetTotalPages) },
                    (_, i) => {
                      let pageNumber = 1;

                      if (worksheetTotalPages <= 5) pageNumber = i + 1;
                      else if (worksheetCurrentPage <= 3) pageNumber = i + 1;
                      else if (worksheetCurrentPage >= worksheetTotalPages - 2)
                        pageNumber = worksheetTotalPages - 4 + i;
                      else pageNumber = worksheetCurrentPage - 2 + i;

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setWorksheetPage(pageNumber)}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                            worksheetCurrentPage === pageNumber
                              ? "border-brand-800 bg-brand-800 text-white"
                              : "border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                  )}

                  <button
                    type="button"
                    disabled={worksheetCurrentPage === worksheetTotalPages}
                    onClick={() =>
                      setWorksheetPage((prev) =>
                        Math.min(worksheetTotalPages, prev + 1)
                      )
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={worksheetCurrentPage === worksheetTotalPages}
                    onClick={() => setWorksheetPage(worksheetTotalPages)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-brand-700">
                  <span className="font-semibold text-brand-900">
                    {worksheetShowingFrom}
                  </span>
                  {" – "}
                  <span className="font-semibold text-brand-900">
                    {worksheetShowingTo}
                  </span>
                  {" of "}
                  <span className="font-semibold text-brand-900">
                    {worksheetTotalEntries}
                  </span>
                  {" entries"}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
              <Info className="h-4 w-4 text-brand-800" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand-900">
                Worksheet Note
              </h4>
              <p className="mt-1 text-sm leading-6 text-brand-700">
                Suggested percentages are seeded from the cycle defaults. You can
                revise employee-level increments before sending the cycle for approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  Increment Cycles
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Manage performance-based pay revisions and budget allocation
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCycleExport}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                New Cycle
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Cycles
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {cycleStats.totalCycles}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <TrendingUp className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Employees Covered
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {cycleStats.totalEmployees}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Users className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Budget Pool
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {formatPKR(cycleStats.totalBudget)}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Wallet className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Total Allocated
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-brand-900">
                  {formatPKR(cycleStats.totalAllocated)}
                </p>
                <div className="rounded-lg bg-brand-100 p-2">
                  <Calculator className="h-4 w-4 text-brand-800" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listing */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search cycle name, id, date..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={cycleSearch}
                  onChange={(e) => {
                    setCycleSearch(e.target.value);
                    setCyclePage(1);
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                  <Filter className="h-4 w-4 text-brand-700" />
                </div>

                <select
                  value={cycleStatusFilter}
                  onChange={(e) => {
                    setCycleStatusFilter(e.target.value as CycleStatus);
                    setCyclePage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  <option value="All">Status: All</option>
                  <option value="Draft">Status: Draft</option>
                  <option value="Pending Approval">Status: Pending Approval</option>
                  <option value="Approved">Status: Approved</option>
                  <option value="Published">Status: Published</option>
                </select>

                <select
                  value={cyclePerPage}
                  onChange={(e) => {
                    setCyclePerPage(Number(e.target.value));
                    setCyclePage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm">
              <span className="text-brand-700">Showing </span>
              <span className="font-semibold text-brand-900">
                {cycleShowingFrom}
              </span>
              <span className="text-brand-700"> to </span>
              <span className="font-semibold text-brand-900">
                {cycleShowingTo}
              </span>
              <span className="text-brand-700"> of </span>
              <span className="font-semibold text-brand-900">
                {cycleTotalEntries}
              </span>
              <span className="text-brand-700"> cycles</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {cycles.filter((cycle) => cycle.status === "Draft").length}
                </span>
                Draft
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {
                    cycles.filter(
                      (cycle) => cycle.status === "Pending Approval"
                    ).length
                  }
                </span>
                Pending Approval
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">
                  {
                    cycles.filter((cycle) => cycle.status === "Published")
                      .length
                  }
                </span>
                Published
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Cycle Name
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Effective Date
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employees
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Budget
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
                {paginatedCycles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                          <TrendingUp className="h-5 w-5 text-brand-800" />
                        </div>
                        <p className="text-sm font-semibold text-brand-900">
                          No increment cycles found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing your search or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCycles.map((cycle) => (
                    <tr key={cycle.id} className="hover:bg-brand-100/60">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-brand-900">
                            {cycle.name}
                          </p>
                          <p className="mt-0.5 text-xs text-brand-700">
                            {cycle.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center text-sm text-brand-800">
                        {cycle.effectiveDate}
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold text-brand-900">
                        {cycle.employees}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="text-sm font-semibold text-brand-900">
                            {formatPKR(cycle.budget)}
                          </span>
                          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-brand-100">
                            <div
                              className="h-full bg-brand-800"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((cycle.allocated / cycle.budget) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getCycleStatusClasses(
                            cycle.status
                          )}`}
                        >
                          {cycle.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openWorksheet(cycle.id)}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                            title="Edit Worksheet"
                          >
                            <Calculator className="h-4 w-4" />
                            Worksheet
                          </button>

                          <button
                            onClick={() => handleGenerateLetters(cycle)}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                            title="Generate Letters"
                          >
                            <FileText className="h-4 w-4" />
                            Letters
                          </button>

                          <button
                            onClick={() => handleDeleteCycle(cycle.id)}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                            title="Delete Cycle"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {paginatedCycles.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-brand-700">
                Page{" "}
                <span className="font-semibold text-brand-900">
                  {cycleCurrentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-brand-900">
                  {cycleTotalPages}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={cycleCurrentPage === 1}
                  onClick={() => setCyclePage(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={cycleCurrentPage === 1}
                  onClick={() => setCyclePage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: Math.min(5, cycleTotalPages) }, (_, i) => {
                  let pageNumber = 1;

                  if (cycleTotalPages <= 5) pageNumber = i + 1;
                  else if (cycleCurrentPage <= 3) pageNumber = i + 1;
                  else if (cycleCurrentPage >= cycleTotalPages - 2)
                    pageNumber = cycleTotalPages - 4 + i;
                  else pageNumber = cycleCurrentPage - 2 + i;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCyclePage(pageNumber)}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                        cycleCurrentPage === pageNumber
                          ? "border-brand-800 bg-brand-800 text-white"
                          : "border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={cycleCurrentPage === cycleTotalPages}
                  onClick={() =>
                    setCyclePage((prev) => Math.min(cycleTotalPages, prev + 1))
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={cycleCurrentPage === cycleTotalPages}
                  onClick={() => setCyclePage(cycleTotalPages)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm text-brand-700">
                <span className="font-semibold text-brand-900">
                  {cycleShowingFrom}
                </span>
                {" – "}
                <span className="font-semibold text-brand-900">
                  {cycleShowingTo}
                </span>
                {" of "}
                <span className="font-semibold text-brand-900">
                  {cycleTotalEntries}
                </span>
                {" entries"}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Info className="h-4 w-4 text-brand-800" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-900">
              Increment Cycle Note
            </h4>
            <p className="mt-1 text-sm leading-6 text-brand-700">
              Cycle budgets are tracked against annualized worksheet allocations.
              Once submitted for approval, employee-level revisions should be reviewed
              before publishing final salary letters.
            </p>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/30 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-brand-900">
                  Initiate Review Cycle
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Create a new increment cycle and seed the employee worksheet
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Cycle Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={createForm.effectiveDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        effectiveDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Budget Pool (Annual)
                  </label>
                  <input
                    type="number"
                    value={createForm.budget}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        budget: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Min %
                  </label>
                  <input
                    type="number"
                    value={createForm.minPerc}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        minPerc: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Default %
                  </label>
                  <input
                    type="number"
                    value={createForm.defaultPerc}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        defaultPerc: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Max %
                  </label>
                  <input
                    type="number"
                    value={createForm.maxPerc}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        maxPerc: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                  <Info className="h-4 w-4 text-brand-800" />
                </div>
                <p className="text-sm leading-6 text-brand-700">
                  Launching the cycle will seed the worksheet with active employees
                  and suggested increment percentages based on the cycle defaults.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateCycle}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <TrendingUp className="h-4 w-4" />
                Launch Cycle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncrementProcessing;