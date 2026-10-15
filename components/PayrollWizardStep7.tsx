"use client";

import React, { useState } from "react";
import {
  Check,
  Lock,
  FileText,
  Mail,
  Bell,
  ShieldCheck,
  MessageSquare,
  Printer,
  History,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

interface PayrollWizardStep7Props {
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

function Stepper({ current }: { current: number }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {STEPS.map((step) => (
        <div key={step.id} className="flex flex-col items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
              step.id === current
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-green-500 bg-green-500 text-white"
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

export const PayrollWizardStep7: React.FC<PayrollWizardStep7Props> = ({
  onNext,
  onBack,
  onCancel,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genComplete, setGenComplete] = useState(false);
  const [notifyOptions, setNotifyOptions] = useState({
    email: true,
    push: true,
    pdf: true,
  });
  const [genSteps, setGenSteps] = useState({
    payslips: true,
    advice: true,
    register: true,
    summary: true,
    jv: false,
    tax: true,
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenComplete(true);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Stepper current={7} />
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-green-900">
                Cycle Authorized
              </div>
              <p className="mt-1 text-sm text-green-800">
                HR and Finance approvals are complete. This run is ready for
                lock, artifact generation, and publishing.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-green-800">
                <span><strong>HR Approval:</strong> Zainab Siddiqui</span>
                <span><strong>Finance Approval:</strong> M. Ahmed Raza</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-green-200 bg-white px-4 py-3 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-green-700">
              Transaction Ref
            </div>
            <div className="mt-1 text-sm font-semibold text-green-900">
              HRMS-PK-2025-001-AUTH
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-sm font-semibold text-white">
              A
            </div>
            <h4 className="text-sm font-semibold text-brand-900">Final Lockdown</h4>
          </div>

          <p className="text-sm leading-6 text-brand-700">
            Locking finalizes this payroll version and prevents further changes.
          </p>

          <button
            type="button"
            onClick={() => setIsLocked(true)}
            disabled={isLocked}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              isLocked
                ? "bg-green-500 text-white"
                : "bg-brand-800 text-white hover:bg-brand-900"
            }`}
          >
            {isLocked ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isLocked ? "Run Locked" : "Lock Payroll Run"}
          </button>
        </div>

        <div
          className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${
            !isLocked ? "opacity-50" : ""
          }`}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-sm font-semibold text-white">
              B
            </div>
            <h4 className="text-sm font-semibold text-brand-900">Generate Artifacts</h4>
          </div>

          <div className="space-y-2">
            {[
              ["payslips", "Employee Payslips"],
              ["advice", "Bank Disbursement Advice"],
              ["register", "Payroll Register"],
              ["summary", "Department Summary"],
              ["jv", "Accounting JV Export"],
              ["tax", "FBR Tax Report"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5"
              >
                <span className="text-sm text-brand-700">{label}</span>
                <input
                  type="checkbox"
                  checked={genSteps[key as keyof typeof genSteps]}
                  onChange={() =>
                    setGenSteps((prev) => ({
                      ...prev,
                      [key]: !prev[key as keyof typeof prev],
                    }))
                  }
                  disabled={!isLocked}
                  className="h-4 w-4 accent-[#1E1B4B]"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!isLocked || isGenerating || genComplete}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isGenerating
              ? "Generating..."
              : genComplete
              ? "Generated Successfully"
              : "Generate Selected"}
          </button>
        </div>

        <div
          className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${
            !genComplete ? "opacity-50" : ""
          }`}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-sm font-semibold text-white">
              C
            </div>
            <h4 className="text-sm font-semibold text-brand-900">Publish & Notify</h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-700" />
                <span className="text-sm text-brand-700">Email Notification</span>
              </div>
              <input
                type="checkbox"
                checked={notifyOptions.email}
                onChange={() =>
                  setNotifyOptions((prev) => ({ ...prev, email: !prev.email }))
                }
                disabled={!genComplete}
                className="h-4 w-4 accent-[#1E1B4B]"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-700" />
                <span className="text-sm text-brand-700">Push Notification</span>
              </div>
              <input
                type="checkbox"
                checked={notifyOptions.push}
                onChange={() =>
                  setNotifyOptions((prev) => ({ ...prev, push: !prev.push }))
                }
                disabled={!genComplete}
                className="h-4 w-4 accent-[#1E1B4B]"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-brand-700" />
                <span className="text-sm text-brand-700">Attach PDF</span>
              </div>
              <input
                type="checkbox"
                checked={notifyOptions.pdf}
                onChange={() =>
                  setNotifyOptions((prev) => ({ ...prev, pdf: !prev.pdf }))
                }
                disabled={!genComplete}
                className="h-4 w-4 accent-[#1E1B4B]"
              />
            </label>
          </div>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-2">
              <MessageSquare className="mt-0.5 h-4 w-4 text-brand-800" />
              <p className="text-sm leading-6 text-brand-700">
                After publishing, employees receive their payslips and the run is
                available in history with locked audit references.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-brand-800" />
          <h4 className="text-sm font-semibold text-brand-900">
            Output Summary
          </h4>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              Locked Version
            </div>
            <div className="mt-1 text-sm font-semibold text-brand-900">
              v1.2 Final
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              Generated Artifacts
            </div>
            <div className="mt-1 text-sm font-semibold text-brand-900">
              {Object.values(genSteps).filter(Boolean).length} selected
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              Notification Channels
            </div>
            <div className="mt-1 text-sm font-semibold text-brand-900">
              {Object.values(notifyOptions).filter(Boolean).length} enabled
            </div>
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
            disabled={!genComplete}
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Finish Run
            <ShieldCheck className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
