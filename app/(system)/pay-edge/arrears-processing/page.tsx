"use client";
import React, { useMemo, useState } from "react";
import {
  History,
  User,
  Calendar,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Download,
  Plus,
  Wallet,
  ShieldCheck,
  TrendingUp,
  RefreshCcw,
  FileText,
} from "lucide-react";

interface ArrearMonth {
  month: string;
  oldValue: number;
  newValue: number;
  diff: number;
  taxImpact: number;
  netDiff: number;
}

interface EmployeeMaster {
  empId: string;
  empName: string;
  currentGross: number;
  grade: string;
  department: string;
}

const EMPLOYEES: EmployeeMaster[] = [
  {
    empId: "EMP-1001",
    empName: "Arsalan Khan",
    currentGross: 180000,
    grade: "G18",
    department: "Sales",
  },
  {
    empId: "EMP-1002",
    empName: "Saira Ahmed",
    currentGross: 165000,
    grade: "G17",
    department: "Finance",
  },
  {
    empId: "EMP-1003",
    empName: "Umar Farooq",
    currentGross: 210000,
    grade: "G19",
    department: "Operations",
  },
  {
    empId: "EMP-1004",
    empName: "Zainab Bibi",
    currentGross: 195000,
    grade: "G18",
    department: "HR",
  },
  {
    empId: "EMP-1005",
    empName: "Mustafa Kamal",
    currentGross: 175000,
    grade: "G17",
    department: "Admin",
  },
];

const CHANGE_TYPES = [
  "Backdated Increment",
  "Allowance Correction",
  "Grade Re-evaluation",
  "Statutory Fix",
];

const formatPKR = (val: number) =>
  `PKR ${Math.round(val).toLocaleString()}`;

const formatInputMonth = (monthValue: string) => {
  if (!monthValue) return "";
  const [year, month] = monthValue.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const getMonthSequence = (startMonth: string, endMonthExclusive: string) => {
  if (!startMonth || !endMonthExclusive) return [];

  const [startYear, startMon] = startMonth.split("-").map(Number);
  const [endYear, endMon] = endMonthExclusive.split("-").map(Number);

  const start = new Date(startYear, startMon - 1, 1);
  const end = new Date(endYear, endMon - 1, 1);

  const result: string[] = [];
  const cursor = new Date(start);

  while (cursor < end && result.length < 24) {
    result.push(
      cursor.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      })
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
};

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

 const ArrearsProcessing: React.FC = () => {
  const [empId, setEmpId] = useState("EMP-1001");
  const [changeType, setChangeType] = useState("Backdated Increment");
  const [effectiveFrom, setEffectiveFrom] = useState("2024-10");
  const [payrollPeriod, setPayrollPeriod] = useState("2025-01");
  const [newValue, setNewValue] = useState(215000);
  const [calculationNonce, setCalculationNonce] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInjected, setIsInjected] = useState(false);

  const employee = useMemo(
    () =>
      EMPLOYEES.find(
        (item) => item.empId.toLowerCase() === empId.trim().toLowerCase()
      ) || null,
    [empId]
  );

  const arrearsData = useMemo(() => {
    if (!calculationNonce || !employee) return null;

    const months = getMonthSequence(effectiveFrom, payrollPeriod);
    if (months.length === 0) return null;

    const oldGross = employee.currentGross;
    const diffPerMonth = newValue - oldGross;

    const taxRate =
      changeType === "Statutory Fix"
        ? 0.1
        : changeType === "Allowance Correction"
        ? 0.12
        : 0.15;

    const monthBreakdown: ArrearMonth[] = months.map((month) => {
      const diff = diffPerMonth;
      const taxImpact = Math.round(diff * taxRate);
      const netDiff = diff - taxImpact;

      return {
        month,
        oldValue: oldGross,
        newValue,
        diff,
        taxImpact,
        netDiff,
      };
    });

    const totalGross = monthBreakdown.reduce((sum, row) => sum + row.diff, 0);
    const totalTax = monthBreakdown.reduce((sum, row) => sum + row.taxImpact, 0);
    const totalNet = monthBreakdown.reduce((sum, row) => sum + row.netDiff, 0);

    const basicArrears =
      changeType === "Allowance Correction"
        ? 0
        : Math.round(totalGross * 0.7);
    const allowanceArrears =
      changeType === "Allowance Correction"
        ? totalGross
        : Math.round(totalGross * 0.3);
    const pfAdjustment = Math.round(totalGross * 0.08);

    const voucherId = `ARR-${payrollPeriod.replace("-", "")}-${employee.empId}`;

    return {
      employee,
      monthBreakdown,
      totalGross,
      totalTax,
      totalNet,
      basicArrears,
      allowanceArrears,
      pfAdjustment,
      voucherId,
      oldGross,
      diffPerMonth,
      taxRate,
    };
  }, [
    calculationNonce,
    employee,
    effectiveFrom,
    payrollPeriod,
    newValue,
    changeType,
  ]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!empId.trim()) {
      nextErrors.empId = "Employee ID is required.";
    } else if (!employee) {
      nextErrors.empId = "Employee not found in current master data.";
    }

    if (!effectiveFrom) nextErrors.effectiveFrom = "Effective month is required.";
    if (!payrollPeriod) nextErrors.payrollPeriod = "Payroll month is required.";

    if (effectiveFrom && payrollPeriod && effectiveFrom >= payrollPeriod) {
      nextErrors.payrollPeriod =
        "Payroll month must be after the effective month.";
    }

    if (Number(newValue) <= 0) {
      nextErrors.newValue = "New monthly gross must be greater than zero.";
    }

    if (employee && Number(newValue) === employee.currentGross) {
      nextErrors.newValue = "New monthly gross must be different from current gross.";
    }

    const months = getMonthSequence(effectiveFrom, payrollPeriod);
    if (effectiveFrom && payrollPeriod && months.length === 0) {
      nextErrors.effectiveFrom = "No arrear months found for the selected range.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCalculate = () => {
    if (!validate()) {
      setIsInjected(false);
      return;
    }

    setCalculationNonce(Date.now());
    setIsInjected(false);
  };

  const handleDiscard = () => {
    setCalculationNonce(0);
    setIsInjected(false);
  };

  const handleInject = () => {
    if (!arrearsData) return;
    setIsInjected(true);
  };

  const handleExport = () => {
    if (!arrearsData) return;

    const headers = [
      "Month",
      "Original Gross",
      "Revised Gross",
      "Gross Difference",
      "Tax Adjustment",
      "Net Difference",
    ];

    const rows = arrearsData.monthBreakdown.map((row) => [
      row.month,
      row.oldValue,
      row.newValue,
      row.diff,
      row.taxImpact,
      row.netDiff,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `arrears-breakdown-${empId || "employee"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const summaryMonths = arrearsData?.monthBreakdown.length || 0;

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left Panel */}
        <div className="space-y-4 xl:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    Arrears Processing
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Calculate and process backdated salary adjustments and corrections
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Employee ID
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="text"
                    placeholder="e.g. EMP-1001"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
                {errors.empId && (
                  <p className="mt-1 text-xs text-red-600">{errors.empId}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Change Scenario
                </label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-800"
                >
                  {CHANGE_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Effective From
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="month"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
                {errors.effectiveFrom && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.effectiveFrom}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Process In Payroll
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="month"
                    value={payrollPeriod}
                    onChange={(e) => setPayrollPeriod(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
                {errors.payrollPeriod && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.payrollPeriod}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  New Monthly Gross
                </label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value || 0))}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
                {errors.newValue && (
                  <p className="mt-1 text-xs text-red-600">{errors.newValue}</p>
                )}
              </div>

              {/* Employee Snapshot */}
              <div className="rounded-lg border border-gray-200 bg-brand-100/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Employee Snapshot
                </p>

                {employee ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Name</span>
                      <span className="font-semibold text-brand-900">
                        {employee.empName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Department</span>
                      <span className="font-semibold text-brand-900">
                        {employee.department}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Grade</span>
                      <span className="font-semibold text-brand-900">
                        {employee.grade}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-700">Current Gross</span>
                      <span className="font-semibold text-brand-900">
                        {formatPKR(employee.currentGross)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-brand-700">
                    Enter a valid employee ID to load current payroll context.
                  </p>
                )}
              </div>

              <button
                onClick={handleCalculate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Calculator className="h-4 w-4" />
                Calculate Arrears
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
              <Info className="h-4 w-4 text-brand-800" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand-900">
                Calculation Note
              </h4>
              <p className="mt-1 text-sm leading-6 text-brand-700">
                The system compares revised values with historical monthly payroll
                values and recalculates tax impact for each affected month before
                pushing the final net amount into the selected payroll period.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4 xl:col-span-8">
          {!arrearsData ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100/50">
                <History className="h-10 w-10 text-brand-700" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-brand-900">
                Waiting for Calculation
              </h4>
              <p className="mt-2 max-w-md text-sm leading-6 text-brand-700">
                Enter the employee, effective date, payroll period, and revised
                monthly gross to generate a month-by-month arrears breakdown.
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Total Net Arrears Payable
                    </p>
                    <h3 className="mt-2 text-4xl font-bold text-brand-900">
                      {formatPKR(arrearsData.totalNet)}
                    </h3>
                    <p className="mt-1 text-sm text-brand-700">
                      To be injected in {formatInputMonth(payrollPeriod)} payroll
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Months Impacted
                      </p>
                      <p className="mt-2 text-2xl font-bold text-brand-900">
                        {summaryMonths}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Gross Impact
                      </p>
                      <p className="mt-2 text-2xl font-bold text-brand-900">
                        {formatPKR(arrearsData.totalGross)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Tax Impact
                      </p>
                      <p className="mt-2 text-2xl font-bold text-brand-900">
                        {formatPKR(arrearsData.totalTax)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Breakdown Header */}
                <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-brand-900">
                      Monthly Variance Breakdown
                    </h4>
                    <p className="mt-0.5 text-sm text-brand-700">
                      Employee: {arrearsData.employee.empName} · {arrearsData.employee.empId}
                    </p>
                  </div>

                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px]">
                    <thead className="border-b border-gray-200 bg-white">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Month
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Original Gross
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Revised Gross
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Gross Diff
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Tax Adj
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Net Diff
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {arrearsData.monthBreakdown.map((month) => (
                        <tr key={month.month} className="hover:bg-brand-100/50">
                          <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                            {month.month}
                          </td>
                          <td className="px-5 py-4 text-right text-sm text-brand-700">
                            {month.oldValue.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-medium text-brand-900">
                            {month.newValue.toLocaleString()}
                          </td>
                          <td
                            className={`px-5 py-4 text-right text-sm font-semibold ${
                              month.diff >= 0 ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {month.diff >= 0 ? "+" : ""}
                            {month.diff.toLocaleString()}
                          </td>
                          <td
                            className={`px-5 py-4 text-right text-sm font-medium ${
                              month.taxImpact >= 0 ? "text-red-700" : "text-emerald-700"
                            }`}
                          >
                            {month.taxImpact >= 0 ? "-" : "+"}
                            {Math.abs(month.taxImpact).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-semibold text-brand-900">
                            {month.netDiff >= 0 ? "+" : ""}
                            {month.netDiff.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Lower Summary */}
                <div className="grid grid-cols-1 gap-4 border-t border-gray-200 px-6 py-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      Component Breakdown
                    </h5>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-brand-700">Basic Salary Arrears</span>
                        <span className="font-semibold text-brand-900">
                          {formatPKR(arrearsData.basicArrears)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-brand-700">
                          {changeType === "Allowance Correction"
                            ? "Allowance Adjustment"
                            : "HRA / Allowance Arrears"}
                        </span>
                        <span className="font-semibold text-brand-900">
                          {formatPKR(arrearsData.allowanceArrears)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-brand-700">PF Employee Adjustment</span>
                        <span className="font-semibold text-red-700">
                          -{formatPKR(Math.abs(arrearsData.pfAdjustment))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-brand-800" />
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Audit Status
                      </h5>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-brand-700">
                      Verified against {arrearsData.employee.grade} pay structure for{" "}
                      {arrearsData.employee.department}. Tax recalculated using an
                      estimated {Math.round(arrearsData.taxRate * 100)}% adjustment
                      rate for the affected months.
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                      <TrendingUp className="h-3.5 w-3.5 text-brand-800" />
                      Ready for payroll posting
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    onClick={handleDiscard}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Discard
                  </button>

                  <button
                    onClick={handleInject}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-900"
                  >
                    <Plus className="h-4 w-4" />
                    Add to Payroll Batch
                  </button>
                </div>
              </div>

              {/* Voucher / Success Card */}
              {isInjected && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
                        <CheckCircle2 className="h-5 w-5 text-brand-800" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-brand-900">
                          Ready for Injection
                        </h5>
                        <p className="mt-0.5 text-sm text-brand-700">
                          Voucher ID: {arrearsData.voucherId}
                        </p>
                      </div>
                    </div>

                    <button className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 transition hover:underline">
                      <FileText className="h-4 w-4" />
                      View Adjustment Voucher
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Warning Note */}
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                  <AlertCircle className="h-4 w-4 text-brand-800" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-brand-900">
                    Payroll Impact Note
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-brand-700">
                    This arrear entry will affect the selected payroll cycle and may
                    trigger revised tax, PF, and net salary computations for the
                    employee during final payroll processing.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


export default ArrearsProcessing;