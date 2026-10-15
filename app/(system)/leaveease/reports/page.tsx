// app/flexi-hq/reports/leave/page.tsx
"use client";

import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  Clock,
  DollarSign,
  Zap,
  Plane,
  Calendar,
  ShieldAlert,
  FileText,
  Download,
  FileSpreadsheet,
  ChevronRight,
  CalendarDays,
  Users,
  Search,
  RefreshCw,
  ListFilter,
  Play,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReportType {
  id: string;
  label: string;
  icon: any;
  desc: string;
}

const REPORT_TYPES: ReportType[] = [
  {
    id: "balance",
    label: "Leave Balance Report",
    icon: BarChart3,
    desc: "Current entitlements across all active staff.",
  },
  {
    id: "utilization",
    label: "Leave Utilization Report",
    icon: PieChart,
    desc: "Analysis of leave trends and team absence rates.",
  },
  {
    id: "pending",
    label: "Pending Requests Report",
    icon: Clock,
    desc: "Audit of applications awaiting manager/HR action.",
  },
  {
    id: "encashment",
    label: "Encashment Report",
    icon: DollarSign,
    desc: "Liquidation records for payroll processing.",
  },
  {
    id: "compoff",
    label: "Comp-Off Report",
    icon: Zap,
    desc: "Earned credits and expiry tracking.",
  },
  {
    id: "od",
    label: "OD/Travel Report",
    icon: Plane,
    desc: "Out-of-office assignments and business travel.",
  },
  {
    id: "accrual",
    label: "Accrual Summary Report",
    icon: RefreshCw,
    desc: "Detailed log of automated balance credits.",
  },
  {
    id: "compliance",
    label: "Compliance Report",
    icon: ShieldAlert,
    desc: "SLA breaches and policy override audits.",
  },
];

export const LeaveReportGenerator = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 1500);
  };

  const currentReport = REPORT_TYPES.find((r) => r.id === selectedReport);
  const Icon = currentReport?.icon || FileText;

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Leave Reports
                </CardTitle>
                <p className="text-sm text-brand-700 mt-0.5">
                  Generate, export, and schedule sophisticated leave analytics.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!selectedReport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all text-left flex flex-col items-start group"
                >
                  <div className="p-3 bg-brand-100 text-brand-800 rounded-lg mb-4 group-hover:bg-brand-200 transition-colors">
                    <type.icon size={24} />
                  </div>
                  <h3 className="text-base font-semibold text-brand-900 mb-1">
                    {type.label}
                  </h3>
                  <p className="text-xs text-brand-600 leading-relaxed">
                    {type.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-800 uppercase tracking-wide group-hover:gap-2 transition-all">
                    Configure <ChevronRight className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Parameters Side Panel */}
              <div className="lg:col-span-4">
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(null);
                        setShowPreview(false);
                      }}
                      className="text-brand-600 hover:text-brand-900 hover:bg-brand-100 -ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                      Parameters
                    </h3>
                    <div className="w-8" />
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Report Type Display */}
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-100 text-brand-800 rounded-lg">
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                          Generating
                        </p>
                        <p className="text-sm font-semibold text-brand-900">
                          {currentReport?.label}
                        </p>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" /> Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="date"
                          className="border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-sm"
                        />
                        <Input
                          type="date"
                          className="border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-sm"
                        />
                      </div>
                    </div>

                    {/* Scope */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-4 w-4" /> Organization Scope
                      </label>
                      <Select defaultValue="all">
                        <SelectTrigger className="border-gray-200 text-brand-800">
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Organization</SelectItem>
                          <SelectItem value="eng">Engineering</SelectItem>
                          <SelectItem value="prod">Product</SelectItem>
                          <SelectItem value="sales">Sales & Marketing</SelectItem>
                          <SelectItem value="specific">Specific Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Leave Types */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider flex items-center gap-2">
                        <ListFilter className="h-4 w-4" /> Leave Types
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Annual", "Sick", "Casual", "Unpaid"].map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100 cursor-pointer"
                          >
                            {t}
                          </Badge>
                        ))}
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-brand-600 border-gray-200 hover:bg-gray-100 cursor-pointer"
                        >
                          + Select More
                        </Badge>
                      </div>
                    </div>
                  </CardContent>

                  {/* Action Buttons */}
                  <div className="p-6 bg-gray-50/50 border-t border-gray-200 space-y-3">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full bg-brand-800 hover:bg-brand-900 text-white gap-2"
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Preview on Screen
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="border-gray-200 text-brand-800 hover:bg-brand-100 gap-2"
                      >
                        <FileText className="h-4 w-4 text-brand-600" /> PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-200 text-brand-800 hover:bg-brand-100 gap-2"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-brand-600" /> Excel
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      onClick={() => setIsScheduleOpen(true)}
                      className="w-full text-brand-800 text-xs font-semibold uppercase tracking-wider gap-2"
                    >
                      <Calendar className="h-4 w-4" /> Save & Schedule Report
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Preview Section */}
              <div className="lg:col-span-8">
                {isGenerating ? (
                  <Card className="border border-gray-200 shadow-sm min-h-[600px] flex flex-col items-center justify-center text-center p-12">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 border-4 border-brand-200 border-t-brand-800 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-brand-800 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-brand-900">
                      Querying Ledger...
                    </h3>
                    <p className="text-brand-600 mt-2">
                      Fetching real-time data for 450 employees.
                    </p>
                  </Card>
                ) : showPreview ? (
                  <div className="space-y-6">
                    <Card className="border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-brand-700" />
                          <h4 className="text-sm font-semibold text-brand-800 uppercase tracking-wider">
                            Report Preview
                          </h4>
                        </div>
                        <span className="text-xs font-semibold text-brand-600 uppercase">
                          Page 1 of 12
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-gray-200 bg-gray-50/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                                Employee ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                                Annual
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                                Casual
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                                Sick
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {[
                              {
                                id: "EMP-101",
                                name: "Ahmed Khan",
                                annual: 10,
                                casual: 5,
                                sick: 8,
                                total: 23,
                              },
                              {
                                id: "EMP-102",
                                name: "Sara Ahmed",
                                annual: 12,
                                casual: 3,
                                sick: 10,
                                total: 25,
                              },
                              {
                                id: "EMP-103",
                                name: "Tariq Mehmood",
                                annual: 4,
                                casual: 2,
                                sick: 1,
                                total: 7,
                              },
                              {
                                id: "EMP-104",
                                name: "Amna Bilal",
                                annual: 8,
                                casual: 5,
                                sick: 12,
                                total: 25,
                              },
                              {
                                id: "EMP-105",
                                name: "Zoya Malik",
                                annual: 14,
                                casual: 4,
                                sick: 6,
                                total: 24,
                              },
                            ].map((row, i) => (
                              <tr key={i} className="hover:bg-brand-50">
                                <td className="px-6 py-4 font-mono text-xs text-brand-600">
                                  {row.id}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-brand-900">
                                  {row.name}
                                </td>
                                <td className="px-6 py-4 text-sm text-center text-brand-700">
                                  {row.annual} d
                                </td>
                                <td className="px-6 py-4 text-sm text-center text-brand-700">
                                  {row.casual} d
                                </td>
                                <td className="px-6 py-4 text-sm text-center text-brand-700">
                                  {row.sick} d
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-bold text-brand-900">
                                    {row.total} Days
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-6 border-t border-gray-200 flex justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-brand-800 hover:bg-brand-900 text-white"
                        >
                          1
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 text-brand-800 hover:bg-brand-100"
                        >
                          2
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 text-brand-800 hover:bg-brand-100"
                        >
                          3
                        </Button>
                      </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                              Total Staff Included
                            </p>
                            <p className="text-2xl font-bold text-brand-900">
                              450
                            </p>
                          </div>
                          <Users className="h-12 w-12 text-brand-200" />
                        </CardContent>
                      </Card>
                      <Card className="bg-brand-900 border-0 shadow-lg relative overflow-hidden">
                        <CardContent className="p-6 text-white relative z-10">
                          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                            Liability Value (Est)
                          </p>
                          <p className="text-2xl font-bold text-brand-200">
                            PKR 12.4M
                          </p>
                        </CardContent>
                        <DollarSign className="absolute -right-6 -bottom-6 h-24 w-24 text-white/5" />
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card className="border border-dashed border-gray-300 bg-gray-50/30 min-h-[600px] flex flex-col items-center justify-center text-center p-12">
                    <div className="w-20 h-20 bg-brand-100 text-brand-800 rounded-xl flex items-center justify-center mb-6">
                      <Play className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-900 mb-2">
                      Ready to Generate
                    </h3>
                    <p className="text-brand-600 max-w-sm">
                      Configure your report parameters on the left and click
                      preview to analyze the data.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[480px] border border-gray-200 bg-white p-0 overflow-hidden">
          <div className="bg-brand-900 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 opacity-80" />
                Schedule Report
              </DialogTitle>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                Automate report delivery to specified recipients.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                Delivery Frequency
              </label>
              <Select defaultValue="weekly">
                <SelectTrigger className="border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly (Monday AM)</SelectItem>
                  <SelectItem value="monthly">Monthly (1st Day)</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                Recipients (Email)
              </label>
              <Input
                placeholder="e.g. hr@company.com, finance@company.com"
                className="border-gray-200 focus:border-brand-800 focus:ring-brand-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                File Format
              </label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="radio"
                    name="fmt"
                    defaultChecked
                    className="text-brand-800 focus:ring-brand-800"
                  />
                  <span className="text-sm font-medium text-brand-900">
                    Excel
                  </span>
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="radio"
                    name="fmt"
                    className="text-brand-800 focus:ring-brand-800"
                  />
                  <span className="text-sm font-medium text-brand-900">PDF</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-5 flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
              onClick={() => setIsScheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-800 text-white hover:bg-brand-900"
              onClick={() => setIsScheduleOpen(false)}
            >
              Set Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveReportGenerator;