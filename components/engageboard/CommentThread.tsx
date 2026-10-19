"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AtSign, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  engageBoardFeedService,
  fetchEmployeeDirectory,
  searchEmployees,
} from "@/services/engageboard-feed.service";
import type { EmployeeOption, PostComment } from "@/types/engageboard-feed.types";

/**
 * <CommentThread/> — 03-design-system.md §4: one level of nesting only
 * (matches PostComment::parent_comment_id's real shape), `@mention`
 * autocomplete.
 *
 * Author identity: PostCommentResource exposes only a numeric `employee_id`,
 * never a name (no whenLoaded relation on that resource, unlike
 * EmployeeRecognitionResource). Names are resolved client-side against a
 * directory built from /people-hub/onboarding — see
 * engageboard-feed.service.ts's fetchEmployeeDirectory() docblock.
 *
 * Mentions: FeedService::extractMentionIds() parses `data-mention-id="N"`
 * spans out of the submitted `body` HTML server-side
 * (backend/app/Services/EngageBoard/CompanyFeed/FeedService.php:439-444) —
 * confirmed by reading that method directly. Selecting someone from the
 * autocomplete below inserts exactly that markup (HTMLPurifier's allow-list
 * explicitly permits `span[data-mention-id|data-mention-name]`, confirmed via
 * FeedService::sanitizeHtml()) rather than calling
 * FeedService::searchMentionableEmployees(), which exists in the service but
 * is never routed anywhere (verified — no controller method, no route calls
 * it) and is therefore unreachable from any frontend.
 */
export function CommentThread({
  postUuid,
  onCommentPosted,
}: {
  postUuid: string;
  onCommentPosted?: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["engageboard", "feed", "comments", postUuid],
    queryFn: () => engageBoardFeedService.listComments(postUuid),
  });

  const { data: directory } = useQuery({
    queryKey: ["engageboard", "employee-directory"],
    queryFn: fetchEmployeeDirectory,
    staleTime: 5 * 60_000,
  });

  const nameFor = (employeeId: number): string =>
    directory?.get(employeeId)?.name ?? `Employee #${employeeId}`;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["engageboard", "feed", "comments", postUuid] });
    onCommentPosted?.();
  };

  return (
    <div className="flex flex-col gap-3">
      <CommentComposer postUuid={postUuid} onPosted={invalidate} />

      {isLoading && <p className="text-xs text-gray-400">Loading comments…</p>}

      <div className="flex flex-col gap-3">
        {comments.map((comment) => (
          <CommentRow
            key={comment.uuid}
            comment={comment}
            postUuid={postUuid}
            nameFor={nameFor}
            onChanged={invalidate}
          />
        ))}
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  postUuid,
  nameFor,
  onChanged,
  depth = 0,
}: {
  comment: PostComment;
  postUuid: string;
  nameFor: (id: number) => string;
  onChanged: () => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className={depth === 0 ? "" : "ml-9 border-l border-gray-100 pl-3"}>
      <div className="flex items-start gap-2">
        <Avatar size="sm">
          <AvatarFallback className="text-[10px]">
            {nameFor(comment.employee_id).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="rounded-lg bg-brand-100/50 px-3 py-1.5">
            <p className="text-xs font-semibold text-brand-900">{nameFor(comment.employee_id)}</p>
            <p
              className="text-sm text-gray-700 [&_span[data-mention-id]]:font-medium [&_span[data-mention-id]]:text-brand-700"
              dangerouslySetInnerHTML={{ __html: comment.body }}
            />
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-400">
            {comment.is_edited && !comment.is_deleted && <span>edited</span>}
            {depth === 0 && !comment.is_deleted && (
              <button type="button" className="hover:underline" onClick={() => setReplying((v) => !v)}>
                Reply
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-2">
              <CommentComposer
                postUuid={postUuid}
                parentUuid={comment.uuid}
                onPosted={() => {
                  setReplying(false);
                  onChanged();
                }}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {comment.replies.map((reply) => (
            <CommentRow
              key={reply.uuid}
              comment={reply}
              postUuid={postUuid}
              nameFor={nameFor}
              onChanged={onChanged}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MentionToken {
  id: number;
  name: string;
}

function CommentComposer({
  postUuid,
  parentUuid,
  onPosted,
}: {
  postUuid: string;
  parentUuid?: string;
  onPosted: () => void;
}) {
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<MentionToken[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [debouncedMentionQuery, setDebouncedMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMentionQuery(mentionQuery ?? ""), 250);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  const { data: mentionOptions = [] } = useQuery({
    queryKey: ["engageboard", "feed", "mention-search", debouncedMentionQuery],
    queryFn: () => searchEmployees(debouncedMentionQuery),
    enabled: mentionQuery !== null && debouncedMentionQuery.trim().length >= 2,
  });

  const postMutation = useMutation({
    mutationFn: () => {
      // Build the sanitize-allow-listed markup FeedService::extractMentionIds()
      // parses (`data-mention-id="N"`) — see this file's header docblock.
      let body = text;
      mentions.forEach((m) => {
        const token = `@${m.name}`;
        if (body.includes(token)) {
          body = body.replace(
            token,
            `<span data-mention-id="${m.id}" data-mention-name="${m.name}">${token}</span>`,
          );
        }
      });
      body = `<p>${body}</p>`;

      // Top-level only — see the submit guard below for why replies are blocked.
      return engageBoardFeedService.addComment(postUuid, body, undefined);
    },
    onSuccess: () => {
      setText("");
      setMentions([]);
      onPosted();
    },
    onError: () => toast.error("Could not post your comment. Please try again."),
  });

  const submitDisabled = !text.trim() || postMutation.isPending;

  const handleSubmit = () => {
    if (submitDisabled) return;

    // KNOWN BACKEND GAP (documented in 20c-integration-snippet.md):
    // StorePostCommentRequest.parent_comment_id requires the PARENT comment's
    // numeric PK (`integer`, `exists:post_comments,id`) — but
    // PostCommentResource never exposes a comment's own numeric id, only its
    // `uuid` (confirmed by reading both files directly). There is no
    // reachable way to resolve the integer this reply endpoint needs, so
    // rather than guess (e.g. parsing digits out of the uuid string, which
    // would silently attach the reply to a random unrelated comment), replying
    // is blocked here with an explicit message. Top-level comments are
    // unaffected — they don't need a parent id at all.
    if (parentUuid) {
      toast.error(
        "Replying to a specific comment isn't available yet — the comment API doesn't expose the field this needs. You can still post a new top-level comment.",
      );
      return;
    }

    postMutation.mutate();
  };

  const handleChange = (value: string) => {
    setText(value);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const upToCursor = value.slice(0, cursor);
    const match = upToCursor.match(/@([\w .'-]{0,30})$/);
    setMentionQuery(match ? match[1] : null);
  };

  const insertMention = (option: EmployeeOption) => {
    const cursor = textareaRef.current?.selectionStart ?? text.length;
    const upToCursor = text.slice(0, cursor);
    const replaced = upToCursor.replace(/@([\w .'-]{0,30})$/, `@${option.name} `);
    const next = replaced + text.slice(cursor);
    setText(next);
    setMentions((prev) => (prev.some((m) => m.id === option.id) ? prev : [...prev, { id: option.id, name: option.name }]));
    setMentionQuery(null);
  };

  const showDropdown = mentionQuery !== null && mentionOptions.length > 0;

  return (
    <div className="relative">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          rows={2}
          maxLength={1000}
          placeholder="Write a comment… use @ to mention someone"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          className="text-sm"
        />
        <Button type="button" size="icon" disabled={submitDisabled} onClick={handleSubmit}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {showDropdown && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-64 rounded-md border border-gray-200 bg-white p-1 shadow-md">
          {mentionOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-brand-100/60"
              onClick={() => insertMention(option)}
            >
              <AtSign className="h-3 w-3 text-gray-400" />
              {option.name}
              <span className="text-gray-400">{option.employee_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
