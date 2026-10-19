"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedPost } from "@/components/engageboard/FeedPost";
import { engageBoardFeedService } from "@/services/engageboard-feed.service";

const PER_PAGE = 10;

/**
 * GET /engageboard/feed — 05-api-contract.md row for CompanyFeed's listing
 * (FeedPostController::index(), pinned-first then chronological, visibility
 * scoped server-side).
 */
export default function CompanyFeedPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["engageboard", "feed", page],
    queryFn: () => engageBoardFeedService.list({ per_page: PER_PAGE, page }),
    staleTime: 30_000,
  });

  const posts = data?.data ?? [];
  const lastPage = data?.meta?.last_page ?? 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            EngageBoard · Company Feed
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Company Feed</h1>
          <p className="text-sm text-gray-500">Company-wide posts, achievements, and updates.</p>
        </div>
        <Button asChild>
          <Link href="/engageboard/feed/compose">
            <PenSquare className="mr-2 h-4 w-4" />
            New post
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-gray-500">Could not load the feed. Please refresh.</p>
      )}

      {!isLoading && !isError && posts.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">
            No posts yet. Be the first to share something with the company.
          </p>
          <Button asChild className="mt-3">
            <Link href="/engageboard/feed/compose">New post</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <FeedPost key={post.uuid} post={post} />
        ))}
      </div>

      {!isLoading && lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-gray-500">
            Page {page} of {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
