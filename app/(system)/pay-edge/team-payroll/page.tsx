"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Users,
  Search,
  Eye,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  FileText,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Receipt,
  IndianRupee,
} from "lucide-react";
import { EmployeeLink } from "@/components/shared/EmployeeLink";
/* -------------------------------------------------------------------------- */ /* Types */ /* -------------------------------------------------------------------------- */ type TeamPayrollTab =
  "overview" | "payroll" | "summary";
type PayrollStatus = "Processed" | "Pending" | "On Hold";
type TeamMember = {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  bankAccount: string;
  baseGross: number;
};
type PayrollDetails = {
  earnings: {
    basic: number;
    hra: number;
    allowance: number;
    overtime: number;
    bonus: number;
  };
  deductions: { pf: number; tax: number; loan: number; other: number };
};
type TeamPayrollRow = {
  id: number;
  payrollMonth: string;
  year: number;
  payrollKey: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  bankAccount: string;
  gross: number;
  deductions: number;
  net: number;
  paidOn: string | null;
  status: PayrollStatus;
  details: PayrollDetails;
};
type TeamPayrollViewRow = TeamPayrollRow & { sr: number };
/* -------------------------------------------------------------------------- */ /* Constants */ /* -------------------------------------------------------------------------- */ const DEFAULT_PER_PAGE = 10;
const TEAM_MEMBERS: TeamMember[] = [
  {
    employeeId: "EMP001",
    name: "Muqadas Mazhar",
    designation: "Sr. Software Engineer",
    department: "Engineering",
    bankAccount: "XXXX1234",
    baseGross: 228000,
  },
  {
    employeeId: "EMP002",
    name: "Ali Raza",
    designation: "Software Engineer",
    department: "Engineering",
    bankAccount: "XXXX2468",
    baseGross: 185000,
  },
  {
    employeeId: "EMP003",
    name: "Hina Malik",
    designation: "UI/UX Designer",
    department: "Design",
    bankAccount: "XXXX3579",
    baseGross: 162000,
  },
  {
    employeeId: "EMP004",
    name: "Usman Tariq",
    designation: "QA Engineer",
    department: "Quality Assurance",
    bankAccount: "XXXX4680",
    baseGross: 148000,
  },
  {
    employeeId: "EMP005",
    name: "Mariam Khan",
    designation: "Project Coordinator",
    department: "PMO",
    bankAccount: "XXXX5791",
    baseGross: 154000,
  },
  {
    employeeId: "EMP006",
    name: "Ahmed Saeed",
    designation: "DevOps Engineer",
    department: "Infrastructure",
    bankAccount: "XXXX6802",
    baseGross: 198000,
  },
  {
    employeeId: "EMP007",
    name: "Areeba Noor",
    designation: "HR Executive",
    department: "Human Resources",
    bankAccount: "XXXX7913",
    baseGross: 136000,
  },
  {
    employeeId: "EMP008",
    name: "Hamza Javed",
    designation: "Business Analyst",
    department: "Business",
    bankAccount: "XXXX8024",
    baseGross: 171000,
  },
];
const MONTHS = [
  { month: "June", year: 2025, monthIndex: 6 },
  { month: "May", year: 2025, monthIndex: 5 },
];
const payrollStatusClasses: Record<PayrollStatus, string> = {
  Processed: "bg-brand-700 text-white border-transparent hover:bg-brand-700",
  Pending:
    "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
  "On Hold": "bg-brand-600 text-white border-transparent hover:bg-brand-600",
};
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
function buildPayrollRows(): TeamPayrollRow[] {
  let id = 1;
  const rows: TeamPayrollRow[] = [];
  MONTHS.forEach((monthItem, monthLoopIndex) => {
    TEAM_MEMBERS.forEach((member, employeeIndex) => {
      const basic = Math.round(member.baseGross * 0.52);
      const hra = Math.round(member.baseGross * 0.24);
      const allowance = Math.round(member.baseGross * 0.11);
      const overtime =
        monthLoopIndex === 0
          ? (employeeIndex % 4) * 2000
          : (employeeIndex % 3) * 1500;
      const bonus =
        monthLoopIndex === 0
          ? [15000, 8000, 6000, 3000, 5000, 10000, 0, 4000][employeeIndex]
          : [5000, 3000, 0, 2000, 2500, 4500, 0, 1500][employeeIndex];
      const gross = basic + hra + allowance + overtime + bonus;
      const pf = Math.round(basic * 0.12);
      const tax = Math.round(gross * 0.04);
      const loan = employeeIndex === 0 ? 5000 : employeeIndex === 4 ? 3000 : 0;
      const other = 1200 + (employeeIndex % 3) * 400;
      const deductions = pf + tax + loan + other;
      const net = gross - deductions;
      let status: PayrollStatus = "Processed";
      let paidOn: string | null =
        `${monthItem.year}-${String(monthItem.monthIndex + 1).padStart(2, "0")}-05`;
      if (monthItem.month === "June" && employeeIndex === 6) {
        status = "Pending";
        paidOn = null;
      }
      if (monthItem.month === "June" && employeeIndex === 3) {
        status = "On Hold";
        paidOn = null;
      }
      rows.push({
        id: id++,
        payrollMonth: monthItem.month,
        year: monthItem.year,
        payrollKey: `${monthItem.month} ${monthItem.year}`,
        employeeId: member.employeeId,
        name: member.name,
        designation: member.designation,
        department: member.department,
        bankAccount: member.bankAccount,
        gross,
        deductions,
        net,
        paidOn,
        status,
        details: {
          earnings: { basic, hra, allowance, overtime, bonus },
          deductions: { pf, tax, loan, other },
        },
      });
    });
  });
  return rows.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.payrollMonth.localeCompare(a.payrollMonth);
  });
}
/* -------------------------------------------------------------------------- */ /* Component */ /* -------------------------------------------------------------------------- */ export default function TeamPayrollModule() {
  const [activeTab, setActiveTab] = useState<TeamPayrollTab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PayrollStatus>(
    "all",
  );
  const [monthFilter, setMonthFilter] = useState("all");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<TeamPayrollRow | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const q = useDebounced(search, 400);
  const payrollRows = useMemo(() => buildPayrollRows(), []);
  const monthOptions = useMemo(
    () => [...new Set(payrollRows.map((row) => row.payrollKey))],
    [payrollRows],
  );
  const currentCycle = monthOptions[0] ?? "June 2025";
  useEffect(() => {
    if (activeTab !== "payroll") return;
    setIsFetching(true);
    const t = setTimeout(() => setIsFetching(false), 300);
    return () => clearTimeout(t);
  }, [activeTab, q, statusFilter, monthFilter, perPage, page]);
  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, monthFilter, perPage]);
  const currentCycleRows = useMemo(
    () => payrollRows.filter((row) => row.payrollKey === currentCycle),
    [payrollRows, currentCycle],
  );
  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return payrollRows.filter((row) => {
      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;
      const matchesMonth =
        monthFilter === "all" ? true : row.payrollKey === monthFilter;
      const haystack =
        `${row.employeeId} ${row.name} ${row.designation} ${row.department} ${row.payrollKey} ${row.status}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesStatus && matchesMonth && matchesSearch;
    });
  }, [payrollRows, q, statusFilter, monthFilter]);
  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;
  const rows: TeamPayrollViewRow[] = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRows
      .slice(start, start + perPage)
      .map((item, index) => ({ sr: start + index + 1, ...item }));
  }, [filteredRows, currentPage, perPage]);
  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.gross += row.gross;
        acc.deductions += row.deductions;
        acc.net += row.net;
        if (row.status === "Processed") acc.processed += 1;
        if (row.status === "Pending") acc.pending += 1;
        if (row.status === "On Hold") acc.onHold += 1;
        return acc;
      },
      { gross: 0, deductions: 0, net: 0, processed: 0, pending: 0, onHold: 0 },
    );
  }, [filteredRows]);
  const currentCycleSummary = useMemo(() => {
    return currentCycleRows.reduce(
      (acc, row) => {
        acc.gross += row.gross;
        acc.deductions += row.deductions;
        acc.net += row.net;
        if (row.status === "Processed") acc.processed += 1;
        if (row.status === "Pending") acc.pending += 1;
        if (row.status === "On Hold") acc.onHold += 1;
        return acc;
      },
      { gross: 0, deductions: 0, net: 0, processed: 0, pending: 0, onHold: 0 },
    );
  }, [currentCycleRows]);
  const departmentSummary = useMemo(() => {
    const map = new Map<
      string,
      { department: string; headcount: number; gross: number; net: number }
    >();
    currentCycleRows.forEach((row) => {
      const existing = map.get(row.department) ?? {
        department: row.department,
        headcount: 0,
        gross: 0,
        net: 0,
      };
      existing.headcount += 1;
      existing.gross += row.gross;
      existing.net += row.net;
      map.set(row.department, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.gross - a.gross);
  }, [currentCycleRows]);
  const monthlySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        payrollKey: string;
        headcount: number;
        gross: number;
        deductions: number;
        net: number;
        processed: number;
        pending: number;
        onHold: number;
      }
    >();
    payrollRows.forEach((row) => {
      const existing = map.get(row.payrollKey) ?? {
        payrollKey: row.payrollKey,
        headcount: 0,
        gross: 0,
        deductions: 0,
        net: 0,
        processed: 0,
        pending: 0,
        onHold: 0,
      };
      existing.headcount += 1;
      existing.gross += row.gross;
      existing.deductions += row.deductions;
      existing.net += row.net;
      if (row.status === "Processed") existing.processed += 1;
      if (row.status === "Pending") existing.pending += 1;
      if (row.status === "On Hold") existing.onHold += 1;
      map.set(row.payrollKey, existing);
    });
    return Array.from(map.values());
  }, [payrollRows]);
  const openPayroll = (row: TeamPayrollRow) => {
    setSelectedPayroll(row);
    setIsModalOpen(true);
  };
  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 shrink-0">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Team Payroll
                </CardTitle>
                <p className="text-sm text-brand-700 mt-1">
                  View payroll cycle summaries, team member payroll, and monthly
                  breakdowns.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
              >
                <Download className="h-4 w-4" /> Export Payroll
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Team Members"
              value={String(TEAM_MEMBERS.length)}
              subtitle={`Payroll cycle ${currentCycle}`}
              icon={Users}
            />
            <StatCard
              title="Current Gross"
              value={fmt(currentCycleSummary.gross)}
              subtitle="Current team payroll"
              icon={Wallet}
            />
            <StatCard
              title="Current Net"
              value={fmt(currentCycleSummary.net)}
              subtitle="After deductions"
              icon={IndianRupee}
            />
            <StatCard
              title="Pending / Hold"
              value={String(
                currentCycleSummary.pending + currentCycleSummary.onHold,
              )}
              subtitle="Require action"
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
              variant={activeTab === "payroll" ? "default" : "outline"}
              onClick={() => setActiveTab("payroll")}
              className={
                activeTab === "payroll"
                  ? "bg-brand-800 hover:bg-brand-900 text-white"
                  : "border-gray-200 text-brand-800 hover:bg-brand-100"
              }
            >
              Team Payroll
            </Button>
            <Button
              variant={activeTab === "summary" ? "default" : "outline"}
              onClick={() => setActiveTab("summary")}
              className={
                activeTab === "summary"
                  ? "bg-brand-800 hover:bg-brand-900 text-white"
                  : "border-gray-200 text-brand-800 hover:bg-brand-100"
              }
            >
              Monthly Summary
            </Button>
          </div>
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
                <div className="text-sm">
                  <span className="text-brand-700">Current payroll cycle:</span>
                  <span className="font-semibold text-brand-900">
                    {currentCycle}
                  </span>
                  <span className="text-brand-700">· Processed employees:</span>
                  <span className="font-semibold text-brand-900">
                    {currentCycleSummary.processed}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {fmt(currentCycleSummary.deductions)}
                    </span>
                    Deductions
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {currentCycleSummary.pending}
                    </span>
                    Pending
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {currentCycleSummary.onHold}
                    </span>
                    On Hold
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="text-brand-900 text-base">
                      Department Payroll Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {departmentSummary.map((item) => (
                      <div
                        key={item.department}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-brand-900">
                              {item.department}
                            </p>
                            <p className="text-sm text-brand-700 mt-1">
                              {item.headcount} team member(s)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-brand-900">
                              {fmt(item.gross)}
                            </p>
                            <p className="text-xs text-brand-700 mt-1">
                              Net {fmt(item.net)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="text-brand-900 text-base">
                      Latest Payroll Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {currentCycleRows.slice(0, 5).map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                      >
                        <div>
                          <p className="font-semibold text-brand-900">
                            <EmployeeLink
                              employeeId={row.employeeId}
                              employeeName={row.name}
                            />
                          </p>
                          <p className="text-sm text-brand-700 mt-1">
                            {row.designation} · {row.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={payrollStatusClasses[row.status]}>
                            {row.status}
                          </Badge>
                          <p className="text-xs text-brand-700 mt-2">
                            {fmt(row.net)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* TEAM PAYROLL */}
          {activeTab === "payroll" && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                  <Input
                    placeholder="Search by employee, department, designation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-brand-700">Month</span>
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-40 border-gray-200 text-brand-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Months</SelectItem>
                      {monthOptions.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-brand-700">Status</span>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) =>
                      setStatusFilter(v as "all" | PayrollStatus)
                    }
                  >
                    <SelectTrigger className="w-36 border-gray-200 text-brand-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Processed">Processed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
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
                      {summary.processed}
                    </span>
                    Processed
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {summary.pending}
                    </span>
                    Pending
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    <span className="font-semibold text-brand-900">
                      {summary.onHold}
                    </span>
                    On Hold
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
                          Employee
                        </th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Gross
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Deductions
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Net
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
                                No payroll records found
                              </p>
                              <p className="text-sm text-brand-600">
                                Try changing filters or search
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
                              <div className="flex flex-col">
                                <EmployeeLink
                                  employeeId={row.employeeId}
                                  employeeName={row.name}
                                  showAvatar
                                />
                                <div className="text-[11px] text-brand-700 ml-9">
                                  {row.employeeId} · {row.department}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-sm text-brand-900">
                              {row.payrollKey}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              {fmt(row.gross)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right text-brand-900">
                              {fmt(row.deductions)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              {fmt(row.net)}
                            </td>
                            <td className="py-3.5 px-5 text-sm">
                              <Badge
                                className={payrollStatusClasses[row.status]}
                              >
                                {row.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-5 text-sm">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPayroll(row)}
                                  className="text-brand-800 hover:text-brand-900 hover:bg-brand-100"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
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
                      Gross
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      {fmt(summary.gross)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Deductions
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      {fmt(summary.deductions)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Net
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      {fmt(summary.net)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Processed
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      {summary.processed}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* MONTHLY SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 text-sm">
                <span className="text-brand-700">
                  Monthly payroll summary across
                </span>
                <span className="font-semibold text-brand-900">
                  {monthlySummary.length}
                </span>
                <span className="text-brand-700"> payroll cycle(s).</span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {monthlySummary.map((item) => (
                  <Card
                    key={item.payrollKey}
                    className="border border-gray-200 shadow-none"
                  >
                    <CardHeader className="border-b border-gray-200 pb-4">
                      <CardTitle className="text-brand-900 text-base">
                        {item.payrollKey}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-brand-700 uppercase tracking-wide">
                            Headcount
                          </p>
                          <p className="text-lg font-bold text-brand-900 mt-1">
                            {item.headcount}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-brand-700 uppercase tracking-wide">
                            Gross
                          </p>
                          <p className="text-lg font-bold text-brand-900 mt-1">
                            {fmt(item.gross)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-brand-700 uppercase tracking-wide">
                            Deductions
                          </p>
                          <p className="text-lg font-bold text-brand-900 mt-1">
                            {fmt(item.deductions)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3">
                          <p className="text-xs text-brand-700 uppercase tracking-wide">
                            Net
                          </p>
                          <p className="text-lg font-bold text-brand-900 mt-1">
                            {fmt(item.net)}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-brand-700">
                            <span className="font-semibold text-brand-900">
                              {item.processed}
                            </span>
                            Processed
                          </div>
                          <div className="h-3 w-px bg-brand-300" />
                          <div className="flex items-center gap-1.5 text-xs text-brand-700">
                            <span className="font-semibold text-brand-900">
                              {item.pending}
                            </span>
                            Pending
                          </div>
                          <div className="h-3 w-px bg-brand-300" />
                          <div className="flex items-center gap-1.5 text-xs text-brand-700">
                            <span className="font-semibold text-brand-900">
                              {item.onHold}
                            </span>
                            On Hold
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Detail modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedPayroll && (
          <DialogContent className="sm:max-w-[820px] border border-gray-200 bg-white p-0 overflow-hidden">
            <div className="bg-brand-900 px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 opacity-80" /> Payroll Details
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                {selectedPayroll.name} · {selectedPayroll.payrollKey} ·
                {selectedPayroll.status}
              </DialogDescription>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Gross
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedPayroll.gross)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Deductions
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedPayroll.deductions)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Net
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedPayroll.net)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Paid On
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {selectedPayroll.paidOn || "—"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h4 className="font-semibold text-brand-900">
                      Employee Details
                    </h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Team member payroll information
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    <DetailRow
                      label="Employee ID"
                      value={selectedPayroll.employeeId}
                    />
                    <DetailRow label="Name" value={selectedPayroll.name} />
                    <DetailRow
                      label="Designation"
                      value={selectedPayroll.designation}
                    />
                    <DetailRow
                      label="Department"
                      value={selectedPayroll.department}
                    />
                    <DetailRow
                      label="Bank Account"
                      value={selectedPayroll.bankAccount}
                    />
                    <DetailRow
                      label="Payroll Month"
                      value={selectedPayroll.payrollKey}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h4 className="font-semibold text-brand-900">Earnings</h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Salary components
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    <DetailRow
                      label="Basic"
                      value={fmt(selectedPayroll.details.earnings.basic)}
                    />
                    <DetailRow
                      label="HRA"
                      value={fmt(selectedPayroll.details.earnings.hra)}
                    />
                    <DetailRow
                      label="Allowance"
                      value={fmt(selectedPayroll.details.earnings.allowance)}
                    />
                    <DetailRow
                      label="Overtime"
                      value={fmt(selectedPayroll.details.earnings.overtime)}
                    />
                    <DetailRow
                      label="Bonus"
                      value={fmt(selectedPayroll.details.earnings.bonus)}
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-white">
                  <h4 className="font-semibold text-brand-900">Deductions</h4>
                  <p className="text-xs text-brand-700 mt-0.5">
                    Applied deductions
                  </p>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <DetailRow
                      label="Provident Fund"
                      value={fmt(selectedPayroll.details.deductions.pf)}
                    />
                    <DetailRow
                      label="Tax"
                      value={fmt(selectedPayroll.details.deductions.tax)}
                    />
                  </div>
                  <div className="space-y-3">
                    <DetailRow
                      label="Loan"
                      value={fmt(selectedPayroll.details.deductions.loan)}
                    />
                    <DetailRow
                      label="Other"
                      value={fmt(selectedPayroll.details.deductions.other)}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                <div className="space-y-1">
                  <p className="text-sm text-brand-700">
                    Status:
                    <Badge
                      className={payrollStatusClasses[selectedPayroll.status]}
                    >
                      {selectedPayroll.status}
                    </Badge>
                  </p>
                  <p className="text-sm text-brand-700">
                    Department:
                    <span className="font-medium text-brand-900">
                      {selectedPayroll.department}
                    </span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-brand-600">Net Payable</p>
                  <p className="text-2xl font-bold text-brand-900">
                    {fmt(selectedPayroll.net)}
                  </p>
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
                <Download className="h-4 w-4 mr-2" /> Download Payslip
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
