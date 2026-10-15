"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar,
  Download,
  Eye,
  Printer,
  TrendingUp,
  Wallet,
  User,
  FileText,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

/* ──────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ──────────────────────────────────────────────────────────── */
interface MyPayrollResponse {
  success: boolean;
  message: string;
  data: {
    employee: {
      id: string;
      code: string;
      name: string;
      designation: string;
    };
    summary_cards: {
      current_month_gross: number;
      current_month_net: number;
      current_month_date: string;
      ytd_gross: number;
      ytd_tax_paid: number;
      ytd_net: number;
    };
    current_payslip?: {
      period_status: string;
      gross_earnings: number;
      total_deductions: number;
      net_payable: number;
      earnings: { name: string; amount: number }[];
      deductions: { name: string; amount: number }[];
    };
    payroll_history: {
      period: string;
      gross: number;
      deductions: number;
      net_pay: number;
      status: string;
    }[];
    salary_structure: {
      effective_from: string;
      currency: string;
      monthly_basic: number;
      monthly_gross: number;
      annual_gross: number;
      components: {
        name: string;
        code: string;
        type: string;
        amount: number;
        percentage: number | null;
        calculation_type: string;
      }[];
    };
  };
}

const DEFAULT_PER_PAGE = 10;
type PayrollTab = "current" | "history" | "structure";

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const fmt = (n: number) =>
  n >= 10000000
    ? `PKR ${(n / 10000000).toFixed(2)}Cr`
    : n >= 100000
      ? `PKR ${(n / 100000).toFixed(1)}L`
      : `PKR ${n.toLocaleString()}`;

function LineItem({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-brand-700">{label}</span>
      <span className={`font-medium ${muted ? "text-brand-400" : "text-brand-900"}`}>{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-5 overflow-hidden border ${
        accent
          ? "bg-brand-800 border-brand-700 text-white"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`text-[11px] font-semibold uppercase tracking-widest mb-2 ${
              accent ? "text-brand-300" : "text-brand-600"
            }`}
          >
            {label}
          </p>
          <p
            className={`text-2xl font-bold leading-none truncate ${
              accent ? "text-white" : "text-brand-900"
            }`}
          >
            {value}
          </p>
          {sub && (
            <p className={`text-xs mt-2 ${accent ? "text-brand-300" : "text-brand-600"}`}>
              {sub}
            </p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            accent ? "bg-brand-700" : "bg-brand-100"
          }`}
        >
          <Icon className={`h-4 w-4 ${accent ? "text-brand-300" : "text-brand-700"}`} />
        </div>
      </div>
      {accent && (
        <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-brand-700 opacity-40" />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Page Component                                               */
/* ──────────────────────────────────────────────────────────── */
export default function EmployeePayroll() {
  const employeeUuid = "c4f68ad5-0b29-424d-937f-86e4db1709f9";

  const [activeTab, setActiveTab] = useState<PayrollTab>("current");
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const [selectedPayslip, setSelectedPayslip] = useState<{
    period: string;
    gross: number;
    deductions: number;
    net_pay: number;
    status: string;
    earnings?: { name: string; amount: number }[];
    deductions_details?: { name: string; amount: number }[];
  } | null>(null);

  const q = useDebounced(search, 400);

  const { data, isLoading } = useQuery<MyPayrollResponse>({
    queryKey: ["my-payroll", employeeUuid],
    queryFn: async () => {
      const { data } = await api.get<MyPayrollResponse>(
        `/pay-edge/employees/${employeeUuid}/my-payroll`
      );
      return data;
    },
    enabled: !!employeeUuid,
    staleTime: 5 * 60 * 1000,
  });

  const payroll = data?.data;
  const employee = payroll?.employee;

  // ── Safely extract current payslip with defaults ────
  const currentPayslip = payroll?.current_payslip;
  const earnings = currentPayslip?.earnings ?? [];
  const deductions = currentPayslip?.deductions ?? [];

  const years = useMemo(() => {
    if (!payroll?.payroll_history) return [];
    return [
      ...new Set(
        payroll.payroll_history.map((p) => {
          const match = p.period.match(/\d{4}/);
          return match ? Number(match[0]) : 0;
        })
      ),
    ].sort((a, b) => b - a);
  }, [payroll?.payroll_history]);

  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  useEffect(() => {
    if (years.length > 0 && !years.includes(Number(selectedYear))) {
      setSelectedYear(String(years[0]));
    }
  }, [years, selectedYear]);

  useEffect(() => {
    setPage(1);
  }, [selectedYear, q, perPage]);

  const filteredHistory = useMemo(() => {
    if (!payroll?.payroll_history) return [];
    const needle = q.trim().toLowerCase();
    return payroll.payroll_history.filter((p) => {
      const yearMatch = p.period.includes(selectedYear);
      const haystack = `${p.period} ${p.status} ${p.gross} ${p.net_pay} ${p.deductions}`.toLowerCase();
      return yearMatch && (!needle || haystack.includes(needle));
    });
  }, [payroll?.payroll_history, selectedYear, q]);

  const totalEntries = filteredHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);

  const historyRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredHistory.slice(start, start + perPage).map((item, i) => ({ sr: start + i + 1, ...item }));
  }, [filteredHistory, currentPage, perPage]);

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const yearSummary = useMemo(() => {
    return filteredHistory.reduce(
      (acc, p) => ({ gross: acc.gross + p.gross, net: acc.net + p.net_pay, deductions: acc.deductions + p.deductions }),
      { gross: 0, net: 0, deductions: 0 }
    );
  }, [filteredHistory]);

  const openPayslip = (item: (typeof historyRows)[number]) => {
    setSelectedPayslip({
      period: item.period,
      gross: item.gross,
      deductions: item.deductions,
      net_pay: item.net_pay,
      status: item.status,
      earnings: currentPayslip?.earnings,
      deductions_details: currentPayslip?.deductions,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-brand-800" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-brand-700">No payroll data available.</p>
      </div>
    );
  }

  const tabs: { key: PayrollTab; label: string }[] = [
    { key: "current", label: "Current payslip" },
    { key: "history", label: "Payroll history" },
    { key: "structure", label: "Salary structure" },
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-800 shadow-md shadow-brand-900/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-900 leading-tight">My Payroll</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-brand-700">{employee?.name}</span>
                <span className="text-brand-300">·</span>
                <Badge className="bg-brand-100 text-brand-700 border-0 text-xs px-2 py-0">
                  {employee?.code}
                </Badge>
                <span className="text-brand-300">·</span>
                <span className="text-sm text-brand-600">{employee?.designation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            accent
            label="Current month gross"
            value={fmt(Math.round(payroll.summary_cards.current_month_gross))}
            sub={payroll.summary_cards.current_month_date}
            icon={TrendingUp}
          />
          <StatCard
            label="Current month net"
            value={fmt(Math.round(payroll.summary_cards.current_month_net))}
            sub="Take-home this month"
            icon={Wallet}
          />
          <StatCard
            label="YTD gross"
            value={fmt(Math.round(payroll.summary_cards.ytd_gross))}
            sub="Total earnings this year"
            icon={Calendar}
          />
          <StatCard
            label="YTD tax paid"
            value={fmt(Math.round(payroll.summary_cards.ytd_tax_paid))}
            sub={`Net YTD ${fmt(Math.round(payroll.summary_cards.ytd_net))}`}
            icon={FileText}
          />
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex items-center gap-1 bg-brand-100 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-brand-700 hover:text-brand-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CURRENT TAB ── */}
        {activeTab === "current" && (
          <div className="space-y-4">
            {/* Period bar */}
            {currentPayslip ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-brand-700">Period</span>
                    <span className="font-semibold text-brand-900">{payroll.summary_cards.current_month_date}</span>
                    <span className="h-4 w-px bg-gray-200" />
                    <Badge className="bg-brand-800 text-white border-0 text-xs">
                      {currentPayslip.period_status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-brand-700">
                    <span>Gross <strong className="text-brand-900 ml-1">{fmt(Math.round(currentPayslip.gross_earnings))}</strong></span>
                    <Minus className="h-3 w-3 text-brand-300" />
                    <span>Deductions <strong className="text-brand-900 ml-1">{fmt(Math.round(currentPayslip.total_deductions))}</strong></span>
                    <ArrowUpRight className="h-3 w-3 text-brand-300" />
                    <span>Net <strong className="text-brand-900 ml-1">{fmt(Math.round(currentPayslip.net_payable))}</strong></span>
                  </div>
                </div>

                {/* Earnings / Deductions */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                      <TrendingUp className="h-4 w-4 text-brand-700" />
                      <h3 className="text-sm font-semibold text-brand-900">Earnings</h3>
                    </div>
                    <div className="px-5 py-3">
                      {earnings.map((item, i) => (
                        <LineItem key={i} label={item.name} value={fmt(Math.round(item.amount))} />
                      ))}
                      <div className="flex items-center justify-between pt-3 mt-1">
                        <span className="text-sm font-bold text-brand-900">Gross total</span>
                        <span className="text-sm font-bold text-brand-900">{fmt(Math.round(currentPayslip.gross_earnings))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                      <Minus className="h-4 w-4 text-brand-400" />
                      <h3 className="text-sm font-semibold text-brand-900">Deductions</h3>
                    </div>
                    <div className="px-5 py-3">
                      {deductions.map((item, i) => (
                        <LineItem key={i} label={item.name} value={fmt(Math.round(item.amount))} muted />
                      ))}
                      <div className="flex items-center justify-between pt-3 mt-1">
                        <span className="text-sm font-bold text-brand-900">Total deductions</span>
                        <span className="text-sm font-bold text-brand-400">{fmt(Math.round(currentPayslip.total_deductions))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net payable + actions */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-brand-600 font-semibold mb-1">Net payable</p>
                    <p className="text-3xl font-bold text-brand-900">{fmt(Math.round(currentPayslip.net_payable))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-gray-200 text-brand-800 hover:bg-brand-100 rounded-xl text-sm">
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                    <Button className="bg-brand-800 text-white hover:bg-brand-900 rounded-xl text-sm">
                      <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
                <FileText className="h-10 w-10 text-brand-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-brand-700">No current payslip available</p>
                <p className="text-xs text-brand-500 mt-1">Your payroll for this period hasn't been processed yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-600" />
                <Input
                  placeholder="Search by period…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-gray-200 rounded-xl focus:border-brand-800 focus:ring-brand-800 text-brand-900 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-brand-700">Year</span>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-28 border-gray-200 rounded-xl text-brand-800 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-brand-700">Show</span>
                <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                  <SelectTrigger className="w-20 border-gray-200 rounded-xl text-brand-800 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-brand-700">entries</span>
              </div>
            </div>

            {/* Count bar */}
            <div className="text-xs text-brand-600 px-1">
              Showing <strong className="text-brand-900">{showingFrom}–{showingTo}</strong> of <strong className="text-brand-900">{totalEntries}</strong> entries
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-brand-100/50">
                      <th className="py-3 px-5 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-600">#</th>
                      <th className="py-3 px-5 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-600">Period</th>
                      <th className="py-3 px-5 text-right text-[11px] font-semibold uppercase tracking-wide text-brand-600">Gross</th>
                      <th className="py-3 px-5 text-right text-[11px] font-semibold uppercase tracking-wide text-brand-600">Deductions</th>
                      <th className="py-3 px-5 text-right text-[11px] font-semibold uppercase tracking-wide text-brand-600">Net pay</th>
                      <th className="py-3 px-5 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-600">Status</th>
                      <th className="py-3 px-5 text-center text-[11px] font-semibold uppercase tracking-wide text-brand-600">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historyRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <FileText className="h-9 w-9 text-brand-200 mx-auto mb-2" />
                          <p className="text-sm font-medium text-brand-700">No payroll records found</p>
                        </td>
                      </tr>
                    ) : (
                      historyRows.map((row) => (
                        <tr key={row.sr} className="hover:bg-brand-100/40 transition-colors">
                          <td className="py-3.5 px-5 text-brand-600">{row.sr}</td>
                          <td className="py-3.5 px-5 font-semibold text-brand-900">{row.period}</td>
                          <td className="py-3.5 px-5 text-right font-medium text-brand-900">{fmt(Math.round(row.gross))}</td>
                          <td className="py-3.5 px-5 text-right text-brand-400">−{fmt(Math.round(row.deductions))}</td>
                          <td className="py-3.5 px-5 text-right font-semibold text-brand-900">{fmt(Math.round(row.net_pay))}</td>
                          <td className="py-3.5 px-5">
                            <Badge className="bg-brand-100 text-brand-700 border-0 text-xs">{row.status}</Badge>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              onClick={() => openPayslip(row)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-brand-100 text-brand-700 hover:text-brand-900 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyRows.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-3 flex justify-center">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(1)} disabled={currentPage === 1} className="h-8 w-8 flex items-center justify-center rounded-lg text-brand-700 hover:bg-brand-100 disabled:opacity-30 transition-colors">
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 flex items-center justify-center rounded-lg text-brand-700 hover:bg-brand-100 disabled:opacity-30 transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) p = i + 1;
                      else if (currentPage <= 3) p = i + 1;
                      else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                      else p = currentPage - 2 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            currentPage === p
                              ? "bg-brand-800 text-white"
                              : "text-brand-700 hover:bg-brand-100"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 flex items-center justify-center rounded-lg text-brand-700 hover:bg-brand-100 disabled:opacity-30 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 flex items-center justify-center rounded-lg text-brand-700 hover:bg-brand-100 disabled:opacity-30 transition-colors">
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Year summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total gross", value: fmt(Math.round(yearSummary.gross)) },
                { label: "Total net", value: fmt(Math.round(yearSummary.net)) },
                { label: "Total deductions", value: fmt(Math.round(yearSummary.deductions)) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600 mb-1">{s.label}</p>
                  <p className="text-xl font-bold text-brand-900">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STRUCTURE TAB ── */}
        {activeTab === "structure" && (
          <div className="space-y-4">
            {/* Info bar */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="text-brand-700">Effective from <strong className="text-brand-900 ml-1">{payroll.salary_structure.effective_from}</strong></span>
              <span className="h-4 w-px bg-gray-200" />
              <span className="text-brand-700">Currency <strong className="text-brand-900 ml-1">{payroll.salary_structure.currency}</strong></span>
              <span className="h-4 w-px bg-gray-200" />
              <span className="text-brand-700">Annual gross <strong className="text-brand-900 ml-1">{fmt(Math.round(payroll.salary_structure.annual_gross))}</strong></span>
            </div>

            {/* Structure stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Monthly basic", value: fmt(Math.round(payroll.salary_structure.monthly_basic)) },
                { label: "Monthly gross", value: fmt(Math.round(payroll.salary_structure.monthly_gross)) },
                { label: "Annual gross", value: fmt(Math.round(payroll.salary_structure.annual_gross)) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600 mb-2">{s.label}</p>
                  <p className="text-2xl font-bold text-brand-900">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Earning components */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <TrendingUp className="h-4 w-4 text-brand-700" />
                <h3 className="text-sm font-semibold text-brand-900">Earning components</h3>
              </div>
              <div className="px-5 py-3">
                {payroll.salary_structure.components
                  .filter((c) => c.type === "earning")
                  .map((comp, i) => (
                    <LineItem
                      key={i}
                      label={`${comp.name} (${comp.calculation_type.replace(/_/g, " ")})`}
                      value={comp.percentage ? `${comp.percentage}%` : fmt(Math.round(comp.amount))}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Payslip Modal ── */}
      <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
        {selectedPayslip && (
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {/* Modal header */}
            <div className="bg-brand-800 px-6 py-5">
              <DialogHeader>
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 opacity-70" /> Payslip details
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                {selectedPayslip.period} · {employee?.name} · {employee?.code}
              </DialogDescription>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 3 summary chips */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Gross pay", value: fmt(Math.round(selectedPayslip.gross)) },
                  { label: "Deductions", value: fmt(Math.round(selectedPayslip.deductions)) },
                  { label: "Net pay", value: fmt(Math.round(selectedPayslip.net_pay)) },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-brand-100 border border-gray-100 p-4 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600 mb-1">{s.label}</p>
                    <p className="text-lg font-bold text-brand-900">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Earnings / Deductions breakdown */}
              {(selectedPayslip.earnings || selectedPayslip.deductions_details) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPayslip.earnings && (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-brand-100/40 flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-brand-700" />
                        <h4 className="text-sm font-semibold text-brand-900">Earnings</h4>
                      </div>
                      <div className="px-4 py-2">
                        {selectedPayslip.earnings.map((item, i) => (
                          <LineItem key={i} label={item.name} value={fmt(Math.round(item.amount))} />
                        ))}
                        <div className="flex justify-between font-bold pt-2 mt-1 text-sm text-brand-900">
                          <span>Gross total</span>
                          <span>{fmt(Math.round(selectedPayslip.gross))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedPayslip.deductions_details && (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-brand-100/40 flex items-center gap-2">
                        <Minus className="h-3.5 w-3.5 text-brand-400" />
                        <h4 className="text-sm font-semibold text-brand-900">Deductions</h4>
                      </div>
                      <div className="px-4 py-2">
                        {selectedPayslip.deductions_details.map((item, i) => (
                          <LineItem key={i} label={item.name} value={fmt(Math.round(item.amount))} muted />
                        ))}
                        <div className="flex justify-between font-bold pt-2 mt-1 text-sm text-brand-900">
                          <span>Total deductions</span>
                          <span className="text-brand-400">{fmt(Math.round(selectedPayslip.deductions))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Net payable */}
              <div className="flex items-center justify-between rounded-xl bg-brand-800 px-5 py-4">
                <p className="text-sm font-medium text-brand-300">Net payable</p>
                <p className="text-2xl font-bold text-white">{fmt(Math.round(selectedPayslip.net_pay))}</p>
              </div>
            </div>

            <DialogFooter className="px-6 pb-5 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedPayslip(null)}
                className="border-gray-200 text-brand-800 hover:bg-brand-100 rounded-xl"
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