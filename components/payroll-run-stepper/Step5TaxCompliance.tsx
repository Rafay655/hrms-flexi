// components/payroll-run-stepper/Step5Approval.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Inbox,
  FileText,
  Pencil,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import type { StepHandle } from "@/types/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

/* ----------------------------------------------------------------------- */
/* Types                                                                    */
/* ----------------------------------------------------------------------- */

interface LineItem {
  id: string;
  pay_head_id: string;
  pay_head_code: string;
  pay_head_name: string;
  type: string;
  amount: string;
  calculated_amount: string;
  is_overridable: boolean;
  override_reason: string | null;
  overridden_by: string | null;
  ytd_amount: string;
}

interface LabelItem {
  key: string;
  label: string;
}

interface FlagMeta {
  label: string;
  variant: string;
}

interface ApprovalLabels {
  tabs: LabelItem[];
  columns: LabelItem[];
  flags: Record<string, FlagMeta>;
}

interface BreakdownItem {
  key: string;
  label: string;
  amount: number;
}

interface Breakdown {
  items: BreakdownItem[];
  total: BreakdownItem;
}

interface ApprovalRecord {
  id: string;
  employee_code: string;
  employee_name: string;
  designation: string;
  gross: number;
  net: number;
  delta: number | null;
  delta_pct: number | null;
  status: string;
  flags: string[];
  earnings?: Breakdown | null;
  deductions?: Breakdown | null;
  auditor_note: string | null;
}

interface ApprovalSummary {
  total_records: number;
  approved: number;
  pending: number;
  on_hold: number;
}

interface ApprovalResponse {
  workflow_id: string;
  summary: ApprovalSummary;
  labels?: ApprovalLabels;
  records: ApprovalRecord[];
}

interface Step5Props {
  workflowUuid?: string;
}

interface OverridePayload {
  line_item_id: string;
  amount: number;
  override_reason: string;
}

/* ----------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ----------------------------------------------------------------------- */

const DEFAULT_COLUMNS: LabelItem[] = [
  { key: "employee", label: "Employee" },
  { key: "designation", label: "Designation" },
  { key: "gross", label: "Gross Pay" },
  { key: "net", label: "Net Payout" },
  { key: "delta", label: "Delta" },
  { key: "flags", label: "Flags" },
];

const DEFAULT_FLAGS: Record<string, FlagMeta> = {
  OVERTIME: { label: "Overtime", variant: "info" },
  WARNING: { label: "Warning", variant: "warning" },
  ERROR: { label: "Error", variant: "danger" },
  INFO: { label: "Info", variant: "info" },
};

function formatPKR(value: number) {
  return `PKR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPKRShort(value: number) {
  return `PKR ${Math.round(value).toLocaleString()}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeLabel(label: string) {
  return label
    .split(" ")
    .map((word) => {
      const isAcronym = word.length > 0 && word === word.toUpperCase() && /[A-Z]/.test(word);
      if (isAcronym) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  calculated: "bg-indigo-50 text-[#1E1B4B] ring-1 ring-inset ring-indigo-200",
  on_hold: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  pending: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
};
const DEFAULT_STATUS_STYLE = "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200";

const ROW_ACCENT: Record<string, string> = {
  on_hold: "border-l-2 border-l-amber-300",
};

const FLAG_VARIANT_STYLES: Record<string, string> = {
  neutral: "border-gray-200 bg-gray-50 text-gray-600",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
};

function StatCard({ label, value, icon: Icon, tone = "default" }: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: "default" | "green" | "amber" | "blue";
}) {
  const toneMap = {
    default: { text: "text-gray-700", chip: "bg-gray-100 text-gray-500" },
    green: { text: "text-emerald-700", chip: "bg-emerald-50 text-emerald-600" },
    amber: { text: "text-amber-700", chip: "bg-amber-50 text-amber-600" },
    blue: { text: "text-[#1E1B4B]", chip: "bg-indigo-50 text-[#1E1B4B]" },
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneMap.chip}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className={`text-lg font-semibold leading-tight tabular-nums ${toneMap.text}`}>{value}</p>
      </div>
    </div>
  );
}

function FlagBadge({ flagKey, meta }: { flagKey: string; meta?: FlagMeta }) {
  const label = meta?.label ?? flagKey.replace(/_/g, " ");
  const style = FLAG_VARIANT_STYLES[meta?.variant ?? "neutral"] ?? FLAG_VARIANT_STYLES.neutral;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}

function DeltaCell({ delta, deltaPct }: { delta: number | null; deltaPct: number | null }) {
  if (delta === null || deltaPct === null) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Minus className="h-3 w-3" />
        0.0%
      </span>
    );
  }
  const isUp = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${isUp ? "text-emerald-600" : "text-rose-600"}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? "+" : ""}
      {deltaPct.toFixed(1)}%
    </span>
  );
}

function ComponentPanel({ title, icon: Icon, breakdown, tone }: {
  title: string;
  icon: React.ElementType;
  breakdown: Breakdown | null | undefined;
  tone: "emerald" | "rose";
}) {
  const items = breakdown?.items ?? [];
  const total = breakdown?.total ?? { key: "total", label: "Total", amount: 0 };
  const toneClasses = tone === "emerald"
    ? { border: "border-emerald-100", bg: "bg-emerald-50/40", heading: "text-emerald-700", totalBorder: "border-emerald-200/70", totalText: "text-emerald-700" }
    : { border: "border-rose-100", bg: "bg-rose-50/40", heading: "text-rose-700", totalBorder: "border-rose-200/70", totalText: "text-rose-700" };

  return (
    <div className={`flex h-full flex-col rounded-lg border ${toneClasses.border} ${toneClasses.bg} p-3.5`}>
      <div className="mb-2 flex items-center justify-between">
        <h4 className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${toneClasses.heading}`}>
          <Icon className="h-3.5 w-3.5" />
          {title}
        </h4>
        <span className="text-[11px] text-gray-400">{items.length} item{items.length === 1 ? "" : "s"}</span>
      </div>
      <div className="flex-1 space-y-1.5">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.key} className="flex justify-between text-sm">
              <span className="text-gray-600">{normalizeLabel(item.label)}</span>
              <span className="font-mono tabular-nums text-gray-900">{formatPKR(item.amount)}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400">No components to show.</p>
        )}
      </div>
      <div className={`mt-2 flex justify-between border-t ${toneClasses.totalBorder} pt-1.5 text-sm font-semibold`}>
        <span className="text-gray-900">{normalizeLabel(total.label)}</span>
        <span className={`font-mono tabular-nums ${toneClasses.totalText}`}>{formatPKR(total.amount)}</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Step Component                                                           */
/* ----------------------------------------------------------------------- */

const Step5Approval = forwardRef<StepHandle, Step5Props>(
  function Step5Approval({ workflowUuid }, ref) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
    const [isLineItemModalOpen, setIsLineItemModalOpen] = useState(false);

    // Override state
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);
    const [editingLineItem, setEditingLineItem] = useState<LineItem | null>(null);
    const [overrideAmount, setOverrideAmount] = useState("");
    const [overrideReason, setOverrideReason] = useState("");

    // Hold state
    const [holdModalOpen, setHoldModalOpen] = useState(false);
    const [holdRecordId, setHoldRecordId] = useState<string | null>(null);
    const [holdReason, setHoldReason] = useState("");

    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
      queryKey: ["payroll-approval", workflowUuid],
      queryFn: async () => {
        const { data } = await api.get(`/pay-edge/payroll-workflows/${workflowUuid}/approve`);
        return data.data as ApprovalResponse;
      },
      enabled: !!workflowUuid,
    });

    // Fetch line items
    const {
      data: lineItemsData,
      isLoading: lineItemsLoading,
      isError: lineItemsError,
    } = useQuery({
      queryKey: ["payroll-record-line-items", selectedRecordId],
      queryFn: async () => {
        const { data } = await api.get(`/pay-edge/payroll-records/${selectedRecordId}/line-items`);
        return data.data as LineItem[];
      },
      enabled: !!selectedRecordId && isLineItemModalOpen,
    });

    const approveMutation = useMutation({
      mutationFn: async (recordIds: string[]) => {
        const { data } = await api.post(
          `/pay-edge/payroll-workflows/${workflowUuid}/approve`,
          { record_ids: recordIds }
        );
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["payroll-approval", workflowUuid] });
      },
    });

    // Override mutation
    const overrideMutation = useMutation({
      mutationFn: async (payload: OverridePayload) => {
        const { data } = await api.put(
          `/pay-edge/payroll-records/${selectedRecordId}/override`,
          payload
        );
        return data;
      },
      onSuccess: () => {
        toast.success("Line item overridden successfully.");
        queryClient.invalidateQueries({
          queryKey: ["payroll-record-line-items", selectedRecordId],
        });
        queryClient.invalidateQueries({
      queryKey: ["payroll-approval", workflowUuid],
    });
        closeOverrideModal();
      },
      onError: (error: any) => {
        showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Override failed." });
      },
    });

    // Hold mutation
    const holdMutation = useMutation({
      mutationFn: async ({ recordId, reason }: { recordId: string; reason: string }) => {
        const { data } = await api.post(`/pay-edge/payroll-records/${recordId}/hold`, { hold_reason:reason });
        return data;
      },
      onSuccess: () => {
        toast.success("Record placed on hold.");
        queryClient.invalidateQueries({ queryKey: ["payroll-approval", workflowUuid] });
        closeHoldModal();
      },
      onError: (error: any) => {
        showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Hold failed." });
      },
    });

    // Release mutation
    const releaseMutation = useMutation({
      mutationFn: async (recordId: string) => {
        const { data } = await api.post(`/pay-edge/payroll-records/${recordId}/release`);
        return data;
      },
      onSuccess: () => {
        toast.success("Record released from hold.");
        queryClient.invalidateQueries({ queryKey: ["payroll-approval", workflowUuid] });
      },
      onError: (error: any) => {
        showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Release failed." });
      },
    });

    useImperativeHandle(ref, () => ({
      beforeNext: async () => {
        if (!workflowUuid || !data) return;

        const nonHoldIds = data.records
          .filter((record) => record.status !== "on_hold")
          .map((record) => record.id);

        if (nonHoldIds.length === 0) {
          toast.error("All records are on hold. Please release at least one record before proceeding.");
          throw new Error("No records to approve");
        }

        await approveMutation.mutateAsync(nonHoldIds);
        toast.success("Payroll approved for eligible records.");
      },
    }), [workflowUuid, data, approveMutation]);

    const toggleRow = (id: string) => {
      setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const openLineItemsModal = (recordId: string) => {
      const record = data?.records.find((r) => r.id === recordId);
      setSelectedEmployeeName(record ? `${record.employee_name} (${record.employee_code})` : "");
      setSelectedRecordId(recordId);
      setIsLineItemModalOpen(true);
    };

    const closeLineItemsModal = () => {
      setIsLineItemModalOpen(false);
      setSelectedRecordId(null);
      setSelectedEmployeeName("");
    };

    const openOverrideModal = (item: LineItem) => {
      setEditingLineItem(item);
      setOverrideAmount(item.amount);
      setOverrideReason(item.override_reason ?? "");
      setOverrideModalOpen(true);
    };

    const closeOverrideModal = () => {
      setOverrideModalOpen(false);
      setEditingLineItem(null);
      setOverrideAmount("");
      setOverrideReason("");
    };

    const handleOverrideSubmit = () => {
      if (!editingLineItem) return;

      const amountNum = parseFloat(overrideAmount);
      if (isNaN(amountNum) || amountNum < 0) {
        toast.error("Please enter a valid amount.");
        return;
      }
      if (!overrideReason.trim()) {
        toast.error("Override reason is required.");
        return;
      }

      overrideMutation.mutate({
        line_item_id: editingLineItem.id,
        amount: amountNum,
        override_reason: overrideReason.trim(),
      });
    };

    const openHoldModal = (recordId: string) => {
      setHoldRecordId(recordId);
      setHoldReason("");
      setHoldModalOpen(true);
    };

    const closeHoldModal = () => {
      setHoldModalOpen(false);
      setHoldRecordId(null);
      setHoldReason("");
    };

    const handleHoldSubmit = () => {
      if (!holdRecordId) return;
      if (!holdReason.trim()) {
        toast.error("Please provide a reason for the hold.");
        return;
      }
      holdMutation.mutate({ recordId: holdRecordId, reason: holdReason.trim() });
    };

    const handleRelease = (recordId: string) => {
      releaseMutation.mutate(recordId);
    };

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
          Failed to load approval data. Please try again.
        </div>
      );
    }

    const columns = data.labels?.columns?.length ? data.labels.columns : DEFAULT_COLUMNS;
    const flagsMeta = { ...DEFAULT_FLAGS, ...(data.labels?.flags ?? {}) };
    const columnLabel = (key: string, fallback: string) =>
      columns.find((c) => c.key === key)?.label ?? fallback;

    return (
      <div className="space-y-6">
        {approveMutation.isPending && (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm text-[#1E1B4B]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Approving payroll for eligible records…
          </div>
        )}
        {approveMutation.isError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Failed to approve payroll. Please try again before moving on.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Records" value={data.summary.total_records} icon={Users} tone="blue" />
          <StatCard label="Approved" value={data.summary.approved} icon={CheckCircle2} tone="green" />
          <StatCard label="Pending" value={data.summary.pending} icon={Clock} tone="amber" />
          <StatCard label="On Hold" value={data.summary.on_hold} icon={AlertTriangle} tone="default" />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {data.records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Inbox className="h-6 w-6 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No records to review</p>
              <p className="text-xs text-gray-400">Records will appear here once payroll has been calculated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="w-8 px-2 py-2.5" />
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {columnLabel("employee", "Employee")}
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {columnLabel("gross", "Gross Pay")}
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {columnLabel("net", "Net Payout")}
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {columnLabel("delta", "Delta")}
                    </th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.records.map((record) => {
                    const isExpanded = expandedRows[record.id] ?? false;
                    const isOnHold = record.status === "on_hold";
                    return (
                      <React.Fragment key={record.id}>
                        <tr
                          className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                            ROW_ACCENT[record.status] ?? ""
                          } ${isExpanded ? "bg-gray-50" : ""}`}
                          onClick={() => toggleRow(record.id)}
                        >
                          <td className="px-2 py-3 text-center align-middle">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-transform">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E1B4B]/[0.08] text-[10px] font-semibold text-[#1E1B4B]">
                                {initials(record.employee_name)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium leading-tight text-gray-900">{record.employee_name}</span>
                                <span className="text-xs text-gray-500">{record.employee_code} · {record.designation}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-middle font-mono tabular-nums text-gray-700">{formatPKRShort(record.gross)}</td>
                          <td className="px-4 py-3 text-right align-middle font-mono font-semibold tabular-nums text-gray-900">{formatPKRShort(record.net)}</td>
                          <td className="px-4 py-3 text-right align-middle"><DeltaCell delta={record.delta} deltaPct={record.delta_pct} /></td>
                          <td className="px-4 py-3 text-center align-middle">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[record.status] ?? DEFAULT_STATUS_STYLE}`}>
                              {record.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="max-w-[180px] truncate px-4 py-3 align-middle text-sm text-gray-600">{record.auditor_note ?? "—"}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50/60">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
                                <ComponentPanel title="Earnings" icon={TrendingUp} breakdown={record.earnings} tone="emerald" />
                                <ComponentPanel title="Deductions" icon={TrendingDown} breakdown={record.deductions} tone="rose" />
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                                {record.auditor_note && (
                                  <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-600">
                                    <span className="mr-1.5 font-semibold text-gray-800">Note:</span>
                                    {record.auditor_note}
                                  </div>
                                )}
                                <div className="ml-auto flex items-center gap-2">
                                  {isOnHold ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRelease(record.id);
                                      }}
                                      disabled={releaseMutation.isPending}
                                      className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                    >
                                      <PlayCircle className="h-3.5 w-3.5" />
                                      Release
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openHoldModal(record.id);
                                      }}
                                      className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
                                    >
                                      <PauseCircle className="h-3.5 w-3.5" />
                                      Hold
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openLineItemsModal(record.id);
                                    }}
                                    className="gap-1.5"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Line Items
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Line Items Modal */}
        <Dialog open={isLineItemModalOpen} onOpenChange={(open) => !open && closeLineItemsModal()}>
          <DialogContent className="w-[80%] min-w-[80%] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detailed Line Items</DialogTitle>
              <DialogDescription>
                {selectedEmployeeName && (
                  <span className="mr-2 font-medium text-gray-700">{selectedEmployeeName}</span>
                )}
                {lineItemsData && lineItemsData.length > 0
                  ? `${lineItemsData.length} line items found`
                  : "No line items available."}
              </DialogDescription>
            </DialogHeader>
            {lineItemsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : lineItemsError ? (
              <div className="text-center text-red-500">Failed to load line items.</div>
            ) : lineItemsData && lineItemsData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Pay Head</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-right">Calculated</th>
                      <th className="px-3 py-2 text-right">YTD</th>
                      <th className="px-3 py-2 text-center">Overridden</th>
                      <th className="px-3 py-2 text-left">Reason</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lineItemsData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">
                          {item.pay_head_name}{" "}
                          <span className="text-gray-400">({item.pay_head_code})</span>
                        </td>
                        <td className="px-3 py-2 capitalize">
                          <Badge
                            variant="outline"
                            className={
                              item.type === "earning"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : item.type === "deduction"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }
                          >
                            {item.type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{formatPKR(Number(item.amount))}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-500">
                          {formatPKR(Number(item.calculated_amount))}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{formatPKR(Number(item.ytd_amount))}</td>
                        <td className="px-3 py-2 text-center">
                          {item.is_overridable ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">
                          {item.override_reason ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.is_overridable && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit Override"
                              onClick={() => openOverrideModal(item)}
                            >
                              <Pencil className="h-4 w-4 text-gray-500 hover:text-[#1E1B4B]" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">No line items found.</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Override Modal */}
        <Dialog open={overrideModalOpen} onOpenChange={(open) => !open && closeOverrideModal()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Override Line Item</DialogTitle>
              <DialogDescription>
                {selectedEmployeeName && (
                  <span className="block text-sm font-medium text-gray-700">{selectedEmployeeName}</span>
                )}
                Adjust the amount and provide a reason for the override.
              </DialogDescription>
            </DialogHeader>
            {editingLineItem && (
              <div className="space-y-4 py-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                  <span className="font-medium text-gray-900">{editingLineItem.pay_head_name}</span>{" "}
                  <span className="text-gray-500">({editingLineItem.pay_head_code})</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Calculated: {formatPKR(Number(editingLineItem.calculated_amount))}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="override-amount">New Amount *</Label>
                  <Input
                    id="override-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="override-reason">Override Reason *</Label>
                  <Input
                    id="override-reason"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g., Manual adjustment for incorrect calculation"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeOverrideModal} disabled={overrideMutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleOverrideSubmit}
                disabled={overrideMutation.isPending}
                className="bg-[#1E1B4B] hover:bg-[#2A2675] text-white"
              >
                {overrideMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Override"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hold Reason Modal */}
        <Dialog open={holdModalOpen} onOpenChange={(open) => !open && closeHoldModal()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Place Record on Hold</DialogTitle>
              <DialogDescription>
                Provide a reason for putting this employee's payroll on hold.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="hold-reason">Hold Reason *</Label>
                <Input
                  id="hold-reason"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="e.g., Pending verification of bank details"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeHoldModal} disabled={holdMutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleHoldSubmit}
                disabled={holdMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {holdMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Confirm Hold"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default Step5Approval;