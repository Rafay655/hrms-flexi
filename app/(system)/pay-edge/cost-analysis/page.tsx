"use client";
import { useMemo, useState } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  Users,
  Wallet,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Clock,
  Layers,
  Database,
  CheckCircle2,
  Search,
  Filter,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

type GroupBy = "Department" | "Cost Center" | "Grade";

type EmployeeCostRow = {
  employeeId: string;
  employeeName: string;
  department: string;
  costCenter: string;
  grade: string;
  gross: number;
  employerPf: number;
  eobi: number;
  gratuityProvision: number;
  medicalBenefits: number;
};

type PeriodData = {
  label: string;
  employees: EmployeeCostRow[];
  trendMonths: Array<{
    month: string;
    totalCTC: number;
    avgPerEmployee: number;
    headcount: number;
  }>;
};

type AggregatedCostRow = {
  label: string;
  employeeCount: number;
  gross: number;
  employerPf: number;
  eobi: number;
  gratuityProvision: number;
  medicalBenefits: number;
  ctc: number;
  percentageOfTotal: number;
};

type CostCenterVarianceRow = {
  id: string;
  ctc: number;
  budget: number;
  variancePercent: number;
};

const DEFAULT_PER_PAGE = 10;

const PERIODS: PeriodData[] = [
  {
    label: "Jan 2025",
    employees: [
      {
        employeeId: "EMP-1001",
        employeeName: "Arsalan Khan",
        department: "Engineering",
        costCenter: "TECH-ISB-01",
        grade: "G18",
        gross: 215000,
        employerPf: 21500,
        eobi: 400,
        gratuityProvision: 12500,
        medicalBenefits: 5000,
      },
      {
        employeeId: "EMP-1005",
        employeeName: "Mustafa Kamal",
        department: "Engineering",
        costCenter: "TECH-ISB-01",
        grade: "G20",
        gross: 550000,
        employerPf: 55000,
        eobi: 400,
        gratuityProvision: 30000,
        medicalBenefits: 12000,
      },
      {
        employeeId: "EMP-1102",
        employeeName: "Saira Ahmed",
        department: "Human Resources",
        costCenter: "ADMIN-CORP",
        grade: "G16",
        gross: 125000,
        employerPf: 12500,
        eobi: 400,
        gratuityProvision: 7000,
        medicalBenefits: 3500,
      },
      {
        employeeId: "EMP-1004",
        employeeName: "Zainab Bibi",
        department: "Operations",
        costCenter: "OPS-KHI-45",
        grade: "G12",
        gross: 92000,
        employerPf: 9200,
        eobi: 400,
        gratuityProvision: 4500,
        medicalBenefits: 2500,
      },
      {
        employeeId: "EMP-1003",
        employeeName: "Umar Farooq",
        department: "Sales & Mktg",
        costCenter: "SAL-LHR-01",
        grade: "G10",
        gross: 45000,
        employerPf: 4500,
        eobi: 400,
        gratuityProvision: 1800,
        medicalBenefits: 1200,
      },
      {
        employeeId: "EMP-1020",
        employeeName: "Areeba Khan",
        department: "Operations",
        costCenter: "OPS-KHI-45",
        grade: "G14",
        gross: 150000,
        employerPf: 15000,
        eobi: 400,
        gratuityProvision: 8200,
        medicalBenefits: 4200,
      },
      {
        employeeId: "EMP-1025",
        employeeName: "Bilal Raza",
        department: "Operations",
        costCenter: "OPS-KHI-45",
        grade: "G13",
        gross: 100000,
        employerPf: 10000,
        eobi: 400,
        gratuityProvision: 5200,
        medicalBenefits: 3000,
      },
      {
        employeeId: "EMP-1030",
        employeeName: "Hina Javed",
        department: "Engineering",
        costCenter: "TECH-ISB-01",
        grade: "G17",
        gross: 185000,
        employerPf: 18500,
        eobi: 400,
        gratuityProvision: 9800,
        medicalBenefits: 4800,
      },
      {
        employeeId: "EMP-1033",
        employeeName: "Faisal Qureshi",
        department: "Sales & Mktg",
        costCenter: "SAL-LHR-01",
        grade: "G15",
        gross: 130000,
        employerPf: 13000,
        eobi: 400,
        gratuityProvision: 6500,
        medicalBenefits: 3500,
      },
      {
        employeeId: "EMP-1037",
        employeeName: "Hamza Naveed",
        department: "Human Resources",
        costCenter: "ADMIN-CORP",
        grade: "G12",
        gross: 85000,
        employerPf: 8500,
        eobi: 400,
        gratuityProvision: 4200,
        medicalBenefits: 2500,
      },
    ],
    trendMonths: [
      { month: "Aug", totalCTC: 40500000, avgPerEmployee: 128500, headcount: 315 },
      { month: "Sep", totalCTC: 41800000, avgPerEmployee: 129800, headcount: 318 },
      { month: "Oct", totalCTC: 43200000, avgPerEmployee: 131900, headcount: 322 },
      { month: "Nov", totalCTC: 42600000, avgPerEmployee: 130700, headcount: 326 },
      { month: "Dec", totalCTC: 43750000, avgPerEmployee: 132000, headcount: 329 },
      { month: "Jan", totalCTC: 45000000, avgPerEmployee: 134500, headcount: 334 },
    ],
  },
  {
    label: "Dec 2024",
    employees: [
      {
        employeeId: "EMP-1001",
        employeeName: "Arsalan Khan",
        department: "Engineering",
        costCenter: "TECH-ISB-01",
        grade: "G18",
        gross: 210000,
        employerPf: 21000,
        eobi: 400,
        gratuityProvision: 12000,
        medicalBenefits: 5000,
      },
      {
        employeeId: "EMP-1005",
        employeeName: "Mustafa Kamal",
        department: "Engineering",
        costCenter: "TECH-ISB-01",
        grade: "G20",
        gross: 540000,
        employerPf: 54000,
        eobi: 400,
        gratuityProvision: 29500,
        medicalBenefits: 12000,
      },
      {
        employeeId: "EMP-1102",
        employeeName: "Saira Ahmed",
        department: "Human Resources",
        costCenter: "ADMIN-CORP",
        grade: "G16",
        gross: 120000,
        employerPf: 12000,
        eobi: 400,
        gratuityProvision: 6800,
        medicalBenefits: 3500,
      },
      {
        employeeId: "EMP-1004",
        employeeName: "Zainab Bibi",
        department: "Operations",
        costCenter: "OPS-KHI-45",
        grade: "G12",
        gross: 90000,
        employerPf: 9000,
        eobi: 400,
        gratuityProvision: 4300,
        medicalBenefits: 2500,
      },
      {
        employeeId: "EMP-1003",
        employeeName: "Umar Farooq",
        department: "Sales & Mktg",
        costCenter: "SAL-LHR-01",
        grade: "G10",
        gross: 44000,
        employerPf: 4400,
        eobi: 400,
        gratuityProvision: 1700,
        medicalBenefits: 1200,
      },
      {
        employeeId: "EMP-1020",
        employeeName: "Areeba Khan",
        department: "Operations",
        costCenter: "OPS-KHI-45",
        grade: "G14",
        gross: 148000,
        employerPf: 14800,
        eobi: 400,
        gratuityProvision: 8000,
        medicalBenefits: 4200,
      },
      {
        employeeId: "EMP-1025",
        employeeName: "Bilal Raza",
        department: "Operations",
        costCenter: "OPS-KHI-45",
        grade: "G13",
        gross: 98000,
        employerPf: 9800,
        eobi: 400,
        gratuityProvision: 5000,
        medicalBenefits: 3000,
      },
      {
        employeeId: "EMP-1030",
        employeeName: "Hina Javed",
        department: "Engineering",
        costCenter: "TECH-ISB-01",
        grade: "G17",
        gross: 180000,
        employerPf: 18000,
        eobi: 400,
        gratuityProvision: 9500,
        medicalBenefits: 4700,
      },
    ],
    trendMonths: [
      { month: "Jul", totalCTC: 39000000, avgPerEmployee: 126200, headcount: 309 },
      { month: "Aug", totalCTC: 39800000, avgPerEmployee: 127400, headcount: 312 },
      { month: "Sep", totalCTC: 40750000, avgPerEmployee: 128100, headcount: 318 },
      { month: "Oct", totalCTC: 41900000, avgPerEmployee: 129600, headcount: 323 },
      { month: "Nov", totalCTC: 42500000, avgPerEmployee: 130500, headcount: 326 },
      { month: "Dec", totalCTC: 43700000, avgPerEmployee: 132100, headcount: 331 },
    ],
  },
];

function formatPKRShort(value: number): string {
  return `PKR ${(value / 1000000).toFixed(2)}M`;
}

function formatPKRFull(value: number): string {
  return `PKR ${value.toLocaleString()}`;
}

function escapeCsv(value: string | number): string {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function createCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getCTC(row: EmployeeCostRow): number {
  return (
    row.gross +
    row.employerPf +
    row.eobi +
    row.gratuityProvision +
    row.medicalBenefits
  );
}

function aggregateByGroup(
  rows: EmployeeCostRow[],
  groupBy: GroupBy
): AggregatedCostRow[] {
  const map = new Map<string, Omit<AggregatedCostRow, "percentageOfTotal">>();

  rows.forEach((row) => {
    const key =
      groupBy === "Department"
        ? row.department
        : groupBy === "Cost Center"
        ? row.costCenter
        : row.grade;

    const existing = map.get(key);

    if (existing) {
      existing.employeeCount += 1;
      existing.gross += row.gross;
      existing.employerPf += row.employerPf;
      existing.eobi += row.eobi;
      existing.gratuityProvision += row.gratuityProvision;
      existing.medicalBenefits += row.medicalBenefits;
      existing.ctc += getCTC(row);
    } else {
      map.set(key, {
        label: key,
        employeeCount: 1,
        gross: row.gross,
        employerPf: row.employerPf,
        eobi: row.eobi,
        gratuityProvision: row.gratuityProvision,
        medicalBenefits: row.medicalBenefits,
        ctc: getCTC(row),
      });
    }
  });

  const total = Array.from(map.values()).reduce((sum, item) => sum + item.ctc, 0);

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      percentageOfTotal: total > 0 ? Number(((item.ctc / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.ctc - a.ctc);
}

 function CostAnalysisReport() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(PERIODS[0].label);
  const [groupBy, setGroupBy] = useState<GroupBy>("Department");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [scheduleToast, setScheduleToast] = useState(false);

  const periodData = useMemo(
    () => PERIODS.find((item) => item.label === selectedPeriod) ?? PERIODS[0],
    [selectedPeriod]
  );

  const ctcBreakdown = useMemo(() => {
    const grossSalary = periodData.employees.reduce((sum, row) => sum + row.gross, 0);
    const pf = periodData.employees.reduce((sum, row) => sum + row.employerPf, 0);
    const eobi = periodData.employees.reduce((sum, row) => sum + row.eobi, 0);
    const gratuity = periodData.employees.reduce(
      (sum, row) => sum + row.gratuityProvision,
      0
    );
    const medical = periodData.employees.reduce(
      (sum, row) => sum + row.medicalBenefits,
      0
    );

    return [
      { label: "Gross Salary", amount: grossSalary, color: "bg-brand-800" },
      { label: "Provident Fund (ER)", amount: pf, color: "bg-blue-500" },
      { label: "EOBI (ER)", amount: eobi, color: "bg-indigo-500" },
      { label: "Gratuity Provision", amount: gratuity, color: "bg-purple-500" },
      { label: "Medical & Benefits", amount: medical, color: "bg-emerald-500" },
    ];
  }, [periodData]);

  const totalCTC = useMemo(
    () => ctcBreakdown.reduce((sum, item) => sum + item.amount, 0),
    [ctcBreakdown]
  );

  const previousMonthCTC = useMemo(() => {
    const trends = periodData.trendMonths;
    if (trends.length < 2) return totalCTC;
    return trends[trends.length - 2].totalCTC;
  }, [periodData, totalCTC]);

  const ctcVarianceValue = totalCTC - previousMonthCTC;
  const ctcVariancePositive = ctcVarianceValue >= 0;

  const filteredEmployees = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return periodData.employees.filter((row) => {
      if (!needle) return true;

      return [
        row.employeeId,
        row.employeeName,
        row.department,
        row.costCenter,
        row.grade,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [periodData, search]);

  const groupedRows = useMemo(
    () => aggregateByGroup(filteredEmployees, groupBy),
    [filteredEmployees, groupBy]
  );

  const totalEntries = groupedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return groupedRows.slice(start, start + perPage);
  }, [groupedRows, currentPage, perPage]);

  const costCenterVariance = useMemo<CostCenterVarianceRow[]>(() => {
    const grouped = aggregateByGroup(periodData.employees, "Cost Center");

    return grouped.map((row, index) => {
      const budgetFactor = [0.94, 1.02, 0.97, 1.05, 0.99][index % 5];
      const budget = Math.round(row.ctc / budgetFactor);
      const variancePercent =
        budget > 0 ? Number((((row.ctc - budget) / budget) * 100).toFixed(2)) : 0;

      return {
        id: row.label,
        ctc: row.ctc,
        budget,
        variancePercent,
      };
    });
  }, [periodData]);

  const avgCtcPerEmployee = filteredEmployees.length
    ? Math.round(totalCTC / filteredEmployees.length)
    : 0;

  const latestTrend = periodData.trendMonths[periodData.trendMonths.length - 1];
  const peakHeadcount = Math.max(...periodData.trendMonths.map((item) => item.headcount));
  const efficiencyRatio = totalCTC > 0
    ? Number(((ctcBreakdown[0].amount / totalCTC) * 100).toFixed(1))
    : 0;

  const handleScheduleMonthly = (): void => {
    setScheduleToast(true);
    window.setTimeout(() => setScheduleToast(false), 2500);
  };

  const handleExport = (): void => {
    const csv = createCsv(
      [
        groupBy,
        "Employees",
        "Gross Salary",
        "Employer PF",
        "EOBI",
        "Gratuity Provision",
        "Medical Benefits",
        "Total CTC",
        "% of Total",
      ],
      groupedRows.map((row) => [
        row.label,
        row.employeeCount,
        row.gross,
        row.employerPf,
        row.eobi,
        row.gratuityProvision,
        row.medicalBenefits,
        row.ctc,
        row.percentageOfTotal,
      ])
    );

    downloadFile(
      csv,
      `cost-analysis-${selectedPeriod.toLowerCase().replace(/\s+/g, "-")}.csv`,
      "text/csv;charset=utf-8;"
    );
  };

  const resetPage = (): void => setPage(1);

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-brand-100 p-3 text-brand-800">
                <Database className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-900">
                  Total Cost Analysis
                </h2>
                <p className="mt-0.5 text-sm text-brand-700">
                  Holistic CTC impact and budget vs actual variance
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <select
                    value={selectedPeriod}
                    onChange={(e) => {
                      setSelectedPeriod(e.target.value);
                      resetPage();
                    }}
                    className="rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    {PERIODS.map((period) => (
                      <option key={period.label} value={period.label}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <select
                    value={groupBy}
                    onChange={(e) => {
                      setGroupBy(e.target.value as GroupBy);
                      resetPage();
                    }}
                    className="rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    <option value="Department">Department</option>
                    <option value="Cost Center">Cost Center</option>
                    <option value="Grade">Grade</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleScheduleMonthly}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                >
                  <Clock className="h-4 w-4" />
                  Schedule Monthly
                </button>

                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top section */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Consolidated CTC */}
          <div className="lg:col-span-4">
            <div className="relative h-full overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Consolidated CTC
                  </h3>
                </div>

                <div>
                  <p className="text-4xl font-bold tracking-tight text-brand-900">
                    {formatPKRShort(totalCTC)}
                  </p>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                      ctcVariancePositive ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {ctcVariancePositive ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {ctcVariancePositive ? "+" : "-"}
                    {formatPKRShort(Math.abs(ctcVarianceValue))} vs previous month
                  </div>
                </div>

                <div className="space-y-4 border-t border-dashed border-gray-200 pt-4">
                  {ctcBreakdown.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                          {item.label}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-brand-900">
                        {formatPKRShort(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Wallet className="absolute -bottom-6 -right-6 h-36 w-36 rotate-12 text-brand-100" />
            </div>
          </div>

          {/* Trend chart */}
          <div className="lg:col-span-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                  <TrendingUp className="h-4 w-4" />
                  6-Month Fiscal Trend
                </h3>

                <div className="flex gap-4 text-[11px] font-semibold text-brand-700">
                  <span className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-brand-800" />
                    Total CTC
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Per Employee
                  </span>
                </div>
              </div>

              <div className="flex h-56 items-end justify-between gap-4">
                {periodData.trendMonths.map((item) => {
                  const maxCTC = Math.max(
                    ...periodData.trendMonths.map((trend) => trend.totalCTC)
                  );
                  const maxAverage = Math.max(
                    ...periodData.trendMonths.map((trend) => trend.avgPerEmployee)
                  );

                  const totalHeight = maxCTC > 0 ? (item.totalCTC / maxCTC) * 100 : 0;
                  const averageHeight =
                    maxAverage > 0 ? (item.avgPerEmployee / maxAverage) * 100 : 0;

                  return (
                    <div
                      key={item.month}
                      className="group relative flex flex-1 flex-col items-center justify-end gap-3"
                    >
                      <div className="flex h-full w-full items-end gap-1">
                        <div className="relative h-full flex-1 rounded-t-xl bg-brand-100">
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t-xl bg-brand-800 transition-all duration-500"
                            style={{ height: `${totalHeight}%` }}
                          />
                        </div>
                        <div className="relative h-full w-4 rounded-t-xl bg-emerald-100">
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t-xl bg-emerald-500 transition-all duration-500"
                            style={{ height: `${averageHeight}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          {item.month}
                        </p>
                      </div>

                      <div className="pointer-events-none absolute -top-2 left-1/2 z-20 min-w-[160px] -translate-x-1/2 rounded-lg bg-brand-900 px-3 py-2 text-[10px] text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                        <p className="font-semibold">CTC: {formatPKRShort(item.totalCTC)}</p>
                        <p className="mt-1 text-white/80">
                          Avg / Employee: PKR {item.avgPerEmployee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Avg CTC / EE
                  </p>
                  <p className="mt-1 text-lg font-bold text-brand-900">
                    PKR {avgCtcPerEmployee.toLocaleString()}
                  </p>
                </div>

                <div className="text-center sm:border-x sm:border-gray-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Peak Headcount
                  </p>
                  <p className="mt-1 text-lg font-bold text-brand-900">
                    {peakHeadcount}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Efficiency Ratio
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-600">
                    {efficiencyRatio}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed section */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left table */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                  {groupBy === "Department" ? (
                    <Building2 className="h-4 w-4 text-brand-800" />
                  ) : groupBy === "Cost Center" ? (
                    <Layers className="h-4 w-4 text-brand-800" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-brand-800" />
                  )}
                  Cost by {groupBy}
                </h3>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <input
                      type="text"
                      placeholder={`Search ${groupBy.toLowerCase()}...`}
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        resetPage();
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                      <Filter className="h-4 w-4 text-brand-700" />
                    </div>

                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        resetPage();
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
                  <span className="font-semibold text-brand-900">{showingFrom}</span>
                  <span className="text-brand-700"> to </span>
                  <span className="font-semibold text-brand-900">{showingTo}</span>
                  <span className="text-brand-700"> of </span>
                  <span className="font-semibold text-brand-900">{totalEntries}</span>
                  <span className="text-brand-700"> grouped rows</span>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  <Users className="h-3.5 w-3.5 text-brand-700" />
                  Total Employees:{" "}
                  <span className="font-semibold text-brand-900">
                    {filteredEmployees.length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800">
                        {groupBy}
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        HC
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Gross Total
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Total CTC
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        % of Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                              <PieChart className="h-5 w-5 text-brand-800" />
                            </div>
                            <p className="text-sm font-semibold text-brand-900">
                              No grouped data found
                            </p>
                            <p className="text-sm text-brand-700">
                              Try changing the period, grouping, or search value.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => (
                        <tr key={row.label} className="hover:bg-brand-100/40">
                          <td className="px-6 py-4 text-sm font-semibold text-brand-900">
                            {row.label}
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-brand-800">
                            {row.employeeCount}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm text-brand-700">
                            {formatPKRShort(row.gross)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-brand-900">
                            {formatPKRShort(row.ctc)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full bg-brand-800"
                                  style={{ width: `${Math.min(row.percentageOfTotal, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-brand-700">
                                {row.percentageOfTotal}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {paginatedRows.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-brand-700">
                    Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                    <span className="font-semibold text-brand-900">{totalPages}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setPage(1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber = 1;

                      if (totalPages <= 5) pageNumber = i + 1;
                      else if (currentPage <= 3) pageNumber = i + 1;
                      else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + i;
                      else pageNumber = currentPage - 2 + i;

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                            currentPage === pageNumber
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
                      disabled={currentPage === totalPages}
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(totalPages)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-sm text-brand-700">
                    <span className="font-semibold text-brand-900">{showingFrom}</span>
                    {" – "}
                    <span className="font-semibold text-brand-900">{showingTo}</span>
                    {" of "}
                    <span className="font-semibold text-brand-900">{totalEntries}</span>
                    {" entries"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right variance */}
          <div className="space-y-4 lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                  <Landmark className="h-4 w-4 text-brand-800" />
                  Budget Variance (Cost Center)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Cost Center
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Actual CTC
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Budget
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Var %
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {costCenterVariance.map((row) => (
                      <tr key={row.id} className="hover:bg-brand-100/40">
                        <td className="px-6 py-4 font-mono text-sm font-semibold text-brand-900">
                          {row.id}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-brand-900">
                          {formatPKRShort(row.ctc)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-brand-700">
                          {formatPKRShort(row.budget)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              row.variancePercent > 0
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {row.variancePercent > 0 ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {Math.abs(row.variancePercent)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Accrual Policy Note
                  </p>
                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    Provisioning for gratuity and long-term benefits is being reflected
                    as part of CTC. Variances above 5% should be reviewed by Finance
                    before final board submission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {scheduleToast && (
          <div className="fixed bottom-6 right-6 z-[220] rounded-xl bg-emerald-500 px-5 py-4 text-white shadow-2xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider">
                  Scheduled
                </p>
                <p className="mt-1 text-sm">
                  Monthly cost analysis has been marked for recurring review.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CostAnalysisReport;