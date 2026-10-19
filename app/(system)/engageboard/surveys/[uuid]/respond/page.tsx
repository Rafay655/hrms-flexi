"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SurveyResponseForm } from "@/components/engageboard/SurveyResponseForm";
import { pulseCheckService } from "@/services/engageboard-pulsecheck.service";
import type { SubmitSurveyResponseAnswer } from "@/types/engageboard-pulsecheck.types";

/**
 * Suppresses the shared `<Breadcrumb/>` for this one page only, without
 * editing `components/shared/Breadcrumb.tsx` or `app/(system)/layout.tsx`
 * (both out of this node's file-scope allow-list — see 20a brief). The
 * layout renders Breadcrumb unconditionally as a sibling ABOVE `{children}`,
 * with no prop/context hook exposed to suppress it from a page — so this
 * hides its rendered DOM node via a scoped inline `<style>` tag matched by
 * its own unique class combination, rather than editing Breadcrumb itself.
 *
 * Round-1 review, Defect 3 (fixed): the original version used a
 * `useEffect`-based DOM query to set `display: none`, which only runs
 * post-paint (after hydration) — a real anonymous respondent on a slow
 * mobile connection (the realistic case for an emailed survey link) briefly
 * saw the full sidebar/header/logout button before JS caught up. A `<style>`
 * tag rendered as static JSX has no such gap: it ships inside the initial
 * server-rendered HTML and the browser applies it while parsing that HTML,
 * before any hydration or JS execution — same technique, synchronous
 * instead of post-paint. Mounts/unmounts with this component like the old
 * effect did, so no other route is ever affected.
 */
function SuppressBreadcrumb() {
  return <style>{`nav.text-muted-foreground.mb-3 { display: none !important; }`}</style>;
}

function SurveyRespondPageContent() {
  const params = useParams<{ uuid: string }>();
  const searchParams = useSearchParams();
  const uuid = params.uuid;
  const token = searchParams.get("token") ?? "";
  const [submitted, setSubmitted] = useState(false);

  const { data: survey, isLoading, isError, error } = useQuery({
    queryKey: ["engageboard", "surveys", uuid, "respond", token],
    queryFn: () => pulseCheckService.getRespondSurvey(uuid, token),
    enabled: !!token,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (answers: SubmitSurveyResponseAnswer[]) =>
      pulseCheckService.submitResponse(uuid, { token, answers }),
    onSuccess: () => setSubmitted(true),
  });

  const errorMessage =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any)?.response?.data?.message ?? "This survey link is invalid or has expired.";
  const submitErrorMessage =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (submitMutation.error as any)?.response?.data?.message ?? "Could not submit your response. Please try again.";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <SuppressBreadcrumb />
      <div className="w-full max-w-xl">
        {!token ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center text-sm text-red-700" role="alert">
            This survey link is missing its access token.
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center text-sm text-red-700" role="alert">
            {errorMessage}
          </div>
        ) : submitted ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="text-base font-semibold text-emerald-800">Thank you — your response has been submitted.</p>
            <p className="text-sm text-emerald-700">You can now close this page.</p>
          </div>
        ) : survey ? (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-brand-900">{survey.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Your responses are {survey.anonymity.replace("_", " ")}.</p>
            </div>
            {submitMutation.isError && (
              <p role="alert" className="text-center text-sm text-red-600">
                {submitErrorMessage}
              </p>
            )}
            <SurveyResponseForm
              survey={survey}
              onSubmit={(answers) => submitMutation.mutate(answers)}
              submitting={submitMutation.isPending}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Page export — useSearchParams() must be inside <Suspense> (Next.js requirement) ──
export default function SurveyRespondPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-700" aria-label="Loading survey…" />
        </div>
      }
    >
      <SurveyRespondPageContent />
    </Suspense>
  );
}
