// app/flexi-hq/workflows/builder/page.tsx
"use client";

import React, { useState } from "react";
import {
  GitMerge,
  Plus,
  X,
  ArrowRight,
  Save,
  Send,
  Eye,
  Clock,
  ShieldCheck,
  User,
  Users,
  Building,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  GripVertical,
  Trash2,
  Info,
  LayoutList,
  Database,
  Plane,
  Sliders,
  DollarSign,
  Calculator,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WorkflowStep {
  id: string;
  name: string;
  type: "Approval" | "Review" | "Auto-Approve";
  approverType: "Manager" | "Role" | "Static User" | "Dept Head" | "Expression";
  approverValue: string;
  sla: number;
  escalateTo?: string;
  actions: string[];
}

const DEFAULT_STEPS: WorkflowStep[] = [
  {
    id: "1",
    name: "Line Manager",
    type: "Approval",
    approverType: "Manager",
    approverValue: "L1",
    sla: 24,
    actions: ["Approve", "Reject", "Request Info"],
  },
  {
    id: "2",
    name: "HR Operations",
    type: "Review",
    approverType: "Role",
    approverValue: "HR_Admin",
    sla: 48,
    actions: ["Approve", "Reject"],
  },
];

// Custom CheckSquare icon
const CheckSquare = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

export default function LeaveWorkflowBuilder() {
  const [workflowName, setWorkflowName] = useState("Standard Leave Policy");
  const [entity, setEntity] = useState("Leave Request");
  const [steps, setSteps] = useState<WorkflowStep[]>(DEFAULT_STEPS);
  const [selectedStepId, setSelectedStepId] = useState<string | null>("1");
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");

  const selectedStep = steps.find((s) => s.id === selectedStepId);

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      name: "New Step",
      type: "Approval",
      approverType: "Manager",
      approverValue: "L1",
      sla: 24,
      actions: ["Approve", "Reject"],
    };
    setSteps([...steps, newStep]);
    setSelectedStepId(newStep.id);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const updateStep = (updates: Partial<WorkflowStep>) => {
    setSteps(steps.map((s) => (s.id === selectedStepId ? { ...s, ...updates } : s)));
  };

  const handlePublish = () => {
    setStatus("Published");
    toast.success("Workflow Published", {
      description: `${workflowName} v3.0 is now live.`,
    });
  };

  const handleTestSimulation = () => {
    toast.info("Test Simulation", {
      description: "Running simulation against current configuration...",
    });
  };

  return (
    <div className="flex h-screen bg-brand-50/30 font-sans overflow-hidden">
      {/* Left Area: Visual Canvas */}
      <main className="flex-1 flex flex-col overflow-hidden relative border-r border-gray-200">
        {/* Header */}
        <header className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
              <GitMerge className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-xl font-bold text-brand-900 border-none bg-transparent h-auto p-0 focus-visible:ring-0 w-64"
                />
                <Badge className="bg-brand-100 text-brand-800 border-brand-200">v2.1</Badge>
                <Badge
                  className={
                    status === "Draft"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-brand-700 text-white"
                  }
                >
                  {status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-brand-700">Entity Type:</p>
                <Select value={entity} onValueChange={setEntity}>
                  <SelectTrigger className="h-auto p-0 border-0 bg-transparent text-xs font-semibold text-brand-800 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leave Request">Leave Request</SelectItem>
                    <SelectItem value="Comp-Off Credit">Comp-Off Credit</SelectItem>
                    <SelectItem value="Encashment">Encashment</SelectItem>
                    <SelectItem value="OD/Travel">OD/Travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={handleTestSimulation}
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Test Simulation
            </Button>
            <Button onClick={handlePublish} className="bg-brand-800 hover:bg-brand-900 text-white">
              <Send className="h-4 w-4 mr-2" />
              Publish v3.0
            </Button>
          </div>
        </header>

        {/* Canvas Body */}
        <div className="flex-1 overflow-auto p-8 flex flex-col items-center">
          <div className="w-full max-w-lg space-y-8">
            {/* Start Node */}
            <div className="flex flex-col items-center">
              <div className="w-40 py-3 bg-white border-2 border-gray-200 rounded-lg shadow-sm text-center font-semibold text-brand-700 uppercase tracking-wider text-xs flex flex-col items-center gap-2">
                <Database className="h-4 w-4" /> START
              </div>
              <div className="w-0.5 h-10 bg-gray-300 border-dashed border-l-2" />
            </div>

            {/* Dynamic Steps */}
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  onClick={() => setSelectedStepId(step.id)}
                  className={`w-64 p-5 rounded-xl border-2 transition-all cursor-pointer relative group flex flex-col items-center text-center ${
                    selectedStepId === step.id
                      ? "bg-brand-800 border-brand-800 shadow-lg text-white"
                      : "bg-white border-gray-200 shadow-sm hover:border-brand-200 text-brand-900"
                  }`}
                >
                  <div
                    className={`absolute -left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md ${
                      selectedStepId === step.id ? "bg-white/10" : "bg-brand-50"
                    }`}
                  >
                    <GripVertical
                      className={`h-4 w-4 ${
                        selectedStepId === step.id ? "text-white/40" : "text-brand-700"
                      }`}
                    />
                  </div>

                  <span
                    className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      selectedStepId === step.id ? "text-brand-200" : "text-brand-700"
                    }`}
                  >
                    Step {index + 1}: {step.type}
                  </span>
                  <h4 className="font-semibold text-base">{step.name}</h4>
                  <div
                    className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
                      selectedStepId === step.id ? "text-white/60" : "text-brand-700"
                    }`}
                  >
                    <Clock className="h-3 w-3" /> {step.sla}h SLA
                  </div>

                  {selectedStepId === step.id && (
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(step.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="w-0.5 h-10 bg-gray-300 border-dashed border-l-2" />
              </div>
            ))}

            {/* Add Step Button */}
            <div className="flex flex-col items-center">
              <Button
                variant="outline"
                onClick={addStep}
                className="border-2 border-dashed border-gray-300 text-brand-700 hover:border-brand-800 hover:text-brand-800 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Approval Step
              </Button>
              <div className="w-0.5 h-10 bg-gray-300 border-dashed border-l-2" />
            </div>

            {/* End Node */}
            <div className="flex flex-col items-center">
              <div className="w-40 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg shadow-sm text-center font-semibold text-emerald-700 uppercase tracking-wider text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> END / FINALIZED
              </div>
            </div>
          </div>
        </div>

        {/* Global Conditions */}
        <section className="bg-white border-t border-gray-200 p-6 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-800" /> Workflow Triggers
            </h3>
            <p className="text-xs font-medium text-brand-700">APPLY THIS WORKFLOW WHEN:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-brand-700 uppercase">Leave Type</Label>
              <Select defaultValue="all">
                <SelectTrigger className="border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Paid Types</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-brand-700 uppercase">Duration Rule</Label>
              <div className="flex gap-2">
                <Select defaultValue="gt">
                  <SelectTrigger className="border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">&gt; X Days</SelectItem>
                    <SelectItem value="lt">&lt; X Days</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" defaultValue={5} className="w-20 text-center" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-brand-700 uppercase">Employee Scope</Label>
              <Button variant="outline" className="w-full justify-between border-gray-200 text-brand-800">
                Permanent Staff (L1-L5) <Sliders className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Right Sidebar: Step Configuration */}
      <aside className="w-[400px] bg-white flex flex-col shrink-0 border-l border-gray-200">
        {selectedStep ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-brand-50/30">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                Step Configuration
              </p>
              <h3 className="text-xl font-bold text-brand-900">{selectedStep.name}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Step Name */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-brand-700 uppercase">Step Name *</Label>
                <Input
                  value={selectedStep.name}
                  onChange={(e) => updateStep({ name: e.target.value })}
                  className="border-gray-200 focus:border-brand-800 text-brand-900"
                />
              </div>

              {/* Step Type */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-brand-700 uppercase">Process Type</Label>
                <div className="space-y-2">
                  {(["Approval", "Review", "Auto-Approve"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateStep({ type: t })}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        selectedStep.type === t
                          ? "border-brand-800 bg-brand-50"
                          : "border-gray-200 hover:border-brand-200"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedStep.type === t
                            ? "bg-brand-800 text-white"
                            : "bg-brand-100 text-brand-800"
                        }`}
                      >
                        {t === "Approval" ? (
                          <CheckSquare size={18} />
                        ) : t === "Review" ? (
                          <Eye className="h-5 w-5" />
                        ) : (
                          <Zap className="h-5 w-5" />
                        )}
                      </div>
                      <div className="text-left">
                        <p
                          className={`text-sm font-semibold ${
                            selectedStep.type === t ? "text-brand-900" : "text-brand-800"
                          }`}
                        >
                          {t}
                        </p>
                        <p className="text-xs text-brand-700">
                          {t === "Approval"
                            ? "Requires explicit binary decision."
                            : t === "Review"
                            ? "Informational only, no block."
                            : "System decides based on rules."}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Approver */}
              <div className="space-y-4">
                <Label className="text-xs font-semibold text-brand-700 uppercase">
                  Designated Approver
                </Label>
                <Select
                  value={selectedStep.approverType}
                  onValueChange={(v) => updateStep({ approverType: v as any })}
                >
                  <SelectTrigger className="border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Hierarchical Manager</SelectItem>
                    <SelectItem value="Role">Organization Role</SelectItem>
                    <SelectItem value="Static User">Specific Staff Member</SelectItem>
                    <SelectItem value="Dept Head">Department Head</SelectItem>
                  </SelectContent>
                </Select>

                {selectedStep.approverType === "Manager" && (
                  <div className="flex gap-2">
                    {["L1", "L2", "L3"].map((lvl) => (
                      <Button
                        key={lvl}
                        variant={selectedStep.approverValue === lvl ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStep({ approverValue: lvl })}
                        className={
                          selectedStep.approverValue === lvl
                            ? "bg-brand-800 hover:bg-brand-900 text-white"
                            : "border-gray-200 text-brand-800"
                        }
                      >
                        Level {lvl[1]}
                      </Button>
                    ))}
                  </div>
                )}

                {selectedStep.approverType === "Role" && (
                  <Select
                    value={selectedStep.approverValue}
                    onValueChange={(v) => updateStep({ approverValue: v })}
                  >
                    <SelectTrigger className="border-gray-200 text-brand-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR_Admin">HR Administrator</SelectItem>
                      <SelectItem value="FIN_Lead">Finance Controller</SelectItem>
                      <SelectItem value="DEPT_H">HOD Pool</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* SLA & Escalation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-brand-700 uppercase">
                    SLA & Escalation
                  </Label>
                  <Badge className="bg-amber-100 text-amber-800">Enabled</Badge>
                </div>
                <div className="bg-brand-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium text-brand-700">Response Time Limit</p>
                      <div className="relative">
                        <Input
                          type="number"
                          value={selectedStep.sla}
                          onChange={(e) => updateStep({ sla: parseInt(e.target.value) || 0 })}
                          className="pr-12 border-gray-200 text-brand-900"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-700">
                          Hours
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-brand-700 mt-5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium text-brand-700">Escalate To</p>
                      <Select defaultValue="skip">
                        <SelectTrigger className="border-gray-200 text-brand-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip Level Mgr</SelectItem>
                          <SelectItem value="hr">HR Central</SelectItem>
                          <SelectItem value="force">Force Approve</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Actions */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-brand-700 uppercase">
                  Available Actions
                </Label>
                <div className="flex flex-wrap gap-2">
                  {["Approve", "Reject", "Request Info", "Delegate"].map((action) => (
                    <label
                      key={action}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md cursor-pointer hover:bg-brand-50"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={selectedStep.actions.includes(action)}
                        className="rounded border-gray-300 text-brand-800 focus:ring-brand-800"
                      />
                      <span className="text-xs font-medium text-brand-800 uppercase">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-brand-50/30">
              <Button
                variant="outline"
                className="w-full border-gray-200 text-brand-800 hover:bg-brand-100"
                onClick={() => setSelectedStepId(null)}
              >
                Close Configuration
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-100 rounded-xl flex items-center justify-center text-brand-800">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-brand-900">Select a Step</h4>
              <p className="text-sm text-brand-700 mt-1">
                Click any node on the visual canvas to configure its approver logic, SLA and
                behavior.
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}