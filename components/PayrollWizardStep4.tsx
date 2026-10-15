"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  RefreshCw,
  BarChart3,
  Wallet,
  MinusCircle,
  Building2,
  LayoutList,
  PieChart,
} from "lucide-react";

interface PayrollWizardStep4Props {
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

const EARNINGS = [
  { label: "Basic Salary", val: 22500000 },
  { label: "Standard Allowances", val: 12750000 },
  { label: "Overtime Payouts", val: 580000 },
  { label: "Bonuses & Incentives", val: 150000 },
  { label: "Expense Reimbursements", val: 85000 },
];

const DEDUCTIONS = [
  { label: "Provident Fund (EE)", val: 2775000 },
  { label: "Income Tax (FBR)", val: 3500000 },
  { label: "EOBI Contribution", val: 100750 },
  { label: "Loan EMIs", val: 580000 },
  { label: "Other Recoveries", val: 244250 },
];

const VARIANCES = [
  { label: "Gross Earnings", current: 37.0, previous: 35.85 },
  { label: "Tax Volume", current: 3.50, previous: 3.25 },
  { label: "Reimbursements", current: 0.09, previous: 0.05 },
  { label: "Loan Recoveries", current: 0.58, previous: 0.74 },
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

export const PayrollWizardStep4: React.FC<PayrollWizardStep4Props> = ({
  onNext,
  onBack,
  onCancel,
}) => {
  const [isRecalculating, setIsRecalculating] = useState(false);

  const grossTotal = useMemo(
    () => EARNINGS.reduce((sum, item) => sum + item.val, 0),
    []
  );
  const deductionTotal = useMemo(
    () => DEDUCTIONS.reduce((sum, item) => sum + item.val, 0),
    []
  );
  const netTotal = grossTotal - deductionTotal;

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => setIsRecalculating(false), 1400);
  };

  const formatPKR = (val: number) => `PKR ${(val / 1000000).toFixed(2)}M`;
  const formatFullPKR = (val: number) => `PKR ${val.toLocaleString()}`;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Stepper current={4} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-900">
              Calculation Summary
            </h2>
            <p className="mt-1 text-sm text-brand-700">
              Version 1.2 • Generated Jan 15, 2025 • 11:30 AM
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-800 hover:bg-brand-100"
            >
              <Download className="h-4 w-4" />
              Audit Report
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-800 hover:bg-brand-100"
            >
              <LayoutList className="h-4 w-4" />
              Employee-wise
            </button>
            <button
              type="button"
              onClick={handleRecalculate}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-brand-900"
            >
              <RefreshCw className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`} />
              {isRecalculating ? "Recalculating" : "Recalculate"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-4 bg-brand-800 p-6 text-white md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Total Net Disbursement
              </p>
              <h3 className="mt-1 text-4xl font-bold leading-none text-white">
                {formatPKR(netTotal)}
              </h3>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Total CTC Impact
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {formatPKR(42150000)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 bg-white p-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700">
                  <Wallet className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-brand-900">
                  Gross Earnings
                </h4>
                <span className="ml-auto text-sm font-semibold text-green-700">
                  {formatPKR(grossTotal)}
                </span>
              </div>

              <div className="space-y-3">
                {EARNINGS.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-brand-700">{item.label}</span>
                    <span className="font-mono font-semibold text-brand-900">
                      {formatFullPKR(item.val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700">
                  <MinusCircle className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-brand-900">
                  Total Deductions
                </h4>
                <span className="ml-auto text-sm font-semibold text-red-700">
                  {formatPKR(deductionTotal)}
                </span>
              </div>

              <div className="space-y-3">
                {DEDUCTIONS.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-brand-700">{item.label}</span>
                    <span className="font-mono font-semibold text-brand-900">
                      ({formatFullPKR(item.val)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                Employer Provisions
              </span>
              <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-brand-700">
                PF ER: 2.7M
              </span>
              <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-brand-700">
                EOBI ER: 300K
              </span>
              <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-brand-700">
                Gratuity: 2.1M
              </span>
            </div>

            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wider text-brand-800 hover:underline"
            >
              Full CTC View
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-semibold text-brand-900">
                Variance Analysis (vs Dec 2024)
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Component
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Current
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Previous
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {VARIANCES.map((row) => {
                  const delta = row.current - row.previous;
                  const positive = delta >= 0;

                  return (
                    <tr key={row.label} className="border-b border-gray-200 last:border-b-0">
                      <td className="px-4 py-3.5 text-sm font-semibold text-brand-900">
                        {row.label}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-brand-900">
                        {formatPKR(row.current * 1000000)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-brand-700">
                        {formatPKR(row.previous * 1000000)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                            positive
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {positive ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                          {formatPKR(Math.abs(delta) * 1000000)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-800" />
              <h4 className="text-sm font-semibold text-brand-900">Department Spread</h4>
            </div>
            <p className="mt-3 text-sm text-brand-700">
              Engineering and Operations account for the largest share of payout
              this cycle.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-brand-800" />
              <h4 className="text-sm font-semibold text-brand-900">Component Weight</h4>
            </div>
            <p className="mt-3 text-sm text-brand-700">
              Basic salary and statutory tax continue to dominate the overall mix.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-brand-800" />
              <h4 className="text-sm font-semibold text-brand-900">Audit Visibility</h4>
            </div>
            <p className="mt-3 text-sm text-brand-700">
              All breakdowns are ready for employee-wise review in the next step.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Validate
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
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-900"
          >
            Continue to Approve
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
