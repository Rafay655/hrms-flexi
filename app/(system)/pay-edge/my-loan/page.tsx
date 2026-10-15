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
  Building2,
  FileText,
  Briefcase,
} from "lucide-react";
/* -------------------------------------------------------------------------- */ /* Types */ /* -------------------------------------------------------------------------- */ type LoanTab =
  "overview" | "history" | "request";
type LoanStatus = "Active" | "Closed" | "Pending Approval" | "Rejected";
type PaymentStatus = "Paid" | "Upcoming" | "Overdue";
type PaymentHistoryItem = {
  id: number;
  date: string;
  amount: number;
  status: PaymentStatus;
};
type LoanRecord = {
  id: number;
  loanNo: string;
  type: string;
  appliedOn: string;
  principal: number;
  outstanding: number;
  monthlyInstallment: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  purpose: string;
  approvedBy: string;
  paidInstallments: number;
  totalInstallments: number;
  nextDueDate: string | null;
  paymentHistory: PaymentHistoryItem[];
};
type RequestForm = {
  type: string;
  amount: string;
  tenure: string;
  startDate: string;
  purpose: string;
};
/* -------------------------------------------------------------------------- */ /* Constants */ /* -------------------------------------------------------------------------- */ const DEFAULT_PER_PAGE = 10;
const LOAN_TYPES = [
  "Salary Advance",
  "Personal Loan",
  "Emergency Loan",
  "Medical Loan",
  "Vehicle Loan",
  "Education Loan",
];
const STATUS_OPTIONS: Array<"all" | LoanStatus> = [
  "all",
  "Active",
  "Closed",
  "Pending Approval",
  "Rejected",
];
const INITIAL_LOANS: LoanRecord[] = [
  {
    id: 1,
    loanNo: "LN-0001",
    type: "Personal Loan",
    appliedOn: "2025-01-08",
    principal: 300000,
    outstanding: 180000,
    monthlyInstallment: 25000,
    interestRate: 6.5,
    startDate: "2025-02-01",
    endDate: "2026-01-01",
    status: "Active",
    purpose: "Home renovation",
    approvedBy: "HR Manager",
    paidInstallments: 5,
    totalInstallments: 12,
    nextDueDate: "2025-07-01",
    paymentHistory: [
      { id: 1, date: "2025-02-01", amount: 25000, status: "Paid" },
      { id: 2, date: "2025-03-01", amount: 25000, status: "Paid" },
      { id: 3, date: "2025-04-01", amount: 25000, status: "Paid" },
      { id: 4, date: "2025-05-01", amount: 25000, status: "Paid" },
      { id: 5, date: "2025-06-01", amount: 25000, status: "Paid" },
      { id: 6, date: "2025-07-01", amount: 25000, status: "Upcoming" },
    ],
  },
  {
    id: 2,
    loanNo: "LN-0002",
    type: "Salary Advance",
    appliedOn: "2025-03-12",
    principal: 120000,
    outstanding: 90000,
    monthlyInstallment: 15000,
    interestRate: 0,
    startDate: "2025-04-01",
    endDate: "2025-11-01",
    status: "Active",
    purpose: "Family support",
    approvedBy: "Finance Lead",
    paidInstallments: 2,
    totalInstallments: 8,
    nextDueDate: "2025-07-01",
    paymentHistory: [
      { id: 1, date: "2025-04-01", amount: 15000, status: "Paid" },
      { id: 2, date: "2025-05-01", amount: 15000, status: "Paid" },
      { id: 3, date: "2025-06-01", amount: 15000, status: "Overdue" },
      { id: 4, date: "2025-07-01", amount: 15000, status: "Upcoming" },
    ],
  },
  {
    id: 3,
    loanNo: "LN-0003",
    type: "Medical Loan",
    appliedOn: "2024-08-15",
    principal: 200000,
    outstanding: 0,
    monthlyInstallment: 20000,
    interestRate: 4,
    startDate: "2024-09-01",
    endDate: "2025-06-01",
    status: "Closed",
    purpose: "Medical treatment",
    approvedBy: "Operations Manager",
    paidInstallments: 10,
    totalInstallments: 10,
    nextDueDate: null,
    paymentHistory: [
      { id: 1, date: "2024-09-01", amount: 20000, status: "Paid" },
      { id: 2, date: "2024-10-01", amount: 20000, status: "Paid" },
      { id: 3, date: "2024-11-01", amount: 20000, status: "Paid" },
      { id: 4, date: "2024-12-01", amount: 20000, status: "Paid" },
      { id: 5, date: "2025-01-01", amount: 20000, status: "Paid" },
      { id: 6, date: "2025-02-01", amount: 20000, status: "Paid" },
      { id: 7, date: "2025-03-01", amount: 20000, status: "Paid" },
      { id: 8, date: "2025-04-01", amount: 20000, status: "Paid" },
      { id: 9, date: "2025-05-01", amount: 20000, status: "Paid" },
      { id: 10, date: "2025-06-01", amount: 20000, status: "Paid" },
    ],
  },
  {
    id: 4,
    loanNo: "LN-0004",
    type: "Vehicle Loan",
    appliedOn: "2025-06-20",
    principal: 450000,
    outstanding: 450000,
    monthlyInstallment: 37500,
    interestRate: 7.25,
    startDate: "2025-08-01",
    endDate: "2026-07-01",
    status: "Pending Approval",
    purpose: "Motorbike purchase",
    approvedBy: "Pending",
    paidInstallments: 0,
    totalInstallments: 12,
    nextDueDate: "2025-08-01",
    paymentHistory: [],
  },
  {
    id: 5,
    loanNo: "LN-0005",
    type: "Emergency Loan",
    appliedOn: "2025-02-02",
    principal: 80000,
    outstanding: 80000,
    monthlyInstallment: 10000,
    interestRate: 0,
    startDate: "2025-03-01",
    endDate: "2025-10-01",
    status: "Rejected",
    purpose: "Unexpected expenses",
    approvedBy: "Finance Committee",
    paidInstallments: 0,
    totalInstallments: 8,
    nextDueDate: null,
    paymentHistory: [],
  },
];
const loanStatusClasses: Record<LoanStatus, string> = {
  Active: "bg-brand-700 text-white border-transparent hover:bg-brand-700",
  Closed:
    "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
  "Pending Approval":
    "bg-brand-600 text-white border-transparent hover:bg-brand-600",
  Rejected: "bg-brand-900 text-white border-transparent hover:bg-brand-900",
};
const paymentStatusClasses: Record<PaymentStatus, string> = {
  Paid: "bg-brand-700 text-white border-transparent hover:bg-brand-700",
  Upcoming:
    "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
  Overdue: "bg-brand-600 text-white border-transparent hover:bg-brand-600",
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
    <div className="flex items-center justify-between text-sm">
      
      <span className="text-brand-700">{label}</span>
      <span className="font-medium text-brand-900">{value}</span>
    </div>
  );
}
/* -------------------------------------------------------------------------- */ /* Component */ /* -------------------------------------------------------------------------- */ export default function MyLoanModule() {
  const [activeTab, setActiveTab] = useState<LoanTab>("overview");
  const [loans, setLoans] = useState<LoanRecord[]>(INITIAL_LOANS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [form, setForm] = useState<RequestForm>({
    type: "",
    amount: "",
    tenure: "12",
    startDate: "",
    purpose: "",
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
  const activeLoans = useMemo(
    () => loans.filter((loan) => loan.status === "Active"),
    [loans],
  );
  const pendingLoans = useMemo(
    () => loans.filter((loan) => loan.status === "Pending Approval"),
    [loans],
  );
  const outstandingTotal = useMemo(
    () =>
      loans
        .filter((loan) => loan.status === "Active")
        .reduce((sum, loan) => sum + loan.outstanding, 0),
    [loans],
  );
  const monthlyInstallmentTotal = useMemo(
    () =>
      loans
        .filter((loan) => loan.status === "Active")
        .reduce((sum, loan) => sum + loan.monthlyInstallment, 0),
    [loans],
  );
  const filteredLoans = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return loans.filter((loan) => {
      const matchesStatus =
        statusFilter === "all" ? true : loan.status === statusFilter;
      const haystack =
        `${loan.loanNo} ${loan.type} ${loan.status} ${loan.purpose} ${loan.approvedBy}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [loans, q, statusFilter]);
  const totalEntries = filteredLoans.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo =
    totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;
  const historyRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredLoans
      .slice(start, start + perPage)
      .map((loan, index) => ({ sr: start + index + 1, ...loan }));
  }, [filteredLoans, currentPage, perPage]);
  const loanSummary = useMemo(() => {
    return filteredLoans.reduce(
      (acc, loan) => {
        acc.principal += loan.principal;
        acc.outstanding += loan.outstanding;
        if (loan.status === "Active") acc.active += 1;
        if (loan.status === "Pending Approval") acc.pending += 1;
        if (loan.status === "Closed") acc.closed += 1;
        if (loan.status === "Rejected") acc.rejected += 1;
        return acc;
      },
      {
        principal: 0,
        outstanding: 0,
        active: 0,
        pending: 0,
        closed: 0,
        rejected: 0,
      },
    );
  }, [filteredLoans]);
  const upcomingRepayments = useMemo(
    () =>
      loans
        .filter((loan) => loan.status === "Active" && loan.nextDueDate)
        .sort((a, b) =>
          String(a.nextDueDate).localeCompare(String(b.nextDueDate)),
        ),
    [loans],
  );
  const estimatedEMI = useMemo(() => {
    const amount = Number(form.amount || 0);
    const tenure = Number(form.tenure || 1);
    if (!amount || !tenure) return 0;
    return Math.round(amount / tenure);
  }, [form.amount, form.tenure]);
  const openLoan = (loan: LoanRecord) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  };
  const resetForm = () => {
    setForm({ type: "", amount: "", tenure: "12", startDate: "", purpose: "" });
  };
  const handleSubmitRequest = () => {
    setSubmitMessage(null);
    const amount = Number(form.amount);
    const tenure = Number(form.tenure);
    if (
      !form.type ||
      !amount ||
      !tenure ||
      !form.startDate ||
      !form.purpose.trim()
    ) {
      setSubmitMessage(
        "Please fill all required fields before submitting the request.",
      );
      return;
    }
    const newId = loans.length ? Math.max(...loans.map((l) => l.id)) + 1 : 1;
    const newLoan: LoanRecord = {
      id: newId,
      loanNo: `LN-${String(newId).padStart(4, "0")}`,
      type: form.type,
      appliedOn: new Date().toISOString().slice(0, 10),
      principal: amount,
      outstanding: amount,
      monthlyInstallment: Math.round(amount / tenure),
      interestRate: 0,
      startDate: form.startDate,
      endDate: "-",
      status: "Pending Approval",
      purpose: form.purpose.trim(),
      approvedBy: "Pending",
      paidInstallments: 0,
      totalInstallments: tenure,
      nextDueDate: form.startDate,
      paymentHistory: [],
    };
    setLoans((prev) => [newLoan, ...prev]);
    setSubmitMessage(`Loan request ${newLoan.loanNo} submitted successfully.`);
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
                  
                  My Loans
                </CardTitle>
                <p className="text-sm text-brand-700 mt-1">
                  
                  Manage your active loans, repayment history, and new loan
                  requests.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              
              <Button
                className="bg-brand-800 hover:bg-brand-900 text-white gap-2"
                onClick={() => setActiveTab("request")}
              >
                
                <Plus className="h-4 w-4" /> New Loan Request
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            <StatCard
              title="Active Loans"
              value={String(activeLoans.length)}
              subtitle="Currently running loans"
              icon={CheckCircle2}
            />
            <StatCard
              title="Outstanding Balance"
              value={fmt(outstandingTotal)}
              subtitle="Across active loans"
              icon={Wallet}
            />
            <StatCard
              title="Monthly EMI"
              value={fmt(monthlyInstallmentTotal)}
              subtitle="Total monthly deductions"
              icon={Calendar}
            />
            <StatCard
              title="Pending Requests"
              value={String(pendingLoans.length)}
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
              
              Loan History
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
              
              Request Loan
            </Button>
          </div>
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
                
                <div className="text-sm">
                  
                  <span className="text-brand-700">
                    You currently have
                  </span>
                  <span className="font-semibold text-brand-900">
                    {activeLoans.length}
                  </span>
                  <span className="text-brand-700">
                    
                    active loan(s) with outstanding balance of
                  </span>
                  <span className="font-semibold text-brand-900">
                    {fmt(outstandingTotal)}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      {loanSummary.pending}
                    </span>
                    Pending
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      {loanSummary.closed}
                    </span>
                    Closed
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                
                <Card className="border border-gray-200 shadow-none">
                  
                  <CardHeader className="border-b border-gray-200 pb-4">
                    
                    <CardTitle className="text-brand-900 text-base">
                      
                      Active Loans
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    
                    {activeLoans.length === 0 ? (
                      <div className="py-10 text-center">
                        
                        <p className="font-medium text-brand-800">
                          No active loans
                        </p>
                        <p className="text-sm text-brand-600 mt-1">
                          
                          Apply for a new loan from the request tab
                        </p>
                      </div>
                    ) : (
                      activeLoans.map((loan) => {
                        const progress =
                          loan.totalInstallments > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (loan.paidInstallments /
                                    loan.totalInstallments) *
                                    100,
                                ),
                              )
                            : 0;
                        return (
                          <div
                            key={loan.id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-brand-100 transition-colors"
                          >
                            
                            <div className="flex items-start justify-between gap-3">
                              
                              <div>
                                
                                <div className="flex items-center gap-2 flex-wrap">
                                  
                                  <h3 className="font-semibold text-brand-900">
                                    
                                    {loan.loanNo}
                                  </h3>
                                  <Badge
                                    className={loanStatusClasses[loan.status]}
                                  >
                                    
                                    {loan.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-brand-700 mt-1">
                                  {loan.type}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openLoan(loan)}
                                className="text-brand-800 hover:text-brand-900 hover:bg-brand-100"
                              >
                                
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              
                              <div>
                                
                                <p className="text-xs text-brand-700 uppercase tracking-wide">
                                  
                                  Outstanding
                                </p>
                                <p className="font-semibold text-brand-900 mt-1">
                                  
                                  {fmt(loan.outstanding)}
                                </p>
                              </div>
                              <div>
                                
                                <p className="text-xs text-brand-700 uppercase tracking-wide">
                                  
                                  Monthly EMI
                                </p>
                                <p className="font-semibold text-brand-900 mt-1">
                                  
                                  {fmt(loan.monthlyInstallment)}
                                </p>
                              </div>
                              <div>
                                
                                <p className="text-xs text-brand-700 uppercase tracking-wide">
                                  
                                  Next Due
                                </p>
                                <p className="font-semibold text-brand-900 mt-1">
                                  
                                  {loan.nextDueDate || "—"}
                                </p>
                              </div>
                              <div>
                                
                                <p className="text-xs text-brand-700 uppercase tracking-wide">
                                  
                                  Interest
                                </p>
                                <p className="font-semibold text-brand-900 mt-1">
                                  
                                  {loan.interestRate}%
                                </p>
                              </div>
                            </div>
                            <div className="mt-4">
                              
                              <div className="flex items-center justify-between text-xs text-brand-700 mb-2">
                                
                                <span>Repayment progress</span>
                                <span>
                                  
                                  {loan.paidInstallments}/
                                  {loan.totalInstallments} installments
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
                      
                      Upcoming Repayments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    
                    {upcomingRepayments.length === 0 ? (
                      <div className="py-10 text-center">
                        
                        <p className="font-medium text-brand-800">
                          No upcoming repayments
                        </p>
                        <p className="text-sm text-brand-600 mt-1">
                          
                          Active loan repayments will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        
                        {upcomingRepayments.map((loan) => (
                          <div
                            key={loan.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                          >
                            
                            <div className="flex items-center gap-3">
                              
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                                
                                <Calendar className="h-4 w-4 text-brand-800" />
                              </div>
                              <div>
                                
                                <p className="font-medium text-brand-900">
                                  {loan.loanNo}
                                </p>
                                <p className="text-sm text-brand-700">
                                  
                                  {loan.type} · Due {loan.nextDueDate}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              
                              <p className="font-semibold text-brand-900">
                                
                                {fmt(loan.monthlyInstallment)}
                              </p>
                              <p className="text-xs text-brand-700">
                                Monthly deduction
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-4">
              
              {submitMessage && (
                <div className="rounded-lg border border-gray-200 bg-brand-100 px-4 py-3 text-sm text-brand-900">
                  
                  {submitMessage}
                </div>
              )}
              <div className="flex flex-col lg:flex-row gap-4">
                
                <div className="relative flex-1">
                  
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                  <Input
                    placeholder="Search by loan no, type, purpose..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  
                  <span className="text-sm text-brand-700">Status</span>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as "all" | LoanStatus)
                    }
                  >
                    
                    <SelectTrigger className="w-44 border-gray-200 text-brand-800">
                      
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
                      {loanSummary.active}
                    </span>
                    Active
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      {loanSummary.pending}
                    </span>
                    Pending
                  </div>
                  <div className="h-3 w-px bg-brand-300" />
                  <div className="flex items-center gap-1.5 text-xs text-brand-700">
                    
                    <span className="font-semibold text-brand-900">
                      {loanSummary.closed}
                    </span>
                    Closed
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
                          
                          Loan
                        </th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Type
                        </th>
                        <th className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Applied On
                        </th>
                        <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          
                          Principal
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
                      
                      {historyRows.length === 0 ? (
                        <tr>
                          
                          <td colSpan={8} className="py-16 text-center">
                            
                            <div className="flex flex-col items-center gap-2">
                              
                              <FileText className="h-10 w-10 text-brand-300" />
                              <p className="font-medium text-brand-800">
                                No loan records found
                              </p>
                              <p className="text-sm text-brand-600">
                                
                                Try changing filters or submit a new
                                request
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        historyRows.map((loan) => (
                          <tr
                            key={loan.id}
                            className="hover:bg-brand-100 transition-colors group"
                          >
                            
                            <td className="py-3.5 px-5 text-sm font-medium text-brand-900">
                              
                              {loan.sr}
                            </td>
                            <td className="py-3.5 px-5 text-sm">
                              
                              <div className="flex items-center gap-2.5">
                                
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white text-xs font-bold shrink-0">
                                  
                                  {loan.loanNo.slice(-1)}
                                </div>
                                <div>
                                  
                                  <div className="font-semibold text-brand-900 text-sm">
                                    
                                    {loan.loanNo}
                                  </div>
                                  <div className="text-[11px] text-brand-700">
                                    
                                    {loan.purpose}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-sm text-brand-900">
                              {loan.type}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-brand-900">
                              {loan.appliedOn}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                              
                              {fmt(loan.principal)}
                            </td>
                            <td className="py-3.5 px-5 text-sm text-right text-brand-900">
                              
                              {fmt(loan.outstanding)}
                            </td>
                            <td className="py-3.5 px-5 text-sm">
                              
                              <Badge className={loanStatusClasses[loan.status]}>
                                {loan.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-5 text-sm">
                              
                              <div className="flex items-center justify-center gap-1">
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openLoan(loan)}
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
                {historyRows.length > 0 && (
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
            </div>
          )}
          {/* REQUEST */}
          {activeTab === "request" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              
              <Card className="border border-gray-200 shadow-none">
                
                <CardHeader className="border-b border-gray-200 pb-4">
                  
                  <CardTitle className="text-brand-900 text-base">
                    
                    Loan Request Form
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  
                  {submitMessage && (
                    <div className="rounded-lg border border-gray-200 bg-brand-100 px-4 py-3 text-sm text-brand-900">
                      
                      {submitMessage}
                    </div>
                  )}
                  <div className="space-y-2">
                    
                    <Label className="text-brand-800">Loan Type</Label>
                    <Select
                      value={form.type}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, type: value }))
                      }
                    >
                      
                      <SelectTrigger className="border-gray-200 text-brand-900">
                        
                        <SelectValue placeholder="Select loan type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        
                        {LOAN_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-2">
                      
                      <Label className="text-brand-800">
                        Requested Amount
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g. 150000"
                        value={form.amount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        className="border-gray-200 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                      />
                    </div>
                    <div className="space-y-2">
                      
                      <Label className="text-brand-800">
                        Tenure (Months)
                      </Label>
                      <Select
                        value={form.tenure}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, tenure: value }))
                        }
                      >
                        
                        <SelectTrigger className="border-gray-200 text-brand-900">
                          
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          
                          {["3", "6", "9", "12", "18", "24"].map((month) => (
                            <SelectItem key={month} value={month}>
                              
                              {month} Months
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    
                    <Label className="text-brand-800">
                      Preferred Deduction Start Date
                    </Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="border-gray-200 text-brand-900 focus:border-brand-800 focus:ring-brand-800"
                    />
                  </div>
                  <div className="space-y-2">
                    
                    <Label className="text-brand-800">Purpose</Label>
                    <textarea
                      value={form.purpose}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          purpose: e.target.value,
                        }))
                      }
                      placeholder="Write the reason for this loan request..."
                      rows={5}
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
                        setSubmitMessage(null);
                      }}
                    >
                      
                      Clear
                    </Button>
                    <Button
                      type="button"
                      className="bg-brand-800 hover:bg-brand-900 text-white"
                      onClick={handleSubmitRequest}
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
                          
                          Estimated EMI
                        </p>
                        <p className="text-xl font-bold text-brand-900 mt-1">
                          
                          {fmt(estimatedEMI)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    
                    <div className="space-y-3">
                      
                      <DetailRow
                        label="Loan Type"
                        value={form.type || "—"}
                      />
                      <DetailRow
                        label="Tenure"
                        value={form.tenure ? `${form.tenure} months` : "—"}
                      />
                      <DetailRow
                        label="Start Date"
                        value={form.startDate || "—"}
                      />
                      <DetailRow
                        label="Estimated Monthly Deduction"
                        value={fmt(estimatedEMI)}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                    
                    <p className="text-sm font-medium text-brand-900 mb-2">
                      
                      Important note
                    </p>
                    <p className="text-sm text-brand-700">
                      
                      This module uses dummy calculations for UI preview. Actual
                      approval, interest, and repayment schedule may vary based
                      on HR and finance policy.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    
                    <p className="text-sm font-medium text-brand-900 mb-3">
                      
                      Loan policy snapshot
                    </p>
                    <div className="space-y-2 text-sm text-brand-700">
                      
                      <div className="flex items-center justify-between">
                        
                        <span>Minimum tenure</span>
                        <span className="font-medium text-brand-900">
                          3 months
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        
                        <span>Maximum tenure</span>
                        <span className="font-medium text-brand-900">
                          24 months
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        
                        <span>Approval workflow</span>
                        <span className="font-medium text-brand-900">
                          HR → Finance
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        
                        <span>Deduction mode</span>
                        <span className="font-medium text-brand-900">
                          Monthly payroll
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Loan details modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        
        {selectedLoan && (
          <DialogContent className="sm:max-w-[820px] border border-gray-200 bg-white p-0 overflow-hidden">
            
            <div className="bg-brand-900 px-6 py-4">
              
              <DialogHeader>
                
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  
                  <Wallet className="h-4 w-4 opacity-80" /> Loan Details
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                
                {selectedLoan.loanNo} · {selectedLoan.type} ·
                {selectedLoan.status}
              </DialogDescription>
            </div>
            <div className="px-6 py-5 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Principal
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedLoan.principal)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Outstanding
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedLoan.outstanding)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Monthly EMI
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {fmt(selectedLoan.monthlyInstallment)}
                  </div>
                </div>
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Interest
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    
                    {selectedLoan.interestRate}%
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    
                    <h4 className="font-semibold text-brand-900">
                      Loan Information
                    </h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      
                      Core details of this loan
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    
                    <DetailRow
                      label="Loan No"
                      value={selectedLoan.loanNo}
                    />
                    <DetailRow label="Type" value={selectedLoan.type} />
                    <DetailRow
                      label="Applied On"
                      value={selectedLoan.appliedOn}
                    />
                    <DetailRow
                      label="Start Date"
                      value={selectedLoan.startDate}
                    />
                    <DetailRow label="End Date" value={selectedLoan.endDate} />
                    <DetailRow
                      label="Approved By"
                      value={selectedLoan.approvedBy}
                    />
                    <DetailRow
                      label="Purpose"
                      value={selectedLoan.purpose}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    
                    <h4 className="font-semibold text-brand-900">
                      Repayment Summary
                    </h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      
                      Installment and deduction details
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    
                    <DetailRow
                      label="Paid Installments"
                      value={`${selectedLoan.paidInstallments}/${selectedLoan.totalInstallments}`}
                    />
                    <DetailRow
                      label="Next Due Date"
                      value={selectedLoan.nextDueDate || "—"}
                    />
                    <DetailRow label="Status" value={selectedLoan.status} />
                    <div className="pt-2">
                      
                      <div className="flex items-center justify-between text-xs text-brand-700 mb-2">
                        
                        <span>Progress</span>
                        <span>
                          
                          {selectedLoan.paidInstallments}/
                          {selectedLoan.totalInstallments}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                        
                        <div
                          className="h-full rounded-full bg-brand-800"
                          style={{
                            width: `${selectedLoan.totalInstallments ? Math.min(100, Math.round((selectedLoan.paidInstallments / selectedLoan.totalInstallments) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                
                <div className="px-4 py-3 border-b border-gray-200 bg-white">
                  
                  <h4 className="font-semibold text-brand-900">
                    Payment History
                  </h4>
                  <p className="text-xs text-brand-700 mt-0.5">
                    
                    Installment-level repayment record
                  </p>
                </div>
                <div className="p-4">
                  
                  {selectedLoan.paymentHistory.length === 0 ? (
                    <div className="py-8 text-center">
                      
                      <p className="font-medium text-brand-800">
                        No payment history yet
                      </p>
                      <p className="text-sm text-brand-600 mt-1">
                        
                        Payments will appear here once deductions begin
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      
                      <table className="w-full">
                        
                        <thead className="border-b border-gray-200">
                          
                          <tr>
                            
                            <th className="py-2 px-2 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                              
                              Date
                            </th>
                            <th className="py-2 px-2 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                              
                              Amount
                            </th>
                            <th className="py-2 px-2 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                              
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-300/50">
                          
                          {selectedLoan.paymentHistory.map((item) => (
                            <tr key={item.id}>
                              
                              <td className="py-3 px-2 text-sm text-brand-900">
                                {item.date}
                              </td>
                              <td className="py-3 px-2 text-sm text-right font-medium text-brand-900">
                                
                                {fmt(item.amount)}
                              </td>
                              <td className="py-3 px-2 text-sm">
                                
                                <Badge
                                  className={paymentStatusClasses[item.status]}
                                >
                                  
                                  {item.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
