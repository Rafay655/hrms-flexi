// app/flexi-hq/payroll/periods/page.tsx
"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  History,
  ChevronRight,
  Download,
  ShieldCheck,
  RefreshCcw,
  X,
  Search,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PayrollPeriod {
  id: string;
  name: string;
  start: string;
  end: string;
  status: "OPEN" | "LOCKED" | "PROCESSING";
  lockedBy?: string;
  lockedAt?: string;
  pendingItems: {
    regularizations: number;
    ot: number;
    anomalies: number;
  };
}

const MOCK_PERIODS: PayrollPeriod[] = [
  {
    id: "P25-01",
    name: "January 2025",
    start: "2025-01-01",
    end: "2025-01-31",
    status: "OPEN",
    pendingItems: { regularizations: 8, ot: 5, anomalies: 12 },
  },
  {
    id: "P24-12",
    name: "December 2024",
    start: "2024-12-01",
    end: "2024-12-31",
    status: "LOCKED",
    lockedBy: "Jane Doe (HR)",
    lockedAt: "Jan 05, 2025",
    pendingItems: { regularizations: 0, ot: 0, anomalies: 0 },
  },
  {
    id: "P24-11",
    name: "November 2024",
    start: "2024-11-01",
    end: "2024-11-30",
    status: "LOCKED",
    lockedBy: "Jane Doe (HR)",
    lockedAt: "Dec 03, 2024",
    pendingItems: { regularizations: 0, ot: 0, anomalies: 0 },
  },
  {
    id: "P24-10",
    name: "October 2024",
    start: "2024-10-01",
    end: "2024-10-31",
    status: "LOCKED",
    lockedBy: "Jane Doe (HR)",
    lockedAt: "Nov 04, 2024",
    pendingItems: { regularizations: 0, ot: 0, anomalies: 0 },
  },
];

export const PayrollPeriods: React.FC = () => {
  const [periods] = useState<PayrollPeriod[]>(MOCK_PERIODS);
  const currentPeriod = periods[0];

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <CalendarCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Payroll Control Center
                </CardTitle>
                <p className="text-sm text-brand-700 mt-0.5">
                  Govern attendance cycles and finalize data for payroll disbursement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2 border-gray-200 text-brand-800 hover:bg-brand-100">
                <Download className="h-4 w-4" /> Reconciliation Report
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Current Period */}
            <div className="xl:col-span-1 space-y-6">
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-brand-900 tabular-nums">
                      {currentPeriod.name}
                    </h3>
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                      Active Payroll Window
                    </p>
                  </div>
                  <Badge className="bg-brand-700 text-white border-transparent gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Open
                  </Badge>
                </div>

                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-brand-100 border border-brand-200 rounded-xl">
                    <Clock className="h-5 w-5 text-brand-800" />
                    <div>
                      <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                        Auto-Lock Schedule
                      </p>
                      <p className="text-sm font-bold text-brand-900">
                        Feb 05, 2025 at 11:59 PM
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-brand-700 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Pending Compliance Items
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "Regularizations", val: currentPeriod.pendingItems.regularizations },
                        { label: "OT Approvals", val: currentPeriod.pendingItems.ot },
                        { label: "Anomalies Unresolved", val: currentPeriod.pendingItems.anomalies },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center p-3 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          <span className="text-sm font-medium text-brand-800">
                            • {item.label}
                          </span>
                          <span className="text-sm font-bold text-brand-900 tabular-nums">
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button className="w-full bg-brand-800 hover:bg-brand-900 text-white gap-2">
                      <Lock className="h-4 w-4" /> Lock Period Now
                    </Button>
                    <Button variant="outline" className="w-full border-gray-200 text-brand-800 hover:bg-brand-100">
                      View Detail Summary
                    </Button>
                  </div>
                </CardContent>

                <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-amber-700 font-semibold">
                    Locking requires all pending items to be resolved
                  </p>
                </div>
              </Card>

              <Card className="border border-brand-200 bg-brand-50 shadow-sm group hover:border-brand-300 transition-colors cursor-pointer">
                <CardContent className="p-5 flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-brand-800 shrink-0 group-hover:scale-110 transition-transform">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wide mb-1">
                      Retroactive Queue
                    </h4>
                    <p className="text-sm text-brand-700">
                      3 employees requested changes to{" "}
                      <span className="font-semibold">December 2024</span> records.
                    </p>
                    <Button variant="link" className="p-0 h-auto mt-2 text-brand-800 text-xs font-semibold gap-1">
                      Review Requests <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN - Periods Table & Retro Queue */}
            <div className="xl:col-span-2 space-y-6">
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider flex items-center gap-2">
                    <History className="h-4 w-4 text-brand-700" /> Cycle History
                  </h3>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                    <Input
                      type="text"
                      placeholder="Search periods..."
                      className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Period Cycle
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Date Range
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Locked By
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {periods.map((p) => (
                        <tr key={p.id} className="hover:bg-brand-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm ${
                                  p.status === "OPEN"
                                    ? "bg-brand-700 text-white border-brand-700"
                                    : "bg-gray-50 text-brand-600 border-gray-200"
                                }`}
                              >
                                {p.status === "OPEN" ? (
                                  <Unlock className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                              </div>
                              <p className="text-sm font-semibold text-brand-900 tabular-nums">
                                {p.name}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-brand-700 tabular-nums">
                              <span>{p.start}</span>
                              <ArrowRight className="h-3 w-3 text-brand-400" />
                              <span>{p.end}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              className={
                                p.status === "OPEN"
                                  ? "bg-brand-700 text-white border-transparent"
                                  : "bg-brand-600 text-white border-transparent"
                              }
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {p.lockedBy ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-brand-900">
                                  {p.lockedBy}
                                </span>
                                <span className="text-xs text-brand-600 tabular-nums">
                                  {p.lockedAt}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-brand-500 italic">
                                Active Window
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                                title="View Audit"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                                title="Download Export"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {p.status === "LOCKED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-brand-600 hover:text-brand-900 hover:bg-brand-100"
                                  title="Unlock (Enterprise only)"
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Retroactive Corrections Card */}
              <Card className="border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-brand-50/50 flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-brand-700" /> Retroactive Corrections
                  </h3>
                  <Badge className="bg-brand-700 text-white border-transparent">
                    3 New Requests
                  </Badge>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    {
                      emp: "Sarah Chen",
                      id: "FLX-101",
                      period: "Dec 2024",
                      change: "Missing OT (4h)",
                      reason: "Shift data not synced on Jan 30",
                    },
                    {
                      emp: "Ahmed Khan",
                      id: "FLX-204",
                      period: "Dec 2024",
                      change: "Regularization",
                      reason: "Medical proof submitted late",
                    },
                    {
                      emp: "James Wilson",
                      id: "FLX-089",
                      period: "Nov 2024",
                      change: "Shift Correction",
                      reason: "Manual override required for public holiday",
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-brand-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-800 text-xs font-bold">
                          {row.emp
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-900">
                            {row.emp}{" "}
                            <span className="text-xs text-brand-600 ml-1 font-normal">
                              • {row.id}
                            </span>
                          </p>
                          <p className="text-xs text-brand-700 font-medium mt-0.5">
                            Affects: {row.period}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 px-4">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          {row.change}
                        </Badge>
                        <p className="text-xs text-brand-600 mt-1 truncate max-w-xs">
                          "{row.reason}"
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-brand-800 hover:bg-brand-900 text-white">
                          Review
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-brand-600 hover:text-brand-900 hover:bg-brand-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Audit Stability Protocol Card */}
              <Card className="border border-brand-200 bg-brand-50/30 shadow-sm">
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm text-brand-800 shrink-0">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wide">
                      Audit Stability Protocol
                    </h4>
                    <p className="text-sm text-brand-700">
                      Locked periods generate an immutable{" "}
                      <span className="font-semibold">Sync-ID</span> which must be
                      matched by the PayEdge payroll system during processing. Any
                      mismatch will halt the disbursement to ensure data integrity.
                    </p>
                  </div>
                  <Button className="bg-brand-800 hover:bg-brand-900 text-white">
                    Download Signed Ledger
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollPeriods;