"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  Download,
  Building2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  PieChart,
  ExternalLink,
} from "lucide-react";

interface PayrollWizardStep5Props {
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, label: "Select" },
  { id: 2, label: "Ingest" },
  { id: 3, label: "Validate" },
  { id: 4, label: "Review" },
  { id: 5, label: "Approve" },
  { id: 6, label: "Finalize" },
  { id: 7, label: "Disburse" },
];

type ReviewTab = "EMPLOYEE" | "DEPARTMENT" | "COMPONENT" | "VARIANCE";

const EMPLOYEES = [
  { id: "EMP-1001", name: "Arsalan Khan", desig: "Sr. Lead", dept: "Engineering", gross: 215000, net: 185000, delta: 35000, flags: ["INCREMENT", "VARIANCE"] },
  { id: "EMP-1105", name: "Zainab Bibi", desig: "Analyst", dept: "Operations", gross: 92000, net: 82000, delta: 0, flags: [] },
  { id: "EMP-1240", name: "Faisal Raza", desig: "Manager", dept: "Finance", gross: 145000, net: 125000, delta: 145000, flags: ["NEW"] },
  { id: "EMP-1088", name: "Mustafa Kamal", desig: "Director", dept: "Management", gross: 550000, net: 420000, delta: 50000, flags: ["BONUS"] },
  { id: "EMP-1199", name: "Umar Jafri", desig: "Specialist", dept: "Operations", gross: 110000, net: 95000, delta: -110000, flags: ["EXIT"] },
];

const DEPARTMENTS = [
  { name: "Engineering", count: 145, gross: 18500000, net: 15400000, cc: "TECH-ISB-01" },
  { name: "Operations", count: 112, gross: 12200000, net: 10100000, cc: "OPS-KHI-45" },
  { name: "Human Resources", count: 24, gross: 2800000, net: 2350000, cc: "ADMIN-CORP" },
  { name: "Finance & Legal", count: 18, gross: 3100000, net: 2600000, cc: "ADMIN-CORP" },
  { name: "Sales & Marketing", count: 26, gross: 4200000, net: 3500000, cc: "GROWTH-PK" },
];

const COMPONENTS = [
  { label: "Basic Salary", amount: 22500000, type: "Earning" },
  { label: "Allowances", amount: 12750000, type: "Earning" },
  { label: "Overtime", amount: 580000, type: "Earning" },
  { label: "Income Tax", amount: 3500000, type: "Deduction" },
  { label: "Provident Fund", amount: 2775000, type: "Deduction" },
];

const VARIANCE_ROWS = [
  { label: "New Joiners", count: 4, impact: 440000, tone: "positive" },
  { label: "Final Settlements", count: 1, impact: -110000, tone: "negative" },
  { label: "Performance Increments", count: 7, impact: 310000, tone: "positive" },
  { label: "Bonus Adjustments", count: 2, impact: 150000, tone: "positive" },
  { label: "Recovery Corrections", count: 3, impact: -85000, tone: "negative" },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {STEPS.map((step) => (
        <div key={step.id} className="flex flex-col items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
              step.id === current
                ? "border-brand-800 bg-brand-800 text-white"
                : step.id < current
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-200 bg-white text-gray-400"
            }`}
          >
            {step.id < current ? <Check className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              step.id === current ? "text-brand-800" : "text-gray-500"
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export const PayrollWizardStep5: React.FC<PayrollWizardStep5Props> = ({
  onNext,
  onBack,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewTab>("EMPLOYEE");
  const [search, setSearch] = useState("");
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return EMPLOYEES;
    return EMPLOYEES.filter((emp) =>
      `${emp.id} ${emp.name} ${emp.dept} ${emp.desig}`.toLowerCase().includes(q)
    );
  }, [search]);

  const formatPKR = (val: number) => `PKR ${val.toLocaleString()}`;

  const renderEmployeeView = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
          <input
            type="text"
            placeholder="Search name, ID or department..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-800 hover:bg-brand-100">
          <Filter className="h-4 w-4" />
          Filter: High Delta
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-white">
            <tr className="border-b border-gray-200">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Designation</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Gross Pay</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Net Payout</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Delta</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">Flags</th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {filteredEmployees.map((emp) => (
              <React.Fragment key={emp.id}>
                <tr
                  className={`cursor-pointer border-b border-gray-200 transition-colors hover:bg-brand-100 ${
                    expandedEmp === emp.id ? "bg-brand-100" : ""
                  }`}
                  onClick={() => setExpandedEmp(expandedEmp === emp.id ? null : emp.id)}
                >
                  <td className="px-4 py-3.5 text-center">
                    {expandedEmp === emp.id ? (
                      <ChevronDown className="h-4 w-4 text-brand-800" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-brand-700" />
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-900">{emp.name}</p>
                        <p className="text-[11px] text-brand-700">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-brand-700">{emp.desig}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-brand-700">{formatPKR(emp.gross)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-brand-900">{formatPKR(emp.net)}</td>
                  <td className={`px-4 py-3.5 text-right text-sm font-semibold ${
                    emp.delta > 0 ? "text-red-600" : emp.delta < 0 ? "text-green-700" : "text-gray-400"
                  }`}>
                    {emp.delta > 0
                      ? `+${formatPKR(emp.delta)}`
                      : emp.delta < 0
                      ? `-${formatPKR(Math.abs(emp.delta))}`
                      : "--"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap justify-center gap-1">
                      {emp.flags.map((f) => (
                        <span
                          key={f}
                          className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                            f === "NEW"
                              ? "bg-green-100 text-green-700"
                              : f === "INCREMENT"
                              ? "bg-blue-100 text-blue-700"
                              : f === "VARIANCE"
                              ? "bg-orange-100 text-orange-700"
                              : f === "BONUS"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>

                {expandedEmp === emp.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="px-6 py-5">
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">Earnings</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-brand-700">Basic Salary</span><span className="font-mono font-semibold text-brand-900">107,500</span></div>
                            <div className="flex justify-between"><span className="text-brand-700">Allowances</span><span className="font-mono font-semibold text-brand-900">92,500</span></div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-brand-900"><span>Gross Total</span><span className="font-mono">{formatPKR(emp.gross)}</span></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">Deductions</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-brand-700">Income Tax</span><span className="font-mono font-semibold text-red-600">-22,500</span></div>
                            <div className="flex justify-between"><span className="text-brand-700">PF Share</span><span className="font-mono font-semibold text-red-600">-7,500</span></div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-red-600"><span>Total Deductions</span><span className="font-mono">-30,000</span></div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">Auditor Note</p>
                          <p className="text-sm leading-6 text-brand-700">
                            Variance triggered by performance increment and HRA
                            adjustment for the new cycle.
                          </p>
                          <button className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-800 hover:underline">
                            <ExternalLink className="h-4 w-4" />
                            View Full Pay Profile
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDepartmentView = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-8">
        <table className="w-full">
          <thead className="bg-white">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Department</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Headcount</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Gross Total</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Net Takehome</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Cost Center</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {DEPARTMENTS.map((dept) => (
              <tr key={dept.name} className="border-b border-gray-200 last:border-b-0">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                    <Building2 className="h-4 w-4 text-brand-700" />
                    {dept.name}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-semibold text-brand-900">{dept.count}</td>
                <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-brand-700">{formatPKR(dept.gross)}</td>
                <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-brand-900">{formatPKR(dept.net)}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-brand-700">{dept.cc}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 xl:col-span-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-brand-800" />
            <h4 className="text-sm font-semibold text-brand-900">Cost Distribution</h4>
          </div>

          <div className="mt-5 space-y-3">
            {[
              { label: "Engineering", perc: "45%" },
              { label: "Operations", perc: "30%" },
              { label: "Others", perc: "25%" },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-brand-700">{item.label}</span>
                  <span className="font-semibold text-brand-900">{item.perc}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-brand-800" style={{ width: item.perc }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderComponentView = () => (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-white">
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Component</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">Type</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">Amount</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {COMPONENTS.map((item) => (
            <tr key={item.label} className="border-b border-gray-200 last:border-b-0">
              <td className="px-4 py-3.5 text-sm font-semibold text-brand-900">{item.label}</td>
              <td className="px-4 py-3.5">
                <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                  item.type === "Earning" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {item.type}
                </span>
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-brand-900">{formatPKR(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderVarianceView = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {VARIANCE_ROWS.map((row) => (
        <div
          key={row.label}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-brand-900">{row.label}</div>
              <div className="mt-0.5 text-xs text-brand-700">{row.count} impacted records</div>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                row.tone === "positive" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {row.tone === "positive" ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {formatPKR(Math.abs(row.impact))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Stepper current={5} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-brand-900">Approval Review Workspace</h3>
            <p className="mt-1 text-sm text-brand-700">
              Review employee, department, component, and variance level detail.
            </p>
          </div>

          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-800 hover:bg-brand-100">
            <Download className="h-4 w-4" />
            Export Review Pack
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { id: "EMPLOYEE", label: "Employee" },
            { id: "DEPARTMENT", label: "Department" },
            { id: "COMPONENT", label: "Component" },
            { id: "VARIANCE", label: "Variance" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ReviewTab)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "bg-brand-800 text-white"
                  : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[460px]">
          {activeTab === "EMPLOYEE" && renderEmployeeView()}
          {activeTab === "DEPARTMENT" && renderDepartmentView()}
          {activeTab === "COMPONENT" && renderComponentView()}
          {activeTab === "VARIANCE" && renderVarianceView()}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-100 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brand-800" />
          <p className="text-xs leading-6 text-brand-800">
            This phase is for review only. Structural changes should be made in
            the relevant source modules, followed by recalculation before final
            approval.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Review
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-100"
          >
            Discard Run
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-900"
          >
            Final Submission
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
