"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { engageBoardFeedService } from "@/services/engageboard-feed.service";

const PER_PAGE = 15;

/**
 * GET /engageboard/feed/announcements — a read-only presentation layer over
 * NotifyPro's existing Announcement model (FeedAnnouncementController's own
 * docblock: GAP-D outcome, no new `news_announcements` table). Reuses
 * <FeedPost/>'s density/styling conventions (card shape, spacing) without
 * literally reusing the component, since Announcement's shape (no
 * author_type, attachments, or reactions) doesn't match CompanyPost's.
 */
export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["engageboard", "announcements", page],
    queryFn: () => engageBoardFeedService.listAnnouncements({ per_page: PER_PAGE, page }),
    staleTime: 30_000,
  });

  const announcements = data?.data ?? [];
  const lastPage = data?.meta?.last_page ?? 1;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          EngageBoard · Announcements
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Announcements</h1>
        <p className="text-sm text-gray-500">Official company-wide news and notices.</p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-gray-500">Could not load announcements. Please refresh.</p>}

      {!isLoading && !isError && announcements.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No announcements right now.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {announcements.map((announcement) => (
          <Card key={announcement.uuid} className="gap-2 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-800">
                <Megaphone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-brand-900">{announcement.title}</p>
                  {!announcement.is_read && (
                    <Badge className="bg-brand-500/20 text-brand-800 hover:bg-brand-500/20">New</Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {announcement.priority}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600">{announcement.body}</p>
                {announcement.published_at && (
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(announcement.published_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </Card>
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
