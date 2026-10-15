"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Clock,
  CalendarX,
  HandCoins,
  Receipt,
  FileEdit,
  AlertTriangle,
  Database,
  BarChart3,
  Info,
} from "lucide-react";

interface PayrollWizardStep2Props {
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

interface DataSource {
  id: string;
  name: string;
  icon: any;
  status: "Synced" | "Ready" | "Pending" | "Error";
  metrics: string[];
  actionLabel: string;
  impact: number;
  records: number;
}

const INITIAL_SOURCES: DataSource[] = [
  {
    id: "time",
    name: "TimeSync (Attendance)",
    icon: Clock,
    status: "Synced",
    metrics: ["Employees: 325", "OT: 450 hrs"],
    actionLabel: "Re-sync",
    records: 325,
    impact: 125000,
  },
  {
    id: "leave",
    name: "LeaveEase (Leave)",
    icon: CalendarX,
    status: "Synced",
    metrics: ["Unpaid: 15 days", "Encashments: 2"],
    actionLabel: "Re-sync",
    records: 17,
    impact: -45000,
  },
  {
    id: "manual",
    name: "Manual Inputs",
    icon: FileEdit,
    status: "Pending",
    metrics: ["Bonuses: 5", "Adjustments: 8"],
    actionLabel: "Review",
    records: 13,
    impact: 850000,
  },
  {
    id: "loans",
    name: "Loan Management",
    icon: HandCoins,
    status: "Ready",
    metrics: ["45 loans active", "EMIs: 580K"],
    actionLabel: "View",
    records: 45,
    impact: -580000,
  },
  {
    id: "expenses",
    name: "Expense Claims",
    icon: Receipt,
    status: "Ready",
    metrics: ["12 claims", "Total: 85K"],
    actionLabel: "View",
    records: 12,
    impact: 85000,
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

export const PayrollWizardStep2: React.FC<PayrollWizardStep2Props> = ({
  onNext,
  onBack,
  onCancel,
}) => {
  const [sources, setSources] = useState<DataSource[]>(INITIAL_SOURCES);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const netImpact = useMemo(
    () => sources.reduce((acc, curr) => acc + curr.impact, 0),
    [sources]
  );

  const handleSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSources((prev) =>
        prev.map((source) =>
          source.id === id
            ? { ...source, status: "Synced", actionLabel: "Re-sync" }
            : source
        )
      );
      setSyncingId(null);
    }, 1200);
  };

  const handleRefreshAll = () => {
    setSources((prev) =>
      prev.map((source) =>
        source.status === "Pending" || source.status === "Error"
          ? { ...source, status: "Synced", actionLabel: "Re-sync" }
          : source
      )
    );
  };

  const formatPKR = (val: number) => {
    const isNeg = val < 0;
    return `${isNeg ? "-" : ""}PKR ${Math.abs(val).toLocaleString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Stepper current={2} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-800" />
            <h3 className="text-sm font-semibold text-brand-900">
              Integrated Data Sources
            </h3>
          </div>

          <button
            type="button"
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-800 transition-all hover:bg-brand-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh All Sources
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => {
            const Icon = source.icon;

            return (
              <div
                key={source.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-brand-200"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      source.status === "Pending"
                        ? "bg-orange-50 text-orange-600"
                        : source.status === "Error"
                        ? "bg-red-50 text-red-600"
                        : "bg-brand-100 text-brand-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                      source.status === "Synced" || source.status === "Ready"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : source.status === "Pending"
                        ? "border-orange-200 bg-orange-50 text-orange-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {source.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-brand-900">
                    {source.name}
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-brand-700">
                    {source.metrics.map((m, i) => (
                      <span key={i}>{m}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                      Records
                    </div>
                    <div className="mt-1 text-sm font-semibold text-brand-900">
                      {source.records.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                      Impact
                    </div>
                    <div
                      className={`mt-1 text-sm font-semibold ${
                        source.impact >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {formatPKR(source.impact)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSync(source.id)}
                  disabled={syncingId === source.id}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${syncingId === source.id ? "animate-spin" : ""}`}
                  />
                  {syncingId === source.id ? "Syncing..." : source.actionLabel}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-800" />
              <h4 className="text-sm font-semibold text-brand-900">
                Ingestion Summary
              </h4>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Source System
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Records
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Net Impact
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Integrity
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {sources.map((s) => {
                  const Icon = s.icon;
                  return (
                    <tr key={s.id} className="border-b border-gray-200 last:border-b-0">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-brand-700" />
                          <span className="text-sm font-semibold text-brand-900">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-brand-900">
                        {s.records.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right text-sm font-semibold ${
                          s.impact >= 0 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {formatPKR(s.impact)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            s.status === "Synced" || s.status === "Ready"
                              ? "bg-green-500"
                              : s.status === "Pending"
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="bg-brand-100">
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Total Integrated Impact
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-brand-700">
                    All active employees
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-brand-900">
                    {formatPKR(netImpact)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-xs leading-6 text-blue-800">
            Data cutoff integrity is locked for this run. Any update after this
            point should be pulled again before you continue to validation.
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
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-900"
          >
            Continue to Validate
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
