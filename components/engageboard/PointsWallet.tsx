"use client";

import { Award, Clock, Wallet } from "lucide-react";
import type { PointAccount, TierLevel } from "@/types/engageboard-points.types";

/**
 * <PointsWallet/> — EB-PTS-034 (03-design-system.md §4).
 *
 * KPI-card pattern copied from the cited precedent, frontend/app/(system)/loan-hub/page.tsx's
 * `Kpi()` (rounded-2xl border border-gray-100 bg-white p-5 shadow-xs), swapped for
 * balance/tier. Tier badge uses the muted/metallic `--engageboard-tier-*` tokens added
 * to globals.css by G03 (already present, not re-added here per this node's brief).
 *
 * Tier thresholds (lifetime_earned, for the "progress to next tier" bar) are NOT
 * exposed by any PointsLedger endpoint — they are a private backend constant,
 * PointsEngine::TIER_THRESHOLDS (backend/app/Services/EngageBoard/PointsLedger/PointsEngine.php),
 * mirrored here from direct source inspection (bronze 0 / silver 500 / gold 2000 /
 * platinum 5000). If that constant changes on the backend, this copy will silently
 * drift — flagged in docs/engageboard/graph/20b-integration-snippet.md.
 */

const TIER_THRESHOLDS: Record<TierLevel, number> = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
};

const TIER_ORDER: TierLevel[] = ["bronze", "silver", "gold", "platinum"];

const TIER_LABEL: Record<TierLevel, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const TIER_TOKEN_CLASS: Record<TierLevel, string> = {
  bronze: "bg-engageboard-tier-bronze text-white",
  silver: "bg-engageboard-tier-silver text-brand-900",
  gold: "bg-engageboard-tier-gold text-brand-900",
  platinum: "bg-engageboard-tier-platinum text-white",
};

function nextTierProgress(tier: TierLevel, lifetimeEarned: number) {
  const idx = TIER_ORDER.indexOf(tier);
  const nextTier = TIER_ORDER[idx + 1];
  if (!nextTier) {
    return { nextTier: null as TierLevel | null, pct: 100, remaining: 0 };
  }
  const floor = TIER_THRESHOLDS[tier];
  const ceiling = TIER_THRESHOLDS[nextTier];
  const pct = Math.min(100, Math.round(((lifetimeEarned - floor) / (ceiling - floor)) * 100));
  return { nextTier, pct: Math.max(0, pct), remaining: Math.max(0, ceiling - lifetimeEarned) };
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <p className="mt-3 text-2xl font-semibold leading-none tracking-tight tabular-nums text-brand-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

export function PointsWallet({ account, isLoading }: { account?: PointAccount; isLoading?: boolean }) {
  if (isLoading || !account) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[116px] animate-pulse rounded-2xl bg-white/60" />
        ))}
      </div>
    );
  }

  const { nextTier, pct, remaining } = nextTierProgress(account.tier, account.lifetime_earned);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Wallet}
          label="Available Balance"
          value={account.available_balance.toLocaleString()}
          tone="bg-brand-800 text-white"
        />
        <KpiCard
          icon={Clock}
          label="Reserved (pending redemptions)"
          value={account.reserved_balance.toLocaleString()}
          tone="bg-[#EEC293] text-brand-900"
        />
        <KpiCard
          icon={Award}
          label="Lifetime Earned"
          value={account.lifetime_earned.toLocaleString()}
          tone="bg-emerald-500 text-white"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${TIER_TOKEN_CLASS[account.tier]}`}
            >
              {TIER_LABEL[account.tier]} tier
            </span>
            <span className="text-xs text-gray-500">
              {account.lifetime_earned.toLocaleString()} lifetime points earned
            </span>
          </div>
          {nextTier && (
            <span className="text-xs font-medium text-gray-500">
              {remaining.toLocaleString()} points to {TIER_LABEL[nextTier]}
            </span>
          )}
        </div>
        {nextTier ? (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-brand-700 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-500">You&apos;ve reached the highest tier.</p>
        )}
        <span className="sr-only">
          {nextTier
            ? `${pct}% of the way from ${TIER_LABEL[account.tier]} to ${TIER_LABEL[nextTier]} tier.`
            : "You have reached the highest tier, Platinum."}
        </span>
      </div>
    </div>
  );
}
