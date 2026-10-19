"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PointsWallet } from "@/components/engageboard/PointsWallet";
import { TransactionTimeline } from "@/components/engageboard/TransactionTimeline";
import { engageboardPointsService } from "@/services/engageboard-points.service";
import { POINTS_PAGE_SIZE, type PointTransaction } from "@/types/engageboard-points.types";

/**
 * /engageboard/points — "My Wallet" (EB-PTS-030). Reads GET /v1/points/account +
 * GET /v1/points/transactions (own, paginated) — no mock data.
 */
export default function PointsWalletPage() {
  const [pages, setPages] = useState(1);

  const accountQuery = useQuery({
    queryKey: ["engageboard", "points", "account"],
    queryFn: engageboardPointsService.getMyAccount,
    staleTime: 30_000,
  });

  const transactionsQuery = useQuery({
    queryKey: ["engageboard", "points", "transactions", pages],
    queryFn: async () => {
      const results = await Promise.all(
        Array.from({ length: pages }, (_, i) => engageboardPointsService.getTransactions(i + 1)),
      );
      return results.flat();
    },
    staleTime: 30_000,
  });

  const transactions: PointTransaction[] = transactionsQuery.data ?? [];
  const lastPageResultCount = transactions.length - (pages - 1) * POINTS_PAGE_SIZE;
  const hasMore = !transactionsQuery.isLoading && lastPageResultCount >= POINTS_PAGE_SIZE;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          EngageBoard · Points &amp; Rewards
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">My Wallet</h1>
        <p className="text-sm text-gray-500">Your points balance, tier, and recent activity.</p>
      </div>

      {accountQuery.isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Could not load your wallet. Please refresh.
        </div>
      )}

      <PointsWallet account={accountQuery.data} isLoading={accountQuery.isLoading} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-brand-900">Transaction History</h2>
        {transactionsQuery.isError && (
          <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            Could not load your transaction history. Please refresh.
          </div>
        )}
        <TransactionTimeline
          transactions={transactions}
          isLoading={transactionsQuery.isLoading}
          hasMore={hasMore}
          loadingMore={transactionsQuery.isFetching && !transactionsQuery.isLoading}
          onLoadMore={() => setPages((p) => p + 1)}
        />
      </div>
    </div>
  );
}
