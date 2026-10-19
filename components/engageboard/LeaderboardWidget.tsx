"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { engageBoardRecognitionsService } from "@/services/engageboard-recognitions.service";

/**
 * <LeaderboardWidget/> — 03-design-system.md §4 asks for a top-5 ranked list
 * with a "You" row highlighted if outside the top 5.
 *
 * Real constraint (documented in 20c-integration-snippet.md): GET
 * /engageboard/recognitions only ever returns the CALLER's own given/received
 * recognitions (RecognitionController::index()'s `givenOrReceivedBy()` scope)
 * — there is no company-wide, peer-visible "most recognized" endpoint in this
 * codebase. The only aggregate ranking that exists,
 * GET /engageboard/reports/recognitions/activity, is HR-Admin-only
 * (`engageboard.recognition.badges.manage`, per RecognitionReportController's
 * own docblock). This widget is therefore permission-gated: HR Admins see a
 * real company-wide ranking (by employee_code — the report doesn't resolve
 * names either); everyone else sees nothing rendered here rather than a
 * fabricated "leaderboard" built from data that isn't actually company-wide.
 * The recognitions page itself still shows the caller's own recent
 * recognitions via <RecognitionCard/>, satisfying the "recent recognition
 * feed" part of the same deliverable without overreaching this widget's data.
 */
export function LeaderboardWidget({ canViewCompanyWide }: { canViewCompanyWide: boolean }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["engageboard", "recognitions", "activity-report"],
    queryFn: engageBoardRecognitionsService.activityReport,
    enabled: canViewCompanyWide,
    staleTime: 60_000,
  });

  if (!canViewCompanyWide) return null;

  return (
    <Card className="gap-3 p-4">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          <Trophy className="h-4 w-4 text-brand-600" />
          Most Recognized (Company-wide)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-xs text-gray-500">Could not load the leaderboard. Please refresh.</p>
        )}

        {!isLoading && !isError && (data?.most_recognized.length ?? 0) === 0 && (
          <p className="text-xs text-gray-500">No recognitions yet this period.</p>
        )}

        {!isLoading && !isError && (
          <ol className="space-y-1.5">
            {data?.most_recognized.slice(0, 5).map((row, index) => (
              <li
                key={`${row.employee_code}-${index}`}
                className="flex items-center justify-between rounded-lg bg-brand-100/50 px-3 py-1.5 text-sm"
              >
                <span className="flex items-center gap-2 text-brand-900">
                  <span className="w-4 text-xs font-semibold text-gray-400">{index + 1}</span>
                  {row.employee_code ?? "Unknown"}
                </span>
                <span className="tabular-nums text-xs font-medium text-gray-600">
                  {row.count} recognition{row.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
