"use client";

import React, { useMemo, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Fingerprint,
  Search,
  Eye,
  CheckCircle2,
  Activity,
  Zap,
  ShieldCheck,
  X,
  Terminal,
  Info,
} from "lucide-react";

interface Anomaly {
  id: string;
  date: string;
  employee: string;
  avatar: string;
  dept: string;
  type: "Conflict" | "Pattern" | "Policy" | "Duplicate" | "Sandwich";
  severity: "High" | "Medium" | "Low";
  evidence: string;
  status: "New" | "Investigating" | "Confirmed" | "False Positive";
}

const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: "AN-901",
    date: "Feb 12, 2025",
    employee: "Usman Ali",
    avatar: "UA",
    dept: "Sales",
    type: "Conflict",
    severity: "High",
    evidence: "Punched in while on Annual Leave",
    status: "New",
  },
  {
    id: "AN-902",
    date: "Feb 11, 2025",
    employee: "Sara Miller",
    avatar: "SM",
    dept: "Product",
    type: "Pattern",
    severity: "Medium",
    evidence: "4th consecutive Friday absence",
    status: "New",
  },
  {
    id: "AN-903",
    date: "Feb 10, 2025",
    employee: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    type: "Policy",
    severity: "High",
    evidence: "Balance: 2d, Approved: 5d",
    status: "Confirmed",
  },
  {
    id: "AN-904",
    date: "Feb 09, 2025",
    employee: "Zoya Malik",
    avatar: "ZM",
    dept: "Design",
    type: "Duplicate",
    severity: "Low",
    evidence: "Double entry for Jan 24 (LV-88 & LV-91)",
    status: "False Positive",
  },
  {
    id: "AN-905",
    date: "Feb 08, 2025",
    employee: "Tom Chen",
    avatar: "TC",
    dept: "Engineering",
    type: "Sandwich",
    severity: "Medium",
    evidence: "Friday/Monday off, weekend not counted",
    status: "Investigating",
  },
  {
    id: "AN-906",
    date: "Feb 07, 2025",
    employee: "Ali Raza",
    avatar: "AR",
    dept: "Engineering",
    type: "Conflict",
    severity: "High",
    evidence: "Remote punch from overseas IP during sick leave",
    status: "New",
  },
  {
    id: "AN-907",
    date: "Feb 06, 2025",
    employee: "Mona Shah",
    avatar: "MS",
    dept: "Engineering",
    type: "Pattern",
    severity: "Low",
    evidence: "Always sick after project milestones",
    status: "New",
  },
  {
    id: "AN-908",
    date: "Feb 05, 2025",
    employee: "Hamza Aziz",
    avatar: "HA",
    dept: "Design",
    type: "Policy",
    severity: "Medium",
    evidence: "Medical leave without attachment",
    status: "New",
  },
  {
    id: "AN-909",
    date: "Feb 04, 2025",
    employee: "Bina Iftikhar",
    avatar: "BI",
    dept: "Product",
    type: "Sandwich",
    severity: "Low",
    evidence: "Holiday bypass attempt detected",
    status: "New",
  },
  {
    id: "AN-910",
    date: "Feb 03, 2025",
    employee: "Fatima Noor",
    avatar: "FN",
    dept: "HR",
    type: "Conflict",
    severity: "High",
    evidence: "Active system session during bereavement",
    status: "New",
  },
  {
    id: "AN-911",
    date: "Feb 02, 2025",
    employee: "Raza Javeed",
    avatar: "RJ",
    dept: "Marketing",
    type: "Pattern",
    severity: "Medium",
    evidence: "High Casual Leave utilization (>80% YTD)",
    status: "Confirmed",
  },
  {
    id: "AN-912",
    date: "Feb 01, 2025",
    employee: "Sana Khan",
    avatar: "SK",
    dept: "Engineering",
    type: "Duplicate",
    severity: "Low",
    evidence: "Same dates as Travel Request ODT-442",
    status: "Confirmed",
  },
  {
    id: "AN-913",
    date: "Jan 31, 2025",
    employee: "Kamran Akmal",
    avatar: "KA",
    dept: "Sales",
    type: "Policy",
    severity: "High",
    evidence: "Lapse override applied by unauthorized user",
    status: "Investigating",
  },
  {
    id: "AN-914",
    date: "Jan 30, 2025",
    employee: "Usman Ali",
    avatar: "UA",
    dept: "Sales",
    type: "Conflict",
    severity: "Medium",
    evidence: "VPN activity during medical leave",
    status: "False Positive",
  },
  {
    id: "AN-915",
    date: "Jan 29, 2025",
    employee: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    type: "Pattern",
    severity: "Low",
    evidence: "Frequent Monday morning sick leaves",
    status: "False Positive",
  },
];

type ActiveTab = "All" | "Conflict" | "Pattern" | "Policy" | "Duplicate" | "Sandwich";

function getSeverityStyle(severity: Anomaly["severity"]) {
  switch (severity) {
    case "High":
      return "bg-red-50 text-red-700 border-red-100";
    case "Medium":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Low":
      return "bg-blue-50 text-blue-700 border-blue-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function getStatusStyle(status: Anomaly["status"]) {
  switch (status) {
    case "New":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "Confirmed":
      return "bg-red-50 text-red-700 border-red-100";
    case "False Positive":
      return "bg-gray-100 text-gray-500 border-gray-200";
    case "Investigating":
      return "bg-amber-50 text-amber-700 border-amber-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

export default function LeaveAnomalyDetection() {
  const [search, setSearch] = useState("");
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("All");

  const stats = useMemo(
    () => ({
      total: MOCK_ANOMALIES.length,
      new: MOCK_ANOMALIES.filter((a) => a.status === "New").length,
      confirmed: MOCK_ANOMALIES.filter((a) => a.status === "Confirmed").length,
      falsePos: MOCK_ANOMALIES.filter((a) => a.status === "False Positive").length,
    }),
    []
  );

  const filteredAnomalies = useMemo(() => {
    const q = search.trim().toLowerCase();

    return MOCK_ANOMALIES.filter((a) => {
      const matchesTab = activeTab === "All" || a.type === activeTab;
      const matchesSearch =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.employee.toLowerCase().includes(q) ||
        a.dept.toLowerCase().includes(q) ||
        a.evidence.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  Anomaly Detection
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  AI Integrity Engine monitoring leave compliance and suspicious patterns.
                </p>
              </div>
            </div>

           
          </div>

          {/* Stats */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Total Anomalies
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {stats.total}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    New (Unreviewed)
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {stats.new}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2 text-red-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Confirmed Issues
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {stats.confirmed}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    False Positives
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {stats.falsePos}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table container */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(["All", "Conflict", "Pattern", "Policy", "Duplicate", "Sandwich"] as ActiveTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                        activeTab === tab
                          ? "bg-brand-800 text-white"
                          : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <input
                  type="text"
                  placeholder="Search anomalies..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Date / ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Type
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Severity
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Evidence Summary
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-300/40 bg-white">
                {filteredAnomalies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-300">
                        <ShieldAlert className="h-8 w-8" />
                      </div>
                      <div className="mt-4 text-sm font-semibold text-brand-900">
                        No anomalies found
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        Try changing your filters or search query.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAnomalies.map((a) => (
                    <tr
                      key={a.id}
                      className="cursor-pointer transition-colors hover:bg-brand-100"
                      onClick={() => setSelectedAnomaly(a)}
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-brand-900">{a.id}</div>
                        <div className="mt-1 text-[11px] text-brand-700">{a.date}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-[10px] font-semibold text-brand-900">
                            {a.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-brand-900">
                              {a.employee}
                            </div>
                            <div className="text-[11px] text-brand-700">{a.dept}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-brand-900">
                          <Fingerprint className="h-4 w-4 text-indigo-500" />
                          <span className="font-semibold">{a.type}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverityStyle(a.severity)}`}>
                          {a.severity}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[240px] truncate text-sm italic text-brand-700" title={a.evidence}>
                          "{a.evidence}"
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(a.status)}`}>
                          {a.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg border border-gray-200 bg-white p-2 text-emerald-600 transition hover:bg-emerald-50">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Investigation drawer */}
        {selectedAnomaly && (
          <div className="fixed inset-0 z-[200] overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedAnomaly(null)}
            />
            <div className="absolute right-0 top-0 flex h-full w-[560px] flex-col bg-gray-50 shadow-2xl">
              {/* Header */}
              <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getSeverityStyle(selectedAnomaly.severity)}`}>
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-brand-900">
                        Integrity Audit: {selectedAnomaly.id}
                      </h3>
                      <p className="text-sm text-brand-700">
                        {selectedAnomaly.type} Detection • {selectedAnomaly.date}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAnomaly(null)}
                    className="rounded-lg p-2 text-brand-700 transition hover:bg-brand-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Employee context */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-lg font-semibold text-brand-900">
                      {selectedAnomaly.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-brand-900">
                        {selectedAnomaly.employee}
                      </div>
                      <div className="text-sm text-brand-700">
                        {selectedAnomaly.dept} • Full-time Staff
                      </div>

                      <div className="mt-3 flex gap-5 border-t border-gray-100 pt-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                            YTD Utilization
                          </div>
                          <div className="mt-1 text-sm font-semibold text-brand-900">
                            72%
                          </div>
                        </div>

                        <div className="border-l border-gray-200 pl-5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                            Trust Score
                          </div>
                          <div className="mt-1 text-sm font-semibold text-red-600">
                            Low (4.2/10)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence */}
                <section className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
                    <Terminal className="h-4 w-4 text-brand-800" />
                    Forensic Evidence
                  </h4>

                  <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-brand-900 p-5 text-white shadow-sm">
                    <p className="text-sm italic text-brand-100">
                      "{selectedAnomaly.evidence}"
                    </p>

                    <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-white/60">
                        <span>System Logs</span>
                        <span>Time: 09:42:01 AM</span>
                      </div>
                      <code className="block text-[11px] leading-6 text-[#E8D5A3]">
                        [PUNCH_EVENT] UID: 4421 AUTH: SUCCESS IP: 202.163.x.x
                        <br />
                        [POLICY_CHECK] LEAVE_STATUS: ACTIVE
                        <br />
                        [ALERT] CONFLICT_DETECTED: LEAVE_VS_ATTENDANCE
                      </code>
                    </div>

                    <AlertTriangle className="absolute -bottom-5 -right-5 h-24 w-24 text-white/5" />
                  </div>
                </section>

                {/* Timeline */}
                <section className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Integrity Timeline
                  </h4>

                  <div className="relative space-y-5 pl-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 before:content-['']">
                    <div className="relative">
                      <div className="absolute left-[-25px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      <div className="text-sm font-semibold text-brand-900">Leave Applied (LV-992)</div>
                      <div className="text-[11px] text-brand-700">Jan 10, 2025</div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-[-25px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      <div className="text-sm font-semibold text-brand-900">Request Approved</div>
                      <div className="text-[11px] text-brand-700">By Sarah Admin • Jan 12</div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-[-25px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                      <div className="text-sm font-semibold uppercase text-red-600">Anomaly Triggered</div>
                      <div className="text-[11px] text-brand-700">Punch-in detected during break</div>
                    </div>
                  </div>
                </section>

                {/* Resolution */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h4 className="border-b border-gray-100 pb-4 text-sm font-semibold uppercase tracking-wider text-brand-800">
                    Decision Hub
                  </h4>

                  <div className="mt-5 space-y-4">
                    <label className="block space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Action Category
                      </span>
                      <select className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-900 outline-none transition focus:border-brand-800">
                        <option>Revert Leave Entry</option>
                        <option>Mark as Correction Work</option>
                        <option>Official Integrity Issue</option>
                        <option>Manager Oversight</option>
                      </select>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                        Investigator Notes
                      </span>
                      <textarea
                        className="h-28 w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm text-brand-900 outline-none transition focus:border-brand-800"
                        placeholder="Provide detailed audit findings..."
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-gray-200 bg-white px-6 py-5">
                <button className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-brand-800 transition hover:bg-gray-100">
                  Mark False Positive
                </button>
                <button className="rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700">
                  Confirm Integrity Issue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}