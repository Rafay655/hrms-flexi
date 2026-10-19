"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Rocket, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnpsScoreGauge } from "@/components/engageboard/eNPSScoreGauge";
import { SegmentBreakdown } from "@/components/engageboard/SegmentBreakdown";
import { pulseCheckService } from "@/services/engageboard-pulsecheck.service";
import { enpsService } from "@/services/engageboard-enps.service";

/**
 * `/engageboard/enps/campaigns/[uuid]` — scores, `<SegmentBreakdown/>`,
 * open-text feedback. `GET .../scores` (EB-ENPS-010) already returns the
 * company-level row plus every segment row through `EnpsScoreResource`
 * (suppressed rows marked, never omitted). Open-text feedback comes from the
 * underlying survey's free-text analytics (SurveyAnalyticsController,
 * question_type 'text') — the eNPS campaign auto-creates its Survey per
 * ADR-001, so this reuses the same PulseCheck analytics endpoint rather than
 * duplicating a feedback query.
 */
export default function EnpsCampaignDetailPage() {
  const params = useParams<{ uuid: string }>();
  const uuid = params.uuid;
  const queryClient = useQueryClient();

  const { data: campaign, isLoading, isError } = useQuery({
    queryKey: ["engageboard", "enps", "campaigns", uuid],
    queryFn: () => enpsService.getCampaign(uuid),
    staleTime: 30_000,
  });

  const { data: scores } = useQuery({
    queryKey: ["engageboard", "enps", "campaigns", uuid, "scores"],
    queryFn: () => enpsService.getCampaignScores(uuid),
    enabled: !!campaign && campaign.survey.status !== "draft",
  });

  const surveyUuid = campaign?.survey.uuid;
  const { data: analytics } = useQuery({
    queryKey: ["engageboard", "surveys", surveyUuid, "analytics"],
    queryFn: () => pulseCheckService.getAnalytics(surveyUuid as string),
    enabled: !!surveyUuid && campaign?.survey.status !== "draft",
  });

  const launchMutation = useMutation({
    mutationFn: () => enpsService.launchCampaign(uuid),
    onSuccess: (result) => {
      toast.success(`Campaign launched — ${result.invitations_created} invitation(s) sent.`);
      queryClient.invalidateQueries({ queryKey: ["engageboard", "enps", "campaigns", uuid] });
    },
    onError: () => toast.error("Could not launch this campaign."),
  });

  const closeMutation = useMutation({
    mutationFn: () => enpsService.closeCampaign(uuid),
    onSuccess: () => {
      toast.success("Campaign closed and scores calculated.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "enps", "campaigns", uuid] });
      queryClient.invalidateQueries({ queryKey: ["engageboard", "enps", "campaigns", uuid, "scores"] });
    },
    onError: () => toast.error("Could not close this campaign."),
  });

  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        Could not load this campaign. Please refresh.
      </div>
    );
  }

  if (isLoading || !campaign) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  const companyScore = scores?.find((s) => s.segment_type === "company");
  const segmentScores = scores?.filter((s) => s.segment_type !== "company") ?? [];
  const feedbackRows = (analytics ?? []).filter((row) => row.comments && row.comments.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">EngageBoard · eNPS</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{campaign.survey.title}</h1>
          <p className="mt-1 text-xs text-gray-400">
            {campaign.frequency ?? "ad hoc"} · {campaign.survey.status}
          </p>
        </div>
        <div className="flex gap-2">
          {campaign.survey.status === "draft" && (
            <Button onClick={() => launchMutation.mutate()} disabled={launchMutation.isPending}>
              <Rocket className="mr-1.5 h-4 w-4" /> {launchMutation.isPending ? "Launching..." : "Launch"}
            </Button>
          )}
          {campaign.survey.status === "published" && (
            <Button variant="outline" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              <XCircle className="mr-1.5 h-4 w-4" /> {closeMutation.isPending ? "Closing..." : "Close & Calculate"}
            </Button>
          )}
        </div>
      </div>

      {campaign.survey.status === "draft" ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
          Scores and segment breakdowns are available once this campaign is launched and closed.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <EnpsScoreGauge
            score={companyScore && !companyScore.suppressed ? Number(companyScore.enps_score) : null}
            delta={companyScore?.delta_vs_previous}
            participation={companyScore?.participation_rate}
            suppressed={!companyScore || companyScore.suppressed}
          />
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Segment Breakdown</h2>
            <SegmentBreakdown scores={segmentScores} />
          </div>
        </div>
      )}

      {campaign.survey.status !== "draft" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-semibold text-gray-800">Open-Text Feedback</h2>
          {feedbackRows.length > 0 ? (
            <div className="flex flex-col gap-3">
              {feedbackRows.map((row) => (
                <div key={row.question_id}>
                  <p className="mb-1 text-xs font-medium text-gray-500">{row.question_text}</p>
                  <ul className="flex flex-col gap-1.5">
                    {(row.comments ?? []).map((c, i) => (
                      <li key={i} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        &ldquo;{c}&rdquo;
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No open-text feedback for this campaign.</p>
          )}
        </div>
      )}
    </div>
  );
}
