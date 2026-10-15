"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Mail,
  Landmark,
  Calculator,
  ShieldAlert,
  Clock,
  ChevronRight,
} from "lucide-react";

interface PayrollWizardStep3Props {
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

interface ExceptionGroup {
  id: string;
  title: string;
  severity: "CRITICAL" | "WARNING";
  count: number;
  icon: any;
  description: string;
  employees: { id: string; name: string; detail: string; resolved?: boolean }[];
  actionLabel: string;
}

const INITIAL_GROUPS: ExceptionGroup[] = [
  {
    id: "bank",
    title: "Missing Bank Details",
    severity: "CRITICAL",
    count: 3,
    icon: Landmark,
    description: "Employees without primary bank accounts for disbursement.",
    employees: [
      { id: "EMP-1003", name: "Umar Farooq", detail: "No HBL/SCB mapping" },
      { id: "EMP-1102", name: "Sara Khan", detail: "Incomplete IBAN" },
      { id: "EMP-1145", name: "Bilal Ahmed", detail: "Account inactive" },
    ],
    actionLabel: "Fix Account",
  },
  {
    id: "negative",
    title: "Negative Net Risk",
    severity: "CRITICAL",
    count: 2,
    icon: ShieldAlert,
    description: "Deductions exceeding gross pay components.",
    employees: [
      { id: "EMP-1089", name: "Hassan Raza", detail: "Loan EMI exceeds net by 5k" },
      { id: "EMP-1201", name: "Ayesha Malik", detail: "Multiple recoveries active" },
    ],
    actionLabel: "Adjust Deducts",
  },
  {
    id: "statutory",
    title: "Missing Statutory ID",
    severity: "CRITICAL",
    count: 2,
    icon: XCircle,
    description: "Mandatory NTN or EOBI numbers missing for tax filing.",
    employees: [
      { id: "EMP-1003", name: "Umar Farooq", detail: "Missing NTN" },
      { id: "EMP-1256", name: "Zohaib Ali", detail: "EOBI Unverified" },
    ],
    actionLabel: "Complete Profile",
  },
  {
    id: "attendance",
    title: "Attendance Mismatch",
    severity: "WARNING",
    count: 3,
    icon: Clock,
    description: "Work days vs leave balance discrepancies detected.",
    employees: [
      { id: "EMP-1011", name: "Fatima Noor", detail: "LWP days unaligned" },
      { id: "EMP-1022", name: "Kamran Shah", detail: "Excess OT flagged" },
      { id: "EMP-1033", name: "Nadia Gul", detail: "Manual override used" },
    ],
    actionLabel: "Verify Days",
  },
  {
    id: "unusual",
    title: "Unusual Amounts",
    severity: "WARNING",
    count: 5,
    icon: AlertTriangle,
    description: "Payout variance > 25% compared to Dec 2024.",
    employees: [
      { id: "EMP-1005", name: "Mustafa Kamal", detail: "Bonus + Incentive impact" },
      { id: "EMP-1044", name: "Raza Jafri", detail: "Shift allowance delta" },
      { id: "EMP-1055", name: "Sana Zehra", detail: "Grade change effect" },
      { id: "EMP-1066", name: "Ali Hamza", detail: "Arrears added" },
      { id: "EMP-1077", name: "Maria B.", detail: "Reimbursement peak" },
    ],
    actionLabel: "Preview Payslip",
  },
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

export const PayrollWizardStep3: React.FC<PayrollWizardStep3Props> = ({
  onNext,
  onBack,
  onCancel,
}) => {
  const [progress, setProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string>("bank");
  const [groups, setGroups] = useState<ExceptionGroup[]>(INITIAL_GROUPS);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsValidating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  const selectedGroup = groups.find((group) => group.id === expandedGroup);

  const criticalCount = useMemo(
    () =>
      groups
        .filter((g) => g.severity === "CRITICAL")
        .reduce(
          (acc, curr) =>
            acc +
            curr.employees.filter((employee) => !employee.resolved).length,
          0
        ),
    [groups]
  );

  const warningCount = useMemo(
    () =>
      groups
        .filter((g) => g.severity === "WARNING")
        .reduce(
          (acc, curr) =>
            acc +
            curr.employees.filter((employee) => !employee.resolved).length,
          0
        ),
    [groups]
  );

  const toggleResolve = (groupId: string, employeeId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              employees: group.employees.map((employee) =>
                employee.id === employeeId
                  ? { ...employee, resolved: !employee.resolved }
                  : employee
              ),
            }
          : group
      )
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Stepper current={3} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {isValidating ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-100"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 * (1 - progress / 100)}
                  className="text-brand-800 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Calculator className="h-8 w-8 text-brand-800" />
              </div>
            </div>

            <h4 className="mt-6 text-xl font-bold text-brand-900">
              Validating Payroll Rules
            </h4>
            <p className="mt-1 text-sm text-brand-700">
              Checking profiles against statutory, attendance, and payout rules.
            </p>

            <div className="mt-6 h-2 w-72 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-brand-800 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-green-700">
                      Passed Validation
                    </p>
                    <p className="text-2xl font-bold text-green-800">310 / 325</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">
                      System Warnings
                    </p>
                    <p className="text-2xl font-bold text-orange-800">{warningCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700">
                      Critical Blocks
                    </p>
                    <p className="text-2xl font-bold text-red-800">{criticalCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-brand-800" />
                <h3 className="text-sm font-semibold text-brand-900">
                  Run Exceptions
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-800 transition-all hover:bg-brand-100"
                >
                  Ignore Warnings
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-800 transition-all hover:bg-brand-100"
                >
                  <Download className="h-4 w-4" />
                  Export All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="space-y-3 xl:col-span-4">
                {groups.map((group) => {
                  const Icon = group.icon;
                  const unresolved = group.employees.filter((e) => !e.resolved).length;
                  const active = expandedGroup === group.id;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setExpandedGroup(group.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-brand-800 bg-brand-800 text-white"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            active
                              ? "bg-white/10 text-white"
                              : group.severity === "CRITICAL"
                              ? "bg-red-50 text-red-600"
                              : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <div className="text-sm font-semibold">{group.title}</div>
                          <div
                            className={`mt-0.5 text-[10px] uppercase tracking-wider ${
                              active ? "text-white/70" : "text-brand-700"
                            }`}
                          >
                            {unresolved} employees affected
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`h-4 w-4 ${active ? "text-white" : "text-brand-500"}`} />
                    </button>
                  );
                })}
              </div>

              <div className="min-h-[420px] rounded-xl border border-gray-200 bg-gray-50 p-5 xl:col-span-8">
                {selectedGroup ? (
                  <div className="flex h-full flex-col space-y-5">
                    <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-brand-900">
                            {selectedGroup.title}
                          </h4>
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                              selectedGroup.severity === "CRITICAL"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-orange-200 bg-orange-50 text-orange-700"
                            }`}
                          >
                            {selectedGroup.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-brand-700">
                          {selectedGroup.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-800 transition-all hover:bg-white"
                      >
                        <Mail className="h-4 w-4" />
                        Notify Managers
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <table className="w-full">
                        <thead className="bg-white">
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Employee
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Issue Detail
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="bg-white">
                          {selectedGroup.employees.map((employee) => (
                            <tr
                              key={employee.id}
                              className="border-b border-gray-200 last:border-b-0"
                            >
                              <td className="px-4 py-3.5">
                                <div className="text-sm font-semibold text-brand-900">
                                  {employee.name}
                                </div>
                                <div className="text-[11px] text-brand-700">
                                  {employee.id}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-brand-700">
                                {employee.detail}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                                    employee.resolved
                                      ? "border-green-200 bg-green-50 text-green-700"
                                      : "border-red-200 bg-red-50 text-red-700"
                                  }`}
                                >
                                  {employee.resolved ? "Resolved" : "Pending"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleResolve(selectedGroup.id, employee.id)
                                  }
                                  className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider ${
                                    employee.resolved
                                      ? "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                                      : "bg-brand-800 text-white hover:bg-brand-900"
                                  }`}
                                >
                                  {employee.resolved
                                    ? "Undo"
                                    : selectedGroup.actionLabel}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-100"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={criticalCount > 0}
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm & Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
