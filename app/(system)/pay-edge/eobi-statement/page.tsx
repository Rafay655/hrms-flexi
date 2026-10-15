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
  ShieldCheck,
  Search,
  Download,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  FileText,
  Building2,
  Wallet,
  CheckCircle2,
  Clock3,
  User,
} from "lucide-react";
/* -------------------------------------------------------------------------- */ /* Types */ /* -------------------------------------------------------------------------- */ type EobiTab =
  "overview" | "history";
type EobiStatus = "Submitted" | "Paid" | "Pending" | "Overdue";
type EobiStatementRow = {
  id: number;
  month: string;
  year: number;
  contributionMonth: string;
  insuredWages: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  paymentDate: string | null;
  challanNo: string;
  status: EobiStatus;
  remarks: string;
};
type StatementViewRow = EobiStatementRow & { sr: number };
/* -------------------------------------------------------------------------- */ /* Constants */ /* -------------------------------------------------------------------------- */ const DEFAULT_PER_PAGE = 10;
const EMPLOYEE = {
  id: "EMP001",
  name: "Muqadas Mazhar",
  designation: "Sr. Software Engineer",
  department: "Engineering",
  eobiNo: "EOBI-784512",
  cnic: "35202-1234567-8",
  joiningDate: "2022-01-15",
};
const STATEMENTS: EobiStatementRow[] = [
  {
    id: 1,
    month: "June",
    year: 2025,
    contributionMonth: "June 2025",
    insuredWages: 45000,
    employeeContribution: 0,
    employerContribution: 550,
    totalContribution: 550,
    paymentDate: "2025-07-08",
    challanNo: "CH-250601",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 2,
    month: "May",
    year: 2025,
    contributionMonth: "May 2025",
    insuredWages: 45000,
    employeeContribution: 0,
    employerContribution: 550,
    totalContribution: 550,
    paymentDate: "2025-06-09",
    challanNo: "CH-250502",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 3,
    month: "April",
    year: 2025,
    contributionMonth: "April 2025",
    insuredWages: 45000,
    employeeContribution: 0,
    employerContribution: 550,
    totalContribution: 550,
    paymentDate: "2025-05-07",
    challanNo: "CH-250403",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 4,
    month: "March",
    year: 2025,
    contributionMonth: "March 2025",
    insuredWages: 45000,
    employeeContribution: 0,
    employerContribution: 550,
    totalContribution: 550,
    paymentDate: "2025-04-06",
    challanNo: "CH-250304",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 5,
    month: "February",
    year: 2025,
    contributionMonth: "February 2025",
    insuredWages: 45000,
    employeeContribution: 0,
    employerContribution: 550,
    totalContribution: 550,
    paymentDate: "2025-03-05",
    challanNo: "CH-250205",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 6,
    month: "January",
    year: 2025,
    contributionMonth: "January 2025",
    insuredWages: 45000,
    employeeContribution: 0,
    employerContribution: 550,
    totalContribution: 550,
    paymentDate: "2025-02-08",
    challanNo: "CH-250106",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 7,
    month: "December",
    year: 2024,
    contributionMonth: "December 2024",
    insuredWages: 43000,
    employeeContribution: 0,
    employerContribution: 520,
    totalContribution: 520,
    paymentDate: "2025-01-07",
    challanNo: "CH-241207",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 8,
    month: "November",
    year: 2024,
    contributionMonth: "November 2024",
    insuredWages: 43000,
    employeeContribution: 0,
    employerContribution: 520,
    totalContribution: 520,
    paymentDate: "2024-12-06",
    challanNo: "CH-241108",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 9,
    month: "October",
    year: 2024,
    contributionMonth: "October 2024",
    insuredWages: 43000,
    employeeContribution: 0,
    employerContribution: 520,
    totalContribution: 520,
    paymentDate: null,
    challanNo: "CH-241009",
    status: "Pending",
    remarks: "Awaiting payment confirmation",
  },
  {
    id: 10,
    month: "September",
    year: 2024,
    contributionMonth: "September 2024",
    insuredWages: 43000,
    employeeContribution: 0,
    employerContribution: 520,
    totalContribution: 520,
    paymentDate: null,
    challanNo: "CH-240910",
    status: "Overdue",
    remarks: "Payment overdue",
  },
  {
    id: 11,
    month: "August",
    year: 2024,
    contributionMonth: "August 2024",
    insuredWages: 43000,
    employeeContribution: 0,
    employerContribution: 520,
    totalContribution: 520,
    paymentDate: "2024-09-05",
    challanNo: "CH-240811",
    status: "Paid",
    remarks: "Paid successfully",
  },
  {
    id: 12,
    month: "July",
    year: 2024,
    contributionMonth: "July 2024",
    insuredWages: 43000,
    employeeContribution: 0,
    employerContribution: 520,
    totalContribution: 520,
    paymentDate: "2024-08-04",
    challanNo: "CH-240712",
    status: "Submitted",
    remarks: "Submitted and under reconciliation",
  },
];
const statusClasses: Record<EobiStatus, string> = {
  Paid: "bg-brand-700 text-white border-transparent hover:bg-brand-700",
  Pending:
    "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
  Submitted: "bg-brand-600 text-white border-transparent hover:bg-brand-600",
  Overdue: "bg-brand-900 text-white border-transparent hover:bg-brand-900",
};
const STATUS_OPTIONS: Array<"all" | EobiStatus> = [
  "all",
  "Paid",
  "Pending",
  "Submitted",
  "Overdue",
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
    <div className="flex items-center justify-between text-sm">
      
      <span className="text-brand-700">{label}</span>
      <span className="font-medium text-brand-900">{value}</span>
    </div>
  );
}
/* -------------------------------------------------------------------------- */ /* Component */ /* -------------------------------------------------------------------------- */ export default function EOBIStatement() {
  const [activeTab, setActiveTab] = useState<EobiTab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EobiStatus>("all");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedStatement, setSelectedStatement] =
    useState<EobiStatementRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const paidStatements = useMemo(
    () => STATEMENTS.filter((item) => item.status === "Paid"),
    [],
  );
  const latestStatement = STATEMENTS[0];
  const filteredStatements = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return STATEMENTS.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      const haystack =
        `${item.month} ${item.year} ${item.challanNo} ${item.status} ${item.remarks}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [q, statusFilter]);
  const totalEntries = filteredStatements.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;
  const rows: StatementViewRow[] = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredStatements
      .slice(start, start + perPage)
      .map((item, index) => ({ sr: start + index + 1, ...item }));
  }, [filteredStatements, currentPage, perPage]);
  const summary = useMemo(() => {
    return filteredStatements.reduce(
      (acc, item) => {
        acc.insuredWages += item.insuredWages;
        acc.employee += item.employeeContribution;
        acc.employer += item.employerContribution;
        acc.total += item.totalContribution;
        if (item.status === "Paid") acc.paid += 1;
        if (item.status === "Pending") acc.pending += 1;
        if (item.status === "Submitted") acc.submitted += 1;
        if (item.status === "Overdue") acc.overdue += 1;
        return acc;
      },
      {
        insuredWages: 0,
        employee: 0,
        employer: 0,
        total: 0,
        paid: 0,
        pending: 0,
        submitted: 0,
        overdue: 0,
      },
    );
  }, [filteredStatements]);
  const openStatement = (statement: EobiStatementRow) => {
    setSelectedStatement(statement);
    setIsModalOpen(true);
  };
  return (
    <div className="p-3 bg-white min-h-screen">
      
      <Card className="border border-gray-200 shadow-sm">
        
        <CardHeader className="border-b border-gray-200">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="flex items-start gap-3">
              
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 shrink-0">
                
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                
                <CardTitle className="text-2xl font-bold text-brand-900">
                  
                  EOBI Statement
                </CardTitle>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  
                  <Badge className="bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100">
                    
                    <User className="h-3 w-3 mr-1" /> {EMPLOYEE.id}
                  </Badge>
                  <span className="text-sm text-brand-700">
                    
                    {EMPLOYEE.name} · {EMPLOYEE.designation}
                  </span>
                  <span className="text-sm text-brand-700">
                    
                    EOBI No: {EMPLOYEE.eobiNo}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              
              <Button
                variant="outline"
                className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
              >
                
                <Download className="h-4 w-4" /> Export Statement
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            <StatCard
              title="Latest Contribution"
              value={fmt(latestStatement.totalContribution)}
              subtitle={latestStatement.contributionMonth}
              icon={Wallet}
            />
            <StatCard
              title="Total Paid Records"
              value={String(paidStatements.length)}
              subtitle="Successfully paid months"
              icon={CheckCircle2}
            />
            <StatCard
              title="Total Contributions"
              value={fmt(
                STATEMENTS.reduce(
                  (sum, item) => sum + item.totalContribution,
                  0,
                ),
              )}
              subtitle="Across all statements"
              icon={Building2}
            />
            <StatCard
              title="Pending / Overdue"
              value={String(
                STATEMENTS.filter(
                  (item) =>
                    item.status === "Pending" || item.status === "Overdue",
                ).length,
              )}
              subtitle="Need attention"
              icon={Clock3}
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
              
              Statement History
            </Button>
          </div>
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
                
                <div className="text-sm">
                  
                  <span className="text-brand-700">
                    Latest processed month:
                  </span>
                  <span className="font-semibold text-brand-900">
                    
                    {latestStatement.contributionMonth}
                  </span>
                  <span className="text-brand-700"> · Status: </span>
                  <Badge className={statusClasses[latestStatement.status]}>
                    
                    {latestStatement.status}
                  </Badge>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      
                      {fmt(latestStatement.insuredWages)}
                    </span>
                    Insured Wages
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      
                      {fmt(latestStatement.employerContribution)}
                    </span>
                    Employer Share
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                
                <Card className="border border-gray-200 shadow-none">
                  
                  <CardHeader className="border-b border-gray-200 pb-4">
                    
                    <CardTitle className="text-brand-900 text-base">
                      
                      Employee Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    
                    <DetailRow label="Employee ID" value={EMPLOYEE.id} />
                    <DetailRow label="Name" value={EMPLOYEE.name} />
                    <DetailRow
                      label="Designation"
                      value={EMPLOYEE.designation}
                    />
                    <DetailRow label="Department" value={EMPLOYEE.department} />
                    <DetailRow label="EOBI No" value={EMPLOYEE.eobiNo} />
                    <DetailRow label="CNIC" value={EMPLOYEE.cnic} />
                    <DetailRow
                      label="Joining Date"
                      value={EMPLOYEE.joiningDate}
                    />
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  
                  <CardHeader className="border-b border-gray-200 pb-4">
                    
                    <CardTitle className="text-brand-900 text-base">
                      
                      Latest Statement Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    
                    <DetailRow
                      label="Contribution Month"
                      value={latestStatement.contributionMonth}
                    />
                    <DetailRow
                      label="Insured Wages"
                      value={fmt(latestStatement.insuredWages)}
                    />
                    <DetailRow
                      label="Employee Contribution"
                      value={fmt(latestStatement.employeeContribution)}
                    />
                    <DetailRow
                      label="Employer Contribution"
                      value={fmt(latestStatement.employerContribution)}
                    />
                    <DetailRow
                      label="Total Contribution"
                      value={fmt(latestStatement.totalContribution)}
                    />
                    <DetailRow
                      label="Payment Date"
                      value={latestStatement.paymentDate || "—"}
                    />
                    <DetailRow
                      label="Challan No"
                      value={latestStatement.challanNo}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              
              <div className="flex flex-col lg:flex-row gap-4">
                
                <div className="relative flex-1">
                  
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                  <Input
                    placeholder="Search by month, challan no, status..."
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
                      setStatusFilter(v as "all" | EobiStatus)
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
                      {summary.paid}
                    </span>
                    Paid
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
                      {summary.overdue}
                    </span>
                    Overdue
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
                          
                          Month
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Insured Wages
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Employer
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Total
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
                          
                          <td colSpan={7} className="py-16 text-center">
                            
                            <div className="flex flex-col items-center gap-2">
                              
                              <FileText className="h-10 w-10 text-brand-300" />
                              <p className="font-medium text-brand-800">
                                No statements found
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
                              
                              <div className="flex items-center gap-2.5">
                                
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white text-xs font-bold shrink-0">
                                  
                                  {row.month.charAt(0)}
                                </div>
                                <div>
                                  
                                  <div className="font-semibold text-brand-900 text-sm">
                                    
                                    {row.month} {row.year}
                                  </div>
                                  <div className="text-[11px] text-brand-700">
                                    
                                    {row.challanNo}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              
                              {fmt(row.insuredWages)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right text-brand-900">
                              
                              {fmt(row.employerContribution)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              
                              {fmt(row.totalContribution)}
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
                                  onClick={() => openStatement(row)}
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
                      Insured Wages
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      
                      {fmt(summary.insuredWages)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  
                  <CardContent className="p-4 text-center">
                    
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Employee Share
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      
                      {fmt(summary.employee)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  
                  <CardContent className="p-4 text-center">
                    
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Employer Share
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      
                      {fmt(summary.employer)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  
                  <CardContent className="p-4 text-center">
                    
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Total Contribution
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      
                      {fmt(summary.total)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Details modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        
        {selectedStatement && (
          <DialogContent className="sm:max-w-[760px] border border-gray-200 bg-white p-0 overflow-hidden">
            
            <div className="bg-brand-900 px-6 py-4">
              
              <DialogHeader>
                
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  
                  <ShieldCheck className="h-4 w-4 opacity-80" /> EOBI Statement
                  Details
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                
                {selectedStatement.contributionMonth} · {EMPLOYEE.name} ·
                {EMPLOYEE.eobiNo}
              </DialogDescription>
            </div>
            <div className="px-6 py-5 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Insured Wages
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedStatement.insuredWages)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Employee
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedStatement.employeeContribution)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Employer
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedStatement.employerContribution)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Total
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedStatement.totalContribution)}
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
                      
                      Insured employee information
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    
                    <DetailRow label="Employee ID" value={EMPLOYEE.id} />
                    <DetailRow label="Name" value={EMPLOYEE.name} />
                    <DetailRow
                      label="Designation"
                      value={EMPLOYEE.designation}
                    />
                    <DetailRow label="Department" value={EMPLOYEE.department} />
                    <DetailRow label="EOBI No" value={EMPLOYEE.eobiNo} />
                    <DetailRow label="CNIC" value={EMPLOYEE.cnic} />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    
                    <h4 className="font-semibold text-brand-900">
                      Statement Details
                    </h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      
                      Month-wise contribution details
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    
                    <DetailRow
                      label="Contribution Month"
                      value={selectedStatement.contributionMonth}
                    />
                    <DetailRow
                      label="Challan No"
                      value={selectedStatement.challanNo}
                    />
                    <DetailRow
                      label="Payment Date"
                      value={selectedStatement.paymentDate || "—"}
                    />
                    <DetailRow
                      label="Status"
                      value={selectedStatement.status}
                    />
                    <DetailRow
                      label="Remarks"
                      value={selectedStatement.remarks}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                
                <div className="space-y-1">
                  
                  <p className="text-sm text-brand-700">
                    
                    Joining Date:
                    <span className="font-medium text-brand-900">
                      {EMPLOYEE.joiningDate}
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
                  <Badge className={statusClasses[selectedStatement.status]}>
                    
                    {selectedStatement.status}
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
                
                <Download className="h-4 w-4 mr-2" /> Download Statement
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
