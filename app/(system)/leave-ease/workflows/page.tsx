// app/flexi-hq/workflows/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  GitMerge,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit3,
  Copy,
  Archive,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Zap,
  ListTree,
  History,
  Plane,
  Briefcase,
  DollarSign,
  Database,
  Sliders,
  X,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

interface Workflow {
  id: string;
  name: string;
  entity: "Leave Request" | "Comp-Off Credit" | "Encashment" | "OD/Travel" | "Balance Adjustment";
  steps: string[];
  conditions: string;
  version: string;
  status: "Active" | "Draft" | "Archived";
  instances: number;
}

const MOCK_WORKFLOWS: Workflow[] = [
  { id: "WF-001", name: "Standard Leave Approval", entity: "Leave Request", steps: ["Manager", "HR"], conditions: "If > 5 days", version: "v2.1", status: "Active", instances: 1420 },
  { id: "WF-002", name: "Sick Leave Auto-Pass", entity: "Leave Request", steps: ["System"], conditions: "If < 2 days", version: "v1.0", status: "Active", instances: 850 },
  { id: "WF-003", name: "Manager Overtime Verify", entity: "Comp-Off Credit", steps: ["Manager", "Admin"], conditions: "Always", version: "v1.4", status: "Active", instances: 310 },
  { id: "WF-004", name: "High Value Encashment", entity: "Encashment", steps: ["Manager", "HR Head", "Finance"], conditions: "If > PKR 50k", version: "v3.0", status: "Active", instances: 45 },
  { id: "WF-005", name: "International Travel Route", entity: "OD/Travel", steps: ["Manager", "Dept Head", "Travel Desk"], conditions: "If International", version: "v2.0", status: "Active", instances: 112 },
  { id: "WF-006", name: "Minor Adjustment Rule", entity: "Balance Adjustment", steps: ["Admin"], conditions: "If < 1 day", version: "v1.1", status: "Active", instances: 88 },
  { id: "WF-007", name: "Executive Leave Route", entity: "Leave Request", steps: ["CEO"], conditions: "Grade E1+", version: "v1.0", status: "Draft", instances: 0 },
  { id: "WF-008", name: "Legacy Comp-Off", entity: "Comp-Off Credit", steps: ["HR"], conditions: "None", version: "v0.9", status: "Archived", instances: 1205 },
];

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

export default function LeaveWorkflowsList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return MOCK_WORKFLOWS.filter((wf) => {
      const matchesSearch =
        wf.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        wf.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        wf.entity.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "All" || wf.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [debouncedSearch, statusFilter]);

  // Pagination
  const totalEntries = filteredWorkflows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedWorkflows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredWorkflows.slice(start, start + perPage);
  }, [filteredWorkflows, currentPage, perPage]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, perPage]);

  const getEntityBadge = (entity: Workflow["entity"]) => {
    const variants: Record<Workflow["entity"], string> = {
      "Leave Request": "bg-blue-100 text-blue-800 border-blue-200",
      "Comp-Off Credit": "bg-purple-100 text-purple-800 border-purple-200",
      Encashment: "bg-emerald-100 text-emerald-800 border-emerald-200",
      "OD/Travel": "bg-amber-100 text-amber-800 border-amber-200",
      "Balance Adjustment": "bg-brand-100 text-brand-800 border-brand-200",
    };
    return variants[entity] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusBadge = (status: Workflow["status"]) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-brand-700 text-white">Active</Badge>;
      case "Draft":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Draft</Badge>;
      case "Archived":
        return <Badge variant="outline">Archived</Badge>;
    }
  };

  // Action handlers
  const handleCreateWorkflow = () => {
    toast.info("Create Workflow", { description: "Opening workflow designer..." });
  };

  const handleViewLogic = (wf: Workflow) => {
    setSelectedWorkflow(wf);
  };

  const handleEditDesigner = (wf: Workflow) => {
    toast.info("Edit Workflow", { description: `Opening ${wf.name} in designer.` });
  };

  const handleClone = (wf: Workflow) => {
    toast.success("Clone Workflow", { description: `${wf.name} has been cloned.` });
  };

  const handleViewInstances = (wf: Workflow) => {
    toast.info("View Instances", { description: `Navigating to instances of ${wf.name}.` });
  };

  const handleArchive = (wf: Workflow) => {
    toast.warning("Archive Workflow", { description: `${wf.name} has been archived.` });
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
            <GitMerge className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Approval Workflows</h1>
            <p className="text-sm text-brand-700">
              Design and automate approval paths with custom conditions and multi-stage routing.
            </p>
          </div>
        </div>
        <Button onClick={handleCreateWorkflow} className="bg-brand-800 hover:bg-brand-900 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-brand-50/30 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
              <Input
                placeholder="Search by workflow name or entity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-gray-200 focus:border-brand-800 text-brand-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] border-gray-200 text-brand-800">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="border-gray-200 text-brand-800">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Workflow Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Target Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Routing Steps
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Trigger Condition
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <GitMerge className="h-10 w-10 text-brand-300 mx-auto mb-2" />
                      <p className="font-medium text-brand-800">No workflows found</p>
                      <p className="text-sm text-brand-600">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  paginatedWorkflows.map((wf) => (
                    <tr key={wf.id} className="hover:bg-brand-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-brand-900">{wf.name}</p>
                        <p className="text-xs text-brand-700 font-mono">{wf.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getEntityBadge(wf.entity)} text-xs font-medium`}>
                          {wf.entity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {wf.steps.map((step, i) => (
                            <React.Fragment key={i}>
                              <span className="text-xs font-medium text-brand-800 bg-brand-50 px-2 py-1 rounded">
                                {step}
                              </span>
                              {i < wf.steps.length - 1 && (
                                <ChevronRight className="h-3 w-3 text-brand-700" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-brand-700 italic">"{wf.conditions}"</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-mono font-medium text-brand-700">{wf.version}</span>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(wf.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewLogic(wf)}>
                              <Eye className="h-4 w-4 mr-2" /> View Logic
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditDesigner(wf)}>
                              <Edit3 className="h-4 w-4 mr-2" /> Edit Designer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(wf)}>
                              <Copy className="h-4 w-4 mr-2" /> Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewInstances(wf)}>
                              <ListTree className="h-4 w-4 mr-2" /> View Instances ({wf.instances})
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchive(wf)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Archive className="h-4 w-4 mr-2" /> Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedWorkflows.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-brand-700">
                Showing {(currentPage - 1) * perPage + 1} to{" "}
                {Math.min(currentPage * perPage, totalEntries)} of {totalEntries} workflows
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

      {/* Info Card */}
      <div className="bg-brand-900 rounded-2xl p-8 lg:p-12 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-brand-200" />
              <h3 className="text-xl font-bold uppercase tracking-wider text-brand-200">
                System Logic Rules
              </h3>
            </div>
            <p className="text-sm text-brand-100 leading-relaxed">
              Workflows are the brain of LeaveEase. You can define triggers based on duration,
              employee grade, department, or balance impact. Complex multi-stage approvals ensure
              compliance while automation like "System Auto-Pass" reduces administrative overhead for
              low-risk requests.
            </p>
            <div className="flex gap-4">
              <Button className="bg-brand-200 text-brand-900 hover:bg-white font-semibold">
                Launch Designer Pro
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                View Rule Documentation
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Active Instances", val: "2.8k", icon: ListTree },
              { label: "System Efficiency", val: "92%", icon: ShieldCheck },
              { label: "Manual Steps Removed", val: "14k", icon: History },
              { label: "Decision Confidence", val: "99.9%", icon: CheckCircle2 },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Icon className="text-brand-200 mb-3 h-5 w-5" />
                  <p className="text-2xl font-bold">{stat.val}</p>
                  <p className="text-xs font-bold uppercase text-brand-300 tracking-wider">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        <GitMerge className="absolute -bottom-20 -right-20 h-64 w-64 text-white/5 -rotate-12" />
      </div>

      {/* Logic Preview Dialog */}
      <Dialog open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-gray-200">
          {selectedWorkflow && (
            <>
              <div className="bg-brand-900 px-6 py-5 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
                    <ListTree className="h-5 w-5" />
                    {selectedWorkflow.name}
                  </DialogTitle>
                  <DialogDescription className="text-brand-200">
                    Logic Diagram • {selectedWorkflow.version}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Trigger Event */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                    Trigger Event
                  </h4>
                  <div className="p-4 bg-brand-50 rounded-lg border border-brand-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {selectedWorkflow.entity === "Leave Request" && (
                          <Database className="h-5 w-5 text-brand-800" />
                        )}
                        {selectedWorkflow.entity === "Comp-Off Credit" && (
                          <Zap className="h-5 w-5 text-purple-600" />
                        )}
                        {selectedWorkflow.entity === "Encashment" && (
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                        )}
                        {selectedWorkflow.entity === "OD/Travel" && (
                          <Plane className="h-5 w-5 text-amber-600" />
                        )}
                        {selectedWorkflow.entity === "Balance Adjustment" && (
                          <Sliders className="h-5 w-5 text-brand-800" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-900">
                          {selectedWorkflow.entity} Submitted
                        </p>
                        <p className="text-xs text-brand-700">{selectedWorkflow.conditions}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval Pipeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                    Approval Pipeline
                  </h4>
                  <div className="space-y-4 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200">
                    {selectedWorkflow.steps.map((step, i) => (
                      <div key={i} className="relative flex items-center gap-4 pl-12">
                        <div className="absolute left-0 w-10 h-10 rounded-full bg-brand-800 text-white flex items-center justify-center font-bold text-sm border-4 border-white shadow-md">
                          {i + 1}
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-brand-900">{step} Approval</p>
                            <p className="text-xs text-brand-700">
                              SLA: 24 Hours • Notification: Email/Push
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-brand-700" />
                        </div>
                      </div>
                    ))}
                    <div className="relative flex items-center gap-4 pl-12 opacity-70">
                      <div className="absolute left-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center border-4 border-white shadow-md">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 bg-emerald-50 p-4 rounded-lg border border-emerald-200 shadow-sm">
                        <p className="text-sm font-semibold text-emerald-800">Success State</p>
                        <p className="text-xs text-emerald-700">
                          Balance Updated • Employee Notified
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-gray-200 px-6 py-4 bg-brand-50/30 gap-3">
                <Button
                  variant="outline"
                  className="border-gray-200 text-brand-800 hover:bg-brand-100"
                  onClick={() => {
                    setSelectedWorkflow(null);
                    handleEditDesigner(selectedWorkflow);
                  }}
                >
                  Edit in Designer
                </Button>
                <Button
                  className="bg-brand-800 hover:bg-brand-900 text-white"
                  onClick={() => setSelectedWorkflow(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}