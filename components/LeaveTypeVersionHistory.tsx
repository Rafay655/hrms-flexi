"use client";

import React, { useMemo, useState } from "react";
import {
  X,
  History,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  GitCompare,
} from "lucide-react";

interface LeaveTypeVersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  typeName: string;
}

interface VersionItem {
  id: string;
  version: string;
  changedAt: string;
  changedBy: string;
  status: "Published" | "Draft" | "Archived";
  summary: string;
  changes: string[];
}

const MOCK_HISTORY: VersionItem[] = [
  {
    id: "VH-001",
    version: "v3.2",
    changedAt: "2026-04-05T10:30:00Z",
    changedBy: "HR Admin",
    status: "Published",
    summary: "Updated quota text and eligibility mapping.",
    changes: [
      "Quota updated from 12 days/year to 14 days/year",
      "Eligibility increased from 420 to 450 employees",
      "Description refined for policy clarity",
    ],
  },
  {
    id: "VH-002",
    version: "v3.1",
    changedAt: "2026-03-21T16:15:00Z",
    changedBy: "System Admin",
    status: "Published",
    summary: "Accrual policy adjusted for monthly processing.",
    changes: [
      "Accrual changed from Annual to Monthly",
      "Version published after payroll synchronization review",
    ],
  },
  {
    id: "VH-003",
    version: "v3.0",
    changedAt: "2026-03-10T09:00:00Z",
    changedBy: "HR Operations",
    status: "Archived",
    summary: "Major policy revision before current live version.",
    changes: [
      "Legacy leave type description archived",
      "Old carry-forward assumptions removed",
    ],
  },
  {
    id: "VH-004",
    version: "v2.9",
    changedAt: "2026-02-27T14:45:00Z",
    changedBy: "HR Admin",
    status: "Draft",
    summary: "Draft proposal for future policy update.",
    changes: [
      "Prepared draft for half-day handling change",
      "Pending approval from compliance team",
    ],
  },
];

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusStyle(status: VersionItem["status"]) {
  switch (status) {
    case "Published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Draft":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Archived":
      return "bg-gray-50 text-gray-700 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export function LeaveTypeVersionHistory({
  isOpen,
  onClose,
  typeName,
}: LeaveTypeVersionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(MOCK_HISTORY[0]?.id ?? null);

  const stats = useMemo(() => {
    return {
      total: MOCK_HISTORY.length,
      published: MOCK_HISTORY.filter((item) => item.status === "Published").length,
      drafts: MOCK_HISTORY.filter((item) => item.status === "Draft").length,
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-800 text-white">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-900">
                  Version History
                </h3>
                <p className="mt-1 text-sm text-brand-700">
                  Track policy changes and published revisions for{" "}
                  <span className="font-semibold">{typeName}</span>.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 p-2 text-brand-700 transition hover:bg-brand-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-r border-gray-200 p-6">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Total Versions
                </p>
                <p className="mt-2 text-2xl font-bold text-brand-900">{stats.total}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Published
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.published}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Drafts
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-700">{stats.drafts}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="flex items-start gap-3">
                <GitCompare className="mt-0.5 h-5 w-5 text-brand-800" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Policy Insight
                  </p>
                  <p className="mt-2 text-sm leading-6 text-brand-700">
                    Version history helps HR teams track entitlement changes, compliance
                    edits, and eligibility revisions over time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto p-6">
            <div className="space-y-4">
              {MOCK_HISTORY.map((item) => {
                const expanded = expandedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((prev) => (prev === item.id ? null : item.id))
                      }
                      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-brand-100"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-brand-900">{item.version}</p>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-brand-700">{item.summary}</p>

                        <div className="mt-2 inline-flex items-center gap-2 text-[11px] text-brand-600">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTime(item.changedAt)} • {item.changedBy}
                        </div>
                      </div>

                      <div className="pt-1 text-brand-700">
                        {expanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {expanded ? (
                      <div className="border-t border-gray-200 px-5 py-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Change Log
                        </h4>

                        <div className="mt-4 space-y-3">
                          {item.changes.map((change, idx) => (
                            <div
                              key={`${item.id}-${idx}`}
                              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="mt-0.5 text-brand-800">
                                {item.status === "Published" ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <AlertCircle className="h-4 w-4" />
                                )}
                              </div>
                              <p className="text-sm text-brand-700">{change}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}