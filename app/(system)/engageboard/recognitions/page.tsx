"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";
import { RecognitionForm } from "@/components/engageboard/RecognitionForm";
import { RecognitionCard } from "@/components/engageboard/RecognitionCard";
import { LeaderboardWidget } from "@/components/engageboard/LeaderboardWidget";
import {
  engageBoardRecognitionsService,
  resolveClientGiverRole,
} from "@/services/engageboard-recognitions.service";

const RECOGNITION_BADGES_MANAGE_PERMISSION = "engageboard.recognition.badges.manage";

/**
 * Recognitions — GET/POST /engageboard/recognitions (RecognitionController).
 * "Recent recognition feed" is the caller's own given/received recognitions
 * (that's all this endpoint ever returns — see RecognitionController::index()'s
 * givenOrReceivedBy() scope, and LeaderboardWidget's docblock for why a true
 * company-wide leaderboard is a separate, permission-gated widget instead).
 */
export default function RecognitionsPage() {
  const roles = useAppSelector((s) => s.auth.roles);
  const permissions = useAppSelector((s) => s.auth.permissions);
  const currentUserName = useAppSelector((s) => s.auth.user?.name);

  const giverRole = resolveClientGiverRole(roles);
  const canViewCompanyWideLeaderboard = permissions.includes(RECOGNITION_BADGES_MANAGE_PERMISSION);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["engageboard", "recognitions", "list"],
    queryFn: () => engageBoardRecognitionsService.list({ per_page: 20 }),
    staleTime: 30_000,
  });

  const recognitions = data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            EngageBoard · Recognitions
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Recognitions</h1>
          <p className="text-sm text-gray-500">Celebrate great work — give and track recognitions.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/engageboard/recognitions/badges">Manage badges</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <RecognitionForm
            giverRole={giverRole}
            currentUserName={currentUserName}
            onGiven={() => refetch()}
          />

          <div>
            <h2 className="mb-2 text-sm font-semibold text-brand-900">Your recent recognitions</h2>

            {isLoading && (
              <div className="flex flex-col gap-3">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            )}

            {isError && (
              <p className="text-sm text-gray-500">Could not load recognitions. Please refresh.</p>
            )}

            {!isLoading && !isError && recognitions.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <Award className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                <p className="text-sm text-gray-500">
                  No recognitions yet. Give one above to get things started.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {recognitions.map((recognition) => (
                <RecognitionCard key={recognition.uuid} recognition={recognition} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <LeaderboardWidget canViewCompanyWide={canViewCompanyWideLeaderboard} />
        </div>
      </div>
    </div>
  );
}
