"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGeneratedLetter } from "@/hooks/use-generated-letters";
import { getLetterForgeError, getLetterRenderStatus } from "@/services/letter-forge";
import { label, letterTitle } from "@/lib/generated-letter-state";
import { LetterActions } from "./letter-actions";
import { LetterError, LetterPanel, LetterStatus, letterDate } from "./letter-ui";

export function LetterViewModal({ uuid, onClose }: { uuid: string; onClose: () => void }) {
  const [currentUuid, setCurrentUuid] = useState(uuid);
  const query = useGeneratedLetter(currentUuid);
  const letter = query.data?.data;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl"><DialogHeader><DialogTitle className="font-semibold">{letter ? letterTitle(letter) : "Letter details"}</DialogTitle><DialogDescription className="break-all">Letter reference: {letter?.series_number ?? currentUuid}</DialogDescription></DialogHeader>
    {query.isPending && <p role="status" className="p-8 text-center">Loading letter…</p>}{query.error && <LetterError message={getLetterForgeError(query.error).message} retry={() => void query.refetch()} />}
    {letter && <><div><LetterStatus status={letter.status} /></div><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="space-y-5"><LetterPanel title="Recipient & document"><dl className="grid gap-4 text-sm sm:grid-cols-2">{[["Employee", letter.employee?.name ?? `Employee #${letter.employee_id}`], ["Employee code", letter.employee?.employee_code ?? "—"], ["Designation", letter.employee?.designation ?? "—"], ["Category", label(letter.template?.category ?? "—")], ["Language", letter.language.toUpperCase()], ["Signature policy", label(letter.signature_policy ?? "none")], ["Created", letterDate(letter.created_at)], ["Updated", letterDate(letter.updated_at)], ["Dispatched", letterDate(letter.dispatched_at)], ["Delivery channel", label(letter.dispatch_channel ?? "Not dispatched")], ["Acknowledgement", label(letter.acknowledgement_status ?? "not_required")], ["Acknowledged", letterDate(letter.acknowledged_at)], ["Recalled", letterDate(letter.recalled_at)]].map(([name, value]) => <div key={name}><dt className="text-slate-500">{name}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl></LetterPanel>
    {(letter.revoke_reason || letter.recall_reason || letter.replacement_uuid || letter.supersedes_uuid) && <LetterPanel title="Corrections & audit">{(letter.revoke_reason || letter.recall_reason) && <p className="mb-3 whitespace-pre-wrap text-sm">{letter.revoke_reason || letter.recall_reason}</p>}{letter.supersedes_uuid && <Button variant="link" onClick={() => setCurrentUuid(letter.supersedes_uuid!)}>View original letter</Button>}{letter.replacement_uuid && <Button variant="link" onClick={() => setCurrentUuid(letter.replacement_uuid!)}>View replacement letter</Button>}</LetterPanel>}
    <LetterPanel title="Delivery history">{letter.dispatch_logs?.length ? <ol className="space-y-4">{letter.dispatch_logs.map((log) => <li key={log.uuid} className="border-l-2 border-indigo-100 pl-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold capitalize">{label(log.channel)}</p><LetterStatus status={log.status} /></div><p className="mt-1 text-xs text-slate-500">{letterDate(log.created_at)}{log.dispatched_to ? ` · ${log.dispatched_to}` : ""}</p>{log.error_message && <p className="mt-2 text-sm text-rose-700">{log.error_message}</p>}</li>)}</ol> : <p className="text-sm text-slate-500">No delivery attempts yet.</p>}</LetterPanel></div><LetterPanel title="Actions"><LetterActions key={currentUuid} letter={letter} onReplacement={setCurrentUuid} /></LetterPanel></div></>}
    <DialogFooter><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Refresh</Button><Button onClick={onClose}>Close</Button></DialogFooter>
  </DialogContent></Dialog>;
}

const terminalStatuses = new Set(["dispatched", "recalled", "revoked", "superseded", "rejected", "failed", "cancelled"]);
export function LetterStatusModal({ uuid, onClose }: { uuid: string; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  const [expired, setExpired] = useState(false);
  const [cycle, setCycle] = useState(0);
  const query = useQuery({
    queryKey: ["letter-forge", "status-modal", uuid],
    queryFn: ({ signal }) => getLetterRenderStatus(uuid, signal),
    retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
    refetchInterval: (state) => paused || expired || state.state.error || terminalStatuses.has(state.state.data?.data.status ?? "") ? false : 3000,
  });
  const status = query.data?.data;
  const terminal = Boolean(status && terminalStatuses.has(status.status));
  useEffect(() => {
    if (paused || terminal || query.isError || expired) return;
    const timer = setTimeout(() => setExpired(true), 120_000);
    return () => clearTimeout(timer);
  }, [paused, terminal, query.isError, expired, cycle]);
  function resume() { setPaused(false); setExpired(false); setCycle((value) => value + 1); void query.refetch(); }
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="font-semibold">Poll letter status</DialogTitle><DialogDescription className="break-all">{uuid}</DialogDescription></DialogHeader>
    {query.isPending && <p role="status">Loading status…</p>}{query.error && <LetterError message={getLetterForgeError(query.error).message} />}
    {status && <div className="space-y-4"><LetterStatus status={status.status} /><dl className="grid gap-4 text-sm sm:grid-cols-2">{[["PDF", status.generated_pdf_path ? "Generated" : "Not available"], ["Dispatched", letterDate(status.dispatched_at)], ["Recalled", letterDate(status.recalled_at)], ["Last checked", letterDate(new Date(query.dataUpdatedAt).toISOString())]].map(([name, value]) => <div key={name}><dt className="text-slate-500">{name}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl></div>}
    <p role="status" className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">{terminal ? "This letter has reached a final status. Automatic checks stopped." : query.isError ? "Status checks stopped after an error. Try again to resume." : expired ? "Automatic checks paused after two minutes. Resume when needed." : paused ? "Automatic checks paused." : "Checking every 3 seconds while this modal is open."}</p>
    <DialogFooter>{!terminal && !paused && !expired && !query.isError && <Button variant="outline" onClick={() => setPaused(true)}>Pause</Button>}<Button variant="outline" disabled={query.isFetching} onClick={resume}>{terminal ? "Refresh status" : paused || expired || query.isError ? "Resume polling" : "Check now"}</Button><Button onClick={onClose}>Close</Button></DialogFooter>
  </DialogContent></Dialog>;
}
