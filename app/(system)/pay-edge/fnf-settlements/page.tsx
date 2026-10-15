// app/(system)/pay-edge/fnf-settlements/page.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Eye,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  FileText,
  Plus,
  Calculator,
  SlidersHorizontal,
  Send,
  AlertCircle,
  CalendarDays,
  CalendarCheck2,
  Wallet,
  Gift,
  Palmtree,
  ShieldAlert,
  Landmark,
  Receipt,
  Percent,
  Hash,
  StickyNote,
  CheckCircle2,
  Banknote,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SearchableSelect from "@/components/ui/searchable-select"; // project's own searchable select
import { useFnfSettlements, useExits, useFnfSettlement } from "@/hooks/useFnfSettlements";
import {
  createFnfSettlement,
  calculateFnfSettlement,
  updateFnfSettlementAdjustments,
  submitFnfSettlement,
  approveFnfSettlement,
  payFnfSettlement,
  getFnfSettlementStatement,
} from "@/services/fnf-settlements";
import type { FnfSettlement } from "@/types/fnf-settlement";

/* ----------------------------------------------------------------------- */
/* Statement types                                                          */
/* ----------------------------------------------------------------------- */

/**
 * Shape of GET /fnf-settlements/{id}/statement. This is a superset view of
 * a settlement (adds approved_at/paid_at) plus the itemised ledger that
 * backs the totals — only available once a settlement has been paid.
 */
type FnfLineItem = {
  id: string;
  category: "earning" | "deduction" | "statutory";
  item_type: string;
  description: string;
  amount: string;
  calculation_detail: string | null;
};

type FnfStatement = FnfSettlement & {
  approved_at?: string | null;
  paid_at?: string | null;
};

type FnfStatementResponse = {
  settlement: FnfStatement;
  line_items: FnfLineItem[];
  totals: { earnings: string; deductions: string; net: string };
};

/* ----------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ----------------------------------------------------------------------- */

/**
 * All money fields on FnfSettlement come back as strings from the API
 * (e.g. "126300.00"), so this is the single source of truth for turning
 * any of them into a PKR-formatted display string. `decimals` defaults
 * to 2 for the dense table view; the detail drawer passes 0 for cleaner
 * headline figures.
 */
function formatPKR(value: string | number | null | undefined, decimals = 2) {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/** Safe string|number -> number, defaulting to 0 so comparisons never lie. */
function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ----------------------------------------------------------------------- */
/* Adjustments form config                                                 */
/* ----------------------------------------------------------------------- */

/**
 * Mirrors the backend validator for POST /fnf-settlements/{id}/adjustments:
 * every amount is nullable|numeric|min:0, notes is nullable|string.
 */
type AdjustmentsFormState = {
  gratuity_amount: string;
  leave_encashment_amount: string;
  notice_period_recovery: string;
  pending_loan_balance: string;
  pending_advances: string;
  pending_expense_claims: string;
  bonus_proration: string;
  other_recoveries: string;
  other_earnings: string;
  final_eobi_employee: string;
  final_eobi_employer: string;
  final_tax_deduction: string;
  notes: string;
};

const EMPTY_ADJUSTMENTS_FORM: AdjustmentsFormState = {
  gratuity_amount: "",
  leave_encashment_amount: "",
  notice_period_recovery: "",
  pending_loan_balance: "",
  pending_advances: "",
  pending_expense_claims: "",
  bonus_proration: "",
  other_recoveries: "",
  other_earnings: "",
  final_eobi_employee: "",
  final_eobi_employer: "",
  final_tax_deduction: "",
  notes: "",
};

// [field key, label] — drives both the form layout and the payload build,
// so a new backend field only needs to be added in one place.
const ADJUSTMENT_AMOUNT_FIELDS: Array<[keyof Omit<AdjustmentsFormState, "notes">, string]> = [
  ["gratuity_amount", "Gratuity"],
  ["leave_encashment_amount", "Leave Encashment"],
  ["notice_period_recovery", "Notice Period Recovery"],
  ["pending_loan_balance", "Pending Loan Balance"],
  ["pending_advances", "Pending Advances"],
  ["pending_expense_claims", "Pending Expense Claims"],
  ["bonus_proration", "Bonus Proration"],
  ["other_recoveries", "Other Recoveries"],
  ["other_earnings", "Other Earnings"],
  ["final_eobi_employee", "Final EOBI (Employee)"],
  ["final_eobi_employer", "Final EOBI (Employer)"],
  ["final_tax_deduction", "Final Tax Deduction"],
];

/**
 * Converts form strings into the payload the API expects. Blank inputs are
 * left out entirely (rather than sent as 0) so "nullable" fields the user
 * didn't touch don't overwrite existing values with zero.
 */
function buildAdjustmentsPayload(form: AdjustmentsFormState) {
  const payload: Record<string, number | string> = {};
  for (const [key] of ADJUSTMENT_AMOUNT_FIELDS) {
    const raw = form[key].trim();
    if (raw === "") continue;
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) payload[key] = num;
  }
  if (form.notes.trim() !== "") payload.notes = form.notes.trim();
  return payload;
}

/** Pre-fills the adjustments form from an existing settlement's saved values. */
function settlementToAdjustmentsForm(settlement: FnfSettlement): AdjustmentsFormState {
  return {
    gratuity_amount: settlement.gratuity_amount ?? "",
    leave_encashment_amount: settlement.leave_encashment_amount ?? "",
    notice_period_recovery: settlement.notice_period_recovery ?? "",
    pending_loan_balance: settlement.pending_loan_balance ?? "",
    // These four aren't on the current FnfSettlement type — see note below
    // the component. Cast defensively so this compiles either way.
    pending_advances: (settlement as any).pending_advances ?? "",
    pending_expense_claims: settlement.pending_expense_claims ?? "",
    bonus_proration: (settlement as any).bonus_proration ?? "",
    other_recoveries: (settlement as any).other_recoveries ?? "",
    other_earnings: (settlement as any).other_earnings ?? "",
    final_eobi_employee: (settlement as any).final_eobi_employee ?? "",
    final_eobi_employer: (settlement as any).final_eobi_employer ?? "",
    final_tax_deduction: settlement.final_tax_deduction ?? "",
    notes: settlement.notes ?? "",
  };
}

// Once a settlement has been approved or paid out, recalculating it would
// silently change figures that have already been signed off / disbursed —
// so the Calculate action is hidden past that point.
const LOCKED_FOR_CALCULATION = ["approved", "paid"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    calculated: "bg-blue-50 text-blue-700 border-blue-200",
    pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paid: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    disputed: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize ${map[status] ?? "border-gray-200 bg-gray-50 text-gray-600"}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

/* ----------------------------------------------------------------------- */
/* Main Page Component                                                      */
/* ----------------------------------------------------------------------- */

export default function FnfSettlementsPage() {
  const queryClient = useQueryClient();

  // ── Table state ──────────────────────────────────
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewSettlement, setViewSettlement] = useState<FnfSettlement | null>(null);
  const [calculatingId, setCalculatingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  // ── Statement modal state (paid settlements only) ─
  const [viewStatementSettlement, setViewStatementSettlement] = useState<FnfSettlement | null>(null);

  // ── Pay dialog state ─────────────────────────────
  const [payTarget, setPayTarget] = useState<FnfSettlement | null>(null);
  const [payForm, setPayForm] = useState({ payment_reference: "" });

  // ── Adjustments dialog state ─────────────────────
  const [adjustTarget, setAdjustTarget] = useState<FnfSettlement | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustmentsFormState>(EMPTY_ADJUSTMENTS_FORM);

  // ── Create form state ───────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    separation_id: "",
    last_working_date: "",
    settlement_date: "",
    notes: "",
  });

  // ── Exits for employee dropdown ─────────────────
  const { data: exitsData, isLoading: isLoadingExits } = useExits({ per_page: 100 });
  const exitItems = exitsData?.data?.items ?? [];

  const employeeOptions = useMemo(() => {
    return exitItems.map((exit) => ({
      value: exit.employee.id,
      label: `${exit.employee.name} (${exit.employee.employee_code})`,
    }));
  }, [exitItems]);

  // ── Fetch settlements list ──────────────────────
  const { data, isLoading, isFetching } = useFnfSettlements({
    page,
    per_page: perPage,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const settlements: FnfSettlement[] = data?.data ?? [];
  const totalEntries = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.last_page ?? 1;

  // ── Create mutation ────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => createFnfSettlement(payload),
    onSuccess: () => {
      toast.success("Settlement created.");
      queryClient.invalidateQueries({ queryKey: ["fnf-settlements"] });
      setIsCreateOpen(false);
      setForm({ employee_id: "", separation_id: "", last_working_date: "", settlement_date: "", notes: "" });
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Could not create settlement." });
    },
  });

  const handleCreate = () => {
    if (!form.employee_id || !form.separation_id || !form.last_working_date || !form.settlement_date) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createMutation.mutate(form);
  };

  // ── Calculate mutation ─────────────────────────
  const calculateMutation = useMutation({
    mutationFn: (id: string) => calculateFnfSettlement(id),
    onMutate: (id: string) => setCalculatingId(id),
    onSuccess: (response) => {
      toast.success(response?.message ?? "F&F calculated.");
      queryClient.invalidateQueries({ queryKey: ["fnf-settlements"] });
      // Keep the detail drawer in sync if it's open for the settlement
      // that was just recalculated, without waiting for a refetch.
      if (response?.data && viewSettlement?.id === response.data.id) {
        setViewSettlement(response.data);
        queryClient.invalidateQueries({ queryKey: ["fnf-settlement", response.data.id] });
      }
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Could not calculate settlement." });
    },
    onSettled: () => setCalculatingId(null),
  });

  const handleCalculate = (settlement: FnfSettlement) => {
    calculateMutation.mutate(settlement.id);
  };

  // ── Submit mutation ─────────────────────────────
  const submitMutation = useMutation({
    mutationFn: (id: string) => submitFnfSettlement(id),
    onMutate: (id: string) => setSubmittingId(id),
    onSuccess: (response) => {
      toast.success(response?.message ?? "Settlement submitted.");
      queryClient.invalidateQueries({ queryKey: ["fnf-settlements"] });
      if (response?.data && viewSettlement?.id === response.data.id) {
        setViewSettlement(response.data);
        queryClient.invalidateQueries({ queryKey: ["fnf-settlement", response.data.id] });
      }
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Could not submit settlement." });
    },
    onSettled: () => setSubmittingId(null),
  });

  const handleSubmit = (settlement: FnfSettlement) => {
    submitMutation.mutate(settlement.id);
  };

  // ── Approve mutation ────────────────────────────
  // POST /fnf-settlements/{id}/approve — only offered while status is
  // "pending_approval"; moves the settlement to "approved".
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveFnfSettlement(id),
    onMutate: (id: string) => setApprovingId(id),
    onSuccess: (response) => {
      toast.success(response?.message ?? "Settlement approved.");
      queryClient.invalidateQueries({ queryKey: ["fnf-settlements"] });
      if (response?.data && viewSettlement?.id === response.data.id) {
        setViewSettlement(response.data);
        queryClient.invalidateQueries({ queryKey: ["fnf-settlement", response.data.id] });
      }
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Could not approve settlement." });
    },
    onSettled: () => setApprovingId(null),
  });

  const handleApprove = (settlement: FnfSettlement) => {
    approveMutation.mutate(settlement.id);
  };

  // ── Pay mutation ─────────────────────────────────
  // POST /fnf-settlements/{id}/pay — only offered while status is
  // "approved"; moves the settlement to "paid". Takes a payment_reference
  // string in the body, collected via the Pay modal below.
  const payMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { payment_reference: string } }) =>
      payFnfSettlement(id, payload),
    onMutate: ({ id }) => setPayingId(id),
    onSuccess: (response) => {
      toast.success(response?.message ?? "Settlement marked as paid.");
      queryClient.invalidateQueries({ queryKey: ["fnf-settlements"] });
      if (response?.data && viewSettlement?.id === response.data.id) {
        setViewSettlement(response.data);
        queryClient.invalidateQueries({ queryKey: ["fnf-settlement", response.data.id] });
      }
      setPayTarget(null);
      setPayForm({ payment_reference: "" });
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Could not mark settlement as paid." });
    },
    onSettled: () => setPayingId(null),
  });

  const openPay = (settlement: FnfSettlement) => {
    setPayTarget(settlement);
    setPayForm({ payment_reference: settlement.payment_reference ?? "" });
  };

  const handleSavePay = () => {
    if (!payTarget) return;
    if (!payForm.payment_reference.trim()) {
      toast.error("Please enter a payment reference.");
      return;
    }
    payMutation.mutate({
      id: payTarget.id,
      payload: { payment_reference: payForm.payment_reference.trim() },
    });
  };

  // ── Adjustments mutation ────────────────────────
  const adjustMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildAdjustmentsPayload>) =>
      updateFnfSettlementAdjustments(adjustTarget!.id, payload),
    onSuccess: (response) => {
      toast.success(response?.message ?? "Adjustments saved.");
      queryClient.invalidateQueries({ queryKey: ["fnf-settlements"] });
      if (response?.data && viewSettlement?.id === response.data.id) {
        setViewSettlement(response.data);
        queryClient.invalidateQueries({ queryKey: ["fnf-settlement", response.data.id] });
      }
      setAdjustTarget(null);
      setAdjustForm(EMPTY_ADJUSTMENTS_FORM);
    },
    onError: (error: any) => {
      showApiError(error, { fallbackMessage: error?.response?.data?.message ?? "Could not save adjustments." });
    },
  });

  const openAdjustments = (settlement: FnfSettlement) => {
    setAdjustTarget(settlement);
    setAdjustForm(settlementToAdjustmentsForm(settlement));
  };

  const handleSaveAdjustments = () => {
    if (!adjustTarget) return;
    adjustMutation.mutate(buildAdjustmentsPayload(adjustForm));
  };

  const openStatement = (settlement: FnfSettlement) => {
    setViewStatementSettlement(settlement);
  };

  const showingFrom = totalEntries > 0 ? (page - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Full & Final Settlements
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} settlements · Manage final settlements
              </p>
            </div>
            <Button
              className="bg-[#1E1B4B] hover:bg-[#2A2675] gap-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" /> New Settlement
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employee name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 border-gray-300">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="calculated">Calculated</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select value={perPage.toString()} onValueChange={v => setPerPage(Number(v))}>
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-600">Showing</span>
              <span className="font-semibold mx-1">{showingFrom}</span>
              <span className="text-gray-600">to</span>
              <span className="font-semibold mx-1">{showingTo}</span>
              <span className="text-gray-600">of</span>
              <span className="font-semibold mx-1">{totalEntries}</span>
              <span className="text-gray-600">entries</span>
            </div>
            {(isLoading || isFetching) && (
              <Badge className="ml-2">
                <Loader2 className="h-3 w-3 animate-spin" />
              </Badge>
            )}
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sr</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Working Date</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Earnings</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Deductions</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Settlement</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading && !settlements.length ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading settlements...</p>
                      </td>
                    </tr>
                  ) : settlements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <FileText className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                        No settlements found.
                      </td>
                    </tr>
                  ) : (
                    settlements.map((settlement, idx) => (
                      <tr key={settlement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-gray-700">{(page - 1) * perPage + idx + 1}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{settlement.employee_name}</span>
                            <span className="text-xs text-gray-500">{settlement.employee_id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-700">{settlement.last_working_date}</td>
                        <td className="py-4 px-6 text-right font-mono tabular-nums text-gray-900">{formatPKR(settlement.total_earnings)}</td>
                        <td className="py-4 px-6 text-right font-mono tabular-nums text-gray-500">{formatPKR(settlement.total_deductions)}</td>
                        <td className="py-4 px-6 text-right font-mono font-semibold tabular-nums text-gray-900">{formatPKR(settlement.net_settlement)}</td>
                        <td className="py-4 px-6"><StatusBadge status={settlement.status} /></td>
                        <td className="py-4 px-6 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Paid settlements open the full statement instead of the
                                  lightweight detail drawer used for everything else. */}
                              {settlement.status === "paid" ? (
                                <DropdownMenuItem onClick={() => openStatement(settlement)}>
                                  <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> View Statement
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setViewSettlement(settlement)}>
                                  <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                                </DropdownMenuItem>
                              )}

                              {['draft', 'disputed'].includes(settlement.status) && (
                                <DropdownMenuItem
                                  onClick={() => handleCalculate(settlement)}
                                  disabled={
                                    LOCKED_FOR_CALCULATION.includes(settlement.status) ||
                                    calculatingId === settlement.id
                                  }
                                >
                                  {calculatingId === settlement.id ? (
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Calculator className="mr-2 h-3.5 w-3.5" />
                                  )}
                                  Calculate
                                </DropdownMenuItem>
                              )}

                              {/* Adjustments only make sense before the settlement has
                                  been calculated/submitted for approval. */}
                              {settlement.status === "draft" && (
                                <DropdownMenuItem onClick={() => openAdjustments(settlement)}>
                                  <SlidersHorizontal className="mr-2 h-3.5 w-3.5" /> Adjustments
                                </DropdownMenuItem>
                              )}

                              {settlement.status === "calculated" && (
                                <DropdownMenuItem
                                  onClick={() => handleSubmit(settlement)}
                                  disabled={submittingId === settlement.id}
                                >
                                  {submittingId === settlement.id ? (
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Send className="mr-2 h-3.5 w-3.5" />
                                  )}
                                  Submit
                                </DropdownMenuItem>
                              )}

                              {/* Approve — only while awaiting approval. */}
                              {settlement.status === "pending_approval" && (
                                <DropdownMenuItem
                                  onClick={() => handleApprove(settlement)}
                                  disabled={approvingId === settlement.id}
                                >
                                  {approvingId === settlement.id ? (
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                  )}
                                  Approve
                                </DropdownMenuItem>
                              )}

                              {/* Pay — only once approved. Opens a modal to collect
                                  the payment reference before hitting the API. */}
                              {settlement.status === "approved" && (
                                <DropdownMenuItem
                                  onClick={() => openPay(settlement)}
                                  disabled={payingId === settlement.id}
                                >
                                  {payingId === settlement.id ? (
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Banknote className="mr-2 h-3.5 w-3.5" />
                                  )}
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && totalEntries > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="border-gray-300">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="border-gray-300">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = page - 2 + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={page === pageNum ? "bg-[#1E1B4B] hover:bg-[#2A2675]" : "border-gray-300 hover:bg-gray-100"}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="border-gray-300">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="border-gray-300">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{showingFrom}</span> – <span className="font-semibold">{showingTo}</span> of{" "}
                    <span className="font-semibold">{totalEntries}</span> entries
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Settlement Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Full & Final Settlement</DialogTitle>
            <DialogDescription>
              Select an employee from the active exits to initiate a settlement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Employee - searchable select */}
            <div className="space-y-1.5">
              <Label>Employee *</Label>
              <SearchableSelect
                options={employeeOptions}
                value={form.employee_id}
                onChange={(val) => {
                  const exit = exitItems.find(e => e.employee.id === val);
                  setForm({
                    ...form,
                    employee_id: val,
                    separation_id: exit?.id ?? "",
                    last_working_date: exit?.last_working_date ?? "",
                  });
                }}
                placeholder="Select employee from exits"
                searchPlaceholder="Search employee name or code..."
                emptyText="No employees found"
                groupLabel="Exits"
                allowAll={false}
                disabled={isLoadingExits}
                widthClass="w-full"
              />
              {form.separation_id && (
                <p className="text-xs text-gray-400 mt-1">
                  Separation ID: {form.separation_id}
                </p>
              )}
            </div>

            {/* Last Working Date – disabled and auto‑filled */}
            <div className="space-y-1.5">
              <Label htmlFor="lwd">Last Working Date *</Label>
              <Input
                id="lwd"
                type="date"
                value={form.last_working_date}
                disabled
                className="disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Settlement Date */}
            <div className="space-y-1.5">
              <Label htmlFor="sd">Settlement Date *</Label>
              <Input
                id="sd"
                type="date"
                value={form.settlement_date}
                onChange={(e) => setForm({ ...form, settlement_date: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675] text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Settlement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal (draft / calculated / pending_approval / approved) */}
      <Dialog open={!!viewSettlement} onOpenChange={() => setViewSettlement(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Full & Final Settlement Details</DialogTitle>
            <DialogDescription>
              {viewSettlement?.employee_name} – {viewSettlement?.status}
            </DialogDescription>
          </DialogHeader>

          {/* Fetch detail when modal opens */}
          {viewSettlement && (
            <FnfSettlementDetail settlementId={viewSettlement.id} />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSettlement(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Statement Modal (paid settlements only) */}
      <Dialog open={!!viewStatementSettlement} onOpenChange={() => setViewStatementSettlement(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>F&F Statement</DialogTitle>
            <DialogDescription>
              {viewStatementSettlement?.employee_name} – paid
            </DialogDescription>
          </DialogHeader>

          {viewStatementSettlement && (
            <FnfStatementDetail settlementId={viewStatementSettlement.id} />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStatementSettlement(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Modal — collects payment_reference for POST /pay */}
      <Dialog
        open={!!payTarget}
        onOpenChange={(open) => {
          if (!open) {
            setPayTarget(null);
            setPayForm({ payment_reference: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Settlement as Paid</DialogTitle>
            <DialogDescription>
              {payTarget?.employee_name} – enter the payment reference for this disbursement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="payment_reference">Payment Reference *</Label>
            <Input
              id="payment_reference"
              value={payForm.payment_reference}
              onChange={(e) => setPayForm({ payment_reference: e.target.value })}
              placeholder="e.g. CHQ-2025-001"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPayTarget(null);
                setPayForm({ payment_reference: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePay}
              disabled={payMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675] text-white"
            >
              {payMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Mark as Paid"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustments Modal */}
      <Dialog
        open={!!adjustTarget}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustTarget(null);
            setAdjustForm(EMPTY_ADJUSTMENTS_FORM);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Settlement Adjustments</DialogTitle>
            <DialogDescription>
              {adjustTarget?.employee_name} – override amounts before recalculating. Leave a
              field blank to keep its current value.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {ADJUSTMENT_AMOUNT_FIELDS.map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={adjustForm[key]}
                  onChange={(e) => setAdjustForm({ ...adjustForm, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="adjust-notes">Notes (optional)</Label>
              <Input
                id="adjust-notes"
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                placeholder="Reason for these adjustments..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdjustTarget(null);
                setAdjustForm(EMPTY_ADJUSTMENTS_FORM);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdjustments}
              disabled={adjustMutation.isPending}
              className="bg-[#1E1B4B] hover:bg-[#2A2675] text-white"
            >
              {adjustMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Adjustments"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settlement detail — grouped earnings / deductions / net summary     */
/* ------------------------------------------------------------------ */

function FnfSettlementDetail({ settlementId }: { settlementId: string }) {
  const { data: detail, isLoading, isError } = useFnfSettlement(settlementId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <AlertCircle className="h-5 w-5 text-rose-500" strokeWidth={1.75} />
        <p className="text-sm text-slate-500">
          Couldn&apos;t load this settlement. Refresh to try again.
        </p>
      </div>
    );
  }

  const abs = (n: string | number) => formatPKR(Math.abs(toNumber(n)), 0);

  return (
    <div className="mx-auto w-full space-y-4 py-4">
      {/* Dates strip */}
      <div className="flex items-center rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
          <CalendarDays className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wide text-slate-400">
              Last working day
            </div>
            <div className="text-[13px] font-semibold text-slate-700">
              {detail.last_working_date}
            </div>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
          <CalendarCheck2 className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wide text-slate-400">
              Settlement date
            </div>
            <div className="text-[13px] font-semibold text-slate-700">
              {detail.settlement_date}
            </div>
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
        <div className="pl-4 pr-4 pt-3.5 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Earnings
              </h3>
            </div>
            <span className="text-[13px] font-bold tabular-nums text-emerald-700">
              {formatPKR(detail.total_earnings, 0)}
            </span>
          </div>
          <div className="mt-1 divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Wallet className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span className="text-[13px] text-slate-500 truncate">Pro-rata salary</span>
              </div>
              <span className="text-[13.5px] font-semibold tabular-nums text-emerald-700 shrink-0">
                {formatPKR(detail.pro_rata_salary, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Gift className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span className="text-[13px] text-slate-500 truncate">Gratuity</span>
              </div>
              <span className="text-[13.5px] font-semibold tabular-nums text-emerald-700 shrink-0">
                {formatPKR(detail.gratuity_amount, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Palmtree className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span className="text-[13px] text-slate-500 truncate">Leave encashment</span>
              </div>
              <span className="text-[13.5px] font-semibold tabular-nums text-emerald-700 shrink-0">
                {formatPKR(detail.leave_encashment_amount, 0)}
              </span>
            </div>
            {toNumber(detail.pending_expense_claims) > 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Receipt className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Pending expense claims</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-emerald-700 shrink-0">
                  {formatPKR(detail.pending_expense_claims, 0)}
                </span>
              </div>
            )}
            {toNumber((detail as any).bonus_proration) > 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Gift className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Bonus proration</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-emerald-700 shrink-0">
                  {formatPKR((detail as any).bonus_proration, 0)}
                </span>
              </div>
            )}
            {toNumber((detail as any).other_earnings) > 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Wallet className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Other earnings</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-emerald-700 shrink-0">
                  {formatPKR((detail as any).other_earnings, 0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-rose-500" />
        <div className="pl-4 pr-4 pt-3.5 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Deductions
              </h3>
            </div>
            <span className="text-[13px] font-bold tabular-nums text-rose-700">
              − {abs(detail.total_deductions)}
            </span>
          </div>
          <div className="mt-1 divide-y divide-slate-100">
            {toNumber(detail.notice_period_recovery) !== 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Notice period recovery</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-rose-700 shrink-0">
                  − {abs(detail.notice_period_recovery)}
                </span>
              </div>
            )}
            {toNumber(detail.pending_loan_balance) !== 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Landmark className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Pending loan balance</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-rose-700 shrink-0">
                  − {abs(detail.pending_loan_balance)}
                </span>
              </div>
            )}
            {toNumber((detail as any).pending_advances) !== 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Landmark className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Pending advances</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-rose-700 shrink-0">
                  − {abs((detail as any).pending_advances)}
                </span>
              </div>
            )}
            {toNumber((detail as any).other_recoveries) !== 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Other recoveries</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-rose-700 shrink-0">
                  − {abs((detail as any).other_recoveries)}
                </span>
              </div>
            )}
            {toNumber((detail as any).final_eobi_employee) !== 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Landmark className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Final EOBI (Employee)</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-rose-700 shrink-0">
                  − {abs((detail as any).final_eobi_employee)}
                </span>
              </div>
            )}
            {toNumber((detail as any).final_eobi_employer) !== 0 && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Landmark className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] text-slate-500 truncate">Final EOBI (Employer)</span>
                </div>
                <span className="text-[13.5px] font-semibold tabular-nums text-rose-700 shrink-0">
                  − {abs((detail as any).final_eobi_employer)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Percent className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                <span className="text-[13px] text-slate-500 truncate">Final tax deduction</span>
              </div>
              <span className="text-[13.5px] font-semibold tabular-nums text-rose-700 shrink-0">
                − {abs(detail.final_tax_deduction)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Net settlement — receipt tear treatment */}
      <div className="relative rounded-xl bg-slate-900 px-5 pb-5 pt-4 text-white">
        <div
          className="absolute inset-x-5 top-0 border-t border-dashed border-white/25"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Net settlement
          </span>
          <span className="text-2xl font-bold tabular-nums tracking-tight">
            {formatPKR(detail.net_settlement, 0)}
          </span>
        </div>
      </div>

      {/* Meta */}
      {(detail.payment_reference || detail.notes) && (
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
          {detail.payment_reference && (
            <div className="flex items-center gap-2.5">
              <Hash className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
              <span className="text-[13px] text-slate-500">Payment reference</span>
              <span className="ml-auto text-[13px] font-mono font-medium text-slate-700">
                {detail.payment_reference}
              </span>
            </div>
          )}
          {detail.notes && (
            <div className="flex gap-2.5 border-t border-slate-100 pt-2.5">
              <StickyNote className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-[13px] leading-relaxed text-slate-600">{detail.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Statement detail — full itemised ledger for a paid settlement       */
/* GET /fnf-settlements/{id}/statement                                 */
/* ------------------------------------------------------------------ */

const LINE_ITEM_STYLES: Record<FnfLineItem["category"], { icon: typeof Wallet; accent: string; text: string; sign: "+" | "−" }> = {
  earning: { icon: Wallet, accent: "bg-emerald-500", text: "text-emerald-700", sign: "+" },
  deduction: { icon: ShieldAlert, accent: "bg-rose-500", text: "text-rose-700", sign: "−" },
  statutory: { icon: Landmark, accent: "bg-amber-500", text: "text-amber-700", sign: "−" },
};

const CATEGORY_LABELS: Record<FnfLineItem["category"], string> = {
  earning: "Earnings",
  deduction: "Deductions",
  statutory: "Statutory",
};

/**
 * Different service layers unwrap the axios/API envelope at different
 * depths — some return { success, message, data }, some already return
 * just the inner data, and some return the raw axios response. Rather
 * than assume one shape (and silently render nothing if we guess wrong),
 * walk down until we find the object that actually has `settlement`.
 */
function extractStatementPayload(response: any): FnfStatementResponse | null {
  if (!response) return null;
  if (response.settlement) return response as FnfStatementResponse;
  if (response.data?.settlement) return response.data as FnfStatementResponse;
  if (response.data?.data?.settlement) return response.data.data as FnfStatementResponse;
  return null;
}

function FnfStatementDetail({ settlementId }: { settlementId: string }) {
  const { data, isLoading, isError } = useQuery<FnfStatementResponse | null>({
    queryKey: ["fnf-settlement-statement", settlementId],
    enabled: !!settlementId,
    queryFn: async () => {
      const response = await getFnfSettlementStatement(settlementId);
      const payload = extractStatementPayload(response);
      if (!payload) {
        // Surfaces in isError below instead of quietly rendering an empty modal.
        console.error("Unexpected statement response shape:", response);
        throw new Error("Unexpected statement response shape");
      }
      return payload;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <AlertCircle className="h-5 w-5 text-rose-500" strokeWidth={1.75} />
        <p className="text-sm text-slate-500">
          Couldn&apos;t load this statement. Refresh to try again.
        </p>
      </div>
    );
  }

  const { settlement, line_items: lineItems, totals } = data;
  const grouped: Record<FnfLineItem["category"], FnfLineItem[]> = {
    earning: lineItems.filter((li) => li.category === "earning"),
    deduction: lineItems.filter((li) => li.category === "deduction"),
    statutory: lineItems.filter((li) => li.category === "statutory"),
  };

  return (
    <div className="mx-auto w-full space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Dates strip */}
      <div className="flex items-center rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
          <CalendarDays className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wide text-slate-400">
              Last working day
            </div>
            <div className="text-[13px] font-semibold text-slate-700">
              {settlement.last_working_date}
            </div>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
          <CalendarCheck2 className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wide text-slate-400">
              Settlement date
            </div>
            <div className="text-[13px] font-semibold text-slate-700">
              {settlement.settlement_date}
            </div>
          </div>
        </div>
      </div>

      {/* Line items grouped by category */}
      {(["earning", "deduction", "statutory"] as const).map((category) => {
        const items = grouped[category];
        if (!items.length) return null;
        const style = LINE_ITEM_STYLES[category];
        const Icon = style.icon;
        const categoryTotal = items.reduce((sum, li) => sum + toNumber(li.amount), 0);
        return (
          <div key={category} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className={`absolute left-0 top-0 h-full w-1 ${style.accent}`} />
            <div className="pl-4 pr-4 pt-3.5 pb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {CATEGORY_LABELS[category]}
                  </h3>
                </div>
                <span className={`text-[13px] font-bold tabular-nums ${style.text}`}>
                  {style.sign} {formatPKR(categoryTotal, 0)}
                </span>
              </div>
              <div className="mt-1 divide-y divide-slate-100">
                {items.map((li) => (
                  <div key={li.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-[13px] text-slate-500 truncate">{li.description}</span>
                    <span className={`text-[13.5px] font-semibold tabular-nums shrink-0 ${style.text}`}>
                      {style.sign} {formatPKR(li.amount, 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Net settlement — receipt tear treatment */}
      <div className="relative rounded-xl bg-slate-900 px-5 pb-5 pt-4 text-white">
        <div className="absolute inset-x-5 top-0 border-t border-dashed border-white/25" aria-hidden="true" />
        <div className="flex items-center justify-between pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Net settlement
          </span>
          <span className="text-2xl font-bold tabular-nums tracking-tight">
            {formatPKR(totals.net, 0)}
          </span>
        </div>
      </div>

      {/* Timeline + meta */}
      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
          <span className="text-[13px] text-slate-500">Approved at</span>
          <span className="ml-auto text-[13px] font-medium text-slate-700">
            {formatDateTime(settlement.approved_at)}
          </span>
        </div>
        <div className="flex items-center gap-2.5 border-t border-slate-100 pt-2.5">
          <Banknote className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
          <span className="text-[13px] text-slate-500">Paid at</span>
          <span className="ml-auto text-[13px] font-medium text-slate-700">
            {formatDateTime(settlement.paid_at)}
          </span>
        </div>
        {settlement.payment_reference && (
          <div className="flex items-center gap-2.5 border-t border-slate-100 pt-2.5">
            <Hash className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />
            <span className="text-[13px] text-slate-500">Payment reference</span>
            <span className="ml-auto text-[13px] font-mono font-medium text-slate-700">
              {settlement.payment_reference}
            </span>
          </div>
        )}
        {settlement.notes && (
          <div className="flex gap-2.5 border-t border-slate-100 pt-2.5">
            <StickyNote className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-[13px] leading-relaxed text-slate-600">{settlement.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}