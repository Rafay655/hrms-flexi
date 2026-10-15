"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  Search,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Calendar,
  Clock3,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Briefcase,
  Download,
  Building2,
} from "lucide-react";
/* -------------------------------------------------------------------------- */ /* Types */ /* -------------------------------------------------------------------------- */ type AdvanceTab =
  "overview" | "history" | "request";
type AdvanceStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Disbursed"
  | "Recovered";
type SalaryAdvanceRecord = {
  id: number;
  requestNo: string;
  requestedOn: string;
  amountRequested: number;
  amountApproved: number;
  recoveryMonths: number;
  monthlyDeduction: number;
  recoveredMonths: number;
  outstandingAmount: number;
  firstDeductionDate: string | null;
  expectedEndDate: string | null;
  status: AdvanceStatus;
  reason: string;
  approvedBy: string;
  remarks: string;
};
type RequestForm = {
  amount: string;
  recoveryMonths: string;
  firstDeductionDate: string;
  reason: string;
  remarks: string;
};
/* -------------------------------------------------------------------------- */ /* Constants */ /* -------------------------------------------------------------------------- */ const DEFAULT_PER_PAGE = 10;
const EMPLOYEE = {
  id: "EMP001",
  name: "Muqadas Mazhar",
  designation: "Sr. Software Engineer",
  department: "Engineering",
  joiningDate: "2022-01-15",
};
const ADVANCE_ROWS: SalaryAdvanceRecord[] = [
  {
    id: 1,
    requestNo: "SA-0001",
    requestedOn: "2025-06-10",
    amountRequested: 120000,
    amountApproved: 120000,
    recoveryMonths: 6,
    monthlyDeduction: 20000,
    recoveredMonths: 2,
    outstandingAmount: 80000,
    firstDeductionDate: "2025-07-01",
    expectedEndDate: "2025-12-01",
    status: "Disbursed",
    reason: "Family support and urgent home expenses",
    approvedBy: "HR Manager",
    remarks: "Disbursed with payroll recovery",
  },
  {
    id: 2,
    requestNo: "SA-0002",
    requestedOn: "2025-04-18",
    amountRequested: 90000,
    amountApproved: 90000,
    recoveryMonths: 3,
    monthlyDeduction: 30000,
    recoveredMonths: 3,
    outstandingAmount: 0,
    firstDeductionDate: "2025-05-01",
    expectedEndDate: "2025-07-01",
    status: "Recovered",
    reason: "Medical emergency",
    approvedBy: "Finance Lead",
    remarks: "Fully recovered through payroll",
  },
  {
    id: 3,
    requestNo: "SA-0003",
    requestedOn: "2025-07-02",
    amountRequested: 150000,
    amountApproved: 100000,
    recoveryMonths: 5,
    monthlyDeduction: 20000,
    recoveredMonths: 0,
    outstandingAmount: 100000,
    firstDeductionDate: "2025-08-01",
    expectedEndDate: "2025-12-01",
    status: "Approved",
    reason: "House rent and relocation cost",
    approvedBy: "Department Head",
    remarks: "Approved partially as per policy",
  },
  {
    id: 4,
    requestNo: "SA-0004",
    requestedOn: "2025-07-12",
    amountRequested: 70000,
    amountApproved: 0,
    recoveryMonths: 4,
    monthlyDeduction: 0,
    recoveredMonths: 0,
    outstandingAmount: 0,
    firstDeductionDate: null,
    expectedEndDate: null,
    status: "Pending",
    reason: "School fee payment",
    approvedBy: "Pending",
    remarks: "Awaiting approval workflow",
  },
  {
    id: 5,
    requestNo: "SA-0005",
    requestedOn: "2025-03-03",
    amountRequested: 85000,
    amountApproved: 0,
    recoveryMonths: 4,
    monthlyDeduction: 0,
    recoveredMonths: 0,
    outstandingAmount: 0,
    firstDeductionDate: null,
    expectedEndDate: null,
    status: "Rejected",
    reason: "Personal electronics purchase",
    approvedBy: "Finance Committee",
    remarks: "Rejected due to policy restrictions",
  },
];
const statusClasses: Record<AdvanceStatus, string> = {
  Pending:
    "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
  Approved: "bg-brand-600 text-white border-transparent hover:bg-brand-600",
  Rejected: "bg-brand-900 text-white border-transparent hover:bg-brand-900",
  Disbursed: "bg-brand-700 text-white border-transparent hover:bg-brand-700",
  Recovered:
    "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
};
const STATUS_OPTIONS: Array<"all" | AdvanceStatus> = [
  "all",
  "Pending",
  "Approved",
  "Rejected",
  "Disbursed",
  "Recovered",
];
/* -------------------------------------------------------------------------- */ /* Helpers */ /* -------------------------------------------------------------------------- */ const fmt =
  (n: number) =>
    n >= 10000000
      ? `PKR ${(n / 10000000).toFixed(2)}Cr`
      : n >= 100000
        ? `PKR ${(n / 100000).toFixed(1)}L`
        : `PKR ${n.toLocaleString()}`;
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border border-gray-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-700">
              {title}
            </p>
            <p className="text-2xl font-bold text-brand-900 mt-1">{value}</p>
            <p className="text-xs text-brand-700 mt-1">{subtitle}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Icon className="h-4 w-4 text-brand-800" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="text-brand-700">{label}</span>
      <span className="font-medium text-brand-900 text-right">{value}</span>
    </div>
  );
}
/* -------------------------------------------------------------------------- */ /* Component */ /* -------------------------------------------------------------------------- */ export default function SalaryAdvanceRequestModule() {
  const [activeTab, setActiveTab] = useState<AdvanceTab>("overview");
  const [rowsData, setRowsData] = useState<SalaryAdvanceRecord[]>(ADVANCE_ROWS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdvanceStatus>(
    "all",
  );
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedRow, setSelectedRow] = useState<SalaryAdvanceRecord | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [form, setForm] = useState<RequestForm>({
    amount: "",
    recoveryMonths: "3",
    firstDeductionDate: "",
    reason: "",
    remarks: "",
  });
  const q = useDebounced(search, 400);
  useEffect(() => {
    if (activeTab !== "history") return;
    setIsFetching(true);
    const t = setTimeout(() => setIsFetching(false), 300);
    return () => clearTimeout(t);
  }, [activeTab, q, statusFilter, perPage, page]);
  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, perPage]);
  const activeAdvances = useMemo(
    () =>
      rowsData.filter(
        (row) => row.status === "Approved" || row.status === "Disbursed",
      ),
    [rowsData],
  );
  const pendingRequests = useMemo(
    () => rowsData.filter((row) => row.status === "Pending"),
    [rowsData],
  );
  const currentOutstanding = useMemo(
    () =>
      rowsData
        .filter(
          (row) => row.status === "Approved" || row.status === "Disbursed",
        )
        .reduce((sum, row) => sum + row.outstandingAmount, 0),
    [rowsData],
  );
  const monthlyDeductionTotal = useMemo(
    () =>
      rowsData
        .filter((row) => row.status === "Disbursed")
        .reduce((sum, row) => sum + row.monthlyDeduction, 0),
    [rowsData],
  );
  const latestRow = rowsData[0];
  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rowsData.filter((row) => {
      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;
      const haystack =
        `${row.requestNo} ${row.status} ${row.reason} ${row.remarks} ${row.approvedBy}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [rowsData, q, statusFilter]);
  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;
  const rows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRows
      .slice(start, start + perPage)
      .map((item, index) => ({ sr: start + index + 1, ...item }));
  }, [filteredRows, currentPage, perPage]);
  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.requested += row.amountRequested;
        acc.approved += row.amountApproved;
        acc.outstanding += row.outstandingAmount;
        if (row.status === "Pending") acc.pending += 1;
        if (row.status === "Approved") acc.approvedCount += 1;
        if (row.status === "Rejected") acc.rejected += 1;
        if (row.status === "Disbursed") acc.disbursed += 1;
        if (row.status === "Recovered") acc.recovered += 1;
        return acc;
      },
      {
        requested: 0,
        approved: 0,
        outstanding: 0,
        pending: 0,
        approvedCount: 0,
        rejected: 0,
        disbursed: 0,
        recovered: 0,
      },
    );
  }, [filteredRows]);
  const estimatedInstallment = useMemo(() => {
    const amount = Number(form.amount || 0);
    const months = Number(form.recoveryMonths || 1);
    if (!amount || !months) return 0;
    return Math.round(amount / months);
  }, [form.amount, form.recoveryMonths]);
  const openRow = (row: SalaryAdvanceRecord) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };
  const resetForm = () => {
    setForm({
      amount: "",
      recoveryMonths: "3",
      firstDeductionDate: "",
      reason: "",
      remarks: "",
    });
  };
  const handleSubmit = () => {
    setFormMessage(null);
    const amount = Number(form.amount);
    const recoveryMonths = Number(form.recoveryMonths);
    if (
      !amount ||
      !recoveryMonths ||
      !form.firstDeductionDate ||
      !form.reason.trim()
    ) {
      setFormMessage(
        "Please fill all required fields before submitting the request.",
      );
      return;
    }
    const newId = rowsData.length
      ? Math.max(...rowsData.map((r) => r.id)) + 1
      : 1;
    const newRecord: SalaryAdvanceRecord = {
      id: newId,
      requestNo: `SA-${String(newId).padStart(4, "0")}`,
      requestedOn: new Date().toISOString().slice(0, 10),
      amountRequested: amount,
      amountApproved: 0,
      recoveryMonths,
      monthlyDeduction: 0,
      recoveredMonths: 0,
      outstandingAmount: 0,
      firstDeductionDate: form.firstDeductionDate,
      expectedEndDate: null,
      status: "Pending",
      reason: form.reason.trim(),
      approvedBy: "Pending",
      remarks: form.remarks.trim() || "Awaiting approval workflow",
    };
    setRowsData((prev) => [newRecord, ...prev]);
    setFormMessage(
      `Salary advance request ${newRecord.requestNo} submitted successfully.`,
    );
    resetForm();
    setActiveTab("history");
  };
  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 shrink-0">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Salary Advance Request
                </CardTitle>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge className="bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100">
                    <User className="h-3 w-3 mr-1" /> {EMPLOYEE.id}
                  </Badge>
                  <span className="text-sm text-brand-700">
                    {EMPLOYEE.name} · {EMPLOYEE.designation}
                  </span>
                  <span className="text-sm text-brand-700">
                    {EMPLOYEE.department}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-brand-800 hover:bg-brand-900 text-white gap-2"
                onClick={() => setActiveTab("request")}
              >
                <Plus className="h-4 w-4" /> New Request
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Active Advances"
              value={String(activeAdvances.length)}
              subtitle="Approved or disbursed"
              icon={CheckCircle2}
            />
            <StatCard
              title="Outstanding Amount"
              value={fmt(currentOutstanding)}
              subtitle="Current unpaid balance"
              icon={Wallet}
            />
            <StatCard
              title="Monthly Recovery"
              value={fmt(monthlyDeductionTotal)}
              subtitle="Payroll deductions"
              icon={Calendar}
            />
            <StatCard
              title="Pending Requests"
              value={String(pendingRequests.length)}
              subtitle="Awaiting approval"
              icon={AlertCircle}
            />
          </div>
          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
              className={
                activeTab === "overview"
                  ? "bg-brand-800 hover:bg-brand-900 text-white"
                  : "border-gray-200 text-brand-800 hover:bg-brand-100"
              }
            >
              Overview
            </Button>
            <Button
              variant={activeTab === "history" ? "default" : "outline"}
              onClick={() => setActiveTab("history")}
              className={
                activeTab === "history"
                  ? "bg-brand-800 hover:bg-brand-900 text-white"
                  : "border-gray-200 text-brand-800 hover:bg-brand-100"
              }
            >
              Request History
            </Button>
            <Button
              variant={activeTab === "request" ? "default" : "outline"}
              onClick={() => setActiveTab("request")}
              className={
                activeTab === "request"
                  ? "bg-brand-800 hover:bg-brand-900 text-white"
                  : "border-gray-200 text-brand-800 hover:bg-brand-100"
              }
            >
              Request Advance
            </Button>
          </div>
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
                <div className="text-sm">
                  <span className="text-brand-700">Latest request: </span>
                  <span className="font-semibold text-brand-900">
                    {latestRow.requestNo}
                  </span>
                  <span className="text-brand-700"> · Status: </span>
                  <Badge className={statusClasses[latestRow.status]}>
                    {latestRow.status}
                  </Badge>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {fmt(latestRow.amountRequested)}
                    </span>
                    Requested
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {fmt(latestRow.amountApproved)}
                    </span>
                    Approved
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="text-brand-900 text-base">
                      Active / Ongoing Advances
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {activeAdvances.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="font-medium text-brand-800">
                          No active advances
                        </p>
                        <p className="text-sm text-brand-600 mt-1">
                          New approved advances will appear here
                        </p>
                      </div>
                    ) : (
                      activeAdvances.map((row) => {
                        const progress =
                          row.recoveryMonths > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (row.recoveredMonths / row.recoveryMonths) *
                                    100,
                                ),
                              )
                            : 0;
                        return (
                          <div
                            key={row.id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-brand-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-brand-900">
                                    {row.requestNo}
                                  </h3>
                                  <Badge className={statusClasses[row.status]}>
                                    {row.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-brand-700 mt-1">
                                  {row.reason}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRow(row)}
                                className="text-brand-800 hover:text-brand-900 hover:bg-brand-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              <div>
                                <p className="text-xs text-brand-700 uppercase tracking-wide">
                                  Approved Amount
                                </p>
                                <p className="font-semibold text-brand-900 mt-1">
                                  {fmt(row.amountApproved)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-brand-700 uppercase tracking-wide">
                                  Outstanding
                                </p>
                                <p className="font-semibold text-brand-900 mt-1">
                                  {fmt(row.outstandingAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-brand-700 uppercase tracking-wide">
                                  Monthly Deduction
                                </p>
                                <p className="font-semibold text-brand-900 mt-1">
                                  {fmt(row.monthlyDeduction)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-brand-700 uppercase tracking-wide">
                                  First Deduction
                                </p>
                                <p className="font-semibold text-brand-900 mt-1">
                                  {row.firstDeductionDate || "—"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-xs text-brand-700 mb-2">
                                <span>Recovery progress</span>
                                <span>
                                  {row.recoveredMonths}/{row.recoveryMonths}
                                  months
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-brand-800"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="text-brand-900 text-base">
                      Policy Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="space-y-3">
                        <DetailRow
                          label="Request Type"
                          value="Payroll salary advance"
                        />
                        <DetailRow
                          label="Approval Flow"
                          value="Manager → HR → Finance"
                        />
                        <DetailRow
                          label="Recovery Method"
                          value="Monthly payroll deduction"
                        />
                        <DetailRow
                          label="Maximum Recovery Period"
                          value="12 months"
                        />
                        <DetailRow
                          label="Disbursement Mode"
                          value="Bank transfer / payroll"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                      <p className="text-sm font-medium text-brand-900 mb-2">
                        Important note
                      </p>
                      <p className="text-sm text-brand-700">
                        Salary advance approval, approved amount, and
                        installment plan may vary depending on company policy
                        and employee eligibility.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {formMessage && (
                <div className="rounded-lg border border-gray-200 bg-brand-100 px-4 py-3 text-sm text-brand-900">
                  {formMessage}
                </div>
              )}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                  <Input
                    placeholder="Search by request no, reason, status..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-brand-700">Status</span>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) =>
                      setStatusFilter(v as "all" | AdvanceStatus)
                    }
                  >
                    <SelectTrigger className="w-40 border-gray-200 text-brand-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === "all" ? "All Statuses" : status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-brand-700">Show</span>
                  <Select
                    value={String(perPage)}
                    onValueChange={(v) => setPerPage(Number(v))}
                  >
                    <SelectTrigger className="w-20 border-gray-200 text-brand-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {[10, 25, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-brand-700">entries</span>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-sm">
                    <span className="text-brand-700">Showing </span>
                    <span className="font-semibold text-brand-900">
                      {showingFrom}
                    </span>
                    <span className="text-brand-700"> to </span>
                    <span className="font-semibold text-brand-900">
                      {showingTo}
                    </span>
                    <span className="text-brand-700"> of </span>
                    <span className="font-semibold text-brand-900">
                      {totalEntries}
                    </span>
                    <span className="text-brand-700"> entries</span>
                  </div>
                  {isFetching && (
                    <Badge className="gap-1 border-gray-200 bg-white text-brand-800 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating...
                    </Badge>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {summary.pending}
                    </span>
                    Pending
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {summary.disbursed}
                    </span>
                    Disbursed
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {summary.recovered}
                    </span>
                    Recovered
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Sr.
                        </th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Request
                        </th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Requested On
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Requested
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Approved
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Outstanding
                        </th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-3 px-5 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-brand-300/50">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <FileText className="h-10 w-10 text-brand-300" />
                              <p className="font-medium text-brand-800">
                                No request records found
                              </p>
                              <p className="text-sm text-brand-600">
                                Try changing filters or submit a new request
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr
                            key={row.id}
                            className="hover:bg-brand-100 transition-colors group"
                          >
                            <td className="py-3.5 px-5 text-sm font-medium text-brand-900">
                              {row.sr}
                            </td>
                            <td className="py-3.5 px-5 text-sm">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white text-xs font-bold shrink-0">
                                  {row.requestNo.slice(-1)}
                                </div>
                                <div>
                                  <div className="font-semibold text-brand-900 text-sm">
                                    {row.requestNo}
                                  </div>
                                  <div className="text-[11px] text-brand-700">
                                    {row.reason}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-sm text-brand-900">
                              {row.requestedOn}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              {fmt(row.amountRequested)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right text-brand-900">
                              {fmt(row.amountApproved)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              {fmt(row.outstandingAmount)}
                            </td>
                            <td className="py-3.5 px-5 text-sm">
                              <Badge className={statusClasses[row.status]}>
                                {row.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-5 text-sm">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRow(row)}
                                  className="text-brand-800 hover:text-brand-900 hover:bg-brand-100"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {rows.length > 0 && (
                  <div className="border-t border-gray-200 px-5 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-brand-700">
                        Page
                        <span className="font-semibold text-brand-900">
                          {currentPage}
                        </span>
                        of
                        <span className="font-semibold text-brand-900">
                          {totalPages}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(1)}
                          disabled={currentPage === 1}
                          className="border-gray-200 text-brand-800 hover:bg-brand-200"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="border-gray-200 text-brand-800 hover:bg-brand-200"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center space-x-1 mx-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let p: number;
                              if (totalPages <= 5) p = i + 1;
                              else if (currentPage <= 3) p = i + 1;
                              else if (currentPage >= totalPages - 2)
                                p = totalPages - 4 + i;
                              else p = currentPage - 2 + i;
                              return (
                                <Button
                                  key={p}
                                  variant={
                                    currentPage === p ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setPage(p)}
                                  className={
                                    currentPage === p
                                      ? "bg-brand-800 hover:bg-brand-900 border-brand-800 text-white"
                                      : "border-gray-200 text-brand-800 hover:bg-brand-200"
                                  }
                                >
                                  {p}
                                </Button>
                              );
                            },
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                          className="border-gray-200 text-brand-800 hover:bg-brand-200"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="border-gray-200 text-brand-800 hover:bg-brand-200"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-brand-700">
                        <span className="font-semibold text-brand-900">
                          {showingFrom}
                        </span>
                        {" – "}
                        <span className="font-semibold text-brand-900">
                          {showingTo}
                        </span>
                        {" of "}
                        <span className="font-semibold text-brand-900">
                          {totalEntries}
                        </span>
                        {" entries"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Requested
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      {fmt(summary.requested)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Approved
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      {fmt(summary.approved)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Outstanding
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      {fmt(summary.outstanding)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Disbursed
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      {summary.disbursed}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* REQUEST */}
          {activeTab === "request" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="border border-gray-200 shadow-none">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-brand-900 text-base">
                    Salary Advance Form
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {formMessage && (
                    <div className="rounded-lg border border-gray-200 bg-brand-100 px-4 py-3 text-sm text-brand-900">
                      {formMessage}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-brand-800">Requested Amount</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 100000"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      className="border-gray-200 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-brand-800">Recovery Period</Label>
                      <Select
                        value={form.recoveryMonths}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            recoveryMonths: value,
                          }))
                        }
                      >
                        <SelectTrigger className="border-gray-200 text-brand-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {["1", "2", "3", "4", "5", "6", "9", "12"].map(
                            (month) => (
                              <SelectItem key={month} value={month}>
                                {month} Month{month === "1" ? "" : "s"}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brand-800">
                        First Deduction Date
                      </Label>
                      <Input
                        type="date"
                        value={form.firstDeductionDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            firstDeductionDate: e.target.value,
                          }))
                        }
                        className="border-gray-200 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-800">Reason</Label>
                    <textarea
                      value={form.reason}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, reason: e.target.value }))
                      }
                      placeholder="Write the purpose of the salary advance request..."
                      rows={4}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-[rgb(30,27,75)] focus:ring-1 focus:ring-[rgb(30,27,75)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-800">Additional Remarks</Label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        }))
                      }
                      placeholder="Optional note for HR / Finance..."
                      rows={3}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-[rgb(30,27,75)] focus:ring-1 focus:ring-[rgb(30,27,75)]"
                    />
                  </div>
                  <div className="flex items-center gap-3 justify-end flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      onClick={() => {
                        resetForm();
                        setFormMessage(null);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      className="bg-brand-800 hover:bg-brand-900 text-white"
                      onClick={handleSubmit}
                    >
                      Submit Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 shadow-none">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="text-brand-900 text-base">
                    Request Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border border-gray-200 shadow-none">
                      <CardContent className="p-4">
                        <p className="text-xs text-brand-700 uppercase tracking-wide">
                          Requested Amount
                        </p>
                        <p className="text-xl font-bold text-brand-900 mt-1">
                          {fmt(Number(form.amount || 0))}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-none">
                      <CardContent className="p-4">
                        <p className="text-xs text-brand-700 uppercase tracking-wide">
                          Estimated Deduction
                        </p>
                        <p className="text-xl font-bold text-brand-900 mt-1">
                          {fmt(estimatedInstallment)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="space-y-3">
                      <DetailRow
                        label="Recovery Period"
                        value={
                          form.recoveryMonths
                            ? `${form.recoveryMonths} month(s)`
                            : "—"
                        }
                      />
                      <DetailRow
                        label="First Deduction Date"
                        value={form.firstDeductionDate || "—"}
                      />
                      <DetailRow
                        label="Estimated Monthly Recovery"
                        value={fmt(estimatedInstallment)}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-medium text-brand-900 mb-3">
                      Policy Snapshot
                    </p>
                    <div className="space-y-2 text-sm text-brand-700">
                      <div className="flex items-center justify-between">
                        <span>Approval Flow</span>
                        <span className="font-medium text-brand-900">
                          Manager → HR → Finance
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Recovery Mode</span>
                        <span className="font-medium text-brand-900">
                          Monthly payroll
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Max Suggested Period</span>
                        <span className="font-medium text-brand-900">
                          12 months
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Disbursement</span>
                        <span className="font-medium text-brand-900">
                          Subject to approval
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                    <p className="text-sm font-medium text-brand-900 mb-2">
                      Important note
                    </p>
                    <p className="text-sm text-brand-700">
                      Approved amount and final installment plan may differ from
                      the requested amount, based on payroll policy and
                      management approval.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Details modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedRow && (
          <DialogContent className="sm:max-w-[820px] border border-gray-200 bg-white p-0 overflow-hidden">
            <div className="bg-brand-900 px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 opacity-80" /> Salary Advance
                  Details
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                {selectedRow.requestNo} · {selectedRow.status} ·{EMPLOYEE.name}
              </DialogDescription>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Requested
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedRow.amountRequested)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Approved
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedRow.amountApproved)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Outstanding
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedRow.outstandingAmount)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Monthly
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedRow.monthlyDeduction)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h4 className="font-semibold text-brand-900">
                      Request Information
                    </h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Core request details
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    <DetailRow
                      label="Request No"
                      value={selectedRow.requestNo}
                    />
                    <DetailRow
                      label="Requested On"
                      value={selectedRow.requestedOn}
                    />
                    <DetailRow
                      label="Approved By"
                      value={selectedRow.approvedBy}
                    />
                    <DetailRow label="Reason" value={selectedRow.reason} />
                    <DetailRow label="Remarks" value={selectedRow.remarks} />
                    <DetailRow label="Status" value={selectedRow.status} />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h4 className="font-semibold text-brand-900">
                      Recovery Details
                    </h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Payroll deduction and balance details
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    <DetailRow
                      label="Recovery Months"
                      value={`${selectedRow.recoveryMonths}`}
                    />
                    <DetailRow
                      label="Recovered Months"
                      value={`${selectedRow.recoveredMonths}`}
                    />
                    <DetailRow
                      label="First Deduction Date"
                      value={selectedRow.firstDeductionDate || "—"}
                    />
                    <DetailRow
                      label="Expected End Date"
                      value={selectedRow.expectedEndDate || "—"}
                    />
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-brand-700 mb-2">
                        <span>Recovery progress</span>
                        <span>
                          {selectedRow.recoveredMonths}/
                          {selectedRow.recoveryMonths}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-800"
                          style={{
                            width: `${selectedRow.recoveryMonths ? Math.min(100, Math.round((selectedRow.recoveredMonths / selectedRow.recoveryMonths) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                <div className="space-y-1">
                  <p className="text-sm text-brand-700">
                    Employee ID:
                    <span className="font-medium text-brand-900">
                      {EMPLOYEE.id}
                    </span>
                  </p>
                  <p className="text-sm text-brand-700">
                    Department:
                    <span className="font-medium text-brand-900">
                      {EMPLOYEE.department}
                    </span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-brand-600">Current Status</p>
                  <Badge className={statusClasses[selectedRow.status]}>
                    {selectedRow.status}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-5 flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-gray-200 text-brand-800 hover:bg-brand-100"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              <Button className="bg-brand-800 text-white hover:bg-brand-900">
                <Download className="h-4 w-4 mr-2" /> Download Details
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
