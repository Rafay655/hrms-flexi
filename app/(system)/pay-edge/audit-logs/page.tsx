"use client";
import React, { useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Cpu,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  History,
  Info,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
type ActionType =
  | "PUNCH_ADDED"
  | "PUNCH_MODIFIED"
  | "PUNCH_DELETED"
  | "RECALCULATED"
  | "REG_APPROVED"
  | "REG_REJECTED"
  | "SHIFT_CHANGED"
  | "POLICY_UPDATED"
  | "MANUAL_OVERRIDE";
interface AuditLog {
  id: string;
  createdAt: string;
  user: { name: string; avatar: string; role: string };
  action: ActionType;
  entity: string;
  employee: { name: string; id: string };
  before: string;
  after: string;
  ip: string;
}
const ACTION_CONFIG: Record<ActionType, { label: string; badgeClass: string }> =
  {
    PUNCH_ADDED: {
      label: "Punch Added",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    PUNCH_MODIFIED: {
      label: "Punch Modified",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    PUNCH_DELETED: {
      label: "Punch Deleted",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
    },
    RECALCULATED: {
      label: "Recalculated",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    },
    REG_APPROVED: {
      label: "Reg. Approved",
      badgeClass: "bg-brand-100 text-brand-800 border-gray-200",
    },
    REG_REJECTED: {
      label: "Reg. Rejected",
      badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    },
    SHIFT_CHANGED: {
      label: "Shift Changed",
      badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    },
    POLICY_UPDATED: {
      label: "Policy Updated",
      badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
    },
    MANUAL_OVERRIDE: {
      label: "Manual Override",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    },
  };
const ACTION_OPTIONS: Array<{ value: "ALL" | ActionType; label: string }> = [
  { value: "ALL", label: "All Action Types" },
  { value: "PUNCH_ADDED", label: "Punch Added" },
  { value: "PUNCH_MODIFIED", label: "Punch Modified" },
  { value: "PUNCH_DELETED", label: "Punch Deleted" },
  { value: "RECALCULATED", label: "Recalculated" },
  { value: "REG_APPROVED", label: "Regularization Approved" },
  { value: "REG_REJECTED", label: "Regularization Rejected" },
  { value: "SHIFT_CHANGED", label: "Shift Changed" },
  { value: "POLICY_UPDATED", label: "Policy Updated" },
  { value: "MANUAL_OVERRIDE", label: "Manual Override" },
];
const PERIOD_OPTIONS = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
] as const;
const PAGE_SIZE = 10;
const BASE_DATE = new Date("2025-01-15T08:00:00");
const MOCK_LOGS: AuditLog[] = Array.from({ length: 50 }).map((_, index) => {
  const dt = new Date(BASE_DATE.getTime() - index * 6 * 60 * 60 * 1000);
  const actions: ActionType[] = [
    "PUNCH_MODIFIED",
    "RECALCULATED",
    "SHIFT_CHANGED",
    "REG_APPROVED",
    "MANUAL_OVERRIDE",
    "PUNCH_ADDED",
    "POLICY_UPDATED",
    "REG_REJECTED",
    "PUNCH_DELETED",
  ];
  const entityMap = [
    "PunchRecord",
    "AttendanceStatus",
    "ShiftAssignment",
    "Regularization",
    "EmployeeProfile",
    "PunchRecord",
    "PolicyConfig",
    "Regularization",
    "PunchRecord",
  ];
  const employees = [
    { name: "Muqadas Mazhar", id: "FLX-101" },
    { name: "Ali Hamza", id: "FLX-102" },
    { name: "Zainab Malik", id: "FLX-103" },
    { name: "Kamran Shah", id: "FLX-104" },
    { name: "Ayesha Noor", id: "FLX-105" },
  ];
  const actor =
    index % 5 === 0
      ? { name: "System Engine", avatar: "SE", role: "AI" }
      : index % 3 === 0
        ? { name: "Bilal Ahmed", avatar: "BA", role: "HR Manager" }
        : { name: "Jane Doe", avatar: "JD", role: "HR Admin" };
  return {
    id: `AUD-${5000 + index}`,
    createdAt: dt.toISOString(),
    user: actor,
    action: actions[index % actions.length],
    entity: entityMap[index % entityMap.length],
    employee: employees[index % employees.length],
    before:
      index % 2 === 0
        ? JSON.stringify(
            { time: "09:00 AM", status: "LATE", source: "Device Sync" },
            null,
            2,
          )
        : JSON.stringify(
            { shift: "Morning", policy: "Standard", grace: 10 },
            null,
            2,
          ),
    after:
      index % 2 === 0
        ? JSON.stringify(
            { time: "08:55 AM", status: "PRESENT", source: "Manual Review" },
            null,
            2,
          )
        : JSON.stringify(
            { shift: "General Flexi", policy: "Flexi", grace: 20 },
            null,
            2,
          ),
    ip: `192.168.1.${10 + index}`,
  };
});
function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function formatRelativeDays(value: string) {
  const date = new Date(value);
  const now = new Date(BASE_DATE);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}
function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
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
export default function TimeSyncAuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [actionFilter, setActionFilter] = useState<"ALL" | ActionType>("ALL");
  const [periodFilter, setPeriodFilter] =
    useState<(typeof PERIOD_OPTIONS)[number]["value"]>("7");
  const [page, setPage] = useState(1);
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date(BASE_DATE);
    const data = [...MOCK_LOGS]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .filter((log) => {
        const matchesSearch =
          !query ||
          [
            log.id,
            log.user.name,
            log.user.role,
            log.employee.name,
            log.employee.id,
            log.entity,
            log.ip,
            ACTION_CONFIG[log.action].label,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        const matchesAction =
          actionFilter === "ALL" || log.action === actionFilter;
        let matchesPeriod = true;
        if (periodFilter !== "all") {
          const days = Number(periodFilter);
          const logDate = new Date(log.createdAt);
          const diffMs = now.getTime() - logDate.getTime();
          matchesPeriod = diffMs <= days * 24 * 60 * 60 * 1000;
        }
        return matchesSearch && matchesAction && matchesPeriod;
      });
    return data;
  }, [searchQuery, actionFilter, periodFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);
  const showingFrom =
    filteredLogs.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo =
    filteredLogs.length === 0
      ? 0
      : Math.min(currentPage * PAGE_SIZE, filteredLogs.length);
  const aiLogs = filteredLogs.filter((log) => log.user.role === "AI").length;
  const manualLogs = filteredLogs.filter(
    (log) => log.user.role !== "AI",
  ).length;
  const handleExport = () => {
    downloadCsv(
      "timesync-audit-pack.csv",
      [
        "Audit ID",
        "Timestamp",
        "Actor",
        "Role",
        "Action",
        "Entity",
        "Employee",
        "Employee ID",
        "IP Address",
        "Before",
        "After",
      ],
      filteredLogs.map((log) => [
        log.id,
        formatDateTime(log.createdAt),
        log.user.name,
        log.user.role,
        ACTION_CONFIG[log.action].label,
        log.entity,
        log.employee.name,
        log.employee.id,
        log.ip,
        log.before,
        log.after,
      ]),
    );
  };
  const handleExportRawMetadata = (log: AuditLog) => {
    downloadCsv(
      `${log.id.toLowerCase()}-metadata.csv`,
      ["Field", "Value"],
      [
        ["Audit ID", log.id],
        ["Timestamp", formatDateTime(log.createdAt)],
        ["Actor", log.user.name],
        ["Role", log.user.role],
        ["Action", ACTION_CONFIG[log.action].label],
        ["Entity", log.entity],
        ["Employee", log.employee.name],
        ["Employee ID", log.employee.id],
        ["IP", log.ip],
        ["Before", log.before],
        ["After", log.after],
      ],
    );
  };
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, actionFilter, periodFilter]);
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
                  <ShieldCheck className="h-5 w-5 text-white" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h2 className="text-2xl font-bold text-brand-900">
                    {" "}
                    System Audit Logs{" "}
                  </h2>{" "}
                  <p className="mt-0.5 text-sm text-brand-700">
                    {" "}
                    Immutable record of all modifications and
                    recalculations{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {" "}
                <div className="relative">
                  {" "}
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />{" "}
                  <select
                    value={periodFilter}
                    onChange={(e) =>
                      setPeriodFilter(
                        e.target
                          .value as (typeof PERIOD_OPTIONS)[number]["value"],
                      )
                    }
                    className="h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    {" "}
                    {PERIOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {" "}
                        {option.label}{" "}
                      </option>
                    ))}{" "}
                  </select>{" "}
                </div>{" "}
                <button
                  onClick={handleExport}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  {" "}
                  <Download className="h-4 w-4" /> Export Audit Pack{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            {" "}
            <SummaryCard
              label="Filtered Logs"
              value={String(filteredLogs.length)}
              helper="Based on current filters"
              icon={<History className="h-4 w-4 text-brand-700" />}
            />{" "}
            <SummaryCard
              label="AI Actions"
              value={String(aiLogs)}
              helper="System-generated entries"
              icon={<Cpu className="h-4 w-4 text-brand-700" />}
            />{" "}
            <SummaryCard
              label="Manual Actions"
              value={String(manualLogs)}
              helper="User-triggered changes"
              icon={<User className="h-4 w-4 text-brand-700" />}
            />{" "}
            <SummaryCard
              label="Retention Policy"
              value="7 Years"
              helper="Compliance preservation window"
              icon={<Clock className="h-4 w-4 text-brand-700" />}
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
                  {filteredLogs.length}
                </span>{" "}
                <span className="text-brand-700"> audit entries</span>{" "}
              </div>{" "}
              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                {" "}
                <span>
                  {" "}
                  <span className="font-semibold text-brand-900">
                    {aiLogs}
                  </span>{" "}
                  AI{" "}
                </span>{" "}
                <span className="h-3 w-px bg-brand-300" />{" "}
                <span>
                  {" "}
                  <span className="font-semibold text-brand-900">
                    {manualLogs}
                  </span>{" "}
                  manual{" "}
                </span>{" "}
                <span className="h-3 w-px bg-brand-300" />{" "}
                <span>
                  {" "}
                  <span className="font-semibold text-brand-900">
                    {periodFilter === "all" ? "All" : `${periodFilter}d`}
                  </span>{" "}
                  window{" "}
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
              <div>
                {" "}
                <h3 className="text-sm font-semibold text-brand-900">
                  {" "}
                  Audit Log Explorer{" "}
                </h3>{" "}
                <p className="mt-0.5 text-sm text-brand-700">
                  {" "}
                  Search and inspect audit trail events{" "}
                </p>{" "}
              </div>{" "}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {" "}
                <div className="relative">
                  {" "}
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />{" "}
                  <input
                    type="text"
                    placeholder="Search by ID, user, employee, entity..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800 sm:w-72"
                  />{" "}
                </div>{" "}
                <div className="relative">
                  {" "}
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />{" "}
                  <select
                    value={actionFilter}
                    onChange={(e) =>
                      setActionFilter(e.target.value as "ALL" | ActionType)
                    }
                    className="h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    {" "}
                    {ACTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {" "}
                        {option.label}{" "}
                      </option>
                    ))}{" "}
                  </select>{" "}
                </div>{" "}
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
                    Timestamp{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Actor{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Action{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Entity{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Affected Employee{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    IP Address{" "}
                  </th>{" "}
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    {" "}
                    Action{" "}
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-brand-300/50 bg-white">
                {" "}
                {paginatedLogs.length === 0 ? (
                  <tr>
                    {" "}
                    <td colSpan={7} className="px-5 py-14 text-center">
                      {" "}
                      <div className="flex flex-col items-center gap-2">
                        {" "}
                        <History className="h-8 w-8 text-brand-300" />{" "}
                        <p className="text-sm font-semibold text-brand-900">
                          {" "}
                          No audit logs found{" "}
                        </p>{" "}
                        <p className="text-sm text-brand-700">
                          {" "}
                          Try changing the search or action filter.{" "}
                        </p>{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-brand-100"
                    >
                      {" "}
                      <td className="px-5 py-3.5 text-sm">
                        {" "}
                        <div>
                          {" "}
                          <div className="font-semibold text-brand-900">
                            {" "}
                            {formatDateTime(log.createdAt)}{" "}
                          </div>{" "}
                          <div className="text-[11px] text-brand-700">
                            {" "}
                            {log.id} · {formatRelativeDays(log.createdAt)}{" "}
                          </div>{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5 text-sm">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <div
                            className={
                              log.user.role === "AI"
                                ? "flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-800"
                                : "flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold"
                            }
                          >
                            {" "}
                            {log.user.role === "AI" ? (
                              <Cpu className="h-4 w-4" />
                            ) : (
                              log.user.avatar
                            )}{" "}
                          </div>{" "}
                          <div>
                            {" "}
                            <div className="font-semibold text-brand-900">
                              {" "}
                              {log.user.name}{" "}
                            </div>{" "}
                            <div className="text-[11px] text-brand-700">
                              {" "}
                              {log.user.role}{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5">
                        {" "}
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${ACTION_CONFIG[log.action].badgeClass}`}
                        >
                          {" "}
                          {ACTION_CONFIG[log.action].label}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5 text-sm text-brand-900">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <Database className="h-4 w-4 text-brand-700" />{" "}
                          {log.entity}{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5 text-sm">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <User className="h-4 w-4 text-brand-700" />{" "}
                          <div>
                            {" "}
                            <div className="font-semibold text-brand-900">
                              {" "}
                              {log.employee.name}{" "}
                            </div>{" "}
                            <div className="text-[11px] text-brand-700">
                              {" "}
                              {log.employee.id}{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5 text-sm text-brand-900">
                        {" "}
                        {log.ip}{" "}
                      </td>{" "}
                      <td className="px-5 py-3.5 text-right">
                        {" "}
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                          title="View event"
                        >
                          {" "}
                          <Eye className="h-4 w-4" />{" "}
                        </button>{" "}
                      </td>{" "}
                    </tr>
                  ))
                )}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
          {filteredLogs.length > 0 && (
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
                  <IconButton
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1}
                    icon={<ChevronsLeft className="h-4 w-4" />}
                  />{" "}
                  <IconButton
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
                  <IconButton
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    icon={<ChevronRight className="h-4 w-4" />}
                  />{" "}
                  <IconButton
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
                    {" "}
                    {filteredLogs.length}{" "}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
        {selectedLog && (
          <div className="fixed inset-0 z-[200] flex items-stretch justify-end">
            {" "}
            <div
              className="absolute inset-0 bg-gray-900/50"
              onClick={() => setSelectedLog(null)}
            />{" "}
            <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
              {" "}
              <div className="border-b border-gray-200 px-6 py-5">
                {" "}
                <div className="flex items-start justify-between gap-4">
                  {" "}
                  <div className="flex items-start gap-3">
                    {" "}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                      {" "}
                      <History className="h-5 w-5 text-white" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h3 className="text-xl font-bold text-brand-900">
                        {" "}
                        Event Inspector{" "}
                      </h3>{" "}
                      <p className="mt-0.5 text-sm text-brand-700">
                        {" "}
                        {selectedLog.id} ·{" "}
                        {formatDateTime(selectedLog.createdAt)}{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                  >
                    {" "}
                    <X className="h-4 w-4" />{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {" "}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {" "}
                  <ContextCard
                    label="Initiated By"
                    value={selectedLog.user.name}
                    meta={selectedLog.user.role}
                  />{" "}
                  <ContextCard
                    label="Action Type"
                    value={ACTION_CONFIG[selectedLog.action].label}
                    meta={`Source IP: ${selectedLog.ip}`}
                    badgeClass={ACTION_CONFIG[selectedLog.action].badgeClass}
                  />{" "}
                </div>{" "}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  {" "}
                  <div className="border-b border-gray-200 px-5 py-4">
                    {" "}
                    <h4 className="text-sm font-semibold text-brand-900">
                      {" "}
                      State Transition Detail{" "}
                    </h4>{" "}
                    <p className="mt-0.5 text-sm text-brand-700">
                      {" "}
                      Before and after values for this audited event{" "}
                    </p>{" "}
                  </div>{" "}
                  <div className="space-y-4 p-5">
                    {" "}
                    <div>
                      {" "}
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-700">
                        {" "}
                        Previous State{" "}
                      </p>{" "}
                      <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
                        {" "}
                        <pre className="whitespace-pre-wrap text-sm leading-6 text-red-700">
                          {" "}
                          {selectedLog.before}{" "}
                        </pre>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="flex justify-center">
                      {" "}
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white">
                        {" "}
                        <ChevronRight className="h-4 w-4 rotate-90 text-brand-700" />{" "}
                      </div>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        {" "}
                        Modified State{" "}
                      </p>{" "}
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                        {" "}
                        <pre className="whitespace-pre-wrap text-sm leading-6 text-emerald-700">
                          {" "}
                          {selectedLog.after}{" "}
                        </pre>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  {" "}
                  <div className="flex items-start gap-3">
                    {" "}
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                      {" "}
                      <Info className="h-4 w-4 text-brand-800" />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="text-sm font-semibold text-brand-900">
                        {" "}
                        Log Security{" "}
                      </h4>{" "}
                      <p className="mt-1 text-sm leading-6 text-brand-700">
                        {" "}
                        This entry is cryptographically signed and treated as an
                        immutable audit record. The event snapshot includes
                        actor, timestamp, action type, source IP, and entity
                        changes.{" "}
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
                    onClick={() => handleExportRawMetadata(selectedLog)}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    {" "}
                    <FileText className="h-4 w-4" /> Raw Metadata{" "}
                  </button>{" "}
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                  >
                    {" "}
                    Close View{" "}
                  </button>{" "}
                </div>{" "}
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
function ContextCard({
  label,
  value,
  meta,
  badgeClass,
}: {
  label: string;
  value: string;
  meta: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {" "}
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
        {" "}
        {label}{" "}
      </p>{" "}
      {badgeClass ? (
        <div className="mt-3">
          {" "}
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
          >
            {" "}
            {value}{" "}
          </span>{" "}
        </div>
      ) : (
        <p className="mt-2 text-sm font-semibold text-brand-900">{value}</p>
      )}{" "}
      <p className="mt-2 text-[11px] text-brand-700">{meta}</p>{" "}
    </div>
  );
}
function IconButton({
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
