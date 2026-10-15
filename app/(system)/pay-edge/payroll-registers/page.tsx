"use client";

import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Search,
  Filter,
  ChevronDown,
  Building2,
  Landmark,
  ShieldCheck,
  LayoutList,
  PieChart,
  Info,
  Printer,
  Users,
  Wallet,
  Receipt,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
type ReportType =
  | "FULL"
  | "SUMMARY"
  | "DEPARTMENT"
  | "COST_CENTER"
  | "BANK"
  | "STATUTORY";
interface RegisterRow {
  id: string;
  name: string;
  dept: string;
  costCenter: string;
  bankName: string;
  basic: number;
  allowances: number;
  gross: number;
  tax: number;
  pf: number;
  eobi: number;
  essi: number;
  deducts: number;
  net: number;
}
interface PayrollRun {
  id: string;
  label: string;
  authId: string;
  rows: RegisterRow[];
}
interface AggregatedRow {
  label: string;
  employees: number;
  gross: number;
  deductions: number;
  net: number;
  tax?: number;
  pf?: number;
  eobi?: number;
  essi?: number;
}
const DEFAULT_PER_PAGE = 10;
const RUNS: PayrollRun[] = [
  {
    id: "jan-2025-v12",
    label: "Jan 2025 (v1.2)",
    authId: "FX-AUTH-9922",
    rows: [
      {
        id: "EMP-1001",
        name: "Arsalan Khan",
        dept: "Engineering",
        costCenter: "CC-ENG-01",
        bankName: "HBL",
        basic: 107500,
        allowances: 107500,
        gross: 215000,
        tax: 22500,
        pf: 7500,
        eobi: 400,
        essi: 0,
        deducts: 30400,
        net: 184600,
      },
      {
        id: "EMP-1005",
        name: "Mustafa Kamal",
        dept: "Engineering",
        costCenter: "CC-ENG-02",
        bankName: "MCB",
        basic: 275000,
        allowances: 275000,
        gross: 550000,
        tax: 110000,
        pf: 20000,
        eobi: 400,
        essi: 0,
        deducts: 130400,
        net: 419600,
      },
      {
        id: "EMP-1102",
        name: "Saira Ahmed",
        dept: "HR",
        costCenter: "CC-HR-01",
        bankName: "HBL",
        basic: 62500,
        allowances: 62500,
        gross: 125000,
        tax: 12500,
        pf: 6250,
        eobi: 400,
        essi: 0,
        deducts: 19150,
        net: 105850,
      },
      {
        id: "EMP-1004",
        name: "Zainab Bibi",
        dept: "Operations",
        costCenter: "CC-OPS-01",
        bankName: "UBL",
        basic: 46000,
        allowances: 46000,
        gross: 92000,
        tax: 5000,
        pf: 5000,
        eobi: 400,
        essi: 0,
        deducts: 10400,
        net: 81600,
      },
      {
        id: "EMP-1003",
        name: "Umar Farooq",
        dept: "Sales",
        costCenter: "CC-SAL-01",
        bankName: "HBL",
        basic: 22500,
        allowances: 22500,
        gross: 45000,
        tax: 0,
        pf: 2500,
        eobi: 400,
        essi: 0,
        deducts: 2900,
        net: 42100,
      },
      {
        id: "EMP-1020",
        name: "Areeba Khan",
        dept: "Finance",
        costCenter: "CC-FIN-01",
        bankName: "Bank Alfalah",
        basic: 90000,
        allowances: 60000,
        gross: 150000,
        tax: 18000,
        pf: 9000,
        eobi: 400,
        essi: 0,
        deducts: 27400,
        net: 122600,
      },
      {
        id: "EMP-1025",
        name: "Bilal Raza",
        dept: "Operations",
        costCenter: "CC-OPS-02",
        bankName: "MCB",
        basic: 70000,
        allowances: 30000,
        gross: 100000,
        tax: 7000,
        pf: 7000,
        eobi: 400,
        essi: 0,
        deducts: 14400,
        net: 85600,
      },
    ],
  },
  {
    id: "dec-2024-final",
    label: "Dec 2024 Final",
    authId: "FX-AUTH-9817",
    rows: [
      {
        id: "EMP-1001",
        name: "Arsalan Khan",
        dept: "Engineering",
        costCenter: "CC-ENG-01",
        bankName: "HBL",
        basic: 105000,
        allowances: 105000,
        gross: 210000,
        tax: 21500,
        pf: 7500,
        eobi: 400,
        essi: 0,
        deducts: 29400,
        net: 180600,
      },
      {
        id: "EMP-1102",
        name: "Saira Ahmed",
        dept: "HR",
        costCenter: "CC-HR-01",
        bankName: "HBL",
        basic: 60000,
        allowances: 60000,
        gross: 120000,
        tax: 12000,
        pf: 6000,
        eobi: 400,
        essi: 0,
        deducts: 18400,
        net: 101600,
      },
      {
        id: "EMP-1003",
        name: "Umar Farooq",
        dept: "Sales",
        costCenter: "CC-SAL-01",
        bankName: "HBL",
        basic: 22000,
        allowances: 22000,
        gross: 44000,
        tax: 0,
        pf: 2400,
        eobi: 400,
        essi: 0,
        deducts: 2800,
        net: 41200,
      },
    ],
  },
];
function formatPKR(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 0 });
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
function createCsv(
  headers: string[],
  rows: Array<Array<string | number>>,
): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}
function downloadBlob(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
function groupRows(
  rows: RegisterRow[],
  key: "dept" | "costCenter" | "bankName",
): AggregatedRow[] {
  const map = new Map<string, AggregatedRow>();
  rows.forEach((row) => {
    const label = row[key];
    const existing = map.get(label);
    if (existing) {
      existing.employees += 1;
      existing.gross += row.gross;
      existing.deductions += row.deducts;
      existing.net += row.net;
      existing.tax = (existing.tax || 0) + row.tax;
      existing.pf = (existing.pf || 0) + row.pf;
      existing.eobi = (existing.eobi || 0) + row.eobi;
      existing.essi = (existing.essi || 0) + row.essi;
    } else {
      map.set(label, {
        label,
        employees: 1,
        gross: row.gross,
        deductions: row.deducts,
        net: row.net,
        tax: row.tax,
        pf: row.pf,
        eobi: row.eobi,
        essi: row.essi,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
function buildPrintHtml(
  title: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): string {
  const tableHeader = headers
    .map(
      (header) =>
        `<th style="padding:10px;border:1px solid #d1d5db;text-align:left;font-size:12px;background:#f8fafc;">${header}</th>`,
    )
    .join("");
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td style="padding:10px;border:1px solid #e5e7eb;font-size:12px;">${String(cell)}</td>`).join("")}</tr>`,
    )
    .join("");
  return ` <html> <head> <title>${title}</title> </head> <body style="font-family: Arial, sans-serif; padding: 24px; color: #111827;"> <h1 style="margin: 0 0 8px; font-size: 24px;">${title}</h1> <p style="margin: 0 0 24px; color: #6b7280;">${subtitle}</p> <table style="width:100%; border-collapse: collapse;"> <thead><tr>${tableHeader}</tr></thead> <tbody>${tableRows}</tbody> </table> </body> </html> `;
}
 function PayrollRegisters() {
  const [reportType, setReportType] = useState<ReportType>("FULL");
  const [selectedRunId, setSelectedRunId] = useState<string>(RUNS[0].id);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const selectedRun = useMemo(
    () => RUNS.find((run) => run.id === selectedRunId) ?? RUNS[0],
    [selectedRunId],
  );
  const departments = useMemo(() => {
    const values = Array.from(new Set(selectedRun.rows.map((row) => row.dept)));
    return ["All Departments", ...values];
  }, [selectedRun]);
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return selectedRun.rows.filter((row) => {
      const matchesSearch =
        !needle ||
        [row.id, row.name, row.dept, row.costCenter, row.bankName]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesDepartment =
        departmentFilter === "All Departments" || row.dept === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [selectedRun, search, departmentFilter]);
  const summaryStats = useMemo(() => {
    const employees = filteredRows.length;
    const gross = filteredRows.reduce((sum, row) => sum + row.gross, 0);
    const deductions = filteredRows.reduce((sum, row) => sum + row.deducts, 0);
    const net = filteredRows.reduce((sum, row) => sum + row.net, 0);
    return { employees, gross, deductions, net };
  }, [filteredRows]);
  const departmentReport = useMemo(
    () => groupRows(filteredRows, "dept"),
    [filteredRows],
  );
  const costCenterReport = useMemo(
    () => groupRows(filteredRows, "costCenter"),
    [filteredRows],
  );
  const bankReport = useMemo(
    () => groupRows(filteredRows, "bankName"),
    [filteredRows],
  );
  const statutoryReport = useMemo(() => {
    const taxedEmployees = filteredRows.filter((row) => row.tax > 0).length;
    const pfEmployees = filteredRows.filter((row) => row.pf > 0).length;
    const eobiEmployees = filteredRows.filter((row) => row.eobi > 0).length;
    const essiEmployees = filteredRows.filter((row) => row.essi > 0).length;
    return [
      {
        label: "Income Tax (FBR)",
        employees: taxedEmployees,
        gross: filteredRows.reduce((sum, row) => sum + row.tax, 0),
        deductions: 0,
        net: 0,
      },
      {
        label: "Provident Fund",
        employees: pfEmployees,
        gross: filteredRows.reduce((sum, row) => sum + row.pf, 0),
        deductions: 0,
        net: 0,
      },
      {
        label: "EOBI",
        employees: eobiEmployees,
        gross: filteredRows.reduce((sum, row) => sum + row.eobi, 0),
        deductions: 0,
        net: 0,
      },
      {
        label: "ESSI",
        employees: essiEmployees,
        gross: filteredRows.reduce((sum, row) => sum + row.essi, 0),
        deductions: 0,
        net: 0,
      },
    ];
  }, [filteredRows]);
  const executiveSummary = useMemo(() => {
    const avgGross =
      filteredRows.length > 0 ? summaryStats.gross / filteredRows.length : 0;
    const avgNet =
      filteredRows.length > 0 ? summaryStats.net / filteredRows.length : 0;
    return [
      { metric: "Employees Processed", value: filteredRows.length },
      { metric: "Total Gross", value: summaryStats.gross },
      { metric: "Total Deductions", value: summaryStats.deductions },
      { metric: "Total Net Pay", value: summaryStats.net },
      { metric: "Average Gross", value: Math.round(avgGross) },
      { metric: "Average Net", value: Math.round(avgNet) },
    ];
  }, [filteredRows, summaryStats]);
  const activeRows = useMemo(() => {
    switch (reportType) {
      case "FULL":
        return filteredRows;
      case "DEPARTMENT":
        return departmentReport;
      case "COST_CENTER":
        return costCenterReport;
      case "BANK":
        return bankReport;
      case "STATUTORY":
        return statutoryReport;
      case "SUMMARY":
        return executiveSummary;
      default:
        return filteredRows;
    }
  }, [
    reportType,
    filteredRows,
    departmentReport,
    costCenterReport,
    bankReport,
    statutoryReport,
    executiveSummary,
  ]);
  const totalEntries = activeRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return activeRows.slice(start, start + perPage);
  }, [activeRows, currentPage, perPage]);
  const resetPage = (): void => setPage(1);
  const handlePrint = (): void => {
    let headers: string[] = [];
    let rows: Array<Array<string | number>> = [];
    if (reportType === "FULL") {
      headers = [
        "Emp ID",
        "Full Name",
        "Department",
        "Basic",
        "Allowances",
        "Gross",
        "Income Tax",
        "PF",
        "Deductions",
        "Net",
      ];
      rows = filteredRows.map((row) => [
        row.id,
        row.name,
        row.dept,
        row.basic,
        row.allowances,
        row.gross,
        row.tax,
        row.pf,
        row.deducts,
        row.net,
      ]);
    } else if (reportType === "SUMMARY") {
      headers = ["Metric", "Value"];
      rows = executiveSummary.map((row) => [row.metric, row.value]);
    } else {
      headers = ["Label", "Employees", "Gross", "Deductions", "Net"];
      rows = (activeRows as AggregatedRow[]).map((row) => [
        row.label,
        row.employees,
        row.gross,
        row.deductions,
        row.net,
      ]);
    }
    const html = buildPrintHtml(
      "Payroll Registers",
      `${selectedRun.label} • ${reportType.replace("_", " ")}`,
      headers,
      rows,
    );
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const handleExportCsv = (): void => {
    if (reportType === "FULL") {
      const csv = createCsv(
        [
          "Emp ID",
          "Full Name",
          "Department",
          "Cost Center",
          "Bank",
          "Basic",
          "Allowances",
          "Gross",
          "Tax",
          "PF",
          "EOBI",
          "ESSI",
          "Deductions",
          "Net",
        ],
        filteredRows.map((row) => [
          row.id,
          row.name,
          row.dept,
          row.costCenter,
          row.bankName,
          row.basic,
          row.allowances,
          row.gross,
          row.tax,
          row.pf,
          row.eobi,
          row.essi,
          row.deducts,
          row.net,
        ]),
      );
      downloadBlob(csv, "payroll-register-raw.csv", "text/csv;charset=utf-8;");
      return;
    }
    if (reportType === "SUMMARY") {
      const csv = createCsv(
        ["Metric", "Value"],
        executiveSummary.map((row) => [row.metric, row.value]),
      );
      downloadBlob(csv, "payroll-summary.csv", "text/csv;charset=utf-8;");
      return;
    }
    const csv = createCsv(
      ["Label", "Employees", "Gross", "Deductions", "Net"],
      (activeRows as AggregatedRow[]).map((row) => [
        row.label,
        row.employees,
        row.gross,
        row.deductions,
        row.net,
      ]),
    );
    downloadBlob(
      csv,
      `payroll-${reportType.toLowerCase()}-report.csv`,
      "text/csv;charset=utf-8;",
    );
  };
  const handleExportExcelCompatible = (): void => {
    let headers: string[] = [];
    let rows: Array<Array<string | number>> = [];
    if (reportType === "FULL") {
      headers = [
        "Emp ID",
        "Full Name",
        "Department",
        "Cost Center",
        "Bank",
        "Basic",
        "Allowances",
        "Gross",
        "Tax",
        "PF",
        "EOBI",
        "ESSI",
        "Deductions",
        "Net",
      ];
      rows = filteredRows.map((row) => [
        row.id,
        row.name,
        row.dept,
        row.costCenter,
        row.bankName,
        row.basic,
        row.allowances,
        row.gross,
        row.tax,
        row.pf,
        row.eobi,
        row.essi,
        row.deducts,
        row.net,
      ]);
    } else if (reportType === "SUMMARY") {
      headers = ["Metric", "Value"];
      rows = executiveSummary.map((row) => [row.metric, row.value]);
    } else {
      headers = ["Label", "Employees", "Gross", "Deductions", "Net"];
      rows = (activeRows as AggregatedRow[]).map((row) => [
        row.label,
        row.employees,
        row.gross,
        row.deductions,
        row.net,
      ]);
    }
    const content = [headers, ...rows]
      .map((row) => row.map((cell) => String(cell)).join("\t"))
      .join("\n");
    downloadBlob(
      content,
      `payroll-${reportType.toLowerCase()}-report.xls`,
      "application/vnd.ms-excel",
    );
  };
  const renderFullTable = () => (
    <div className="overflow-x-auto">
      {" "}
      <table className="w-full min-w-[1450px] text-left">
        {" "}
        <thead className="border-b border-gray-200 bg-brand-800 text-white">
          {" "}
          <tr>
            {" "}
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
              {" "}
              Emp ID{" "}
            </th>{" "}
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
              {" "}
              Full Name{" "}
            </th>{" "}
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
              {" "}
              Department{" "}
            </th>{" "}
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
              {" "}
              Cost Center{" "}
            </th>{" "}
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
              {" "}
              Bank{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
              {" "}
              Basic Salary{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
              {" "}
              Allowances{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
              {" "}
              Gross Pay{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
              {" "}
              Income Tax{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
              {" "}
              PF Share{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
              {" "}
              Total Deducts{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
              {" "}
              Net Payable{" "}
            </th>{" "}
          </tr>{" "}
        </thead>{" "}
        <tbody className="divide-y divide-gray-200 bg-white">
          {" "}
          {(paginatedRows as RegisterRow[]).map((row) => (
            <tr key={row.id} className="hover:bg-brand-100/50">
              {" "}
              <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                {" "}
                {row.id}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                {" "}
                {row.name}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-sm text-brand-800">{row.dept}</td>{" "}
              <td className="px-5 py-4 text-sm text-brand-800">
                {" "}
                {row.costCenter}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-sm text-brand-800">
                {" "}
                {row.bankName}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-right text-sm font-medium text-brand-800">
                {" "}
                {formatPKR(row.basic)}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-right text-sm font-medium text-brand-800">
                {" "}
                {formatPKR(row.allowances)}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                {" "}
                {formatPKR(row.gross)}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-right text-sm font-medium text-red-700">
                {" "}
                ({formatPKR(row.tax)}){" "}
              </td>{" "}
              <td className="px-5 py-4 text-right text-sm font-medium text-red-700">
                {" "}
                ({formatPKR(row.pf)}){" "}
              </td>{" "}
              <td className="px-5 py-4 text-right text-sm font-semibold text-red-700">
                {" "}
                ({formatPKR(row.deducts)}){" "}
              </td>{" "}
              <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-700">
                {" "}
                {formatPKR(row.net)}{" "}
              </td>{" "}
            </tr>
          ))}{" "}
        </tbody>{" "}
        <tfoot>
          {" "}
          <tr className="border-t-2 border-gray-200 bg-brand-800 text-white">
            {" "}
            <th
              colSpan={7}
              className="px-5 py-4 text-right text-sm font-semibold"
            >
              {" "}
              Company Grand Total ({selectedRun.label}){" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-sm font-semibold">
              {" "}
              {formatPKR(summaryStats.gross)}{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-sm font-semibold">
              {" "}
              ({formatPKR(filteredRows.reduce((sum, row) => sum + row.tax, 0))}
              ){" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-sm font-semibold">
              {" "}
              ({formatPKR(filteredRows.reduce((sum, row) => sum + row.pf, 0))}
              ){" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-sm font-semibold">
              {" "}
              ({formatPKR(summaryStats.deductions)}){" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-base font-bold text-white">
              {" "}
              {formatPKR(summaryStats.net)}{" "}
            </th>{" "}
          </tr>{" "}
        </tfoot>{" "}
      </table>{" "}
    </div>
  );
  const renderSummaryView = () => (
    <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
      {" "}
      {executiveSummary.map((item) => (
        <div
          key={item.metric}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          {" "}
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            {" "}
            {item.metric}{" "}
          </p>{" "}
          <p className="mt-3 text-2xl font-bold text-brand-900">
            {" "}
            {typeof item.value === "number" && item.metric.includes("Employees")
              ? item.value
              : typeof item.value === "number"
                ? `PKR ${formatPKR(item.value)}`
                : item.value}{" "}
          </p>{" "}
        </div>
      ))}{" "}
    </div>
  );
  const renderAggregatedTable = (
    rows: AggregatedRow[],
    headingLabel: string,
  ) => (
    <div className="overflow-x-auto">
      {" "}
      <table className="w-full min-w-[980px] text-left">
        {" "}
        <thead className="border-b border-gray-200 bg-white">
          {" "}
          <tr>
            {" "}
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800">
              {" "}
              {headingLabel}{" "}
            </th>{" "}
            <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
              {" "}
              Employees{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
              {" "}
              Gross{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
              {" "}
              Deductions{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
              {" "}
              Net{" "}
            </th>{" "}
          </tr>{" "}
        </thead>{" "}
        <tbody className="divide-y divide-gray-200 bg-white">
          {" "}
          {rows.length === 0 ? (
            <tr>
              {" "}
              <td colSpan={5} className="px-6 py-16 text-center">
                {" "}
                <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                  {" "}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                    {" "}
                    <PieChart className="h-5 w-5 text-brand-800" />{" "}
                  </div>{" "}
                  <p className="text-sm font-semibold text-brand-900">
                    {" "}
                    No report rows found{" "}
                  </p>{" "}
                  <p className="text-sm text-brand-700">
                    {" "}
                    Try changing the report filters or payroll run.{" "}
                  </p>{" "}
                </div>{" "}
              </td>{" "}
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.label} className="hover:bg-brand-100/50">
                {" "}
                <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                  {" "}
                  {row.label}{" "}
                </td>{" "}
                <td className="px-5 py-4 text-center text-sm font-medium text-brand-800">
                  {" "}
                  {row.employees}{" "}
                </td>{" "}
                <td className="px-5 py-4 text-right text-sm font-medium text-brand-800">
                  {" "}
                  {formatPKR(row.gross)}{" "}
                </td>{" "}
                <td className="px-5 py-4 text-right text-sm font-medium text-red-700">
                  {" "}
                  {formatPKR(row.deductions)}{" "}
                </td>{" "}
                <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-700">
                  {" "}
                  {formatPKR(row.net)}{" "}
                </td>{" "}
              </tr>
            ))
          )}{" "}
        </tbody>{" "}
      </table>{" "}
    </div>
  );
  const renderStatutoryTable = () => (
    <div className="overflow-x-auto">
      {" "}
      <table className="w-full min-w-[880px] text-left">
        {" "}
        <thead className="border-b border-gray-200 bg-white">
          {" "}
          <tr>
            {" "}
            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800">
              {" "}
              Register{" "}
            </th>{" "}
            <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
              {" "}
              Employees{" "}
            </th>{" "}
            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
              {" "}
              Contribution{" "}
            </th>{" "}
          </tr>{" "}
        </thead>{" "}
        <tbody className="divide-y divide-gray-200 bg-white">
          {" "}
          {(paginatedRows as AggregatedRow[]).map((row) => (
            <tr key={row.label} className="hover:bg-brand-100/50">
              {" "}
              <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                {" "}
                {row.label}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-center text-sm font-medium text-brand-800">
                {" "}
                {row.employees}{" "}
              </td>{" "}
              <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                {" "}
                {formatPKR(row.gross)}{" "}
              </td>{" "}
            </tr>
          ))}{" "}
        </tbody>{" "}
      </table>{" "}
    </div>
  );
  return (
    <div className="min-h-screen bg-white p-3">
      {" "}
      <div className="space-y-4">
        {" "}
        {/* Header */}{" "}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {" "}
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            {" "}
            <div>
              {" "}
              <h2 className="text-2xl font-bold text-brand-900">
                {" "}
                Payroll Registers{" "}
              </h2>{" "}
              <p className="mt-0.5 text-sm text-brand-700">
                {" "}
                Comprehensive audit reports and statutory compliance
                registers{" "}
              </p>{" "}
            </div>{" "}
            <div className="flex flex-wrap items-center gap-2">
              {" "}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                {" "}
                <Printer className="h-4 w-4" /> Print View{" "}
              </button>{" "}
              <div className="relative">
                {" "}
                <button
                  onClick={() => setShowExportMenu((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  {" "}
                  <Download className="h-4 w-4" /> Export Report{" "}
                  <ChevronDown className="h-4 w-4" />{" "}
                </button>{" "}
                {showExportMenu && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    {" "}
                    <button
                      onClick={() => {
                        handleExportExcelCompatible();
                        setShowExportMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                    >
                      {" "}
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />{" "}
                      Excel-compatible (.xls){" "}
                    </button>{" "}
                    <button
                      onClick={() => {
                        handlePrint();
                        setShowExportMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                    >
                      {" "}
                      <FileText className="h-4 w-4 text-red-600" /> PDF / Print
                      View{" "}
                    </button>{" "}
                    <button
                      onClick={() => {
                        handleExportCsv();
                        setShowExportMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                    >
                      {" "}
                      <LayoutList className="h-4 w-4 text-sky-600" /> CSV (Raw
                      Data){" "}
                    </button>{" "}
                  </div>
                )}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Stats */}{" "}
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4">
            {" "}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {" "}
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                {" "}
                Employees{" "}
              </p>{" "}
              <div className="mt-2 flex items-center justify-between">
                {" "}
                <p className="text-2xl font-bold text-brand-900">
                  {" "}
                  {summaryStats.employees}{" "}
                </p>{" "}
                <div className="rounded-lg bg-brand-100 p-2">
                  {" "}
                  <Users className="h-4 w-4 text-brand-800" />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {" "}
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                {" "}
                Total Gross{" "}
              </p>{" "}
              <div className="mt-2 flex items-center justify-between">
                {" "}
                <p className="text-2xl font-bold text-brand-900">
                  {" "}
                  PKR {formatPKR(summaryStats.gross)}{" "}
                </p>{" "}
                <div className="rounded-lg bg-brand-100 p-2">
                  {" "}
                  <Wallet className="h-4 w-4 text-brand-800" />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {" "}
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                {" "}
                Total Deductions{" "}
              </p>{" "}
              <div className="mt-2 flex items-center justify-between">
                {" "}
                <p className="text-2xl font-bold text-brand-900">
                  {" "}
                  PKR {formatPKR(summaryStats.deductions)}{" "}
                </p>{" "}
                <div className="rounded-lg bg-brand-100 p-2">
                  {" "}
                  <Receipt className="h-4 w-4 text-brand-800" />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {" "}
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                {" "}
                Net Payable{" "}
              </p>{" "}
              <div className="mt-2 flex items-center justify-between">
                {" "}
                <p className="text-2xl font-bold text-brand-900">
                  {" "}
                  PKR {formatPKR(summaryStats.net)}{" "}
                </p>{" "}
                <div className="rounded-lg bg-brand-100 p-2">
                  {" "}
                  <Landmark className="h-4 w-4 text-brand-800" />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Selectors */}{" "}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {" "}
          <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            {" "}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {" "}
              <div className="relative min-w-[220px]">
                {" "}
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-700">
                  {" "}
                  Run{" "}
                </span>{" "}
                <select
                  value={selectedRunId}
                  onChange={(e) => {
                    setSelectedRunId(e.target.value);
                    resetPage();
                  }}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-12 pr-4 text-sm font-medium text-brand-900 outline-none transition focus:border-brand-800"
                >
                  {" "}
                  {RUNS.map((run) => (
                    <option key={run.id} value={run.id}>
                      {" "}
                      {run.label}{" "}
                    </option>
                  ))}{" "}
                </select>{" "}
              </div>{" "}
              <div className="relative min-w-[260px]">
                {" "}
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-700">
                  {" "}
                  Type{" "}
                </span>{" "}
                <select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value as ReportType);
                    resetPage();
                  }}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-14 pr-4 text-sm font-medium text-brand-900 outline-none transition focus:border-brand-800"
                >
                  {" "}
                  <option value="FULL">Full Payroll Register</option>{" "}
                  <option value="SUMMARY">Executive Summary</option>{" "}
                  <option value="DEPARTMENT">Department-wise Breakdown</option>{" "}
                  <option value="COST_CENTER">Cost Center Report</option>{" "}
                  <option value="BANK">Bank-wise Disbursement</option>{" "}
                  <option value="STATUTORY">Statutory Register</option>{" "}
                </select>{" "}
              </div>{" "}
              <div className="relative w-full sm:w-[280px]">
                {" "}
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />{" "}
                <input
                  type="text"
                  placeholder="Search records..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetPage();
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {" "}
              <div className="flex items-center gap-2">
                {" "}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white">
                  {" "}
                  <Filter className="h-4 w-4 text-brand-700" />{" "}
                </div>{" "}
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {" "}
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {" "}
                      {dept}{" "}
                    </option>
                  ))}{" "}
                </select>{" "}
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {" "}
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {" "}
                      Show {size}{" "}
                    </option>
                  ))}{" "}
                </select>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Main Report Area */}{" "}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {" "}
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            {" "}
            <div>
              {" "}
              <h3 className="text-sm font-semibold text-brand-900">
                {" "}
                {reportType === "FULL"
                  ? "Full Payroll Register"
                  : reportType === "SUMMARY"
                    ? "Executive Summary"
                    : reportType === "DEPARTMENT"
                      ? "Department-wise Breakdown"
                      : reportType === "COST_CENTER"
                        ? "Cost Center Report"
                        : reportType === "BANK"
                          ? "Bank-wise Disbursement"
                          : "Statutory Register"}{" "}
              </h3>{" "}
              <p className="mt-0.5 text-sm text-brand-700">
                {" "}
                {selectedRun.label} • Authorization ID:{" "}
                {selectedRun.authId}{" "}
              </p>{" "}
            </div>{" "}
            <div className="text-sm">
              {" "}
              <span className="text-brand-700">Showing </span>{" "}
              <span className="font-semibold text-brand-900">
                {showingFrom}
              </span>{" "}
              <span className="text-brand-700"> to </span>{" "}
              <span className="font-semibold text-brand-900">{showingTo}</span>{" "}
              <span className="text-brand-700"> of </span>{" "}
              <span className="font-semibold text-brand-900">
                {totalEntries}
              </span>{" "}
              <span className="text-brand-700"> rows</span>{" "}
            </div>{" "}
          </div>{" "}
          {reportType === "FULL" && renderFullTable()}{" "}
          {reportType === "SUMMARY" && renderSummaryView()}{" "}
          {reportType === "DEPARTMENT" &&
            renderAggregatedTable(
              paginatedRows as AggregatedRow[],
              "Department",
            )}{" "}
          {reportType === "COST_CENTER" &&
            renderAggregatedTable(
              paginatedRows as AggregatedRow[],
              "Cost Center",
            )}{" "}
          {reportType === "BANK" &&
            renderAggregatedTable(
              paginatedRows as AggregatedRow[],
              "Bank",
            )}{" "}
          {reportType === "STATUTORY" && renderStatutoryTable()}{" "}
          {totalEntries > 0 && (
            <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
              {" "}
              <div className="text-sm text-brand-700">
                {" "}
                Page{" "}
                <span className="font-semibold text-brand-900">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-brand-900">
                  {totalPages}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center gap-1.5">
                {" "}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {" "}
                  <ChevronsLeft className="h-4 w-4" />{" "}
                </button>{" "}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {" "}
                  <ChevronsLeft className="h-4 w-4" />{" "}
                </button>{" "}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber = 1;
                  if (totalPages <= 5) pageNumber = i + 1;
                  else if (currentPage <= 3) pageNumber = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNumber = totalPages - 4 + i;
                  else pageNumber = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${currentPage === pageNumber ? "border-brand-800 bg-brand-800 text-white" : "border-gray-200 bg-white text-brand-800 hover:bg-brand-100"}`}
                    >
                      {" "}
                      {pageNumber}{" "}
                    </button>
                  );
                })}{" "}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {" "}
                  <ChevronsRight className="h-4 w-4" />{" "}
                </button>{" "}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(totalPages)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {" "}
                  <ChevronsRight className="h-4 w-4" />{" "}
                </button>{" "}
              </div>{" "}
              <div className="text-sm text-brand-700">
                {" "}
                <span className="font-semibold text-brand-900">
                  {showingFrom}
                </span>{" "}
                {" – "}{" "}
                <span className="font-semibold text-brand-900">
                  {showingTo}
                </span>{" "}
                {" of "}{" "}
                <span className="font-semibold text-brand-900">
                  {totalEntries}
                </span>{" "}
                {" entries"}{" "}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
        {/* Info Banner */}{" "}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {" "}
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            {" "}
            <ShieldCheck className="h-4 w-4 text-brand-800" />{" "}
          </div>{" "}
          <div>
            {" "}
            <p className="text-sm font-semibold text-brand-900">
              {" "}
              Audit Confirmation{" "}
            </p>{" "}
            <p className="mt-1 text-sm leading-6 text-brand-700">
              {" "}
              The register data displayed above corresponds to Authorization ID{" "}
              <span className="font-semibold text-brand-900">
                {" "}
                {selectedRun.authId}{" "}
              </span>{" "}
              . Any post-disbursement corrections should be reflected through
              arrears or adjustment entries in the subsequent payroll
              cycle.{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}


export default PayrollRegisters;