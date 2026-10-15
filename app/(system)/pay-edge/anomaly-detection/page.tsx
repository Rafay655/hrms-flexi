"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  Eye,
  Filter,
  Info,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Target,
  Trash2,
  Zap,
} from "lucide-react";

type Severity = "HIGH" | "MEDIUM" | "LOW";
type ReviewStatus =
  | "Open"
  | "Investigating"
  | "Dismissed"
  | "Valid"
  | "Resolved";

interface Anomaly {
  id: string;
  title: string;
  employee: string;
  empId: string;
  description: string;
  severity: Severity;
  confidence: number;
  category: string;
  reviewStatus: ReviewStatus;
}

interface Rule {
  id: number;
  rule: string;
  threshold: string;
  status: "Active" | "Paused";
}

const INITIAL_ANOMALIES: Anomaly[] = [
  {
    id: "AN-001",
    title: "Suspicious OT Spike",
    employee: "Kamran Shah",
    empId: "EMP-1022",
    description:
      "Overtime exceeds 80 hours in a single month. 250% higher than trailing 3-month average.",
    severity: "HIGH",
    confidence: 98,
    category: "Attendance",
    reviewStatus: "Open",
  },
  {
    id: "AN-002",
    title: "IBAN Country Mismatch",
    employee: "Sara Khan",
    empId: "EMP-1102",
    description:
      "Bank account country code (AE) does not match local payroll jurisdiction (PK).",
    severity: "HIGH",
    confidence: 100,
    category: "Bank",
    reviewStatus: "Open",
  },
  {
    id: "AN-003",
    title: "Negative Net Payout",
    employee: "Hassan Raza",
    empId: "EMP-1089",
    description:
      "Multiple ad-hoc deductions resulting in negative net salary of PKR 5,400.",
    severity: "HIGH",
    confidence: 100,
    category: "Financial",
    reviewStatus: "Open",
  },
  {
    id: "AN-004",
    title: "Ghost Employee Flag",
    employee: "Unknown Record",
    empId: "EMP-9999",
    description:
      "Payment record found without corresponding entry in active HR master data.",
    severity: "HIGH",
    confidence: 92,
    category: "Security",
    reviewStatus: "Open",
  },
  {
    id: "AN-005",
    title: "Salary Double-Dip",
    employee: "Mustafa Kamal",
    empId: "EMP-1005",
    description:
      "Two identical base salary components detected in a single run.",
    severity: "MEDIUM",
    confidence: 85,
    category: "Duplicate",
    reviewStatus: "Open",
  },
  {
    id: "AN-006",
    title: "Tax Slab Jump",
    employee: "Arsalan Khan",
    empId: "EMP-1001",
    description:
      "Recent increment pushed employee into 35% slab. Net take-home increased by only 2%.",
    severity: "MEDIUM",
    confidence: 88,
    category: "Tax",
    reviewStatus: "Open",
  },
  {
    id: "AN-007",
    title: "Manual Override Bias",
    employee: "System-wide",
    empId: "DEPT-ENG",
    description:
      "Higher than usual manual overrides (15 cases) in Engineering department compared to org average.",
    severity: "MEDIUM",
    confidence: 75,
    category: "Audit",
    reviewStatus: "Open",
  },
  {
    id: "AN-008",
    title: "CNIC Expiry Alert",
    employee: "Zainab Bibi",
    empId: "EMP-1004",
    description:
      "Statutory ID on file is expired. May affect future tax filing.",
    severity: "LOW",
    confidence: 100,
    category: "Compliance",
    reviewStatus: "Open",
  },
  {
    id: "AN-009",
    title: "Rounding Discrepancy",
    employee: "Umar Farooq",
    empId: "EMP-1003",
    description:
      "Total gross sum differs by PKR 0.45 from component aggregate.",
    severity: "LOW",
    confidence: 60,
    category: "System",
    reviewStatus: "Open",
  },
  {
    id: "AN-010",
    title: "Unusual Dept Swap",
    employee: "Ahmed Raza",
    empId: "EMP-1104",
    description:
      "Employee cost center changed twice within the same cycle.",
    severity: "LOW",
    confidence: 70,
    category: "Structure",
    reviewStatus: "Open",
  },
];

const INITIAL_RULES: Rule[] = [
  { id: 1, rule: "Trailing OT Variance", threshold: "> 50% Avg", status: "Active" },
  { id: 2, rule: "Net Pay Floor", threshold: "< PKR 0", status: "Active" },
  { id: 3, rule: "Cross-Bank Country Check", threshold: "Mismatch", status: "Active" },
  { id: 4, rule: "High Value Bonus", threshold: "> 200% Basic", status: "Paused" },
  { id: 5, rule: "Duplicate Bank Acc", threshold: "Exact Match", status: "Active" },
];

function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
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

export default function PayrollAnomalyDetection() {
  const [selectedRun, setSelectedRun] = useState("Jan 2025 (v1.2)");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"All" | Severity>("All");
  const [statusFilter, setStatusFilter] = useState<
    "All" | ReviewStatus
  >("All");
  const [anomalies, setAnomalies] = useState<Anomaly[]>(INITIAL_ANOMALIES);
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(anomalies.map((a) => a.category)))];
  }, [anomalies]);

  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const filteredAnomalies = useMemo(() => {
    const q = search.trim().toLowerCase();

    return anomalies.filter((anomaly) => {
      const matchesSearch =
        !q ||
        [
          anomaly.id,
          anomaly.title,
          anomaly.employee,
          anomaly.empId,
          anomaly.description,
          anomaly.category,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesSeverity =
        severityFilter === "All" || anomaly.severity === severityFilter;

      const matchesCategory =
        categoryFilter === "All" || anomaly.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || anomaly.reviewStatus === statusFilter;

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [anomalies, search, severityFilter, categoryFilter, statusFilter]);

  const highSeverity = filteredAnomalies.filter((a) => a.severity === "HIGH");
  const medSeverity = filteredAnomalies.filter((a) => a.severity === "MEDIUM");
  const lowSeverity = filteredAnomalies.filter((a) => a.severity === "LOW");

  const totalOpen = anomalies.filter((a) => a.reviewStatus === "Open").length;
  const totalInvestigating = anomalies.filter(
    (a) => a.reviewStatus === "Investigating"
  ).length;
  const totalResolved = anomalies.filter((a) =>
    ["Valid", "Resolved", "Dismissed"].includes(a.reviewStatus)
  ).length;

  const handleRefresh = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    setIsRefreshing(true);
    refreshTimerRef.current = setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const updateAnomalyStatus = (id: string, reviewStatus: ReviewStatus) => {
    setAnomalies((prev) =>
      prev.map((anomaly) =>
        anomaly.id === id ? { ...anomaly, reviewStatus } : anomaly
      )
    );
  };

  const batchInvestigateMedium = () => {
    setAnomalies((prev) =>
      prev.map((anomaly) =>
        anomaly.severity === "MEDIUM" && anomaly.reviewStatus === "Open"
          ? { ...anomaly, reviewStatus: "Investigating" }
          : anomaly
      )
    );
  };

  const quickResolveLow = () => {
    setAnomalies((prev) =>
      prev.map((anomaly) =>
        anomaly.severity === "LOW" && anomaly.reviewStatus === "Open"
          ? { ...anomaly, reviewStatus: "Resolved" }
          : anomaly
      )
    );
  };

  const toggleRuleStatus = (id: number) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              status: rule.status === "Active" ? "Paused" : "Active",
            }
          : rule
      )
    );
  };

  const exportAnomalies = () => {
    downloadCsv(
      "payroll-anomalies.csv",
      [
        "ID",
        "Title",
        "Employee",
        "Employee ID",
        "Severity",
        "Category",
        "Confidence",
        "Review Status",
        "Description",
      ],
      filteredAnomalies.map((a) => [
        a.id,
        a.title,
        a.employee,
        a.empId,
        a.severity,
        a.category,
        a.confidence,
        a.reviewStatus,
        a.description,
      ])
    );
  };

  const exportAuditMemo = () => {
    downloadCsv(
      "anomaly-audit-memo.csv",
      ["Metric", "Value"],
      [
        ["Payroll Run", selectedRun],
        ["Total Filtered Anomalies", filteredAnomalies.length],
        ["High Severity", highSeverity.length],
        ["Medium Severity", medSeverity.length],
        ["Low Severity", lowSeverity.length],
        ["Open", totalOpen],
        ["Investigating", totalInvestigating],
        ["Resolved", totalResolved],
      ]
    );
  };

  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <ShieldAlert className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    Anomaly Detection
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-700">
                    Scan payroll batches for irregularities, fraud indicators,
                    and payroll risk
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Database className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <select
                    value={selectedRun}
                    onChange={(e) => setSelectedRun(e.target.value)}
                    className="h-10 min-w-[200px] rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    <option>Jan 2025 (v1.2)</option>
                    <option>Jan 2025 (v1.1)</option>
                    <option>Dec 2024 Final</option>
                  </select>
                </div>

                <button
                  onClick={handleRefresh}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100"
                  title="Refresh scan"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  onClick={exportAnomalies}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Open Anomalies"
              value={String(totalOpen)}
              helper="Need review or action"
              icon={<AlertCircle className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Investigating"
              value={String(totalInvestigating)}
              helper="Under active review"
              icon={<Eye className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Resolved"
              value={String(totalResolved)}
              helper="Valid, dismissed, or resolved"
              icon={<CheckCircle2 className="h-4 w-4 text-brand-700" />}
            />
            <SummaryCard
              label="Rules Active"
              value={String(rules.filter((r) => r.status === "Active").length)}
              helper={`${rules.length} total detection rules`}
              icon={<Zap className="h-4 w-4 text-brand-700" />}
            />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm">
                <span className="text-brand-700">Showing </span>
                <span className="font-semibold text-brand-900">
                  {filteredAnomalies.length}
                </span>
                <span className="text-brand-700"> anomalies from </span>
                <span className="font-semibold text-brand-900">
                  {selectedRun}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700">
                <span>
                  <span className="font-semibold text-brand-900">
                    {highSeverity.length}
                  </span>{" "}
                  high
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">
                    {medSeverity.length}
                  </span>{" "}
                  medium
                </span>
                <span className="h-3 w-px bg-brand-300" />
                <span>
                  <span className="font-semibold text-brand-900">
                    {lowSeverity.length}
                  </span>{" "}
                  low
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brand-900">
                  Anomaly Review Queue
                </h3>
                <p className="mt-0.5 text-sm text-brand-700">
                  Search and filter anomalies across the selected payroll run
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <input
                    type="text"
                    placeholder="Search anomaly..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800 sm:w-60"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                  <select
                    value={severityFilter}
                    onChange={(e) =>
                      setSeverityFilter(e.target.value as "All" | Severity)
                    }
                    className="h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  >
                    <option value="All">All Severities</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "All" ? "All Categories" : category}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "All" | ReviewStatus)
                  }
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Dismissed">Dismissed</option>
                  <option value="Valid">Valid</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-red-500" />
                  <h3 className="text-sm font-semibold text-brand-900">
                    Critical Anomalies ({highSeverity.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {highSeverity.length === 0 ? (
                    <EmptyState
                      title="No critical anomalies"
                      subtitle="No high-severity records match the current filters."
                      icon={<ShieldCheck className="h-8 w-8 text-brand-300" />}
                    />
                  ) : (
                    highSeverity.map((anomaly) => (
                      <div
                        key={anomaly.id}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  {anomaly.category}
                                </span>
                                <ReviewBadge status={anomaly.reviewStatus} />
                              </div>

                              <h4 className="text-base font-semibold text-brand-900">
                                {anomaly.title}
                              </h4>
                              <p className="mt-1 text-[11px] text-brand-700">
                                {anomaly.empId} · {anomaly.employee}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="text-[11px] text-brand-700">
                                AI Confidence
                              </p>
                              <p className="text-sm font-semibold text-brand-900">
                                {anomaly.confidence}%
                              </p>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-sm leading-6 text-brand-700">
                              {anomaly.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() =>
                                updateAnomalyStatus(
                                  anomaly.id,
                                  "Investigating"
                                )
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                            >
                              <Target className="h-4 w-4" />
                              Investigate
                            </button>

                            <button
                              onClick={() =>
                                updateAnomalyStatus(anomaly.id, "Dismissed")
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              Dismiss
                            </button>

                            <button
                              onClick={() =>
                                updateAnomalyStatus(anomaly.id, "Valid")
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Mark Valid
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-900">
                      Medium Severity ({medSeverity.length})
                    </h3>
                    <p className="mt-0.5 text-sm text-brand-700">
                      Review recommended before payroll approval
                    </p>
                  </div>

                  <button
                    onClick={batchInvestigateMedium}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    <Eye className="h-4 w-4" />
                    Batch Investigate
                  </button>
                </div>

                <div className="divide-y divide-brand-300/50">
                  {medSeverity.length === 0 ? (
                    <div className="p-5">
                      <EmptyState
                        title="No medium anomalies"
                        subtitle="No medium-severity records match the current filters."
                        icon={<AlertTriangle className="h-8 w-8 text-brand-300" />}
                      />
                    </div>
                  ) : (
                    medSeverity.map((anomaly) => (
                      <div
                        key={anomaly.id}
                        className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-brand-100 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-900">
                              {anomaly.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-brand-700">
                              {anomaly.employee} · {anomaly.category} ·{" "}
                              {anomaly.confidence}% confidence
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ReviewBadge status={anomaly.reviewStatus} />
                          <button
                            onClick={() =>
                              updateAnomalyStatus(anomaly.id, "Investigating")
                            }
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-900">
                      Low Severity ({lowSeverity.length})
                    </h3>
                    <p className="mt-0.5 text-sm text-brand-700">
                      Minor issues and informational flags
                    </p>
                  </div>

                  <button
                    onClick={quickResolveLow}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    <Zap className="h-4 w-4" />
                    Quick Resolve All
                  </button>
                </div>

                <div className="divide-y divide-brand-300/50">
                  {lowSeverity.length === 0 ? (
                    <div className="p-5">
                      <EmptyState
                        title="No low-severity items"
                        subtitle="No low-severity records match the current filters."
                        icon={<Info className="h-8 w-8 text-brand-300" />}
                      />
                    </div>
                  ) : (
                    lowSeverity.map((anomaly) => (
                      <div
                        key={anomaly.id}
                        className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-brand-100 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                            <Info className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-900">
                              {anomaly.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-brand-700">
                              {anomaly.employee} · {anomaly.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ReviewBadge status={anomaly.reviewStatus} />
                          <button
                            onClick={() =>
                              updateAnomalyStatus(anomaly.id, "Resolved")
                            }
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-5">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-900">
                      Dynamic Scanning Rules
                    </h3>
                    <p className="mt-0.5 text-sm text-brand-700">
                      Active payroll rules behind anomaly detection
                    </p>
                  </div>

                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-brand-800 transition hover:bg-brand-100">
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Audit Rule
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Threshold
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-brand-300/50 bg-white">
                      {rules.map((rule) => (
                        <tr
                          key={rule.id}
                          className="transition-colors hover:bg-brand-100"
                        >
                          <td className="px-5 py-3.5 text-sm font-semibold text-brand-900">
                            {rule.rule}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-brand-700">
                            {rule.threshold}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => toggleRuleStatus(rule.id)}
                              className={
                                rule.status === "Active"
                                  ? "inline-flex items-center rounded-full border border-gray-200 bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800"
                                  : "inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
                              }
                            >
                              {rule.status}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-gray-200 px-5 py-4">
                  <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-100">
                    <Settings2 className="h-4 w-4" />
                    Configure Rule Matrix
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-brand-900 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Recurrent Patterns
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-white">
                      Repeat signals detected
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-white/80">
                      The system identified recurring anomalies tied to manual
                      bonus entries in the Sales department and flagged the
                      pattern for audit review.
                    </p>

                    <button
                      onClick={exportAuditMemo}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      Generate Audit Memo
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
              <ShieldCheck className="h-4 w-4 text-brand-800" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-brand-900">
                Scoping Integrity Protocol
              </h4>
              <p className="text-sm leading-6 text-brand-700">
                The anomaly engine scans payroll runs for fraud markers,
                unusual financial patterns, and master-data mismatches. All
                exceptions should be reviewed, marked valid, dismissed, or
                resolved through controlled actions.
              </p>
            </div>
          </div>
        </div>
      </div>
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
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
          {icon}
        </div>
      </div>

      <div className="text-2xl font-bold text-brand-900">{value}</div>
      <p className="mt-2 text-[11px] text-brand-700">{helper}</p>
    </div>
  );
}

function ReviewBadge({ status }: { status: ReviewStatus }) {
  const styles =
    status === "Open"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : status === "Investigating"
      ? "bg-brand-100 text-brand-800 border-gray-200"
      : status === "Dismissed"
      ? "bg-gray-100 text-gray-600 border-gray-200"
      : status === "Valid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
      {icon}
      <p className="text-sm font-semibold text-brand-900">{title}</p>
      <p className="text-sm text-brand-700">{subtitle}</p>
    </div>
  );
}