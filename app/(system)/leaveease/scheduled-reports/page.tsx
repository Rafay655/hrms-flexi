// app/flexi-hq/reports/scheduled/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarClock,
  Plus,
  Search,
  Mail,
  Clock,
  FileText,
  Play,
  Edit3,
  Trash2,
  Pause,
  History as HistoryIcon,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

type Frequency = "Daily" | "Weekly" | "Monthly";
type ReportFormat = "PDF" | "Excel" | "Both";

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: Frequency;
  time: string;
  recipients: string[];
  lastRun: string;
  nextRun: string;
  format: ReportFormat;
  status: "ACTIVE" | "PAUSED";
}

const MOCK_REPORTS: ScheduledReport[] = [
  {
    id: "SR-001",
    name: "Morning Adherence Summary",
    type: "Daily Attendance",
    frequency: "Daily",
    time: "10:00 AM",
    recipients: ["hr@flexi.com", "ops@flexi.com"],
    lastRun: "Today, 10:00 AM",
    nextRun: "Tomorrow, 10:00 AM",
    format: "Excel",
    status: "ACTIVE",
  },
  {
    id: "SR-002",
    name: "Weekly Overtime Leakage",
    type: "OT Analysis",
    frequency: "Weekly",
    time: "Monday, 09:00 AM",
    recipients: ["finance@flexi.com"],
    lastRun: "Jan 06, 09:00 AM",
    nextRun: "Jan 13, 09:00 AM",
    format: "Both",
    status: "ACTIVE",
  },
  {
    id: "SR-003",
    name: "Monthly Compliance Audit",
    type: "Anomaly Report",
    frequency: "Monthly",
    time: "1st of Month, 10:00 AM",
    recipients: ["compliance@flexi.com"],
    lastRun: "Jan 01, 10:00 AM",
    nextRun: "Feb 01, 10:00 AM",
    format: "PDF",
    status: "PAUSED",
  },
  {
    id: "SR-004",
    name: "Late Arrival Daily Alert",
    type: "Punctuality",
    frequency: "Daily",
    time: "09:30 AM",
    recipients: ["mgr_engineering@flexi.com"],
    lastRun: "Today, 09:30 AM",
    nextRun: "Tomorrow, 09:30 AM",
    format: "PDF",
    status: "ACTIVE",
  },
  {
    id: "SR-005",
    name: "Dept Attendance Benchmark",
    type: "Monthly Summary",
    frequency: "Monthly",
    time: "Last day of month",
    recipients: ["board@flexi.com"],
    lastRun: "Dec 31, 05:00 PM",
    nextRun: "Jan 31, 05:00 PM",
    format: "Excel",
    status: "ACTIVE",
  },
];

export const ScheduledReportsList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");

  const filteredReports = useMemo(() => {
    return MOCK_REPORTS.filter((report) => {
      const matchesSearch = report.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "ALL" || report.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  const getFormatBadge = (format: ReportFormat) => {
    switch (format) {
      case "Excel":
        return (
          <Badge className="bg-brand-700 text-white border-transparent">
            Excel
          </Badge>
        );
      case "PDF":
        return (
          <Badge className="bg-brand-600 text-white border-transparent">
            PDF
          </Badge>
        );
      case "Both":
        return (
          <Badge className="bg-brand-800 text-white border-transparent">
            Both
          </Badge>
        );
    }
  };

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <CalendarClock className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Scheduled Reports
                </CardTitle>
                <p className="text-sm text-brand-700 mt-0.5">
                  Manage automated distribution of attendance and compliance data
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-800 hover:bg-brand-900 text-white gap-2"
              >
                <Plus className="h-4 w-4" /> Schedule New
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex p-1 bg-gray-50 rounded-lg">
              {(["ALL", "ACTIVE", "PAUSED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === tab
                      ? "bg-white shadow-sm text-brand-900"
                      : "text-brand-600 hover:text-brand-800"
                  }`}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
              <Input
                type="text"
                placeholder="Search by report name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Report Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Last Run / Next Run
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarClock className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-brand-800">
                            No scheduled reports found
                          </p>
                          <p className="text-sm text-brand-600">
                            Try adjusting your search or create a new schedule
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-brand-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-800 border border-brand-200">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-900">
                                {report.name}
                              </p>
                              <p className="text-xs text-brand-600">
                                {report.type}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-brand-900">
                              {report.frequency}
                            </span>
                            <span className="text-xs text-brand-600">
                              {report.time}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-2">
                              {report.recipients.slice(0, 2).map((_, i) => (
                                <div
                                  key={i}
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 border-2 border-white text-brand-700"
                                >
                                  <Mail className="h-3 w-3" />
                                </div>
                              ))}
                            </div>
                            {report.recipients.length > 2 && (
                              <span className="text-xs font-semibold text-brand-700">
                                +{report.recipients.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getFormatBadge(report.format)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-brand-600">
                              Last: {report.lastRun}
                            </span>
                            <span className="text-xs font-semibold text-brand-800">
                              Next: {report.nextRun}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${
                                report.status === "ACTIVE"
                                  ? "bg-brand-700 animate-pulse"
                                  : "bg-gray-300"
                              }`}
                            />
                            <Badge
                              className={
                                report.status === "ACTIVE"
                                  ? "bg-brand-700 text-white border-transparent"
                                  : "bg-brand-600 text-white border-transparent"
                              }
                            >
                              {report.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                              title="Run Now"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                              title="Pause/Resume"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                              title="View History"
                            >
                              <HistoryIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-600 hover:text-brand-900 hover:bg-brand-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Schedule Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[640px] border border-gray-200 bg-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-brand-900 px-6 py-4 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 opacity-80" />
                Schedule Report
              </DialogTitle>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                Automation Configuration
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-6 overflow-y-auto">
            <div className="space-y-5">
              {/* Schedule Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                  Schedule Name <span className="text-brand-600">*</span>
                </label>
                <Input
                  placeholder="e.g. Monthly Finance Audit"
                  className="border-gray-200 focus:border-brand-800 focus:ring-brand-800"
                />
              </div>

              {/* Report Type & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                    Report Type <span className="text-brand-600">*</span>
                  </label>
                  <Select defaultValue="daily">
                    <SelectTrigger className="border-gray-200 text-brand-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Attendance</SelectItem>
                      <SelectItem value="monthly">Monthly Summary</SelectItem>
                      <SelectItem value="ot">Overtime Analysis</SelectItem>
                      <SelectItem value="anomaly">Anomaly Intelligence</SelectItem>
                      <SelectItem value="punctuality">Punctuality Matrix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                    Target Department
                  </label>
                  <Select defaultValue="all">
                    <SelectTrigger className="border-gray-200 text-brand-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="eng">Engineering</SelectItem>
                      <SelectItem value="ops">Operations</SelectItem>
                      <SelectItem value="fin">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Timing & Frequency */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-brand-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-700" /> Timing & Frequency
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {["Daily", "Weekly", "Monthly"].map((f) => (
                    <button
                      key={f}
                      className={`py-2.5 rounded-lg border text-xs font-semibold uppercase tracking-wide transition-all ${
                        f === "Weekly"
                          ? "border-brand-800 bg-brand-50 text-brand-900"
                          : "border-gray-200 text-brand-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-brand-600">
                      Preferred Time
                    </p>
                    <Input
                      type="time"
                      defaultValue="09:00"
                      className="border-gray-200 focus:border-brand-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-brand-600">
                      Day of Week
                    </p>
                    <Select defaultValue="monday">
                      <SelectTrigger className="border-gray-200 text-brand-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="first">1st of Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Recipients & Format */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-brand-800 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="h-4 w-4 text-brand-700" /> Recipients & Format
                </h4>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                    Email List (Comma separated)
                  </label>
                  <Textarea
                    placeholder="hr@flexi.com, payroll@flexi.com..."
                    className="border-gray-200 focus:border-brand-800 min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                      Output Format
                    </p>
                    <div className="flex gap-2">
                      {["PDF", "Excel", "Both"].map((fmt) => (
                        <button
                          key={fmt}
                          className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                            fmt === "Excel"
                              ? "bg-brand-800 text-white border-brand-800"
                              : "bg-white text-brand-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-brand-900">
                        Compress files
                      </p>
                      <p className="text-xs text-brand-600">Send as ZIP</p>
                    </div>
                    <div className="relative inline-flex h-5 w-10 items-center rounded-full bg-brand-800">
                      <span className="absolute right-1 h-3 w-3 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg flex gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-700 shrink-0" />
              <p className="text-xs text-brand-700 leading-relaxed">
                Scheduled reports use{" "}
                <span className="font-semibold">Latest Reconciled Data</span>.
                Reports triggered before the daily midnight sync (00:00) will
                contain data up to the last successful device ingestion job.
              </p>
            </div>
          </div>

          <DialogFooter className="px-6 pb-5 pt-2 flex justify-end gap-2 shrink-0 border-t border-gray-200">
            <Button
              variant="outline"
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-brand-800 text-white hover:bg-brand-900">
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduledReportsList;