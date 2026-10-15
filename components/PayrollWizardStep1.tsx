"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Layers,
  Settings2,
  UserMinus,
  UserPlus,
  AlertTriangle,
  Users,
  ArrowRight,
} from "lucide-react";

interface PayrollWizardStep1Props {
  onNext: (data: any) => void;
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

const GROUPS = [
  { id: "G1", name: "Islamabad Corporate Staff", count: 145, entity: "Corporate" },
  { id: "G2", name: "Karachi Operations", count: 280, entity: "Operations" },
  { id: "G3", name: "Executive Management", count: 12, entity: "Management" },
  { id: "G4", name: "Sales Commission Group", count: 35, entity: "Sales" },
  { id: "G5", name: "Fixed Term Contractors", count: 13, entity: "Contractual" },
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

function ToggleRow({
  label,
  description,
  active,
  tone = "brand",
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  tone?: "brand" | "green" | "orange";
  onClick: () => void;
}) {
  const activeBg =
    tone === "green"
      ? "border-green-200 bg-green-50"
      : tone === "orange"
      ? "border-orange-200 bg-orange-50"
      : "border-brand-200 bg-brand-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
        active ? activeBg : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="pr-4">
        <div className="text-sm font-semibold text-brand-900">{label}</div>
        <div className="mt-0.5 text-xs text-brand-700">{description}</div>
      </div>

      <div
        className={`relative h-5 w-10 rounded-full transition-all ${
          active
            ? tone === "green"
              ? "bg-green-500"
              : tone === "orange"
              ? "bg-orange-500"
              : "bg-brand-800"
            : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            active ? "left-[22px]" : "left-[2px]"
          }`}
        />
      </div>
    </button>
  );
}

export const PayrollWizardStep1: React.FC<PayrollWizardStep1Props> = ({
  onNext,
  onCancel,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("2025-01");
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["G1", "G2"]);
  const [runType, setRunType] = useState("Regular");
  const [includeJoiners, setIncludeJoiners] = useState(true);
  const [includeExits, setIncludeExits] = useState(false);

  const totalEmployees = useMemo(
    () =>
      GROUPS.filter((g) => selectedGroups.includes(g.id)).reduce(
        (acc, curr) => acc + curr.count,
        0
      ),
    [selectedGroups]
  );

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedGroups.length === 0) {
      alert("Please select at least one payroll group.");
      return;
    }

    onNext({
      selectedPeriod,
      selectedGroups,
      runType,
      includeJoiners,
      includeExits,
      totalEmployees,
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Stepper current={1} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-semibold text-brand-900">
                Period & Run Type
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Payroll Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none"
                >
                  <option value="2025-01">January 2025 (Open)</option>
                  <option value="2024-12">December 2024 (Correction Only)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Run Nature
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {["Regular", "Supplementary", "Bonus"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRunType(type)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                        runType === type
                          ? "border-brand-800 bg-brand-800 text-white"
                          : "border-gray-200 bg-white text-brand-700 hover:bg-brand-100"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-semibold text-brand-900">
                Execution Options
              </h3>
            </div>

            <div className="space-y-3">
              <ToggleRow
                label="Include New Joiners"
                description="Auto-add employees joined during this cycle."
                active={includeJoiners}
                tone="green"
                onClick={() => setIncludeJoiners((prev) => !prev)}
              />
              <ToggleRow
                label="Include Exits / F&F"
                description="Process final settlements in this batch."
                active={includeExits}
                tone="orange"
                onClick={() => setIncludeExits((prev) => !prev)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-800" />
                <h3 className="text-sm font-semibold text-brand-900">
                  Target Groups
                </h3>
              </div>
              <span className="rounded-md border border-brand-200 bg-brand-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-800">
                {selectedGroups.length} selected
              </span>
            </div>

            <div className="space-y-2">
              {GROUPS.map((group) => {
                const active = selectedGroups.includes(group.id);

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                      active
                        ? "border-brand-200 bg-brand-100"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="pr-4">
                      <div className="text-sm font-semibold text-brand-900">
                        {group.name}
                      </div>
                      <div className="mt-0.5 text-xs text-brand-700">
                        {group.entity}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-brand-900">
                        {group.count}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-brand-700">
                        employees
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedGroups.includes("G1") && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              <div>
                <div className="text-sm font-semibold text-orange-900">
                  Active draft detected
                </div>
                <p className="mt-1 text-xs leading-6 text-orange-800">
                  A draft run already exists for Islamabad Corporate. Continuing
                  will create a new working version for this period.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-semibold text-brand-900">
                Selection Summary
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  Total Employees
                </div>
                <div className="mt-1 text-lg font-bold text-brand-900">
                  {totalEmployees}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  Run Type
                </div>
                <div className="mt-1 text-lg font-bold text-brand-900">
                  {runType}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  Joiners
                </div>
                <div className="mt-1 text-sm font-semibold text-brand-900">
                  {includeJoiners ? "Included" : "Excluded"}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  Exits / F&F
                </div>
                <div className="mt-1 text-sm font-semibold text-brand-900">
                  {includeExits ? "Included" : "Excluded"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-100"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-900"
        >
          Continue to Ingest
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
