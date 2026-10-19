"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Clock, Loader2, PackageCheck, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { engageboardPointsService } from "@/services/engageboard-points.service";
import { POINTS_PAGE_SIZE, type PointRedemption, type RedemptionStatus } from "@/types/engageboard-points.types";

/**
 * /engageboard/points/redemptions — "My Redemptions" (EB-PTS-032). Reads
 * GET /v1/points/redemptions (own, paginated) and offers self-service cancel
 * (POST /v1/points/redemptions/{uuid}/cancel, EB-PTS-048) for pending requests.
 *
 * The 1-hour self-service cancel window is enforced by RedemptionPolicy::cancel on
 * the backend (not duplicated client-side) — the Cancel action is offered for any
 * `pending` redemption, and a 403 outside the window surfaces as a toast rather than
 * the button being silently hidden.
 */

const STATUS_META: Record<RedemptionStatus, { label: string; icon: typeof Clock; badge: "outline" | "default" | "destructive" | "secondary" }> = {
  pending: { label: "Pending", icon: Clock, badge: "outline" },
  approved: { label: "Approved", icon: CheckCircle2, badge: "default" },
  fulfilled: { label: "Fulfilled", icon: PackageCheck, badge: "secondary" },
  rejected: { label: "Rejected", icon: XCircle, badge: "destructive" },
  cancelled: { label: "Cancelled", icon: Ban, badge: "outline" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function MyRedemptionsPage() {
  const queryClient = useQueryClient();
  const [pages, setPages] = useState(1);
  const [cancellingUuid, setCancellingUuid] = useState<string | null>(null);

  const redemptionsQuery = useQuery({
    queryKey: ["engageboard", "points", "redemptions", "mine", pages],
    queryFn: async () => {
      const results = await Promise.all(
        Array.from({ length: pages }, (_, i) => engageboardPointsService.getMyRedemptions(i + 1)),
      );
      return results.flat();
    },
    staleTime: 15_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (uuid: string) => {
      setCancellingUuid(uuid);
      return engageboardPointsService.cancelRedemption(uuid);
    },
    onSuccess: () => {
      toast.success("Redemption cancelled — your points have been released.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["engageboard", "points", "account"] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not cancel this redemption. It may be outside the 1-hour cancellation window.";
      toast.error(message);
    },
    onSettled: () => setCancellingUuid(null),
  });

  const redemptions: PointRedemption[] = redemptionsQuery.data ?? [];
  const lastPageResultCount = redemptions.length - (pages - 1) * POINTS_PAGE_SIZE;
  const hasMore = !redemptionsQuery.isLoading && lastPageResultCount >= POINTS_PAGE_SIZE;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          EngageBoard · Points &amp; Rewards
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">My Redemptions</h1>
        <p className="text-sm text-gray-500">Track the status of rewards you&apos;ve redeemed.</p>
      </div>

      {redemptionsQuery.isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load your redemptions. Please refresh.
        </div>
      )}

      {redemptionsQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/60" />
          ))}
        </div>
      ) : redemptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-gray-600">No redemptions yet.</p>
          <p className="mt-1 text-xs text-gray-400">Browse the Rewards Catalog to redeem your points.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {redemptions.map((r) => {
            const meta = STATUS_META[r.status];
            const StatusIcon = meta.icon;
            const canCancel = r.status === "pending";
            return (
              <li key={r.uuid} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-900">{r.reward?.name ?? "Reward"}</p>
                  <p className="truncate text-xs text-gray-500">
                    Requested {formatDate(r.requested_at)}
                    {r.status === "rejected" && r.fulfillment_notes && ` · ${r.fulfillment_notes}`}
                    {r.status === "fulfilled" && r.fulfilled_at && ` · fulfilled ${formatDate(r.fulfilled_at)}`}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-brand-900">
                  -{r.points_deducted.toLocaleString()} pts
                </p>
                <Badge variant={meta.badge} className="shrink-0 gap-1">
                  <StatusIcon className="h-3 w-3" /> {meta.label}
                </Badge>
                {canCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-red-600 hover:text-red-700"
                    disabled={cancellingUuid === r.uuid}
                    onClick={() => cancelMutation.mutate(r.uuid)}
                  >
                    {cancellingUuid === r.uuid ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <Button variant="outline" onClick={() => setPages((p) => p + 1)} className="self-center">
          Load more
        </Button>
      )}
    </div>
  );
}
