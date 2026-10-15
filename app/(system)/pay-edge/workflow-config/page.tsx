"use client";
import { showApiError } from "@/lib/error-toast";
import React, { useMemo, useState } from "react";
import {
  GitBranch,
  Plus,
  Search,
  Filter,
  Settings2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Calculator,
  Zap,
  Save,
  X,
  Layers,
  Play,
  Database,
  ArrowDown,
  Share2,
  Info,
  CheckCircle2,
  Trash2,
  GripVertical,
  MousePointer2,
  GitCommit,
  Pencil,
  Copy,
  ChevronUp,
  ChevronDown,
  Workflow as WorkflowIcon,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
type WorkflowEntity =
  | "Payroll Run"
  | "Loan Request"
  | "Adjustment"
  | "Promotion"
  | "EOS";
type WorkflowStatus = "Active" | "Draft" | "Locked";
type StepType = "Approval" | "Review" | "Commit" | "Trigger";
interface WorkflowCondition {
  id: string;
  label: string;
  operator: ">" | "<" | "=" | ">=" | "<=" | "Contains";
  value: string;
}
interface WorkflowStep {
  id: string;
  name: string;
  role: string;
  stepType: StepType;
  sla: string;
  escalation: string;
  actions: string[];
}
interface WorkflowItem {
  id: string;
  code: string;
  name: string;
  entity: WorkflowEntity;
  status: WorkflowStatus;
  description: string;
  version: string;
  updatedAt: string;
  tags: string[];
  conditions: WorkflowCondition[];
  steps: WorkflowStep[];
}
const ENTITY_OPTIONS: WorkflowEntity[] = [
  "Payroll Run",
  "Loan Request",
  "Adjustment",
  "Promotion",
  "EOS",
];
const STATUS_OPTIONS: WorkflowStatus[] = ["Active", "Draft", "Locked"];
const STEP_TYPE_OPTIONS: StepType[] = [
  "Approval",
  "Review",
  "Commit",
  "Trigger",
];
const ROLE_OPTIONS = [
  "Payroll Officer",
  "HR Manager",
  "HR Director",
  "Finance Head",
  "CFO",
  "Audit Lead",
  "Department Head",
  "Compliance Officer",
];
function formatDateLabel() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function createWorkflowCode(index: number) {
  return `WF-${String(index).padStart(2, "0")}`;
}
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
function createEmptyStep(index: number): WorkflowStep {
  return {
    id: `step-${Date.now()}-${index}`,
    name: `Stage ${index}`,
    role: "Payroll Officer",
    stepType: "Approval",
    sla: "8 Hours",
    escalation: "HR Manager",
    actions: ["Review", "Approve"],
  };
}
function createEmptyWorkflow(index: number): WorkflowItem {
  return {
    id: `workflow-${Date.now()}-${index}`,
    code: createWorkflowCode(index),
    name: "New Workflow",
    entity: "Payroll Run",
    status: "Draft",
    description: "Define approval stages and routing logic for this workflow.",
    version: "v1.0",
    updatedAt: formatDateLabel(),
    tags: ["High Variance"],
    conditions: [
      {
        id: `cond-${Date.now()}-1`,
        label: "Net Sum",
        operator: ">",
        value: "500000",
      },
    ],
    steps: [createEmptyStep(1), createEmptyStep(2)],
  };
}
const MOCK_WORKFLOWS: WorkflowItem[] = [
  {
    id: "wf-01",
    code: "WF-01",
    name: "Standard Payroll Approval",
    entity: "Payroll Run",
    status: "Active",
    description:
      "Default approval chain for monthly payroll processing and finance release.",
    version: "v2.1",
    updatedAt: "Apr 02, 2026",
    tags: ["Monthly Payroll", "Compliance"],
    conditions: [{ id: "c1", label: "Always", operator: "=", value: "True" }],
    steps: [
      {
        id: "s1",
        name: "Initial Validation",
        role: "Payroll Officer",
        stepType: "Review",
        sla: "4 Hours",
        escalation: "HR Manager",
        actions: ["Calculate", "Validate"],
      },
      {
        id: "s2",
        name: "HR Review",
        role: "HR Manager",
        stepType: "Approval",
        sla: "24 Hours",
        escalation: "HR Director",
        actions: ["Review", "Verify Compliance"],
      },
      {
        id: "s3",
        name: "Finance Approval",
        role: "Finance Head",
        stepType: "Commit",
        sla: "12 Hours",
        escalation: "CFO",
        actions: ["Approve", "Disburse"],
      },
    ],
  },
  {
    id: "wf-02",
    code: "WF-02",
    name: "High-Value Loan Process",
    entity: "Loan Request",
    status: "Active",
    description:
      "Multi-step routing for high-value loan requests requiring finance oversight.",
    version: "v1.4",
    updatedAt: "Apr 01, 2026",
    tags: ["Loan", "High Value", "Manual Check"],
    conditions: [{ id: "c2", label: "Amount", operator: ">", value: "500000" }],
    steps: [
      {
        id: "s4",
        name: "Eligibility Review",
        role: "HR Manager",
        stepType: "Review",
        sla: "8 Hours",
        escalation: "HR Director",
        actions: ["Review", "Verify History"],
      },
      {
        id: "s5",
        name: "Finance Validation",
        role: "Finance Head",
        stepType: "Approval",
        sla: "24 Hours",
        escalation: "CFO",
        actions: ["Validate", "Approve"],
      },
      {
        id: "s6",
        name: "Final Commit",
        role: "CFO",
        stepType: "Commit",
        sla: "12 Hours",
        escalation: "CFO",
        actions: ["Approve", "Commit"],
      },
    ],
  },
  {
    id: "wf-03",
    code: "WF-03",
    name: "Ad-hoc Bonus Workflow",
    entity: "Adjustment",
    status: "Draft",
    description:
      "Draft workflow for discretionary bonuses and one-off payroll adjustments.",
    version: "v1.0",
    updatedAt: "Mar 29, 2026",
    tags: ["Bonus", "Adjustment"],
    conditions: [
      { id: "c3", label: "Type", operator: "Contains", value: "Bonus" },
    ],
    steps: [
      {
        id: "s7",
        name: "Department Review",
        role: "Department Head",
        stepType: "Approval",
        sla: "6 Hours",
        escalation: "HR Manager",
        actions: ["Review", "Recommend"],
      },
      {
        id: "s8",
        name: "HR Confirmation",
        role: "HR Manager",
        stepType: "Commit",
        sla: "8 Hours",
        escalation: "HR Director",
        actions: ["Approve", "Commit"],
      },
    ],
  },
  {
    id: "wf-04",
    code: "WF-04",
    name: "Director Promotion Cycle",
    entity: "Promotion",
    status: "Locked",
    description:
      "Restricted workflow for promotions to senior grades and leadership bands.",
    version: "v3.0",
    updatedAt: "Mar 20, 2026",
    tags: ["Promotion", "Leadership", "Locked"],
    conditions: [
      { id: "c4", label: "Target Grade", operator: ">=", value: "G19" },
    ],
    steps: [
      {
        id: "s9",
        name: "Performance Review",
        role: "Department Head",
        stepType: "Review",
        sla: "12 Hours",
        escalation: "HR Director",
        actions: ["Review", "Recommend"],
      },
      {
        id: "s10",
        name: "HR Panel",
        role: "HR Director",
        stepType: "Approval",
        sla: "24 Hours",
        escalation: "HR Director",
        actions: ["Validate", "Approve"],
      },
      {
        id: "s11",
        name: "Executive Approval",
        role: "CFO",
        stepType: "Commit",
        sla: "24 Hours",
        escalation: "CFO",
        actions: ["Approve", "Finalize"],
      },
    ],
  },
];
function StatusBadge({ status }: { status: WorkflowStatus }) {
  const classes =
    status === "Active"
      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-50"
      : status === "Draft"
        ? "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100"
        : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50";
  return (
    <Badge variant="outline" className={`text-[11px] font-semibold ${classes}`}>
      {status}
    </Badge>
  );
}
function StepTypeBadge({ type }: { type: StepType }) {
  const classes =
    type === "Approval"
      ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50"
      : type === "Review"
        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
        : type === "Commit"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
          : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50";
  return (
    <Badge variant="outline" className={`text-[11px] font-semibold ${classes}`}>
      {type}
    </Badge>
  );
}
function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-brand-700">
      <span className="font-semibold text-brand-900">{value}</span>
      <span>{label}</span>
    </div>
  );
}
function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
        {label}
      </label>
      {children}
    </div>
  );
}
function calculateHealth(workflow: WorkflowItem) {
  const emptyRoles = workflow.steps.filter((step) => !step.role.trim()).length;
  const emptyActions = workflow.steps.filter(
    (step) => step.actions.length === 0,
  ).length;
  const invalidSla = workflow.steps.filter((step) => !step.sla.trim()).length;
  const noConditions = workflow.conditions.length === 0;
  const tooFewSteps = workflow.steps.length < 2;
  return {
    emptyRoles,
    emptyActions,
    invalidSla,
    noConditions,
    tooFewSteps,
    isHealthy:
      emptyRoles === 0 &&
      emptyActions === 0 &&
      invalidSla === 0 &&
      !noConditions &&
      !tooFewSteps,
  };
}
export default function PayEdgeWorkflowConfig() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(MOCK_WORKFLOWS);
  const [search, setSearch] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [draftWorkflow, setDraftWorkflow] = useState<WorkflowItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [newAction, setNewAction] = useState("");
  const [newTag, setNewTag] = useState("");
  const filteredWorkflows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workflows;
    return workflows.filter((wf) => {
      const haystack = [
        wf.code,
        wf.name,
        wf.entity,
        wf.status,
        wf.description,
        wf.version,
        wf.tags.join(" "),
        wf.conditions
          .map((c) => `${c.label} ${c.operator} ${c.value}`)
          .join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, workflows]);
  const stats = useMemo(() => {
    return {
      total: workflows.length,
      active: workflows.filter((w) => w.status === "Active").length,
      draft: workflows.filter((w) => w.status === "Draft").length,
      locked: workflows.filter((w) => w.status === "Locked").length,
    };
  }, [workflows]);
  const currentStepData = useMemo(() => {
    return (
      draftWorkflow?.steps.find((step) => step.id === activeStepId) ?? null
    );
  }, [draftWorkflow, activeStepId]);
  const workflowHealth = useMemo(() => {
    return draftWorkflow ? calculateHealth(draftWorkflow) : null;
  }, [draftWorkflow]);
  const openCreate = () => {
    const wf = createEmptyWorkflow(workflows.length + 1);
    setDraftWorkflow(wf);
    setEditingId(null);
    setActiveStepId(wf.steps[0]?.id ?? null);
    setIsBuilding(true);
    setNewAction("");
    setNewTag("");
  };
  const openEdit = (workflow: WorkflowItem) => {
    const cloned = deepClone(workflow);
    setDraftWorkflow(cloned);
    setEditingId(workflow.id);
    setActiveStepId(cloned.steps[0]?.id ?? null);
    setIsBuilding(true);
    setNewAction("");
    setNewTag("");
  };
  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    setWorkflows((prev) => prev.filter((wf) => wf.id !== id));
  };
  const handleDuplicate = (workflow: WorkflowItem) => {
    const copy = deepClone(workflow);
    const newId = `workflow-${Date.now()}`;
    const duplicated: WorkflowItem = {
      ...copy,
      id: newId,
      code: `${workflow.code}-COPY`,
      name: `${workflow.name} (Copy)`,
      status: "Draft",
      version: "v1.0",
      updatedAt: formatDateLabel(),
      steps: workflow.steps.map((step, index) => ({
        ...deepClone(step),
        id: `step-${Date.now()}-${index}`,
      })),
      conditions: workflow.conditions.map((condition, index) => ({
        ...deepClone(condition),
        id: `cond-${Date.now()}-${index}`,
      })),
    };
    setWorkflows((prev) => [duplicated, ...prev]);
  };
  const handleSave = () => {
    if (!draftWorkflow) return;
    if (!draftWorkflow.name.trim()) {
      alert("Workflow name is required.");
      return;
    }
    if (!draftWorkflow.code.trim()) {
      alert("Workflow code is required.");
      return;
    }
    if (draftWorkflow.steps.length === 0) {
      alert("At least one workflow step is required.");
      return;
    }
    const updatedWorkflow = { ...draftWorkflow, updatedAt: formatDateLabel() };
    if (editingId) {
      setWorkflows((prev) =>
        prev.map((wf) => (wf.id === editingId ? updatedWorkflow : wf)),
      );
    } else {
      setWorkflows((prev) => [updatedWorkflow, ...prev]);
    }
    setIsBuilding(false);
    setDraftWorkflow(null);
    setEditingId(null);
    setActiveStepId(null);
  };
  const handleExportLogic = async () => {
    if (!draftWorkflow) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(draftWorkflow, null, 2),
      );
      alert("Workflow logic copied to clipboard as JSON.");
    } catch (apiFailure) {
      showApiError(apiFailure, { fallbackMessage: "Unable to copy workflow logic." });
    }
  };
  const updateDraft = <K extends keyof WorkflowItem>(
    key: K,
    value: WorkflowItem[K],
  ) => {
    setDraftWorkflow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };
  const updateStep = <K extends keyof WorkflowStep>(
    stepId: string,
    key: K,
    value: WorkflowStep[K],
  ) => {
    setDraftWorkflow((prev) =>
      prev
        ? {
            ...prev,
            steps: prev.steps.map((step) =>
              step.id === stepId ? { ...step, [key]: value } : step,
            ),
          }
        : prev,
    );
  };
  const addStep = () => {
    setDraftWorkflow((prev) => {
      if (!prev) return prev;
      const newStep = createEmptyStep(prev.steps.length + 1);
      setActiveStepId(newStep.id);
      return { ...prev, steps: [...prev.steps, newStep] };
    });
  };
  const removeStep = (stepId: string) => {
    setDraftWorkflow((prev) => {
      if (!prev) return prev;
      const nextSteps = prev.steps.filter((step) => step.id !== stepId);
      if (activeStepId === stepId) {
        setActiveStepId(nextSteps[0]?.id ?? null);
      }
      return { ...prev, steps: nextSteps };
    });
  };
  const moveStep = (stepId: string, direction: "up" | "down") => {
    setDraftWorkflow((prev) => {
      if (!prev) return prev;
      const currentIndex = prev.steps.findIndex((step) => step.id === stepId);
      if (currentIndex === -1) return prev;
      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.steps.length) return prev;
      const nextSteps = [...prev.steps];
      [nextSteps[currentIndex], nextSteps[targetIndex]] = [
        nextSteps[targetIndex],
        nextSteps[currentIndex],
      ];
      return { ...prev, steps: nextSteps };
    });
  };
  const addActionToStep = () => {
    if (!currentStepData || !newAction.trim()) return;
    setDraftWorkflow((prev) =>
      prev
        ? {
            ...prev,
            steps: prev.steps.map((step) =>
              step.id === currentStepData.id
                ? { ...step, actions: [...step.actions, newAction.trim()] }
                : step,
            ),
          }
        : prev,
    );
    setNewAction("");
  };
  const removeActionFromStep = (action: string) => {
    if (!currentStepData) return;
    setDraftWorkflow((prev) =>
      prev
        ? {
            ...prev,
            steps: prev.steps.map((step) =>
              step.id === currentStepData.id
                ? { ...step, actions: step.actions.filter((a) => a !== action) }
                : step,
            ),
          }
        : prev,
    );
  };
  const updateCondition = <K extends keyof WorkflowCondition>(
    conditionId: string,
    key: K,
    value: WorkflowCondition[K],
  ) => {
    setDraftWorkflow((prev) =>
      prev
        ? {
            ...prev,
            conditions: prev.conditions.map((condition) =>
              condition.id === conditionId
                ? { ...condition, [key]: value }
                : condition,
            ),
          }
        : prev,
    );
  };
  const addCondition = () => {
    setDraftWorkflow((prev) =>
      prev
        ? {
            ...prev,
            conditions: [
              ...prev.conditions,
              {
                id: `cond-${Date.now()}`,
                label: "New Condition",
                operator: ">",
                value: "",
              },
            ],
          }
        : prev,
    );
  };
  const removeCondition = (conditionId: string) => {
    setDraftWorkflow((prev) =>
      prev
        ? {
            ...prev,
            conditions: prev.conditions.filter(
              (condition) => condition.id !== conditionId,
            ),
          }
        : prev,
    );
  };
  const addTag = () => {
    if (!newTag.trim()) return;
    setDraftWorkflow((prev) =>
      prev ? { ...prev, tags: [...prev.tags, newTag.trim()] } : prev,
    );
    setNewTag("");
  };
  const removeTag = (tag: string) => {
    setDraftWorkflow((prev) =>
      prev ? { ...prev, tags: prev.tags.filter((t) => t !== tag) } : prev,
    );
  };
  return (
    <div className="min-h-screen bg-white p-3">
      <div className="space-y-4">
        {/* Header */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                  <GitBranch className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-brand-900">
                    Workflow Orchestration
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-sm text-brand-700">
                    Design multi-tier approval chains and conditional routing
                    logic
                  </CardDescription>
                </div>
              </div>
              {!isBuilding && (
                <Button
                  onClick={openCreate}
                  className="bg-brand-800 text-white hover:bg-brand-900"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create New Workflow
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
        {!isBuilding ? (
          <>
            {/* Search + stats */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, entity, status, tag, condition..."
                      className="border-gray-200 pl-10 text-brand-900"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    >
                      <Filter className="mr-2 h-4 w-4" /> All Workflows
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    >
                      <Layers className="mr-2 h-4 w-4" /> Latest First
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-sm">
                      <span className="text-brand-700">Showing </span>
                      <span className="font-semibold text-brand-900">
                        {filteredWorkflows.length}
                      </span>
                      <span className="text-brand-700"> of </span>
                      <span className="font-semibold text-brand-900">
                        {workflows.length}
                      </span>
                      <span className="text-brand-700"> workflows</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatPill label="Total" value={stats.total} />
                      <div className="h-3 w-px bg-brand-300" />
                      <StatPill label="Active" value={stats.active} />
                      <div className="h-3 w-px bg-brand-300" />
                      <StatPill label="Draft" value={stats.draft} />
                      <div className="h-3 w-px bg-brand-300" />
                      <StatPill label="Locked" value={stats.locked} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Listing */}
            <Card className="overflow-hidden border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white">
                    <TableRow className="border-b border-gray-200 hover:bg-white">
                      <TableHead className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Sr.
                      </TableHead>
                      <TableHead className="min-w-[260px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Workflow
                      </TableHead>
                      <TableHead className="w-[150px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Entity
                      </TableHead>
                      <TableHead className="w-[100px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Steps
                      </TableHead>
                      <TableHead className="min-w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Conditions
                      </TableHead>
                      <TableHead className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Status
                      </TableHead>
                      <TableHead className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Updated
                      </TableHead>
                      <TableHead className="w-[170px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-800">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {filteredWorkflows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="px-4 py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                              <WorkflowIcon className="h-6 w-6 text-brand-700" />
                            </div>
                            <p className="text-sm font-semibold text-brand-900">
                              No workflows found
                            </p>
                            <p className="text-sm text-brand-700">
                              Create a new workflow or adjust your search.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWorkflows.map((wf, index) => (
                        <TableRow
                          key={wf.id}
                          className="border-b border-gray-200 last:border-b-0 hover:bg-brand-100"
                        >
                          <TableCell className="px-4 py-3.5 text-sm font-semibold text-brand-900">
                            {String(index + 1).padStart(2, "0")}
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                                <GitBranch className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-brand-900">
                                  {wf.name}
                                </div>
                                <div className="text-[11px] text-brand-700">
                                  {wf.code} • {wf.version}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <Badge
                              variant="outline"
                              className="border-gray-200 bg-white text-[11px] font-semibold text-brand-800 hover:bg-white"
                            >
                              {wf.entity}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-center">
                            <span className="text-sm font-semibold text-brand-900">
                              {wf.steps.length}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <div className="text-sm text-brand-700">
                              {wf.conditions
                                .map(
                                  (c) => `${c.label} ${c.operator} ${c.value}`,
                                )
                                .join(" • ")}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <StatusBadge status={wf.status} />
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <div className="text-sm font-semibold text-brand-900">
                              {wf.updatedAt}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDuplicate(wf)}
                                className="h-8 w-8 text-brand-700 hover:bg-brand-100"
                                title="Duplicate"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(wf)}
                                className="h-8 w-8 text-brand-700 hover:bg-brand-100"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(wf.id)}
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Builder header */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsBuilding(false);
                      setDraftWorkflow(null);
                      setEditingId(null);
                      setActiveStepId(null);
                    }}
                    className="w-fit border-gray-200 text-brand-800 hover:bg-brand-100"
                  >
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back to
                    Workflow List
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleExportLogic}
                      className="border-gray-200 text-brand-800 hover:bg-brand-100"
                    >
                      <Share2 className="mr-2 h-4 w-4" /> Export Logic
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-brand-800 text-white hover:bg-brand-900"
                    >
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {draftWorkflow && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                {/* Left Panel */}
                <div className="space-y-4 xl:col-span-4">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle className="text-base font-semibold text-brand-900">
                        Workflow Details
                      </CardTitle>
                      <CardDescription className="text-sm text-brand-700">
                        Core identity, entity mapping, and workflow state
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <FieldBlock label="Workflow Name">
                        <Input
                          value={draftWorkflow.name}
                          onChange={(e) => updateDraft("name", e.target.value)}
                          className="border-gray-200 w-full text-brand-900"
                        />
                      </FieldBlock>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldBlock label="Workflow Code">
                          <Input
                            value={draftWorkflow.code}
                            onChange={(e) =>
                              updateDraft("code", e.target.value)
                            }
                            className="border-gray-200 w-full text-brand-900"
                          />
                        </FieldBlock>
                        <FieldBlock label="Version">
                          <Input
                            value={draftWorkflow.version}
                            onChange={(e) =>
                              updateDraft("version", e.target.value)
                            }
                            className="border-gray-200 w-full text-brand-900"
                          />
                        </FieldBlock>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldBlock label="Target Entity">
                          <Select
                            value={draftWorkflow.entity}
                            onValueChange={(value) =>
                              updateDraft("entity", value as WorkflowEntity)
                            }
                          >
                            <SelectTrigger className="border-gray-200 w-full text-brand-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ENTITY_OPTIONS.map((entity) => (
                                <SelectItem key={entity} value={entity}>
                                  {entity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldBlock>
                        <FieldBlock label="Status">
                          <Select
                            value={draftWorkflow.status}
                            onValueChange={(value) =>
                              updateDraft("status", value as WorkflowStatus)
                            }
                          >
                            <SelectTrigger className="border-gray-200 w-full text-brand-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldBlock>
                      </div>
                      <FieldBlock label="Description">
                        <Textarea
                          value={draftWorkflow.description}
                          onChange={(e) =>
                            updateDraft("description", e.target.value)
                          }
                          className="min-h-[96px] border-gray-200 text-brand-900"
                        />
                      </FieldBlock>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold text-brand-900">
                            Step Stack
                          </CardTitle>
                          <CardDescription className="text-sm text-brand-700">
                            Add, remove, and reorder approval stages
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addStep}
                          className="border-gray-200 text-brand-800 hover:bg-brand-100"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Step
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4">
                      {draftWorkflow.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`rounded-xl border p-3 transition-all ${activeStepId === step.id ? "border-brand-800 bg-brand-100" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              onClick={() => setActiveStepId(step.id)}
                              className="flex flex-1 items-start gap-3 text-left"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-800 shadow-sm">
                                <UserCheck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-brand-900">
                                  {step.name || `Stage ${index + 1}`}
                                </div>
                                <div className="mt-0.5 text-[11px] text-brand-700">
                                  {step.role} • {step.sla}
                                </div>
                              </div>
                            </button>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveStep(step.id, "up")}
                                className="h-7 w-7 text-brand-700 hover:bg-white"
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveStep(step.id, "down")}
                                className="h-7 w-7 text-brand-700 hover:bg-white"
                                disabled={
                                  index === draftWorkflow.steps.length - 1
                                }
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeStep(step.id)}
                                className="h-7 w-7 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <StepTypeBadge type={step.stepType} />
                            <Badge
                              variant="outline"
                              className="border-gray-200 bg-white text-[11px] font-semibold text-brand-700 hover:bg-white"
                            >
                              {step.actions.length} actions
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                {/* Canvas */}
                <div className="xl:col-span-5">
                  <Card className="h-full overflow-hidden border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold text-brand-900">
                            Visual Flow Canvas
                          </CardTitle>
                          <CardDescription className="text-sm text-brand-700">
                            Visual representation of step sequence and flow
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-gray-200 text-brand-800 hover:bg-brand-100"
                          >
                            <MousePointer2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-gray-200 text-brand-800 hover:bg-brand-100"
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="min-h-[760px] bg-gray-100 p-6">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                          <Play className="h-6 w-6" fill="currentColor" />
                        </div>
                        <div className="h-6 w-px bg-brand-300" />
                        {draftWorkflow.steps.map((step, index) => (
                          <React.Fragment key={step.id}>
                            <button
                              onClick={() => setActiveStepId(step.id)}
                              className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition-all ${activeStepId === step.id ? "border-brand-800 ring-2 ring-brand-200" : "border-gray-200 hover:border-brand-200"}`}
                            >
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <Badge
                                  variant="outline"
                                  className="border-brand-200 bg-brand-100 text-[11px] font-semibold text-brand-800 hover:bg-brand-100"
                                >
                                  Stage {index + 1}
                                </Badge>
                                <GripVertical className="h-4 w-4 text-brand-400" />
                              </div>
                              <div className="flex items-center gap-4">
                                <div
                                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${activeStepId === step.id ? "bg-brand-800 text-white" : "bg-brand-100 text-brand-800"}`}
                                >
                                  <UserCheck className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-brand-900">
                                    {step.name}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-brand-700">
                                    <span>{step.role}</span> <span>•</span>
                                    <span>{step.sla}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <StepTypeBadge type={step.stepType} />
                                <Badge
                                  variant="outline"
                                  className="border-gray-200 bg-white text-[11px] font-semibold text-brand-700 hover:bg-white"
                                >
                                  {step.actions.join(", ")}
                                </Badge>
                              </div>
                            </button>
                            {index < draftWorkflow.steps.length - 1 ? (
                              <>
                                <div className="h-8 w-px bg-brand-300" />
                                <ArrowDown className="h-4 w-4 text-brand-500" />
                                <div className="h-4 w-px bg-brand-300" />
                              </>
                            ) : null}
                          </React.Fragment>
                        ))}
                        <div className="h-6 w-px bg-brand-300" />
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-800 text-white shadow-sm">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Inspector */}
                <div className="space-y-4 xl:col-span-3">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle className="text-base font-semibold text-brand-900">
                        Step Inspector
                      </CardTitle>
                      <CardDescription className="text-sm text-brand-700">
                        Configure the selected step
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      {currentStepData ? (
                        <>
                          <FieldBlock label="Stage Name">
                            <Input
                              value={currentStepData.name}
                              onChange={(e) =>
                                updateStep(
                                  currentStepData.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="border-gray-200 w-full text-brand-900"
                            />
                          </FieldBlock>
                          <FieldBlock label="Approver Role">
                            <Select
                              value={currentStepData.role}
                              onValueChange={(value) =>
                                updateStep(currentStepData.id, "role", value)
                              }
                            >
                              <SelectTrigger className="border-gray-200 w-full text-brand-900">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FieldBlock>
                          <div className="grid grid-cols-2 gap-3">
                            <FieldBlock label="Step Type">
                              <Select
                                value={currentStepData.stepType}
                                onValueChange={(value) =>
                                  updateStep(
                                    currentStepData.id,
                                    "stepType",
                                    value as StepType,
                                  )
                                }
                              >
                                <SelectTrigger className="border-gray-200 w-full text-brand-900">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STEP_TYPE_OPTIONS.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FieldBlock>
                            <FieldBlock label="SLA Limit">
                              <Input
                                value={currentStepData.sla}
                                onChange={(e) =>
                                  updateStep(
                                    currentStepData.id,
                                    "sla",
                                    e.target.value,
                                  )
                                }
                                className="border-gray-200 w-full text-brand-900"
                              />
                            </FieldBlock>
                          </div>
                          <FieldBlock label="Escalation Path">
                            <Input
                              value={currentStepData.escalation}
                              onChange={(e) =>
                                updateStep(
                                  currentStepData.id,
                                  "escalation",
                                  e.target.value,
                                )
                              }
                              className="border-gray-200 w-full text-brand-900"
                            />
                          </FieldBlock>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                              Permitted Actions
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {currentStepData.actions.map((action) => (
                                <span
                                  key={action}
                                  className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-800"
                                >
                                  {action}
                                  <button
                                    onClick={() => removeActionFromStep(action)}
                                    className="text-brand-500 hover:text-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newAction}
                                onChange={(e) => setNewAction(e.target.value)}
                                placeholder="Add action"
                                className="border-gray-200 w-full text-brand-900"
                              />
                              <Button
                                variant="outline"
                                onClick={addActionToStep}
                                className="border-gray-200 text-brand-800 hover:bg-brand-100"
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-10 text-center">
                          <Info className="mx-auto mb-2 h-8 w-8 text-brand-300" />
                          <p className="text-sm font-semibold text-brand-900">
                            No step selected
                          </p>
                          <p className="text-sm text-brand-700">
                            Select a step from the canvas or step stack.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle className="text-base font-semibold text-brand-900">
                        Route Conditions
                      </CardTitle>
                      <CardDescription className="text-sm text-brand-700">
                        Define triggers and routing rules
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div className="space-y-3">
                        {draftWorkflow.conditions.map((condition) => (
                          <Card
                            key={condition.id}
                            className="border border-gray-200 shadow-none"
                          >
                            <CardContent className="space-y-3 p-3">
                              <div className="grid grid-cols-[1fr_92px_1fr_auto] gap-2">
                                <Input
                                  value={condition.label}
                                  onChange={(e) =>
                                    updateCondition(
                                      condition.id,
                                      "label",
                                      e.target.value,
                                    )
                                  }
                                  className="border-gray-200 w-full text-brand-900"
                                />
                                <Select
                                  value={condition.operator}
                                  onValueChange={(value) =>
                                    updateCondition(
                                      condition.id,
                                      "operator",
                                      value as WorkflowCondition["operator"],
                                    )
                                  }
                                >
                                  <SelectTrigger className="border-gray-200 w-full text-brand-900">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value=">">{">"}</SelectItem>
                                    <SelectItem value="<">{"<"}</SelectItem>
                                    <SelectItem value="=">{"="}</SelectItem>
                                    <SelectItem value=">=">{">="}</SelectItem>
                                    <SelectItem value="<=">{"<="}</SelectItem>
                                    <SelectItem value="Contains">
                                      Contains
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={condition.value}
                                  onChange={(e) =>
                                    updateCondition(
                                      condition.id,
                                      "value",
                                      e.target.value,
                                    )
                                  }
                                  className="border-gray-200 w-full text-brand-900"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCondition(condition.id)}
                                  className="h-10 w-10 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={addCondition}
                        className="w-full border-dashed border-gray-200 text-brand-800 hover:bg-brand-100"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Condition
                      </Button>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                          Content Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {draftWorkflow.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-800"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="text-brand-500 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag"
                            className="border-gray-200 w-full text-brand-900"
                          />
                          <Button
                            variant="outline"
                            onClick={addTag}
                            className="border-gray-200 text-brand-800 hover:bg-brand-100"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-brand-800 bg-brand-800 text-white shadow-sm">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                          <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">
                            Logic Health
                          </h3>
                          <p className="text-sm text-white/80">
                            Detect gaps and routing issues
                          </p>
                        </div>
                      </div>
                      {workflowHealth && (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">Minimum Steps</span>
                            <span className="font-semibold">
                              {workflowHealth.tooFewSteps ? "Missing" : "OK"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">Missing Roles</span>
                            <span className="font-semibold">
                              {workflowHealth.emptyRoles}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">Empty Actions</span>
                            <span className="font-semibold">
                              {workflowHealth.emptyActions}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">Missing SLA</span>
                            <span className="font-semibold">
                              {workflowHealth.invalidSla}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">Conditions</span>
                            <span className="font-semibold">
                              {workflowHealth.noConditions ? "Missing" : "OK"}
                            </span>
                          </div>
                          <div className="mt-4 rounded-xl bg-white/10 p-3">
                            <div className="flex items-center gap-2">
                              {workflowHealth.isHealthy ? (
                                <CheckCircle2 className="h-4 w-4 text-green-300" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-300" />
                              )}
                              <span className="text-sm font-semibold">
                                {workflowHealth.isHealthy
                                  ? "Workflow is structurally healthy"
                                  : "Workflow has review items"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
