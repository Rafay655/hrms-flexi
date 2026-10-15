"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  Mail,
  Clock,
  FileText,
  Play,
  Edit3,
  Trash2,
  X,
  Save,
  Download,
  Pause,
  History as HistoryIcon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
type Frequency = "Daily" | "Weekly" | "Monthly";
type ReportFormat = "PDF" | "Excel" | "Both";
type ReportStatus = "ACTIVE" | "PAUSED";
type ModalMode = "create" | "edit";
interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  department: string;
  frequency: Frequency;
  time: string;
  scheduleDay: string;
  recipients: string[];
  lastRun: string;
  nextRun: string;
  format: ReportFormat;
  status: ReportStatus;
  compressFiles: boolean;
  history: string[];
}
interface ReportFormState {
  name: string;
  type: string;
  department: string;
  frequency: Frequency;
  time: string;
  scheduleDay: string;
  recipientsText: string;
  format: ReportFormat;
  compressFiles: boolean;
  status: ReportStatus;
}
const PAGE_SIZE = 8;
const INITIAL_REPORTS: ScheduledReport[] = [
  {
    id: "SR-001",
    name: "Morning Adherence Summary",
    type: "Daily Attendance",
    department: "All Departments",
    frequency: "Daily",
    time: "10:00",
    scheduleDay: "Every Day",
    recipients: ["hr@flexi.com", "ops@flexi.com"],
    lastRun: "Today, 10:00 AM",
    nextRun: "Tomorrow, 10:00 AM",
    format: "Excel",
    status: "ACTIVE",
    compressFiles: false,
    history: [
      "Today, 10:00 AM · Delivered successfully",
      "Yesterday, 10:00 AM · Delivered successfully",
    ],
  },
  {
    id: "SR-002",
    name: "Weekly Overtime Leakage",
    type: "OT Analysis",
    department: "Finance",
    frequency: "Weekly",
    time: "09:00",
    scheduleDay: "Monday",
    recipients: ["finance@flexi.com"],
    lastRun: "Jan 06, 09:00 AM",
    nextRun: "Jan 13, 09:00 AM",
    format: "Both",
    status: "ACTIVE",
    compressFiles: true,
    history: [
      "Jan 06, 09:00 AM · Delivered successfully",
      "Dec 30, 09:00 AM · Delivered successfully",
    ],
  },
  {
    id: "SR-003",
    name: "Monthly Compliance Audit",
    type: "Anomaly Report",
    department: "Compliance",
    frequency: "Monthly",
    time: "10:00",
    scheduleDay: "1st of Month",
    recipients: ["compliance@flexi.com"],
    lastRun: "Jan 01, 10:00 AM",
    nextRun: "Feb 01, 10:00 AM",
    format: "PDF",
    status: "PAUSED",
    compressFiles: false,
    history: [
      "Jan 01, 10:00 AM · Delivered successfully",
      "Dec 01, 10:00 AM · Delivered successfully",
    ],
  },
  {
    id: "SR-004",
    name: "Late Arrival Daily Alert",
    type: "Punctuality",
    department: "Engineering",
    frequency: "Daily",
    time: "09:30",
    scheduleDay: "Every Day",
    recipients: ["mgr_engineering@flexi.com"],
    lastRun: "Today, 09:30 AM",
    nextRun: "Tomorrow, 09:30 AM",
    format: "PDF",
    status: "ACTIVE",
    compressFiles: false,
    history: [
      "Today, 09:30 AM · Delivered successfully",
      "Yesterday, 09:30 AM · Delivered successfully",
    ],
  },
  {
    id: "SR-005",
    name: "Dept Attendance Benchmark",
    type: "Monthly Summary",
    department: "Board",
    frequency: "Monthly",
    time: "17:00",
    scheduleDay: "Last day of month",
    recipients: ["board@flexi.com"],
    lastRun: "Dec 31, 05:00 PM",
    nextRun: "Jan 31, 05:00 PM",
    format: "Excel",
    status: "ACTIVE",
    compressFiles: true,
    history: [
      "Dec 31, 05:00 PM · Delivered successfully",
      "Nov 30, 05:00 PM · Delivered successfully",
    ],
  },
];
function createEmptyForm(): ReportFormState {
  return {
    name: "",
    type: "Daily Attendance",
    department: "All Departments",
    frequency: "Daily",
    time: "09:00",
    scheduleDay: "Every Day",
    recipientsText: "",
    format: "PDF",
    compressFiles: false,
    status: "ACTIVE",
  };
}
function formatTimeDisplay(time24: string) {
  const [hours, minutes] = time24.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
function buildNextRunText(
  frequency: Frequency,
  scheduleDay: string,
  time: string,
) {
  const formattedTime = formatTimeDisplay(time);
  if (frequency === "Daily") return `Tomorrow, ${formattedTime}`;
  if (frequency === "Weekly") return `${scheduleDay}, ${formattedTime}`;
  return `${scheduleDay}, ${formattedTime}`;
}
function buildLastRunNow() {
  const now = new Date();
  return now.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}
function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean>>,
) {
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
export default function ScheduledReportsList() {
  const [reports, setReports] = useState<ScheduledReport[]>(INITIAL_REPORTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "PAUSED">(
    "ALL",
  );
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReportFormState>(createEmptyForm());
  const [historyReport, setHistoryReport] = useState<ScheduledReport | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        [
          report.name,
          report.type,
          report.department,
          report.recipients.join(" "),
          report.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesTab = activeTab === "ALL" || report.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [reports, searchQuery, activeTab]);
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, currentPage]);
  const showingFrom =
    filteredReports.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo =
    filteredReports.length === 0
      ? 0
      : Math.min(currentPage * PAGE_SIZE, filteredReports.length);
  const activeCount = reports.filter(
    (report) => report.status === "ACTIVE",
  ).length;
  const pausedCount = reports.filter(
    (report) => report.status === "PAUSED",
  ).length;
  const totalRecipients = reports.reduce(
    (sum, report) => sum + report.recipients.length,
    0,
  );
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab]);
  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setForm(createEmptyForm());
    setIsModalOpen(true);
  };
  const openEditModal = (report: ScheduledReport) => {
    setModalMode("edit");
    setEditingId(report.id);
    setForm({
      name: report.name,
      type: report.type,
      department: report.department,
      frequency: report.frequency,
      time: report.time,
      scheduleDay: report.scheduleDay,
      recipientsText: report.recipients.join(", "),
      format: report.format,
      compressFiles: report.compressFiles,
      status: report.status,
    });
    setIsModalOpen(true);
  };
  const handleSave = () => {
    const recipients = form.recipientsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!form.name.trim() || recipients.length === 0) return;
    const reportPayload: ScheduledReport = {
      id: editingId ?? `SR-${String(Date.now()).slice(-6)}`,
      name: form.name.trim(),
      type: form.type,
      department: form.department,
      frequency: form.frequency,
      time: form.time,
      scheduleDay: form.scheduleDay,
      recipients,
      lastRun: editingId
        ? (reports.find((r) => r.id === editingId)?.lastRun ?? "Not run yet")
        : "Not run yet",
      nextRun: buildNextRunText(form.frequency, form.scheduleDay, form.time),
      format: form.format,
      status: form.status,
      compressFiles: form.compressFiles,
      history: reports.find((r) => r.id === editingId)?.history ?? [
        "Schedule created · Pending first execution",
      ],
    };
    if (editingId) {
      setReports((prev) =>
        prev.map((report) =>
          report.id === editingId ? reportPayload : report,
        ),
      );
    } else {
      setReports((prev) => [reportPayload, ...prev]);
    }
    setIsModalOpen(false);
  };
  const handleToggleStatus = (id: string) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id
          ? {
              ...report,
              status: report.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
              history: [
                `${buildLastRunNow()} · ${report.status === "ACTIVE" ? "Schedule paused" : "Schedule resumed"}`,
                ...report.history,
              ],
            }
          : report,
      ),
    );
  };
  const handleRunNow = (id: string) => {
    const lastRun = buildLastRunNow();
    setReports((prev) =>
      prev.map((report) =>
        report.id === id
          ? {
              ...report,
              lastRun,
              nextRun: buildNextRunText(
                report.frequency,
                report.scheduleDay,
                report.time,
              ),
              history: [`${lastRun} · Manually triggered`, ...report.history],
            }
          : report,
      ),
    );
  };
  const confirmDelete = () => {
    if (!deleteId) return;
    setReports((prev) => prev.filter((report) => report.id !== deleteId));
    setDeleteId(null);
  };
  const handleExport = () => {
    downloadCsv(
      "scheduled-reports.csv",
      [
        "ID",
        "Name",
        "Type",
        "Department",
        "Frequency",
        "Schedule Day",
        "Time",
        "Recipients",
        "Format",
        "Status",
        "Last Run",
        "Next Run",
        "Compress Files",
      ],
      filteredReports.map((report) => [
        report.id,
        report.name,
        report.type,
        report.department,
        report.frequency,
        report.scheduleDay,
        formatTimeDisplay(report.time),
        report.recipients.join("; "),
        report.format,
        report.status,
        report.lastRun,
        report.nextRun,
        report.compressFiles,
      ]),
    );
  };
  return (
    <div className="min-h-screen bg-white p-3">
      {" "}
      <div className="space-y-4">
        {" "}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {" "}
          <div className="border-b border-gray-200 px-6 py-5">
            {" "}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {" "}
              <div className="flex items-start gap-3">
                {" "}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  {" "}
                  <CalendarClock className="h-5 w-5 text-white" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h2 className="text-2xl font-bold text-brand-900">
                    {" "}
                    Scheduled Reports{" "}
                  </h2>{" "}
                  <p className="mt-0.5 text-sm text-brand-700">
                    {" "}
                    Manage automated distribution of attendance and compliance
                    data{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {" "}
                <button
                  onClick={handleExport}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                >
                  {" "}
                  <Download className="h-4 w-4" /> Export{" "}
                </button>{" "}
                <button
                  onClick={openCreateModal}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  {" "}
                  <Plus className="h-4 w-4" /> Schedule New{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            {" "}
            <SummaryCard
              label="Total Schedules"
              value={String(reports.length)}
              helper="Configured automated reports"
              icon={<FileText className="h-4 w-4 text-brand-700" />}
            />{" "}
            <SummaryCard
              label="Active"
              value={String(activeCount)}
              helper="Running on schedule"
              icon={<Play className="h-4 w-4 text-brand-700" />}
            />{" "}
            <SummaryCard
              label="Paused"
              value={String(pausedCount)}
              helper="Temporarily stopped"
              icon={<Pause className="h-4 w-4 text-brand-700" />}
            />{" "}
            <SummaryCard
              label="Recipients"
              value={String(totalRecipients)}
              helper="Total configured email endpoints"
              icon={<Mail className="h-4 w-4 text-brand-700" />}
            />{" "}
          </div>{" "}
          <div className="px-6 pb-6">
            {" "}
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              {" "}
              <div className="text-sm">
                {" "}
                <span className="text-brand-700">Showing </span>{" "}
                <span className="font-semibold text-brand-900">
                  {showingFrom}
                </span>{" "}
                <span className="text-brand-700"> to </span>{" "}
                <span className="font-semibold text-brand-900">
                  {showingTo}
                </span>{" "}
                <span className="text-brand-700"> of </span>{" "}
                <span className="font-semibold text-brand-900">
                  {filteredReports.length}
                </span>{" "}
                <span className="text-brand-700"> schedules</span>{" "}
              </div>{" "}
              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                {" "}
                <span>
                  {" "}
                  <span className="font-semibold text-brand-900">
                    {activeCount}
                  </span>{" "}
                  active{" "}
                </span>{" "}
                <span className="h-3 w-px bg-brand-300" />{" "}
                <span>
                  {" "}
                  <span className="font-semibold text-brand-900">
                    {pausedCount}
                  </span>{" "}
                  paused{" "}
                </span>{" "}
                <span className="h-3 w-px bg-brand-300" />{" "}
                <span>
                  {" "}
                  <span className="font-semibold text-brand-900">
                    {totalRecipients}
                  </span>{" "}
                  recipients{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {" "}
          <div className="border-b border-gray-200 px-5 py-4">
            {" "}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {" "}
              <div className="flex flex-wrap items-center gap-2">
                {" "}
                {(["ALL", "ACTIVE", "PAUSED"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={
                      activeTab === tab
                        ? "inline-flex h-9 items-center justify-center rounded-lg border border-brand-800 bg-brand-800 px-4 text-sm font-semibold text-white"
                        : "inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                    }
                  >
                    {" "}
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}{" "}
                  </button>
                ))}{" "}
              </div>{" "}
              <div className="relative w-full lg:w-80">
                {" "}
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />{" "}
                <input
                  type="text"
                  placeholder="Search by name, type, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="overflow-x-auto">
            {" "}
            <table className="w-full">
              {" "}
              <thead className="border-b border-gray-200">
                {" "}
                <tr>
                  {" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Report Name{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Schedule{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Recipients{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Format{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Last / Next Run{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Status{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Actions{" "}
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-brand-300/50 bg-white">
                {" "}
                {paginatedReports.length === 0 ? (
                  <tr>
                    {" "}
                    <td colSpan={7} className="px-5 py-14 text-center">
                      {" "}
                      <div className="flex flex-col items-center gap-2">
                        {" "}
                        <CalendarClock className="h-8 w-8 text-brand-300" />{" "}
                        <p className="text-sm font-semibold text-brand-900">
                          {" "}
                          No scheduled reports found{" "}
                        </p>{" "}
                        <p className="text-sm text-brand-700">
                          {" "}
                          Try changing the search or status filter.{" "}
                        </p>{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>
                ) : (
                  paginatedReports.map((report) => (
                    <tr
                      key={report.id}
                      className="transition-colors hover:bg-brand-100"
                    >
                      {" "}
                      <td className="px-5 py-3.5 text-sm">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                            {" "}
                            <FileText className="h-4 w-4 text-brand-800" />{" "}
                          </div>{" "}
                          <div>
                            {" "}
                            <div className="font-semibold text-brand-900">
                              {report.name}
                            </div>{" "}
                            <div className="text-[11px] text-brand-700">
                              {" "}
                              {report.type} · {report.department}{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5 text-sm">
                        {" "}
                        <div className="font-semibold text-brand-900">
                          {" "}
                          {report.frequency}{" "}
                        </div>{" "}
                        <div className="text-[11px] text-brand-700">
                          {" "}
                          {report.scheduleDay === "Every Day"
                            ? formatTimeDisplay(report.time)
                            : `${report.scheduleDay}, ${formatTimeDisplay(report.time)}`}{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5 text-sm">
                        {" "}
                        <div className="font-semibold text-brand-900">
                          {" "}
                          {report.recipients[0]}{" "}
                        </div>{" "}
                        <div className="text-[11px] text-brand-700">
                          {" "}
                          {report.recipients.length === 1
                            ? "1 recipient"
                            : `${report.recipients.length} recipients`}{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5">
                        {" "}
                        <FormatBadge format={report.format} />{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5 text-sm">
                        {" "}
                        <div className="text-brand-900">
                          {report.lastRun}
                        </div>{" "}
                        <div className="text-[11px] text-brand-700">
                          {report.nextRun}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5">
                        {" "}
                        <StatusBadge status={report.status} />{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5">
                        {" "}
                        <div className="flex items-center justify-end gap-1">
                          {" "}
                          <IconActionButton
                            onClick={() => handleRunNow(report.id)}
                            title="Run now"
                            icon={<Play className="h-4 w-4" />}
                          />{" "}
                          <IconActionButton
                            onClick={() => openEditModal(report)}
                            title="Edit"
                            icon={<Edit3 className="h-4 w-4" />}
                          />{" "}
                          <IconActionButton
                            onClick={() => handleToggleStatus(report.id)}
                            title={
                              report.status === "ACTIVE" ? "Pause" : "Resume"
                            }
                            icon={<Pause className="h-4 w-4" />}
                          />{" "}
                          <IconActionButton
                            onClick={() => setHistoryReport(report)}
                            title="View history"
                            icon={<HistoryIcon className="h-4 w-4" />}
                          />{" "}
                          <IconActionButton
                            onClick={() => setDeleteId(report.id)}
                            title="Delete"
                            icon={<Trash2 className="h-4 w-4" />}
                          />{" "}
                        </div>{" "}
                      </td>{" "}
                    </tr>
                  ))
                )}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
          {filteredReports.length > 0 && (
            <div className="border-t border-gray-200 px-5 py-4">
              {" "}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {" "}
                <div className="text-sm text-brand-700">
                  {" "}
                  Page{" "}
                  <span className="font-semibold text-brand-900">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-brand-900">
                    {totalPages}
                  </span>{" "}
                </div>{" "}
                <div className="flex items-center gap-1.5">
                  {" "}
                  <PaginationButton
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                    icon={<ChevronsLeft className="h-4 w-4" />}
                  />{" "}
                  <PaginationButton
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    icon={<ChevronLeft className="h-4 w-4" />}
                  />{" "}
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, index) => {
                      let pageNumber = 1;
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setPage(pageNumber)}
                          className={
                            pageNumber === currentPage
                              ? "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-brand-800 bg-brand-800 px-3 text-sm font-semibold text-white"
                              : "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                          }
                        >
                          {" "}
                          {pageNumber}{" "}
                        </button>
                      );
                    },
                  )}{" "}
                  <PaginationButton
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    icon={<ChevronRight className="h-4 w-4" />}
                  />{" "}
                  <PaginationButton
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages}
                    icon={<ChevronsRight className="h-4 w-4" />}
                  />{" "}
                </div>{" "}
                <div className="text-sm text-brand-700">
                  {" "}
                  <span className="font-semibold text-brand-900">
                    {showingFrom}
                  </span>{" "}
                  {" – "}{" "}
                  <span className="font-semibold text-brand-900">
                    {showingTo}
                  </span>{" "}
                  {" of "}{" "}
                  <span className="font-semibold text-brand-900">
                    {filteredReports.length}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {" "}
            <div
              className="absolute inset-0 bg-gray-900/50"
              onClick={() => setIsModalOpen(false)}
            />{" "}
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              {" "}
              <div className="border-b border-gray-200 px-6 py-5">
                {" "}
                <div className="flex items-start justify-between gap-4">
                  {" "}
                  <div className="flex items-start gap-3">
                    {" "}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                      {" "}
                      <CalendarClock className="h-5 w-5 text-white" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h3 className="text-xl font-bold text-brand-900">
                        {" "}
                        {modalMode === "create"
                          ? "Schedule Report"
                          : "Edit Schedule"}{" "}
                      </h3>{" "}
                      <p className="mt-0.5 text-sm text-brand-700">
                        {" "}
                        Configure automated report delivery{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                  >
                    {" "}
                    <X className="h-4 w-4" />{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {" "}
                <div className="space-y-2">
                  {" "}
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Schedule Name *{" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                    placeholder="e.g. Monthly Finance Audit"
                  />{" "}
                </div>{" "}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {" "}
                  <FieldSelect
                    label="Report Type *"
                    value={form.type}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, type: value }))
                    }
                    options={[
                      "Daily Attendance",
                      "Monthly Summary",
                      "OT Analysis",
                      "Anomaly Report",
                      "Punctuality",
                    ]}
                  />{" "}
                  <FieldSelect
                    label="Target Department"
                    value={form.department}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, department: value }))
                    }
                    options={[
                      "All Departments",
                      "Engineering",
                      "Operations",
                      "Finance",
                      "Compliance",
                      "Board",
                    ]}
                  />{" "}
                </div>{" "}
                <div className="space-y-3">
                  {" "}
                  <h4 className="text-sm font-semibold text-brand-900">
                    {" "}
                    Timing & Frequency{" "}
                  </h4>{" "}
                  <div className="flex flex-wrap gap-2">
                    {" "}
                    {(["Daily", "Weekly", "Monthly"] as Frequency[]).map(
                      (frequency) => (
                        <button
                          key={frequency}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              frequency,
                              scheduleDay:
                                frequency === "Daily"
                                  ? "Every Day"
                                  : frequency === "Weekly"
                                    ? "Monday"
                                    : "1st of Month",
                            }))
                          }
                          className={
                            form.frequency === frequency
                              ? "inline-flex h-10 items-center justify-center rounded-lg border border-brand-800 bg-brand-800 px-4 text-sm font-semibold text-white"
                              : "inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                          }
                        >
                          {" "}
                          {frequency}{" "}
                        </button>
                      ),
                    )}{" "}
                  </div>{" "}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                        {" "}
                        Preferred Time{" "}
                      </label>{" "}
                      <input
                        type="time"
                        value={form.time}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, time: e.target.value }))
                        }
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      />{" "}
                    </div>{" "}
                    <FieldSelect
                      label={
                        form.frequency === "Monthly" ? "Day of Month" : "Day"
                      }
                      value={form.scheduleDay}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, scheduleDay: value }))
                      }
                      options={
                        form.frequency === "Daily"
                          ? ["Every Day"]
                          : form.frequency === "Weekly"
                            ? [
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                              ]
                            : [
                                "1st of Month",
                                "15th of Month",
                                "Last day of month",
                              ]
                      }
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-3">
                  {" "}
                  <h4 className="text-sm font-semibold text-brand-900">
                    {" "}
                    Recipients & Format{" "}
                  </h4>{" "}
                  <div className="space-y-2">
                    {" "}
                    <label className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                      {" "}
                      Email List *{" "}
                    </label>{" "}
                    <textarea
                      value={form.recipientsText}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          recipientsText: e.target.value,
                        }))
                      }
                      className="min-h-[96px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                      placeholder="hr@flexi.com, payroll@flexi.com"
                    />{" "}
                  </div>{" "}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {" "}
                    <div className="space-y-2">
                      {" "}
                      <label className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                        {" "}
                        Output Format{" "}
                      </label>{" "}
                      <div className="flex gap-2">
                        {" "}
                        {(["PDF", "Excel", "Both"] as ReportFormat[]).map(
                          (format) => (
                            <button
                              key={format}
                              onClick={() =>
                                setForm((prev) => ({ ...prev, format }))
                              }
                              className={
                                form.format === format
                                  ? "inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-brand-800 bg-brand-800 px-3 text-sm font-semibold text-white"
                                  : "inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                              }
                            >
                              {" "}
                              {format}{" "}
                            </button>
                          ),
                        )}{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {" "}
                      <div>
                        {" "}
                        <div className="text-sm font-semibold text-brand-900">
                          {" "}
                          Compress Files{" "}
                        </div>{" "}
                        <div className="text-[11px] text-brand-700">
                          {" "}
                          Send attachments as ZIP{" "}
                        </div>{" "}
                      </div>{" "}
                      <button
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            compressFiles: !prev.compressFiles,
                          }))
                        }
                        className={
                          form.compressFiles
                            ? "relative h-6 w-11 rounded-full bg-brand-800 transition"
                            : "relative h-6 w-11 rounded-full bg-gray-300 transition"
                        }
                      >
                        {" "}
                        <span
                          className={
                            form.compressFiles
                              ? "absolute right-1 top-1 h-4 w-4 rounded-full bg-white"
                              : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white"
                          }
                        />{" "}
                      </button>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  {" "}
                  <div className="flex items-start gap-3">
                    {" "}
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                      {" "}
                      <ShieldCheck className="h-4 w-4 text-brand-800" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="text-sm font-semibold text-brand-900">
                        {" "}
                        Delivery Note{" "}
                      </h4>{" "}
                      <p className="mt-1 text-sm leading-6 text-brand-700">
                        {" "}
                        Scheduled reports use the latest reconciled dataset.
                        Reports triggered before the daily sync cut-off may
                        reflect the most recent successful ingestion job.{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="border-t border-gray-200 px-6 py-4">
                {" "}
                <div className="flex flex-col gap-2 sm:flex-row">
                  {" "}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    {" "}
                    Cancel{" "}
                  </button>{" "}
                  <button
                    onClick={handleSave}
                    className="inline-flex h-10 flex-[1.5] items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                  >
                    {" "}
                    <Save className="h-4 w-4" />{" "}
                    {modalMode === "create"
                      ? "Confirm Schedule"
                      : "Save Changes"}{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {historyReport && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {" "}
            <div
              className="absolute inset-0 bg-gray-900/50"
              onClick={() => setHistoryReport(null)}
            />{" "}
            <div className="relative w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-2xl">
              {" "}
              <div className="border-b border-gray-200 px-6 py-5">
                {" "}
                <div className="flex items-start justify-between gap-4">
                  {" "}
                  <div className="flex items-start gap-3">
                    {" "}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                      {" "}
                      <HistoryIcon className="h-5 w-5 text-white" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h3 className="text-xl font-bold text-brand-900">
                        {" "}
                        Schedule History{" "}
                      </h3>{" "}
                      <p className="mt-0.5 text-sm text-brand-700">
                        {" "}
                        {historyReport.name}{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <button
                    onClick={() => setHistoryReport(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                  >
                    {" "}
                    <X className="h-4 w-4" />{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-3 p-6">
                {" "}
                {historyReport.history.map((entry, index) => (
                  <div
                    key={`${historyReport.id}-${index}`}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    {" "}
                    <div className="text-sm text-brand-900">{entry}</div>{" "}
                  </div>
                ))}{" "}
                {historyReport.history.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
                    {" "}
                    <p className="text-sm font-semibold text-brand-900">
                      {" "}
                      No history available{" "}
                    </p>{" "}
                    <p className="mt-1 text-sm text-brand-700">
                      {" "}
                      This schedule has not run yet.{" "}
                    </p>{" "}
                  </div>
                )}{" "}
              </div>{" "}
              <div className="border-t border-gray-200 px-6 py-4">
                {" "}
                <button
                  onClick={() => setHistoryReport(null)}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  {" "}
                  Close{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {deleteId && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            {" "}
            <div
              className="absolute inset-0 bg-gray-900/50"
              onClick={() => setDeleteId(null)}
            />{" "}
            <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl">
              {" "}
              <div className="border-b border-gray-200 px-6 py-5">
                {" "}
                <h3 className="text-xl font-bold text-brand-900">
                  Delete Schedule?
                </h3>{" "}
                <p className="mt-1 text-sm text-brand-700">
                  {" "}
                  This scheduled report will be removed from the automation
                  list.{" "}
                </p>{" "}
              </div>{" "}
              <div className="flex gap-2 px-6 py-4">
                {" "}
                <button
                  onClick={() => setDeleteId(null)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
                <button
                  onClick={confirmDelete}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  {" "}
                  Delete{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {" "}
      <div className="mb-3 flex items-center justify-between">
        {" "}
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
          {" "}
          {label}{" "}
        </p>{" "}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
          {" "}
          {icon}{" "}
        </div>{" "}
      </div>{" "}
      <div className="text-2xl font-bold text-brand-900">{value}</div>{" "}
      <p className="mt-2 text-[11px] text-brand-700">{helper}</p>{" "}
    </div>
  );
}
function StatusBadge({ status }: { status: ReportStatus }) {
  const classes =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {" "}
      {status === "ACTIVE" ? "Active" : "Paused"}{" "}
    </span>
  );
}
function FormatBadge({ format }: { format: ReportFormat }) {
  const classes =
    format === "Excel"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : format === "PDF"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {" "}
      {format}{" "}
    </span>
  );
}
function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      {" "}
      <label className="text-xs font-semibold uppercase tracking-wider text-brand-800">
        {" "}
        {label}{" "}
      </label>{" "}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
      >
        {" "}
        {options.map((option) => (
          <option key={option} value={option}>
            {" "}
            {option}{" "}
          </option>
        ))}{" "}
      </select>{" "}
    </div>
  );
}
function IconActionButton({
  onClick,
  title,
  icon,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
    >
      {" "}
      {icon}{" "}
    </button>
  );
}
function PaginationButton({
  onClick,
  disabled,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {" "}
      {icon}{" "}
    </button>
  );
}
