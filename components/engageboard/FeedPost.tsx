"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Pin,
  ThumbsUp,
  Heart,
  PartyPopper,
  Lightbulb,
  Hand,
  Building2,
  UserCog,
  UserRound,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { engageBoardFeedService } from "@/services/engageboard-feed.service";
import { CommentThread } from "@/components/engageboard/CommentThread";
import type { CompanyPost, ReactionType } from "@/types/engageboard-feed.types";
import { cn } from "@/lib/utils";

const REACTIONS: { type: ReactionType; icon: React.ElementType; label: string }[] = [
  { type: "like", icon: ThumbsUp, label: "Like" },
  { type: "love", icon: Heart, label: "Love" },
  { type: "clap", icon: Hand, label: "Clap" },
  { type: "celebrate", icon: PartyPopper, label: "Celebrate" },
  { type: "insightful", icon: Lightbulb, label: "Insightful" },
];

const AUTHOR_LABEL: Record<CompanyPost["author_type"], { label: string; icon: React.ElementType }> = {
  hr: { label: "HR Admin", icon: Building2 },
  manager: { label: "Manager", icon: UserCog },
  employee: { label: "Employee", icon: UserRound },
  // Auto-posted by RecognitionService/CelebrationService via FeedService::autoPost()
  // (recognitions, celebrations) — a real, migration-defined enum value
  // (company_posts.author_type includes 'system') that this lookup previously
  // omitted, crashing every render of an auto-posted card. Found live during
  // G32 QA: giving a recognition auto-posts to the feed with author_type
  // "system", which immediately crashed the dashboard's feed-preview widget.
  system: { label: "EngageBoard", icon: Sparkles },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

/**
 * <FeedPost/> — 03-design-system.md §4. Dense, information-forward card —
 * explicitly NOT a consumer social-feed template (no hero images, no
 * dwell-time-optimized visual weight).
 *
 * Author identity gap (documented in 20c-integration-snippet.md):
 * CompanyPostResource exposes only `author_type` (hr/manager/employee) and a
 * numeric `author_id` (a User id) — never a resolved name or avatar, and no
 * endpoint in this codebase maps an arbitrary User id back to a display name.
 * This card therefore renders a role badge + relative timestamp as the honest
 * "who posted this" signal, not a fabricated name.
 *
 * Reaction state gap: the API has no "did I already react" signal (no
 * per-user reaction is ever returned on the post itself, and there's no
 * GET .../reactions listing endpoint) — `hasReacted` here is session-local
 * optimistic state only, reset on reload.
 */
export function FeedPost({ post }: { post: CompanyPost }) {
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reactionPopoverOpen, setReactionPopoverOpen] = useState(false);
  const [localReaction, setLocalReaction] = useState<ReactionType | null>(null);
  const [localCount, setLocalCount] = useState(post.reactions_count ?? 0);

  const reactMutation = useMutation({
    mutationFn: (reactionType: ReactionType) => engageBoardFeedService.react(post.uuid, reactionType),
    onSuccess: (_data, reactionType) => {
      setLocalReaction((prev) => {
        if (!prev) setLocalCount((c) => c + 1);
        return reactionType;
      });
      setReactionPopoverOpen(false);
    },
    onError: () => toast.error("Could not react to this post. Please refresh."),
  });

  const unreactMutation = useMutation({
    mutationFn: () => engageBoardFeedService.unreact(post.uuid),
    onSuccess: () => {
      setLocalReaction(null);
      setLocalCount((c) => Math.max(0, c - 1));
    },
    onError: () => toast.error("Could not remove your reaction. Please refresh."),
  });

  const authorMeta = AUTHOR_LABEL[post.author_type];
  const AuthorIcon = authorMeta.icon;

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarFallback>
            <AuthorIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-brand-900">{authorMeta.label}</span>
            <span className="text-xs text-gray-400">{timeAgo(post.published_at ?? post.created_at)}</span>
            {post.pin_to_top && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
            {post.post_type !== "custom" && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {post.post_type}
              </Badge>
            )}
          </div>

          {post.title && <p className="mt-1 text-sm font-semibold text-brand-900">{post.title}</p>}

          {/* body is HTMLPurifier-sanitized server-side (FeedService::sanitizeHtml()) */}
          <div
            className="prose prose-sm mt-1 max-w-none text-sm text-gray-700 [&_p]:my-1"
            data-table-layout="custom"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {post.attachments.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {post.attachments.map((attachment) => (
                <a
                  key={attachment.uuid}
                  href={attachment.link_url ?? attachment.file_url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg border border-gray-100"
                >
                  {attachment.attachment_type === "image" || attachment.attachment_type === "gif" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attachment.thumbnail_url ?? attachment.file_url ?? ""}
                      alt={attachment.alt_text ?? ""}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-brand-100/50 p-2 text-center text-xs text-gray-500">
                      {attachment.alt_text ?? attachment.attachment_type}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
            {post.allow_reactions && (
              <Popover open={reactionPopoverOpen} onOpenChange={setReactionPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-brand-100/60",
                      localReaction && "text-brand-700",
                    )}
                    onClick={() => {
                      if (localReaction) unreactMutation.mutate();
                    }}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {localCount > 0 ? localCount : "React"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1.5" align="start">
                  <div className="flex gap-1">
                    {REACTIONS.map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        type="button"
                        title={label}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-100/60",
                          localReaction === type && "bg-brand-500/20 text-brand-800",
                        )}
                        onClick={() => reactMutation.mutate(type)}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {post.allow_comments && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto gap-1.5 px-1.5 py-1 text-xs text-gray-500 hover:bg-brand-100/60"
                onClick={() => setCommentsOpen((v) => !v)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {post.comments_count ? post.comments_count : "Comment"}
              </Button>
            )}
          </div>

          {commentsOpen && post.allow_comments && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <CommentThread
                postUuid={post.uuid}
                onCommentPosted={() =>
                  queryClient.invalidateQueries({ queryKey: ["engageboard", "feed"] })
                }
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
