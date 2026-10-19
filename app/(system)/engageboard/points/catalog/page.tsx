"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { RewardsCatalog } from "@/components/engageboard/RewardsCatalog";
import { engageboardPointsService } from "@/services/engageboard-points.service";
import type { RewardsCatalogItem } from "@/types/engageboard-points.types";

/**
 * /engageboard/points/catalog — "Rewards Catalog" (EB-PTS-031). Reads
 * GET /v1/points/catalog + POST /v1/points/redeem.
 *
 * `react-hot-toast` is used here (not sonner) because that's the toaster actually
 * mounted globally in frontend/app/layout.tsx — sonner's own <Toaster/> is not
 * mounted there, so a page using sonner without also rendering its own local
 * <Toaster/> would silently produce no visible toast (a real, verified pattern —
 * see e.g. frontend/app/(system)/time-sync/team-dashboard/page.tsx, which mounts
 * one itself). Reusing the already-global react-hot-toast avoids a second Toaster
 * instance on this page.
 */
export default function RewardsCatalogPage() {
  const queryClient = useQueryClient();
  const [redeemingUuid, setRedeemingUuid] = useState<string | null>(null);

  const accountQuery = useQuery({
    queryKey: ["engageboard", "points", "account"],
    queryFn: engageboardPointsService.getMyAccount,
    staleTime: 30_000,
  });

  const catalogQuery = useQuery({
    queryKey: ["engageboard", "points", "catalog"],
    queryFn: engageboardPointsService.getCatalog,
    staleTime: 30_000,
  });

  const redeemMutation = useMutation({
    mutationFn: (item: RewardsCatalogItem) => {
      setRedeemingUuid(item.uuid);
      return engageboardPointsService.redeem({ reward_id: item.uuid });
    },
    onSuccess: () => {
      toast.success("Redemption requested — you'll see it under My Redemptions.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "account"] });
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "redemptions"] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not submit your redemption. Please try again.";
      toast.error(message);
    },
    onSettled: () => setRedeemingUuid(null),
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          EngageBoard · Points &amp; Rewards
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Rewards Catalog</h1>
        <p className="text-sm text-gray-500">Redeem your points for rewards available at your tier.</p>
      </div>

      {catalogQuery.isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load the rewards catalog. Please refresh.
        </div>
      )}

      <RewardsCatalog
        items={catalogQuery.data ?? []}
        userTier={accountQuery.data?.tier}
        userBalance={accountQuery.data?.available_balance}
        onRedeem={(item) => redeemMutation.mutate(item)}
        redeemingUuid={redeemingUuid}
        isLoading={catalogQuery.isLoading}
      />
    </div>
  );
}
