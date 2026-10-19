"use client";

/**
 * FlexiDesk (system shell) — grievance committees (flexidesk.committee.manage).
 *
 * Committees are tenant data, not roles. A committee needs at least three non-observer members before it can be
 * assigned to a case; the chairperson is always a member. A committee that has been used for a case cannot lose members:
 * dissolve it and form a new one, so the record of who sat stays intact.
 */

import React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexiDeskKeys, flexiDeskService } from "@/services/flexi-desk.service";
import { formatTicketDate, parseApiError } from "@/lib/flexi-desk";
import type { GrievanceCommittee, PersonOption } from "@/types/flexi-desk.types";

const input = "w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const primary = "rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const secondary = "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-50";

/** Name search over active people in this company. Names and ids only. */
function PersonPicker({ label, onPick }: { label: string; onPick: (p: PersonOption) => void }) {
  const [term, setTerm] = React.useState("");
  const results = useQuery({
    queryKey: flexiDeskKeys.committeePeople(term),
    queryFn: () => flexiDeskService.searchCommitteePeople(term),
    enabled: term.trim().length >= 2,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-1">
      <label className="block text-xs text-gray-500">
        {label}
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Type a name…" className={`${input} mt-1`} />
      </label>
      {term.trim().length >= 2 && (
        <ul className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white text-sm">
          {results.isPending ? <li className="px-3 py-2 text-gray-500">Searching…</li> : (results.data ?? []).length === 0 ? <li className="px-3 py-2 text-gray-500">No matches.</li> : (
            (results.data ?? []).map((p) => (
              <li key={p.uuid}>
                <button type="button" onClick={() => { onPick(p); setTerm(""); }} className="block w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">{p.name}</button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function CreateCommittee({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = React.useState("");
  const [chair, setChair] = React.useState<PersonOption | null>(null);
  const [members, setMembers] = React.useState<PersonOption[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => flexiDeskService.createCommittee({ name: name.trim(), chairperson_uuid: chair!.uuid, members: members.map((m) => ({ user_uuid: m.uuid })) }),
    onSuccess: () => {
      setName("");
      setChair(null);
      setMembers([]);
      setError(null);
      onCreated();
    },
    onError: (err) => setError(parseApiError(err)?.message ?? "Could not create the committee."),
  });

  const total = members.filter((m) => m.uuid !== chair?.uuid).length + (chair ? 1 : 0);

  return (
    <section aria-labelledby="new-committee" className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
      <h2 id="new-committee" className="text-sm font-medium text-gray-900">Form a committee</h2>
      <div>
        <label htmlFor="committee-name" className="mb-1 block text-xs text-gray-500">Name</label>
        <input id="committee-name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <PersonPicker label="Chairperson" onPick={setChair} />
          <p className="mt-1 text-sm text-gray-800">{chair ? <>Chair: <strong>{chair.name}</strong></> : <span className="text-gray-500">No chairperson chosen.</span>}</p>
        </div>
        <div>
          <PersonPicker label="Add a member" onPick={(p) => setMembers((cur) => (cur.some((m) => m.uuid === p.uuid) || p.uuid === chair?.uuid ? cur : [...cur, p]))} />
          <ul className="mt-1 flex flex-wrap gap-2 text-xs">
            {members.map((m) => (
              <li key={m.uuid} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                {m.name}
                <button type="button" aria-label={`Remove ${m.name}`} onClick={() => setMembers((cur) => cur.filter((x) => x.uuid !== m.uuid))} className="text-gray-500 hover:text-gray-900">×</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-xs text-gray-500">{total} member{total === 1 ? "" : "s"} so far. At least 3 are needed before it can be assigned to a case; 3 to 5 is recommended.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end">
        <button type="button" disabled={create.isPending || name.trim().length < 3 || !chair} onClick={() => create.mutate()} className={primary}>{create.isPending ? "Creating…" : "Create committee"}</button>
      </div>
    </section>
  );
}

function CommitteeCard({ committee, onChanged }: { committee: GrievanceCommittee; onChanged: () => void }) {
  const [error, setError] = React.useState<string | null>(null);
  const fail = (err: unknown) => setError(parseApiError(err)?.message ?? "That did not work.");
  const ok = () => {
    setError(null);
    onChanged();
  };
  const add = useMutation({ mutationFn: (p: PersonOption) => flexiDeskService.addCommitteeMember(committee.uuid, p.uuid), onSuccess: ok, onError: fail });
  const remove = useMutation({ mutationFn: (userUuid: string) => flexiDeskService.removeCommitteeMember(committee.uuid, userUuid), onSuccess: ok, onError: fail });
  const dissolve = useMutation({ mutationFn: () => flexiDeskService.dissolveCommittee(committee.uuid), onSuccess: ok, onError: fail });
  const enough = committee.eligible_member_count >= committee.minimum_members;

  return (
    <article className={`space-y-3 rounded-lg border p-5 ${committee.is_active ? "border-gray-200 bg-white" : "border-dashed border-gray-300 bg-gray-50"}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{committee.name}</h3>
          <p className="text-xs text-gray-500">
            {committee.is_active ? `Formed ${formatTicketDate(committee.formed_at)}` : `Dissolved ${formatTicketDate(committee.dissolved_at)}`}
            {committee.is_active && !enough ? ` · needs ${committee.minimum_members - committee.eligible_member_count} more to be assignable` : ""}
          </p>
        </div>
        {committee.is_active && <button type="button" disabled={dissolve.isPending} onClick={() => dissolve.mutate()} className={secondary}>Dissolve</button>}
      </header>

      <ul className="divide-y divide-gray-100 text-sm">
        {committee.members.map((m) => (
          <li key={m.user_uuid ?? m.name} className="flex items-center justify-between py-1.5">
            <span>{m.name} <span className="text-xs capitalize text-gray-500">· {m.role}</span></span>
            {committee.is_active && m.role !== "chairperson" && m.user_uuid && (
              <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(m.user_uuid!)} className="text-xs text-gray-500 underline hover:no-underline">Remove</button>
            )}
          </li>
        ))}
      </ul>

      {committee.is_active && <PersonPicker label="Add a member" onPick={(p) => add.mutate(p)} />}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </article>
  );
}

export default function CommitteesPage() {
  const queryClient = useQueryClient();
  const [showDissolved, setShowDissolved] = React.useState(false);
  const committees = useQuery({ queryKey: flexiDeskKeys.committees(showDissolved), queryFn: () => flexiDeskService.getCommittees(showDissolved), retry: false });
  const forbidden = (committees.error as { response?: { status?: number } } | null)?.response?.status === 403;
  const refresh = () => queryClient.invalidateQueries({ queryKey: [...flexiDeskKeys.all, "committees"] });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/flexi-desk/grievances" className="text-sm text-gray-500 hover:underline">← Grievances</Link>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Grievance committees</h1>
        <p className="mt-1 text-sm text-gray-500">Panels that investigate formal grievances. Members can read the case they are assigned to; investigation notes are limited to the chairperson and investigator.</p>
      </div>

      {forbidden ? (
        <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">You do not have permission to manage committees.</div>
      ) : (
        <>
          <CreateCommittee onCreated={refresh} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={showDissolved} onChange={(e) => setShowDissolved(e.target.checked)} />
            Show dissolved committees
          </label>
          {committees.isPending ? (
            <div className="text-sm text-gray-500" aria-busy="true">Loading…</div>
          ) : committees.isError ? (
            <p role="alert" className="text-sm text-red-700">{parseApiError(committees.error)?.message ?? "Could not load committees."}</p>
          ) : (committees.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No committees yet.</p>
          ) : (
            <div className="space-y-4">{(committees.data ?? []).map((c) => <CommitteeCard key={c.uuid} committee={c} onChanged={refresh} />)}</div>
          )}
        </>
      )}
    </div>
  );
}
