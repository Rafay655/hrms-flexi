"use client";

/**
 * FlexiDesk (system shell) — grievance workspace for HR, the investigator and the committee.
 *
 * Every button is rendered from the server-computed `abilities`; the API re-checks each command. For a MASKED case
 * the response contains no filer identity at all, so this page cannot show it. The only way to see it is the
 * Reveal action: it needs the dedicated permission and a reason, is recorded before it is disclosed, and its result is
 * held in this component's memory only (never in the query cache, storage or URL) and disappears on leave.
 */

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import {
  REVOCATION_KINDS,
  accessSourceLabel,
  caseRoleLabel,
  formatTicketDate,
  grievanceTypeLabel,
  parseApiError,
  revocationKindLabel,
  validateCaseText,
  validateRevealReason,
  validateRevocationReason,
} from "@/lib/flexi-desk";
import { EvidencePanel, GrievanceStatusBadge, GrievanceTimeline } from "@/components/flexi-desk/GrievanceParts";
import { ReasonDialog } from "@/components/flexi-desk/ReasonDialog";
import type { GrievanceNoteType, RevealedIdentity, RevocationKind } from "@/types/flexi-desk.types";

const NOTE_TYPES: { value: GrievanceNoteType; label: string }[] = [
  { value: "investigation", label: "Investigation note" },
  { value: "hearing", label: "Hearing note" },
  { value: "ruling_basis", label: "Basis for ruling" },
];

const card = "rounded-lg border border-gray-200 bg-white p-5";
const input = "w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const primary = "rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const secondary = "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-50";

export default function GrievanceWorkspace() {
  const { uuid } = useParams<{ uuid: string }>();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [revealOpen, setRevealOpen] = React.useState(false);
  const [revealError, setRevealError] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState<RevealedIdentity | null>(null);
  const [committeeUuid, setCommitteeUuid] = React.useState("");
  const [noteType, setNoteType] = React.useState<GrievanceNoteType>("investigation");
  const [noteText, setNoteText] = React.useState("");
  const [noteError, setNoteError] = React.useState<string | null>(null);
  const [rulingText, setRulingText] = React.useState("");
  const [rulingError, setRulingError] = React.useState<string | null>(null);
  const [hearing, setHearing] = React.useState({ at: "", mode: "in_person" as "in_person" | "virtual", location: "" });
  const [attendees, setAttendees] = React.useState<string[]>([]);
  const [revoke, setRevoke] = React.useState({ user: "", kind: "administrative" as RevocationKind, reason: "" });
  const [revokeError, setRevokeError] = React.useState<string | null>(null);
  const [decision, setDecision] = React.useState<"uphold" | "revise">("uphold");
  const [revised, setRevised] = React.useState("");

  const grievance = useQuery({ queryKey: flexiDeskKeys.grievance(uuid), queryFn: () => flexiDeskService.getGrievance(uuid), retry: false });
  const g = grievance.data;

  const notes = useQuery({
    queryKey: flexiDeskKeys.grievanceNotes(uuid),
    queryFn: () => flexiDeskService.getGrievanceNotes(uuid),
    enabled: !!g?.abilities.view_notes,
    retry: false,
  });

  const participants = useQuery({
    queryKey: flexiDeskKeys.grievanceParticipants(uuid),
    queryFn: () => flexiDeskService.getGrievanceParticipants(uuid),
    enabled: !!g?.abilities.investigate,
    retry: false,
  });

  const access = useQuery({
    queryKey: flexiDeskKeys.grievanceAccess(uuid),
    queryFn: () => flexiDeskService.getGrievanceAccess(uuid),
    enabled: !!g?.abilities.revoke_access,
    retry: false,
  });

  const revocations = useQuery({
    queryKey: flexiDeskKeys.grievanceRevocations(uuid),
    queryFn: () => flexiDeskService.getGrievanceRevocations(uuid),
    enabled: !!g?.abilities.revoke_access,
    retry: false,
  });

  const committees = useQuery({
    queryKey: flexiDeskKeys.committees(false),
    queryFn: () => flexiDeskService.getCommittees(false),
    enabled: !!g?.abilities.assign_committee && g.status === "filed",
    retry: false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: flexiDeskKeys.grievance(uuid) });
  const fail = (err: unknown) => setError(parseApiError(err)?.message ?? "That did not work. Please try again.");
  const ok = () => {
    setError(null);
    refresh();
  };

  const assign = useMutation({ mutationFn: () => flexiDeskService.assignCommittee(uuid, committeeUuid), onSuccess: ok, onError: fail });
  const start = useMutation({ mutationFn: () => flexiDeskService.startInvestigation(uuid), onSuccess: ok, onError: fail });
  const schedule = useMutation({
    mutationFn: () => flexiDeskService.scheduleHearing(uuid, { scheduled_at: hearing.at.replace("T", " "), mode: hearing.mode, location: hearing.location || undefined, attendee_uuids: attendees }),
    onSuccess: () => {
      setHearing({ at: "", mode: "in_person", location: "" });
      setAttendees([]);
      ok();
    },
    onError: fail,
  });
  const addNote = useMutation({
    mutationFn: () => flexiDeskService.addGrievanceNote(uuid, noteType, noteText),
    onSuccess: () => {
      setNoteText("");
      setNoteError(null);
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.grievanceNotes(uuid) });
    },
    onError: (err) => setNoteError(parseApiError(err)?.message ?? "Could not record the note."),
  });
  const rule = useMutation({
    mutationFn: () => flexiDeskService.issueRuling(uuid, rulingText),
    onSuccess: () => {
      setRulingText("");
      setRulingError(null);
      ok();
    },
    onError: (err) => setRulingError(parseApiError(err)?.message ?? "Could not issue the ruling."),
  });
  const revokeAccess = useMutation({
    mutationFn: () => flexiDeskService.revokeGrievanceAccess(uuid, { user_uuid: revoke.user, kind: revoke.kind, reason: revoke.reason }),
    onSuccess: () => {
      setRevoke({ user: "", kind: "administrative", reason: "" });
      setRevokeError(null);
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.grievanceRevocations(uuid) });
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.grievanceParticipants(uuid) });
      queryClient.invalidateQueries({ queryKey: flexiDeskKeys.grievanceAccess(uuid) });
      refresh();
    },
    onError: (err) => setRevokeError(parseApiError(err)?.message ?? "Could not revoke access."),
  });
  const resolve = useMutation({ mutationFn: () => flexiDeskService.resolveAppeal(uuid, decision, revised), onSuccess: ok, onError: fail });
  const close = useMutation({ mutationFn: () => flexiDeskService.closeGrievance(uuid), onSuccess: ok, onError: fail });
  const reveal = useMutation({
    mutationFn: (reason: string) => flexiDeskService.revealIdentity(uuid, reason),
    onSuccess: (identity) => {
      setRevealOpen(false);
      setRevealError(null);
      setRevealed(identity); // memory only
    },
    onError: (err) => setRevealError(parseApiError(err)?.message ?? "That did not work. Please try again."),
  });

  const httpStatus = (grievance.error as { response?: { status?: number } } | null)?.response?.status;
  const submitNote = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateCaseText(noteText);
    setNoteError(problem);
    if (!problem) {
      addNote.mutate();
    }
  };
  const submitRuling = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateCaseText(rulingText);
    setRulingError(problem);
    if (!problem) {
      rule.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/flexi-desk/grievances" className="text-sm text-gray-500 hover:underline">← All grievances</Link>

      {grievance.isPending ? (
        <div className={card} aria-busy="true"><span className="text-sm text-gray-500">Loading…</span></div>
      ) : grievance.isError || !g ? (
        <div role="alert" className={`${card} text-sm text-gray-600`}>
          {httpStatus === 404 ? "We could not find that grievance, or you are not allowed to see it." : "Could not load this grievance. Please try again."}
        </div>
      ) : (
        <>
          <article className={`${card} space-y-4`}>
            <header className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-gray-500">{g.grievance_number}</span>
                <GrievanceStatusBadge status={g.status} />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{g.subject}</h1>
              <p className="text-xs text-gray-500">{grievanceTypeLabel(g.grievance_type)} · Filed {formatTicketDate(g.created_at)} · Intake review due {formatTicketDate(g.intake_due_at)}</p>
            </header>

            <GrievanceTimeline current={g.status} />

            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              {g.filer ? (
                <p>Filed by <strong>{g.filer.name}</strong>{g.filer.employee_code ? ` (${g.filer.employee_code})` : ""}. The filer did not ask for confidential handling.</p>
              ) : (
                <p>The filer asked for confidential handling. Their identity is not part of this case file.</p>
              )}
              {g.abilities.reveal_identity && g.is_identity_masked && (
                <button type="button" onClick={() => { setRevealError(null); setRevealOpen(true); }} className={`${secondary} mt-2`}>Reveal filer identity</button>
              )}
            </div>

            {revealed && (
              <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">Identity revealed to you. This access has been recorded.</p>
                <p className="mt-1">{revealed.name || "Name not on record"}{revealed.employee_code ? ` (${revealed.employee_code})` : ""}</p>
                <button type="button" onClick={() => setRevealed(null)} className="mt-2 text-xs underline">Hide</button>
              </div>
            )}

            <section aria-labelledby="g-narrative">
              <h2 id="g-narrative" className="mb-1 text-sm font-medium text-gray-900">Narrative</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{g.description}</p>
            </section>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-gray-500">Against</dt><dd className="text-gray-900">{g.against ? `${g.against.name}${g.against.employee_code ? ` (${g.against.employee_code})` : ""}` : "Not stated"}</dd></div>
              <div><dt className="text-xs text-gray-500">Committee</dt><dd className="text-gray-900">{g.committee?.name ?? "Not assigned"}</dd></div>
              <div><dt className="text-xs text-gray-500">Investigator</dt><dd className="text-gray-900">{g.investigator?.name ?? "—"}</dd></div>
            </dl>

            {g.hearings.length > 0 && (
              <section aria-labelledby="g-hearings">
                <h2 id="g-hearings" className="mb-1 text-sm font-medium text-gray-900">Hearings</h2>
                <ul className="space-y-1 text-sm text-gray-700">
                  {g.hearings.map((h) => (
                    <li key={h.uuid}>{formatTicketDate(h.scheduled_at)} · {h.mode === "virtual" ? "Online" : "In person"}{h.location ? ` · ${h.location}` : ""}{h.attendees && h.attendees.length > 0 ? ` · ${h.attendees.map((a) => a.name).join(", ")}` : ""}</li>
                  ))}
                </ul>
              </section>
            )}

            {g.ruling && (
              <section aria-labelledby="g-ruling">
                <h2 id="g-ruling" className="mb-1 text-sm font-medium text-gray-900">Ruling</h2>
                <p className="text-xs text-gray-500">Issued {formatTicketDate(g.ruling_date)}{g.appeal_deadline ? ` · appeal window ends ${formatTicketDate(g.appeal_deadline)}` : ""}</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{g.ruling}</p>
              </section>
            )}

            {g.appeal_notes && (
              <section aria-labelledby="g-appeal">
                <h2 id="g-appeal" className="mb-1 text-sm font-medium text-gray-900">Appeal</h2>
                <p className="text-xs text-gray-500">Filed {formatTicketDate(g.appeal_filed_at)}</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{g.appeal_notes}</p>
              </section>
            )}
          </article>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

          {g.abilities.assign_committee && g.status === "filed" && (
            <section className={`${card} space-y-2`} aria-labelledby="a-committee">
              <h2 id="a-committee" className="text-sm font-medium text-gray-900">Assign a committee</h2>
              {committees.isPending ? <p className="text-sm text-gray-500">Loading committees…</p> : (committees.data ?? []).length === 0 ? (
                <p className="text-sm text-gray-600">There is no active committee. <Link href="/flexi-desk/grievances/committees" className="underline">Create one</Link> first.</p>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label htmlFor="committee-select" className="mb-1 block text-xs text-gray-500">Committee</label>
                    <select id="committee-select" value={committeeUuid} onChange={(e) => setCommitteeUuid(e.target.value)} className={input}>
                      <option value="">Choose…</option>
                      {(committees.data ?? []).map((c) => (
                        <option key={c.uuid} value={c.uuid} disabled={c.eligible_member_count < c.minimum_members}>
                          {c.name} ({c.eligible_member_count} members{c.eligible_member_count < c.minimum_members ? `, needs ${c.minimum_members}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" disabled={!committeeUuid || assign.isPending} onClick={() => assign.mutate()} className={primary}>{assign.isPending ? "Assigning…" : "Assign"}</button>
                </div>
              )}
              <p className="text-xs text-gray-500">The filer and the person the grievance is against cannot sit on the committee. The chairperson investigates unless you choose otherwise.</p>
            </section>
          )}

          {g.abilities.investigate && g.status === "committee_assigned" && (
            <section className={`${card} flex items-center justify-between gap-3`}>
              <p className="text-sm text-gray-700">The committee is assigned. Begin the investigation when ready.</p>
              <button type="button" disabled={start.isPending} onClick={() => start.mutate()} className={primary}>Start investigation</button>
            </section>
          )}

          {g.abilities.investigate && (g.status === "under_investigation" || g.status === "hearing_scheduled") && (
            <section className={`${card} space-y-2`} aria-labelledby="a-hearing">
              <h2 id="a-hearing" className="text-sm font-medium text-gray-900">Schedule a hearing</h2>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="hearing-at" className="mb-1 block text-xs text-gray-500">Date and time</label>
                  <input id="hearing-at" type="datetime-local" value={hearing.at} onChange={(e) => setHearing({ ...hearing, at: e.target.value })} className={input} />
                </div>
                <div>
                  <label htmlFor="hearing-mode" className="mb-1 block text-xs text-gray-500">Format</label>
                  <select id="hearing-mode" value={hearing.mode} onChange={(e) => setHearing({ ...hearing, mode: e.target.value as "in_person" | "virtual" })} className={input}>
                    <option value="in_person">In person</option>
                    <option value="virtual">Online</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="hearing-location" className="mb-1 block text-xs text-gray-500">Location or link</label>
                  <input id="hearing-location" value={hearing.location} onChange={(e) => setHearing({ ...hearing, location: e.target.value })} className={input} />
                </div>
                <button type="button" disabled={!hearing.at || schedule.isPending} onClick={() => schedule.mutate()} className={primary}>Schedule</button>
              </div>
              <fieldset className="space-y-1">
                <legend className="text-xs text-gray-500">Attendees (people assigned to this case)</legend>
                {participants.isPending ? <p className="text-xs text-gray-500">Loading…</p> : (participants.data ?? []).length === 0 ? <p className="text-xs text-gray-500">No one is assigned.</p> : (
                  (participants.data ?? []).map((p) => (
                    <label key={p.uuid} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={attendees.includes(p.uuid)} onChange={(e) => setAttendees((cur) => (e.target.checked ? [...cur, p.uuid] : cur.filter((x) => x !== p.uuid)))} />
                      {p.name} <span className="text-xs text-gray-500">· {caseRoleLabel(p.case_role)}</span>
                    </label>
                  ))
                )}
              </fieldset>
            </section>
          )}

          {g.abilities.view_notes && (
            <section className={`${card} space-y-3`} aria-labelledby="a-notes">
              <h2 id="a-notes" className="text-sm font-medium text-gray-900">Investigation notes</h2>
              <p className="text-xs text-gray-500">Only the investigator, the chairperson and HR leadership can read these. Notes cannot be edited or deleted.</p>
              {notes.isPending ? <p className="text-sm text-gray-500">Loading notes…</p> : notes.isError ? (
                <p role="alert" className="text-sm text-red-700">Could not load the notes.</p>
              ) : (notes.data ?? []).length === 0 ? <p className="text-sm text-gray-500">No notes yet.</p> : (
                <ol className="space-y-2">
                  {(notes.data ?? []).map((n) => (
                    <li key={n.uuid} className="rounded-lg border border-gray-100 p-3 text-sm">
                      <div className="flex justify-between text-xs text-gray-500"><span>{n.author?.name ?? "—"} · {NOTE_TYPES.find((t) => t.value === n.note_type)?.label ?? n.note_type}</span><span>{formatTicketDate(n.created_at)}</span></div>
                      <p className="mt-1 whitespace-pre-wrap text-gray-800">{n.body}</p>
                    </li>
                  ))}
                </ol>
              )}
              {g.abilities.add_note && (
                <form onSubmit={submitNote} className="space-y-2">
                  <label htmlFor="note-type" className="sr-only">Note type</label>
                  <select id="note-type" value={noteType} onChange={(e) => setNoteType(e.target.value as GrievanceNoteType)} className={input}>
                    {NOTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <label htmlFor="note-body" className="sr-only">Note</label>
                  <textarea id="note-body" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Record what you found…" aria-invalid={!!noteError} className={input} />
                  {noteError && <p role="alert" className="text-xs text-red-700">{noteError}</p>}
                  <div className="flex justify-end"><button type="submit" disabled={addNote.isPending} className={primary}>{addNote.isPending ? "Recording…" : "Record note"}</button></div>
                </form>
              )}
            </section>
          )}

          {g.abilities.rule && g.status === "hearing_scheduled" && (
            <section className={`${card} space-y-2`} aria-labelledby="a-ruling">
              <h2 id="a-ruling" className="text-sm font-medium text-gray-900">Issue the ruling</h2>
              <p className="text-xs text-gray-500">At least one investigation note must exist. The filer will be told, and has seven days to appeal.</p>
              <form onSubmit={submitRuling} className="space-y-2">
                <label htmlFor="ruling-text" className="sr-only">Ruling</label>
                <textarea id="ruling-text" value={rulingText} onChange={(e) => setRulingText(e.target.value)} rows={5} aria-invalid={!!rulingError} className={input} />
                {rulingError && <p role="alert" className="text-xs text-red-700">{rulingError}</p>}
                <div className="flex justify-end"><button type="submit" disabled={rule.isPending} className={primary}>{rule.isPending ? "Issuing…" : "Issue ruling"}</button></div>
              </form>
            </section>
          )}

          {g.abilities.resolve_appeal && g.status === "appealed" && (
            <section className={`${card} space-y-2`} aria-labelledby="a-resolve">
              <h2 id="a-resolve" className="text-sm font-medium text-gray-900">Decide the appeal</h2>
              <fieldset className="flex gap-4 text-sm">
                <legend className="sr-only">Decision</legend>
                <label className="flex items-center gap-2"><input type="radio" checked={decision === "uphold"} onChange={() => setDecision("uphold")} />Uphold the ruling (closes the case)</label>
                <label className="flex items-center gap-2"><input type="radio" checked={decision === "revise"} onChange={() => setDecision("revise")} />Revise the ruling</label>
              </fieldset>
              {decision === "revise" && (
                <>
                  <label htmlFor="revised-ruling" className="sr-only">Revised ruling</label>
                  <textarea id="revised-ruling" value={revised} onChange={(e) => setRevised(e.target.value)} rows={4} placeholder="The revised ruling…" className={input} />
                </>
              )}
              <div className="flex justify-end"><button type="button" disabled={resolve.isPending || (decision === "revise" && !revised.trim())} onClick={() => resolve.mutate()} className={primary}>Record decision</button></div>
            </section>
          )}

          {g.abilities.close && g.status === "ruling_issued" && (
            <section className={`${card} flex items-center justify-between gap-3`}>
              <p className="text-sm text-gray-700">Close the case once the appeal window has passed with no appeal, or after an appeal has been decided.</p>
              <button type="button" disabled={close.isPending} onClick={() => close.mutate()} className={secondary}>Close grievance</button>
            </section>
          )}

          {g.abilities.revoke_access && (
            <section className={`${card} space-y-3`} aria-labelledby="a-revoke">
              <h2 id="a-revoke" className="text-sm font-medium text-gray-900">Case access</h2>
              <p className="text-xs text-gray-500">These are the people who can currently open this case. Revoking removes one of them from this case only.</p>
              {access.isPending ? <p className="text-xs text-gray-500">Loading who has access…</p> : (access.data?.current ?? []).length === 0 && <p className="text-xs text-gray-500">No one else currently has access.</p>}
              <p className="text-xs text-gray-500">
                Remove one person from this case (they leave the company, have a conflict of interest, or their access is compromised). It is recorded, cannot be undone,
                and the person is not told. The committee list taken at assignment is not changed.
              </p>
              {(revocations.data ?? []).length > 0 && (
                <ul className="space-y-1 text-sm">
                  {(revocations.data ?? []).map((r) => (
                    <li key={r.uuid} className="rounded border border-gray-100 p-2">
                      <strong>{r.person?.name ?? "—"}</strong> · {revocationKindLabel(r.kind)} · {formatTicketDate(r.created_at)}{r.revoked_by ? ` · by ${r.revoked_by.name}` : ""}
                      <p className="text-xs text-gray-600">{r.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor="revoke-person" className="mb-1 block text-xs text-gray-500">Person</label>
                  <select id="revoke-person" value={revoke.user} onChange={(e) => setRevoke({ ...revoke, user: e.target.value })} className={input}>
                    <option value="">Choose…</option>
                    {(access.data?.current ?? []).map((p) => <option key={p.uuid} value={p.uuid}>{p.name} — {accessSourceLabel(p.sources, p.case_role)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="revoke-kind" className="mb-1 block text-xs text-gray-500">Why</label>
                  <select id="revoke-kind" value={revoke.kind} onChange={(e) => setRevoke({ ...revoke, kind: e.target.value as RevocationKind })} className={input}>
                    {REVOCATION_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </div>
              </div>
              <label htmlFor="revoke-reason" className="sr-only">Reason</label>
              <textarea id="revoke-reason" value={revoke.reason} onChange={(e) => setRevoke({ ...revoke, reason: e.target.value })} rows={3} placeholder="Explain the reason (at least 20 characters)…" className={input} />
              {revokeError && <p role="alert" className="text-xs text-red-700">{revokeError}</p>}
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!revoke.user || revokeAccess.isPending}
                  onClick={() => {
                    const problem = validateRevocationReason(revoke.reason);
                    setRevokeError(problem);
                    if (!problem) {
                      revokeAccess.mutate();
                    }
                  }}
                  className={secondary}
                >
                  {revokeAccess.isPending ? "Revoking…" : "Revoke access"}
                </button>
              </div>
            </section>
          )}
          <div className={card}>
            <EvidencePanel grievanceUuid={uuid} canUpload={g.abilities.upload_evidence} />
          </div>

          <ReasonDialog
            open={revealOpen}
            title="Reveal the filer's identity"
            description="You are about to see who filed this grievance. Only do this when you genuinely need to. Your name, this case, the time and your reason are recorded."
            confirmLabel="Reveal"
            busy={reveal.isPending}
            serverError={revealError}
            validate={validateRevealReason}
            helpText="Explain why you need this. It is recorded in the audit trail and is not shown to the filer."
            onCancel={() => setRevealOpen(false)}
            onConfirm={(reason) => reveal.mutate(reason)}
          />
        </>
      )}
    </div>
  );
}
