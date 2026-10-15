"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Controller,
  FieldPath,
  SubmitErrorHandler,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Building2,
  CalendarDays,
  Moon,
  Timer,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useBranches } from "@/hooks/useBranches";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployeeTypes } from "@/hooks/useEmployeeTypes";
import {
  useAttendancePolicy,
  useSaveAttendancePolicy,
} from "@/hooks/useAttendancePolicies";
import SearchableSelect from "@/components/ui/searchable-select";
import type { Option } from "@/components/ui/searchable-select";
import { get } from "react-hook-form";

// ─── Validation ───────────────────────────────────────────────────────────────

const textOnlyRegex = /^[A-Za-z\s'-]+$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const wholeNumberField = (
  label: string,
  min: number,
  max: number,
  intMessage = "Only whole numbers are allowed"
) =>
  z.coerce
    .number({ error: `${label} must be a valid number` })
    .int(intMessage)
    .min(min, `Minimum value is ${min}`)
    .max(max, `Maximum value is ${max}`);

const decimalNumberField = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} must be a valid number` })
    .min(min, `Minimum value is ${min}`)
    .max(max, `Maximum value is ${max}`);

const timeField = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(timeRegex, "Enter a valid time in HH:mm format");

const policySchema = z.object({
  policy_name: z.string().trim().min(1, "Policy name is required").max(100, "Policy name cannot be more than 100 characters").regex(textOnlyRegex, "Only letters, spaces, hyphen, and apostrophe are allowed"),
  branch_ids: z.array(z.string()).min(1, "Select at least one branch"),
  department_ids: z.array(z.string()).min(1, "Select at least one department"),
  employment_types: z.array(z.string()).min(1, "Select at least one employee type"),
  grace_in_minutes: wholeNumberField("Grace in minutes", 0, 720, "Only whole minutes are allowed"),
  grace_out_minutes: wholeNumberField("Grace out minutes", 0, 720, "Only whole minutes are allowed"),
  half_day_threshold_minutes: wholeNumberField("Half day threshold minutes", 0, 1440, "Only whole minutes are allowed"),
  absent_threshold_minutes: wholeNumberField("Absent threshold minutes", 0, 1440, "Only whole minutes are allowed"),
  short_leave_threshold_minutes: wholeNumberField("Short leave threshold minutes", 0, 720, "Only whole minutes are allowed"),
  late_marks_for_half_day: wholeNumberField("Late marks for half day", 0, 31),
  late_marks_for_absent: wholeNumberField("Late marks for absent", 0, 31),
  max_short_leaves_per_month: wholeNumberField("Max short leaves per month", 0, 31),
  auto_absent_on_no_punch: z.boolean(),
  auto_absent_cutoff_time: timeField("Auto absent cutoff time"),
  ot_calculation_method: z.enum(["actual", "rounded_15", "rounded_30", "rounded_60"]).default("actual"),
  min_ot_minutes: wholeNumberField("Min OT minutes", 0, 1440, "Only whole minutes are allowed"),
  ot_rate_weekday: decimalNumberField("OT rate weekday", 0, 9.99),
  ot_rate_weekend: decimalNumberField("OT rate weekend", 0, 9.99),
  night_window_start: timeField("Night window start").default("22:00"),
  night_window_end: timeField("Night window end").default("06:00"),
  night_premium_rate: decimalNumberField("Night premium rate", 0, 9.99),
  comp_off_eligible_on: z.array(z.enum(["holiday", "weekly_off"])),
  comp_off_min_hours: decimalNumberField("Comp-off min hours", 0, 24),
  comp_off_expiry_days: wholeNumberField("Comp-off expiry days", 0, 3650, "Only whole days are allowed"),
  regularization_max_days_back: wholeNumberField("Regularization max days back", 0, 365, "Only whole days are allowed"),
  regularization_max_per_month: wholeNumberField("Regularization max per month", 0, 31),
  is_default: z.boolean(),
  effective_from: z.string().min(1, "Effective from date is required"),
  effective_to: z.string().nullable().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof policySchema>;

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    title: "Policy Identity",
    description: "Name & effective dates",
    icon: ShieldCheck,
    fields: ["policy_name", "effective_from", "effective_to", "is_default", "is_active"] as FieldPath<FormValues>[],
  },
  {
    id: 2,
    title: "Applicability",
    description: "Branches, departments & types",
    icon: Building2,
    fields: ["branch_ids", "department_ids", "employment_types"] as FieldPath<FormValues>[],
  },
  {
    id: 3,
    title: "Grace & Thresholds",
    description: "Attendance rules & late marks",
    icon: Clock,
    fields: [
      "grace_in_minutes", "grace_out_minutes", "half_day_threshold_minutes",
      "absent_threshold_minutes", "short_leave_threshold_minutes",
      "late_marks_for_half_day", "late_marks_for_absent",
      "max_short_leaves_per_month", "auto_absent_on_no_punch", "auto_absent_cutoff_time",
    ] as FieldPath<FormValues>[],
  },
  {
    id: 4,
    title: "Overtime",
    description: "OT method & rates",
    icon: Timer,
    fields: ["ot_calculation_method", "min_ot_minutes", "ot_rate_weekday", "ot_rate_weekend"] as FieldPath<FormValues>[],
  },
  {
    id: 5,
    title: "Night Shift",
    description: "Night window & premium",
    icon: Moon,
    fields: ["night_window_start", "night_window_end", "night_premium_rate"] as FieldPath<FormValues>[],
  },
  {
    id: 6,
    title: "Comp-Off & Regularization",
    description: "Compensatory leave rules",
    icon: CalendarDays,
    fields: [
      "comp_off_eligible_on", "comp_off_min_hours", "comp_off_expiry_days",
      "regularization_max_days_back", "regularization_max_per_month",
    ] as FieldPath<FormValues>[],
  },
] as const;

const OT_METHODS = [
  { value: "actual", label: "Actual" },
  { value: "rounded_15", label: "Round 15 min" },
  { value: "rounded_30", label: "Round 30 min" },
  { value: "rounded_60", label: "Round 60 min" },
] as const;

const COMP_OFF_OPTIONS = [
  { value: "holiday", label: "Holiday" },
  { value: "weekly_off", label: "Weekly Off" },
] as const;

// ─── Atoms ────────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500 font-medium">{message}</p>;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function FormInput({
  suffix,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  return (
    <div className="relative">
      <Input
        {...props}
        className={`h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-brand-900 focus:ring-2 focus:ring-brand-900/10 ${suffix ? "pr-14" : ""}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
        checked
          ? "bg-brand-900 text-white border-brand-900 shadow-sm"
          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full transition-colors ${
          checked ? "bg-white/70" : "bg-slate-300"
        }`}
      />
      {label}
    </button>
  );
}

function getApiValidationErrors(error: unknown): Record<string, string[]> {
  const err = error as any;
  return err?.response?.data?.errors ?? err?.data?.errors ?? {};
}

function getApiMessage(error: unknown): string | undefined {
  const err = error as any;
  return err?.response?.data?.message ?? err?.data?.message ?? err?.message ?? undefined;
}

function onlyTextKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  const ctrl = ["Backspace", "Delete", "Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
  if (ctrl.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (!/^[A-Za-z\s'-]$/.test(e.key)) e.preventDefault();
}

function sanitizeTextOnly(v: string) {
  return v.replace(/[^A-Za-z\s'-]/g, "");
}

// ─── Stepper UI ───────────────────────────────────────────────────────────────

function StepperHeader({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: Set<number>;
}) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Desktop stepper */}
        <div className="hidden md:flex items-start relative">
          {/* Background connector */}
          <div className="absolute top-5 left-0 right-0 h-px bg-slate-200 z-0 mx-10" />

          {STEPS.map((step) => {
            const isDone = completedSteps.has(step.id);
            const isActive = currentStep === step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2.5 flex-1">
                {/* Circle */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    isDone
                      ? "bg-brand-900 border-brand-900 text-white"
                      : isActive
                      ? "bg-white border-brand-900 text-brand-900"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" />}
                </div>
                {/* Label */}
                <div className="text-center px-1">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      isActive ? "text-brand-900" : isDone ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: just show current step info + progress bar */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = STEPS[currentStep - 1].icon;
              return (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-white shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
              );
            })()}
            <div>
              <p className="text-sm font-semibold text-slate-800">{STEPS[currentStep - 1].title}</p>
              <p className="text-xs text-slate-400">{STEPS[currentStep - 1].description}</p>
            </div>
            <span className="ml-auto text-xs font-medium text-slate-400">
              {currentStep} / {STEPS.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-900 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step content panels ──────────────────────────────────────────────────────

function Step1({ form, fieldMessage }: any) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Policy Name</FieldLabel>
        <FormInput
          {...form.register("policy_name")}
          onKeyDown={onlyTextKeyDown}
          onPaste={(e: any) => {
            e.preventDefault();
            form.setValue("policy_name", sanitizeTextOnly(e.clipboardData.getData("text")), {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          placeholder="e.g. Standard Office Policy"
        />
        <FieldError message={fieldMessage("policy_name")} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Effective From</FieldLabel>
          <Input
            type="date"
            {...form.register("effective_from")}
            className="h-10 w-full rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:border-brand-900 focus:ring-2 focus:ring-brand-900/10 transition-all"
          />
          <FieldError message={fieldMessage("effective_from")} />
        </div>
        <div>
          <FieldLabel>
            Effective To{" "}
            <span className="text-xs font-normal text-slate-400">(optional)</span>
          </FieldLabel>
          <Input
            type="date"
            {...form.register("effective_to")}
            className="h-10 w-full rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:border-brand-900 focus:ring-2 focus:ring-brand-900/10 transition-all"
          />
          <FieldError message={fieldMessage("effective_to")} />
        </div>
      </div>

      <div>
        <FieldLabel>Policy Flags</FieldLabel>
        <div className="flex flex-wrap gap-3">
          <Controller
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <Toggle checked={field.value} onChange={field.onChange} label="Set as Default Policy" />
            )}
          />
          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <Toggle checked={field.value} onChange={field.onChange} label="Active" />
            )}
          />
        </div>
      </div>
    </div>
  );
}

function Step2({ form, fieldMessage, branchOptions, departmentOptions, employeeTypeOptions, isLoadingBranches, isLoadingDepts, isLoadingEmpTypes }: any) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Branches</FieldLabel>
        <Controller
          control={form.control}
          name="branch_ids"
          render={({ field }) => (
            <SearchableSelect
              options={branchOptions}
              value={field.value}
              onChange={field.onChange}
              multiple
              disabled={isLoadingBranches}
              placeholder="Select branches"
              widthClass="w-full"
            />
          )}
        />
        <FieldError message={fieldMessage("branch_ids")} />
      </div>
      <div>
        <FieldLabel required>Departments</FieldLabel>
        <Controller
          control={form.control}
          name="department_ids"
          render={({ field }) => (
            <SearchableSelect
              options={departmentOptions}
              value={field.value}
              onChange={field.onChange}
              multiple
              disabled={isLoadingDepts}
              placeholder="Select departments"
              widthClass="w-full"
            />
          )}
        />
        <FieldError message={fieldMessage("department_ids")} />
      </div>
      <div>
        <FieldLabel required>Employee Types</FieldLabel>
        <Controller
          control={form.control}
          name="employment_types"
          render={({ field }) => (
            <SearchableSelect
              options={employeeTypeOptions}
              value={field.value}
              onChange={field.onChange}
              multiple
              disabled={isLoadingEmpTypes}
              placeholder="Select employee types"
              widthClass="w-full"
            />
          )}
        />
        <FieldError message={fieldMessage("employment_types")} />
      </div>
    </div>
  );
}

function Step3({ form, fieldMessage }: any) {
  const fields = [
    { name: "grace_in_minutes", label: "Grace In", suffix: "min", min: 0, max: 720 },
    { name: "grace_out_minutes", label: "Grace Out", suffix: "min", min: 0, max: 720 },
    { name: "half_day_threshold_minutes", label: "Half Day Threshold", suffix: "min", min: 0, max: 1440 },
    { name: "absent_threshold_minutes", label: "Absent Threshold", suffix: "min", min: 0, max: 1440 },
    { name: "short_leave_threshold_minutes", label: "Short Leave Threshold", suffix: "min", min: 0, max: 720 },
    { name: "late_marks_for_half_day", label: "Late Marks → Half Day", suffix: "marks", min: 0, max: 31 },
    { name: "late_marks_for_absent", label: "Late Marks → Absent", suffix: "marks", min: 0, max: 31 },
    { name: "max_short_leaves_per_month", label: "Max Short Leaves / Month", suffix: "leaves", min: 0, max: 31 },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {fields.map(({ name, label, suffix, min, max }) => (
          <div key={name}>
            <FieldLabel>{label}</FieldLabel>
            <FormInput
              type="number"
              min={min}
              max={max}
              step={1}
              suffix={suffix}
              {...form.register(name, { valueAsNumber: true })}
            />
            <FieldError message={fieldMessage(name)} />
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-start gap-6">
        <div className="space-y-2">
          <FieldLabel>Auto Absent on No Punch</FieldLabel>
          <Controller
            control={form.control}
            name="auto_absent_on_no_punch"
            render={({ field }) => (
              <Toggle checked={field.value} onChange={field.onChange} label="Enable Auto-Absent" />
            )}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <FieldLabel>Cutoff Time</FieldLabel>
          <Input
            type="time"
            step={60}
            {...form.register("auto_absent_cutoff_time")}
            className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:border-brand-900 focus:ring-2 focus:ring-brand-900/10 transition-all"
          />
          <FieldError message={fieldMessage("auto_absent_cutoff_time")} />
        </div>
      </div>
    </div>
  );
}

function Step4({ form, fieldMessage }: any) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Calculation Method</FieldLabel>
        <Controller
          control={form.control}
          name="ot_calculation_method"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:border-brand-900 focus:ring-2 focus:ring-brand-900/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={fieldMessage("ot_calculation_method")} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel>Minimum OT Duration</FieldLabel>
          <FormInput
            type="number"
            min={0}
            max={1440}
            step={1}
            suffix="min"
            {...form.register("min_ot_minutes", { valueAsNumber: true })}
          />
          <FieldError message={fieldMessage("min_ot_minutes")} />
        </div>
        <div>
          <FieldLabel>OT Rate — Weekday</FieldLabel>
          <FormInput
            type="number"
            min={0}
            max={9.99}
            step="0.01"
            suffix="×"
            {...form.register("ot_rate_weekday", { valueAsNumber: true })}
          />
          <FieldError message={fieldMessage("ot_rate_weekday")} />
        </div>
        <div>
          <FieldLabel>OT Rate — Weekend</FieldLabel>
          <FormInput
            type="number"
            min={0}
            max={9.99}
            step="0.01"
            suffix="×"
            {...form.register("ot_rate_weekend", { valueAsNumber: true })}
          />
          <FieldError message={fieldMessage("ot_rate_weekend")} />
        </div>
      </div>
    </div>
  );
}

function Step5({ form, fieldMessage }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div>
        <FieldLabel>Night Window Start</FieldLabel>
        <Input
          type="time"
          step={60}
          {...form.register("night_window_start")}
          className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:border-brand-900 focus:ring-2 focus:ring-brand-900/10 transition-all"
        />
        <FieldError message={fieldMessage("night_window_start")} />
      </div>
      <div>
        <FieldLabel>Night Window End</FieldLabel>
        <Input
          type="time"
          step={60}
          {...form.register("night_window_end")}
          className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus:border-brand-900 focus:ring-2 focus:ring-brand-900/10 transition-all"
        />
        <FieldError message={fieldMessage("night_window_end")} />
      </div>
      <div>
        <FieldLabel>Night Premium Rate</FieldLabel>
        <FormInput
          type="number"
          min={0}
          max={9.99}
          step="0.01"
          suffix="×"
          {...form.register("night_premium_rate", { valueAsNumber: true })}
        />
        <FieldError message={fieldMessage("night_premium_rate")} />
      </div>
    </div>
  );
}

function Step6({ form, fieldMessage }: any) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Comp-Off Eligible On</FieldLabel>
        <div className="flex flex-wrap gap-3 mt-1">
          {COMP_OFF_OPTIONS.map((opt) => (
            <Controller
              key={opt.value}
              control={form.control}
              name="comp_off_eligible_on"
              render={({ field }) => {
                const checked = field.value.includes(opt.value);
                return (
                  <Toggle
                    checked={checked}
                    onChange={(c) =>
                      field.onChange(
                        c
                          ? [...field.value, opt.value]
                          : field.value.filter((v: string) => v !== opt.value)
                      )
                    }
                    label={opt.label}
                  />
                );
              }}
            />
          ))}
        </div>
        <FieldError message={fieldMessage("comp_off_eligible_on")} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel>Minimum Hours for Comp-Off</FieldLabel>
          <FormInput
            type="number"
            min={0}
            max={24}
            step="0.01"
            suffix="hrs"
            {...form.register("comp_off_min_hours", { valueAsNumber: true })}
          />
          <FieldError message={fieldMessage("comp_off_min_hours")} />
        </div>
        <div>
          <FieldLabel>Comp-Off Expiry</FieldLabel>
          <FormInput
            type="number"
            min={0}
            max={3650}
            step={1}
            suffix="days"
            {...form.register("comp_off_expiry_days", { valueAsNumber: true })}
          />
          <FieldError message={fieldMessage("comp_off_expiry_days")} />
        </div>
      </div>

      <div className="pt-5 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-700 mb-4">Regularization</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <FieldLabel>Max Days Back</FieldLabel>
            <FormInput
              type="number"
              min={0}
              max={365}
              step={1}
              suffix="days"
              {...form.register("regularization_max_days_back", { valueAsNumber: true })}
            />
            <FieldError message={fieldMessage("regularization_max_days_back")} />
          </div>
          <div>
            <FieldLabel>Max Per Month</FieldLabel>
            <FormInput
              type="number"
              min={0}
              max={31}
              step={1}
              suffix="/ mo"
              {...form.register("regularization_max_per_month", { valueAsNumber: true })}
            />
            <FieldError message={fieldMessage("regularization_max_per_month")} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePolicyFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policyUuid = searchParams.get("uuid") || undefined;
  const isEdit = !!policyUuid;

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const { data: branchesRaw, isLoading: isLoadingBranches } = useBranches({ per_page: 1000 });
  const branches = useMemo(() => {
    const arr = branchesRaw?.data?.data ?? branchesRaw?.data ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [branchesRaw]);
  const branchOptions: Option[] = useMemo(
    () => branches.map((b: any) => ({ value: String(b.id), label: b.name })),
    [branches]
  );

  const { data: deptsRaw, isLoading: isLoadingDepts } = useDepartments({ per_page: 1000 });
  const departments = useMemo(() => {
    const arr = deptsRaw?.data ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [deptsRaw]);
  const departmentOptions: Option[] = useMemo(
    () => departments.map((d: any) => ({ value: String(d.id), label: d.name })),
    [departments]
  );

  const { data: empTypesRaw, isLoading: isLoadingEmpTypes } = useEmployeeTypes({ per_page: 1000 });
  const employeeTypes = useMemo(() => {
    const arr = empTypesRaw?.data ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [empTypesRaw]);
  const employeeTypeOptions: Option[] = useMemo(
    () => employeeTypes.map((et: any) => ({ value: String(et.id), label: et.name })),
    [employeeTypes]
  );

  const { data: policy, isLoading: isLoadingPolicy } = useAttendancePolicy(policyUuid);
  const saveMutation = useSaveAttendancePolicy();

  const form = useForm<FormValues>({
    resolver: zodResolver(policySchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      policy_name: "",
      branch_ids: [],
      department_ids: [],
      employment_types: [],
      grace_in_minutes: 15,
      grace_out_minutes: 10,
      half_day_threshold_minutes: 240,
      absent_threshold_minutes: 120,
      short_leave_threshold_minutes: 30,
      late_marks_for_half_day: 3,
      late_marks_for_absent: 6,
      max_short_leaves_per_month: 2,
      auto_absent_on_no_punch: false,
      auto_absent_cutoff_time: "12:00",
      ot_calculation_method: "actual",
      min_ot_minutes: 30,
      ot_rate_weekday: 1.5,
      ot_rate_weekend: 2.0,
      night_window_start: "22:00",
      night_window_end: "06:00",
      night_premium_rate: 1.25,
      comp_off_eligible_on: [],
      comp_off_min_hours: 4,
      comp_off_expiry_days: 30,
      regularization_max_days_back: 7,
      regularization_max_per_month: 3,
      is_default: false,
      effective_from: "",
      effective_to: null,
      is_active: true,
    },
  });

  const fieldMessage = (name: FieldPath<FormValues>) => {
    const error = get(form.formState.errors, name);
    return error?.message as string | undefined;
  };

  useEffect(() => {
    if (policy && isEdit) {
      form.reset({
        policy_name: policy.policy_name,
        branch_ids: Array.isArray(policy.branch_ids) ? policy.branch_ids.filter(Boolean).map(String) : [],
        department_ids: policy.department_ids.map(String),
        employment_types: policy.employment_types.map(String),
        grace_in_minutes: policy.grace_in_minutes,
        grace_out_minutes: policy.grace_out_minutes,
        half_day_threshold_minutes: policy.half_day_threshold_minutes,
        absent_threshold_minutes: policy.absent_threshold_minutes,
        short_leave_threshold_minutes: policy.short_leave_threshold_minutes,
        late_marks_for_half_day: policy.late_marks_for_half_day,
        late_marks_for_absent: policy.late_marks_for_absent,
        max_short_leaves_per_month: policy.max_short_leaves_per_month,
        auto_absent_on_no_punch: policy.auto_absent_on_no_punch,
        auto_absent_cutoff_time: policy.auto_absent_cutoff_time,
        ot_calculation_method: policy.ot_calculation_method as any,
        min_ot_minutes: policy.min_ot_minutes,
        ot_rate_weekday: parseFloat(policy.ot_rate_weekday),
        ot_rate_weekend: parseFloat(policy.ot_rate_weekend),
        night_window_start: policy.night_window_start,
        night_window_end: policy.night_window_end,
        night_premium_rate: parseFloat(policy.night_premium_rate),
        comp_off_eligible_on: policy.comp_off_eligible_on,
        comp_off_min_hours: parseFloat(policy.comp_off_min_hours),
        comp_off_expiry_days: policy.comp_off_expiry_days,
        regularization_max_days_back: policy.regularization_max_days_back,
        regularization_max_per_month: policy.regularization_max_per_month,
        is_default: policy.is_default,
        effective_from: (policy.effective_from || "").split("T")[0]?.split(" ")[0] || "",
        effective_to: policy.effective_to
          ? ((policy.effective_to as string).split("T")[0]?.split(" ")[0] || null)
          : null,
        is_active: policy.is_active,
      } as FormValues);
      setCompletedSteps(new Set(STEPS.map((s) => s.id)));
    }
  }, [policy, isEdit, form]);

  useEffect(() => {
    if (!saveMutation.error) return;
    const errors = getApiValidationErrors(saveMutation.error);
    Object.entries(errors).forEach(([key, messages]) => {
      if (!Array.isArray(messages) || messages.length === 0) return;
      form.setError(key as FieldPath<FormValues>, { type: "server", message: messages[0] });
    });
  }, [saveMutation.error, form]);

  const handleNext = async () => {
    const stepFields = STEPS[currentStep - 1].fields;
    const valid = await form.trigger(stepFields as any);
    if (!valid) return;
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      policy_name: values.policy_name.trim(),
      branch_ids: values.branch_ids,
      department_ids: values.department_ids.map(Number),
      employment_types: values.employment_types.map(Number),
      effective_to: values.effective_to || null,
    };
    saveMutation.mutate(
      { uuid: policyUuid, data: payload as any },
      { onSuccess: () => router.push("/time-sync/attendance-policies") }
    );
  };

  const onInvalid: SubmitErrorHandler<FormValues> = () => {
    const firstError = Object.keys(form.formState.errors)[0] as FieldPath<FormValues> | undefined;
    if (firstError) form.setFocus(firstError);
  };

  const isLastStep = currentStep === STEPS.length;
  const stepProps = { form, fieldMessage };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-500 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              {isEdit ? "Edit Attendance Policy" : "New Attendance Policy"}
            </h1>
            <p className="text-xs text-slate-400">
              Configure attendance rules in {STEPS.length} steps
            </p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <StepperHeader currentStep={currentStep} completedSteps={completedSteps} />

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {isEdit && isLoadingPolicy ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-900" />
            <p className="text-sm text-slate-400">Loading policy details…</p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate>
            {/* Step card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Card header strip */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                {(() => {
                  const Icon = STEPS[currentStep - 1].icon;
                  return (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    {STEPS[currentStep - 1].title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {STEPS[currentStep - 1].description}
                  </p>
                </div>
                <div className="ml-auto text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5">
                  {currentStep} of {STEPS.length}
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-6">
                {currentStep === 1 && <Step1 {...stepProps} />}
                {currentStep === 2 && (
                  <Step2
                    {...stepProps}
                    branchOptions={branchOptions}
                    departmentOptions={departmentOptions}
                    employeeTypeOptions={employeeTypeOptions}
                    isLoadingBranches={isLoadingBranches}
                    isLoadingDepts={isLoadingDepts}
                    isLoadingEmpTypes={isLoadingEmpTypes}
                  />
                )}
                {currentStep === 3 && <Step3 {...stepProps} />}
                {currentStep === 4 && <Step4 {...stepProps} />}
                {currentStep === 5 && <Step5 {...stepProps} />}
                {currentStep === 6 && <Step6 {...stepProps} />}
              </div>
            </div>

            {/* API error */}
            {saveMutation.isError && isLastStep && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-400">
                  <span className="text-white text-[10px] font-bold leading-none">!</span>
                </span>
                <p className="text-sm text-red-700">
                  {getApiMessage(saveMutation.error) ||
                    "Something went wrong. Please check the form and try again."}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-5 flex items-center justify-between">
              {/* Back / Cancel */}
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => router.back() : handleBack}
                className="h-10 px-6 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>

              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((s) => (
                  <span
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s.id === currentStep
                        ? "w-5 bg-brand-900"
                        : completedSteps.has(s.id)
                        ? "w-1.5 bg-brand-900/30"
                        : "w-1.5 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              {/* Next / Submit */}
              {isLastStep ? (
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="h-10 px-8 rounded-xl bg-brand-900 hover:bg-brand-900/90 text-white font-semibold shadow-sm transition-all disabled:opacity-60"
                >
                  {saveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEdit ? "Update Policy" : "Create Policy"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-10 px-6 rounded-xl bg-brand-900 hover:bg-brand-900/90 text-white font-medium shadow-sm transition-all"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}