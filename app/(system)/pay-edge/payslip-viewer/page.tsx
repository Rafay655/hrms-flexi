
"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Eye,
  Download,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayslips } from "@/hooks/usePayslips";
import { downloadPayslip, servePayslip  } from "@/services/payslips";
import type { Payslip } from "@/types/payslip";

function formatPKR(value: number) {
  return `PKR ${Math.round(value).toLocaleString()}`;
}

function EmailedBadge({ isEmailed }: { isEmailed: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        isEmailed
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-gray-50 text-gray-500 border-gray-200"
      }
    >
      {isEmailed ? "Emailed" : "Not sent"}
    </Badge>
  );
}

function parsePeriodLabel(label: string) {
  const parts = label.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  return { year, month };
}

export default function PayslipsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [periodMonth, setPeriodMonth] = useState<number | undefined>(undefined);
  const [periodYear, setPeriodYear] = useState<number | undefined>(undefined);
  const [isEmailed, setIsEmailed] = useState<string>("all");
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [defaultsResolved, setDefaultsResolved] = useState(false);

  const { data: bootstrapData } = usePayslips(
    { per_page: 1, page: 1 },
    { enabled: !defaultsResolved }
  );

  useEffect(() => {
    if (!defaultsResolved && bootstrapData?.data?.length) {
      const latest = bootstrapData.data[0];
      setPeriodMonth(latest.period_month);
      setPeriodYear(latest.period_year);
      setDefaultsResolved(true);
    }
  }, [bootstrapData, defaultsResolved]);

  const params = useMemo(() => {
    return {
      page: page,
      per_page: perPage,
      search: search || undefined,
      period_month: periodMonth,
      period_year: periodYear,
      is_emailed: isEmailed === "all" ? undefined : isEmailed === "true",
    };
  }, [page, perPage, search, periodMonth, periodYear, isEmailed]);

  const { data, isLoading, isFetching } = usePayslips(params, {
    enabled: defaultsResolved,
  });

  const payslips: Payslip[] = data?.data ?? [];
  const totalEntries: number = data?.meta?.total ?? 0;
  const totalPages: number = data?.meta?.last_page ?? 1;

  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      const periods = Array.from(new Set(data.data.map((p) => p.period_label)));
      setAvailablePeriods((prev) => {
        const merged = Array.from(new Set([...prev, ...periods]));
        return merged.sort().reverse();
      });
    }
  }, [data]);

  const currentPeriodLabel =
    periodMonth && periodYear
      ? `${periodYear}-${String(periodMonth).padStart(2, "0")}`
      : "all";

  const handlePeriodChange = (value: string) => {
    setPage(1);
    if (value === "all") {
      setPeriodMonth(undefined);
      setPeriodYear(undefined);
      return;
    }
    const parsed = parsePeriodLabel(value);
    setPeriodYear(parsed.year);
    setPeriodMonth(parsed.month);
  };

 const handleView = async (payslip: Payslip) => {
  try {
    const blob = await servePayslip(payslip.id);
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
    // revoke a bit later so the new tab has time to load the PDF
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    showApiError(err, { fallbackMessage: "Unable to open payslip." });
  }
};

  const handleDownload = async (payslip: Payslip) => {
    try {
      const blob = await downloadPayslip(payslip.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${payslip.employee_code}_${payslip.period_label}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch (err) {
      showApiError(err, { fallbackMessage: "Download failed." });
    }
  };

  const showingFrom = totalEntries > 0 ? (page - 1) * perPage + 1 : 0;
  const showingTo = totalEntries > 0 ? Math.min(page * perPage, totalEntries) : 0;

  return (
    <div className="p-3">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Payslips</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {totalEntries.toLocaleString()} payslips · View and download employee payslips
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employee name/code..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-10 border-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Period</span>
              <Select value={currentPeriodLabel} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-40 border-gray-300">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {availablePeriods.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Emailed</span>
              <Select
                value={isEmailed}
                onValueChange={(v) => {
                  setPage(1);
                  setIsEmailed(v);
                }}
              >
                <SelectTrigger className="w-32 border-gray-300">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => {
                  setPage(1);
                  setPerPage(Number(v));
                }}
              >
                <SelectTrigger className="w-20 border-gray-300">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>

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

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Designation</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Period</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Gross Pay</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Deductions</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Salary</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading && !payslips.length ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading payslips...</p>
                      </td>
                    </tr>
                  ) : payslips.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        <FileText className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                        No payslips found.
                      </td>
                    </tr>
                  ) : (
                    payslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E1B4B]/[0.08] text-[10px] font-semibold text-[#1E1B4B]">
                              {payslip.employee_initials}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{payslip.employee_name}</p>
                              <p className="text-xs text-gray-500">{payslip.employee_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-700">{payslip.designation}</td>
                        <td className="py-4 px-6 text-gray-700">{payslip.department}</td>
                        <td className="py-4 px-6 font-mono text-gray-900">{payslip.period_label}</td>
                        <td className="py-4 px-6 text-right font-mono tabular-nums">{formatPKR(payslip.gross_pay)}</td>
                        <td className="py-4 px-6 text-right font-mono tabular-nums text-gray-500">{formatPKR(payslip.deductions)}</td>
                        <td className="py-4 px-6 text-right font-mono font-semibold tabular-nums text-gray-900">{formatPKR(payslip.net_salary)}</td>
                        <td className="py-4 px-6"><EmailedBadge isEmailed={payslip.is_emailed} /></td>
                        <td className="py-4 px-6 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(payslip)}>
                                <Eye className="mr-2 h-3.5 w-3.5" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(payslip)}>
                                <Download className="mr-2 h-3.5 w-3.5" /> Download
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
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
    </div>
  );
}