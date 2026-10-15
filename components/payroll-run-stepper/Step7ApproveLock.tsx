// components/payroll-run-stepper/Step7Disburse.tsx
"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useBanks } from "@/hooks/useBanks"; // adjust path if different in your project
import {
  Loader2,
  Lock,
  Unlock,
  FileText,
  Building,
  FileSpreadsheet,
  FileBarChart,
  Mail,
  Bell,
  Paperclip,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { StepHandle } from "@/types/stepper";

/* ----------------------------------------------------------------------- */
/* Types                                                                    */
/* ----------------------------------------------------------------------- */

// A single toggleable item coming back from the API. The backend now sends
// the exact `action` string to use when this item is checked, so we no
// longer need a local key -> action lookup map.
//
// NOTE: some items report their checked-state via `generated` (artifacts
// like payslips/bank_file) and others via `enabled` (email, mark_paid,
// push, pdf). Both are optional here and we resolve the actual boolean
// with `getChecked()` below.
interface DisburseItem {
  key: string;
  name: string;
  action: string;
  generated?: boolean;
  enabled?: boolean;
}

interface DisburseData {
  workflow_id: string;
  period_id: string;
  lock: {
    description: string;
    action: string;
    is_locked: boolean;
  };
  artifacts: DisburseItem[];
  notifications: DisburseItem[];
}

/* ----------------------------------------------------------------------- */
/* Props                                                                    */
/* ----------------------------------------------------------------------- */

interface Step7Props {
  workflowUuid?: string;
}

/* ----------------------------------------------------------------------- */
/* Keys we don't want to show / send yet                                   */
/* ----------------------------------------------------------------------- */

const EXCLUDED_ARTIFACT_KEYS = new Set(["payroll_register", "tax_report"]);

/* ----------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ----------------------------------------------------------------------- */

/** Resolves the checked-state of an item regardless of whether the API used
 *  `generated` or `enabled` for it. */
function getChecked(item: DisburseItem): boolean {
  if (item.generated !== undefined) return item.generated;
  if (item.enabled !== undefined) return item.enabled;
  return false;
}

/** Flips whichever checked-state field the item actually uses. */
function toggleChecked(item: DisburseItem): DisburseItem {
  if (item.generated !== undefined) return { ...item, generated: !item.generated };
  return { ...item, enabled: !item.enabled };
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#1E1B4B]" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

/** Small switch control. Purely presentational — parent owns the state. */
function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-[#1E1B4B] focus-visible:ring-[#1E1B4B]" : "bg-gray-200 focus-visible:ring-gray-400"
      }`}
      style={{ height: "1.375rem", width: "2.5rem" }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/** A single box used for artifacts and notifications — 3 to a row. */
function ToggleBox({
  icon: Icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-50">
          <Icon className="h-4.5 w-4.5 text-gray-500" />
        </div>
        <Toggle checked={checked} onChange={onChange} label={title} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

const artifactIcons: Record<string, React.ElementType> = {
  payslips: FileText,
  bank_file: Building,
  payroll_register: FileSpreadsheet,
  tax_report: FileBarChart,
  email: Mail,
  mark_paid: CheckCircle2,
};

const notificationIcons: Record<string, React.ElementType> = {
  email: Mail,
  push: Bell,
  pdf: Paperclip,
};

/* ----------------------------------------------------------------------- */
/* Step Component                                                           */
/* ----------------------------------------------------------------------- */

const Step7Disburse = forwardRef<StepHandle, Step7Props>(
  function Step7Disburse({ workflowUuid }, ref) {
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
      queryKey: ["payroll-disburse", workflowUuid],
      queryFn: async () => {
        const { data } = await api.get(
          `/pay-edge/payroll-workflows/${workflowUuid}/disburse`
        );
        return data.data as DisburseData;
      },
      enabled: !!workflowUuid,
    });

    // Local, editable copies so the toggles are interactive.
    const [isLocked, setIsLocked] = useState(false);
    const [lockAction, setLockAction] = useState("lock");
    const [artifacts, setArtifacts] = useState<DisburseItem[]>([]);
    const [notifications, setNotifications] = useState<DisburseItem[]>([]);
    const [passwordProtect, setPasswordProtect] = useState(true);
    const [bankId, setBankId] = useState<number | null>(null);

    // file_format is fixed to "csv" for now — kept as state so it's a
    // one-line change to open it up to more formats later.
    const [fileFormat] = useState<"csv">("csv");

    useEffect(() => {
      if (data) {
        setIsLocked(data.lock.is_locked);
        setLockAction(data.lock.action);
        setArtifacts(
          data.artifacts.filter((a) => !EXCLUDED_ARTIFACT_KEYS.has(a.key))
        );
        setNotifications(data.notifications);
      }
    }, [data]);

    const needsBank = artifacts.some(
      (a) => a.key === "bank_file" && getChecked(a)
    );

    const { data: banksData, isLoading: banksLoading } = useBanks({ per_page: 50 });
    const banks = banksData?.data ?? [];

    // Pre-select the first bank once the list loads, if one hasn't been chosen yet.
    useEffect(() => {
      if (needsBank && bankId === null && banks.length > 0) {
        setBankId(banks[0].id);
      }
    }, [needsBank, bankId, banks]);

    const submitMutation = useMutation({
      mutationFn: async () => {
        const actions: string[] = [];

        if (isLocked) actions.push(lockAction);

        artifacts.forEach((a) => {
          if (getChecked(a)) actions.push(a.action);
        });

        const payload = {
          actions,
          notifications: notifications.filter((n) => getChecked(n)).map((n) => n.key),
          file_format: fileFormat,
          bank_id: needsBank ? bankId : undefined,
          password_protect: passwordProtect,
        };

        const { data } = await api.post(
          `/pay-edge/payroll-workflows/${workflowUuid}/disburse`,
          payload
        );
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["payroll-disburse", workflowUuid] });
      },
    });

    useImperativeHandle(ref, () => ({
      beforeNext: async () => {
        if (needsBank && !bankId) {
          throw new Error("Please select a bank before continuing.");
        }
        await submitMutation.mutateAsync();
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
          Failed to load disbursement data. Please try again.
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Lock status */}
        <Section title="Lock status" icon={isLocked ? Lock : Unlock}>
          <div
            className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${
              isLocked ? "border-purple-200 bg-purple-50" : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-center gap-3">
              {isLocked ? (
                <Lock className="h-5 w-5 shrink-0 text-purple-600" />
              ) : (
                <Unlock className="h-5 w-5 shrink-0 text-amber-600" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {isLocked ? "Payroll locked" : "Payroll not locked"}
                </p>
                <p className="text-sm text-gray-600">{data.lock.description}</p>
              </div>
            </div>
            <Toggle
              checked={isLocked}
              onChange={() => setIsLocked((v) => !v)}
              label="Lock payroll"
            />
          </div>
        </Section>

        {/* Artifacts */}
        <Section title="Artifacts" icon={FileSpreadsheet}>
          <div className="grid gap-3 sm:grid-cols-3">
            {artifacts.map((artifact) => (
              <ToggleBox
                key={artifact.key}
                icon={artifactIcons[artifact.key] ?? FileText}
                title={artifact.name}
                subtitle={getChecked(artifact) ? "Enabled" : "Disabled"}
                checked={getChecked(artifact)}
                onChange={() =>
                  setArtifacts((prev) =>
                    prev.map((a) =>
                      a.key === artifact.key ? toggleChecked(a) : a
                    )
                  )
                }
              />
            ))}
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell}>
          <div className="grid gap-3 sm:grid-cols-3">
            {notifications.map((notif) => (
              <ToggleBox
                key={notif.key}
                icon={notificationIcons[notif.key] ?? Bell}
                title={notif.name}
                subtitle={getChecked(notif) ? "Enabled" : "Disabled"}
                checked={getChecked(notif)}
                onChange={() =>
                  setNotifications((prev) =>
                    prev.map((n) =>
                      n.key === notif.key ? toggleChecked(n) : n
                    )
                  )
                }
              />
            ))}
          </div>
        </Section>

        {/* Options: bank, file format, password protect */}
        <Section title="Options" icon={ShieldCheck}>
          <div className="space-y-3">
            {needsBank && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Bank</p>
                  <p className="text-xs text-gray-500">
                    Used to generate the bank disbursement file
                  </p>
                </div>
                <select
                  value={bankId ?? ""}
                  onChange={(e) => setBankId(Number(e.target.value))}
                  disabled={banksLoading || banks.length === 0}
                  className="w-48 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                >
                  {banksLoading && <option>Loading banks…</option>}
                  {!banksLoading && banks.length === 0 && <option>No banks found</option>}
                  {banks.map((bank: { id: number; name: string }) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">File format</p>
                <p className="text-xs text-gray-500">Only CSV is supported for now</p>
              </div>
              <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium uppercase text-gray-600">
                CSV
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Password protect</p>
                <p className="text-xs text-gray-500">
                  Require a password to open generated files
                </p>
              </div>
              <Toggle
                checked={passwordProtect}
                onChange={() => setPasswordProtect((v) => !v)}
                label="Password protect files"
              />
            </div>
          </div>
        </Section>

        {submitMutation.isError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Something went wrong submitting disbursement. Please try again.
          </div>
        )}
      </div>
    );
  }
);

export default Step7Disburse;