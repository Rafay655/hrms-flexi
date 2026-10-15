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
  Download,
  Eye,
  Wallet,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Calendar,
  TrendingUp,
  MinusCircle,
} from "lucide-react";

type PayslipStatus = "Paid" | "Pending" | "On Hold";

interface Payslip {
  id: number;
  month: string;
  year: number;
  gross: number;
  net: number;
  deductions: number;
  tax: number;
  status: PayslipStatus;
  pdfUrl: string;
  details: {
    earnings: {
      basic: number;
      hra: number;
      allowance: number;
      overtime: number;
      bonus: number;
    };
    deductions: {
      pf: number;
      esi: number;
      pt: number;
      loan: number;
      other: number;
    };
  };
}

const DEFAULT_PER_PAGE = 10;

const PAYROLL_HISTORY: Payslip[] = [
  {
    id: 1,
    month: "March",
    year: 2025,
    gross: 228000,
    net: 200800,
    deductions: 27200,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 8000, bonus: 15000 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 1000 },
    },
  },
  {
    id: 2,
    month: "February",
    year: 2025,
    gross: 215000,
    net: 189200,
    deductions: 25800,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 6000, bonus: 4000 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 800 },
    },
  },
  {
    id: 3,
    month: "January",
    year: 2025,
    gross: 212000,
    net: 186500,
    deductions: 25500,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 5000, bonus: 2000 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 600 },
    },
  },
  {
    id: 4,
    month: "December",
    year: 2024,
    gross: 210000,
    net: 184800,
    deductions: 25200,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 4000, bonus: 1000 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 400 },
    },
  },
  {
    id: 5,
    month: "November",
    year: 2024,
    gross: 208000,
    net: 183200,
    deductions: 24800,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 3000, bonus: 0 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 300 },
    },
  },
  {
    id: 6,
    month: "October",
    year: 2024,
    gross: 205000,
    net: 180500,
    deductions: 24500,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 2000, bonus: 0 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 200 },
    },
  },
  {
    id: 7,
    month: "September",
    year: 2024,
    gross: 203000,
    net: 178700,
    deductions: 24300,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 1000, bonus: 0 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 100 },
    },
  },
  {
    id: 8,
    month: "August",
    year: 2024,
    gross: 202000,
    net: 177800,
    deductions: 24200,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 0, bonus: 0 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 0 },
    },
  },
  {
    id: 9,
    month: "July",
    year: 2024,
    gross: 202000,
    net: 177800,
    deductions: 24200,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 0, bonus: 0 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 0 },
    },
  },
  {
    id: 10,
    month: "June",
    year: 2024,
    gross: 202000,
    net: 177800,
    deductions: 24200,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 0, bonus: 0 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 0 },
    },
  },
  {
    id: 11,
    month: "May",
    year: 2024,
    gross: 202000,
    net: 177800,
    deductions: 24200,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 0, bonus: 0 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 0 },
    },
  },
  {
    id: 12,
    month: "April",
    year: 2024,
    gross: 202000,
    net: 177800,
    deductions: 24200,
    tax: 0,
    status: "Paid",
    pdfUrl: "#",
    details: {
      earnings: { basic: 120000, hra: 60000, allowance: 25000, overtime: 0, bonus: 0 },
      deductions: { pf: 18000, esi: 3000, pt: 200, loan: 5000, other: 0 },
    },
  },
];

const fmt = (n: number) =>
  n >= 10000000
    ? `PKR ${(n / 10000000).toFixed(2)}Cr`
    : n >= 100000
      ? `PKR ${(n / 100000).toFixed(1)}L`
      : `PKR ${n.toLocaleString()}`;

const statusClasses: Record<PayslipStatus, string> = {
  Paid: "bg-brand-700 text-white border-transparent hover:bg-brand-700",
  Pending: "bg-brand-100 text-brand-800 border border-gray-200 hover:bg-brand-100",
  "On Hold": "bg-brand-600 text-white border-transparent hover:bg-brand-600",
};

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function SalaryHistory() {
  const years = useMemo(
    () => [...new Set(PAYROLL_HISTORY.map((p) => p.year))].sort((a, b) => b - a),
    []
  );

  const [selectedYear, setSelectedYear] = useState<string>(String(years[0] ?? ""));
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 400);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [isFetching, setIsFetching] = useState(false);

  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setIsFetching(true);
    const t = setTimeout(() => setIsFetching(false), 300);
    return () => clearTimeout(t);
  }, [selectedYear, q, perPage, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedYear, q, perPage]);

  const filtered = useMemo(() => {
    const selectedYearNumber = Number(selectedYear);
    const needle = q.trim().toLowerCase();

    return PAYROLL_HISTORY.filter((p) => {
      const matchYear = p.year === selectedYearNumber;
      const haystack = `${p.month} ${p.year} ${p.status} ${p.gross} ${p.net} ${p.deductions}`.toLowerCase();
      const matchSearch = !needle || haystack.includes(needle);
      return matchYear && matchSearch;
    });
  }, [selectedYear, q]);

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(currentPage * perPage, totalEntries) : 0;

  const rows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage).map((item, index) => ({
      sr: start + index + 1,
      ...item,
    }));
  }, [filtered, currentPage, perPage]);

  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, p) => {
        acc.gross += p.gross;
        acc.net += p.net;
        acc.deductions += p.deductions;
        if (p.status === "Paid") acc.paid += 1;
        if (p.status === "Pending") acc.pending += 1;
        if (p.status === "On Hold") acc.onHold += 1;
        return acc;
      },
      { gross: 0, net: 0, deductions: 0, paid: 0, pending: 0, onHold: 0 }
    );
  }, [filtered]);

  const openView = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setModalOpen(true);
  };

  const handleDownload = (payslip: Payslip) => {
    console.log(`Downloading payslip for ${payslip.month} ${payslip.year}`);
  };

  const handleExportCSV = () => {
    const headers = ["Sr", "Month", "Year", "Gross", "Deductions", "Net Pay", "Status"];
    const csvRows = filtered.map((p, index) => [
      index + 1,
      p.month,
      p.year,
      p.gross,
      p.deductions,
      p.net,
      p.status,
    ]);

    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `salary-history-${selectedYear}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Salary History
                </CardTitle>
                <p className="text-sm text-brand-700 mt-0.5">
                  View salary records, payslip details, and export history by year.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
              <Input
                placeholder="Search by month, year, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-brand-700 whitespace-nowrap">Year</span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28 border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm text-brand-700 whitespace-nowrap">Show</span>
              <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
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
              <span className="text-sm text-brand-700 whitespace-nowrap">entries</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand-700">
                      Year Gross
                    </p>
                    <p className="text-2xl font-bold text-brand-900 mt-1">
                      {fmt(summary.gross)}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <TrendingUp className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand-700">
                      Year Net
                    </p>
                    <p className="text-2xl font-bold text-brand-900 mt-1">
                      {fmt(summary.net)}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <Wallet className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand-700">
                      Total Deductions
                    </p>
                    <p className="text-2xl font-bold text-brand-900 mt-1">
                      {fmt(summary.deductions)}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <MinusCircle className="h-4 w-4 text-brand-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-sm">
                <span className="text-brand-700">Showing </span>
                <span className="font-semibold text-brand-900">{showingFrom}</span>
                <span className="text-brand-700"> to </span>
                <span className="font-semibold text-brand-900">{showingTo}</span>
                <span className="text-brand-700"> of </span>
                <span className="font-semibold text-brand-900">{totalEntries}</span>
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
                <span className="font-semibold text-brand-900">{summary.paid}</span> Paid
              </div>
              <div className="h-3 w-px bg-brand-300" />
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{summary.pending}</span> Pending
              </div>
              <div className="h-3 w-px bg-brand-300" />
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <span className="font-semibold text-brand-900">{summary.onHold}</span> On Hold
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
                    <th className="py-3 px-5 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Gross
                    </th>
                    <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="py-3 px-5 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Net Pay
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
                          <Calendar className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-brand-800">No salary history found</p>
                          <p className="text-sm text-brand-600">
                            Try changing year or search criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((payslip) => (
                      <tr
                        key={payslip.id}
                        className="hover:bg-brand-100 transition-colors group"
                      >
                        <td className="py-3.5 px-5 text-sm font-medium text-brand-900">
                          {payslip.sr}
                        </td>

                        <td className="py-3.5 px-5 text-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white text-xs font-bold flex-shrink-0">
                              {payslip.month.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-brand-900 text-sm">
                                {payslip.month}
                              </div>
                              <div className="text-[11px] text-brand-700">
                                Payslip month
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-sm text-brand-900">
                          {payslip.year}
                        </td>

                        <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                          {fmt(payslip.gross)}
                        </td>

                        <td className="py-3.5 px-5 text-sm text-right text-brand-900">
                          -{fmt(payslip.deductions)}
                        </td>

                        <td className="py-3.5 px-5 text-sm text-right font-semibold text-brand-900">
                          {fmt(payslip.net)}
                        </td>

                        <td className="py-3.5 px-5 text-sm">
                          <Badge className={statusClasses[payslip.status]}>
                            {payslip.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-5 text-sm">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openView(payslip)}
                              className="text-brand-800 hover:text-brand-900 hover:bg-brand-100"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(payslip)}
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
                    Page <span className="font-semibold text-brand-900">{currentPage}</span> of{" "}
                    <span className="font-semibold text-brand-900">{totalPages}</span>
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
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p: number;
                        if (totalPages <= 5) p = i + 1;
                        else if (currentPage <= 3) p = i + 1;
                        else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                        else p = currentPage - 2 + i;

                        return (
                          <Button
                            key={p}
                            variant={currentPage === p ? "default" : "outline"}
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
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
                    <span className="font-semibold text-brand-900">{showingFrom}</span>
                    {" – "}
                    <span className="font-semibold text-brand-900">{showingTo}</span>
                    {" of "}
                    <span className="font-semibold text-brand-900">{totalEntries}</span>
                    {" entries"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        {selectedPayslip && (
          <DialogContent className="sm:max-w-[760px] border border-gray-200 bg-white p-0 overflow-hidden">
            <div className="bg-brand-900 px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 opacity-80" />
                  Payslip Details
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                {selectedPayslip.month} {selectedPayslip.year} salary breakdown.
              </DialogDescription>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">Gross Pay</div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedPayslip.gross)}
                  </div>
                </div>

                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">
                    Total Deductions
                  </div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedPayslip.deductions)}
                  </div>
                </div>

                <div className="rounded-lg bg-brand-100 border border-gray-200 p-4">
                  <div className="text-xs text-brand-700 uppercase tracking-wide">Net Pay</div>
                  <div className="text-xl font-bold text-brand-900 mt-1">
                    {fmt(selectedPayslip.net)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h4 className="font-semibold text-brand-900">Earnings</h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Monthly earnings breakdown
                    </p>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-brand-800">
                      <span>Basic</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.earnings.basic)}</span>
                    </div>
                    <div className="flex justify-between text-brand-800">
                      <span>HRA</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.earnings.hra)}</span>
                    </div>
                    <div className="flex justify-between text-brand-800">
                      <span>Allowance</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.earnings.allowance)}</span>
                    </div>
                    <div className="flex justify-between text-brand-800">
                      <span>Overtime</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.earnings.overtime)}</span>
                    </div>
                    <div className="flex justify-between text-brand-800">
                      <span>Bonus</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.earnings.bonus)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-200 pt-2 mt-2 text-brand-900">
                      <span>Gross Total</span>
                      <span>{fmt(selectedPayslip.gross)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h4 className="font-semibold text-brand-900">Deductions</h4>
                    <p className="text-xs text-brand-700 mt-0.5">
                      Monthly deductions breakdown
                    </p>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-brand-800">
                      <span>EOBI</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.deductions.pf)}</span>
                    </div>
                    <div className="flex justify-between text-brand-800">
                      <span>Provincial Social Security</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.deductions.esi)}</span>
                    </div>
                    <div className="flex justify-between text-brand-800">
                      <span>Loan Recovery</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.deductions.loan)}</span>
                    </div>
                    <div className="flex justify-between text-brand-800">
                      <span>Other</span>
                      <span className="font-medium">{fmt(selectedPayslip.details.deductions.other)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-200 pt-2 mt-2 text-brand-900">
                      <span>Total Deductions</span>
                      <span>{fmt(selectedPayslip.deductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-brand-700">Status</span>
                  <Badge className={statusClasses[selectedPayslip.status]}>
                    {selectedPayslip.status}
                  </Badge>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-sm text-brand-600">Net Payable</p>
                  <p className="text-2xl font-bold text-brand-900">
                    {fmt(selectedPayslip.net)}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 pb-5 flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-gray-200 text-brand-800 hover:bg-brand-100"
                onClick={() => setModalOpen(false)}
              >
                Close
              </Button>
              <Button
                className="bg-brand-800 text-white hover:bg-brand-900"
                onClick={() => handleDownload(selectedPayslip)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}