"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardList,
  Gauge,
  Megaphone,
  Newspaper,
  PartyPopper,
  Wallet,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";
import { EnpsScoreGauge } from "@/components/engageboard/eNPSScoreGauge";
import { PointsWallet } from "@/components/engageboard/PointsWallet";
import { FeedPost } from "@/components/engageboard/FeedPost";
import { LeaderboardWidget } from "@/components/engageboard/LeaderboardWidget";
import { enpsService } from "@/services/engageboard-enps.service";
import { engageboardPointsService } from "@/services/engageboard-points.service";
import { engageBoardFeedService } from "@/services/engageboard-feed.service";

const RECOGNITION_BADGES_MANAGE_PERMISSION = "engageboard.recognition.badges.manage";
const VIEW_ANY_WALLETS_PERMISSION = "engageboard.points.wallets.view-any";

const QUICK_LINKS = [
  { href: "/engageboard/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/engageboard/enps", label: "eNPS", icon: Gauge },
  { href: "/engageboard/points", label: "Points & Rewards", icon: Wallet },
  { href: "/engageboard/feed", label: "Company Feed", icon: Newspaper },
  { href: "/engageboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/engageboard/celebrations", label: "Celebrations", icon: PartyPopper },
];

/**
 * /engageboard — the landing dashboard (03-design-system.md §3.2 row 1).
 *
 * Deliberately NOT built by any of the three G20 sub-nodes (G20-A/B/C) — it's
 * the one route whose data spans all three, so it was reserved for the
 * orchestrating session to assemble centrally after all three merged, same
 * pattern as the route-mount/policy-registration integration steps on the
 * backend side. Every widget below reuses an already-reviewed component
 * verbatim (EnpsScoreGauge, PointsWallet, FeedPost, LeaderboardWidget) rather
 * than re-implementing their rendering — this page is composition only.
 */
export default function EngageBoardDashboard() {
  const permissions = useAppSelector((s) => s.auth.permissions);
  const canViewCompanyWideLeaderboard = permissions.includes(RECOGNITION_BADGES_MANAGE_PERMISSION);
  const canViewTopEarners = permissions.includes(VIEW_ANY_WALLETS_PERMISSION);

  const { data: enpsDashboard, isLoading: enpsLoading } = useQuery({
    queryKey: ["engageboard", "enps", "dashboard"],
    queryFn: enpsService.getDashboard,
    staleTime: 60_000,
  });

  const { data: pointsAccount, isLoading: pointsLoading } = useQuery({
    queryKey: ["engageboard", "points", "my-account"],
    queryFn: engageboardPointsService.getMyAccount,
    staleTime: 60_000,
  });

  const { data: feedPage, isLoading: feedLoading, isError: feedError } = useQuery({
    queryKey: ["engageboard", "feed", "preview"],
    queryFn: () => engageBoardFeedService.list({ per_page: 3 }),
    staleTime: 60_000,
  });

  const { data: topEarners, isLoading: topEarnersLoading } = useQuery({
    queryKey: ["engageboard", "points", "top-earners"],
    queryFn: () => engageboardPointsService.getTopEarners(5),
    enabled: canViewTopEarners,
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col gap-5 bg-brand-100/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">EngageBoard</nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Engagement pulse, points and rewards, and what&apos;s happening across the company.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-xs transition-colors hover:bg-brand-100/50 hover:text-brand-900"
          >
            <Icon className="h-4 w-4 text-gray-400" />
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Engagement (eNPS)</h2>
            <Link href="/engageboard/enps" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
              View trends <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {enpsLoading || !enpsDashboard ? (
            <div className="h-[300px] animate-pulse rounded-2xl bg-white/60" />
          ) : (
            <EnpsScoreGauge
              score={enpsDashboard.current_score?.enps_score ?? null}
              delta={enpsDashboard.delta}
              participation={enpsDashboard.participation}
              suppressed={enpsDashboard.current_score?.suppressed}
            />
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Recognition</h2>
            <Link href="/engageboard/recognitions" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
              Give recognition <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <LeaderboardWidget canViewCompanyWide={canViewCompanyWideLeaderboard} />
          {!canViewCompanyWideLeaderboard && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-xs">
              <p className="text-sm text-gray-500">
                Recognize a teammate to see their story on the company feed.
              </p>
              <Link
                href="/engageboard/recognitions"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
              >
                Give recognition <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">My Points Wallet</h2>
          <Link href="/engageboard/points" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
            View wallet <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <PointsWallet account={pointsAccount} isLoading={pointsLoading} />
      </div>

      {canViewTopEarners && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Top Earners (company-wide)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {topEarnersLoading || !topEarners ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-white/60" />)
            ) : topEarners.top_earners.length > 0 ? (
              topEarners.top_earners.map((row, i) => (
                <div key={row.employee_code ?? i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 text-xs font-semibold tabular-nums text-gray-400">#{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-brand-900">{row.employee_name}</span>
                  <span className="text-xs uppercase tracking-wide text-gray-400">{row.tier_level}</span>
                  <span className="text-sm tabular-nums text-gray-700">
                    {row.lifetime_earned.toLocaleString()} pts
                  </span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No earning activity yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Recent on the Company Feed</h2>
          <Link href="/engageboard/feed" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {feedError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              Could not load the company feed. Please refresh.
            </div>
          )}
          {feedLoading || !feedPage ? (
            [...Array(2)].map((_, i) => <div key={i} className="h-[140px] animate-pulse rounded-2xl bg-white/60" />)
          ) : feedPage.data.length > 0 ? (
            feedPage.data.map((post) => <FeedPost key={post.uuid} post={post} />)
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No posts yet —{" "}
              <Link href="/engageboard/feed/compose" className="font-medium text-brand-700 hover:underline">
                share the first update
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
