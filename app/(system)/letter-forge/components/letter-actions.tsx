"use client";
import { showApiError } from "@/lib/error-toast";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Bell, Download, Send, ShieldX, FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGeneratedLetterActions } from "@/hooks/use-generated-letters";
import { useLetterAccess } from "@/hooks/use-letter-forge";
import { useAppSelector } from "@/store/hooks";
import { downloadLetter } from "@/services/generated-letters";
import { getLetterForgeError } from "@/services/letter-forge";
import { parseLetterExtraData } from "@/lib/letter-publishing";
import { letterActions, REMINDER_COOLDOWN } from "@/lib/generated-letter-state";
import type { DispatchChannel, LetterRecord } from "@/types/generated-letters";
import { fieldClass, primaryButton } from "./letter-ui";

const channels: { value: DispatchChannel; label: string; detail: string }[] = [
  { value: "email", label: "Send by email", detail: "Send the PDF to the employee’s registered email." },
  { value: "in_app", label: "Push to portal", detail: "Deliver to the employee’s letter inbox." },
  { value: "print", label: "Mark for printing", detail: "Record physical printing and manual handover." },
  { value: "none", label: "Record issuance only", detail: "Record issuance without electronic delivery." },
];
type Action = "dispatch" | "revoke" | "supersede";
export function LetterActions({ letter, onReplacement }: { letter: LetterRecord; onReplacement?: (uuid: string) => void }) {
  const router = useRouter();
  const access = useLetterAccess();
  const actions = useGeneratedLetterActions(letter.uuid);
  const allowed = letterActions(letter);
  const owner = useAppSelector((state) => `${state.auth.company?.id ?? ""}:${state.auth.user?.id ?? ""}`);
  const cooldownKey = `letter-forge:reminder:${owner}:${letter.uuid}`;
  const [dialog, setDialog] = useState<Action | null>(null);
  const [channel, setChannel] = useState<DispatchChannel>("email");
  const [reason, setReason] = useState("");
  const [extra, setExtra] = useState("{}");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);
  const lastReminder = useRef(0);
  const [downloading, setDownloading] = useState(false);
  const lock = useRef(false);
  const pending = Object.values(actions).some((action) => action.isPending);
  useEffect(() => {
    const tick = () => {
      let saved = lastReminder.current;
      try { saved = Math.max(saved, Number(localStorage.getItem(cooldownKey)) || 0); } catch { /* Memory fallback. */ }
      setRemaining(Math.max(0, Math.ceil((saved + REMINDER_COOLDOWN - Date.now()) / 1000)));
    };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [cooldownKey]);
  function open(action: Action) { setReason(""); setExtra("{}"); setError(""); setDialog(action); }
  async function download() {
    if (downloading) return;
    setDownloading(true);
    try { await downloadLetter(letter.uuid, `${letter.template_key}-${letter.series_number || letter.uuid}.pdf`); }
    catch (err) { showApiError(err); }
    finally { setDownloading(false); }
  }
  async function remind() {
    if (lock.current || remaining > 0) return;
    lock.current = true;
    try {
      const response = await actions.remind.mutateAsync();
      lastReminder.current = Date.now();
      try { localStorage.setItem(cooldownKey, String(lastReminder.current)); } catch { /* Memory fallback. */ }
      setRemaining(REMINDER_COOLDOWN / 1000);
      toast.success(response.data.message || response.message);
    } catch (err) { showApiError(err); }
    finally { lock.current = false; }
  }
  async function confirm() {
    if (lock.current || !dialog) return;
    if ((dialog === "revoke" || dialog === "supersede") && (reason.trim().length < 10 || reason.length > 1000)) { setError("Enter a reason of 10–1,000 characters."); return; }
    lock.current = true; setError("");
    try {
      if (dialog === "dispatch") {
        const response = await actions.dispatch.mutateAsync(channel);
        if (response.data.error_message) { setError(response.data.error_message); toast.error(response.data.error_message); return; }
        toast.success(response.data.status === "dispatched" ? "Letter dispatched." : `Letter is now ${response.data.status.replaceAll("_", " ")}.`);
      } else if (dialog === "revoke") { await actions.revoke.mutateAsync(reason); toast.success("Employee access revoked."); }
      else {
        const response = await actions.supersede.mutateAsync({ reason, extra_data: parseLetterExtraData(extra) });
        toast.success("Corrected replacement created.");
        if (onReplacement) onReplacement(response.data.uuid);
        else router.push(`/letter-forge/letters/${response.data.uuid}`);
      }
      setDialog(null);
    } catch (err) { const message = getLetterForgeError(err).message; setError(message); showApiError(err); }
    finally { lock.current = false; }
  }
  const title = dialog === "dispatch" ? "Dispatch letter" : dialog === "revoke" ? "Revoke access" : "Issue corrected replacement";
  return <div className="space-y-3">
    {letter.artifacts_expired_at ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Artifact expired. The PDF was removed under the retention policy; the letter record remains available.</p> : <Button className="w-full" variant="outline" disabled={!allowed.download || downloading} onClick={() => void download()}><Download size={16} />{downloading ? "Downloading…" : letter.signed_pdf_path ? "Download signed PDF" : "Download PDF"}</Button>}
    {letter.error_message && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{letter.error_message}</p>}
    {access.canManageLetters && <>
      <Button className={`w-full ${primaryButton}`} disabled={pending || !allowed.dispatch} onClick={() => open("dispatch")}><Send size={16} />{letter.status === "pending_signature" ? "Retry signing setup" : "Dispatch letter"}</Button>
      {!allowed.dispatch && !["dispatched", "revoked", "superseded", "recalled", "rejected", "failed"].includes(letter.status) && <p className="text-xs leading-relaxed text-slate-500">Dispatch becomes available when the PDF and required approvals are ready. The server checks the signature gate.</p>}
      {allowed.remind && <Button className="w-full" variant="outline" disabled={pending || remaining > 0} onClick={() => void remind()}><Bell size={16} />{remaining > 0 ? `Remind again in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "Send reminder"}</Button>}
      {(allowed.revoke || allowed.supersede) && <div className="space-y-2 border-t border-slate-100 pt-4">{allowed.supersede && <Button className="w-full" variant="outline" disabled={pending} onClick={() => open("supersede")}><FilePenLine size={16} />Issue corrected replacement</Button>}{allowed.revoke && <Button className="w-full text-rose-700 hover:text-rose-800" variant="outline" disabled={pending} onClick={() => open("revoke")}><ShieldX size={16} />Revoke access</Button>}</div>}
    </>}
    <Dialog open={Boolean(dialog)} onOpenChange={(value) => { if (!value && !pending) setDialog(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{dialog === "dispatch" ? (letter.status === "pending_signature" ? "Retry DMS signing setup. An active request is reused; a declined or expired request can be replaced." : letter.signature_policy === "internal_signatory" && letter.status !== "signed" ? "This first dispatch starts DMS signing and sends signing codes automatically. Final delivery happens after all signers finish." : "Choose how the completed letter will be delivered.") : dialog === "revoke" ? "Remove employee self-service access. The letter and delivery history remain in the audit record." : "Create a new letter through the normal approval and signature process. Both records remain linked."}</DialogDescription></DialogHeader>
      {dialog === "dispatch" ? <div className="space-y-2">{channels.map((item) => <label key={item.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${channel === item.value ? "border-indigo-400 bg-indigo-50" : "border-slate-200"}`}><input type="radio" name="channel" value={item.value} checked={channel === item.value} disabled={pending} onChange={() => setChannel(item.value)} className="mt-1" /><span><span className="block text-sm font-semibold">{item.label}</span><span className="text-xs text-slate-500">{item.detail}</span></span></label>)}</div> : <div className="space-y-4"><label className="block space-y-2 text-sm font-medium">Reason<textarea className={`${fieldClass} min-h-28`} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} disabled={pending} placeholder="Explain why this action is needed…" /><span className="block text-xs font-normal text-slate-500">{reason.length}/1,000 · At least 10 characters. Saved verbatim for audit.</span></label>{dialog === "supersede" && <label className="block space-y-2 text-sm font-medium">Replacement values (optional)<textarea className={`${fieldClass} min-h-28 font-mono`} value={extra} onChange={(event) => setExtra(event.target.value)} disabled={pending} /><span className="block text-xs font-normal text-slate-500">Example: {`{"monthly_amount":"95,000"}`}</span></label>}</div>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <DialogFooter><Button variant="outline" disabled={pending} onClick={() => setDialog(null)}>Cancel</Button><Button className={dialog === "revoke" ? undefined : primaryButton} variant={dialog === "revoke" ? "destructive" : "default"} disabled={pending || ((dialog === "revoke" || dialog === "supersede") && reason.trim().length < 10)} onClick={() => void confirm()}>{pending ? "Saving…" : dialog === "dispatch" ? channels.find((item) => item.value === channel)?.label : title}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
