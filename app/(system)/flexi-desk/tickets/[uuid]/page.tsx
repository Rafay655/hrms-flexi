"use client";

/**
 * FlexiDesk (system shell) — resolver ticket workspace.
 *
 * Everything shown is what the API returns for this caller: the resolver block (SLA, escalation, requester)
 * is present only when the caller may see resolver context, and each action button is rendered from the
 * server-computed `abilities`, never re-derived here. Escalating hands the ticket over, so the answer is a
 * minimal receipt (ticket, status, level, new assignee where authorized). The page never assumes it can
 * still open the ticket afterwards: a full fetch goes back through authorization and may be refused.
 */

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { canEscalateFrom, canReassignFrom, escalationTriggerLabel, formatFileSize, formatTicketDate, nextWorkStatuses, parseApiError, ticketStatusLabel } from "@/lib/flexi-desk";
import { TicketPriorityLabel, TicketStatusBadge } from "@/components/flexi-desk/TicketStatusBadge";
import { SlaBadge } from "@/components/flexi-desk/SlaBadge";
import { ReasonDialog } from "@/components/flexi-desk/ReasonDialog";
import { TicketConversation } from "@/components/flexi-desk/TicketConversation";
import { KbAttachPanel } from "@/components/flexi-desk/KbAttachPanel";
import { AssignPanel } from "@/components/flexi-desk/AssignPanel";
import type { MutationReceipt, TicketStatus } from "@/types/flexi-desk.types";

type Dialog = "escalate" | "deescalate" | null;

export default function FlexiDeskTicketWorkspace() {
  const { uuid } = useParams<{ uuid: string }>();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = React.useState<Dialog>(null);
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [receipt, setReceipt] = React.useState<MutationReceipt | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [assignedTo, setAssignedTo] = React.useState<string | null>(null);

  const ticket = useQuery({
    queryKey: flexiDeskKeys.ticket(uuid),
    queryFn: () => flexiDeskService.getTicket(uuid),
    retry: false,
  });

  const isResolverView = ticket.data?.escalation_level !== undefined;
  const history = useQuery({
    queryKey: flexiDeskKeys.escalations(uuid),
    queryFn: () => flexiDeskService.getEscalations(uuid),
    enabled: isResolverView,
    retry: false,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: flexiDeskKeys.all });
  };

  const changeStatus = useMutation({
    mutationFn: (status: TicketStatus) => flexiDeskService.changeStatus(uuid, status),
    onSuccess: () => {
      setActionError(null);
      refreshAll();
    },
    onError: (err) => setActionError(parseApiError(err)?.message ?? "Could not change the status. Please try again."),
  });

  const handoff = useMutation({
    mutationFn: ({ kind, reason }: { kind: "escalate" | "deescalate"; reason: string }) =>
      kind === "escalate" ? flexiDeskService.escalate(uuid, reason) : flexiDeskService.deescalate(uuid, reason),
    onSuccess: (r, vars) => {
      setDialog(null);
      setDialogError(null);
      setReceipt(r);
      setNotice(vars.kind === "escalate" ? "Ticket escalated." : "Ticket de-escalated.");
      refreshAll();
    },
    onError: (err) => setDialogError(parseApiError(err)?.message ?? "That did not work. Please try again."),
  });

  const httpStatus = (ticket.error as { response?: { status?: number } } | null)?.response?.status;

  const download = async (attachmentUuid: string, filename: string) => {
    setDownloadError(null);
    try {
      await flexiDeskService.downloadAttachment(uuid, attachmentUuid, filename);
    } catch {
      setDownloadError("Could not download that file. Please try again.");
    }
  };

  const receiptBanner = receipt && (
    <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-medium">{notice}</p>
      <p className="mt-1">
        Now {ticketStatusLabel(receipt.status, "resolver").toLowerCase()} at level {receipt.escalation_level}
        {receipt.assignee ? `, handled by ${receipt.assignee.name}` : ""}.
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/flexi-desk/tickets" className="text-sm text-gray-500 hover:underline">← All tickets</Link>

      {ticket.isPending ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500" aria-busy="true">Loading ticket…</div>
      ) : ticket.isError ? (
        <div className="space-y-3">
          {receiptBanner}
          <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            {receipt
              ? "You no longer have access to this ticket now that it has been handed over."
              : httpStatus === 404
                ? "We could not find that ticket, or you are not allowed to see it."
                : httpStatus === 403
                  ? "You do not have permission to view this ticket."
                  : "Could not load this ticket. Please try again."}
          </div>
        </div>
      ) : (
        <>
          {receiptBanner}

          {ticket.data.escalation?.exception && (
            <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Automatic escalation could not find anyone to hand this ticket to. HR Admin has been asked to assign one.
            </div>
          )}

          <article className="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
            <header className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-gray-500">{ticket.data.ticket_number}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {ticket.data.sla && <SlaBadge state={ticket.data.sla.state} />}
                  {(ticket.data.escalation_level ?? 0) > 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                      Escalation level {ticket.data.escalation_level}
                    </span>
                  )}
                  <TicketStatusBadge status={ticket.data.status} audience="resolver" />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{ticket.data.subject}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{ticket.data.category?.name ?? "Uncategorised"}{ticket.data.sub_category ? ` › ${ticket.data.sub_category.name}` : ""}</span>
                <TicketPriorityLabel priority={ticket.data.priority} />
              </div>
            </header>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-gray-500">Requester</dt>
                <dd className="text-gray-900">{ticket.data.employee?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Handled by</dt>
                <dd className="text-gray-900">{ticket.data.assignee?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Raised</dt>
                <dd className="text-gray-900">{formatTicketDate(ticket.data.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Last updated</dt>
                <dd className="text-gray-900">{formatTicketDate(ticket.data.updated_at)}</dd>
              </div>
              {ticket.data.sla?.configured && (
                <>
                  <div>
                    <dt className="text-xs text-gray-500">First response due</dt>
                    <dd className="text-gray-900">{formatTicketDate(ticket.data.sla.response_due_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">First responded</dt>
                    <dd className="text-gray-900">{formatTicketDate(ticket.data.sla.first_response_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Resolution due</dt>
                    <dd className="text-gray-900">{formatTicketDate(ticket.data.sla.due_at)}</dd>
                  </div>
                </>
              )}
            </dl>

            <section aria-labelledby="ticket-description">
              <h2 id="ticket-description" className="mb-1 text-sm font-medium text-gray-900">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{ticket.data.description}</p>
            </section>

            {ticket.data.attachments.length > 0 && (
              <section aria-labelledby="ticket-files">
                <h2 id="ticket-files" className="mb-2 text-sm font-medium text-gray-900">Files</h2>
                <ul className="space-y-2">
                  {ticket.data.attachments.map((a) => (
                    <li key={a.uuid} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                      <span className="truncate">{a.original_filename} <span className="text-xs text-gray-500">{formatFileSize(a.file_size)}</span></span>
                      <button type="button" onClick={() => download(a.uuid, a.original_filename)} className="ml-3 shrink-0 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
                {downloadError && <p role="alert" className="mt-2 text-xs text-red-700">{downloadError}</p>}
              </section>
            )}

            {(ticket.data.abilities.work || ticket.data.abilities.escalate || ticket.data.abilities.deescalate) && (
              <section aria-labelledby="ticket-actions" className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
                <h2 id="ticket-actions" className="sr-only">Actions</h2>
                {ticket.data.abilities.work && nextWorkStatuses(ticket.data.status).length > 0 && (
                  <div>
                    <label htmlFor="status-select" className="mb-1 block text-xs text-gray-500">Move to</label>
                    <select
                      id="status-select"
                      value=""
                      disabled={changeStatus.isPending}
                      onChange={(e) => e.target.value && changeStatus.mutate(e.target.value as TicketStatus)}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <option value="">Choose status…</option>
                      {nextWorkStatuses(ticket.data.status).map((s) => (
                        <option key={s} value={s}>{ticketStatusLabel(s, "resolver")}</option>
                      ))}
                    </select>
                  </div>
                )}
                {ticket.data.abilities.escalate && canEscalateFrom(ticket.data.status) && (
                  <button type="button" onClick={() => { setDialogError(null); setDialog("escalate"); }} className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900">
                    Escalate
                  </button>
                )}
                {ticket.data.abilities.deescalate && (ticket.data.escalation_level ?? 0) > 0 && (
                  <button type="button" onClick={() => { setDialogError(null); setDialog("deescalate"); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800">
                    De-escalate
                  </button>
                )}
              </section>
            )}
            {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
          </article>

          {assignedTo && (
            <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Assigned to {assignedTo}.</div>
          )}
          {ticket.data.abilities.reassign && canReassignFrom(ticket.data.status) && (
            <AssignPanel ticketUuid={uuid} currentAssignee={ticket.data.assignee?.name ?? null} onAssigned={setAssignedTo} />
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <TicketConversation
              ticketUuid={uuid}
              audience="resolver"
              canReply={ticket.data.abilities.comment_external}
              canNote={ticket.data.abilities.comment_internal}
              locked={ticket.data.status === "resolved" || ticket.data.status === "closed"}
            />
          </div>

          {ticket.data.abilities.comment_internal && ticket.data.status !== "closed" && <KbAttachPanel ticketUuid={uuid} />}

          {isResolverView && (
            <section aria-labelledby="escalation-history" className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 id="escalation-history" className="mb-3 text-sm font-medium text-gray-900">Escalation history</h2>
              {history.isPending ? (
                <p className="text-sm text-gray-500" aria-busy="true">Loading history…</p>
              ) : history.isError ? (
                <p role="alert" className="text-sm text-red-700">Could not load the escalation history.</p>
              ) : history.data.length === 0 ? (
                <p className="text-sm text-gray-500">This ticket has not been escalated.</p>
              ) : (
                <ol className="space-y-3">
                  {history.data.map((h) => (
                    <li key={h.uuid} className="rounded-lg border border-gray-100 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-800">{escalationTriggerLabel(h)} · level {h.level}</span>
                        <span>{formatTicketDate(h.created_at)}</span>
                      </div>
                      <p className="mt-1 text-gray-700">
                        {h.from?.name ? `${h.from.name} → ` : ""}{h.to.name ?? "—"}
                      </p>
                      {h.reason && <p className="mt-1 whitespace-pre-wrap text-gray-600">{h.reason}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          <ReasonDialog
            open={dialog !== null}
            title={dialog === "deescalate" ? "De-escalate this ticket" : "Escalate this ticket"}
            description={
              dialog === "deescalate"
                ? "The ticket goes back one level and to that level's handler."
                : "The ticket moves up one level and is reassigned to that level's handler. You may lose access to it."
            }
            confirmLabel={dialog === "deescalate" ? "De-escalate" : "Escalate"}
            busy={handoff.isPending}
            serverError={dialogError}
            onCancel={() => setDialog(null)}
            onConfirm={(reason) => dialog && handoff.mutate({ kind: dialog, reason })}
          />
        </>
      )}
    </div>
  );
}
