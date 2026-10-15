"use client";

import { showApiError } from "@/lib/error-toast";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  GitBranch,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import { useAppSelector } from "@/store/hooks";
import type {
  PerformProCreateGoalInput,
  PerformProCycle,
  PerformProGoal,
  PerformProGoalCheckin,
  PerformProParticipant,
  PerformProReviseGoalInput,
} from "@/types/performpro";

const createGoalSchema = z.object({
  participantUuid: z.string().uuid("Select an enrolled participant."),
  parentGoalUuid: z.string(),
  goalType: z.enum(["KPI", "KRA", "OKR_OBJECTIVE", "OKR_KEY_RESULT"]),
  cascadeLevel: z.enum(["COMPANY", "DEPARTMENT", "TEAM", "INDIVIDUAL"]),
  title: z.string().trim().min(3, "Enter a goal title.").max(300),
  description: z.string().max(10000),
  weightagePct: z.string().refine(
    (value) => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 100,
    "Weight must be between 0 and 100.",
  ),
  startValue: z.string().refine(
    (value) => value !== "" && Number.isFinite(Number(value)),
    "Enter a valid starting value.",
  ),
  targetValue: z.string().refine(
    (value) => value === "" || Number.isFinite(Number(value)),
    "Enter a valid target value.",
  ),
  targetUnit: z.string().max(50),
  dueDate: z.string(),
  autoScore: z.boolean(),
}).superRefine((value, context) => {
  const target = value.targetValue === "" ? null : Number(value.targetValue);
  if ((value.autoScore || value.goalType === "OKR_KEY_RESULT") && target === null) {
    context.addIssue({
      code: "custom",
      path: ["targetValue"],
      message: "A measurable target is required.",
    });
  }
  if (target !== null && (!Number.isFinite(target) || target <= Number(value.startValue))) {
    context.addIssue({
      code: "custom",
      path: ["targetValue"],
      message: "Target must be greater than the starting value.",
    });
  }
  if (value.goalType === "OKR_KEY_RESULT" && !value.parentGoalUuid) {
    context.addIssue({
      code: "custom",
      path: ["parentGoalUuid"],
      message: "Select the objective this key result measures.",
    });
  }
});

const checkinSchema = z.object({
  currentValue: z.string().refine(
    (value) => value !== "" && Number.isFinite(Number(value)),
    "Enter a valid current value.",
  ),
  confidenceScore: z.string().refine(
    (value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 10,
    "Confidence must be from 1 to 10.",
  ),
  note: z.string().max(5000),
  blockers: z.string(),
});

const rejectSchema = z.object({
  reason: z.string().trim().min(5, "Explain what should be revised.").max(1000),
});

const revisionGoalSchema = z.object({
  title: z.string().trim().min(3, "Enter a goal title.").max(300),
  description: z.string().max(10000),
  weightagePct: z.string().refine(
    (value) => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 100,
    "Weight must be between 0 and 100.",
  ),
  startValue: z.string().refine(
    (value) => value !== "" && Number.isFinite(Number(value)),
    "Enter a valid starting value.",
  ),
  targetValue: z.string().refine(
    (value) => value === "" || Number.isFinite(Number(value)),
    "Enter a valid target value.",
  ),
  targetUnit: z.string().max(50),
  dueDate: z.string(),
  autoScore: z.boolean(),
  revisionNote: z.string().trim().min(5, "Explain what you changed.").max(1000),
}).superRefine((value, context) => {
  const target = value.targetValue === "" ? null : Number(value.targetValue);
  if (value.autoScore && target === null) {
    context.addIssue({
      code: "custom",
      path: ["targetValue"],
      message: "A measurable target is required for automatic scoring.",
    });
  }
  if (target !== null && (!Number.isFinite(target) || target <= Number(value.startValue))) {
    context.addIssue({
      code: "custom",
      path: ["targetValue"],
      message: "Target must be greater than the starting value.",
    });
  }
});

type CreateGoalValues = z.infer<typeof createGoalSchema>;
type CheckinValues = z.infer<typeof checkinSchema>;
type RejectValues = z.infer<typeof rejectSchema>;
type RevisionGoalValues = z.infer<typeof revisionGoalSchema>;

const inputClass =
  "h-11 rounded-xl border-gray-300 bg-white text-gray-900 focus-visible:border-brand-600 focus-visible:ring-brand-600/20";
const selectClass =
  "h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none transition-colors focus:border-brand-600 focus:ring-3 focus:ring-brand-600/20 sm:text-sm";

const healthStyles: Record<PerformProGoal["status"], string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700 ring-slate-200",
  ON_TRACK: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  AT_RISK: "bg-amber-50 text-amber-900 ring-amber-200",
  BEHIND: "bg-rose-50 text-rose-800 ring-rose-200",
  COMPLETED: "bg-sky-50 text-sky-800 ring-sky-200",
  CANCELLED: "bg-gray-100 text-gray-600 ring-gray-200",
};

const approvalStyles: Record<PerformProGoal["approval_status"], string> = {
  PENDING: "bg-amber-50 text-amber-900 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
};

function apiMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function humanize(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortId(value: string) {
  return `${value.slice(0, 8)}…`;
}

function participantLabel(participant: PerformProParticipant) {
  const organization = participant.organization;
  const nameKeys = ["employee_name", "full_name", "name"];
  const codeKeys = ["employee_code", "code"];
  const name = nameKeys.map((key) => organization[key]).find((value) => typeof value === "string" && value.trim());
  const code = codeKeys.map((key) => organization[key]).find((value) => typeof value === "string" && value.trim());

  return [name, code].filter(Boolean).join(" · ") || shortId(participant.employee_uuid);
}

function GoalBadge({
  value,
  styles,
}: {
  value: string;
  styles: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles}`}>
      {humanize(value)}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  detail: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-brand-950">{value}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{detail}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function OkrRollupPanel({ goal }: { goal: PerformProGoal }) {
  const rollup = goal.okr_rollup;
  if (!rollup) return null;

  const allocationComplete = rollup.configured_weight_pct >= 99.99;
  const includedComponents = rollup.components.filter((component) => component.included);

  return (
    <section
      aria-label={`${goal.title} weighted OKR roll-up`}
      className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-brand-100">
            <GitBranch aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-brand-950">Weighted key-result roll-up</h3>
            <p className="mt-0.5 text-xs leading-5 text-gray-600">
              Each result contributes its configured weight to the objective.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
            rollup.certified
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-white text-gray-700 ring-gray-200"
          }`}
        >
          {rollup.certified ? "Evidence recorded" : "Awaiting first check-in"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white p-2.5 ring-1 ring-gray-100">
          <dt className="text-[11px] font-medium text-gray-500">Roll-up</dt>
          <dd className="mt-1 text-sm font-bold text-brand-950">
            {rollup.progress_pct === null ? "—" : `${Math.round(rollup.progress_pct)}%`}
          </dd>
        </div>
        <div className="rounded-lg bg-white p-2.5 ring-1 ring-gray-100">
          <dt className="text-[11px] font-medium text-gray-500">Included</dt>
          <dd className="mt-1 text-sm font-bold text-brand-950">
            {rollup.included_key_result_count}/{rollup.key_result_count} KRs
          </dd>
        </div>
        <div className="rounded-lg bg-white p-2.5 ring-1 ring-gray-100">
          <dt className="text-[11px] font-medium text-gray-500">Allocation</dt>
          <dd className="mt-1 text-sm font-bold text-brand-950">
            {Math.round(rollup.configured_weight_pct)}%
          </dd>
        </div>
      </dl>

      {includedComponents.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Key-result weighted contributions">
          {includedComponents.map((component) => (
            <li key={component.goal_uuid} className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-100">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium text-gray-700">{component.title}</span>
                <span className="shrink-0 font-semibold text-brand-800">
                  {component.weightage_pct}% × {Math.round(component.progress_pct ?? 0)}% = {component.weighted_contribution_pct}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!allocationComplete && rollup.key_result_count > 0 && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-900">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {Math.round(100 - rollup.configured_weight_pct)}% remains unallocated and cannot contribute to objective progress.
        </p>
      )}
      {rollup.occurred_at && (
        <p className="mt-3 text-[11px] text-gray-500">
          Recalculated {formatDateTime(rollup.occurred_at)} · formula {rollup.formula_version}
          {rollup.component_hash && (
            <span title={rollup.component_hash}> · evidence {shortId(rollup.component_hash)}</span>
          )}
        </p>
      )}
    </section>
  );
}

function CreateGoalDialog({
  open,
  onOpenChange,
  cycle,
  participants,
  objectives,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: PerformProCycle;
  participants: PerformProParticipant[];
  objectives: PerformProGoal[];
  pending: boolean;
  onSubmit: (input: PerformProCreateGoalInput) => void;
}) {
  const form = useForm<CreateGoalValues>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      participantUuid: participants[0]?.uuid ?? "",
      parentGoalUuid: "",
      goalType: "KPI",
      cascadeLevel: "INDIVIDUAL",
      title: "",
      description: "",
      weightagePct: "20",
      startValue: "0",
      targetValue: "100",
      targetUnit: "%",
      dueDate: cycle.period_end,
      autoScore: false,
    },
  });
  const goalType = useWatch({ control: form.control, name: "goalType" });
  const selectedParticipantUuid = useWatch({ control: form.control, name: "participantUuid" });
  const participantObjectives = objectives.filter(
    (objective) => objective.participant_uuid === selectedParticipantUuid,
  );

  useEffect(() => {
    if (open && !form.getValues("participantUuid") && participants[0]) {
      form.setValue("participantUuid", participants[0].uuid);
    }
  }, [form, open, participants]);

  function submit(values: CreateGoalValues) {
    onSubmit({
      cycleUuid: cycle.uuid,
      participantUuid: values.participantUuid,
      parentGoalUuid: values.parentGoalUuid || null,
      goalType: values.goalType,
      cascadeLevel: values.cascadeLevel,
      title: values.title.trim(),
      description: values.description.trim() || null,
      weightagePct: Number(values.weightagePct),
      startValue: Number(values.startValue),
      targetValue: values.targetValue === "" ? null : Number(values.targetValue),
      targetUnit: values.targetUnit.trim() || null,
      dueDate: values.dueDate || null,
      autoScore: values.autoScore,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a goal or OKR</DialogTitle>
          <DialogDescription>
            Assign a measurable outcome in {cycle.name}. Employee-created goals enter manager approval.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={form.handleSubmit(submit)}>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="goal-participant">Goal owner</Label>
            <select id="goal-participant" className={selectClass} {...form.register("participantUuid")}>
              <option value="">Select a participant</option>
              {participants.map((participant) => (
                <option key={participant.uuid} value={participant.uuid}>
                  {participantLabel(participant)}
                </option>
              ))}
            </select>
            {form.formState.errors.participantUuid && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.participantUuid.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-type">Framework</Label>
            <select id="goal-type" className={selectClass} {...form.register("goalType")}>
              <option value="KPI">KPI</option>
              <option value="KRA">KRA</option>
              <option value="OKR_OBJECTIVE">OKR objective</option>
              <option value="OKR_KEY_RESULT">OKR key result</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-level">Cascade level</Label>
            <select id="goal-level" className={selectClass} {...form.register("cascadeLevel")}>
              <option value="INDIVIDUAL">Individual</option>
              <option value="TEAM">Team</option>
              <option value="DEPARTMENT">Department</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>
          {goalType === "OKR_KEY_RESULT" && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="goal-parent">Parent objective</Label>
              <select id="goal-parent" className={selectClass} {...form.register("parentGoalUuid")}>
                <option value="">Select an objective</option>
                {participantObjectives.map((objective) => (
                  <option key={objective.uuid} value={objective.uuid}>{objective.title}</option>
                ))}
              </select>
              {form.formState.errors.parentGoalUuid && (
                <p className="text-xs font-medium text-rose-700">{form.formState.errors.parentGoalUuid.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="goal-title">Title</Label>
            <Input id="goal-title" className={inputClass} placeholder="Increase first-response resolution" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="goal-description">Description</Label>
            <Textarea id="goal-description" rows={3} placeholder="Describe the intended outcome and how success will be evidenced." {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-weight">Weight</Label>
            <div className="relative">
              <Input id="goal-weight" type="number" min="0.01" max="100" step="0.01" className={`${inputClass} pr-10`} {...form.register("weightagePct")} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
            </div>
            {form.formState.errors.weightagePct && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.weightagePct.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-due">Due date</Label>
            <Input id="goal-due" type="date" min={cycle.period_start} max={cycle.period_end} className={inputClass} {...form.register("dueDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-start">Starting value</Label>
            <Input id="goal-start" type="number" step="any" className={inputClass} {...form.register("startValue")} />
            {form.formState.errors.startValue && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.startValue.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-target">Target value</Label>
            <Input id="goal-target" type="number" step="any" className={inputClass} {...form.register("targetValue")} />
            {form.formState.errors.targetValue && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.targetValue.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-unit">Unit</Label>
            <Input id="goal-unit" className={inputClass} placeholder="%, PKR, days, tickets…" {...form.register("targetUnit")} />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-600" {...form.register("autoScore")} />
            Auto-calculate score from progress
          </label>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
            <Button type="submit" disabled={pending} className="h-11 bg-brand-700 text-white hover:bg-brand-800">
              {pending ? "Creating…" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReviseGoalDialog({
  goal,
  cycle,
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  goal: PerformProGoal | null;
  cycle: PerformProCycle | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (input: PerformProReviseGoalInput) => void;
}) {
  const form = useForm<RevisionGoalValues>({
    resolver: zodResolver(revisionGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      weightagePct: "",
      startValue: "",
      targetValue: "",
      targetUnit: "",
      dueDate: "",
      autoScore: false,
      revisionNote: "",
    },
  });

  useEffect(() => {
    if (open && goal) {
      form.reset({
        title: goal.title,
        description: goal.description ?? "",
        weightagePct: String(goal.weightage_pct),
        startValue: String(goal.start_value),
        targetValue: goal.target_value === null ? "" : String(goal.target_value),
        targetUnit: goal.target_unit ?? "",
        dueDate: goal.due_date ?? "",
        autoScore: goal.auto_score,
        revisionNote: "",
      });
    }
  }, [form, goal, open]);

  function submit(values: RevisionGoalValues) {
    if (!goal) return;

    onSubmit({
      goal,
      title: values.title.trim(),
      description: values.description.trim() || null,
      weightagePct: Number(values.weightagePct),
      startValue: Number(values.startValue),
      targetValue: values.targetValue === "" ? null : Number(values.targetValue),
      targetUnit: values.targetUnit.trim() || null,
      dueDate: values.dueDate || null,
      autoScore: values.autoScore,
      revisionNote: values.revisionNote.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revise and resubmit goal</DialogTitle>
          <DialogDescription>
            Update the measurable content requested by the reviewer. Goal ownership, framework, hierarchy,
            and cascade level remain fixed.
          </DialogDescription>
        </DialogHeader>
        {goal && (
          <>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
              <p className="font-semibold">Reviewer requested</p>
              <p className="mt-1">{goal.rejection_reason}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-4">
              <div><p className="text-xs font-medium text-gray-500">Framework</p><p className="mt-1 font-semibold text-gray-900">{humanize(goal.goal_type)}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Level</p><p className="mt-1 font-semibold text-gray-900">{humanize(goal.cascade_level)}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Version</p><p className="mt-1 font-semibold text-gray-900">{goal.lock_version}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Status after submit</p><p className="mt-1 font-semibold text-amber-800">Pending</p></div>
            </div>
          </>
        )}
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={form.handleSubmit(submit)}>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="revision-goal-title">Title</Label>
            <Input id="revision-goal-title" className={inputClass} {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="revision-goal-description">Description</Label>
            <Textarea id="revision-goal-description" rows={3} {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revision-goal-weight">Weight</Label>
            <div className="relative">
              <Input id="revision-goal-weight" type="number" min="0.01" max="100" step="0.01" className={`${inputClass} pr-10`} {...form.register("weightagePct")} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
            </div>
            {form.formState.errors.weightagePct && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.weightagePct.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="revision-goal-due">Due date</Label>
            <Input id="revision-goal-due" type="date" min={cycle?.period_start} max={cycle?.period_end} className={inputClass} {...form.register("dueDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revision-goal-start">Starting value</Label>
            <Input id="revision-goal-start" type="number" step="any" className={inputClass} {...form.register("startValue")} />
            {form.formState.errors.startValue && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.startValue.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="revision-goal-target">Target value</Label>
            <Input id="revision-goal-target" type="number" step="any" className={inputClass} {...form.register("targetValue")} />
            {form.formState.errors.targetValue && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.targetValue.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="revision-goal-unit">Unit</Label>
            <Input id="revision-goal-unit" className={inputClass} {...form.register("targetUnit")} />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-600" {...form.register("autoScore")} />
            Auto-calculate score
          </label>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="revision-goal-note">Response to reviewer</Label>
            <Textarea
              id="revision-goal-note"
              rows={3}
              placeholder="Summarize what changed and how the reviewer’s request was addressed."
              {...form.register("revisionNote")}
            />
            {form.formState.errors.revisionNote && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.revisionNote.message}</p>
            )}
            <p className="text-xs leading-5 text-gray-500">
              This response and the before/after goal snapshots are retained as immutable evidence.
            </p>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending} className="h-11">
              Keep rejected
            </Button>
            <Button type="submit" disabled={pending} className="h-11 bg-brand-700 text-white hover:bg-brand-800">
              <PencilLine aria-hidden="true" />
              {pending ? "Resubmitting…" : "Save and resubmit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CheckinDialog({
  goal,
  open,
  onOpenChange,
  canRecord,
  pending,
  history,
  historyLoading,
  historyError,
  onRetryHistory,
  onSubmit,
}: {
  goal: PerformProGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canRecord: boolean;
  pending: boolean;
  history: PerformProGoalCheckin[];
  historyLoading: boolean;
  historyError: string | null;
  onRetryHistory: () => void;
  onSubmit: (values: CheckinValues) => void;
}) {
  const form = useForm<CheckinValues>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      currentValue: "0",
      confidenceScore: "7",
      note: "",
      blockers: "",
    },
  });

  useEffect(() => {
    if (!open || !goal) return;

    form.reset({
      currentValue: String(goal.current_value),
      confidenceScore: String(goal.confidence_score ?? 7),
      note: "",
      blockers: "",
    });
  }, [form, goal, open]);

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{canRecord ? "Progress check-in" : "Progress history"}</DialogTitle>
          <DialogDescription>
            {canRecord ? `Record evidence and update “${goal.title}”.` : goal.title}
          </DialogDescription>
        </DialogHeader>
        {canRecord && (
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="checkin-current">Current value</Label>
              <Input id="checkin-current" type="number" step="any" className={inputClass} {...form.register("currentValue")} />
              <p className="text-xs text-gray-500">
                Target: {goal.target_value ?? "not set"} {goal.target_unit ?? ""}
              </p>
              {form.formState.errors.currentValue && (
                <p className="text-xs font-medium text-rose-700">{form.formState.errors.currentValue.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkin-confidence">Confidence (1–10)</Label>
              <Input id="checkin-confidence" type="number" min="1" max="10" className={inputClass} {...form.register("confidenceScore")} />
              {form.formState.errors.confidenceScore && (
                <p className="text-xs font-medium text-rose-700">{form.formState.errors.confidenceScore.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="checkin-note">Update</Label>
              <Textarea id="checkin-note" rows={3} placeholder="What changed since the last check-in?" {...form.register("note")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="checkin-blockers">Blockers</Label>
              <Textarea id="checkin-blockers" rows={2} placeholder="One blocker per line. Leave blank when there are none." {...form.register("blockers")} />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
              <Button type="submit" disabled={pending} className="h-11 bg-brand-700 text-white hover:bg-brand-800">
                {pending ? "Recording…" : "Record check-in"}
              </Button>
            </DialogFooter>
          </form>
        )}
        <section className="border-t border-gray-200 pt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Clock3 aria-hidden="true" className="h-4 w-4 text-brand-700" /> Check-in history
          </h3>
          {historyError ? (
            <div role="alert" className="mt-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
              <p>{historyError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetryHistory}
                className="mt-3 h-11 border-rose-200 bg-white text-rose-800 hover:bg-rose-100"
              >
                Try again
              </Button>
            </div>
          ) : historyLoading ? (
            <p className="mt-3 text-sm text-gray-500">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">No check-ins have been recorded yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {history.map((item) => (
                <li key={item.uuid} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <GoalBadge value={item.health_status} styles={healthStyles[item.health_status]} />
                    <time className="text-xs text-gray-500">{formatDateTime(item.occurred_at)}</time>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {item.previous_value} → {item.current_value} {goal.target_unit ?? ""}
                    {item.progress_pct !== null && ` · ${Math.round(item.progress_pct)}% complete`}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Plan expected {Math.round(item.expected_progress_pct ?? 0)}%
                    {" · "}Confidence {item.confidence_score ?? "—"}/10
                  </p>
                  {item.note && <p className="mt-2 text-sm leading-6 text-gray-600">{item.note}</p>}
                  {item.blockers.length > 0 && (
                    <p className="mt-2 text-xs font-medium text-rose-700">Blockers: {item.blockers.join(" · ")}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  goal,
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  goal: PerformProGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (reason: string) => void;
}) {
  const form = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "" });
  }, [form, goal, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Return goal for revision</DialogTitle>
          <DialogDescription>
            {goal ? `Explain what needs to change in “${goal.title}”.` : "Add a clear revision reason."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => onSubmit(values.reason))}>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Reason</Label>
            <Textarea id="rejection-reason" rows={4} placeholder="The target needs a measurable baseline and evidence source…" {...form.register("reason")} />
            {form.formState.errors.reason && (
              <p className="text-xs font-medium text-rose-700">{form.formState.errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
            <Button type="submit" variant="destructive" disabled={pending} className="h-11">
              {pending ? "Rejecting…" : "Reject goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({
  goal,
  owner,
  canApprove,
  canCheckin,
  canViewCheckins,
  canReviseInCycle,
  pendingAction,
  onApprove,
  onReject,
  onCheckin,
  onRevise,
}: {
  goal: PerformProGoal;
  owner: string;
  canApprove: boolean;
  canCheckin: boolean;
  canViewCheckins: boolean;
  canReviseInCycle: boolean;
  pendingAction: boolean;
  onApprove: (goal: PerformProGoal) => void;
  onReject: (goal: PerformProGoal) => void;
  onCheckin: (goal: PerformProGoal) => void;
  onRevise: (goal: PerformProGoal) => void;
}) {
  const progress = goal.progress_pct;
  const derivedObjective = goal.goal_type === "OKR_OBJECTIVE" && goal.key_results.length > 0;
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <GoalBadge value={goal.goal_type} styles="bg-brand-50 text-brand-800 ring-brand-200" />
        <GoalBadge value={goal.approval_status} styles={approvalStyles[goal.approval_status]} />
        <GoalBadge value={goal.status} styles={healthStyles[goal.status]} />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold leading-7 text-brand-950">{goal.title}</h2>
          <p className="mt-1 text-xs font-medium text-gray-500">{owner} · {humanize(goal.cascade_level)}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {goal.weightage_pct}% weight
        </span>
      </div>
      {goal.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{goal.description}</p>}
      <div className="mt-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500">
              {derivedObjective ? "Weighted progress" : "Progress"}
            </p>
            <p className="mt-1 text-2xl font-bold text-brand-950">
              {progress === null ? "—" : `${Math.round(progress)}%`}
            </p>
          </div>
          <p className="text-right text-xs leading-5 text-gray-500">
            {derivedObjective && goal.okr_rollup
              ? `${goal.okr_rollup.included_key_result_count}/${goal.okr_rollup.key_result_count} approved key results`
              : `${goal.current_value} of ${goal.target_value ?? "—"} ${goal.target_unit ?? ""}`}
          </p>
        </div>
        <Progress
          aria-label={`${goal.title} progress`}
          value={Math.min(100, progress ?? 0)}
          className={`mt-3 ${goal.status === "BEHIND" ? "[&_[data-slot=progress-indicator]]:bg-rose-600" : goal.status === "AT_RISK" ? "[&_[data-slot=progress-indicator]]:bg-amber-500" : "[&_[data-slot=progress-indicator]]:bg-brand-700"}`}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-3.5 w-3.5" /> {formatDate(goal.due_date)}</span>
          <span>
            {derivedObjective ? "Weighted confidence" : "Confidence"} {goal.confidence_score ?? "—"}/10
          </span>
        </div>
      </div>
      {derivedObjective && <OkrRollupPanel goal={goal} />}
      {goal.approval_status === "REJECTED" && goal.rejection_reason && (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-800">
          <span className="font-semibold">Revision requested:</span> {goal.rejection_reason}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        {canReviseInCycle && goal.can_revise && goal.approval_status === "REJECTED" && (
          <Button size="sm" disabled={pendingAction} onClick={() => onRevise(goal)} className="h-11 bg-brand-700 text-white hover:bg-brand-800">
            <PencilLine aria-hidden="true" /> Revise and resubmit
          </Button>
        )}
        {canApprove && goal.approval_status === "PENDING" && (
          <>
            <Button size="sm" disabled={pendingAction} onClick={() => onApprove(goal)} className="h-11 bg-emerald-700 text-white hover:bg-emerald-800">
              <Check aria-hidden="true" /> Approve
            </Button>
            <Button size="sm" variant="outline" disabled={pendingAction} onClick={() => onReject(goal)} className="h-11 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800">
              <XCircle aria-hidden="true" /> Reject
            </Button>
          </>
        )}
        {canViewCheckins && goal.approval_status === "APPROVED" && !derivedObjective && (
          <Button size="sm" variant="outline" onClick={() => onCheckin(goal)} className="h-11 border-brand-200 text-brand-800 hover:bg-brand-50">
            <TrendingUp aria-hidden="true" /> {canCheckin && !["COMPLETED", "CANCELLED"].includes(goal.status) ? "Check in" : "View check-ins"}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {body}
      {goal.key_results.length > 0 && (
        <div className="mt-5 border-t border-gray-200 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Key results</h3>
          <div className="mt-3 space-y-3">
            {goal.key_results.map((keyResult) => (
              <GoalCard
                key={keyResult.uuid}
                goal={keyResult}
                owner={owner}
                canApprove={canApprove}
                canCheckin={canCheckin}
                canViewCheckins={canViewCheckins}
                canReviseInCycle={canReviseInCycle}
                pendingAction={pendingAction}
                onApprove={onApprove}
                onReject={onReject}
                onCheckin={onCheckin}
                onRevise={onRevise}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function PerformProGoalsPage() {
  const queryClient = useQueryClient();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canCreate = permissions.some((permission) =>
    ["performpro.goal.manage-own", "performpro.goal.approve", "performpro.goal.admin"].includes(permission),
  );
  const canApprove = permissions.some((permission) =>
    ["performpro.goal.approve", "performpro.goal.admin"].includes(permission),
  );
  const canCheckin = permissions.some((permission) =>
    ["performpro.checkin.manage-own", "performpro.checkin.admin"].includes(permission),
  );
  const canViewCheckins = canCheckin || permissions.includes("performpro.checkin.view-team");
  const [selectedCycleUuid, setSelectedCycleUuid] = useState("");
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"ALL" | PerformProGoal["approval_status"]>("ALL");
  const [healthFilter, setHealthFilter] = useState<"ALL" | PerformProGoal["status"]>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [checkinGoal, setCheckinGoal] = useState<PerformProGoal | null>(null);
  const [rejectGoal, setRejectGoal] = useState<PerformProGoal | null>(null);
  const [revisionGoal, setRevisionGoal] = useState<PerformProGoal | null>(null);

  const cyclesQuery = useQuery({
    queryKey: ["perform-pro", "cycles"],
    queryFn: () => performProService.cycles(),
  });
  const cycles = cyclesQuery.data ?? [];
  const selectedCycle = cycles.find((cycle) => cycle.uuid === selectedCycleUuid)
    ?? cycles.find((cycle) => cycle.state === "ACTIVE")
    ?? cycles[0];

  const goalsQuery = useQuery({
    queryKey: ["perform-pro", "goals", selectedCycle?.uuid],
    queryFn: () => performProService.goals(selectedCycle!.uuid),
    enabled: Boolean(selectedCycle),
  });
  const participantsQuery = useQuery({
    queryKey: ["perform-pro", "participants", selectedCycle?.uuid],
    queryFn: () => performProService.participants(selectedCycle!.uuid, "ENROLLED"),
    enabled: Boolean(selectedCycle),
  });
  const checkinsQuery = useQuery({
    queryKey: ["perform-pro", "goal-checkins", checkinGoal?.uuid],
    queryFn: () => performProService.goalCheckins(checkinGoal!.uuid),
    enabled: Boolean(checkinGoal),
  });

  const invalidateGoals = async () => {
    await queryClient.invalidateQueries({ queryKey: ["perform-pro", "goals", selectedCycle?.uuid] });
  };
  const createMutation = useMutation({
    mutationFn: performProService.createGoal,
    onSuccess: async (goal) => {
      toast.success(goal.approval_status === "PENDING" ? "Goal submitted for approval." : "Goal created.");
      setShowCreate(false);
      await invalidateGoals();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The goal could not be created.") }),
  });
  const approveMutation = useMutation({
    mutationFn: performProService.approveGoal,
    onSuccess: async () => {
      toast.success("Goal approved.");
      await invalidateGoals();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The goal could not be approved.") }),
  });
  const rejectMutation = useMutation({
    mutationFn: ({ goal, reason }: { goal: PerformProGoal; reason: string }) =>
      performProService.rejectGoal(goal, reason),
    onSuccess: async () => {
      toast.success("Goal returned for revision.");
      setRejectGoal(null);
      await invalidateGoals();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The goal could not be rejected.") }),
  });
  const revisionMutation = useMutation({
    mutationFn: performProService.reviseGoal,
    onSuccess: async () => {
      toast.success("Goal revised and resubmitted for approval.");
      setRevisionGoal(null);
      await invalidateGoals();
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The goal revision could not be submitted.") }),
  });
  const checkinMutation = useMutation({
    mutationFn: ({ goal, values }: { goal: PerformProGoal; values: CheckinValues }) =>
      performProService.checkinGoal({
        goal,
        currentValue: Number(values.currentValue),
        confidenceScore: Number(values.confidenceScore),
        note: values.note.trim() || null,
        blockers: values.blockers.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      }),
    onSuccess: async () => {
      toast.success("Progress check-in recorded.");
      await Promise.all([
        invalidateGoals(),
        queryClient.invalidateQueries({ queryKey: ["perform-pro", "goal-checkins", checkinGoal?.uuid] }),
      ]);
      setCheckinGoal(null);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The check-in could not be recorded.") }),
  });

  const participantItems = participantsQuery.data?.items;
  const participants = useMemo(() => participantItems ?? [], [participantItems]);
  const participantNames = useMemo(
    () => new Map(participants.map((participant) => [participant.employee_uuid, participantLabel(participant)])),
    [participants],
  );
  const allGoals = useMemo(
    () => (goalsQuery.data ?? []).flatMap((goal) => [goal, ...goal.key_results]),
    [goalsQuery.data],
  );
  const metrics = useMemo(() => {
    const portfolioGoals = goalsQuery.data ?? [];
    const measurable = portfolioGoals.filter(
      (goal) => goal.approval_status === "APPROVED" && goal.progress_pct !== null,
    );
    const average = measurable.length === 0
      ? 0
      : Math.round(measurable.reduce((total, goal) => total + (goal.progress_pct ?? 0), 0) / measurable.length);
    return {
      total: allGoals.length,
      average,
      pending: allGoals.filter((goal) => goal.approval_status === "PENDING").length,
      certifiedRollups: portfolioGoals.filter((goal) => goal.okr_rollup?.certified).length,
      attention: allGoals.filter(
        (goal) => goal.approval_status === "APPROVED" && ["AT_RISK", "BEHIND"].includes(goal.status),
      ).length,
    };
  }, [allGoals, goalsQuery.data]);
  const filteredGoals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (goalsQuery.data ?? []).filter((goal) => {
      const family = [goal, ...goal.key_results];
      return family.some((item) => {
        const matchesSearch = !normalizedSearch
          || item.title.toLowerCase().includes(normalizedSearch)
          || item.description?.toLowerCase().includes(normalizedSearch)
          || item.employee_uuid.toLowerCase().includes(normalizedSearch);
        const matchesApproval = approvalFilter === "ALL" || item.approval_status === approvalFilter;
        const matchesHealth = healthFilter === "ALL" || item.status === healthFilter;
        return matchesSearch && matchesApproval && matchesHealth;
      });
    });
  }, [approvalFilter, goalsQuery.data, healthFilter, search]);
  const objectives = allGoals.filter((goal) => goal.goal_type === "OKR_OBJECTIVE");
  const isBusy = approveMutation.isPending || rejectMutation.isPending || revisionMutation.isPending;
  const mayCreateInCycle = selectedCycle?.state === "ACTIVE" && selectedCycle.active_phase === "GOAL_SETTING";
  const mayRecordCheckins = selectedCycle?.state === "ACTIVE" && selectedCycle.active_phase === "CHECK_INS";

  return (
    <main className="min-h-screen bg-gray-50/70 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-brand-200 bg-gradient-to-br from-white via-white to-brand-50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <Target aria-hidden="true" className="h-4 w-4" /> PerformPro · Goals & OKRs
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                Turn priorities into measurable progress
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                Create aligned goals, review employee submissions, and keep progress health visible through evidence-based check-ins.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void Promise.all([cyclesQuery.refetch(), goalsQuery.refetch()])}
                disabled={cyclesQuery.isFetching || goalsQuery.isFetching}
                className="h-11 rounded-xl border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
              >
                <RefreshCw aria-hidden="true" className={goalsQuery.isFetching ? "animate-spin motion-reduce:animate-none" : ""} /> Refresh
              </Button>
              {canCreate && (
                <Button
                  onClick={() => setShowCreate(true)}
                  disabled={!mayCreateInCycle || participants.length === 0}
                  title={!mayCreateInCycle ? "Goals can be created during an active goal-setting phase." : undefined}
                  className="h-11 rounded-xl bg-brand-700 px-5 text-white hover:bg-brand-800"
                >
                  <Plus aria-hidden="true" /> New goal
                </Button>
              )}
            </div>
          </div>
        </header>

        <section aria-label="Goal health summary" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Target} label="Goals in scope" value={metrics.total} detail="Objectives, key results, KPIs and KRAs" tone="bg-brand-50 text-brand-700" />
          <MetricCard icon={TrendingUp} label="Portfolio progress" value={`${metrics.average}%`} detail="Top-level goals, with each OKR counted once" tone="bg-sky-50 text-sky-700" />
          <MetricCard icon={ClipboardCheck} label="Awaiting approval" value={metrics.pending} detail="Manager decisions still required" tone="bg-amber-50 text-amber-700" />
          <MetricCard icon={AlertTriangle} label="Needs attention" value={metrics.attention} detail={`${metrics.certifiedRollups} certified roll-ups · at-risk or behind plan`} tone="bg-rose-50 text-rose-700" />
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(260px,1.4fr)_180px_180px]">
            <div className="relative">
              <Label htmlFor="cycle-filter" className="sr-only">Performance cycle</Label>
              <select
                id="cycle-filter"
                value={selectedCycle?.uuid ?? ""}
                onChange={(event) => setSelectedCycleUuid(event.target.value)}
                className={`${selectClass} appearance-none pr-9`}
              >
                {cycles.map((cycle) => <option key={cycle.uuid} value={cycle.uuid}>{cycle.name} · {humanize(cycle.state)}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-gray-500" />
            </div>
            <div className="relative">
              <Label htmlFor="goal-search" className="sr-only">Search goals</Label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <Input id="goal-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search goals, owners or outcomes…" className={`${inputClass} pl-9`} />
            </div>
            <div>
              <Label htmlFor="approval-filter" className="sr-only">Approval status</Label>
              <select id="approval-filter" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value as typeof approvalFilter)} className={selectClass}>
                <option value="ALL">All approvals</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <Label htmlFor="health-filter" className="sr-only">Progress health</Label>
              <select id="health-filter" value={healthFilter} onChange={(event) => setHealthFilter(event.target.value as typeof healthFilter)} className={selectClass}>
                <option value="ALL">All health</option>
                <option value="NOT_STARTED">Not started</option>
                <option value="ON_TRACK">On track</option>
                <option value="AT_RISK">At risk</option>
                <option value="BEHIND">Behind</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
          {selectedCycle && selectedCycle.active_phase !== "CHECK_INS" && (
            <p className="mt-3 text-xs leading-5 text-gray-600">
              Check-in history remains available. New progress updates open during the cycle’s check-in phase.
            </p>
          )}
        </section>

        {cyclesQuery.isLoading || goalsQuery.isLoading ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Loading goals">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white motion-reduce:animate-none" />)}
          </section>
        ) : cyclesQuery.isError || goalsQuery.isError ? (
          <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle aria-hidden="true" className="h-5 w-5" /> Goals could not be loaded</h2>
            <p className="mt-2 text-sm">{apiMessage(goalsQuery.error ?? cyclesQuery.error, "Refresh the page or try another cycle.")}</p>
          </section>
        ) : !selectedCycle ? (
          <section className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <CircleDashed aria-hidden="true" className="mx-auto h-9 w-9 text-gray-400" />
            <h2 className="mt-3 font-semibold text-gray-900">No performance cycle is available</h2>
            <p className="mt-1 text-sm text-gray-500">Create and publish a cycle before assigning goals.</p>
          </section>
        ) : filteredGoals.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Target aria-hidden="true" className="mx-auto h-9 w-9 text-brand-400" />
            <h2 className="mt-3 font-semibold text-gray-900">{allGoals.length === 0 ? "No goals yet" : "No goals match these filters"}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {allGoals.length === 0 ? "Start with a KPI, KRA or OKR objective during goal setting." : "Clear a filter or search for another outcome."}
            </p>
          </section>
        ) : (
          <section aria-label="Goals and objectives" className="mt-6 grid items-start gap-5 lg:grid-cols-2">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.uuid}
                goal={goal}
                owner={participantNames.get(goal.employee_uuid) ?? shortId(goal.employee_uuid)}
                canApprove={canApprove}
                canCheckin={canCheckin && mayRecordCheckins}
                canViewCheckins={canViewCheckins}
                canReviseInCycle={mayCreateInCycle}
                pendingAction={isBusy}
                onApprove={(item) => approveMutation.mutate(item)}
                onReject={setRejectGoal}
                onCheckin={setCheckinGoal}
                onRevise={setRevisionGoal}
              />
            ))}
          </section>
        )}

        {selectedCycle && (
          <CreateGoalDialog
            open={showCreate}
            onOpenChange={setShowCreate}
            cycle={selectedCycle}
            participants={participants}
            objectives={objectives}
            pending={createMutation.isPending}
            onSubmit={(input) => createMutation.mutate(input)}
          />
        )}
        <CheckinDialog
          goal={checkinGoal}
          open={Boolean(checkinGoal)}
          onOpenChange={(open) => { if (!open) setCheckinGoal(null); }}
          canRecord={canCheckin
            && mayRecordCheckins
            && !["COMPLETED", "CANCELLED"].includes(checkinGoal?.status ?? "CANCELLED")}
          pending={checkinMutation.isPending}
          history={checkinsQuery.data ?? []}
          historyLoading={checkinsQuery.isLoading}
          historyError={checkinsQuery.isError
            ? apiMessage(checkinsQuery.error, "Check-in history could not be loaded.")
            : null}
          onRetryHistory={() => { void checkinsQuery.refetch(); }}
          onSubmit={(values) => { if (checkinGoal) checkinMutation.mutate({ goal: checkinGoal, values }); }}
        />
        <RejectDialog
          goal={rejectGoal}
          open={Boolean(rejectGoal)}
          onOpenChange={(open) => { if (!open) setRejectGoal(null); }}
          pending={rejectMutation.isPending}
          onSubmit={(reason) => { if (rejectGoal) rejectMutation.mutate({ goal: rejectGoal, reason }); }}
        />
        <ReviseGoalDialog
          goal={revisionGoal}
          cycle={selectedCycle}
          open={Boolean(revisionGoal)}
          onOpenChange={(open) => { if (!open) setRevisionGoal(null); }}
          pending={revisionMutation.isPending}
          onSubmit={(input) => revisionMutation.mutate(input)}
        />
      </div>
    </main>
  );
}
