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
  Wallet,
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
  Building2,
  Shield,
  TrendingUp,
  User,
  Briefcase,
} from "lucide-react";
/* -------------------------------------------------------------------------- */ /* Types */ /* -------------------------------------------------------------------------- */ type PFTab =
  "overview" | "history";
type PFStatus = "Posted" | "Pending" | "Adjusted";
type PFStatementRow = {
  id: number;
  month: string;
  year: number;
  statementMonth: string;
  basicSalary: number;
  employeeContribution: number;
  employerContribution: number;
  voluntaryContribution: number;
  profit: number;
  totalCredited: number;
  runningBalance: number;
  postingDate: string | null;
  voucherNo: string;
  status: PFStatus;
  remarks: string;
};
type PFViewRow = PFStatementRow & { sr: number };
/* -------------------------------------------------------------------------- */ /* Constants */ /* -------------------------------------------------------------------------- */ const DEFAULT_PER_PAGE = 10;
const EMPLOYEE = {
  id: "EMP001",
  name: "Muqadas Mazhar",
  designation: "Sr. Software Engineer",
  department: "Engineering",
  pfNo: "PF-102784",
  cnic: "35202-1234567-8",
  joiningDate: "2022-01-15",
  pfJoinDate: "2022-02-01",
};
const PF_ROWS: PFStatementRow[] = [
  {
    id: 1,
    month: "June",
    year: 2025,
    statementMonth: "June 2025",
    basicSalary: 120000,
    employeeContribution: 14400,
    employerContribution: 14400,
    voluntaryContribution: 2000,
    profit: 1800,
    totalCredited: 32600,
    runningBalance: 512600,
    postingDate: "2025-07-03",
    voucherNo: "PF-250601",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 2,
    month: "May",
    year: 2025,
    statementMonth: "May 2025",
    basicSalary: 120000,
    employeeContribution: 14400,
    employerContribution: 14400,
    voluntaryContribution: 2000,
    profit: 1700,
    totalCredited: 32500,
    runningBalance: 480000,
    postingDate: "2025-06-04",
    voucherNo: "PF-250502",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 3,
    month: "April",
    year: 2025,
    statementMonth: "April 2025",
    basicSalary: 120000,
    employeeContribution: 14400,
    employerContribution: 14400,
    voluntaryContribution: 2000,
    profit: 1650,
    totalCredited: 32450,
    runningBalance: 447500,
    postingDate: "2025-05-05",
    voucherNo: "PF-250403",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 4,
    month: "March",
    year: 2025,
    statementMonth: "March 2025",
    basicSalary: 120000,
    employeeContribution: 14400,
    employerContribution: 14400,
    voluntaryContribution: 1500,
    profit: 1600,
    totalCredited: 31900,
    runningBalance: 415050,
    postingDate: "2025-04-03",
    voucherNo: "PF-250304",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 5,
    month: "February",
    year: 2025,
    statementMonth: "February 2025",
    basicSalary: 120000,
    employeeContribution: 14400,
    employerContribution: 14400,
    voluntaryContribution: 1500,
    profit: 1550,
    totalCredited: 31850,
    runningBalance: 383150,
    postingDate: "2025-03-05",
    voucherNo: "PF-250205",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 6,
    month: "January",
    year: 2025,
    statementMonth: "January 2025",
    basicSalary: 120000,
    employeeContribution: 14400,
    employerContribution: 14400,
    voluntaryContribution: 1500,
    profit: 1500,
    totalCredited: 31800,
    runningBalance: 351300,
    postingDate: "2025-02-06",
    voucherNo: "PF-250106",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 7,
    month: "December",
    year: 2024,
    statementMonth: "December 2024",
    basicSalary: 115000,
    employeeContribution: 13800,
    employerContribution: 13800,
    voluntaryContribution: 1000,
    profit: 1450,
    totalCredited: 30050,
    runningBalance: 319500,
    postingDate: "2025-01-05",
    voucherNo: "PF-241207",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 8,
    month: "November",
    year: 2024,
    statementMonth: "November 2024",
    basicSalary: 115000,
    employeeContribution: 13800,
    employerContribution: 13800,
    voluntaryContribution: 1000,
    profit: 1400,
    totalCredited: 30000,
    runningBalance: 289450,
    postingDate: "2024-12-04",
    voucherNo: "PF-241108",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 9,
    month: "October",
    year: 2024,
    statementMonth: "October 2024",
    basicSalary: 115000,
    employeeContribution: 13800,
    employerContribution: 13800,
    voluntaryContribution: 1000,
    profit: 1350,
    totalCredited: 29950,
    runningBalance: 259450,
    postingDate: null,
    voucherNo: "PF-241009",
    status: "Pending",
    remarks: "Waiting for month-end posting",
  },
  {
    id: 10,
    month: "September",
    year: 2024,
    statementMonth: "September 2024",
    basicSalary: 115000,
    employeeContribution: 13800,
    employerContribution: 13800,
    voluntaryContribution: 1000,
    profit: 1300,
    totalCredited: 29900,
    runningBalance: 229500,
    postingDate: "2024-10-04",
    voucherNo: "PF-240910",
    status: "Adjusted",
    remarks: "Adjusted after salary revision",
  },
  {
    id: 11,
    month: "August",
    year: 2024,
    statementMonth: "August 2024",
    basicSalary: 115000,
    employeeContribution: 13800,
    employerContribution: 13800,
    voluntaryContribution: 1000,
    profit: 1250,
    totalCredited: 29850,
    runningBalance: 199600,
    postingDate: "2024-09-03",
    voucherNo: "PF-240811",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
  {
    id: 12,
    month: "July",
    year: 2024,
    statementMonth: "July 2024",
    basicSalary: 115000,
    employeeContribution: 13800,
    employerContribution: 13800,
    voluntaryContribution: 1000,
    profit: 1200,
    totalCredited: 29800,
    runningBalance: 169750,
    postingDate: "2024-08-03",
    voucherNo: "PF-240712",
    status: "Posted",
    remarks: "Monthly PF posted successfully",
  },
];
const statusClasses: Record<PFStatus, string> = {
  Posted: "bg-brand-700 text-white border-transparent hover:bg-brand-700",
  Pending:
    "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
  Adjusted: "bg-brand-600 text-white border-transparent hover:bg-brand-600",
};
const STATUS_OPTIONS: Array<"all" | PFStatus> = [
  "all",
  "Posted",
  "Pending",
  "Adjusted",
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
      <span className="font-medium text-brand-900 text-right">
        {value}
      </span>
    </div>
  );
}
/* -------------------------------------------------------------------------- */ /* Component */ /* -------------------------------------------------------------------------- */ export default function PFStatementModule() {
  const [activeTab, setActiveTab] = useState<PFTab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PFStatus>("all");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PFStatementRow | null>(null);
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
  const latestRow = PF_ROWS[0];
  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PF_ROWS.filter((row) => {
      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;
      const haystack =
        `${row.month} ${row.year} ${row.voucherNo} ${row.status} ${row.remarks}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [q, statusFilter]);
  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;
  const rows: PFViewRow[] = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRows
      .slice(start, start + perPage)
      .map((item, index) => ({ sr: start + index + 1, ...item }));
  }, [filteredRows, currentPage, perPage]);
  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.basicSalary += row.basicSalary;
        acc.employee += row.employeeContribution;
        acc.employer += row.employerContribution;
        acc.voluntary += row.voluntaryContribution;
        acc.profit += row.profit;
        acc.total += row.totalCredited;
        if (row.status === "Posted") acc.posted += 1;
        if (row.status === "Pending") acc.pending += 1;
        if (row.status === "Adjusted") acc.adjusted += 1;
        return acc;
      },
      {
        basicSalary: 0,
        employee: 0,
        employer: 0,
        voluntary: 0,
        profit: 0,
        total: 0,
        posted: 0,
        pending: 0,
        adjusted: 0,
      },
    );
  }, [filteredRows]);
  const overallBalance = useMemo(() => PF_ROWS[0]?.runningBalance ?? 0, []);
  const totalEmployeeShare = useMemo(
    () => PF_ROWS.reduce((sum, row) => sum + row.employeeContribution, 0),
    [],
  );
  const totalEmployerShare = useMemo(
    () => PF_ROWS.reduce((sum, row) => sum + row.employerContribution, 0),
    [],
  );
  const totalProfit = useMemo(
    () => PF_ROWS.reduce((sum, row) => sum + row.profit, 0),
    [],
  );
  const openRow = (row: PFStatementRow) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };
  return (
    <div className="p-3 bg-white min-h-screen">
      
      <Card className="border border-gray-200 shadow-sm">
        
        <CardHeader className="border-b border-gray-200">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="flex items-start gap-3">
              
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 shrink-0">
                
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                
                <CardTitle className="text-2xl font-bold text-brand-900">
                  
                  PF Statement
                </CardTitle>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  
                  <Badge className="bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100">
                    
                    <User className="h-3 w-3 mr-1" /> {EMPLOYEE.id}
                  </Badge>
                  <span className="text-sm text-brand-700">
                    
                    {EMPLOYEE.name} · {EMPLOYEE.designation}
                  </span>
                  <span className="text-sm text-brand-700">
                    
                    PF No: {EMPLOYEE.pfNo}
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
              title="Current PF Balance"
              value={fmt(overallBalance)}
              subtitle="Latest running balance"
              icon={Wallet}
            />
            <StatCard
              title="Employee Share"
              value={fmt(totalEmployeeShare)}
              subtitle="Total employee contribution"
              icon={Briefcase}
            />
            <StatCard
              title="Employer Share"
              value={fmt(totalEmployerShare)}
              subtitle="Total employer contribution"
              icon={Building2}
            />
            <StatCard
              title="Accumulated Profit"
              value={fmt(totalProfit)}
              subtitle="Profit credited so far"
              icon={TrendingUp}
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
              
              Contribution History
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
                    
                    {latestRow.statementMonth}
                  </span>
                  <span className="text-brand-700"> · Status: </span>
                  <Badge className={statusClasses[latestRow.status]}>
                    
                    {latestRow.status}
                  </Badge>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      
                      {fmt(latestRow.employeeContribution)}
                    </span>
                    Employee
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      
                      {fmt(latestRow.employerContribution)}
                    </span>
                    Employer
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
                    <DetailRow label="PF No" value={EMPLOYEE.pfNo} />
                    <DetailRow label="CNIC" value={EMPLOYEE.cnic} />
                    <DetailRow
                      label="Joining Date"
                      value={EMPLOYEE.joiningDate}
                    />
                    <DetailRow
                      label="PF Join Date"
                      value={EMPLOYEE.pfJoinDate}
                    />
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  
                  <CardHeader className="border-b border-gray-200 pb-4">
                    
                    <CardTitle className="text-brand-900 text-base">
                      
                      Latest PF Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    
                    <DetailRow
                      label="Statement Month"
                      value={latestRow.statementMonth}
                    />
                    <DetailRow
                      label="Basic Salary"
                      value={fmt(latestRow.basicSalary)}
                    />
                    <DetailRow
                      label="Employee Contribution"
                      value={fmt(latestRow.employeeContribution)}
                    />
                    <DetailRow
                      label="Employer Contribution"
                      value={fmt(latestRow.employerContribution)}
                    />
                    <DetailRow
                      label="Voluntary Contribution"
                      value={fmt(latestRow.voluntaryContribution)}
                    />
                    <DetailRow label="Profit" value={fmt(latestRow.profit)} />
                    <DetailRow
                      label="Total Credited"
                      value={fmt(latestRow.totalCredited)}
                    />
                    <DetailRow
                      label="Running Balance"
                      value={fmt(latestRow.runningBalance)}
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
                    placeholder="Search by month, voucher no, status..."
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
                      setStatusFilter(v as "all" | PFStatus)
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
                      {summary.posted}
                    </span>
                    Posted
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
                      {summary.adjusted}
                    </span>
                    Adjusted
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
                          
                          Employee
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Employer
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Profit
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Balance
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
                                No PF records found
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
                                    
                                    {row.voucherNo}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              
                              {fmt(row.employeeContribution)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right text-brand-900">
                              
                              {fmt(row.employerContribution)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              
                              {fmt(row.profit)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              
                              {fmt(row.runningBalance)}
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
                      Profit
                    </p>
                    <p className="text-xl font-bold text-brand-900 mt-1">
                      
                      {fmt(summary.profit)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 shadow-none">
                  
                  <CardContent className="p-4 text-center">
                    
                    <p className="text-xs text-brand-700 uppercase tracking-wide">
                      Total Credited
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
        
        {selectedRow && (
          <DialogContent className="sm:max-w-[780px] border border-gray-200 bg-white p-0 overflow-hidden">
            
            <div className="bg-brand-900 px-6 py-4">
              
              <DialogHeader>
                
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  
                  <Shield className="h-4 w-4 opacity-80" /> PF Statement
                  Details
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                
                {selectedRow.statementMonth} · {EMPLOYEE.name} ·
                {EMPLOYEE.pfNo}
              </DialogDescription>
            </div>
            <div className="px-6 py-5 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Basic Salary
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedRow.basicSalary)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Employee
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedRow.employeeContribution)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Employer
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedRow.employerContribution)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Balance
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedRow.runningBalance)}
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
                      
                      Provident fund member information
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
                    <DetailRow label="PF No" value={EMPLOYEE.pfNo} />
                    <DetailRow
                      label="PF Join Date"
                      value={EMPLOYEE.pfJoinDate}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    
                    <h4 className="font-semibold text-brand-900">
                      Contribution Details
                    </h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      
                      Month-wise PF posting details
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    
                    <DetailRow
                      label="Statement Month"
                      value={selectedRow.statementMonth}
                    />
                    <DetailRow
                      label="Voucher No"
                      value={selectedRow.voucherNo}
                    />
                    <DetailRow
                      label="Voluntary Contribution"
                      value={fmt(selectedRow.voluntaryContribution)}
                    />
                    <DetailRow label="Profit" value={fmt(selectedRow.profit)} />
                    <DetailRow
                      label="Total Credited"
                      value={fmt(selectedRow.totalCredited)}
                    />
                    <DetailRow
                      label="Posting Date"
                      value={selectedRow.postingDate || "—"}
                    />
                    <DetailRow label="Status" value={selectedRow.status} />
                    <DetailRow
                      label="Remarks"
                      value={selectedRow.remarks}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                
                <div className="space-y-1">
                  
                  <p className="text-sm text-brand-700">
                    
                    CNIC:
                    <span className="font-medium text-brand-900">
                      {EMPLOYEE.cnic}
                    </span>
                  </p>
                  <p className="text-sm text-brand-700">
                    
                    Joining Date:
                    <span className="font-medium text-brand-900">
                      {EMPLOYEE.joiningDate}
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
                
                <Download className="h-4 w-4 mr-2" /> Download Statement
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
