"use client";

import React, { useMemo, useState } from "react";
import {
  Zap,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  History,
  ExternalLink,
  Search,
  MoreHorizontal,
  ChevronRight,
  XCircle,
  Info,
} from "lucide-react";
import { CompOffCreditRequestForm } from "@/components/leaveease/CompOffCreditRequestForm";

interface CompOffCredit {
  id: string;
  earnedDate: string;
  source: string;
  amount: string;
  expiryDate: string;
  status: "Available" | "Pending" | "Used" | "Expired";
  usedInRequest?: string;
  daysToExpiry?: number;
}

const MOCK_CREDITS: CompOffCredit[] = [
  {
    id: "CO-101",
    earnedDate: "Dec 25, 2024",
    source: "Worked Holiday - Quaid-e-Azam Day",
    amount: "1.0 day",
    expiryDate: "Mar 31, 2025",
    status: "Available",
    daysToExpiry: 65,
  },
  {
    id: "CO-102",
    earnedDate: "Jan 05, 2025",
    source: "Extra Shift - Weekend Deployment",
    amount: "1.0 day",
    expiryDate: "Apr 05, 2025",
    status: "Available",
    daysToExpiry: 70,
  },
  {
    id: "CO-103",
    earnedDate: "Jan 10, 2025",
    source: "Approved OT - 4h System Migration",
    amount: "0.5 day",
    expiryDate: "Apr 10, 2025",
    status: "Pending",
  },
  {
    id: "CO-104",
    earnedDate: "Nov 12, 2024",
    source: "Worked Holiday - Diwali",
    amount: "1.0 day",
    expiryDate: "Feb 12, 2025",
    status: "Available",
    daysToExpiry: 18,
  },
  {
    id: "CO-105",
    earnedDate: "Oct 01, 2024",
    source: "Extra Shift - Project Alpha Go-live",
    amount: "1.0 day",
    expiryDate: "Jan 01, 2025",
    status: "Used",
    usedInRequest: "LV-2024-882",
  },
  {
    id: "CO-106",
    earnedDate: "Sep 15, 2024",
    source: "Approved OT - Client Support",
    amount: "1.0 day",
    expiryDate: "Dec 15, 2024",
    status: "Expired",
  },
  {
    id: "CO-107",
    earnedDate: "Aug 14, 2024",
    source: "Worked Holiday - Independence Day",
    amount: "1.0 day",
    expiryDate: "Nov 14, 2024",
    status: "Used",
    usedInRequest: "LV-2024-551",
  },
  {
    id: "CO-108",
    earnedDate: "Dec 10, 2024",
    source: "Extra Shift - Audit Prep",
    amount: "1.0 day",
    expiryDate: "Mar 10, 2025",
    status: "Used",
    usedInRequest: "LV-2025-102",
  },
];

type TabKey = "Available" | "Pending" | "Used" | "Expired";

export default function MyCompOffCredits({ onApply }: { onApply: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>("Available");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);

  const filteredCredits = useMemo(() => {
    return MOCK_CREDITS.filter((credit) => {
      const matchesTab = credit.status === activeTab;
      const q = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !q ||
        credit.source.toLowerCase().includes(q) ||
        credit.id.toLowerCase().includes(q) ||
        credit.amount.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const expiringSoon = useMemo(
    () =>
      MOCK_CREDITS.filter(
        (credit) =>
          credit.status === "Available" &&
          typeof credit.daysToExpiry === "number" &&
          credit.daysToExpiry <= 30
      ),
    []
  );

  const availableDays = useMemo(() => {
    return MOCK_CREDITS.filter((credit) => credit.status === "Available").reduce(
      (sum, credit) => sum + Number.parseFloat(credit.amount) || 0,
      0
    );
  }, []);

  const pendingDays = useMemo(() => {
    return MOCK_CREDITS.filter((credit) => credit.status === "Pending").reduce(
      (sum, credit) => sum + Number.parseFloat(credit.amount) || 0,
      0
    );
  }, []);

  const usedDays = useMemo(() => {
    return MOCK_CREDITS.filter((credit) => credit.status === "Used").reduce(
      (sum, credit) => sum + Number.parseFloat(credit.amount) || 0,
      0
    );
  }, []);

  const expiringDays = useMemo(() => {
    return expiringSoon.reduce(
      (sum, credit) => sum + Number.parseFloat(credit.amount) || 0,
      0
    );
  }, [expiringSoon]);

  const getStatusBadge = (status: CompOffCredit["status"]) => {
    switch (status) {
      case "Available":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Used":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Expired":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  My Comp-Off Credits
                </h1>
                <p className="mt-0.5 text-sm text-brand-700">
                  Earned credits for working on holidays, weekends, and extra shifts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRequestFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" />
              Request New Credit
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Available
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {availableDays.toFixed(1)} Days
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Pending
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {pendingDays.toFixed(1)} Days
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Expiring Soon
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {expiringDays.toFixed(1)} Days
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Used This Year
                  </div>
                  <div className="mt-1 text-lg font-bold text-brand-900">
                    {usedDays.toFixed(1)} Days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expiry warning */}
        {expiringSoon.length > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-orange-900">
                    Credits Expiring Soon
                  </div>
                  <div className="mt-1 text-sm text-orange-800">
                    {expiringSoon[0].amount} expires on{" "}
                    <span className="font-semibold">{expiringSoon[0].expiryDate}</span>. Use it before it lapses.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onApply}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
              >
                Apply Now
              </button>
            </div>
          </div>
        )}

        {/* Main table area */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["Available", "Pending", "Used", "Expired"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-brand-800 text-white"
                      : "border border-gray-200 bg-white text-brand-800 hover:bg-brand-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <input
                type="text"
                placeholder="Search credits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-800"
              />
            </div>
          </div>

          <div className="border-b border-gray-200 px-6 py-3 text-sm text-brand-700">
            Showing <span className="font-semibold text-brand-900">{filteredCredits.length}</span>{" "}
            {activeTab.toLowerCase()} credit(s)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Earned Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Source / Activity
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                    Expiry
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
                {filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-300">
                        <Zap className="h-8 w-8" />
                      </div>
                      <div className="mt-4 text-sm font-semibold text-brand-900">
                        No {activeTab.toLowerCase()} credits found
                      </div>
                      <div className="mt-1 text-sm text-brand-700">
                        Try changing your search or request a new credit.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCredits.map((credit) => (
                    <tr key={credit.id} className="transition-colors hover:bg-brand-100">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-brand-900">
                          {credit.earnedDate}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-brand-700">
                          {credit.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-md text-sm text-brand-900">
                          {credit.source}
                        </div>
                        {credit.usedInRequest && (
                          <button
                            type="button"
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-800 transition hover:text-brand-900"
                          >
                            Used in: {credit.usedInRequest}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-brand-900">
                        {credit.amount}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-brand-900">{credit.expiryDate}</div>
                        {credit.status === "Available" && typeof credit.daysToExpiry === "number" && (
                          <div
                            className={`mt-1 text-[11px] font-semibold ${
                              credit.daysToExpiry <= 30 ? "text-orange-600" : "text-brand-700"
                            }`}
                          >
                            {credit.daysToExpiry} days left
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadge(
                            credit.status
                          )}`}
                        >
                          {credit.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {credit.status === "Available" && (
                            <button
                              type="button"
                              onClick={onApply}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                            >
                              Use as Leave
                            </button>
                          )}

                          {credit.status === "Pending" && (
                            <button
                              type="button"
                              className="rounded-lg border border-gray-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
                              title="Cancel Request"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            className="rounded-lg border border-gray-200 bg-white p-2 text-brand-800 transition hover:bg-brand-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
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

        {/* Bottom info cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-brand-800" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-800">
                What is Comp-Off?
              </h3>
            </div>

            <p className="mt-4 text-sm leading-6 text-brand-700">
              Compensatory Off credits are granted when you work outside your normal schedule,
              such as weekends, public holidays, or approved extra shifts. These credits can later
              be used as leave.
            </p>

            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-800 transition hover:text-brand-900"
            >
              Read Comp-Off Policy
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-brand-900 p-6 text-white shadow-sm">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold">Earned too many?</h3>
              <p className="mt-3 text-sm leading-6 text-brand-100">
                Credits usually expire within 90 days of being earned. Check your department rules
                for extension, encashment, or policy-based exceptions.
              </p>

              <button
                type="button"
                className="mt-5 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Check Rulebook
              </button>
            </div>
          </div>
        </div>

        <CompOffCreditRequestForm
          isOpen={isRequestFormOpen}
          onClose={() => setIsRequestFormOpen(false)}
        />
      </div>
    </div>
  );
}