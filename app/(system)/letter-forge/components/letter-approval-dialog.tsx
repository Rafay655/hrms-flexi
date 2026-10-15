"use client";
import { showApiError } from "@/lib/error-toast";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLetterApproval } from "@/hooks/use-generated-letters";
import { getLetterForgeError } from "@/services/letter-forge";
import type { LetterRecord } from "@/types/generated-letters";
import { fieldClass, primaryButton } from "./letter-ui";

export function LetterApprovalDialog({ letter, action, onClose }: { letter: LetterRecord; action: "approve" | "reject"; onClose: () => void }) {
  const operations = useLetterApproval(letter.uuid);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  const busy = operations.approve.isPending || operations.reject.isPending;
  async function confirm() {
    if (lock.current || letter.status !== "pending_approval") return;
    lock.current = true; setError("");
    try {
      if (action === "approve") await operations.approve.mutateAsync();
      else await operations.reject.mutateAsync(reason);
      toast.success(action === "approve" ? "Letter approved." : "Letter rejected."); onClose();
    } catch (err) { const message = getLetterForgeError(err).message; setError(message); showApiError(err); }
    finally { lock.current = false; }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent><DialogHeader><DialogTitle>{action === "approve" ? "Approve letter" : "Reject letter"}</DialogTitle><DialogDescription>{letter.template?.name ?? letter.template_key} · {letter.employee?.name ?? `Employee #${letter.employee_id}`}. {action === "approve" ? "Approval lets this letter continue through its required generation and signature steps." : "Provide a reason. Rejection stops this letter’s workflow."}</DialogDescription></DialogHeader>{action === "reject" && <label className="space-y-2 text-sm font-medium">Rejection reason<textarea aria-label="Rejection reason" className={`${fieldClass} min-h-28`} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} disabled={busy} /><span className="text-xs text-slate-500">{reason.length}/1,000</span></label>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button className={action === "approve" ? primaryButton : undefined} variant={action === "reject" ? "destructive" : "default"} disabled={busy || letter.status !== "pending_approval" || (action === "reject" && !reason.trim())} onClick={() => void confirm()}>{busy ? "Saving…" : action === "approve" ? "Approve" : "Reject"}</Button></DialogFooter></DialogContent></Dialog>;
}
