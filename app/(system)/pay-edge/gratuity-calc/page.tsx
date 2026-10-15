"use client";
import { useMemo, useState } from "react";
import {
  Calculator,
  Search,
  User,
  Calendar,
  ShieldCheck,
  Info,
  Download,
  Settings2,
  Scale,
  Wallet,
  Landmark,
  FileCheck,
  CheckCircle2,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

interface GratuityPolicy {
  id: string;
  name: string;
  minYears: number;
  rates: {
    tier1: number; // first 1-5 years
    tier2: number; // after 5 years
  };
  taxExempt: number;
  taxRate: number;
}

interface EmployeeRecord {
  empId: string;
  name: string;
  department: string;
  grade: string;
  doj: string;
  basicSalary: number;
}

const EMPLOYEES: EmployeeRecord[] = [
  {
    empId: "EMP-1001",
    name: "Arsalan Khan",
    department: "Engineering",
    grade: "G18",
    doj: "2018-06-15",
    basicSalary: 125000,
  },
  {
    empId: "EMP-1002",
    name: "Saira Ahmed",
    department: "HR",
    grade: "G17",
    doj: "2020-03-01",
    basicSalary: 95000,
  },
  {
    empId: "EMP-1003",
    name: "Umar Farooq",
    department: "Sales",
    grade: "G19",
    doj: "2016-09-12",
    basicSalary: 185000,
  },
  {
    empId: "EMP-1004",
    name: "Zainab Bibi",
    department: "Operations",
    grade: "G16",
    doj: "2021-11-20",
    basicSalary: 78000,
  },
  {
    empId: "EMP-1005",
    name: "Mustafa Kamal",
    department: "Finance",
    grade: "G20",
    doj: "2014-02-01",
    basicSalary: 235000,
  },
];

const DEFAULT_POLICY: GratuityPolicy = {
  id: "PK-STD-2024",
  name: "Pakistan Standard Labour Law",
  minYears: 1,
  rates: { tier1: 21, tier2: 30 },
  taxExempt: 300000,
  taxRate: 0.1,
};

function formatPKR(val: number): string {
  return `PKR ${Math.round(val).toLocaleString()}`;
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

function formatYears(value: number): string {
  return value.toFixed(2);
}

function dayDiff(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

 function GratuityCalculator() {
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(
    EMPLOYEES[0]
  );
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [doj, setDoj] = useState("2018-06-15");
  const [lwd, setLwd] = useState("2025-01-31");
  const [basicSalary, setBasicSalary] = useState(125000);

  const [policy, setPolicy] = useState<GratuityPolicy>(DEFAULT_POLICY);
  const [policyDraft, setPolicyDraft] = useState<GratuityPolicy>(DEFAULT_POLICY);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const [isCalculated, setIsCalculated] = useState(false);
  const [usedInSettlement, setUsedInSettlement] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const employeeMatches = useMemo(() => {
    const needle = empSearch.trim().toLowerCase();
    if (!needle) return EMPLOYEES.slice(0, 5);

    return EMPLOYEES.filter((employee) =>
      [employee.empId, employee.name, employee.department, employee.grade]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    ).slice(0, 6);
  }, [empSearch]);

  const calculation = useMemo(() => {
    const totalDays = dayDiff(doj, lwd);
    const totalYears = totalDays / 365.25;
    const completedYears = Math.floor(totalYears);
    const dailyRate = basicSalary / 30;

    const eligibleYears = totalYears >= policy.minYears ? totalYears : 0;
    const tier1Years = Math.min(eligibleYears, 5);
    const tier2Years = Math.max(eligibleYears - 5, 0);

    const tier1Days = tier1Years * policy.rates.tier1;
    const tier2Days = tier2Years * policy.rates.tier2;
    const totalBenefitDays = tier1Days + tier2Days;

    const grossGratuity = dailyRate * totalBenefitDays;
    const taxableAmount = Math.max(0, grossGratuity - policy.taxExempt);
    const taxValue = taxableAmount * policy.taxRate;
    const netGratuity = grossGratuity - taxValue;

    return {
      totalDays,
      totalYears,
      completedYears,
      dailyRate,
      eligibleYears,
      tier1Years,
      tier2Years,
      tier1Days,
      tier2Days,
      totalBenefitDays,
      grossGratuity,
      taxableAmount,
      taxValue,
      netGratuity,
      isEligible: totalYears >= policy.minYears,
    };
  }, [doj, lwd, basicSalary, policy]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!doj) nextErrors.doj = "Date of joining is required.";
    if (!lwd) nextErrors.lwd = "Last working day is required.";
    if (doj && lwd && new Date(lwd) <= new Date(doj)) {
      nextErrors.lwd = "Last working day must be after date of joining.";
    }

    if (basicSalary <= 0) {
      nextErrors.basicSalary = "Basic salary must be greater than zero.";
    }

    if (policy.minYears < 0) {
      nextErrors.minYears = "Minimum years cannot be negative.";
    }

    if (policy.rates.tier1 < 0 || policy.rates.tier2 < 0) {
      nextErrors.policyRates = "Policy rates cannot be negative.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCalculate = (): void => {
    if (!validate()) {
      setIsCalculated(false);
      setUsedInSettlement(false);
      return;
    }

    setIsCalculated(true);
    setUsedInSettlement(false);
  };

  const handleExport = (): void => {
    if (!isCalculated) return;

    const headers = ["Metric", "Value"];
    const rows: Array<[string, string | number]> = [
      ["Employee", selectedEmployee ? `${selectedEmployee.empId} - ${selectedEmployee.name}` : "Manual Entry"],
      ["Date of Joining", doj],
      ["Last Working Day", lwd],
      ["Basic Salary", basicSalary],
      ["Completed Years", calculation.completedYears],
      ["Actual Service Years", formatYears(calculation.totalYears)],
      ["Daily Rate", Math.round(calculation.dailyRate)],
      ["Tier 1 Years", formatYears(calculation.tier1Years)],
      ["Tier 2 Years", formatYears(calculation.tier2Years)],
      ["Total Benefit Days", formatYears(calculation.totalBenefitDays)],
      ["Gross Gratuity", Math.round(calculation.grossGratuity)],
      ["Tax Exempt", Math.round(policy.taxExempt)],
      ["Taxable Amount", Math.round(calculation.taxableAmount)],
      ["Tax Value", Math.round(calculation.taxValue)],
      ["Net Gratuity", Math.round(calculation.netGratuity)],
      ["Policy Name", policy.name],
      ["Policy ID", policy.id],
    ];

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gratuity-model.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleUseInSettlement = (): void => {
    if (!isCalculated || !validate()) return;
    setUsedInSettlement(true);
  };

  const openPolicyModal = (): void => {
    setPolicyDraft(policy);
    setShowPolicyModal(true);
  };

  const savePolicy = (): void => {
    setPolicy(policyDraft);
    setShowPolicyModal(false);
    if (isCalculated) {
      setUsedInSettlement(false);
    }
  };

  const selectEmployee = (employee: EmployeeRecord): void => {
    setSelectedEmployee(employee);
    setEmpSearch(`${employee.empId} · ${employee.name}`);
    setDoj(employee.doj);
    setBasicSalary(employee.basicSalary);
    setShowSuggestions(false);
    setUsedInSettlement(false);
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-brand-900">
                Gratuity Modeling Engine
              </h2>
              <p className="mt-0.5 text-sm text-brand-700">
                Calculate end-of-service benefits based on tenure and statutory rules
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExport}
                disabled={!isCalculated}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export Model
              </button>

              <button
                onClick={handleUseInSettlement}
                disabled={!isCalculated}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileCheck className="h-4 w-4" />
                Use in Settlement
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Left */}
          <div className="space-y-4 xl:col-span-5">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-sm font-semibold text-brand-900">
                  Gratuity Configuration
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Select employee details and statutory inputs
                </p>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-brand-900">
                      Employee Search
                    </label>
                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                      Manual / Search Mode
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <input
                      type="text"
                      placeholder="Search employee by ID or name..."
                      value={empSearch}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 150);
                      }}
                      onChange={(e) => {
                        setEmpSearch(e.target.value);
                        setShowSuggestions(true);
                        setUsedInSettlement(false);
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    />

                    {showSuggestions && (
                      <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        {employeeMatches.length > 0 ? (
                          employeeMatches.map((employee) => (
                            <button
                              key={employee.empId}
                              type="button"
                              onClick={() => selectEmployee(employee)}
                              className="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-brand-100/40"
                            >
                              <div>
                                <p className="text-sm font-semibold text-brand-900">
                                  {employee.name}
                                </p>
                                <p className="mt-0.5 text-xs text-brand-700">
                                  {employee.empId} • {employee.department} • {employee.grade}
                                </p>
                              </div>
                              <span className="text-xs text-brand-700">
                                {formatPKR(employee.basicSalary)}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-brand-700">
                            No employee match found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Date of Joining
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                      <input
                        type="date"
                        value={doj}
                        onChange={(e) => {
                          setDoj(e.target.value);
                          setUsedInSettlement(false);
                        }}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      />
                    </div>
                    {errors.doj && (
                      <p className="mt-1 text-xs text-red-600">{errors.doj}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-900">
                      Last Working Day
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                      <input
                        type="date"
                        value={lwd}
                        onChange={(e) => {
                          setLwd(e.target.value);
                          setUsedInSettlement(false);
                        }}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      />
                    </div>
                    {errors.lwd && (
                      <p className="mt-1 text-xs text-red-600">{errors.lwd}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Last Drawn Basic Salary
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-700">
                      PKR
                    </span>
                    <input
                      type="number"
                      value={basicSalary}
                      onChange={(e) => {
                        setBasicSalary(Number(e.target.value || 0));
                        setUsedInSettlement(false);
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-12 pr-4 text-sm font-semibold text-brand-900 outline-none transition focus:border-brand-800"
                    />
                  </div>
                  {errors.basicSalary && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.basicSalary}
                    </p>
                  )}
                </div>

                {selectedEmployee && (
                  <div className="rounded-lg border border-gray-200 bg-brand-100/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Employee Snapshot
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-brand-700">Name</span>
                        <p className="font-semibold text-brand-900">
                          {selectedEmployee.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-brand-700">Employee ID</span>
                        <p className="font-semibold text-brand-900">
                          {selectedEmployee.empId}
                        </p>
                      </div>
                      <div>
                        <span className="text-brand-700">Department</span>
                        <p className="font-semibold text-brand-900">
                          {selectedEmployee.department}
                        </p>
                      </div>
                      <div>
                        <span className="text-brand-700">Grade</span>
                        <p className="font-semibold text-brand-900">
                          {selectedEmployee.grade}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCalculate}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-900"
                >
                  <Calculator className="h-4 w-4" />
                  Calculate Gratuity
                </button>
              </div>
            </div>

            {/* Active Policy */}
            <div className="rounded-xl border border-gray-200 bg-brand-900 text-white shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-white" />
                  <h3 className="text-sm font-semibold">Active Policy</h3>
                </div>

                <button
                  onClick={openPolicyModal}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white transition hover:bg-white/10"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <p className="text-sm font-semibold">{policy.name}</p>
                  <p className="mt-0.5 text-sm text-white/70">{policy.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-white/60">
                      1–5 Years
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {policy.rates.tier1} days / yr
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-white/60">
                      5+ Years
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {policy.rates.tier2} days / yr
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-white/60">
                      Min Service
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {policy.minYears} year
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-white/60">
                      Tax Exempt
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatPKR(policy.taxExempt)}
                    </p>
                  </div>
                </div>
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
                  This model uses daily basic salary and applies benefit days by
                  service tiers. Tax is estimated only on the amount above the
                  configured exemption threshold.
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4 xl:col-span-7">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-brand-900">
                    Calculation Results
                  </h3>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Statutory gratuity calculation summary
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brand-700">
                  <Scale className="h-3.5 w-3.5 text-brand-800" />
                  Statutory Method
                </div>
              </div>

              {!isCalculated ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center px-10 py-12 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100/50">
                    <Calculator className="h-10 w-10 text-brand-700" />
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-brand-900">
                    Waiting for Calculation
                  </h4>
                  <p className="mt-2 max-w-md text-sm leading-6 text-brand-700">
                    Select an employee or enter manual inputs, then calculate the
                    gratuity to see the statutory payout breakdown.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 px-6 py-5">
                  {/* Top cards */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Completed Service
                      </p>
                      <div className="mt-2 flex items-end gap-2">
                        <p className="text-3xl font-bold text-brand-900">
                          {calculation.completedYears}
                        </p>
                        <span className="pb-1 text-sm text-brand-700">years</span>
                      </div>
                      <p className="mt-1 text-sm text-brand-700">
                        Actual service: {formatYears(calculation.totalYears)} years
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Daily Salary Rate
                      </p>
                      <p className="mt-2 text-3xl font-bold text-brand-900">
                        {formatPKR(calculation.dailyRate)}
                      </p>
                      <p className="mt-1 text-sm text-brand-700">
                        Based on Basic Salary ÷ 30
                      </p>
                    </div>
                  </div>

                  {/* Service split */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Tier 1 Service
                      </p>
                      <p className="mt-2 text-2xl font-bold text-brand-900">
                        {formatYears(calculation.tier1Years)} yrs
                      </p>
                      <p className="mt-1 text-sm text-brand-700">
                        {formatYears(calculation.tier1Days)} benefit days
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Tier 2 Service
                      </p>
                      <p className="mt-2 text-2xl font-bold text-brand-900">
                        {formatYears(calculation.tier2Years)} yrs
                      </p>
                      <p className="mt-1 text-sm text-brand-700">
                        {formatYears(calculation.tier2Days)} benefit days
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        Total Benefit Days
                      </p>
                      <p className="mt-2 text-2xl font-bold text-brand-900">
                        {formatYears(calculation.totalBenefitDays)}
                      </p>
                      <p className="mt-1 text-sm text-brand-700">
                        Applied under {policy.id}
                      </p>
                    </div>
                  </div>

                  {/* Taxation */}
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h4 className="text-sm font-semibold text-brand-900">
                      Taxation Breakdown
                    </h4>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Gross Gratuity
                        </p>
                        <p className="mt-2 text-lg font-semibold text-brand-900">
                          {formatPKR(calculation.grossGratuity)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Tax Exempt
                        </p>
                        <p className="mt-2 text-lg font-semibold text-brand-900">
                          {formatPKR(policy.taxExempt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Taxable Portion
                        </p>
                        <p className="mt-2 text-lg font-semibold text-brand-900">
                          {formatPKR(calculation.taxableAmount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Estimated Tax
                        </p>
                        <p className="mt-2 text-lg font-semibold text-red-700">
                          -{formatPKR(Math.abs(calculation.taxValue))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Final payout */}
                  <div className="rounded-xl bg-brand-800 p-6 text-white shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Final Net Gratuity Payout
                    </p>
                    <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-4xl font-bold text-white">
                          {formatPKR(calculation.netGratuity)}
                        </h2>
                        <p className="mt-1 text-sm text-white/70">
                          Estimated payout after tax adjustment
                        </p>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
                        <Wallet className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </div>

                  {!calculation.isEligible && (
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                        <AlertCircle className="h-4 w-4 text-brand-800" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-brand-900">
                          Minimum Service Not Met
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-brand-700">
                          This employee has not met the minimum {policy.minYears}
                          -year service threshold under the active policy, so the
                          gratuity amount is not payable.
                        </p>
                      </div>
                    </div>
                  )}

                  {usedInSettlement && (
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                        <CheckCircle2 className="h-4 w-4 text-brand-800" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-brand-900">
                          Ready for Settlement
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-brand-700">
                          This gratuity model is now marked ready to be used in the
                          employee’s final settlement workflow.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                <Info className="h-4 w-4 text-brand-800" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-900">
                  Pakistan Labour Note
                </h4>
                <p className="mt-1 text-sm leading-6 text-brand-700">
                  This model supports statutory gratuity-style calculations using
                  service tiers and a configurable exemption threshold. Final legal
                  treatment should still follow the applicable contract, law, and
                  tax guidance for the employee category.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policy modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/30 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-brand-900">
                  Edit Gratuity Policy
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Update statutory rates and exemption values
                </p>
              </div>

              <button
                onClick={() => setShowPolicyModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-800 transition hover:bg-brand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-900">
                  Policy Name
                </label>
                <input
                  type="text"
                  value={policyDraft.name}
                  onChange={(e) =>
                    setPolicyDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Minimum Eligible Years
                  </label>
                  <input
                    type="number"
                    value={policyDraft.minYears}
                    onChange={(e) =>
                      setPolicyDraft((prev) => ({
                        ...prev,
                        minYears: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Tax Exempt Amount
                  </label>
                  <input
                    type="number"
                    value={policyDraft.taxExempt}
                    onChange={(e) =>
                      setPolicyDraft((prev) => ({
                        ...prev,
                        taxExempt: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Tier 1 Days / Year
                  </label>
                  <input
                    type="number"
                    value={policyDraft.rates.tier1}
                    onChange={(e) =>
                      setPolicyDraft((prev) => ({
                        ...prev,
                        rates: {
                          ...prev.rates,
                          tier1: Number(e.target.value || 0),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Tier 2 Days / Year
                  </label>
                  <input
                    type="number"
                    value={policyDraft.rates.tier2}
                    onChange={(e) =>
                      setPolicyDraft((prev) => ({
                        ...prev,
                        rates: {
                          ...prev.rates,
                          tier2: Number(e.target.value || 0),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-900">
                    Tax Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={policyDraft.taxRate}
                    onChange={(e) =>
                      setPolicyDraft((prev) => ({
                        ...prev,
                        taxRate: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  />
                </div>
              </div>

              {(errors.minYears || errors.policyRates) && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors.minYears || errors.policyRates}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
              >
                Cancel
              </button>

              <button
                onClick={savePolicy}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                <Save className="h-4 w-4" />
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default GratuityCalculator;