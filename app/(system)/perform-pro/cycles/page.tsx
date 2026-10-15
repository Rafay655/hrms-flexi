"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  LockKeyhole,
  RefreshCw,
  Plus,
  Play,
  Send,
  ShieldCheck,
  Target,
  Trash2,
  UserMinus,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { performProService } from "@/services/performpro";
import { useAppSelector } from "@/store/hooks";
import type {
  PerformProCreateCycleInput,
  PerformProCycle,
  PerformProCycleDetail,
  PerformProCycleState,
  PerformProPhase,
  PerformProParticipant,
  PerformProPopulationPolicyInput,
  PerformProReviewTask,
  PerformProTemplateBinding,
} from "@/types/performpro";

const phaseTypes = [
  "GOAL_SETTING",
  "CHECK_INS",
  "SELF_REVIEW",
  "MANAGER_REVIEW",
  "FEEDBACK_360",
  "CALIBRATION",
  "OUTCOME_APPROVAL",
  "RELEASE",
] as const;

type PhaseForm = {
  type: string;
  opensAt: string;
  dueAt: string;
  graceEndsAt: string;
  transitionMode: "MANUAL" | "AUTOMATIC";
};

const emptyPhase = (): PhaseForm => ({
  type: "GOAL_SETTING",
  opensAt: "",
  dueAt: "",
  graceEndsAt: "",
  transitionMode: "MANUAL",
});

const organizationFields = [
  "employee_code", "employment_status", "employment_category", "joining_date",
  "separation_date", "division", "department", "designation", "grade_band",
  "branch", "location", "cost_center", "reporting_manager",
] as const;

type PopulationRuleForm = {
  code: string;
  name: string;
  effect: "INCLUDE" | "EXCLUDE";
  field: string;
  operator: "EQUALS" | "NOT_EQUALS" | "IN" | "NOT_IN" | "EXISTS" | "NOT_EXISTS";
  values: string;
};

const emptyPopulationRule = (): PopulationRuleForm => ({
  code: "ACTIVE_EMPLOYEES",
  name: "Include active employees",
  effect: "INCLUDE",
  field: "employment_status",
  operator: "EQUALS",
  values: "active",
});

const requiredTemplateDefaults: Record<string, Record<string, unknown>> = {
  REVIEW_FORM: {
    title: "Annual performance review",
    sections: [
      { key: "goals", label: "Goals", weight: 60 },
      { key: "competencies", label: "Competencies", weight: 40 },
    ],
  },
  RATING_SCALE: {
    title: "Five-point performance scale",
    levels: [
      { value: 1, label: "Needs significant improvement" },
      { value: 2, label: "Needs improvement" },
      { value: 3, label: "Meets expectations" },
      { value: 4, label: "Exceeds expectations" },
      { value: 5, label: "Exceptional" },
    ],
  },
  SCORING_POLICY: {
    title: "Weighted performance score",
    goal_weight: 60,
    competency_weight: 40,
    rounding: 2,
  },
  GOAL_FRAMEWORK: {
    title: "Hybrid KPI, KRA and OKR framework",
    models: ["KPI", "KRA", "OKR"],
    top_level_weight_total: 100,
    key_result_weight_total: 100,
    confidence_scale: { min: 1, max: 10 },
    progress_limit_pct: 150,
  },
  FEEDBACK360_POLICY: {
    title: "Annual 360 reviewer policy",
    anonymity_mode: "ANONYMOUS",
    minimum_reviewers: 3,
    maximum_reviewers: 8,
    minimum_peer_reviewers: 2,
    minimum_anonymous_group_size: 3,
    manager_approval_required: true,
    employee_nominations_allowed: true,
    relationship_categories: [
      "MANAGER",
      "PEER",
      "DIRECT_REPORT",
      "CROSS_FUNCTIONAL",
      "INTERNAL_CUSTOMER",
      "OTHER",
    ],
  },
  COMPENSATION_POLICY: {
    title: "Annual compensation guideline",
    measurement_basis: "BASIC",
    requires_outcome_acknowledgement: false,
    guidelines: [
      { rating_code: "NI", min_pct: 0, target_pct: 0, max_pct: 0 },
      { rating_code: "PI", min_pct: 0, target_pct: 2, max_pct: 4 },
      { rating_code: "ME", min_pct: 3, target_pct: 5, max_pct: 7 },
      { rating_code: "EE", min_pct: 6, target_pct: 8, max_pct: 10 },
      { rating_code: "EX", min_pct: 9, target_pct: 12, max_pct: 15 },
    ],
  },
};

const cycleStateStyles: Record<PerformProCycleState, string> = {
  DRAFT: "bg-amber-50 text-amber-800 ring-amber-200",
  SCHEDULED: "bg-sky-50 text-sky-800 ring-sky-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 ring-slate-200",
  ARCHIVED: "bg-gray-100 text-gray-600 ring-gray-200",
  CANCELLED: "bg-rose-50 text-rose-800 ring-rose-200",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

function apiMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
}

function shortId(value: string | null) {
  return value ? `${value.slice(0, 8)}…` : "Not assigned";
}

function snapshotLabel(snapshot: Record<string, unknown>) {
  const candidates = [
    snapshot.department_name,
    snapshot.department,
    snapshot.business_unit_name,
    snapshot.company_name,
  ];
  const label = candidates.find((value) => typeof value === "string" && value.trim());

  return typeof label === "string" ? label : "Organisation snapshot captured";
}

function StateBadge({ state }: { state: PerformProCycleState }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cycleStateStyles[state]}`}>
      {state.replaceAll("_", " ")}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Target;
}) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-brand-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
        <span className="rounded-2xl bg-brand-100 p-3 text-brand-700">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function CreateCycleDialog({
  pending,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: PerformProCreateCycleInput) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [cycleType, setCycleType] = useState("ANNUAL");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [locale, setLocale] = useState("en");
  const [phases, setPhases] = useState<PhaseForm[]>([emptyPhase()]);
  const [formError, setFormError] = useState<string | null>(null);

  function updatePhase(index: number, patch: Partial<PhaseForm>) {
    setPhases((current) => current.map((phase, phaseIndex) => (
      phaseIndex === index ? { ...phase, ...patch } : phase
    )));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!code || !name || !periodStart || !periodEnd || !timezone || !locale) {
      setFormError("Complete the cycle identity and period fields.");
      return;
    }

    if (periodEnd < periodStart) {
      setFormError("The cycle end date cannot precede its start date.");
      return;
    }

    if (phases.some((phase) => !phase.type || !phase.opensAt || !phase.dueAt)) {
      setFormError("Every phase requires a type, opening time, and due time.");
      return;
    }

    if (new Set(phases.map((phase) => phase.type)).size !== phases.length) {
      setFormError("Each phase type can only appear once.");
      return;
    }

    if (phases.some((phase) => phase.dueAt <= phase.opensAt || (phase.graceEndsAt && phase.graceEndsAt < phase.dueAt))) {
      setFormError("Phase due and grace times must follow their opening time.");
      return;
    }

    onSubmit({
      code,
      name: name.trim(),
      cycle_type: cycleType,
      period_start: periodStart,
      period_end: periodEnd,
      timezone,
      default_locale: locale,
      phases: phases.map((phase) => ({
        type: phase.type,
        opens_at: new Date(phase.opensAt).toISOString(),
        due_at: new Date(phase.dueAt).toISOString(),
        grace_ends_at: phase.graceEndsAt ? new Date(phase.graceEndsAt).toISOString() : null,
        transition_mode: phase.transitionMode,
      })),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="create-cycle-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">PerformPro configuration</p>
            <h2 id="create-cycle-title" className="mt-1 text-2xl font-bold text-brand-950">Create performance cycle</h2>
            <p className="mt-2 text-sm text-gray-500">The cycle and its ordered phase schedule are saved atomically as a versioned DRAFT.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close"><X aria-hidden="true" className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-semibold text-gray-800">Cycle code<input required value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/\s+/g, "-"))} maxLength={80} placeholder="FY27-ANNUAL" className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200" /></label>
          <label className="text-sm font-semibold text-gray-800 sm:col-span-2">Cycle name<input required value={name} onChange={(event) => setName(event.target.value)} maxLength={160} placeholder="FY27 Annual Performance Cycle" className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200" /></label>
          <label className="text-sm font-semibold text-gray-800">Cycle type<select value={cycleType} onChange={(event) => setCycleType(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"><option value="ANNUAL">Annual</option><option value="HALF_YEARLY">Half-yearly</option><option value="QUARTERLY">Quarterly</option><option value="PROBATION">Probation</option><option value="PROJECT">Project</option></select></label>
          <label className="text-sm font-semibold text-gray-800">Period start<input required type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200" /></label>
          <label className="text-sm font-semibold text-gray-800">Period end<input required type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} min={periodStart || undefined} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200" /></label>
          <label className="text-sm font-semibold text-gray-800 sm:col-span-2">IANA timezone<input required value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={64} placeholder="Asia/Karachi" className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200" /></label>
          <label className="text-sm font-semibold text-gray-800">Locale<input required value={locale} onChange={(event) => setLocale(event.target.value)} maxLength={20} placeholder="en" className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200" /></label>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div><h3 className="text-lg font-semibold text-brand-950">Phase schedule</h3><p className="mt-1 text-sm text-gray-500">Sequence follows the order below. All timestamps are submitted as exact instants.</p></div>
          <button type="button" disabled={phases.length >= phaseTypes.length} onClick={() => setPhases((current) => [...current, { ...emptyPhase(), type: phaseTypes.find((type) => !current.some((phase) => phase.type === type)) ?? "GOAL_SETTING" }])} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><Plus aria-hidden="true" className="h-4 w-4" /> Add phase</button>
        </div>
        <div className="mt-4 space-y-4">
          {phases.map((phase, index) => (
            <div key={index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-900">Phase {index + 1}</p>{phases.length > 1 && <button type="button" onClick={() => setPhases((current) => current.filter((_, phaseIndex) => phaseIndex !== index))} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label={`Remove phase ${index + 1}`}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="text-xs font-semibold text-gray-700">Type<select value={phase.type} onChange={(event) => updatePhase(index, { type: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm">{phaseTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label>
                <label className="text-xs font-semibold text-gray-700">Opens<input required type="datetime-local" value={phase.opensAt} onChange={(event) => updatePhase(index, { opensAt: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm" /></label>
                <label className="text-xs font-semibold text-gray-700">Due<input required type="datetime-local" value={phase.dueAt} onChange={(event) => updatePhase(index, { dueAt: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm" /></label>
                <label className="text-xs font-semibold text-gray-700">Grace ends<input type="datetime-local" value={phase.graceEndsAt} onChange={(event) => updatePhase(index, { graceEndsAt: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm" /></label>
                <label className="text-xs font-semibold text-gray-700">Transition<select value={phase.transitionMode} onChange={(event) => updatePhase(index, { transitionMode: event.target.value as PhaseForm["transitionMode"] })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm"><option value="MANUAL">Manual</option><option value="AUTOMATIC">Automatic</option></select></label>
              </div>
            </div>
          ))}
        </div>

        {formError && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{formError}</p>}
        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:bg-gray-300"><Plus aria-hidden="true" className="h-4 w-4" />{pending ? "Creating…" : "Create cycle"}</button>
        </div>
      </form>
    </div>
  );
}

function PopulationPolicyDialog({
  cycle,
  pending,
  onClose,
  onSubmit,
}: {
  cycle: PerformProCycle;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: PerformProPopulationPolicyInput) => void;
}) {
  const [populationAsOf, setPopulationAsOf] = useState(new Date().toISOString().slice(0, 16));
  const [rules, setRules] = useState<PopulationRuleForm[]>([emptyPopulationRule()]);
  const [formError, setFormError] = useState<string | null>(null);

  function updateRule(index: number, patch: Partial<PopulationRuleForm>) {
    setRules((current) => current.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!populationAsOf || rules.some((rule) => !rule.code || !rule.name || !rule.field)) {
      setFormError("Complete the evaluation time and every rule.");
      return;
    }
    if (new Set(rules.map((rule) => rule.code)).size !== rules.length) {
      setFormError("Population rule codes must be unique.");
      return;
    }
    const normalized = rules.map((rule) => ({
      ...rule,
      code: rule.code.toUpperCase(),
      values: ["EXISTS", "NOT_EXISTS"].includes(rule.operator)
        ? []
        : rule.values.split(",").map((value) => value.trim()).filter(Boolean),
    }));
    if (normalized.some((rule) => !["EXISTS", "NOT_EXISTS"].includes(rule.operator) && rule.values.length === 0)) {
      setFormError("Rules using a comparison operator require at least one value.");
      return;
    }
    onSubmit({
      cycleUuid: cycle.uuid,
      expectedCycleVersion: cycle.lock_version,
      populationAsOf: new Date(populationAsOf).toISOString(),
      rules: normalized,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="population-policy-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Population policy · cycle v{cycle.lock_version}</p><h2 id="population-policy-title" className="mt-1 text-2xl font-bold text-brand-950">Define eligible employees</h2><p className="mt-2 text-sm text-gray-500">Rules are ordered, versioned, and evaluated against PeopleHub organisation snapshots.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close"><X aria-hidden="true" className="h-5 w-5" /></button></div>
        <label className="mt-6 block max-w-sm text-sm font-semibold text-gray-800">Evaluate workforce as of<input required type="datetime-local" value={populationAsOf} onChange={(event) => setPopulationAsOf(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" /></label>
        <div className="mt-7 flex items-center justify-between"><div><h3 className="font-semibold text-brand-950">Ordered rules</h3><p className="mt-1 text-sm text-gray-500">Start with inclusion rules, then add explicit exclusions.</p></div><button type="button" onClick={() => setRules((current) => [...current, { ...emptyPopulationRule(), code: `RULE_${current.length + 1}`, name: "" }])} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Plus aria-hidden="true" className="h-4 w-4" /> Add rule</button></div>
        <div className="mt-4 space-y-4">
          {rules.map((rule, index) => (
            <div key={index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-900">Rule {index + 1}</p>{rules.length > 1 && <button type="button" onClick={() => setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index))} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label={`Remove rule ${index + 1}`}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="text-xs font-semibold text-gray-700">Code<input required value={rule.code} onChange={(event) => updateRule(index, { code: event.target.value.toUpperCase().replace(/\s+/g, "_") })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 font-mono text-sm" /></label>
                <label className="text-xs font-semibold text-gray-700 xl:col-span-2">Name<input required value={rule.name} onChange={(event) => updateRule(index, { name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm" /></label>
                <label className="text-xs font-semibold text-gray-700">Effect<select value={rule.effect} onChange={(event) => updateRule(index, { effect: event.target.value as PopulationRuleForm["effect"] })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm"><option value="INCLUDE">Include</option><option value="EXCLUDE">Exclude</option></select></label>
                <label className="text-xs font-semibold text-gray-700">Organisation field<select value={rule.field} onChange={(event) => updateRule(index, { field: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm">{organizationFields.map((field) => <option key={field} value={field}>{field.replaceAll("_", " ")}</option>)}</select></label>
                <label className="text-xs font-semibold text-gray-700">Operator<select value={rule.operator} onChange={(event) => updateRule(index, { operator: event.target.value as PopulationRuleForm["operator"] })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm"><option value="EQUALS">Equals</option><option value="NOT_EQUALS">Does not equal</option><option value="IN">In list</option><option value="NOT_IN">Not in list</option><option value="EXISTS">Exists</option><option value="NOT_EXISTS">Does not exist</option></select></label>
                {!(["EXISTS", "NOT_EXISTS"].includes(rule.operator)) && <label className="text-xs font-semibold text-gray-700 md:col-span-2 xl:col-span-3">Values <span className="font-normal text-gray-500">(comma separated)</span><input required value={rule.values} onChange={(event) => updateRule(index, { values: event.target.value })} placeholder="active" className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm" /></label>}
              </div>
            </div>
          ))}
        </div>
        {formError && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{formError}</p>}
        <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" disabled={pending} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:bg-gray-300">{pending ? "Saving…" : "Save population policy"}</button></div>
      </form>
    </div>
  );
}

function TemplateBindingDialog({
  cycle,
  type,
  existing,
  pending,
  onClose,
  onSubmit,
}: {
  cycle: PerformProCycle;
  type: string;
  existing?: PerformProTemplateBinding;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: {
    cycleUuid: string;
    expectedCycleVersion: number;
    bindingType: string;
    bindingKey: string;
    sourceUuid: string;
    sourceVersion: number;
    sourceSnapshot: Record<string, unknown>;
    required: boolean;
  }) => void;
}) {
  const [snapshotText, setSnapshotText] = useState(JSON.stringify(
    existing?.source_snapshot ?? requiredTemplateDefaults[type] ?? { title: type.replaceAll("_", " ") },
    null,
    2,
  ));
  const [formError, setFormError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const snapshot = JSON.parse(snapshotText) as unknown;
      if (!snapshot || Array.isArray(snapshot) || typeof snapshot !== "object") {
        setFormError("Template content must be a JSON object.");
        return;
      }
      onSubmit({
        cycleUuid: cycle.uuid,
        expectedCycleVersion: cycle.lock_version,
        bindingType: type,
        bindingKey: existing?.key ?? "default",
        sourceUuid: existing?.source_uuid ?? crypto.randomUUID(),
        sourceVersion: (existing?.source_version ?? 0) + 1,
        sourceSnapshot: snapshot as Record<string, unknown>,
        required: ["REVIEW_FORM", "RATING_SCALE", "SCORING_POLICY", "GOAL_FRAMEWORK", "FEEDBACK360_POLICY"].includes(type),
      });
    } catch {
      setFormError("Template content is not valid JSON.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="template-binding-title">
      <form onSubmit={submit} className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Versioned cycle input</p><h2 id="template-binding-title" className="mt-1 text-2xl font-bold text-brand-950">{existing ? "Revise" : "Configure"} {type.replaceAll("_", " ").toLowerCase()}</h2><p className="mt-2 text-sm text-gray-500">The server canonicalizes and hashes this snapshot before freezing it into the cycle.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close"><X aria-hidden="true" className="h-5 w-5" /></button>
        </div>
        <label className="mt-6 block text-sm font-semibold text-gray-800">Template snapshot<textarea value={snapshotText} onChange={(event) => setSnapshotText(event.target.value)} rows={16} spellCheck={false} className="mt-2 w-full resize-y rounded-xl border border-gray-300 bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" /></label>
        {formError && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{formError}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" disabled={pending} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:bg-gray-300">{pending ? "Binding…" : existing ? "Save new version" : "Bind template"}</button></div>
      </form>
    </div>
  );
}

function PhaseProgressionDialog({
  cycle,
  currentPhase,
  nextPhase,
  command,
  pending,
  onClose,
  onConfirm,
}: {
  cycle: PerformProCycleDetail;
  currentPhase: PerformProPhase;
  nextPhase: PerformProPhase | null;
  command: "advance" | "close";
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const closesCycle = command === "close";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase-progression-title"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Version-controlled lifecycle command
            </p>
            <h2 id="phase-progression-title" className="mt-1 text-2xl font-bold text-brand-950">
              {closesCycle ? "Close performance cycle" : "Advance cycle phase"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            aria-label="Close confirmation"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current</p>
            <p className="mt-1 font-semibold text-gray-950">{currentPhase.type.replaceAll("_", " ")}</p>
          </div>
          <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {closesCycle ? "Cycle state" : "Next"}
            </p>
            <p className="mt-1 font-semibold text-gray-950">
              {closesCycle ? "Closed" : nextPhase?.type.replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            This closes the current phase, cancels its unfinished generated tasks, and records immutable
            lifecycle evidence. {closesCycle
              ? "No additional phase will open."
              : `The ${nextPhase?.type.replaceAll("_", " ").toLowerCase()} work will be generated atomically.`}
          </p>
        </div>

        <dl className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-200 px-4 text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-gray-600">Cycle version</dt>
            <dd className="font-semibold text-gray-950">{cycle.lock_version}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-gray-600">Phase version</dt>
            <dd className="font-semibold text-gray-950">{currentPhase.lock_version}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-gray-600">Transition mode</dt>
            <dd className="font-semibold text-gray-950">{currentPhase.transition_mode}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-11 cursor-pointer rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            Keep current phase
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`min-h-11 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 motion-reduce:transition-none ${
              closesCycle
                ? "bg-slate-800 hover:bg-slate-900 focus-visible:ring-slate-700"
                : "bg-brand-700 hover:bg-brand-800 focus-visible:ring-brand-600"
            }`}
          >
            {pending ? "Recording transition…" : closesCycle ? "Close cycle" : "Advance phase"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PerformProCyclesPage() {
  const queryClient = useQueryClient();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const canPublish = permissions.includes("performpro.cycle.publish");
  const canManage = permissions.includes("performpro.cycle.manage");
  const canClose = permissions.includes("performpro.cycle.close");
  const canManagePopulation = permissions.includes("performpro.population.manage");
  const canPreviewPopulation = permissions.includes("performpro.population.preview");
  const canManageTemplates = permissions.includes("performpro.template.manage");
  const canOverride = permissions.includes("performpro.population.override");
  const [stateFilter, setStateFilter] = useState<"ALL" | PerformProCycleState>("ALL");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [participantAction, setParticipantAction] = useState<{
    participant: PerformProParticipant;
    action: "withdraw" | "restore";
  } | null>(null);
  const [reasonCode, setReasonCode] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showPopulationPolicy, setShowPopulationPolicy] = useState(false);
  const [templateBindingType, setTemplateBindingType] = useState<string | null>(null);
  const [phaseAction, setPhaseAction] = useState<"advance" | "close" | null>(null);

  const cyclesQuery = useQuery({
    queryKey: ["perform-pro", "cycles", stateFilter],
    queryFn: () => performProService.cycles(stateFilter === "ALL" ? undefined : stateFilter),
  });
  const cycles = useMemo(() => cyclesQuery.data ?? [], [cyclesQuery.data]);
  const effectiveSelectedUuid = cycles.some((cycle) => cycle.uuid === selectedUuid)
    ? selectedUuid
    : (cycles[0]?.uuid ?? null);

  const detailQuery = useQuery({
    queryKey: ["perform-pro", "cycle", effectiveSelectedUuid],
    queryFn: () => performProService.cycle(effectiveSelectedUuid!),
    enabled: Boolean(effectiveSelectedUuid),
  });
  const participantsQuery = useQuery({
    queryKey: ["perform-pro", "participants", effectiveSelectedUuid],
    queryFn: () => performProService.participants(effectiveSelectedUuid!),
    enabled: Boolean(effectiveSelectedUuid),
  });
  const reviewTasksQuery = useQuery({
    queryKey: ["perform-pro", "review-tasks", effectiveSelectedUuid],
    queryFn: () => performProService.reviewTasks(effectiveSelectedUuid!),
    enabled: Boolean(effectiveSelectedUuid) && detailQuery.data?.state === "ACTIVE",
  });
  const reasonsQuery = useQuery({
    queryKey: ["perform-pro", "participant-override-reasons"],
    queryFn: performProService.overrideReasons,
    enabled: canOverride && Boolean(participantAction),
  });
  const populationPreviewQuery = useQuery({
    queryKey: ["perform-pro", "population-preview", effectiveSelectedUuid],
    queryFn: () => performProService.latestPopulationPreview(effectiveSelectedUuid!),
    enabled: canPreviewPopulation && Boolean(effectiveSelectedUuid),
    refetchInterval: (query) => ["QUEUED", "RUNNING"].includes(query.state.data?.status ?? "") ? 5000 : false,
  });
  const populationPublicationQuery = useQuery({
    queryKey: ["perform-pro", "population-publication", effectiveSelectedUuid],
    queryFn: () => performProService.latestPopulationPublication(effectiveSelectedUuid!),
    enabled: canManagePopulation && Boolean(effectiveSelectedUuid),
    refetchInterval: (query) => ["QUEUED", "RUNNING"].includes(query.state.data?.status ?? "") ? 5000 : false,
  });

  const metrics = useMemo(() => {
    const all = cyclesQuery.data ?? [];
    return {
      total: all.length,
      underway: all.filter((cycle) => cycle.state === "SCHEDULED" || cycle.state === "ACTIVE").length,
      participants: all.reduce((total, cycle) => total + cycle.participant_count, 0),
      blocked: all.filter((cycle) => cycle.state === "DRAFT" && !cycle.population_finalized).length,
    };
  }, [cyclesQuery.data]);

  const publishMutation = useMutation({
    mutationFn: (cycle: PerformProCycle) => performProService.publishCycle(cycle),
    onSuccess: async () => {
      toast.success("Cycle published successfully.");
      await queryClient.invalidateQueries({ queryKey: ["perform-pro"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The cycle could not be published.") }),
  });

  const activateMutation = useMutation({
    mutationFn: (cycle: PerformProCycle) => performProService.activateCycle(cycle),
    onSuccess: async (result) => {
      toast.success(`Cycle activated with ${result.task_count} open task${result.task_count === 1 ? "" : "s"}.`);
      await queryClient.invalidateQueries({ queryKey: ["perform-pro"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The cycle could not be activated.") }),
  });

  const phaseProgressionMutation = useMutation({
    mutationFn: ({
      cycle,
      phase,
      command,
    }: {
      cycle: PerformProCycleDetail;
      phase: PerformProPhase;
      command: "advance" | "close";
    }) => performProService.progressCyclePhase(cycle, phase, command),
    onSuccess: async (result) => {
      const message = result.opened_phase
        ? `Advanced to ${result.opened_phase.type.replaceAll("_", " ").toLowerCase()} with ${result.opened_task_count} open task${result.opened_task_count === 1 ? "" : "s"}.`
        : "Final phase and performance cycle closed.";
      toast.success(message);
      setPhaseAction(null);
      await queryClient.invalidateQueries({ queryKey: ["perform-pro"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The cycle phase could not be progressed.") }),
  });

  const createMutation = useMutation({
    mutationFn: performProService.createCycle,
    onSuccess: async (cycle) => {
      toast.success("Performance cycle created.");
      setStateFilter("ALL");
      setSelectedUuid(cycle.uuid);
      setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ["perform-pro"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The cycle could not be created.") }),
  });

  const populationPolicyMutation = useMutation({
    mutationFn: performProService.replacePopulationPolicy,
    onSuccess: async () => {
      toast.success("Population policy saved as a new version.");
      setShowPopulationPolicy(false);
      await queryClient.invalidateQueries({ queryKey: ["perform-pro"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The population policy could not be saved.") }),
  });
  const templateBindingMutation = useMutation({
    mutationFn: performProService.bindTemplate,
    onSuccess: async () => {
      toast.success("Template snapshot bound to the cycle.");
      setTemplateBindingType(null);
      await queryClient.invalidateQueries({ queryKey: ["perform-pro"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The template could not be bound.") }),
  });

  const populationPreviewMutation = useMutation({
    mutationFn: performProService.requestPopulationPreview,
    onSuccess: async () => {
      toast.success("Population preview queued.");
      await queryClient.invalidateQueries({ queryKey: ["perform-pro", "population-preview"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The population preview could not be requested.") }),
  });
  const populationPublicationMutation = useMutation({
    mutationFn: ({ cycle, previewUuid }: { cycle: PerformProCycle; previewUuid: string }) => performProService.requestPopulationPublication(cycle, previewUuid),
    onSuccess: async () => {
      toast.success("Population publication queued.");
      await queryClient.invalidateQueries({ queryKey: ["perform-pro"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Population publication could not be requested.") }),
  });

  const overrideMutation = useMutation({
    mutationFn: () => {
      if (!participantAction || !reasonCode) throw new Error("A reason is required.");
      return performProService.changeParticipant(
        participantAction.participant,
        participantAction.action,
        reasonCode,
        reasonNote,
      );
    },
    onSuccess: async () => {
      toast.success(participantAction?.action === "withdraw" ? "Participant withdrawn." : "Participant restored.");
      setParticipantAction(null);
      setReasonCode("");
      setReasonNote("");
      await queryClient.invalidateQueries({ queryKey: ["perform-pro"] });
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "The participant status could not be changed.") }),
  });

  const detail = detailQuery.data;
  const participants = participantsQuery.data?.items ?? [];
  const publishReady = detail?.state === "DRAFT" && detail.readiness?.ready === true;
  const activePhase = detail?.phases.find((phase) => phase.status === "OPEN") ?? null;
  const nextPhase = activePhase
    ? detail?.phases.find((phase) => phase.sequence > activePhase.sequence && phase.status === "PENDING") ?? null
    : null;

  return (
    <div className="min-h-full bg-brand-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
              <Target aria-hidden="true" className="h-4 w-4" /> PerformPro
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-950">Cycle & population control</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Monitor cycle readiness, publication gates, phases, immutable template bindings, and enrolled employees from live PerformPro data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["perform-pro"] })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" /> Refresh
            </button>
            {canManage && (
              <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800">
                <Plus aria-hidden="true" className="h-4 w-4" /> Create cycle
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Visible cycles" value={metrics.total} detail="Current filtered result" icon={CalendarDays} />
          <MetricCard label="Underway" value={metrics.underway} detail="Scheduled or active" icon={CircleDot} />
          <MetricCard label="Participants" value={metrics.participants} detail="All selected cycle records" icon={Users} />
          <MetricCard label="Draft blockers" value={metrics.blocked} detail="Population not finalized" icon={AlertTriangle} />
        </section>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-950">Performance cycles</h2>
              <p className="mt-1 text-sm text-gray-500">Select a cycle to inspect its backend publication state.</p>
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
              State
              <select
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value as "ALL" | PerformProCycleState)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
              >
                <option value="ALL">All states</option>
                {Object.keys(cycleStateStyles).map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </label>
          </div>

          {cyclesQuery.isLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">Loading PerformPro cycles…</div>
          ) : cyclesQuery.isError ? (
            <div className="p-10 text-center">
              <AlertTriangle aria-hidden="true" className="mx-auto h-8 w-8 text-rose-600" />
              <p className="mt-3 font-semibold text-gray-900">Cycles could not be loaded</p>
              <p className="mt-1 text-sm text-gray-500">{apiMessage(cyclesQuery.error, "Check the API connection and your cycle-view permission.")}</p>
            </div>
          ) : cycles.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays aria-hidden="true" className="mx-auto h-9 w-9 text-gray-400" />
              <p className="mt-3 font-semibold text-gray-900">No matching cycles</p>
              <p className="mt-1 text-sm text-gray-500">No PerformPro cycle records match this state filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Cycle</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">State</th>
                    <th className="px-5 py-3 text-right">Population</th>
                    <th className="px-5 py-3 text-right">Phases</th>
                    <th className="w-12 px-4 py-3"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cycles.map((cycle) => (
                    <tr
                      key={cycle.uuid}
                      onClick={() => setSelectedUuid(cycle.uuid)}
                      className={`cursor-pointer transition hover:bg-brand-50 ${effectiveSelectedUuid === cycle.uuid ? "bg-brand-50" : "bg-white"}`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-950">{cycle.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{cycle.code} · {cycle.cycle_type}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(cycle.period_start)} – {formatDate(cycle.period_end)}</td>
                      <td className="px-5 py-4"><StateBadge state={cycle.state} /></td>
                      <td className="px-5 py-4 text-right">
                        <p className="font-semibold text-gray-900">{cycle.enrolled_participant_count}</p>
                        <p className="text-xs text-gray-500">{cycle.withdrawn_participant_count} withdrawn</p>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-700">{cycle.phase_count}</td>
                      <td className="px-4 py-4"><ChevronRight aria-hidden="true" className="h-4 w-4 text-gray-400" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {effectiveSelectedUuid && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
            <div className="space-y-6">
              <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                {detailQuery.isLoading ? (
                  <p className="py-10 text-center text-sm text-gray-500">Loading cycle control data…</p>
                ) : detailQuery.isError || !detail ? (
                  <p className="py-10 text-center text-sm text-rose-700">{apiMessage(detailQuery.error, "Cycle detail could not be loaded.")}</p>
                ) : (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><StateBadge state={detail.state} /><span className="text-xs font-medium text-gray-500">Version {detail.lock_version}</span></div>
                        <h2 className="mt-3 text-2xl font-bold text-brand-950">{detail.name}</h2>
                        <p className="mt-1 text-sm text-gray-500">{detail.code} · {detail.timezone}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canManagePopulation && detail.state === "DRAFT" && (
                          <button type="button" onClick={() => setShowPopulationPolicy(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">
                            <Users aria-hidden="true" className="h-4 w-4" /> Population policy
                          </button>
                        )}
                        {canPreviewPopulation && detail.state === "DRAFT" && detail.population_policy_version && (
                          <button type="button" disabled={populationPreviewMutation.isPending || ["QUEUED", "RUNNING"].includes(populationPreviewQuery.data?.status ?? "")} onClick={() => populationPreviewMutation.mutate(detail)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50">
                            <RefreshCw aria-hidden="true" className="h-4 w-4" /> {populationPreviewMutation.isPending ? "Queuing…" : "Preview population"}
                          </button>
                        )}
                        {canManagePopulation && detail.state === "DRAFT" && populationPreviewQuery.data?.status === "COMPLETED" && populationPreviewQuery.data.blocked_count === 0 && !populationPublicationQuery.data && (
                          <button type="button" disabled={populationPublicationMutation.isPending} onClick={() => populationPublicationMutation.mutate({ cycle: detail, previewUuid: populationPreviewQuery.data!.uuid })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                            <UserRoundCheck aria-hidden="true" className="h-4 w-4" /> {populationPublicationMutation.isPending ? "Queuing…" : "Approve population"}
                          </button>
                        )}
                        {canPublish && detail.state === "DRAFT" && (
                          <button
                          type="button"
                          disabled={!publishReady || publishMutation.isPending}
                          onClick={() => publishMutation.mutate(detail)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          <Send aria-hidden="true" className="h-4 w-4" />
                          {publishMutation.isPending ? "Publishing…" : "Publish cycle"}
                          </button>
                        )}
                        {canManage && detail.state === "SCHEDULED" && (
                          <button
                            type="button"
                            disabled={
                              activateMutation.isPending
                              || !detail.phases[0]
                            }
                            onClick={() => activateMutation.mutate(detail)}
                            title={detail.phases[0] ? `Scheduled opening: ${formatDateTime(detail.phases[0].opens_at)}` : undefined}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            <Play aria-hidden="true" className="h-4 w-4" />
                            {activateMutation.isPending ? "Activating…" : "Activate cycle"}
                          </button>
                        )}
                        {detail.state === "ACTIVE"
                          && activePhase?.transition_mode === "MANUAL"
                          && nextPhase
                          && canManage && (
                            <button
                              type="button"
                              disabled={phaseProgressionMutation.isPending}
                              onClick={() => setPhaseAction("advance")}
                              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 motion-reduce:transition-none"
                            >
                              <ArrowRight aria-hidden="true" className="h-4 w-4" />
                              Advance to {nextPhase.type.replaceAll("_", " ").toLowerCase()}
                            </button>
                          )}
                        {detail.state === "ACTIVE"
                          && activePhase?.transition_mode === "MANUAL"
                          && !nextPhase
                          && canClose && (
                            <button
                              type="button"
                              disabled={phaseProgressionMutation.isPending}
                              onClick={() => setPhaseAction("close")}
                              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 motion-reduce:transition-none"
                            >
                              <LockKeyhole aria-hidden="true" className="h-4 w-4" />
                              Close cycle
                            </button>
                          )}
                      </div>
                    </div>

                    <div className={`mt-6 rounded-2xl border p-4 ${detail.readiness?.ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                      <div className="flex items-center gap-2 font-semibold text-gray-950">
                        {detail.readiness?.ready ? <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-700" /> : <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-700" />}
                        {detail.readiness?.ready ? "Ready for publication" : "Publication gates are not satisfied"}
                      </div>
                      {detail.readiness && !detail.readiness.ready && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {detail.readiness.blockers.map((blocker) => (
                            <span key={blocker} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">{blocker.replaceAll("_", " ")}</span>
                          ))}
                          {detail.readiness.missing_required_bindings.map((binding) => (
                            <span key={binding} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">Missing {binding.replaceAll("_", " ")}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500"><Clock3 aria-hidden="true" className="h-4 w-4" /> Phase timeline</h3>
                      {activePhase?.transition_mode === "AUTOMATIC" && (
                        <div className="mt-3 flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                          <Clock3 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                          <p>
                            This phase progresses automatically after {formatDateTime(activePhase.grace_ends_at ?? activePhase.due_at)}.
                            Manual controls are intentionally unavailable.
                          </p>
                        </div>
                      )}
                      {detail.phases.length === 0 ? (
                        <p className="mt-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No phases have been configured.</p>
                      ) : (
                        <ol className="mt-4 space-y-3">
                          {detail.phases.map((phase) => (
                            <li key={phase.uuid} className="flex gap-4 rounded-2xl border border-gray-200 p-4">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{phase.sequence}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-gray-950">{phase.type.replaceAll("_", " ")}</p>
                                  <span className="text-xs font-semibold text-gray-500">{phase.status}</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{formatDateTime(phase.opens_at)} → {formatDateTime(phase.due_at)} · {phase.transition_mode}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                      {detail.phase_transitions.length > 0 && (
                        <div className="mt-5">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Immutable transition history
                          </h4>
                          <ol className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 px-4">
                            {detail.phase_transitions.map((transition) => (
                              <li key={transition.uuid} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-semibold text-gray-950">
                                    {transition.from_phase.replaceAll("_", " ")}
                                    <span className="px-2 text-brand-600" aria-hidden="true">→</span>
                                    {transition.to_phase?.replaceAll("_", " ") ?? "CYCLE CLOSED"}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {transition.trigger} · version {transition.expected_cycle_version} to {transition.resulting_cycle_version}
                                  </p>
                                </div>
                                <div className="text-left text-xs text-gray-500 sm:text-right">
                                  <p>{formatDateTime(transition.occurred_at)}</p>
                                  <p className="mt-1">
                                    {transition.opened_task_count} opened · {transition.cancelled_task_count} cancelled
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                    {detail.state === "ACTIVE" && (
                      <div className="mt-6">
                        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500"><ClipboardCheck aria-hidden="true" className="h-4 w-4" /> Generated work</h3>
                        {reviewTasksQuery.isLoading ? (
                          <p className="mt-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">Loading generated review tasks…</p>
                        ) : reviewTasksQuery.isError ? (
                          <p className="mt-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{apiMessage(reviewTasksQuery.error, "Generated review tasks could not be loaded.")}</p>
                        ) : (reviewTasksQuery.data ?? []).length === 0 ? (
                          <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">The active phase has no generated work. This cycle requires administrator attention.</p>
                        ) : (
                          <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <tr><th className="px-4 py-3">Work type</th><th className="px-4 py-3">Assignee</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th></tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {(reviewTasksQuery.data ?? []).map((task: PerformProReviewTask) => (
                                  <tr key={task.uuid}>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{task.task_type.replaceAll("_", " ")}</td>
                                    <td className="px-4 py-3"><p className="font-mono text-xs text-gray-700" title={task.assignee_employee_uuid}>{shortId(task.assignee_employee_uuid)}</p><p className="mt-1 text-xs text-gray-500">{task.assignee_role}</p></td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-700" title={task.subject_employee_uuid}>{shortId(task.subject_employee_uuid)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{formatDateTime(task.due_at)}</td>
                                    <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">{task.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </article>

              <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-5">
                  <h2 className="text-lg font-semibold text-brand-950">Cycle population</h2>
                  <p className="mt-1 text-sm text-gray-500">Enrolment status is command-controlled and version checked.</p>
                </div>
                {participantsQuery.isLoading ? (
                  <p className="p-10 text-center text-sm text-gray-500">Loading participant population…</p>
                ) : participantsQuery.isError ? (
                  <p className="p-10 text-center text-sm text-rose-700">{apiMessage(participantsQuery.error, "Participants could not be loaded.")}</p>
                ) : participants.length === 0 ? (
                  <p className="p-10 text-center text-sm text-gray-500">This cycle has no participant records.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Manager</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Snapshot</th>{canOverride && <th className="px-5 py-3 text-right">Action</th>}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {participants.map((participant) => (
                          <tr key={participant.uuid}>
                            <td className="px-5 py-4"><p className="font-mono text-xs font-semibold text-gray-900" title={participant.employee_uuid}>{shortId(participant.employee_uuid)}</p><p className="mt-1 text-xs text-gray-500">v{participant.lock_version}</p></td>
                            <td className="px-5 py-4 font-mono text-xs text-gray-600" title={participant.manager_employee_uuid ?? undefined}>{shortId(participant.manager_employee_uuid)}</td>
                            <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${participant.status === "ENROLLED" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{participant.status}</span></td>
                            <td className="px-5 py-4"><p className="text-gray-700">{snapshotLabel(participant.organization)}</p><p className="mt-1 text-xs text-gray-500">Changed {formatDateTime(participant.status_changed_at)}</p></td>
                            {canOverride && (
                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setParticipantAction({ participant, action: participant.status === "ENROLLED" ? "withdraw" : "restore" })}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  {participant.status === "ENROLLED" ? <UserMinus aria-hidden="true" className="h-3.5 w-3.5" /> : <UserRoundCheck aria-hidden="true" className="h-3.5 w-3.5" />}
                                  {participant.status === "ENROLLED" ? "Withdraw" : "Restore"}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>

            <aside className="space-y-6">
              <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-brand-950"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-brand-700" /> Configuration bindings</h2><p className="mt-1 text-sm text-gray-500">Version-pinned inputs used when the cycle runs.</p></div>{canManageTemplates && detail?.state === "DRAFT" && <select aria-label="Configure template binding" defaultValue="" onChange={(event) => { if (event.target.value) setTemplateBindingType(event.target.value); event.target.value = ""; }} className="max-w-44 rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700"><option value="">Add binding…</option>{Object.keys(requiredTemplateDefaults).map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>}</div>
                {!detail ? (
                  <p className="mt-5 text-sm text-gray-500">Select a cycle to inspect its bindings.</p>
                ) : detail.template_bindings.length === 0 ? (
                  <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">No template bindings are present.</p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {detail.template_bindings.map((binding) => (
                      <div key={binding.uuid} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3"><p className="font-semibold text-gray-900">{binding.key.replaceAll("_", " ")}</p>{binding.required && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">Required</span>}</div>
                        <p className="mt-1 text-xs text-gray-500">{binding.type} · source v{binding.source_version}</p>
                        <p className="mt-2 truncate font-mono text-[11px] text-gray-400" title={binding.source_uuid}>{binding.source_uuid}</p>
                        <p className="mt-1 truncate font-mono text-[10px] text-gray-400" title={binding.content_hash}>SHA-256 {binding.content_hash}</p>
                        {canManageTemplates && detail.state === "DRAFT" && <button type="button" onClick={() => setTemplateBindingType(binding.type)} className="mt-3 text-xs font-semibold text-brand-700 hover:text-brand-900">Revise binding</button>}
                      </div>
                    ))}
                  </div>
                )}
              </article>

              {canPreviewPopulation && (
                <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-brand-950">Population preview</h2><p className="mt-1 text-sm text-gray-500">Latest deterministic eligibility run.</p></div>{populationPreviewQuery.data && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${populationPreviewQuery.data.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800" : populationPreviewQuery.data.status === "FAILED" ? "bg-rose-50 text-rose-800" : "bg-sky-50 text-sky-800"}`}>{populationPreviewQuery.data.status}</span>}</div>
                  {populationPreviewQuery.isLoading ? <p className="mt-5 text-sm text-gray-500">Checking preview status…</p> : !populationPreviewQuery.data ? <p className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No preview has been requested for this cycle.</p> : (
                    <div className="mt-5">
                      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-brand-50 p-4"><p className="text-xs font-medium text-gray-500">Candidates</p><p className="mt-1 text-2xl font-bold text-brand-950">{populationPreviewQuery.data.candidate_count}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-medium text-gray-500">Included</p><p className="mt-1 text-2xl font-bold text-emerald-900">{populationPreviewQuery.data.included_count}</p></div><div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-medium text-gray-500">Excluded</p><p className="mt-1 text-2xl font-bold text-gray-900">{populationPreviewQuery.data.excluded_count}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs font-medium text-gray-500">Blocked</p><p className="mt-1 text-2xl font-bold text-amber-900">{populationPreviewQuery.data.blocked_count}</p></div></div>
                      <p className="mt-4 text-xs text-gray-500">Policy v{populationPreviewQuery.data.policy_version} · processed {populationPreviewQuery.data.processed_count} · attempts {populationPreviewQuery.data.attempt_count}</p>
                      {populationPreviewQuery.data.failure_code && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{populationPreviewQuery.data.failure_code}</p>}
                    </div>
                  )}
                </article>
              )}
              {canManagePopulation && populationPublicationQuery.data && (
                <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-brand-950">Population publication</h2><p className="mt-1 text-sm text-gray-500">Approved participant materialisation.</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${populationPublicationQuery.data.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800" : populationPublicationQuery.data.status === "FAILED" ? "bg-rose-50 text-rose-800" : "bg-sky-50 text-sky-800"}`}>{populationPublicationQuery.data.status}</span></div>
                  <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-brand-50 p-4"><p className="text-xs text-gray-500">Expected</p><p className="mt-1 text-2xl font-bold text-brand-950">{populationPublicationQuery.data.expected_participant_count}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-gray-500">Materialised</p><p className="mt-1 text-2xl font-bold text-emerald-900">{populationPublicationQuery.data.processed_count}</p></div></div>
                  {populationPublicationQuery.data.failure_code && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{populationPublicationQuery.data.failure_code}</p>}
                </article>
              )}

              <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-brand-950">Control facts</h2>
                <dl className="mt-4 divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">Population finalized</dt><dd className="font-semibold text-gray-900">{detail?.population_finalized ? "Yes" : "No"}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">Population policy</dt><dd className="font-semibold text-gray-900">{detail?.population_policy_version ? `Version ${detail.population_policy_version}` : "Not configured"}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">Configuration hash</dt><dd className="max-w-40 truncate font-mono text-xs text-gray-700" title={detail?.configuration_hash ?? undefined}>{detail?.configuration_hash ?? "Not generated"}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">Published</dt><dd className="font-semibold text-gray-900">{detail?.published_at ? formatDateTime(detail.published_at) : "Not published"}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">Activated</dt><dd className="font-semibold text-gray-900">{detail?.activated_at ? formatDateTime(detail.activated_at) : "Not activated"}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">Active phase</dt><dd className="font-semibold text-gray-900">{detail?.active_phase?.replaceAll("_", " ") ?? "None"}</dd></div>
                </dl>
              </article>
            </aside>
          </section>
        )}
      </div>

      {participantAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="participant-action-title">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Population override</p><h2 id="participant-action-title" className="mt-1 text-xl font-bold text-brand-950">{participantAction.action === "withdraw" ? "Withdraw participant" : "Restore participant"}</h2></div>
              <button type="button" onClick={() => setParticipantAction(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close"><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">This command is audited and uses optimistic version control. Select the business reason recorded with the change.</p>
            <label className="mt-5 block text-sm font-semibold text-gray-800">
              Reason
              <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} disabled={reasonsQuery.isLoading} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200">
                <option value="">{reasonsQuery.isLoading ? "Loading reasons…" : "Select a reason"}</option>
                {(reasonsQuery.data ?? []).map((reason) => <option key={reason.code} value={reason.code}>{reason.label}</option>)}
              </select>
            </label>
            {reasonsQuery.isError && <p className="mt-2 text-sm text-rose-700">{apiMessage(reasonsQuery.error, "Override reasons could not be loaded.")}</p>}
            <label className="mt-4 block text-sm font-semibold text-gray-800">
              Note <span className="font-normal text-gray-500">(optional)</span>
              <textarea value={reasonNote} onChange={(event) => setReasonNote(event.target.value)} rows={3} maxLength={1000} className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200" placeholder="Add relevant context for the audit trail" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setParticipantAction(null)} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" disabled={!reasonCode || overrideMutation.isPending} onClick={() => overrideMutation.mutate()} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-gray-300">{overrideMutation.isPending ? "Saving…" : "Confirm change"}</button>
            </div>
          </div>
        </div>
      )}
      {showCreate && (
        <CreateCycleDialog
          pending={createMutation.isPending}
          onClose={() => setShowCreate(false)}
          onSubmit={(input) => createMutation.mutate(input)}
        />
      )}
      {phaseAction && detail && activePhase && (
        <PhaseProgressionDialog
          cycle={detail}
          currentPhase={activePhase}
          nextPhase={nextPhase}
          command={phaseAction}
          pending={phaseProgressionMutation.isPending}
          onClose={() => setPhaseAction(null)}
          onConfirm={() => phaseProgressionMutation.mutate({
            cycle: detail,
            phase: activePhase,
            command: phaseAction,
          })}
        />
      )}
      {showPopulationPolicy && detail && (
        <PopulationPolicyDialog
          cycle={detail}
          pending={populationPolicyMutation.isPending}
          onClose={() => setShowPopulationPolicy(false)}
          onSubmit={(input) => populationPolicyMutation.mutate(input)}
        />
      )}
      {templateBindingType && detail && (
        <TemplateBindingDialog
          cycle={detail}
          type={templateBindingType}
          existing={detail.template_bindings.find((binding) => binding.type === templateBindingType)}
          pending={templateBindingMutation.isPending}
          onClose={() => setTemplateBindingType(null)}
          onSubmit={(input) => templateBindingMutation.mutate(input)}
        />
      )}
    </div>
  );
}
