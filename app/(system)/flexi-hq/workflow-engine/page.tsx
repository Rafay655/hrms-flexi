"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch, Plus, Search, Play, Pause, Settings2,
  CheckCircle2, Clock, AlertTriangle, ArrowRight,
} from "lucide-react";

/* ── Mock data ── */
const WORKFLOWS = [
  { id: "WF-001", name: "Leave Request Approval", module: "LeaveEase", entity: "Leave Request", steps: 3, status: "Active", instances: 42, version: "v2.1" },
  { id: "WF-002", name: "Overtime Approval", module: "TimeSync", entity: "OT Request", steps: 2, status: "Active", instances: 18, version: "v1.0" },
  { id: "WF-003", name: "Payroll Run Approval", module: "PayEdge", entity: "Payroll Run", steps: 4, status: "Active", instances: 3, version: "v3.0" },
  { id: "WF-004", name: "Salary Adjustment", module: "PayEdge", entity: "Adjustment", steps: 3, status: "Active", instances: 7, version: "v1.2" },
  { id: "WF-005", name: "Shift Swap Approval", module: "TimeSync", entity: "Shift Swap", steps: 2, status: "Draft", instances: 0, version: "v1.0" },
  { id: "WF-006", name: "Comp-Off Credit", module: "LeaveEase", entity: "Comp-Off", steps: 2, status: "Active", instances: 12, version: "v1.1" },
  { id: "WF-007", name: "Encashment Approval", module: "LeaveEase", entity: "Encashment", steps: 3, status: "Active", instances: 5, version: "v2.0" },
  { id: "WF-008", name: "Transfer Approval", module: "PeopleHub", entity: "Transfer", steps: 4, status: "Active", instances: 2, version: "v1.0" },
  { id: "WF-009", name: "Exit Clearance", module: "PeopleHub", entity: "Exit", steps: 5, status: "Active", instances: 1, version: "v1.0" },
  { id: "WF-010", name: "Regularization", module: "TimeSync", entity: "Regularization", steps: 2, status: "Archived", instances: 0, version: "v1.0" },
];

const INSTANCES = [
  { id: "INS-301", workflow: "Leave Request Approval", requester: "Sana Ahmed", currentStep: "Manager Review", status: "In Progress", slaHours: 6, module: "LeaveEase" },
  { id: "INS-302", workflow: "Overtime Approval", requester: "Muhammad Ali", currentStep: "HR Approval", status: "In Progress", slaHours: 2, module: "TimeSync" },
  { id: "INS-303", workflow: "Payroll Run Approval", requester: "System", currentStep: "Finance Sign-off", status: "Escalated", slaHours: 0, module: "PayEdge" },
  { id: "INS-304", workflow: "Encashment Approval", requester: "Bilal Hassan", currentStep: "Complete", status: "Completed", slaHours: 0, module: "LeaveEase" },
  { id: "INS-305", workflow: "Transfer Approval", requester: "Hira Khan", currentStep: "Director Approval", status: "In Progress", slaHours: 18, module: "PeopleHub" },
];

const moduleBadgeColor: Record<string, string> = {
  LeaveEase: "bg-purple-100 text-purple-800",
  TimeSync: "bg-blue-100 text-blue-800",
  PayEdge: "bg-green-100 text-green-800",
  PeopleHub: "bg-amber-100 text-amber-800",
};

export default function WorkflowEnginePage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");

  const modules = ["All", "LeaveEase", "TimeSync", "PayEdge", "PeopleHub"];

  const filtered = WORKFLOWS.filter(
    (w) =>
      (moduleFilter === "All" || w.module === moduleFilter) &&
      (w.name.toLowerCase().includes(search.toLowerCase()) || w.entity.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6" /> Workflow Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified approval workflows across all Flexi HRMS modules
          </p>
        </div>
        <Button className="bg-brand-800 text-white hover:bg-brand-700 gap-2">
          <Plus className="h-4 w-4" /> New Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Workflows", value: WORKFLOWS.filter((w) => w.status === "Active").length, icon: Play, color: "text-green-600" },
          { label: "Running Instances", value: INSTANCES.filter((i) => i.status === "In Progress").length, icon: Clock, color: "text-blue-600" },
          { label: "Escalated", value: INSTANCES.filter((i) => i.status === "Escalated").length, icon: AlertTriangle, color: "text-red-600" },
          { label: "Modules Connected", value: 4, icon: GitBranch, color: "text-brand-800" },
        ].map((s) => (
          <Card key={s.label} className="border-border shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-900">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="instances">Live Instances</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search workflows..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1">
              {modules.map((m) => (
                <Button key={m} variant={moduleFilter === m ? "default" : "outline"} size="sm" onClick={() => setModuleFilter(m)}
                  className={moduleFilter === m ? "bg-brand-800 text-white" : ""}>
                  {m}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-100/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Workflow</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Module</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Entity</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-900">Steps</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-900">Instances</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-900">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-brand-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-900">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.id} · {w.version}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={moduleBadgeColor[w.module] || "bg-gray-100 text-gray-800"}>{w.module}</Badge>
                    </td>
                    <td className="px-4 py-3 text-brand-700">{w.entity}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {Array.from({ length: w.steps }).map((_, i) => (
                          <span key={i} className="flex items-center gap-0.5">
                            <span className="h-2 w-2 rounded-full bg-brand-500" />
                            {i < w.steps - 1 && <ArrowRight className="h-2.5 w-2.5 text-brand-300" />}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{w.instances}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={w.status === "Active" ? "bg-green-100 text-green-800" : w.status === "Draft" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}>
                        {w.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm"><Settings2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="instances" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-100/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Instance</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Workflow</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Requester</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Current Step</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-900">SLA</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INSTANCES.map((inst) => (
                  <tr key={inst.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-brand-900">{inst.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-brand-800">{inst.workflow}</p>
                      <Badge className={`text-xs ${moduleBadgeColor[inst.module]}`}>{inst.module}</Badge>
                    </td>
                    <td className="px-4 py-3 text-brand-700">{inst.requester}</td>
                    <td className="px-4 py-3 text-brand-700">{inst.currentStep}</td>
                    <td className="px-4 py-3 text-center">
                      {inst.status === "Completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <span className={`font-bold ${inst.slaHours <= 2 ? "text-red-600" : inst.slaHours <= 8 ? "text-amber-600" : "text-green-600"}`}>
                          {inst.slaHours}h
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={
                        inst.status === "Completed" ? "bg-green-100 text-green-800" :
                        inst.status === "Escalated" ? "bg-red-100 text-red-800" :
                        "bg-blue-100 text-blue-800"
                      }>{inst.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
