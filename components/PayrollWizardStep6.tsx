"use client";

import React, { useState } from "react";
import {
  Check,
  ArrowLeft,
  Send,
  ShieldCheck,
  ClipboardCheck,
  UserCheck,
  MessageSquare,
} from "lucide-react";

interface PayrollWizardStep6Props {
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

const CHECKLIST = [
  "All 325 employee records calculated",
  "Zero critical exceptions remaining",
  "Sub-system data (Time/Leave) synced",
  "Multi-tab review phase completed",
  "Variance justifications provided",
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

export const PayrollWizardStep6: React.FC<PayrollWizardStep6Props> = ({
  onNext,
  onBack,
  onCancel,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState("");

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Stepper current={6} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-semibold text-brand-900">
                Run Identity
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Run ID
                </p>
                <p className="mt-1 font-mono font-semibold text-brand-900">
                  RUN-2025-001
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Period
                </p>
                <p className="mt-1 font-semibold text-brand-900">January 2025</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Employees
                </p>
                <p className="mt-1 font-semibold text-brand-900">325 Total</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Version
                </p>
                <p className="mt-1 font-semibold text-brand-900">v1.2</p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Net Payable
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-900">
                PKR 29.80M
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-semibold text-brand-900">
                Pre-submission Checklist
              </h3>
            </div>

            <div className="space-y-2">
              {CHECKLIST.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-semibold text-brand-900">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-semibold text-brand-900">
                Approval Workflow
              </h3>
            </div>

            <div className="relative space-y-6 pl-4">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

              {[
                {
                  label: "You (Initiator)",
                  detail: "Draft Submission",
                  tone: "active",
                  sla: "Now",
                },
                {
                  label: "HR Manager",
                  detail: "Zainab Siddiqui",
                  tone: "pending",
                  sla: "TAT: 24h",
                },
                {
                  label: "Finance Head",
                  detail: "Ahmed Raza",
                  tone: "pending",
                  sla: "TAT: 12h",
                },
              ].map((item, idx) => (
                <div key={idx} className="relative flex items-center gap-4">
                  <div
                    className={`z-10 h-6 w-6 rounded-full ring-4 ring-white ${
                      item.tone === "active" ? "bg-brand-800" : "bg-gray-300"
                    }`}
                  />
                  <div
                    className={`flex-1 rounded-xl border p-3 ${
                      item.tone === "active"
                        ? "border-brand-200 bg-brand-100"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          {item.label}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-brand-900">
                          {item.detail}
                        </div>
                      </div>
                      <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                        {item.sla}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 text-brand-800" />
                <p className="text-sm leading-6 text-brand-700">
                  Add a final note for approvers if there are special variances,
                  delayed approvals, or payout assumptions to highlight.
                </p>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write optional note for approvers..."
                className="mt-3 min-h-[110px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-brand-200 bg-brand-100 p-5 shadow-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#1E1B4B]"
              />
              <div>
                <div className="text-sm font-semibold text-brand-900">
                  I confirm this payroll run is ready for final submission
                </div>
                <p className="mt-1 text-xs leading-6 text-brand-800">
                  This acknowledges that review is complete, critical issues are
                  resolved, and the run can move into the final approval stage.
                </p>
              </div>
            </label>
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
            disabled={!confirmed}
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit for Finalization
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
