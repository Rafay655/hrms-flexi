// app/flexi-hq/encashment/page.tsx
"use client";

import React, { useState } from "react";
import {
  Wallet,
  FileSpreadsheet,
  Search,
  Clock,
  CheckCircle2,
  CheckSquare,
  XCircle,
  Eye,
  DollarSign,
  Download,
  CreditCard,
  History,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface EncashmentHRRecord {
  id: string;
  employee: string;
  avatar: string;
  dept: string;
  type: string;
  days: number;
  amount: number;
  submitted: string;
  status: "Pending" | "Approved" | "Processed" | "Rejected";
  processedOn?: string;
}

const MOCK_ENCASHMENTS: EncashmentHRRecord[] = [
  {
    id: "ENC-2025-001",
    employee: "Ahmed Khan",
    avatar: "AK",
    dept: "Engineering",
    type: "Annual Leave",
    days: 5,
    amount: 25000,
    submitted: "2h ago",
    status: "Pending",
  },
  {
    id: "ENC-2025-002",
    employee: "Sara Ahmed",
    avatar: "SM",
    dept: "Product",
    type: "Annual Leave",
    days: 8,
    amount: 40000,
    submitted: "5h ago",
    status: "Pending",
  },
  {
    id: "ENC-2025-003",
    employee: "Tariq Mehmood",
    avatar: "TC",
    dept: "Engineering",
    type: "Comp-Off",
    days: 2,
    amount: 9600,
    submitted: "1d ago",
    status: "Approved",
  },
  {
    id: "ENC-2025-004",
    employee: "Amna Bilal",
    avatar: "AB",
    dept: "Design",
    type: "Annual Leave",
    days: 10,
    amount: 50000,
    submitted: "Jan 12, 2025",
    status: "Processed",
    processedOn: "Jan 15, 2025",
  },
  {
    id: "ENC-2025-005",
    employee: "Zoya Malik",
    avatar: "ZM",
    dept: "Engineering",
    type: "Comp-Off",
    days: 1,
    amount: 4800,
    submitted: "Jan 10, 2025",
    status: "Rejected",
  },
  {
    id: "ENC-2025-006",
    employee: "Ali Raza",
    avatar: "AR",
    dept: "HR",
    type: "Annual Leave",
    days: 4,
    amount: 20000,
    submitted: "3h ago",
    status: "Pending",
  },
  {
    id: "ENC-2025-007",
    employee: "Mona Shah",
    avatar: "MS",
    dept: "Engineering",
    type: "Annual Leave",
    days: 5,
    amount: 25000,
    submitted: "Jan 14, 2025",
    status: "Approved",
  },
];

export const EncashmentRequestsList = () => {
  const [activeTab, setActiveTab] = useState("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredData = MOCK_ENCASHMENTS.filter((item) => {
    const matchesTab = activeTab === "All" || item.status === activeTab;
    const matchesSearch =
      item.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
            Pending
          </Badge>
        );
      case "Approved":
        return (
          <Badge className="bg-brand-700 text-white border-transparent hover:bg-brand-700">
            Approved
          </Badge>
        );
      case "Processed":
        return (
          <Badge className="bg-brand-600 text-white border-transparent hover:bg-brand-600">
            Processed
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        {/* Header */}
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Encashment Requests
                </CardTitle>
                <p className="text-sm text-brand-700 mt-0.5">
                  Review and process leave balance liquidation for payroll.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-brand-800 hover:bg-brand-900 text-white gap-2">
                <Download className="h-4 w-4" /> Export for PayEdge
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Financial Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">
                  Pending Payouts
                </p>
                <p className="text-xl font-bold text-brand-900">PKR 125,000</p>
                <p className="text-[10px] text-amber-600 font-bold mt-1">
                  8 REQUESTS
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-brand-100 text-brand-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">
                  Approved (Month)
                </p>
                <p className="text-xl font-bold text-brand-900">PKR 180,000</p>
                <p className="text-[10px] text-brand-800 font-bold mt-1">
                  12 REQUESTS
                </p>
              </div>
            </div>
            <div className="bg-brand-900 p-5 rounded-xl shadow-sm flex items-center gap-4 text-white">
              <div className="p-3 bg-white/10 text-brand-200 rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                  Total Paid (2025)
                </p>
                <p className="text-xl font-bold">PKR 675,000</p>
                <p className="text-[10px] text-brand-200 font-bold mt-1">
                  45 PROCESSED
                </p>
              </div>
            </div>
          </div>

          {/* Tabs & Search */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-1 overflow-x-auto">
                {["Pending", "Approved", "Processed", "Rejected", "All"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedIds([]);
                      }}
                      className={`px-4 py-3 text-xs font-semibold transition-all relative whitespace-nowrap ${
                        activeTab === tab
                          ? "text-brand-900"
                          : "text-brand-600 hover:text-brand-800"
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-800 rounded-t-full" />
                      )}
                    </button>
                  )
                )}
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                <Input
                  type="text"
                  placeholder="Search employee or ID..."
                  className="pl-10 border-gray-200 focus:border-brand-800 focus:ring-brand-800 text-brand-900 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="px-6 py-4 bg-brand-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedIds.length} items selected
                  </span>
                  <div className="h-4 w-px bg-white/20" />
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-white/60 hover:text-white underline"
                  >
                    Clear Selection
                  </button>
                </div>
                <div className="flex gap-3">
                  {activeTab === "Pending" && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      <CheckSquare className="h-4 w-4" /> Approve Selected
                    </Button>
                  )}
                  {activeTab === "Approved" && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      <CreditCard className="h-4 w-4" /> Mark as Paid
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20 gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Export for Payroll
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedIds(
                            e.target.checked ? filteredData.map((r) => r.id) : []
                          )
                        }
                        className="rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Wallet className="h-10 w-10 text-brand-300" />
                          <p className="font-medium text-brand-800">
                            No {activeTab.toLowerCase()} requests found
                          </p>
                          <p className="text-sm text-brand-600">
                            Try adjusting your filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-brand-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white text-xs font-bold uppercase">
                              {item.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-900">
                                {item.employee}
                              </p>
                              <p className="text-[10px] text-brand-600 uppercase font-medium">
                                {item.dept} • {item.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-brand-800">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-brand-900">
                            {item.days.toFixed(1)} d
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-brand-800">
                            PKR {item.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-brand-700">
                              {item.submitted}
                            </span>
                            {item.processedOn && (
                              <span className="text-[9px] font-bold text-brand-600 uppercase mt-1">
                                Paid: {item.processedOn}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {item.status === "Pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-brand-600 hover:text-brand-900 hover:bg-brand-100"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {item.status === "Approved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                                title="Mark as Processed"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
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

          {/* Bottom Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h4 className="text-sm font-semibold text-brand-800 uppercase tracking-wider flex items-center gap-2">
                  <History className="h-4 w-4 text-brand-700" /> Audit Trail
                </h4>
                <p className="text-sm text-brand-700 leading-relaxed">
                  Every encashment request is logged and requires multi-level
                  verification. Approved requests are exported to the payroll
                  module at the end of each fiscal period.
                </p>
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <Button
                    variant="link"
                    className="text-brand-800 p-0 h-auto text-xs font-semibold hover:underline gap-2"
                  >
                    View Full Process Logs <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold text-brand-800 uppercase tracking-wider border-brand-200"
                  >
                    ISO 27001 Compliant
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-brand-900 border-0 shadow-lg relative overflow-hidden">
              <CardContent className="p-6 text-white relative z-10 space-y-4">
                <h4 className="text-xl font-bold">Payroll Lock In Progress</h4>
                <p className="text-white/60 text-sm">
                  System is currently preparing the Jan 2025 payout file. 8
                  approved requests will be included in this batch.
                </p>
                <Button className="bg-brand-200 text-brand-900 hover:bg-white shadow-md">
                  Review Batch v2.1
                </Button>
              </CardContent>
              <DollarSign className="absolute -right-10 -bottom-10 text-white/5 h-48 w-48" />
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EncashmentRequestsList;