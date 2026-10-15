"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  FileText,
  Fingerprint,
  Link2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { performProService } from "@/services/performpro";
import type {
  PerformProCreateDevelopmentPlanInput,
  PerformProDevelopmentActionType,
  PerformProDevelopmentEvidenceInput,
  PerformProDevelopmentGoal,
  PerformProDevelopmentOwnerRole,
  PerformProDevelopmentPlan,
  PerformProDevelopmentPlanHealth,
  PerformProDevelopmentPlanStatus,
  PerformProDevelopmentUpdateInput,
  PerformProOutcomeDisputeEvidence,
} from "@/types/performpro";

type DraftGoal = PerformProCreateDevelopmentPlanInput["goals"][number];
type DraftNeed = PerformProCreateDevelopmentPlanInput["development_needs"][number];
type PlanDialog = { kind: "CHECK_IN" | "COMPLETE"; plan: PerformProDevelopmentPlan } | null;
type ProgressItem = {
  key: string;
  type: "GOAL" | "ACTION" | "MILESTONE";
  uuid: string;
  label: string;
  progress: number;
  completed: boolean;
};

const healthStyles: Record<PerformProDevelopmentPlanHealth, string> = {
  ON_TRACK: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  AT_RISK: "bg-amber-50 text-amber-900 ring-amber-200",
  OFF_TRACK: "bg-rose-50 text-rose-900 ring-rose-200",
  COMPLETED: "bg-indigo-50 text-indigo-900 ring-indigo-200",
};

const statusStyles: Record<PerformProDevelopmentPlanStatus, string> = {
  ACTIVE: "bg-sky-50 text-sky-900 ring-sky-200",
  COMPLETED: "bg-indigo-50 text-indigo-900 ring-indigo-200",
};

const ownerRoles: { value: PerformProDevelopmentOwnerRole; label: string }[] = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Manager" },
  { value: "SHARED", label: "Shared" },
];

const actionTypes: { value: PerformProDevelopmentActionType; label: string }[] = [
  { value: "TRAINING", label: "Training" },
  { value: "PROJECT", label: "Stretch project" },
  { value: "COACHING", label: "Coaching" },
  { value: "MENTORING", label: "Mentoring" },
  { value: "SELF_STUDY", label: "Self-study" },
  { value: "OTHER", label: "Other" },
];

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function emptyNeed(): DraftNeed {
  return { source_type: "OUTCOME", title: "", rationale: "" };
}

function emptyGoal(weight = 100): DraftGoal {
  return {
    owner_role: "SHARED",
    title: "",
    description: "",
    competency: "",
    success_measure: "",
    weight,
    target_date: futureDate(90),
    actions: [{
      action_type: "PROJECT",
      owner_role: "EMPLOYEE",
      title: "",
      description: "",
      due_date: futureDate(60),
    }],
    milestones: [{
      title: "",
      due_date: futureDate(45),
    }],
  };
}

function emptyEvidence(): PerformProDevelopmentEvidenceInput {
  return { type: "NOTE", title: "", description: "" };
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function apiMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  return error.response?.data?.error?.message
    ?? error.response?.data?.message
    ?? fallback;
}

function evidenceInvalid(items: PerformProDevelopmentEvidenceInput[]) {
  return items.some((item) => (
    item.title.trim().length < 3
    || (item.type === "NOTE" && item.description.trim().length < 10)
    || (item.type === "DOCUMENT" && !item.document_uuid?.trim())
    || (item.type === "LINK" && !/^https?:\/\//i.test(item.url?.trim() ?? ""))
  ));
}

function progressItems(plan: PerformProDevelopmentPlan): ProgressItem[] {
  return (plan.goals ?? []).flatMap((goal) => {
    const items: ProgressItem[] = [];
    if (goal.actions.length === 0 && goal.milestones.length === 0) {
      items.push({
        key: `GOAL:${goal.uuid}`,
        type: "GOAL",
        uuid: goal.uuid,
        label: `Goal · ${goal.title}`,
        progress: goal.progress_percentage,
        completed: goal.progress_percentage === 100,
      });
    }
    goal.actions.forEach((action) => items.push({
      key: `ACTION:${action.uuid}`,
      type: "ACTION",
      uuid: action.uuid,
      label: `Action · ${action.title}`,
      progress: action.progress_percentage,
      completed: action.progress_percentage === 100,
    }));
    goal.milestones.forEach((milestone) => items.push({
      key: `MILESTONE:${milestone.uuid}`,
      type: "MILESTONE",
      uuid: milestone.uuid,
      label: `Milestone · ${milestone.title}`,
      progress: milestone.status === "COMPLETED" ? 100 : 0,
      completed: milestone.status === "COMPLETED",
    }));
    return items;
  });
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold tabular-nums text-slate-900">{bounded.toFixed(0)}%</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={bounded}
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${bounded}%` }}
        />
      </div>
    </div>
  );
}

function EvidenceList({ items }: { items: PerformProOutcomeDisputeEvidence[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-600">No supporting references.</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item.type}-${item.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start gap-2">
            {item.type === "DOCUMENT" ? <FileText className="mt-0.5 size-4 text-indigo-600" /> : <Link2 className="mt-0.5 size-4 text-indigo-600" />}
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{item.title}</p>
              {item.description && <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>}
              {item.document && <p className="mt-1 text-xs text-slate-600">{item.document.original_name} · version {item.document.version}</p>}
              {item.url && <a className="mt-1 block break-all text-sm font-medium text-indigo-700 underline-offset-2 hover:underline" href={item.url} target="_blank" rel="noreferrer">Open reference</a>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EvidenceEditor({
  items,
  onChange,
}: {
  items: PerformProDevelopmentEvidenceInput[];
  onChange: (items: PerformProDevelopmentEvidenceInput[]) => void;
}) {
  function patch(index: number, changes: Partial<PerformProDevelopmentEvidenceInput>) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Supporting evidence</p>
          <p className="text-xs leading-5 text-slate-600">Reference a safe DMS UUID, HTTP link, or evidence note.</p>
        </div>
        <Button type="button" variant="outline" className="min-h-11 cursor-pointer" onClick={() => onChange([...items, emptyEvidence()])} disabled={items.length >= 10}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Evidence type
            <select value={item.type} onChange={(event) => patch(index, { type: event.target.value as PerformProDevelopmentEvidenceInput["type"] })} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
              <option value="NOTE">Evidence note</option>
              <option value="DOCUMENT">DMS document</option>
              <option value="LINK">HTTP reference</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Title
            <Input className="mt-1 min-h-11" value={item.title} onChange={(event) => patch(index, { title: event.target.value })} />
          </label>
          {item.type === "DOCUMENT" && (
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              DMS document UUID
              <Input className="mt-1 min-h-11" value={item.document_uuid ?? ""} onChange={(event) => patch(index, { document_uuid: event.target.value })} />
            </label>
          )}
          {item.type === "LINK" && (
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              HTTP or HTTPS URL
              <Input className="mt-1 min-h-11" type="url" value={item.url ?? ""} onChange={(event) => patch(index, { url: event.target.value })} />
            </label>
          )}
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Description
            <Textarea className="mt-1 min-h-24" value={item.description} onChange={(event) => patch(index, { description: event.target.value })} />
          </label>
          <Button type="button" variant="ghost" className="min-h-11 cursor-pointer justify-self-start text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
            <Trash2 className="size-4" /> Remove evidence
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function DevelopmentPlansPage() {
  const queryClient = useQueryClient();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<PerformProDevelopmentPlanHealth | "ALL">("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [outcomeUuid, setOutcomeUuid] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [targetDate, setTargetDate] = useState(futureDate(120));
  const [needs, setNeeds] = useState<DraftNeed[]>([emptyNeed()]);
  const [goals, setGoals] = useState<DraftGoal[]>([emptyGoal()]);
  const [dialog, setDialog] = useState<PlanDialog>(null);
  const [checkInSummary, setCheckInSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [itemProgress, setItemProgress] = useState(0);
  const [milestoneCompleted, setMilestoneCompleted] = useState(true);
  const [actionEvidence, setActionEvidence] = useState<PerformProDevelopmentEvidenceInput[]>([]);

  const queueQuery = useQuery({
    queryKey: ["perform-pro", "development-plans"],
    queryFn: performProService.developmentPlans,
  });
  const eligibleOutcomes = queueQuery.data?.eligible_outcomes ?? [];
  const selectedOutcomeUuid = eligibleOutcomes.some((outcome) => outcome.uuid === outcomeUuid)
    ? outcomeUuid
    : eligibleOutcomes[0]?.uuid ?? "";
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (queueQuery.data?.plans ?? []).filter((plan) => (
      (healthFilter === "ALL" || plan.health === healthFilter)
      && (
        needle === ""
        || plan.plan_reference.toLowerCase().includes(needle)
        || plan.display_name.toLowerCase().includes(needle)
        || plan.title.toLowerCase().includes(needle)
        || plan.cycle_name.toLowerCase().includes(needle)
      )
    ));
  }, [healthFilter, queueQuery.data?.plans, search]);
  const activeSelectedUuid = filtered.some((plan) => plan.uuid === selectedUuid)
    ? selectedUuid
    : filtered[0]?.uuid ?? null;
  const detailQuery = useQuery({
    queryKey: ["perform-pro", "development-plans", activeSelectedUuid],
    queryFn: () => performProService.developmentPlan(activeSelectedUuid!),
    enabled: Boolean(activeSelectedUuid),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const outcome = eligibleOutcomes.find((candidate) => candidate.uuid === selectedOutcomeUuid);
      if (!outcome) throw new Error("Select a released outcome.");
      return performProService.createDevelopmentPlan({
        outcome,
        title,
        summary,
        target_completion_date: targetDate,
        development_needs: needs,
        goals,
      });
    },
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({ queryKey: ["perform-pro", "development-plans"] });
      queryClient.setQueryData(["perform-pro", "development-plans", plan.uuid], plan);
      setSelectedUuid(plan.uuid);
      setShowCreate(false);
      resetCreate();
      toast.success(`Development plan ${plan.plan_reference} is active.`);
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Unable to create the development plan.") }),
  });

  const checkInMutation = useMutation({
    mutationFn: (plan: PerformProDevelopmentPlan) => performProService.recordDevelopmentCheckIn({
      plan,
      summary: checkInSummary,
      blockers,
      supportNeeded,
      updates: selectedUpdate(plan),
      evidence: actionEvidence,
    }),
    onSuccess: handleActionSuccess,
    onError: handleActionError,
  });

  const completeMutation = useMutation({
    mutationFn: (plan: PerformProDevelopmentPlan) => performProService.completeDevelopmentPlan({
      plan,
      summary: checkInSummary,
      evidence: actionEvidence,
    }),
    onSuccess: handleActionSuccess,
    onError: handleActionError,
  });

  function resetCreate() {
    setOutcomeUuid("");
    setTitle("");
    setSummary("");
    setTargetDate(futureDate(120));
    setNeeds([emptyNeed()]);
    setGoals([emptyGoal()]);
  }

  async function handleActionSuccess(plan: PerformProDevelopmentPlan) {
    queryClient.setQueryData(["perform-pro", "development-plans", plan.uuid], plan);
    await queryClient.invalidateQueries({ queryKey: ["perform-pro", "development-plans"] });
    setDialog(null);
    setCheckInSummary("");
    setBlockers("");
    setSupportNeeded("");
    setActionEvidence([]);
    toast.success(`Plan ${plan.plan_reference} updated with immutable evidence.`);
  }

  async function handleActionError(error: unknown) {
    if (isAxiosError(error) && error.response?.status === 409) {
      await Promise.all([queueQuery.refetch(), detailQuery.refetch()]);
      setDialog(null);
      toast.error("This plan changed in another window. The latest progress is loaded; review it before retrying.");
      return;
    }
    toast.error(apiMessage(error, "Unable to update the development plan."));
  }

  function openDialog(kind: NonNullable<PlanDialog>["kind"], plan: PerformProDevelopmentPlan) {
    const items = progressItems(plan);
    setCheckInSummary("");
    setBlockers("");
    setSupportNeeded("");
    setActionEvidence([]);
    setSelectedItemKey(items[0]?.key ?? "");
    setItemProgress(items[0]?.progress ?? 0);
    setMilestoneCompleted(!(items[0]?.completed ?? false));
    setDialog({ kind, plan });
  }

  function selectedUpdate(plan: PerformProDevelopmentPlan): PerformProDevelopmentUpdateInput[] {
    const item = progressItems(plan).find((candidate) => candidate.key === selectedItemKey);
    if (!item) return [];
    if (item.type === "MILESTONE") {
      return [{ item_type: "MILESTONE", item_uuid: item.uuid, completed: milestoneCompleted }];
    }
    return [{ item_type: item.type, item_uuid: item.uuid, progress_percentage: itemProgress }];
  }

  function selectProgressItem(plan: PerformProDevelopmentPlan, key: string) {
    const item = progressItems(plan).find((candidate) => candidate.key === key);
    setSelectedItemKey(key);
    setItemProgress(item?.progress ?? 0);
    setMilestoneCompleted(!(item?.completed ?? false));
  }

  const weightTotal = goals.reduce((total, goal) => total + Number(goal.weight || 0), 0);
  const createInvalid = !selectedOutcomeUuid
    || title.trim().length < 5
    || summary.trim().length < 20
    || !targetDate
    || needs.length === 0
    || !needs.some((need) => need.source_type === "OUTCOME")
    || needs.some((need) => need.title.trim().length < 3 || need.rationale.trim().length < 10)
    || goals.length === 0
    || Math.abs(weightTotal - 100) > 0.01
    || goals.some((goal) => (
      goal.title.trim().length < 5
      || goal.description.trim().length < 20
      || goal.success_measure.trim().length < 10
      || !goal.target_date
      || goal.actions.length + goal.milestones.length === 0
      || goal.actions.some((action) => action.title.trim().length < 3 || !action.due_date)
      || goal.milestones.some((milestone) => milestone.title.trim().length < 3 || !milestone.due_date)
    ));
  const dialogInvalid = checkInSummary.trim().length < 20
    || (blockers.trim() !== "" && blockers.trim().length < 10)
    || (supportNeeded.trim() !== "" && supportNeeded.trim().length < 10)
    || evidenceInvalid(actionEvidence);
  const pending = createMutation.isPending || checkInMutation.isPending || completeMutation.isPending;
  const selected = detailQuery.data;
  const summaryData = queueQuery.data?.summary;

  return (
    <main className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <BookOpenCheck className="size-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Individual development plans</h1>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Turn released outcomes into measurable growth goals, record evidence-led check-ins, and preserve the complete progress history.
              </p>
            </div>
            {eligibleOutcomes.length > 0 && (
              <Button className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowCreate((value) => !value)}>
                <Plus className="size-4" /> {showCreate ? "Close plan builder" : "Create development plan"}
              </Button>
            )}
          </div>
          <div className="mt-5 flex gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-6 text-indigo-950">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <p>Definitions are frozen when a plan starts. Every check-in and completion creates an immutable, hash-linked evidence record.</p>
          </div>
        </header>

        <section aria-label="Development plan summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Total", value: summaryData?.total ?? 0, icon: Target },
            { label: "Active", value: summaryData?.active ?? 0, icon: Activity },
            { label: "Completed", value: summaryData?.completed ?? 0, icon: CheckCircle2 },
            { label: "On track", value: summaryData?.on_track ?? 0, icon: TrendingUp },
            { label: "At risk", value: summaryData?.at_risk ?? 0, icon: AlertTriangle },
            { label: "Off track", value: summaryData?.off_track ?? 0, icon: CircleDot },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Icon className="size-5 text-indigo-600" />
              <p className="mt-4 text-2xl font-bold tabular-nums text-slate-950">{value}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
            </div>
          ))}
        </section>

        {showCreate && (
          <section className="rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="create-plan-title">
            <div className="mb-6">
              <h2 id="create-plan-title" className="text-xl font-bold text-slate-950">Build an outcome-linked plan</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Goal weights must total 100%. Each goal needs at least one action or milestone.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 lg:col-span-2">
                Released outcome
                <select value={selectedOutcomeUuid} onChange={(event) => setOutcomeUuid(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                  {eligibleOutcomes.map((outcome) => <option key={outcome.uuid} value={outcome.uuid}>{outcome.display_name} · {outcome.cycle_name} · {outcome.rating.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Plan title
                <Input className="mt-1 min-h-11" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Strengthen strategic leadership capability" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Target completion date
                <Input className="mt-1 min-h-11" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
              </label>
              <label className="text-sm font-medium text-slate-700 lg:col-span-2">
                Plan summary
                <Textarea className="mt-1 min-h-28" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Describe the development intent, expected partnership, and practical outcome." />
              </label>
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-semibold text-slate-950">Development needs</h3><p className="text-sm text-slate-600">Include at least one need derived from the released outcome.</p></div>
                <Button type="button" variant="outline" className="min-h-11 cursor-pointer" onClick={() => setNeeds([...needs, emptyNeed()])} disabled={needs.length >= 10}><Plus className="size-4" /> Add need</Button>
              </div>
              {needs.map((need, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[180px_1fr_2fr_auto]">
                  <label className="text-sm font-medium text-slate-700">Source
                    <select value={need.source_type} onChange={(event) => setNeeds(needs.map((item, itemIndex) => itemIndex === index ? { ...item, source_type: event.target.value as DraftNeed["source_type"] } : item))} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                      <option value="OUTCOME">Outcome</option><option value="FEEDBACK">Feedback</option><option value="CAREER">Career</option><option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">Need
                    <Input className="mt-1 min-h-11" value={need.title} onChange={(event) => setNeeds(needs.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Rationale
                    <Input className="mt-1 min-h-11" value={need.rationale} onChange={(event) => setNeeds(needs.map((item, itemIndex) => itemIndex === index ? { ...item, rationale: event.target.value } : item))} />
                  </label>
                  <Button type="button" variant="ghost" aria-label={`Remove development need ${index + 1}`} className="min-h-11 cursor-pointer self-end text-rose-700 hover:bg-rose-50" onClick={() => setNeeds(needs.filter((_, itemIndex) => itemIndex !== index))} disabled={needs.length === 1}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>

            <div className="mt-7 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 className="font-semibold text-slate-950">Weighted goals</h3><p className={`text-sm font-medium ${Math.abs(weightTotal - 100) < 0.01 ? "text-emerald-700" : "text-rose-700"}`}>Current weight: {weightTotal.toFixed(0)}% of 100%</p></div>
                <Button type="button" variant="outline" className="min-h-11 cursor-pointer" onClick={() => setGoals([...goals, emptyGoal(0)])} disabled={goals.length >= 10}><Plus className="size-4" /> Add goal</Button>
              </div>
              {goals.map((goal, goalIndex) => (
                <div key={goalIndex} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3"><h4 className="font-semibold text-slate-950">Goal {goalIndex + 1}</h4><Button type="button" variant="ghost" className="min-h-11 cursor-pointer text-rose-700 hover:bg-rose-50" onClick={() => setGoals(goals.filter((_, index) => index !== goalIndex))} disabled={goals.length === 1}><Trash2 className="size-4" /> Remove goal</Button></div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <label className="text-sm font-medium text-slate-700 lg:col-span-2">Goal title<Input className="mt-1 min-h-11" value={goal.title} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, title: event.target.value } : item))} /></label>
                    <label className="text-sm font-medium text-slate-700">Weight (%)<Input className="mt-1 min-h-11" type="number" min={0.01} max={100} step={0.01} value={goal.weight} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, weight: Number(event.target.value) } : item))} /></label>
                    <label className="text-sm font-medium text-slate-700 lg:col-span-3">Description<Textarea className="mt-1 min-h-24" value={goal.description} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, description: event.target.value } : item))} /></label>
                    <label className="text-sm font-medium text-slate-700">Owner<select value={goal.owner_role} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, owner_role: event.target.value as PerformProDevelopmentOwnerRole } : item))} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">{ownerRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
                    <label className="text-sm font-medium text-slate-700">Competency<Input className="mt-1 min-h-11" value={goal.competency} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, competency: event.target.value } : item))} /></label>
                    <label className="text-sm font-medium text-slate-700">Target date<Input className="mt-1 min-h-11" type="date" value={goal.target_date} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, target_date: event.target.value } : item))} /></label>
                    <label className="text-sm font-medium text-slate-700 lg:col-span-3">Success measure<Input className="mt-1 min-h-11" value={goal.success_measure} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, success_measure: event.target.value } : item))} /></label>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Actions</p><Button type="button" variant="ghost" className="min-h-11 cursor-pointer" onClick={() => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, actions: [...item.actions, { action_type: "TRAINING", owner_role: "EMPLOYEE", title: "", description: "", due_date: goal.target_date }] } : item))}><Plus className="size-4" /> Add</Button></div>
                      {goal.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="space-y-3 rounded-xl bg-slate-50 p-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">Type<select value={action.action_type} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, actions: item.actions.map((entry, entryIndex) => entryIndex === actionIndex ? { ...entry, action_type: event.target.value as PerformProDevelopmentActionType } : entry) } : item))} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3">{actionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
                            <label className="text-sm font-medium text-slate-700">Owner<select value={action.owner_role} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, actions: item.actions.map((entry, entryIndex) => entryIndex === actionIndex ? { ...entry, owner_role: event.target.value as PerformProDevelopmentOwnerRole } : entry) } : item))} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3">{ownerRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
                          </div>
                          <Input className="min-h-11" aria-label={`Action ${actionIndex + 1} title`} placeholder="Action title" value={action.title} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, actions: item.actions.map((entry, entryIndex) => entryIndex === actionIndex ? { ...entry, title: event.target.value } : entry) } : item))} />
                          <Input className="min-h-11" aria-label={`Action ${actionIndex + 1} description`} placeholder="Description (optional)" value={action.description} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, actions: item.actions.map((entry, entryIndex) => entryIndex === actionIndex ? { ...entry, description: event.target.value } : entry) } : item))} />
                          <div className="flex gap-2"><Input className="min-h-11" aria-label={`Action ${actionIndex + 1} due date`} type="date" value={action.due_date} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, actions: item.actions.map((entry, entryIndex) => entryIndex === actionIndex ? { ...entry, due_date: event.target.value } : entry) } : item))} /><Button type="button" variant="ghost" aria-label={`Remove action ${actionIndex + 1}`} className="min-h-11 cursor-pointer text-rose-700" onClick={() => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, actions: item.actions.filter((_, entryIndex) => entryIndex !== actionIndex) } : item))}><Trash2 className="size-4" /></Button></div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Milestones</p><Button type="button" variant="ghost" className="min-h-11 cursor-pointer" onClick={() => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, milestones: [...item.milestones, { title: "", due_date: goal.target_date }] } : item))}><Plus className="size-4" /> Add</Button></div>
                      {goal.milestones.map((milestone, milestoneIndex) => (
                        <div key={milestoneIndex} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_170px_auto]">
                          <Input className="min-h-11" aria-label={`Milestone ${milestoneIndex + 1} title`} placeholder="Milestone title" value={milestone.title} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, milestones: item.milestones.map((entry, entryIndex) => entryIndex === milestoneIndex ? { ...entry, title: event.target.value } : entry) } : item))} />
                          <Input className="min-h-11" aria-label={`Milestone ${milestoneIndex + 1} due date`} type="date" value={milestone.due_date} onChange={(event) => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, milestones: item.milestones.map((entry, entryIndex) => entryIndex === milestoneIndex ? { ...entry, due_date: event.target.value } : entry) } : item))} />
                          <Button type="button" variant="ghost" aria-label={`Remove milestone ${milestoneIndex + 1}`} className="min-h-11 cursor-pointer text-rose-700" onClick={() => setGoals(goals.map((item, index) => index === goalIndex ? { ...item, milestones: item.milestones.filter((_, entryIndex) => entryIndex !== milestoneIndex) } : item))}><Trash2 className="size-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700" disabled={createInvalid || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" /> : <Target className="size-4" />} Start development plan
              </Button>
            </div>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3">
              <label className="relative">
                <span className="sr-only">Search development plans</span>
                <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" />
                <Input className="min-h-11 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plans" />
              </label>
              <label>
                <span className="sr-only">Filter by plan health</span>
                <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value as typeof healthFilter)} className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                  <option value="ALL">All health states</option><option value="ON_TRACK">On track</option><option value="AT_RISK">At risk</option><option value="OFF_TRACK">Off track</option><option value="COMPLETED">Completed</option>
                </select>
              </label>
            </div>
            <div className="mt-4 space-y-2">
              {queueQuery.isLoading && Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}
              {!queueQuery.isLoading && filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center"><Target className="mx-auto size-6 text-slate-500" /><p className="mt-3 font-medium text-slate-900">No plans found</p><p className="mt-1 text-sm leading-6 text-slate-600">Adjust the filters or create a plan from an eligible released outcome.</p></div>
              )}
              {filtered.map((plan) => (
                <button key={plan.uuid} type="button" onClick={() => setSelectedUuid(plan.uuid)} className={`min-h-11 w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${activeSelectedUuid === plan.uuid ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <div className="flex items-start justify-between gap-3"><p className="font-semibold text-slate-950">{plan.title}</p><span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${healthStyles[plan.health]}`}>{humanize(plan.health)}</span></div>
                  <p className="mt-1 text-sm text-slate-600">{plan.display_name} · {plan.plan_reference}</p>
                  <div className="mt-3"><ProgressBar value={plan.progress_percentage} label="Plan progress" /></div>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            {detailQuery.isLoading && <div className="space-y-4"><Skeleton className="h-56 rounded-3xl" /><Skeleton className="h-80 rounded-3xl" /></div>}
            {!detailQuery.isLoading && !selected && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><BookOpenCheck className="mx-auto size-8 text-slate-500" /><p className="mt-4 font-semibold text-slate-950">Select a development plan</p><p className="mt-2 text-sm text-slate-600">Its goals, progress evidence, and check-in timeline will appear here.</p></div>
            )}
            {selected && (
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[selected.status]}`}>{humanize(selected.status)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${healthStyles[selected.health]}`}>{humanize(selected.health)}</span></div>
                      <h2 className="mt-3 text-2xl font-bold text-slate-950">{selected.title}</h2>
                      <p className="mt-1 text-sm text-slate-600">{selected.display_name} · {selected.cycle_name} · {selected.plan_reference}</p>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">{selected.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.capabilities.can_check_in && <Button variant="outline" className="min-h-11 cursor-pointer" onClick={() => openDialog("CHECK_IN", selected)}><MessageSquareText className="size-4" /> Record check-in</Button>}
                      {selected.capabilities.can_complete && <Button className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700" onClick={() => openDialog("COMPLETE", selected)}><CheckCircle2 className="size-4" /> Complete plan</Button>}
                    </div>
                  </div>
                  <div className="mt-6 grid gap-5 border-t border-slate-200 pt-5 lg:grid-cols-[1fr_260px]">
                    <ProgressBar value={selected.progress_percentage} label="Weighted plan progress" />
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><CalendarDays className="size-5 text-indigo-600" /><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Target date</p><p className="font-semibold text-slate-900">{formatDate(selected.target_completion_date)}</p></div></div>
                  </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-950">Outcome-derived needs</h3>
                    <ul className="mt-4 space-y-3">{selected.development_needs.map((need) => <li key={`${need.sequence}-${need.title}`} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-900">{need.title}</p><span className="text-xs font-semibold text-indigo-700">{humanize(need.source_type)}</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{need.rationale}</p></li>)}</ul>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-950">Frozen source outcome</h3>
                    <dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Rating</dt><dd className="mt-1 font-semibold text-slate-900">{selected.source_outcome.rating.label}</dd></div><div><dt className="text-slate-500">Final score</dt><dd className="mt-1 font-semibold tabular-nums text-slate-900">{selected.source_outcome.final_score.toFixed(2)}</dd></div><div><dt className="text-slate-500">Released</dt><dd className="mt-1 font-semibold text-slate-900">{formatDateTime(selected.source_outcome.released_at)}</dd></div><div><dt className="text-slate-500">Receipt</dt><dd className="mt-1 font-semibold text-slate-900">{humanize(selected.source_outcome.release_status)}</dd></div></dl>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="text-lg font-bold text-slate-950">Goals, actions, and milestones</h3>
                  <div className="mt-5 space-y-5">
                    {(selected.goals ?? []).map((goal) => <GoalCard key={goal.uuid} goal={goal} />)}
                  </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-950">Check-in history</h3>
                    <div className="mt-4 space-y-4">
                      {(selected.check_ins ?? []).length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">No check-ins yet. Record the first progress conversation when work begins.</p>}
                      {(selected.check_ins ?? []).map((checkIn) => (
                        <article key={checkIn.uuid} className="border-l-2 border-indigo-200 pl-4">
                          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-900">{humanize(checkIn.actor_role)} check-in</p><time className="text-xs text-slate-500">{formatDateTime(checkIn.submitted_at)}</time></div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{checkIn.summary}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-600">{checkIn.progress_before.toFixed(0)}% → {checkIn.progress_after.toFixed(0)}% · {humanize(checkIn.health_after)}</p>
                          {checkIn.blockers && <p className="mt-2 text-sm text-rose-800"><span className="font-semibold">Blockers:</span> {checkIn.blockers}</p>}
                          {checkIn.support_needed && <p className="mt-2 text-sm text-indigo-800"><span className="font-semibold">Support:</span> {checkIn.support_needed}</p>}
                          <div className="mt-3"><EvidenceList items={checkIn.evidence} /></div>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2"><Fingerprint className="size-5 text-indigo-600" /><h3 className="font-bold text-slate-950">Immutable evidence chain</h3></div>
                    <dl className="mt-4 space-y-3 text-sm">
                      {[
                        ["Outcome evidence", selected.evidence_chain.source_outcome_evidence_hash],
                        ["Release evidence", selected.evidence_chain.source_release_hash],
                        ["Plan definition", selected.evidence_chain.plan_hash],
                        ["Current evidence", selected.evidence_chain.current_evidence_hash],
                      ].map(([label, hash]) => <div key={label}><dt className="font-medium text-slate-600">{label}</dt><dd className="mt-1 break-all rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-800">{hash}</dd></div>)}
                    </dl>
                    <ol className="mt-5 space-y-3">
                      {(selected.events ?? []).map((event) => <li key={event.uuid} className="flex gap-3 text-sm"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">{event.resulting_plan_version}</span><div><p className="font-semibold text-slate-900">{humanize(event.event_type)} by {humanize(event.actor_role)}</p><p className="text-slate-600">{formatDateTime(event.occurred_at)}</p></div></li>)}
                    </ol>
                  </div>
                </section>
              </div>
            )}
          </div>
        </section>
      </div>

      <AlertDialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog?.kind === "COMPLETE" ? "Complete development plan?" : "Record development check-in"}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.kind === "COMPLETE"
                ? "Completion is final and requires every weighted goal to be at 100%. The summary and evidence become immutable."
                : "This records the conversation, item update, and supporting references in the immutable plan timeline."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialog && (
            <div className="space-y-4 py-2">
              {dialog.kind === "CHECK_IN" && (
                <>
                  <label className="text-sm font-medium text-slate-700">Progress item
                    <select value={selectedItemKey} onChange={(event) => selectProgressItem(dialog.plan, event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                      <option value="">Narrative-only check-in</option>
                      {progressItems(dialog.plan).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                    </select>
                  </label>
                  {selectedItemKey && progressItems(dialog.plan).find((item) => item.key === selectedItemKey)?.type === "MILESTONE" ? (
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-800"><input type="checkbox" className="size-4 accent-indigo-600" checked={milestoneCompleted} onChange={(event) => setMilestoneCompleted(event.target.checked)} /> Mark milestone completed</label>
                  ) : selectedItemKey ? (
                    <label className="text-sm font-medium text-slate-700">Progress percentage<Input className="mt-1 min-h-11" type="number" min={0} max={100} step={1} value={itemProgress} onChange={(event) => setItemProgress(Number(event.target.value))} /></label>
                  ) : null}
                </>
              )}
              <label className="text-sm font-medium text-slate-700">{dialog.kind === "COMPLETE" ? "Completion summary" : "Check-in summary"}<Textarea className="mt-1 min-h-28" value={checkInSummary} onChange={(event) => setCheckInSummary(event.target.value)} /></label>
              {dialog.kind === "CHECK_IN" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Blockers (optional)<Textarea className="mt-1 min-h-24" value={blockers} onChange={(event) => setBlockers(event.target.value)} /></label>
                  <label className="text-sm font-medium text-slate-700">Support needed (optional)<Textarea className="mt-1 min-h-24" value={supportNeeded} onChange={(event) => setSupportNeeded(event.target.value)} /></label>
                </div>
              )}
              <EvidenceEditor items={actionEvidence} onChange={setActionEvidence} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700"
              disabled={dialogInvalid || pending}
              onClick={(event) => {
                event.preventDefault();
                if (!dialog) return;
                if (dialog.kind === "CHECK_IN") checkInMutation.mutate(dialog.plan);
                if (dialog.kind === "COMPLETE") completeMutation.mutate(dialog.plan);
              }}
            >
              {pending && <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" />}
              {dialog?.kind === "COMPLETE" ? "Confirm completion" : "Record check-in"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function GoalCard({ goal }: { goal: PerformProDevelopmentGoal }) {
  return (
    <article className="rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-800">{goal.weight.toFixed(0)}% weight</span><span className="text-xs font-semibold text-slate-600">{humanize(goal.owner_role)} owner</span></div><h4 className="mt-2 font-bold text-slate-950">{goal.title}</h4><p className="mt-1 text-sm leading-6 text-slate-600">{goal.description}</p></div>
        <p className="shrink-0 text-sm font-medium text-slate-600">Due {formatDate(goal.target_date)}</p>
      </div>
      <div className="mt-4"><ProgressBar value={goal.progress_percentage} label="Goal progress" /></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div><p className="text-sm font-semibold text-slate-900">Actions</p><ul className="mt-2 space-y-2">{goal.actions.map((action) => <li key={action.uuid} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-900">{action.title}</p><p className="mt-1 text-xs text-slate-600">{humanize(action.action_type)} · {humanize(action.owner_role)} · due {formatDate(action.due_date)}</p></div><span className="text-xs font-semibold tabular-nums text-indigo-700">{action.progress_percentage.toFixed(0)}%</span></div></li>)}</ul></div>
        <div><p className="text-sm font-semibold text-slate-900">Milestones</p><ul className="mt-2 space-y-2">{goal.milestones.map((milestone) => <li key={milestone.uuid} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2">{milestone.status === "COMPLETED" ? <CheckCircle2 className="size-4 text-emerald-700" /> : <CircleDot className="size-4 text-slate-500" />}<div><p className="font-medium text-slate-900">{milestone.title}</p><p className="text-xs text-slate-600">Due {formatDate(milestone.due_date)}</p></div></div><span className="text-xs font-semibold text-slate-700">{humanize(milestone.status)}</span></li>)}</ul></div>
      </div>
    </article>
  );
}
