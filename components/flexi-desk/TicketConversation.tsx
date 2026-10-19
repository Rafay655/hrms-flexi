"use client";

/**
 * FlexiDesk — the ticket conversation, shared by the ESS page (employee) and the system page (resolver).
 *
 * What the reader sees is decided by the API: the employee's thread never contains internal notes or
 * their files (they are excluded in SQL), so nothing here filters or hides them. This component only
 * renders what it is given and offers the composer the caller's abilities allow. Internal-note mode is
 * an explicit, visibly different state; it is never the default.
 */

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import {
  ATTACHMENT_LIMITS,
  formatFileSize,
  formatTicketDate,
  mapReplyServerErrors,
  parseApiError,
  validateReply,
  type ReplyErrors,
} from "@/lib/flexi-desk";
import type { TicketAttachment, TicketAudience, TicketThreadEntry } from "@/types/flexi-desk.types";

type Props = {
  ticketUuid: string;
  audience: TicketAudience;
  canReply: boolean;
  canNote: boolean;
  /** Closed and resolved tickets accept no new external replies. */
  locked: boolean;
};

export function TicketConversation({ ticketUuid, audience, canReply, canNote, locked }: Props) {
  const queryClient = useQueryClient();
  const [message, setMessage] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [internal, setInternal] = React.useState(false);
  const [errors, setErrors] = React.useState<ReplyErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const thread = useQuery({
    queryKey: flexiDeskKeys.thread(ticketUuid),
    queryFn: () => flexiDeskService.getThread(ticketUuid),
    retry: false,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: flexiDeskKeys.thread(ticketUuid) });
    queryClient.invalidateQueries({ queryKey: flexiDeskKeys.ticket(ticketUuid) }); // status may have moved (pending_info resumes)
  };

  // A resolver who cannot reply externally (ticket locked, or no external-comment right) can only write a note.
  const noteMode = canNote && (internal || !canReply || locked);

  const send = useMutation({
    mutationFn: () => flexiDeskService.postComment(ticketUuid, { message, isInternal: noteMode, files }),
    onSuccess: () => {
      setMessage("");
      setFiles([]);
      setErrors({});
      setFormError(null);
      if (fileInput.current) {
        fileInput.current.value = "";
      }
      refresh();
    },
    onError: (err) => {
      const api = parseApiError(err);
      setErrors(mapReplyServerErrors(api?.field_errors));
      setFormError(api?.message ?? "Could not send your message. Please try again.");
    },
  });

  const remove = useMutation({
    mutationFn: (commentUuid: string) => flexiDeskService.deleteComment(ticketUuid, commentUuid),
    onSuccess: refresh,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateReply({ message, files });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length === 0) {
      send.mutate();
    }
  };

  const download = async (a: TicketAttachment) => {
    setDownloadError(null);
    try {
      await flexiDeskService.downloadAttachment(ticketUuid, a.uuid, a.original_filename);
    } catch {
      setDownloadError("Could not download that file. Please try again.");
    }
  };

  const entries = thread.data ?? [];
  const canCompose = (canReply && !locked) || canNote;

  return (
    <section aria-labelledby="conversation-heading" className="space-y-4">
      <h2 id="conversation-heading" className="text-sm font-medium text-gray-900">Conversation</h2>

      {thread.isPending ? (
        <p className="text-sm text-gray-500" aria-busy="true">Loading conversation…</p>
      ) : thread.isError ? (
        <p role="alert" className="text-sm text-red-700">Could not load the conversation. Please try again.</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No messages yet.</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <Entry key={entry.uuid} entry={entry} audience={audience} onDelete={() => remove.mutate(entry.uuid)} onDownload={download} deleting={remove.isPending} />
          ))}
        </ol>
      )}
      {downloadError && <p role="alert" className="text-xs text-red-700">{downloadError}</p>}

      {canCompose && (
        <form
          onSubmit={onSubmit}
          className={`space-y-2 rounded-lg border p-3 ${noteMode ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"}`}
          aria-label={noteMode ? "Internal note" : "Reply"}
        >
          {canNote && (
            <fieldset className="flex flex-wrap gap-4 text-sm">
              <legend className="sr-only">Who can see this message</legend>
              {canReply && !locked && (
                <label className="flex items-center gap-2">
                  <input type="radio" name="audience" checked={!internal} onChange={() => setInternal(false)} />
                  {audience === "resolver" ? "Reply to requester" : "Reply"}
                </label>
              )}
              <label className="flex items-center gap-2">
                <input type="radio" name="audience" checked={noteMode} onChange={() => setInternal(true)} />
                Internal note (the requester cannot see this)
              </label>
            </fieldset>
          )}

          <label htmlFor="reply-message" className="sr-only">Message</label>
          <textarea
            id="reply-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={noteMode ? "Write an internal note…" : "Write a message…"}
            aria-invalid={!!errors.message}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
          {errors.message && <p role="alert" className="text-xs text-red-700">{errors.message}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer text-sm text-gray-700 underline hover:no-underline">
              Attach files
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={ATTACHMENT_LIMITS.extensions.map((x) => `.${x}`).join(",")}
                className="sr-only"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </label>
            {files.length > 0 && <span className="text-xs text-gray-600">{files.map((f) => f.name).join(", ")}</span>}
          </div>
          {errors.files && <p role="alert" className="text-xs text-red-700">{errors.files}</p>}
          {formError && !errors.message && !errors.files && <p role="alert" className="text-xs text-red-700">{formError}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={send.isPending}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {send.isPending ? "Sending…" : noteMode ? "Post internal note" : "Send"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Entry({
  entry,
  audience,
  onDelete,
  onDownload,
  deleting,
}: {
  entry: TicketThreadEntry;
  audience: TicketAudience;
  onDelete: () => void;
  onDownload: (a: TicketAttachment) => void;
  deleting: boolean;
}) {
  const isInternal = audience === "resolver" && entry.is_internal === true;
  const who = entry.is_system_note ? "System" : (entry.sender?.name ?? "Unknown");

  return (
    <li
      className={`rounded-lg border p-3 text-sm ${
        entry.is_system_note ? "border-dashed border-gray-200 bg-gray-50 text-gray-600" : isInternal ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">
          {who}
          {isInternal && <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-amber-900">Internal note</span>}
        </span>
        <span>{formatTicketDate(entry.created_at)}</span>
      </div>
      <p className="whitespace-pre-wrap text-gray-900">{entry.message}</p>
      {entry.attachments.length > 0 && (
        <ul className="mt-2 space-y-1">
          {entry.attachments.map((a) => (
            <li key={a.uuid} className="flex items-center justify-between rounded border border-black/5 bg-white/60 px-2 py-1 text-xs">
              <span className="truncate">{a.original_filename} <span className="text-gray-500">{formatFileSize(a.file_size)}</span></span>
              <button type="button" onClick={() => onDownload(a)} className="ml-3 shrink-0 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
      {entry.can_delete && (
        <div className="mt-2 text-right">
          <button type="button" disabled={deleting} onClick={onDelete} className="text-xs text-gray-500 underline hover:no-underline disabled:opacity-50">
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
