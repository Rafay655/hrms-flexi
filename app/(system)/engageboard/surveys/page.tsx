"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { pulseCheckService } from "@/services/engageboard-pulsecheck.service";
import type { SurveyStatus } from "@/types/engageboard-pulsecheck.types";

/**
 * Participation % is not part of `SurveyResource` (the list endpoint's own
 * payload) — it's a separate authenticated call
 * (`GET /surveys/{uuid}/participation`, EB-SUR-020). Fetched per-row here
 * (only for published/closed surveys, where the number is meaningful) rather
 * than fabricated, per this node's "no mock data" acceptance criterion.
 */
function ParticipationBadge({ uuid, status }: { uuid: string; status: SurveyStatus }) {
  const enabled = status === "published" || status === "closed";
  const { data } = useQuery({
    queryKey: ["engageboard", "surveys", uuid, "participation"],
    queryFn: () => pulseCheckService.getParticipation(uuid),
    enabled,
    staleTime: 30_000,
  });

  if (!enabled) return null;

  return (
    <span className="hidden w-24 shrink-0 text-right text-xs tabular-nums text-gray-400 sm:block">
      {data ? `${data.rate}% responded` : "..."}
    </span>
  );
}

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

const STATUS_TONES: Record<SurveyStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-emerald-100 text-emerald-800",
  closed: "bg-brand-100 text-brand-800",
  archived: "bg-gray-100 text-gray-400",
};

/** GET /engageboard/surveys — 05-api-contract.md PulseCheck row 2. */
export default function SurveysListPage() {
  const [status, setStatus] = useState<string>("");

  const { data: surveys, isLoading, isError } = useQuery({
    queryKey: ["engageboard", "surveys", status],
    queryFn: () => pulseCheckService.getSurveys(status ? { status } : undefined),
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">EngageBoard · PulseCheck</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Surveys</h1>
          <p className="text-sm text-gray-500">Pulse surveys, onboarding/exit checks and custom questionnaires.</p>
        </div>
        <Link
          href="/engageboard/surveys/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New Survey
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["", "draft", "published", "closed", "archived"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              status === s ? "bg-brand-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s ? STATUS_LABELS[s as SurveyStatus] : "All"}
          </button>
        ))}
      </div>

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load surveys. Please refresh.
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[56px] animate-pulse rounded-xl bg-gray-50" />
            ))}
          </div>
        ) : surveys && surveys.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {surveys.map((survey) => (
              <Link
                key={survey.uuid}
                href={`/engageboard/surveys/${survey.uuid}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-brand-100/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-900">{survey.title}</p>
                  <p className="text-xs text-gray-400">
                    {survey.survey_type} · {survey.anonymity.replace("_", " ")}
                  </p>
                </div>
                <ParticipationBadge uuid={survey.uuid} status={survey.status} />
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONES[survey.status]}`}>
                  {STATUS_LABELS[survey.status]}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-gray-500">No surveys yet. Create your first pulse survey to start measuring engagement.</p>
            <Link
              href="/engageboard/surveys/new"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> New Survey
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
