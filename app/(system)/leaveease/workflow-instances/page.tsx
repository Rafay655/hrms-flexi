// app/flexi-hq/workflows/instances/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ListTree,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  Zap,
  ArrowUpRight,
  History,
  User,
  X,
  GitMerge,
  MessageSquare,
  ShieldAlert,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

interface WorkflowInstance {
  id: string;
  workflowName: string;
  requester: { name: string; avatar: string; id: string };
  entity: "Leave" | "Comp-Off" | "Encashment" | "OD/Travel" | "Adjustment";
  currentStep: string;
  status: "In Progress" | "Approved" | "Rejected" | "Escalated" | "Cancelled";
  startedAt: string;
  slaHoursRemaining: number;
  history: {
    step: string;
    who: string;
    decision: string;
    when: string;
    comment?: string;
    sla: string;
    status: "completed" | "current" | "pending";
  }[];
}

const MOCK_INSTANCES: WorkflowInstance[] = Array.from({ length: 30 }, (_, i) => {
  const statuses: WorkflowInstance["status"][] = [
    "In Progress",
    "Approved",
    "Rejected",
    "Escalated",
    "Cancelled",
  ];
  const entities: WorkflowInstance["entity"][] = [
    "Leave",
    "Comp-Off",
    "Encashment",
    "OD/Travel",
    "Adjustment",
  ];
  const status =
    i < 10
      ? "In Progress"
      : i < 15
      ? "Approved"
      : i < 20
      ? "Escalated"
      : statuses[i % 5];

  return {
    id: `WFI-2025-${8800 + i}`,
    workflowName:
      i % 3 === 0
        ? "Standard Leave Policy"
        : i % 3 === 1
        ? "High Value Encashment"
        : "International Travel Route",
    requester: {
      name: ["Ahmed Khan", "Sara Ahmed", "Tariq Mehmood", "Zoya Malik", "Ali Raza"][i % 5],
      avatar: ["AK", "SM", "TC", "ZM", "AR"][i % 5],
      id: `EMP-10${(i % 5) + 1}`,
    },
    entity: entities[i % 5],
    currentStep:
      status === "In Progress"
        ? "Manager Approval"
        : status === "Approved"
        ? "Finalized"
        : "HR Review",
    status,
    startedAt: "Feb 12, 2025 • 09:00 AM",
    slaHoursRemaining: status === "In Progress" ? 24 - i * 2 : 0,
    history: [
      {
        step: "Submission",
        who: "Self",
        decision: "Submitted",
        when: "Feb 12, 09:00 AM",
        sla: "N/A",
        status: "completed",
      },
      {
        step: "Manager Approval",
        who: "Sarah Admin",
        decision: status === "Approved" ? "Approved" : "Pending",
        when: status === "Approved" ? "Feb 12, 11:30 AM" : "-",
        comment: status === "Approved" ? "Looks good, approved." : undefined,
        sla: "24h",
        status: status === "Approved" ? "completed" : "current",
      },
      {
        step: "HR Review",
        who: "Zeeshan Malik",
        decision: "Pending",
        when: "-",
        sla: "48h",
        status: status === "Approved" ? "current" : "pending",
      },
    ],
  };
});

// ----------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function WorkflowInstancesList() {
  const [activeTab, setActiveTab] = useState<string>("in-progress");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filter instances based on tab and search
  const filteredInstances = useMemo(() => {
    return MOCK_INSTANCES.filter((inst) => {
      const matchesSearch =
        inst.requester.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        inst.id.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "in-progress" && inst.status === "In Progress") ||
        (activeTab === "completed" &&
          (inst.status === "Approved" || inst.status === "Rejected" || inst.status === "Cancelled")) ||
        (activeTab === "escalated" && inst.status === "Escalated");
      return matchesSearch && matchesTab;
    });
  }, [debouncedSearch, activeTab]);

  // Pagination
  const totalEntries = filteredInstances.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedInstances = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredInstances.slice(start, start + perPage);
  }, [filteredInstances, currentPage, perPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab, perPage]);

  const getStatusBadge = (status: WorkflowInstance["status"]) => {
    switch (status) {
      case "In Progress":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case "Approved":
        return <Badge className="bg-brand-700 text-white">Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case "Escalated":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Escalated</Badge>;
      case "Cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
    }
  };

  const getSlaInfo = (hours: number) => {
    if (hours <= 0) return { label: "Overdue", color: "text-red-500" };
    if (hours < 8) return { label: `${hours}h left`, color: "text-amber-500" };
    return { label: `${hours}h left`, color: "text-emerald-500" };
  };

  const handleViewEntity = () => {
    toast.info("View Entity", {
      description: `Navigating to ${selectedInstance?.entity} details...`,
    });
    // router.push(`/entity/${selectedInstance?.id}`)
  };

  const handleForceEscalate = () => {
    toast.warning("Force Escalate", {
      description: `Instance ${selectedInstance?.id} has been escalated to HR.`,
    });
    setSelectedInstance(null);
  };

  const handleResolveOverdue = () => {
    toast.success("Resolved", {
      description: `Instance ${selectedInstance?.id} marked as resolved.`,
    });
    setSelectedInstance(null);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
            <ListTree className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Workflow Instances</h1>
            <p className="text-sm text-brand-700">
              Track live approval processes and resolve bottlenecks in real‑time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-brand-50/30 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="bg-transparent gap-1">
                <TabsTrigger
                  value="in-progress"
                  className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
                >
                  In Progress
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
                >
                  Completed
                </TabsTrigger>
                <TabsTrigger
                  value="escalated"
                  className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
                >
                  Escalated
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-brand-800 data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
              <Input
                placeholder="Search requester or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-gray-200 focus:border-brand-800 text-brand-900"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Instance ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Workflow / Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Current Step
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    SLA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedInstances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <ListTree className="h-10 w-10 text-brand-300 mx-auto mb-2" />
                      <p className="font-medium text-brand-800">No instances found</p>
                      <p className="text-sm text-brand-600">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  paginatedInstances.map((inst) => {
                    const sla = getSlaInfo(inst.slaHoursRemaining);
                    return (
                      <tr
                        key={inst.id}
                        className="hover:bg-brand-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedInstance(inst)}
                      >
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-mono text-xs border-brand-200 text-brand-800">
                            {inst.id}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-brand-900">{inst.workflowName}</p>
                          <p className="text-xs text-brand-700 uppercase">{inst.entity} Entity</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-800 text-xs font-bold">
                              {inst.requester.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-brand-900">{inst.requester.name}</p>
                              <p className="text-xs text-brand-700">{inst.requester.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-brand-800">{inst.currentStep}</span>
                        </td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(inst.status)}</td>
                        <td className="px-6 py-4 text-center">
                          {inst.status === "In Progress" ? (
                            <span className={`text-xs font-medium ${sla.color} flex items-center gap-1 justify-center`}>
                              <Clock className="h-3 w-3" /> {sla.label}
                            </span>
                          ) : (
                            <span className="text-xs text-brand-700">Closed</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInstance(inst);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedInstances.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-brand-700">
                Showing {(currentPage - 1) * perPage + 1} to{" "}
                {Math.min(currentPage * perPage, totalEntries)} of {totalEntries} instances
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className="border-gray-200 text-brand-800"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-200 text-brand-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-brand-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-200 text-brand-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="border-gray-200 text-brand-800"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
                <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
                  <SelectTrigger className="w-20 border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 50].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet (Drawer) */}
      <Sheet open={!!selectedInstance} onOpenChange={() => setSelectedInstance(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          {selectedInstance && (
            <>
              <div className="bg-brand-900 px-6 py-5 text-white shrink-0">
                <SheetHeader>
                  <SheetTitle className="text-white text-lg font-semibold flex items-center gap-2">
                    <GitMerge className="h-5 w-5" />
                    Instance Audit: {selectedInstance.id}
                  </SheetTitle>
                  <SheetDescription className="text-brand-200 text-sm">
                    Started {selectedInstance.startedAt}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {/* Approval Pipeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                    Approval Pipeline
                  </h4>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gray-200 -translate-y-1/2" />
                    {selectedInstance.history.map((h, i) => (
                      <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                            h.status === "completed"
                              ? "bg-brand-800 text-white"
                              : h.status === "current"
                              ? "bg-brand-100 text-brand-800 ring-2 ring-brand-200"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {h.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                        </div>
                        <span className="text-xs font-medium text-brand-800 text-center w-16">
                          {h.step}
                        </span>
                      </div>
                    ))}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-brand-700">Finish</span>
                    </div>
                  </div>
                </div>

                {/* Requester Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                    Initiated By
                  </h4>
                  <div className="bg-brand-50 p-4 rounded-lg border border-brand-200 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-800 text-white font-bold">
                      {selectedInstance.requester.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-900">{selectedInstance.requester.name}</p>
                      <p className="text-xs text-brand-700">{selectedInstance.requester.id}</p>
                    </div>
                    <ArrowUpRight className="ml-auto h-5 w-5 text-brand-700" />
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Execution Timeline
                  </h4>
                  <div className="space-y-4">
                    {selectedInstance.history.map((step, i) => (
                      <div key={i} className="relative pl-6">
                        <div
                          className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${
                            step.status === "completed"
                              ? "bg-brand-800"
                              : step.status === "current"
                              ? "bg-brand-600 animate-pulse"
                              : "bg-gray-300"
                          }`}
                        />
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-semibold text-brand-900">{step.step}</p>
                              <p className="text-xs text-brand-700">
                                {step.who} • <span className="font-medium">{step.decision}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-brand-700">{step.when}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                SLA: {step.sla}
                              </Badge>
                            </div>
                          </div>
                          {step.comment && (
                            <div className="mt-3 p-3 bg-brand-50 rounded-md flex items-start gap-2">
                              <MessageSquare className="h-3 w-3 text-brand-700 mt-0.5" />
                              <p className="text-xs text-brand-800 italic">"{step.comment}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Compliance */}
                <div className="p-4 bg-brand-50 rounded-lg border border-brand-200 flex items-start gap-3">
                  <ShieldAlert className="h-4 w-4 text-brand-800 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-brand-900 uppercase tracking-wider mb-1">
                      Audit Compliance
                    </h5>
                    <p className="text-xs text-brand-700 leading-relaxed">
                      This instance is executing under{" "}
                      <span className="font-semibold underline">Policy v2.1</span>. Any manual
                      overrides are automatically flagged for the quarterly compliance review.
                    </p>
                  </div>
                </div>
              </div>

              <SheetFooter className="border-t border-gray-200 px-6 py-4 bg-brand-50/30 shrink-0 gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-brand-800 hover:bg-brand-100"
                  onClick={handleViewEntity}
                >
                  View Entity Details
                </Button>
                {selectedInstance.status === "In Progress" && (
                  <Button
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleForceEscalate}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Force Escalate
                  </Button>
                )}
                {selectedInstance.status === "Escalated" && (
                  <Button
                    className="flex-1 bg-brand-800 hover:bg-brand-900 text-white"
                    onClick={handleResolveOverdue}
                  >
                    Resolve Overdue
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}