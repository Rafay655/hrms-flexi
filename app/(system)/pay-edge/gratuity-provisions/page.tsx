"use client";
import React, { useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  Filter,
  Info,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

type BracketData = {
  range: string;
  count: number;
  avg: number;
  total: number;
  perc: number;
};

type DepartmentData = {
  name: string;
  count: number;
  liability: number;
  trend: string;
};

type EmployeeRow = {
  id: string;
  name: string;
  designation: string;
  department: string;
  serviceYears: number;
  lastBasic: number;
  monthlyProvision: number;
  accumulatedProvision: number;
};

const BRACKET_DATA: BracketData[] = [
  { range: "1 - 3 Years", count: 185, avg: 125000, total: 23125000, perc: 18.5 },
  { range: "3 - 5 Years", count: 142, avg: 285000, total: 40470000, perc: 32.4 },
  { range: "5 - 10 Years", count: 98, avg: 450000, total: 44100000, perc: 35.3 },
  { range: "10+ Years", count: 25, avg: 692000, total: 17305000, perc: 13.8 },
];

const DEPT_DATA: DepartmentData[] = [
  { name: "Engineering", count: 145, liability: 52400000, trend: "+3.2%" },
  { name: "Operations", count: 210, liability: 41200000, trend: "+1.5%" },
  { name: "Human Resources", count: 24, liability: 8500000, trend: "+0.8%" },
  { name: "Finance & Legal", count: 18, liability: 12500000, trend: "+1.2%" },
  { name: "Sales & Marketing", count: 53, liability: 10400000, trend: "+2.1%" },
];

const EMPLOYEE_ROWS: EmployeeRow[] = [
  { id: "EMP-1001", name: "Arsalan Khan", designation: "Senior Lead", department: "Engineering", serviceYears: 4.5, lastBasic: 107500, monthlyProvision: 5375, accumulatedProvision: 185000 },
  { id: "EMP-1105", name: "Zainab Bibi", designation: "Analyst", department: "Finance & Legal", serviceYears: 1.2, lastBasic: 46000, monthlyProvision: 1916, accumulatedProvision: 27500 },
  { id: "EMP-1088", name: "Mustafa Kamal", designation: "Director", department: "Operations", serviceYears: 12.0, lastBasic: 275000, monthlyProvision: 22916, accumulatedProvision: 1250000 },
  { id: "EMP-1201", name: "Ayesha Malik", designation: "Specialist", department: "Human Resources", serviceYears: 3.8, lastBasic: 62500, monthlyProvision: 2604, accumulatedProvision: 85000 },
  { id: "EMP-1210", name: "Hassan Raza", designation: "Platform Engineer", department: "Engineering", serviceYears: 6.1, lastBasic: 148000, monthlyProvision: 9250, accumulatedProvision: 356000 },
  { id: "EMP-1218", name: "Sadia Noor", designation: "Operations Manager", department: "Operations", serviceYears: 8.4, lastBasic: 132000, monthlyProvision: 7700, accumulatedProvision: 498000 },
  { id: "EMP-1226", name: "Usman Tariq", designation: "HR Executive", department: "Human Resources", serviceYears: 2.7, lastBasic: 54000, monthlyProvision: 2250, accumulatedProvision: 61000 },
  { id: "EMP-1232", name: "Fatima Zahra", designation: "Legal Associate", department: "Finance & Legal", serviceYears: 5.3, lastBasic: 91500, monthlyProvision: 5718, accumulatedProvision: 219000 },
  { id: "EMP-1244", name: "Bilal Ahmed", designation: "Sales Manager", department: "Sales & Marketing", serviceYears: 7.5, lastBasic: 118000, monthlyProvision: 7375, accumulatedProvision: 401000 },
  { id: "EMP-1255", name: "Rabia Iqbal", designation: "Project Coordinator", department: "Operations", serviceYears: 3.2, lastBasic: 68000, monthlyProvision: 2833, accumulatedProvision: 92000 },
  { id: "EMP-1261", name: "Ali Hamza", designation: "Backend Engineer", department: "Engineering", serviceYears: 9.1, lastBasic: 165000, monthlyProvision: 10312, accumulatedProvision: 552000 },
  { id: "EMP-1268", name: "Marium Javed", designation: "Brand Specialist", department: "Sales & Marketing", serviceYears: 2.3, lastBasic: 58500, monthlyProvision: 2437, accumulatedProvision: 47000 },
];

const DEFAULT_PER_PAGE = 5;

function formatPKRCompact(value: number): string {
  return `PKR ${(value / 1_000_000).toFixed(1)}M`;
}

function formatPKR(value: number): string {
  return `PKR ${value.toLocaleString()}`;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function GratuityProvisionReport() {
  const [asOfDate, setAsOfDate] = useState("2025-01-31");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [page, setPage] = useState(1);

  const totalEligibleStaff = useMemo(
    () => BRACKET_DATA.reduce((sum, item) => sum + item.count, 0),
    []
  );

  const estimatedLiability = useMemo(
    () => BRACKET_DATA.reduce((sum, item) => sum + item.total, 0),
    []
  );

  const averageProvisionPerEmployee = Math.round(
    estimatedLiability / totalEligibleStaff
  );

  const departments = useMemo(
    () => ["all", ...DEPT_DATA.map((item) => item.name)],
    []
  );

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return EMPLOYEE_ROWS.filter((employee) => {
      const matchesDepartment =
        departmentFilter === "all" || employee.department === departmentFilter;

      const haystack = [
        employee.id,
        employee.name,
        employee.designation,
        employee.department,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);

      return matchesDepartment && matchesSearch;
    });
  }, [search, departmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / DEFAULT_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * DEFAULT_PER_PAGE;
    return filteredEmployees.slice(start, start + DEFAULT_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const showingFrom = filteredEmployees.length === 0 ? 0 : (currentPage - 1) * DEFAULT_PER_PAGE + 1;
  const showingTo = filteredEmployees.length === 0
    ? 0
    : Math.min(currentPage * DEFAULT_PER_PAGE, filteredEmployees.length);

  const activeDepartments = useMemo(() => {
    if (departmentFilter === "all") return DEPT_DATA;
    return DEPT_DATA.filter((dept) => dept.name === departmentFilter);
  }, [departmentFilter]);

  const exportDetailCsv = () => {
    downloadCsv(
      `gratuity-detail-${asOfDate}.csv`,
      [
        "Employee ID",
        "Name",
        "Designation",
        "Department",
        "Service Years",
        "Last Basic",
        "Monthly Provision",
        "Accumulated Provision",
      ],
      filteredEmployees.map((employee) => [
        employee.id,
        employee.name,
        employee.designation,
        employee.department,
        employee.serviceYears,
        employee.lastBasic,
        employee.monthlyProvision,
        employee.accumulatedProvision,
      ])
    );
  };

  const exportFullReport = () => {
    const reportRows: (string | number)[][] = [];

    reportRows.push(["As Of Date", asOfDate]);
    reportRows.push(["Total Eligible Staff", totalEligibleStaff]);
    reportRows.push(["Estimated Liability", estimatedLiability]);
    reportRows.push(["Average Provision Per Employee", averageProvisionPerEmployee]);
    reportRows.push([]);
    reportRows.push(["Service Bracket Summary"]);
    reportRows.push(["Range", "Employees", "Average Provision", "Total Liability", "Weight %"]);
    BRACKET_DATA.forEach((item) => {
      reportRows.push([item.range, item.count, item.avg, item.total, item.perc]);
    });
    reportRows.push([]);
    reportRows.push(["Department Summary"]);
    reportRows.push(["Department", "Employees", "Liability", "Trend"]);
    DEPT_DATA.forEach((item) => {
      reportRows.push([item.name, item.count, item.liability, item.trend]);
    });
    reportRows.push([]);
    reportRows.push(["Employee Detail"]);
    reportRows.push([
      "Employee ID",
      "Name",
      "Designation",
      "Department",
      "Service Years",
      "Last Basic",
      "Monthly Provision",
      "Accumulated Provision",
    ]);
    filteredEmployees.forEach((employee) => {
      reportRows.push([
        employee.id,
        employee.name,
        employee.designation,
        employee.department,
        employee.serviceYears,
        employee.lastBasic,
        employee.monthlyProvision,
        employee.accumulatedProvision,
      ]);
    });

    downloadCsv(`gratuity-provision-report-${asOfDate}.csv`, ["Report"], reportRows);
  };

  const exportAuditLog = () => {
    downloadCsv(
      `gratuity-audit-log-${asOfDate}.csv`,
      ["Timestamp", "Action", "Reference", "Status"],
      [
        [`${asOfDate} 09:00`, "Provision snapshot generated", "EOS-JV-JAN25", "Success"],
        [`${asOfDate} 09:05`, "Department liability validated", "DEPT-LIAB", "Success"],
        [`${asOfDate} 09:12`, "Employee detail reviewed", "EMP-DETAIL", "Success"],
        [`${asOfDate} 09:18`, "Finance export prepared", "FIN-EXPORT", "Success"],
      ]
    );
  };

  React.useEffect(() => {
    setPage(1);
  }, [search, departmentFilter]);

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <CalculatorIcon />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    Gratuity Provision Report
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Actuarial estimation of total end-of-service liability
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className="h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <button
                  onClick={exportFullReport}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Eligible Staff"
              value={totalEligibleStaff.toLocaleString()}
              helper="Excludes staff below 1 year"
              icon={<Users className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Estimated Liability"
              value={formatPKRCompact(estimatedLiability)}
              helper="+2.5M vs Dec 2024"
              helperTone="success"
              icon={<TrendingUp className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Annual Growth"
              value="PKR 15.0M"
              helper="Since Jan 2024"
              icon={<BarChart3 className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Avg Provision / EE"
              value={formatPKR(averageProvisionPerEmployee)}
              helper="Based on eligible staff count"
              icon={<Building2 className="h-4 w-4 text-brand-700" />}
            />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm">
                <span className="text-brand-700">As of </span>
                <span className="font-semibold text-brand-900">{asOfDate}</span>
                <span className="text-brand-700"> · Estimated total liability </span>
                <span className="font-semibold text-brand-900">
                  {formatPKRCompact(estimatedLiability)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                <span>
                  <span className="font-semibold text-brand-900">{DEPT_DATA.length}</span>{" "}
                  Departments
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">{totalEligibleStaff}</span>{" "}
                  Eligible
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">
                    {formatPKR(averageProvisionPerEmployee)}
                  </span>{" "}
                  Avg / EE
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-800">
                  <BarChart3 className="h-4 w-4" />
                  Analysis by Service Tenure
                </h3>
                <span className="text-[11px] text-brand-700">Liability distribution</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Service Range
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Employees
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Avg Provision
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Total Liability
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-brand-300/50 bg-white">
                    {BRACKET_DATA.map((item) => (
                      <tr key={item.range} className="transition-colors hover:bg-brand-100">
                        <td className="px-5 py-3.5 text-sm">
                          <div className="space-y-1.5">
                            <div className="font-semibold text-brand-900">{item.range}</div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                              <div
                                className="h-full rounded-full bg-brand-800"
                                style={{ width: `${item.perc}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm font-semibold text-brand-900">
                          {item.count}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-900">
                          {formatPKR(item.avg)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-900">
                          {formatPKRCompact(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="border-t border-gray-200 bg-brand-100/40">
                    <tr>
                      <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Consolidated Summary
                      </td>
                      <td className="px-5 py-3 text-center text-sm font-semibold text-brand-900">
                        {totalEligibleStaff}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-brand-700">—</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-brand-900">
                        {formatPKRCompact(estimatedLiability)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                  <Info className="h-4 w-4 text-brand-800" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-brand-900">
                    Provisioning Methodology
                  </h4>
                  <p className="text-sm leading-6 text-brand-700">
                    Values are calculated using the last drawn basic as of the
                    selected date. The model applies 15-day basic for the first
                    5 years and 30-day basic for each subsequent year.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-800">
                  <Building2 className="h-4 w-4" />
                  Department Liability
                </h3>
                <span className="text-[11px] text-brand-700">
                  {activeDepartments.length} shown
                </span>
              </div>

              <div className="divide-y divide-brand-300/50">
                {activeDepartments.map((dept) => (
                  <div
                    key={dept.name}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-brand-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-xs font-semibold text-white">
                        {dept.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-brand-900">
                          {dept.name}
                        </div>
                        <div className="text-[11px] text-brand-700">
                          {dept.count} members
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-brand-900">
                        {formatPKRCompact(dept.liability)}
                      </div>
                      <div className="text-[11px] text-emerald-600">{dept.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-brand-900 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Actuarial Status
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-white">
                    Certified calculation model
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    Provisioning records are ready for monthly general ledger
                    posting under reference JV-EOS-JAN25.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                  <Users className="h-4 w-4 text-brand-800" />
                  Employee-wise Detailed Provisions
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Preview rows with searchable staff-level provision records
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800 sm:w-72"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept === "all" ? "All Departments" : dept}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={exportDetailCsv}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Detail
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm">
                <span className="text-brand-700">Showing </span>
                <span className="font-semibold text-brand-900">{showingFrom}</span>
                <span className="text-brand-700"> to </span>
                <span className="font-semibold text-brand-900">{showingTo}</span>
                <span className="text-brand-700"> of </span>
                <span className="font-semibold text-brand-900">
                  {filteredEmployees.length}
                </span>
                <span className="text-brand-700"> preview rows</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                <span>
                  <span className="font-semibold text-brand-900">
                    {departmentFilter === "all" ? "All" : departmentFilter}
                  </span>{" "}
                  scope
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">{asOfDate}</span>{" "}
                  snapshot
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Staff Member
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Designation
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Department
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Service Years
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Last Basic
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Monthly Provision
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Accumulated
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-300/50 bg-white">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-brand-300" />
                        <p className="text-sm font-semibold text-brand-900">
                          No records found
                        </p>
                        <p className="text-sm text-brand-700">
                          Try changing the search or department filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((employee) => (
                    <tr key={employee.id} className="transition-colors hover:bg-brand-100">
                      <td className="px-5 py-3.5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-xs font-semibold text-white">
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-900">
                              {employee.name}
                            </div>
                            <div className="text-[11px] text-brand-700">
                              {employee.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-brand-900">
                        {employee.designation}
                      </td>

                      <td className="px-5 py-3.5 text-sm text-brand-900">
                        {employee.department}
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm font-semibold text-brand-900">
                        {employee.serviceYears.toFixed(1)}Y
                      </td>

                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-900">
                        {formatPKR(employee.lastBasic)}
                      </td>

                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-900">
                        {formatPKR(employee.monthlyProvision)}
                      </td>

                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-900">
                        {formatPKR(employee.accumulatedProvision)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length > 0 && (
            <div className="border-t border-gray-200 px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-brand-700">
                  Page{" "}
                  <span className="font-semibold text-brand-900">{currentPage}</span>{" "}
                  of{" "}
                  <span className="font-semibold text-brand-900">{totalPages}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <IconButton
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                    icon={<ChevronsLeft className="h-4 w-4" />}
                  />
                  <IconButton
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    icon={<ChevronLeft className="h-4 w-4" />}
                  />

                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNumber = 1;

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
                        onClick={() => setPage(pageNumber)}
                        className={
                          pageNumber === currentPage
                            ? "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-brand-800 bg-brand-800 px-3 text-sm font-semibold text-white"
                            : "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                        }
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <IconButton
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    icon={<ChevronRight className="h-4 w-4" />}
                  />
                  <IconButton
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages}
                    icon={<ChevronsRight className="h-4 w-4" />}
                  />
                </div>

                <button
                  onClick={exportAuditLog}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                >
                  <Download className="h-4 w-4" />
                  Download Audit Log
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  helperTone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  helperTone?: "default" | "success";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
          {icon}
        </div>
      </div>

      <div className="text-2xl font-bold text-brand-900">{value}</div>

      <p
        className={
          helperTone === "success"
            ? "mt-2 text-[11px] font-medium text-emerald-600"
            : "mt-2 text-[11px] text-brand-700"
        }
      >
        {helper}
      </p>
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
    </button>
  );
}

function CalculatorIcon() {
  return <FileSpreadsheet className="h-5 w-5 text-white" />;
}