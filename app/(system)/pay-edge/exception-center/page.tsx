"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Mail,
  RefreshCw,
  Landmark,
  User,
  FileWarning,
  TrendingUp,
  Zap,
  MoreVertical,
  X,
  ArrowRight,
  Eye,
  Clock3,
  Bell,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExceptionSeverity = "CRITICAL" | "WARNING" | "RESOLVED";
type ExceptionType = "BANK" | "NEGATIVE" | "STATUTORY" | "VARIANCE";
type SeverityTab = "ALL" | "CRITICAL" | "WARNING" | "RESOLVED";

interface PayrollException {
  id: string;
  empId: string;
  empName: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  detail: string;
  impact?: number;
  timestamp: string;
  runLabel: string;
  group: string;
  owner: string;
  note: string;
}

const INITIAL_EXCEPTIONS: PayrollException[] = [
  {
    id: "EX-001",
    empId: "EMP-1003",
    empName: "Umar Farooq",
    type: "BANK",
    severity: "CRITICAL",
    detail: "Primary bank account (HBL) mapping missing for disbursement.",
    timestamp: "2h ago",
    runLabel: "Jan 2025 (v1.2)",
    group: "Islamabad Corporate",
    owner: "Payroll Officer",
    note: "Bank profile not mapped to preferred salary account.",
  },
  {
    id: "EX-002",
    empId: "EMP-1089",
    empName: "Hassan Raza",
    type: "NEGATIVE",
    severity: "CRITICAL",
    detail: "Net payout is PKR -5,400 due to excessive loan EMI & unpaid leaves.",
    impact: -5400,
    timestamp: "1h ago",
    runLabel: "Jan 2025 (v1.2)",
    group: "Karachi Operations",
    owner: "HR Manager",
    note: "Loan EMI needs manual override or hold for current cycle.",
  },
  {
    id: "EX-003",
    empId: "EMP-1256",
    empName: "Zohaib Ali",
    type: "STATUTORY",
    severity: "CRITICAL",
    detail: "Missing NTN number; required for FBR Annex-C filing.",
    timestamp: "3h ago",
    runLabel: "Jan 2025 (v1.2)",
    group: "Karachi Operations",
    owner: "Compliance Officer",
    note: "Missing statutory data blocks compliance file generation.",
  },
  {
    id: "EX-004",
    empId: "EMP-1005",
    empName: "Mustafa Kamal",
    type: "VARIANCE",
    severity: "WARNING",
    detail: "Payout variance > 25% vs Dec 2024. Triggered by bonus.",
    impact: 125000,
    timestamp: "30m ago",
    runLabel: "Jan 2025 (v1.2)",
    group: "Executive Management",
    owner: "Payroll Manager",
    note: "Variance expected due to bonus and manual one-time adjustment.",
  },
  {
    id: "EX-005",
    empId: "EMP-1102",
    empName: "Sara Khan",
    type: "BANK",
    severity: "CRITICAL",
    detail: "Invalid IBAN checksum detected. Bank rejection likely.",
    timestamp: "4h ago",
    runLabel: "Jan 2025 (v1.2)",
    group: "Islamabad Corporate",
    owner: "Payroll Officer",
    note: "Needs corrected IBAN before advice generation.",
  },
  {
    id: "EX-006",
    empId: "EMP-1044",
    empName: "Raza Jafri",
    type: "VARIANCE",
    severity: "WARNING",
    detail: "Unusual shift allowance spike (15% higher than average).",
    timestamp: "5h ago",
    runLabel: "Jan 2025 (v1.2)",
    group: "Karachi Operations",
    owner: "Department Head",
    note: "Cross-check with overtime and special shift roster.",
  },
];

function formatPKR(value?: number) {
  if (value === undefined) return "—";
  const abs = Math.abs(value);
  return `${value < 0 ? "-" : ""}PKR ${abs.toLocaleString()}`;
}

function getTypeConfig(type: ExceptionType) {
  switch (type) {
    case "BANK":
      return {
        icon: Landmark,
        label: "Bank Details",
        iconWrap: "bg-blue-50 text-blue-600",
        badge: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50",
      };
    case "NEGATIVE":
      return {
        icon: ShieldAlert,
        label: "Negative Net",
        iconWrap: "bg-red-50 text-red-600",
        badge: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
      };
    case "STATUTORY":
      return {
        icon: FileWarning,
        label: "Statutory ID",
        iconWrap: "bg-purple-50 text-purple-600",
        badge:
          "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50",
      };
    case "VARIANCE":
      return {
        icon: TrendingUp,
        label: "High Variance",
        iconWrap: "bg-orange-50 text-orange-600",
        badge:
          "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50",
      };
  }
}

function getSeverityBadgeClass(severity: ExceptionSeverity) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-700 hover:bg-red-50";
    case "WARNING":
      return "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50";
    case "RESOLVED":
      return "border-green-200 bg-green-50 text-green-700 hover:bg-green-50";
    default:
      return "border-gray-200 bg-white text-brand-800 hover:bg-white";
  }
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-brand-700">
      <span className="font-semibold text-brand-900">{value}</span>
      <span>{label}</span>
    </div>
  );
}

 const ExceptionCenter: React.FC = () => {
  const [exceptions, setExceptions] =
    useState<PayrollException[]>(INITIAL_EXCEPTIONS);
  const [activeTab, setActiveTab] = useState<SeverityTab>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | ExceptionType>("ALL");
  const [runFilter, setRunFilter] = useState("Jan 2025 (v1.2)");
  const [selectedId, setSelectedId] = useState<string | null>(
    INITIAL_EXCEPTIONS[0]?.id ?? null
  );

  const runOptions = useMemo(
    () => Array.from(new Set(exceptions.map((item) => item.runLabel))),
    [exceptions]
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 900);
  };

  const filteredExceptions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return exceptions.filter((ex) => {
      const matchTab =
        activeTab === "ALL" ? true : ex.severity === activeTab;

      const matchType = typeFilter === "ALL" ? true : ex.type === typeFilter;

      const matchRun = runFilter === "ALL" ? true : ex.runLabel === runFilter;

      const matchSearch =
        !q ||
        ex.empName.toLowerCase().includes(q) ||
        ex.empId.toLowerCase().includes(q) ||
        ex.detail.toLowerCase().includes(q) ||
        ex.group.toLowerCase().includes(q) ||
        ex.owner.toLowerCase().includes(q);

      return matchTab && matchType && matchRun && matchSearch;
    });
  }, [exceptions, activeTab, typeFilter, runFilter, search]);

  const stats = useMemo(() => {
    return {
      total: exceptions.length,
      critical: exceptions.filter((e) => e.severity === "CRITICAL").length,
      warnings: exceptions.filter((e) => e.severity === "WARNING").length,
      resolvedToday: exceptions.filter((e) => e.severity === "RESOLVED").length,
    };
  }, [exceptions]);

  const selectedException =
    filteredExceptions.find((item) => item.id === selectedId) ||
    exceptions.find((item) => item.id === selectedId) ||
    null;

  const resolveException = (id: string) => {
    setExceptions((prev) =>
      prev.map((ex) =>
        ex.id === id
          ? {
              ...ex,
              severity: "RESOLVED",
              timestamp: "Just now",
              note: `${ex.note} Marked resolved by current user.`,
            }
          : ex
      )
    );
  };

  const dismissWarning = (id: string) => {
    setExceptions((prev) =>
      prev.map((ex) =>
        ex.id === id
          ? {
              ...ex,
              severity: "RESOLVED",
              timestamp: "Just now",
              note: `${ex.note} Warning accepted and closed.`,
            }
          : ex
      )
    );
  };

  const autoResolveWarnings = () => {
    setExceptions((prev) =>
      prev.map((ex) =>
        ex.severity === "WARNING"
          ? {
              ...ex,
              severity: "RESOLVED",
              timestamp: "Just now",
              note: `${ex.note} Auto-resolved through bulk action.`,
            }
          : ex
      )
    );
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Resolve Center
                </CardTitle>
                <CardDescription className="mt-0.5 text-sm text-brand-700">
                  Monitor, review, and resolve payroll computation anomalies
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    Auto-Refresh
                  </span>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative h-5 w-10 rounded-full transition-all ${
                      autoRefresh ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                        autoRefresh ? "left-[22px]" : "left-[2px]"
                      }`}
                    />
                  </button>
                </div>

                <Select value={runFilter} onValueChange={setRunFilter}>
                  <SelectTrigger className="w-[210px] border-gray-200 text-brand-800">
                    <SelectValue placeholder="Run" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Runs</SelectItem>
                    {runOptions.map((run) => (
                      <SelectItem key={run} value={run}>
                        {run}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleRefresh}
                  className="bg-brand-800 text-white hover:bg-brand-900"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            {
              label: "Total Exceptions",
              val: stats.total,
              icon: AlertCircle,
              wrap: "bg-white",
              color: "text-brand-900",
              iconColor: "text-brand-400",
            },
            {
              label: "Critical Blocks",
              val: stats.critical,
              icon: ShieldAlert,
              wrap: "bg-red-50",
              color: "text-red-700",
              iconColor: "text-red-300",
            },
            {
              label: "Policy Warnings",
              val: stats.warnings,
              icon: AlertTriangle,
              wrap: "bg-orange-50",
              color: "text-orange-700",
              iconColor: "text-orange-300",
            },
            {
              label: "Resolved Today",
              val: stats.resolvedToday,
              icon: CheckCircle2,
              wrap: "bg-green-50",
              color: "text-green-700",
              iconColor: "text-green-300",
            },
          ].map((item) => (
            <Card key={item.label} className="border border-gray-200 shadow-sm">
              <CardContent
                className={`flex items-center justify-between rounded-lg p-5 ${item.wrap}`}
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    {item.label}
                  </p>
                  <h4 className={`mt-1 text-2xl font-bold ${item.color}`}>
                    {item.val}
                  </h4>
                </div>
                <item.icon className={`h-7 w-7 ${item.iconColor}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Workspace */}
          <div className="xl:col-span-8">
            <Card className="overflow-hidden border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
                    {(["ALL", "CRITICAL", "WARNING", "RESOLVED"] as SeverityTab[]).map(
                      (tab) => (
                        <Button
                          key={tab}
                          variant={activeTab === tab ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setActiveTab(tab)}
                          className={
                            activeTab === tab
                              ? "bg-brand-800 text-white hover:bg-brand-900"
                              : "text-brand-700 hover:bg-white"
                          }
                        >
                          {tab}
                        </Button>
                      )
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export All
                    </Button>
                    <Button
                      onClick={autoResolveWarnings}
                      className="bg-brand-800 text-white hover:bg-brand-900"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Auto-Resolve Warnings
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <Input
                      type="text"
                      placeholder="Search by employee name, ID, detail, group..."
                      className="border-gray-200 pl-10 text-brand-900"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={typeFilter}
                      onValueChange={(value) =>
                        setTypeFilter(value as "ALL" | ExceptionType)
                      }
                    >
                      <SelectTrigger className="w-[180px] border-gray-200 text-brand-800">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="BANK">Bank Details</SelectItem>
                        <SelectItem value="NEGATIVE">Negative Net</SelectItem>
                        <SelectItem value="STATUTORY">Statutory ID</SelectItem>
                        <SelectItem value="VARIANCE">High Variance</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Bulk Email HR
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredExceptions.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                        <CheckCircle2 className="h-6 w-6 text-brand-700" />
                      </div>
                      <p className="text-sm font-semibold text-brand-900">
                        No exceptions found
                      </p>
                      <p className="text-sm text-brand-700">
                        Everything looks clean for the current filters.
                      </p>
                    </div>
                  ) : (
                    filteredExceptions.map((ex) => {
                      const config = getTypeConfig(ex.type);
                      const TypeIcon = config.icon;

                      return (
                        <button
                          key={ex.id}
                          onClick={() => setSelectedId(ex.id)}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            selectedId === ex.id
                              ? "border-brand-800 bg-brand-100"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex min-w-0 flex-1 gap-4">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.iconWrap}`}
                              >
                                <TypeIcon className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-[11px] font-semibold ${getSeverityBadgeClass(
                                      ex.severity
                                    )}`}
                                  >
                                    {ex.severity}
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className={`text-[11px] font-semibold ${config.badge}`}
                                  >
                                    {config.label}
                                  </Badge>

                                  <span className="text-[11px] text-brand-700">
                                    {ex.timestamp}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-semibold text-brand-900">
                                    {ex.empName}
                                  </h4>
                                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                                    {ex.empId}
                                  </span>
                                </div>

                                <p className="text-sm leading-6 text-brand-700">
                                  {ex.detail}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-brand-700">
                                  <span>{ex.group}</span>
                                  <span>•</span>
                                  <span>{ex.owner}</span>
                                  <span>•</span>
                                  <span>{ex.runLabel}</span>
                                </div>

                                {ex.impact !== undefined ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                                      Est. Impact:
                                    </span>
                                    <span
                                      className={`text-xs font-semibold ${
                                        ex.impact < 0
                                          ? "text-red-600"
                                          : "text-brand-900"
                                      }`}
                                    >
                                      {formatPKR(ex.impact)}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div
                              className="flex flex-wrap items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ex.type === "BANK" && ex.severity !== "RESOLVED" && (
                                <Button
                                  onClick={() => resolveException(ex.id)}
                                  className="bg-brand-800 text-white hover:bg-brand-900"
                                >
                                  Fix Now
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              )}

                              {ex.type === "NEGATIVE" &&
                                ex.severity !== "RESOLVED" && (
                                  <Button
                                    variant="outline"
                                    onClick={() => resolveException(ex.id)}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    Adjust Deducts
                                  </Button>
                                )}

                              {ex.type === "STATUTORY" &&
                                ex.severity !== "RESOLVED" && (
                                  <Button
                                    className="bg-purple-600 text-white hover:bg-purple-700"
                                    onClick={() => resolveException(ex.id)}
                                  >
                                    Update Profile
                                  </Button>
                                )}

                              {ex.type === "VARIANCE" &&
                                ex.severity !== "RESOLVED" && (
                                  <>
                                    <Button
                                      className="bg-green-600 text-white hover:bg-green-700"
                                      onClick={() => dismissWarning(ex.id)}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="border-gray-200 text-brand-700 hover:bg-gray-50"
                                    >
                                      Flag
                                    </Button>
                                  </>
                                )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-brand-700 hover:bg-brand-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </CardContent>

              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-900">
                        {stats.critical} critical blocks remain
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                        Disbursement cannot proceed until resolved
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    <Clock3 className="h-4 w-4" />
                    Last recomputation: Today, 11:45 AM
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Detail panel */}
          <div className="space-y-4 xl:col-span-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-brand-900">
                  Exception Detail
                </CardTitle>
                <CardDescription className="text-sm text-brand-700">
                  Review full context and recommended action
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-4">
                {selectedException ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-brand-900">
                          {selectedException.empName}
                        </h4>
                        <p className="mt-1 text-sm text-brand-700">
                          {selectedException.detail}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-semibold ${getSeverityBadgeClass(
                          selectedException.severity
                        )}`}
                      >
                        {selectedException.severity}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Employee ID
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedException.empId}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Type
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {getTypeConfig(selectedException.type).label}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Payroll Group
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedException.group}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Owner
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedException.owner}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Run
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {selectedException.runLabel}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                          Est. Impact
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand-900">
                          {formatPKR(selectedException.impact)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                        <Bell className="h-4 w-4 text-brand-700" />
                        Resolution Note
                      </div>
                      <p className="mt-2 text-sm leading-6 text-brand-700">
                        {selectedException.note}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Notify Owner
                      </Button>
                    </div>

                    {selectedException.severity !== "RESOLVED" ? (
                      <Button
                        onClick={() => resolveException(selectedException.id)}
                        className="w-full bg-brand-800 text-white hover:bg-brand-900"
                      >
                        Mark as Resolved
                      </Button>
                    ) : (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
                        This exception has already been resolved.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-brand-700">
                    Select an exception from the list to view its details.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-brand-800 bg-brand-800 text-white shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Operational Snapshot</h3>
                    <p className="text-sm text-white/80">
                      Current exception posture for the selected run
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      Critical
                    </p>
                    <p className="mt-1 text-lg font-semibold">{stats.critical}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      Warnings
                    </p>
                    <p className="mt-1 text-lg font-semibold">{stats.warnings}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      Resolved
                    </p>
                    <p className="mt-1 text-lg font-semibold">{stats.resolvedToday}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                      Auto Refresh
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {autoRefresh ? "On" : "Off"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};


export default ExceptionCenter;