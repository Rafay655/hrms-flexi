"use client";
import { showApiError } from "@/lib/error-toast";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLetterBatch, useLetterBatchActions, useBatchEmployees } from "@/hooks/use-letter-batches";
import { getLetterForgeError } from "@/services/letter-forge";
import { LetterStatus } from "./letter-ui";
import { BatchWorkflow } from "./batch-workflow";
import SearchableSelect from "@/components/ui/searchable-select";

export function BatchDetailModal({ uuid, onClose }: { uuid: string; onClose: () => void }) {
  const query = useLetterBatch(uuid);
  const employees = useBatchEmployees();
  const { commit, retry } = useLetterBatchActions(uuid);
  const [confirm, setConfirm] = useState<"commit" | "retry" | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [filter, setFilter] = useState("all");
  const batch = query.data?.data;
  const busy = commit.isPending || retry.isPending;
  const names = new Map((employees.data ?? []).map((employee) => [employee.id, employee]));
  const preview = batch?.status === "dry_run" || batch?.status === "draft";
  const items = batch?.items;
  const completePreview = Boolean(batch && items && items.length === batch.total_count);
  const shown = (items ?? []).filter((item) => filter === "all" || item.status === filter);
  async function execute() {
    if (busy || !batch) return;
    if (confirm === "commit" && (!acknowledged || !completePreview || !batch.is_committable)) return;
    try {
      if (confirm === "commit") { await commit.mutateAsync(); toast.success("Batch committed. Eligible employees are queued."); }
      else { await retry.mutateAsync(); toast.success("Failed items queued for retry."); }
      setConfirm(null); setAcknowledged(false);
    } catch (error) { showApiError(error); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy && !confirm) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl"><DialogHeader><DialogTitle className="font-semibold">{preview ? "Review batch eligibility" : "Batch progress"}</DialogTitle><DialogDescription>Review employee outcomes before committing and follow generation progress.</DialogDescription></DialogHeader><div className="space-y-5"><div className="flex justify-end"><Button variant="outline" disabled={query.isFetching || busy} onClick={() => void query.refetch()}>Refresh</Button></div>
    {query.isPending && <p role="status">Loading batch…</p>}
    {query.error && <p className="text-destructive">{getLetterForgeError(query.error).message}</p>}
    {batch && <>
      <BatchWorkflow step={preview ? 2 : 3} />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-5"><strong className="capitalize">{batch.template_key.replaceAll("_", " ")}</strong><LetterStatus status={batch.status} /><span className="break-all text-xs text-muted-foreground">{batch.uuid}</span></div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-brand-300 bg-brand-100/50 p-5"><h2 className="font-semibold">{preview ? "Eligibility preview" : "Generation summary"}</h2><p className="text-2xl font-semibold text-brand-900">{preview ? `${batch.queued_count} of ${batch.total_count} eligible` : `${batch.succeeded_count} of ${batch.total_count} succeeded`}</p><p>{preview ? "No letters have been issued by this dry run." : `${batch.queued_count} remaining in the queue.`}</p><p className="text-sm">Created: {new Date(batch.created_at).toLocaleString()}</p>{batch.completed_at && <p className="text-sm">Completed: {new Date(batch.completed_at).toLocaleString()}</p>}</section>
        <section className="space-y-3 rounded-lg border p-5"><h2 className="font-semibold">Skipped & failed</h2><p><strong>{batch.skipped_count}</strong> skipped · <strong>{batch.failed_count}</strong> failed</p><p className="text-sm text-muted-foreground">Review each employee’s reason below. Retrying requeues failed items only; skipped and successful employees are unchanged.</p>{batch.status === "running" && <p role="status" className="text-sm">Progress updates automatically while this tab is visible.</p>}</section>
      </div>
      <div className="flex flex-wrap gap-3">{preview && <Button className="bg-brand-800 hover:bg-brand-900" disabled={busy || query.isFetching || !batch.is_committable || !completePreview} onClick={() => { setAcknowledged(false); setConfirm("commit"); }}>Commit {batch.queued_count} eligible employees</Button>}{batch.is_terminal && batch.failed_count > 0 && <Button variant="outline" disabled={busy || query.isFetching} onClick={() => setConfirm("retry")}>Retry {batch.failed_count} failed items</Button>}</div>
      {preview && !batch.queued_count && <p className="text-sm text-amber-700">No eligible employees. Review the skipped reasons before creating a different batch.</p>}
      {!completePreview && <p className="text-sm text-amber-700">The full employee breakdown is unavailable. Refresh to load it before committing.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Employee results</h2><div className="w-full sm:w-56"><SearchableSelect aria-label="Filter employee results" value={filter} onChange={setFilter} allowAll={false} options={[{ value: "all", label: "All employees" }, { value: "queued", label: preview ? "Eligible" : "Queued" }, { value: "succeeded", label: "Succeeded" }, { value: "failed", label: "Failed" }, { value: "skipped", label: "Skipped" }]} /></div></div>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead className="bg-brand-100/50 text-left text-xs uppercase text-brand-700"><tr>{["Employee", "Status", "Reason", "Letter ID", "Processed"].map((label) => <th key={label} className="px-6 py-3">{label}</th>)}</tr></thead><tbody className="divide-y">{shown.map((item) => <tr key={item.uuid} className="hover:bg-brand-100/50"><td className="px-6 py-4"><p className="font-medium">{names.get(item.employee_id)?.name ?? `Employee #${item.employee_id}`}</p><p className="text-xs text-muted-foreground">{names.get(item.employee_id)?.employee_code} · ID {item.employee_id}</p></td><td className="px-6 py-4"><Badge variant="outline">{preview && item.status === "queued" ? "Eligible" : item.status}</Badge></td><td className="max-w-md break-words px-6 py-4">{item.failure_reason?.replaceAll("_", " ") ?? "—"}</td><td className="px-6 py-4">{item.generated_letter_id ?? "—"}</td><td className="px-6 py-4">{item.processed_at ? new Date(item.processed_at).toLocaleString() : "—"}</td></tr>)}{!shown.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No matching items.</td></tr>}</tbody></table></div>
    </>}
    <Dialog open={Boolean(confirm)} onOpenChange={(open) => { if (!open && !busy) setConfirm(null); }}><DialogContent><DialogHeader><DialogTitle>{confirm === "commit" ? "Commit this batch?" : "Retry failed employees?"}</DialogTitle><DialogDescription>{confirm === "commit" ? `${batch?.queued_count ?? 0} employees will be queued and ${batch?.skipped_count ?? 0} will be skipped. This starts letter generation.` : `Only the ${batch?.failed_count ?? 0} failed items will be retried.`}</DialogDescription></DialogHeader>{confirm === "commit" && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />I reviewed the eligibility results and skipped reasons.</label>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button><Button disabled={busy || (confirm === "commit" && !acknowledged)} onClick={() => void execute()}>{busy ? "Submitting…" : "Confirm"}</Button></DialogFooter></DialogContent></Dialog>
  </div></DialogContent></Dialog>;
}
