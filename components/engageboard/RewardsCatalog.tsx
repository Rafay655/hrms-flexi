"use client";

import { Gift, Loader2, Lock, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { RewardCategory, RewardsCatalogItem, TierLevel } from "@/types/engageboard-points.types";

/**
 * <RewardsCatalog/> — EB-PTS-035 (03-design-system.md §4).
 *
 * "Card grid (shadcn Card), tier-lock shown as a disabled state with an explicit
 * 'Requires Gold tier' label (never just greyed out with no explanation)."
 *
 * IMPORTANT — verified backend behavior, not an assumption: `GET /points/catalog`
 * (RewardsCatalogController::index()) already filters OUT any item the caller's own
 * tier doesn't qualify for — see backend/app/Http/Controllers/EngageBoard/PointsLedger/RewardsCatalogController.php.
 * A normal employee's response therefore never actually contains a locked item. The
 * tier-lock check below is kept anyway (comparing each item's real `eligible_tiers`
 * against the caller's own tier from `/points/account`) so the component is correct
 * per its spec and defends against any future change to that filtering — but in the
 * catalog's current shipped behavior this branch will rarely if ever render. Flagged
 * in docs/engageboard/graph/20b-integration-snippet.md.
 */

const TIER_ORDER: TierLevel[] = ["bronze", "silver", "gold", "platinum"];
const TIER_LABEL: Record<TierLevel, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const CATEGORY_LABEL: Record<RewardCategory, string> = {
  voucher: "Voucher",
  time_off: "Time Off",
  gift: "Gift",
  experience: "Experience",
  recognition_item: "Recognition Item",
};

function minEligibleTier(tiers: TierLevel[]): TierLevel | null {
  const sorted = [...tiers].sort((a, b) => TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b));
  return sorted[0] ?? null;
}

export function RewardsCatalog({
  items,
  userTier,
  userBalance,
  onRedeem,
  redeemingUuid,
  isLoading,
}: {
  items: RewardsCatalogItem[];
  userTier?: TierLevel;
  userBalance?: number;
  onRedeem: (item: RewardsCatalogItem) => void;
  redeemingUuid?: string | null;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/60" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-gray-600">No rewards available yet.</p>
        <p className="mt-1 text-xs text-gray-400">Check back soon, or ask HR to add items to the catalog.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isLocked = !!userTier && !item.eligible_tiers.includes(userTier);
        const requiredTier = isLocked ? minEligibleTier(item.eligible_tiers) : null;
        const isOutOfStock = !item.in_stock;
        const insufficientPoints = userBalance !== undefined && userBalance < item.points_required;
        const disabled = isLocked || isOutOfStock || redeemingUuid === item.uuid;
        const isRedeeming = redeemingUuid === item.uuid;

        return (
          <Card key={item.uuid} className={`flex flex-col ${isLocked || isOutOfStock ? "opacity-70" : ""}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{item.name}</CardTitle>
                <Badge variant="outline" className="shrink-0">
                  {CATEGORY_LABEL[item.category]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
              <p className="text-lg font-semibold tabular-nums text-brand-900">
                {item.points_required.toLocaleString()} pts
              </p>

              {isLocked && requiredTier && (
                <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600">
                  <Lock className="h-3.5 w-3.5" /> Requires {TIER_LABEL[requiredTier]} tier
                </div>
              )}
              {!isLocked && isOutOfStock && (
                <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600">
                  <PackageX className="h-3.5 w-3.5" /> Out of stock
                </div>
              )}
              {!isLocked && !isOutOfStock && insufficientPoints && (
                <p className="text-xs font-medium text-amber-600">
                  Need {(item.points_required - (userBalance ?? 0)).toLocaleString()} more points
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full gap-2"
                disabled={disabled}
                onClick={() => onRedeem(item)}
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Redeeming...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4" /> Redeem
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
