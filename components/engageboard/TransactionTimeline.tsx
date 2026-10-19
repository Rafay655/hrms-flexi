"use client";

import {
  Award,
  Cake,
  ClipboardCheck,
  Gift,
  GraduationCap,
  Loader2,
  PartyPopper,
  Target,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PointTransaction, SourceType, TransactionType } from "@/types/engageboard-points.types";

/**
 * <TransactionTimeline/> — EB-PTS-036 (03-design-system.md §4).
 *
 * "New — no direct timeline precedent found in this codebase; use a simple
 * flex-column with left-aligned icon + right-aligned amount, not a heavier
 * timeline library." Icon-per-row keyed off `source_type`, the real enum verified
 * against backend/database/migrations/2026_08_21_000002_create_point_transactions_table.php
 * (recognition/survey/birthday/anniversary/goal/manual/redemption/referral/training)
 * — not the shorter illustrative list ("recognition/survey/birthday/redemption/etc.")
 * quoted in the design doc's component-spec prose.
 */

const SOURCE_ICON: Record<SourceType, LucideIcon> = {
  recognition: Award,
  survey: ClipboardCheck,
  birthday: Cake,
  anniversary: PartyPopper,
  goal: Target,
  manual: UserCog,
  redemption: Gift,
  referral: Users,
  training: GraduationCap,
};

const SOURCE_LABEL: Record<SourceType, string> = {
  recognition: "Recognition",
  survey: "Survey completion",
  birthday: "Birthday",
  anniversary: "Work anniversary",
  goal: "Goal achieved",
  manual: "Manual adjustment",
  redemption: "Reward redemption",
  referral: "Referral hired",
  training: "Training completed",
};

const TYPE_TONE: Record<TransactionType, string> = {
  earn: "text-emerald-600",
  redeem: "text-red-600",
  expire: "text-red-600",
  adjust: "text-gray-600",
  transfer: "text-gray-600",
};

function formatAmount(t: PointTransaction): string {
  const sign = t.amount > 0 ? "+" : "";
  return `${sign}${t.amount.toLocaleString()}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function TransactionTimeline({
  transactions,
  isLoading,
  hasMore,
  onLoadMore,
  loadingMore,
}: {
  transactions: PointTransaction[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white/60" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-gray-600">No transactions yet.</p>
        <p className="mt-1 text-xs text-gray-400">
          Points you earn from recognitions, surveys, and milestones will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {transactions.map((t) => {
          const Icon = SOURCE_ICON[t.source_type];
          return (
            <li key={t.uuid} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brand-900">
                  {SOURCE_LABEL[t.source_type]}
                  {t.gifted_by_id && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Gifted
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {t.note || "—"} · {formatDate(t.transaction_date)}
                  {t.expires_at && ` · expires ${formatDate(t.expires_at)}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-semibold tabular-nums ${TYPE_TONE[t.transaction_type]}`}>
                  {formatAmount(t)}
                </p>
                <p className="text-[11px] tabular-nums text-gray-400">Bal. {t.balance_after.toLocaleString()}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <Button variant="outline" onClick={onLoadMore} disabled={loadingMore} className="self-center">
          {loadingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
            </>
          ) : (
            "Load more"
          )}
        </Button>
      )}
    </div>
  );
}
