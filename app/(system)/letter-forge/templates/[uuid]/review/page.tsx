"use client";
import { showApiError } from "@/lib/error-toast";

import { useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLetterAccess, useLetterTemplate, useTemplateVersions, useTemplatePublishing, usePreviewLetterTemplate } from "@/hooks/use-letter-forge";
import { useAppSelector } from "@/store/hooks";
import { getLetterForgeError } from "@/services/letter-forge";
import { canReviewVersion, changedVersionFields } from "@/lib/letter-publishing";
import type { TemplateVersion } from "@/types/letter-forge";
import { LetterPageHeader, LetterStatus } from "../../../components/letter-ui";

const date = (value?: string | null) => value ? new Date(value).toLocaleString() : "—";
type Action = "publish" | "submit" | "approve" | "reject" | "retire";

export default function TemplateReviewPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const access = useLetterAccess();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const templateQuery = useLetterTemplate(uuid);
  const history = useTemplateVersions(uuid);
  const operations = useTemplatePublishing(uuid);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const versions = history.data?.data.versions ?? [];
  const selected = versions.find((v) => v.id === selectedId) ?? versions[0];
  const pendingReview = versions.find((v) => v.status === "review_required");
  const draft = versions.find((v) => v.status === "draft");
  const previous = versions.find((v) => selected && v.version < selected.version && v.published_at);
  const changes = selected ? changedVersionFields(selected, previous) : null;
  const preview = usePreviewLetterTemplate(access.canManageTemplates && selected?.content ? uuid : null, selected?.id);
  const busy = Object.values(operations).some((mutation) => mutation.isPending);
  const canReview = Boolean(selected && selected.id === pendingReview?.id && canReviewVersion(selected, userId));
  const template = templateQuery.data?.data;

  async function confirm() {
    if (!selected || !action || busy) return;
    if ((action === "approve" || action === "reject") && !canReview) return;
    if (action === "reject" && !note.trim()) { toast.error("A rejection note is required."); return; }
    try {
      let message = "Template updated.";
      if (action === "publish") {
        const result = await operations.publish.mutateAsync();
        message = result.routedToReview ? "Submitted for review. A different user must approve it." : "Template published successfully.";
      } else if (action === "submit") {
        await operations.submit.mutateAsync(); message = "Submitted for review.";
      } else if (action === "retire") {
        await operations.retire.mutateAsync(selected.id); message = "Version retired. Existing letters are unchanged.";
      } else {
        await operations.review.mutateAsync(action === "reject" ? { decision: "reject", note: note.trim() } : { decision: "approve" });
        message = action === "approve" ? "Version approved and published." : "Version returned to draft with your note.";
      }
      setAction(null); setNote(""); toast.success(message);
    } catch (error) { showApiError(error); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <LetterPageHeader title={`${template?.name ?? "Template"} — Publishing & review`} description="Compare frozen versions, review changes and manage publication." back={{ href: "/letter-forge/templates", label: "Back to templates" }}>
        <Button variant="outline" disabled={history.isFetching || busy} onClick={() => void history.refetch()}>Refresh history</Button>
      </LetterPageHeader>
      {(history.isPending || templateQuery.isPending) && <p role="status">Loading version history…</p>}
      {(history.error || templateQuery.error) && <p className="text-destructive">{getLetterForgeError(history.error ?? templateQuery.error).message}</p>}
      {history.isSuccess && !versions.length && <p>No versions yet. Save a template draft first.</p>}
      {selected && (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Version history</h2>
            <p className="text-sm text-muted-foreground">{history.data?.data.maker_checker_required ? "This category requires a different maker and checker." : "Drafts in this category can be published directly."}</p>
            {versions.map((v) => <button type="button" key={v.id} disabled={busy || Boolean(action)} onClick={() => setSelectedId(v.id)} className={`block w-full space-y-1 rounded border p-3 text-left ${v.id === selected.id ? "border-indigo-800 bg-indigo-50" : "hover:bg-muted"}`}>
              <span className="flex items-center justify-between"><strong>Version {v.version}</strong><LetterStatus status={v.status} /></span>
              <span className="block text-sm">{v.maker?.name ?? (v.created_by ? `User #${v.created_by}` : "Maker unavailable")}</span>
              <span className="block text-xs text-muted-foreground">{date(v.created_at ?? v.submitted_at ?? v.published_at)}{v.is_active ? " · Current version" : ""}</span>
            </button>)}
          </aside>
          <section className="space-y-5">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Version {selected.version}</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Maker</dt><dd>{selected.maker?.name ?? `User #${selected.created_by ?? "unknown"}`}</dd></div>
                <div><dt className="text-muted-foreground">Submitted</dt><dd>{date(selected.submitted_at)}</dd></div>
                <div><dt className="text-muted-foreground">Submitted by</dt><dd>{selected.submitter?.name ?? selected.submitted_by ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Published</dt><dd>{date(selected.published_at)}</dd></div>
              </dl>
              {selected.review_note && <p className="rounded bg-amber-50 p-3 text-sm">Review note: {selected.review_note}</p>}
              <div className="flex flex-wrap gap-2">
                {access.canManageTemplates && !template?.is_system_default && selected.id === draft?.id && selected.status === "draft" && !pendingReview && <>
                  <Button disabled={busy || history.isFetching} onClick={() => setAction("publish")}>Publish draft</Button>
                  {history.data?.data.maker_checker_required && <Button variant="outline" disabled={busy || history.isFetching} onClick={() => setAction("submit")}>Submit for review</Button>}
                </>}
                {access.canManageTemplates && canReview && <><Button disabled={busy || history.isFetching} onClick={() => setAction("approve")}>Approve & publish</Button><Button variant="destructive" disabled={busy || history.isFetching} onClick={() => setAction("reject")}>Reject</Button></>}
                {access.canManageTemplates && !template?.is_system_default && selected.status === "published" && <Button variant="outline" disabled={busy || history.isFetching} onClick={() => setAction("retire")}>Retire version</Button>}
              </div>
              {selected.status === "review_required" && !canReview && <p className="text-sm text-muted-foreground">Review requires an eligible checker other than the maker or submitter. If eligibility is unavailable, refresh after the backend update.</p>}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Changes {previous ? `since published version ${previous.version}` : "in the first version"}</h2>
                {changes === null ? <p className="text-sm text-muted-foreground">Field comparison is unavailable from this API response.</p> : changes.length ? changes.map((field) => <details key={field} className="rounded border p-2"><summary className="cursor-pointer text-sm font-medium">{field.replaceAll("_", " ")}</summary><div className="mt-2 space-y-2 text-xs"><p>Previous</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap">{contentValue(previous, field)}</pre><p>Selected version</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap">{contentValue(selected, field)}</pre></div></details>) : <p className="text-sm">No content changes.</p>}
              </div>
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><h2 className="font-semibold">Frozen version preview</h2>
                {!access.canManageTemplates ? <p className="text-sm">Template management permission is required to preview content.</p> : !selected.content ? <p className="text-sm">Deploy the version-history backend update to preview frozen content.</p> : preview.isFetching ? <Loader2 aria-label="Loading preview" className="animate-spin" /> : preview.error ? <><p className="text-sm text-destructive">{getLetterForgeError(preview.error).message}</p><Button variant="outline" onClick={() => void preview.refetch()}>Retry preview</Button></> : preview.data && <iframe title={`Version ${selected.version} preview`} sandbox="" referrerPolicy="no-referrer" className="h-[60vh] w-full border bg-white" srcDoc={`<!doctype html><html dir="${template?.language === "en" ? "ltr" : "rtl"}"><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><style>body{padding:20px;font-family:Arial;color:#111;overflow-wrap:anywhere}</style></head><body>${preview.data.data.html}</body></html>`} />}
              </div>
            </div>
          </section>
        </div>
      )}
      <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !busy) { setAction(null); setNote(""); } }}>
        <DialogContent><DialogHeader><DialogTitle>{action === "reject" ? "Reject version" : "Confirm publishing action"}</DialogTitle><DialogDescription>{action === "retire" ? "Retiring removes this version from future use. Existing letters keep their version." : action === "publish" ? "Publish the latest draft. Sensitive categories will be submitted for review automatically." : `Confirm ${action ?? "action"} for version ${selected?.version ?? ""}.`}</DialogDescription></DialogHeader>
          {action === "reject" && <label className="space-y-2 text-sm">Rejection note (required)<textarea aria-label="Rejection note" maxLength={1000} className="mt-2 min-h-28 w-full rounded border p-2" value={note} onChange={(event) => setNote(event.target.value)} /><span>{note.length}/1000</span></label>}
          <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setAction(null)}>Cancel</Button><Button disabled={busy || (action === "reject" && !note.trim())} onClick={() => void confirm()}>{busy ? "Saving…" : "Confirm"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function contentValue(version: TemplateVersion | undefined, field: string): string {
  const value = version?.content?.[field as keyof NonNullable<TemplateVersion["content"]>];
  return typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2);
}
