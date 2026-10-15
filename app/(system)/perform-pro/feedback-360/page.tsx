"use client";

import { showApiError } from "@/lib/error-toast";
import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  MessageCircleMore,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UsersRound,
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
import { performProService } from "@/services/performpro";
import type {
  PerformProFeedback360EligibleReviewer,
  PerformProFeedback360NominationInput,
  PerformProFeedback360Relationship,
  PerformProFeedback360Roster,
} from "@/types/performpro";

const statusStyle: Record<PerformProFeedback360Roster["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  SUBMITTED: "bg-amber-50 text-amber-800 ring-amber-200",
  APPROVED: "bg-sky-50 text-sky-800 ring-sky-200",
  FINALIZED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

const relationshipLabel: Record<PerformProFeedback360Relationship, string> = {
  MANAGER: "Manager",
  PEER: "Peer",
  DIRECT_REPORT: "Direct report",
  CROSS_FUNCTIONAL: "Cross-functional partner",
  INTERNAL_CUSTOMER: "Internal customer",
  OTHER: "Other",
};

function subjectValue(
  roster: PerformProFeedback360Roster,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = roster.subject[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function subjectName(roster: PerformProFeedback360Roster) {
  return subjectValue(roster, ["employee_name", "display_name", "name"])
    ?? roster.subject_employee_uuid;
}

function subjectMeta(roster: PerformProFeedback360Roster) {
  return [
    subjectValue(roster, ["employee_code"]),
    subjectValue(roster, ["department_name", "department"]),
  ].filter(Boolean).join(" · ");
}

function apiMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

function StatusBadge({ status }: { status: PerformProFeedback360Roster["status"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle[status]}`}>
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}

function PolicyCard({ roster }: { roster: PerformProFeedback360Roster }) {
  const policy = roster.policy;
  const countOk = roster.counts.total >= policy.minimum_reviewers
    && roster.counts.total <= policy.maximum_reviewers;
  const peersOk = roster.counts.peers >= policy.minimum_peer_reviewers;

  return (
    <section className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5" aria-labelledby="policy-heading">
      <div className="flex items-start gap-3">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
        <div className="min-w-0">
          <h2 id="policy-heading" className="font-semibold text-brand-950">Bound reviewer policy</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Version {policy.binding_version} · {policy.anonymity_mode.toLowerCase()} responses ·
            form version {policy.review_form_version}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <PolicyMetric
          label="Reviewer count"
          value={`${roster.counts.total} / ${policy.minimum_reviewers}–${policy.maximum_reviewers}`}
          ok={countOk}
        />
        <PolicyMetric
          label="Peer reviewers"
          value={`${roster.counts.peers} / ${policy.minimum_peer_reviewers} minimum`}
          ok={peersOk}
        />
        <PolicyMetric
          label="Identity handling"
          value={policy.anonymity_mode === "IDENTIFIED" ? "Names disclosed" : "Protected in employee view"}
          ok
        />
      </div>
      {policy.anonymity_mode !== "IDENTIFIED" && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-xs leading-5 text-gray-600">
          <LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
          Aggregates remain protected until at least {policy.minimum_anonymous_group_size} eligible responses exist.
        </p>
      )}
    </section>
  );
}

function PolicyMetric({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-xl border border-white bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${ok ? "text-emerald-800" : "text-amber-800"}`}>
        {ok ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : <Clock3 aria-hidden="true" className="h-4 w-4" />}
        {value}
      </p>
    </div>
  );
}

function QueueCard({
  roster,
  selected,
  onSelect,
}: {
  roster: PerformProFeedback360Roster;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-20 w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
        selected
          ? "border-brand-400 bg-brand-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-brand-200 hover:bg-gray-50"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-950">{subjectName(roster)}</p>
          <p className="mt-1 truncate text-xs text-gray-500">{subjectMeta(roster) || roster.cycle_name}</p>
        </div>
        <StatusBadge status={roster.status} />
      </div>
      <p className="mt-3 text-xs font-medium text-gray-600">
        {roster.counts.total} reviewer{roster.counts.total === 1 ? "" : "s"} · {roster.cycle_name}
      </p>
    </button>
  );
}

export default function Feedback360Page() {
  const queryClient = useQueryClient();
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draftOverrides, setDraftOverrides] = useState<
    Record<string, PerformProFeedback360NominationInput[]>
  >({});
  const [relationshipByReviewer, setRelationshipByReviewer] = useState<
    Record<string, PerformProFeedback360Relationship>
  >({});
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  const rostersQuery = useQuery({
    queryKey: ["perform-pro", "feedback360", "rosters"],
    queryFn: performProService.feedback360Rosters,
  });
  const rosters = useMemo(() => rostersQuery.data ?? [], [rostersQuery.data]);
  const selected = rosters.find(
    (roster) => roster.participant_uuid === selectedParticipant,
  ) ?? rosters[0] ?? null;
  const editableSource = selected?.capabilities.is_manager_view ? "MANAGER" : "EMPLOYEE";
  const draftKey = selected
    ? `${selected.participant_uuid}:${editableSource}`
    : "";
  const serverDraft = selected?.nominations
    .filter((nomination) => (
      nomination.nomination_source === editableSource
      && nomination.reviewer_employee_uuid !== null
    ))
    .map((nomination) => ({
      reviewer_employee_uuid: nomination.reviewer_employee_uuid as string,
      relationship_category: nomination.relationship_category,
    })) ?? [];
  const draft = draftOverrides[draftKey] ?? serverDraft;

  function setDraft(next: PerformProFeedback360NominationInput[]) {
    if (!draftKey) return;
    setDraftOverrides((current) => ({ ...current, [draftKey]: next }));
  }

  const eligibleQuery = useQuery({
    queryKey: [
      "perform-pro",
      "feedback360",
      selected?.participant_uuid,
      "eligible-reviewers",
    ],
    queryFn: () => performProService.feedback360EligibleReviewers(
      selected!.participant_uuid,
    ),
    enabled: Boolean(selected?.capabilities.can_nominate),
  });

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (eligibleQuery.data ?? []).filter((candidate) => {
      if (draft.some(
        (item) => item.reviewer_employee_uuid === candidate.employee_uuid,
      )) return false;
      if (!term) return true;
      return `${candidate.display_name} ${candidate.employee_code ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [eligibleQuery.data, draft, search]);

  function updateRoster(next: PerformProFeedback360Roster) {
    queryClient.setQueryData<PerformProFeedback360Roster[]>(
      ["perform-pro", "feedback360", "rosters"],
      (current = []) => current.map((roster) => (
        roster.participant_uuid === next.participant_uuid ? next : roster
      )),
    );
  }

  const saveMutation = useMutation({
    mutationFn: () => performProService.saveFeedback360Nominations(selected!, draft),
    onSuccess: (next) => {
      updateRoster(next);
      setDraftOverrides((current) => {
        const copy = { ...current };
        delete copy[draftKey];
        return copy;
      });
      toast.success("Reviewer nominations saved.");
    },
    onError: (error) => showApiError(error, { fallbackMessage: apiMessage(error, "Unable to save reviewer nominations.") }),
  });

  const transitionMutation = useMutation({
    mutationFn: (action: "submit" | "approve" | "finalize") =>
      performProService.transitionFeedback360Roster(selected!, action),
    onSuccess: (next, action) => {
      updateRoster(next);
      setFinalizeOpen(false);
      toast.success(action === "submit"
        ? "Nominations submitted for manager review."
        : action === "approve"
          ? "Reviewer roster approved."
          : "Reviewer roster finalized; tasks will open with the 360 phase.");
    },
    onError: (error) => {
      setFinalizeOpen(false);
      showApiError(error, { fallbackMessage: apiMessage(error, "Unable to update the reviewer roster.") });
    },
  });

  function addCandidate(candidate: PerformProFeedback360EligibleReviewer) {
    const relationship = relationshipByReviewer[candidate.employee_uuid]
      ?? candidate.relationship_categories[0];
    if (!relationship) return;
    setDraft([
      ...draft,
      {
        reviewer_employee_uuid: candidate.employee_uuid,
        relationship_category: relationship,
      },
    ]);
  }

  if (rostersQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-28 rounded-3xl" />
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Skeleton className="h-[560px] rounded-3xl" />
          <Skeleton className="h-[720px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <header className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/60 to-sky-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-700">
              <MessageCircleMore aria-hidden="true" className="h-4 w-4" />
              PerformPro · 360 feedback
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">
              Reviewer nominations and assignment
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
              Build a balanced reviewer group, resolve relationship conflicts, and freeze a verifiable assignment roster.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white bg-white/80 px-4 py-3 text-sm text-gray-600 shadow-sm">
            <Fingerprint aria-hidden="true" className="h-5 w-5 text-brand-700" />
            Final rosters are hash-certified
          </div>
        </div>
      </header>

      {rostersQuery.isError && (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          {apiMessage(rostersQuery.error, "Unable to load 360-feedback rosters.")}
        </div>
      )}

      {!rostersQuery.isError && rosters.length === 0 && (
        <section className="mt-5 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <UsersRound aria-hidden="true" className="mx-auto h-10 w-10 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No nomination rosters are ready</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
            Enroll participants in a cycle with a 360 phase, then bind both a review form and a 360 feedback policy.
          </p>
        </section>
      )}

      {selected && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-gray-200 bg-gray-50/70 p-4 lg:sticky lg:top-5 lg:h-fit" aria-label="Reviewer roster queue">
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="font-semibold text-gray-950">
                  {selected.capabilities.is_manager_view ? "Team rosters" : "My roster"}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">{rosters.length} participant{rosters.length === 1 ? "" : "s"}</p>
              </div>
              <UsersRound aria-hidden="true" className="h-5 w-5 text-brand-700" />
            </div>
            <div className="space-y-3">
              {rosters.map((roster) => (
                <QueueCard
                  key={roster.participant_uuid}
                  roster={roster}
                  selected={roster.participant_uuid === selected.participant_uuid}
                  onSelect={() => setSelectedParticipant(roster.participant_uuid)}
                />
              ))}
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
                    <UserRoundCheck aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Review subject</p>
                    <h2 className="mt-1 text-xl font-bold text-gray-950">{subjectName(selected)}</h2>
                    <p className="mt-1 text-sm text-gray-500">{subjectMeta(selected) || selected.cycle_name}</p>
                  </div>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <div className="mt-5">
                <PolicyCard roster={selected} />
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="roster-heading">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 id="roster-heading" className="text-lg font-semibold text-gray-950">Reviewer roster</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selected.capabilities.is_manager_view
                      ? "Your edits affect manager nominations; employee selections remain visible for approval."
                      : "Your selections lock when submitted to your manager."}
                  </p>
                </div>
                {selected.capabilities.can_nominate && (
                  <Button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="min-h-11"
                  >
                    <Check aria-hidden="true" className="mr-2 h-4 w-4" />
                    {saveMutation.isPending ? "Saving…" : "Save nominations"}
                  </Button>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {selected.nominations
                  .filter((nomination) => {
                    const editableSource = selected.capabilities.is_manager_view ? "MANAGER" : "EMPLOYEE";
                    return nomination.nomination_source !== editableSource;
                  })
                  .map((nomination) => (
                    <div key={nomination.uuid} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{nomination.display_name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {relationshipLabel[nomination.relationship_category]} · {nomination.nomination_source.toLowerCase()} nomination
                          {nomination.identity_redacted ? " · identity protected" : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                        {nomination.status.toLowerCase()}
                      </span>
                    </div>
                  ))}
                {draft.map((item) => {
                  const candidate = eligibleQuery.data?.find(
                    (entry) => entry.employee_uuid === item.reviewer_employee_uuid,
                  );
                  return (
                    <div key={item.reviewer_employee_uuid} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {candidate?.display_name ?? item.reviewer_employee_uuid}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{relationshipLabel[item.relationship_category]}</p>
                      </div>
                      {selected.capabilities.can_nominate && (
                        <button
                          type="button"
                        onClick={() => setDraft(draft.filter(
                          (entry) => entry.reviewer_employee_uuid !== item.reviewer_employee_uuid,
                        ))}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                          aria-label={`Remove ${candidate?.display_name ?? "reviewer"}`}
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {selected.nominations.length === 0 && draft.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                    No reviewers have been nominated yet.
                  </p>
                )}
              </div>
            </section>

            {selected.capabilities.can_nominate && (
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="eligible-heading">
                <div>
                  <h2 id="eligible-heading" className="text-lg font-semibold text-gray-950">Eligible reviewers</h2>
                  <p className="mt-1 text-sm text-gray-500">Only active employees enrolled in this cycle are shown.</p>
                </div>
                <div className="relative mt-4">
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="min-h-11 pl-10"
                    placeholder="Search by name or employee code"
                    aria-label="Search eligible reviewers"
                  />
                </div>
                {eligibleQuery.isLoading ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {candidates.map((candidate) => {
                      const selectedRelationship = relationshipByReviewer[candidate.employee_uuid]
                        ?? candidate.relationship_categories[0];
                      return (
                        <article key={candidate.employee_uuid} className="rounded-2xl border border-gray-200 p-4">
                          <p className="font-semibold text-gray-950">{candidate.display_name}</p>
                          <p className="mt-1 text-xs text-gray-500">{candidate.employee_code || "Enrolled employee"}</p>
                          <label className="mt-3 block text-xs font-semibold text-gray-700">
                            Relationship
                            <select
                              value={selectedRelationship}
                              onChange={(event) => setRelationshipByReviewer((current) => ({
                                ...current,
                                [candidate.employee_uuid]: event.target.value as PerformProFeedback360Relationship,
                              }))}
                              className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
                            >
                              {candidate.relationship_categories.map((relationship) => (
                                <option key={relationship} value={relationship}>{relationshipLabel[relationship]}</option>
                              ))}
                            </select>
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addCandidate(candidate)}
                            disabled={!candidate.eligible || !selectedRelationship}
                            className="mt-3 min-h-11 w-full"
                          >
                            <Plus aria-hidden="true" className="mr-2 h-4 w-4" /> Add reviewer
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="workflow-heading">
              <div className="flex items-start gap-3">
                <FileCheck2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-brand-700" />
                <div>
                  <h2 id="workflow-heading" className="font-semibold text-gray-950">Approval and evidence</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Finalization freezes the exact policy, review form, relationships, and reviewer identities used for task assignment.
                  </p>
                </div>
              </div>
              {selected.evidence ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5" /> Certified roster evidence
                  </p>
                  <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div><dt className="text-emerald-700">Evidence ID</dt><dd className="mt-1 break-all font-mono text-emerald-950">{selected.evidence.uuid}</dd></div>
                    <div><dt className="text-emerald-700">Roster hash</dt><dd className="mt-1 break-all font-mono text-emerald-950">{selected.evidence.roster_hash}</dd></div>
                  </dl>
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap gap-3">
                  {selected.capabilities.can_submit && (
                    <Button
                      type="button"
                      onClick={() => transitionMutation.mutate("submit")}
                      disabled={transitionMutation.isPending}
                      className="min-h-11"
                    >
                      Submit to manager
                    </Button>
                  )}
                  {selected.capabilities.can_approve && (
                    <Button
                      type="button"
                      onClick={() => transitionMutation.mutate("approve")}
                      disabled={transitionMutation.isPending}
                      className="min-h-11"
                    >
                      Approve roster
                    </Button>
                  )}
                  {selected.capabilities.can_finalize && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFinalizeOpen(true)}
                      disabled={transitionMutation.isPending}
                      className="min-h-11 border-brand-300 text-brand-800"
                    >
                      <LockKeyhole aria-hidden="true" className="mr-2 h-4 w-4" />
                      Finalize assignments
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <AlertDialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize this reviewer roster?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates immutable evidence and locks every reviewer identity and relationship. Reviewer tasks will be generated from this evidence when the 360 phase opens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => transitionMutation.mutate("finalize")}
              disabled={transitionMutation.isPending}
            >
              Finalize roster
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
