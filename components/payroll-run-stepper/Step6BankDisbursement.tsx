// components/payroll-run-stepper/Step6Finalize.tsx
"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardList,
  Wallet,
  CalendarDays,
  Users,
  Check,
} from "lucide-react";
import type { StepHandle } from "@/types/stepper";

/* ----------------------------------------------------------------------- */
/* Types                                                                    */
/* ----------------------------------------------------------------------- */

interface FinalizeRun {
  run_id: string;
  period: string;
  employees_total: number;
  net_payable: number;
}

interface FinalizeChecklist {
  all_records_calculated: boolean;
  all_approved: boolean;
  zero_exceptions: boolean;
  attendance_synced: boolean;
  // Allow future checklist items without breaking the type.
  [key: string]: boolean;
}

interface FinalizeStats {
  total_records: number;
  approved: number;
  on_hold: number;
  pending: number;
}

interface FinalizeResponse {
  workflow_id: string;
  run: FinalizeRun;
  checklist: FinalizeChecklist;
  stats: FinalizeStats;
  approval_required: boolean;
  can_submit: boolean;
}

/* ----------------------------------------------------------------------- */
/* Props                                                                    */
/* ----------------------------------------------------------------------- */

interface Step6Props {
  workflowUuid?: string;
}

/* ----------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ----------------------------------------------------------------------- */

function formatPKR(value: number) {
  return `PKR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Human-readable fallback labels for known checklist keys. Any key not
// listed here still renders fine — just humanized from its snake_case form.
const CHECKLIST_LABELS: Record<string, string> = {
  all_records_calculated: "All records calculated",
  all_approved: "All records approved",
  zero_exceptions: "Zero exceptions",
  attendance_synced: "Attendance synced",
};

function humanizeKey(key: string) {
  return CHECKLIST_LABELS[key] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  emphasis,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3.5 py-3 ${
        emphasis ? "border-[#1E1B4B]/15 bg-[#1E1B4B]/[0.04]" : "border-gray-100 bg-gray-50/70"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${emphasis ? "text-[#1E1B4B]" : "text-gray-400"}`} />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      </div>
      <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

function ChecklistRow({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${
        passed ? "border-emerald-100 bg-emerald-50/40" : "border-amber-100 bg-amber-50/40"
      }`}
    >
      {passed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-amber-500" />
      )}
      <span className={`text-sm ${passed ? "text-gray-700" : "text-gray-700"}`}>{label}</span>
      {!passed && (
        <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-amber-600">
          Needs attention
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Step Component                                                           */
/* ----------------------------------------------------------------------- */

const Step6Finalize = forwardRef<StepHandle, Step6Props>(
  function Step6Finalize({ workflowUuid }, ref) {
    const [confirmed, setConfirmed] = useState(false);
    const [confirmError, setConfirmError] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
      queryKey: ["payroll-finalize", workflowUuid],
      queryFn: async () => {
        const { data } = await api.get(
          `/pay-edge/payroll-workflows/${workflowUuid}/finalize`
        );
        return data.data as FinalizeResponse;
      },
      enabled: !!workflowUuid,
    });

    const finalizeMutation = useMutation({
      mutationFn: async () => {
        // No request body — the confirmation is a frontend-only gate and is
        // never sent to the API.
        const { data } = await api.post(
          `/pay-edge/payroll-workflows/${workflowUuid}/finalize`
        );
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["payroll-finalize", workflowUuid] });
      },
    });

    useImperativeHandle(ref, () => ({
      beforeNext: async () => {
        if (!workflowUuid) return;

        if (!data?.can_submit) {
          throw new Error("This payroll run cannot be submitted yet.");
        }

        if (!confirmed) {
          setConfirmError(true);
          throw new Error("Please confirm the payroll run is ready before submitting.");
        }

        setConfirmError(false);
        await finalizeMutation.mutateAsync();
      },
    }));

    if (!workflowUuid) {
      return (
        <div className="py-8 text-center text-sm text-gray-500">
          No workflow selected. Please complete previous steps first.
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      );
    }

    if (isError || !data) {
      return (
        <div className="py-8 text-center text-sm text-red-500">
          Failed to load the finalize checklist. Please try again.
        </div>
      );
    }

    const checklistEntries = Object.entries(data.checklist);

    return (
      <div className="space-y-6">
        {/* Run summary */}
        <Card>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-[#1E1B4B]">
              <ClipboardList className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Run Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Run ID" value={data.run.run_id} icon={ClipboardList} />
            <StatTile label="Period" value={data.run.period} icon={CalendarDays} />
            <StatTile
              label="Employees"
              value={data.run.employees_total.toString()}
              icon={Users}
            />
            <StatTile
              label="Net Payable"
              value={formatPKR(data.run.net_payable)}
              icon={Wallet}
              emphasis
            />
          </div>
        </Card>

        {/* Checklist */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-[#1E1B4B]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Pre-Submission Checklist</h3>
            </div>
            <span className="text-xs text-gray-500">
              {data.stats.approved} of {data.stats.total_records} approved
            </span>
          </div>
          <div className="space-y-2">
            {checklistEntries.map(([key, passed]) => (
              <ChecklistRow key={key} label={humanizeKey(key)} passed={passed} />
            ))}
          </div>
          {!data.can_submit && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This run doesn't meet the requirements for submission yet.
            </div>
          )}
          {data.approval_required && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This run requires additional approval before it can be finalized.
            </div>
          )}
        </Card>

        {/* Confirmation */}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
            confirmError
              ? "border-red-300 bg-red-50/60"
              : confirmed
              ? "border-[#1E1B4B]/30 bg-[#1E1B4B]/[0.03]"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={confirmed}
            disabled={!data.can_submit || finalizeMutation.isPending}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              if (e.target.checked) setConfirmError(false);
            }}
          />
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              confirmed ? "border-[#1E1B4B] bg-[#1E1B4B]" : "border-gray-300 bg-white"
            }`}
          >
            {confirmed && <Check className="h-3.5 w-3.5 text-white" />}
          </span>
          <span>
            <span className="block text-sm font-medium text-gray-900">
              I confirm this payroll run is ready for final submission
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              This acknowledges that review is complete, critical issues are resolved, and the
              run can move into the final approval stage.
            </span>
            {confirmError && (
              <span className="mt-1.5 block text-xs font-medium text-red-600">
                Please check this box before continuing.
              </span>
            )}
          </span>
        </label>

        {finalizeMutation.isPending && (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm text-[#1E1B4B]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting payroll run…
          </div>
        )}
        {finalizeMutation.isError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Failed to submit the payroll run. Please try again.
          </div>
        )}
      </div>
    );
  }
);

export default Step6Finalize;