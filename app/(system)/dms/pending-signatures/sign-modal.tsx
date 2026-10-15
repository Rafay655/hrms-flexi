"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { SignatureImages } from "@/components/dms-signature-images";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showApiError } from "@/lib/error-toast";
import { getSigningDocumentBlob, resendSignatureOtp, verifySignatoryOtp } from "@/services/dms.service";
import type { DmsEsignSignatory } from "@/types/dms";

function DocumentPreview({ uuid }: { uuid: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const download = useRef<HTMLAnchorElement>(null);
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["dms", "signing-preview", uuid],
    queryFn: ({ signal }) => getSigningDocumentBlob(uuid, signal),
    retry: false,
    gcTime: 0,
  });
  useEffect(() => {
    if (!data) return;
    const objectUrl = URL.createObjectURL(data);
    if (frame.current) frame.current.src = objectUrl;
    if (download.current) download.current.href = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [data]);
  useEffect(() => { if (error) showApiError(error); }, [error]);
  if (isPending) return <p role="status" className="text-sm text-muted-foreground">Loading document…</p>;
  if (error) return <div role="alert" className="text-sm">Unable to load the document. <Button variant="outline" size="sm" onClick={() => void refetch()}>Retry preview</Button></div>;
  if (!data) return null;
  return <div className="space-y-2">
    {data.type === "application/pdf" ? <iframe ref={frame} title="Document to sign" className="h-[45vh] w-full rounded border" /> : <p className="text-sm text-muted-foreground">Download this document to read it before signing.</p>}
    <a ref={download} className="text-sm font-medium underline" download={`document-${uuid}${data.type === "application/pdf" ? ".pdf" : ""}`}>Download document</a>
  </div>;
}

export function SignatureDocumentModal({ signatory, onClose }: {
  signatory: DmsEsignSignatory;
  onClose: () => void;
}) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-semibold">View document</DialogTitle>
        <DialogDescription>{signatory.document?.title ?? "Document awaiting signature"}</DialogDescription>
      </DialogHeader>
      {signatory.document?.uuid ? <DocumentPreview uuid={signatory.document.uuid} /> : <p className="text-sm text-muted-foreground">Document details are unavailable.</p>}
      <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function SignModal({ signatory, open, onOpenChange, onSigned }: {
  signatory: DmsEsignSignatory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSigned: () => void;
}) {
  const client = useQueryClient();
  const [otp, setOtp] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [locked, setLocked] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const waiting = signatory.status === "pending";
  const expiresAt = signatory.otp_expires_at ? Date.parse(signatory.otp_expires_at) : NaN;
  const seconds = Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : null;
  const expired = seconds === 0;
  const cooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["dms"] });
    void client.invalidateQueries({ queryKey: ["letter-forge", "letters"] });
  };
  const resend = useMutation({
    mutationFn: () => resendSignatureOtp(signatory.signature_request_uuid, signatory.uuid),
    onSuccess: async () => {
      setOtp(""); setLocked(false); setMessage(null); setCooldownUntil(Date.now() + 60_000);
      toast.success("A new signing code has been sent to your email.");
      await client.invalidateQueries({ queryKey: ["dms", "pending-signatures"] });
    },
    onError: (error) => { showApiError(error); setMessage("Unable to resend the code. Please try again."); },
  });
  const verify = useMutation({
    mutationFn: () => verifySignatoryOtp(signatory.signature_request_uuid, signatory.uuid, otp, signatureImage || undefined),
    onSuccess: () => { toast.success("Document signed successfully."); refresh(); onSigned(); onOpenChange(false); },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 429) setLocked(true);
      setMessage(status === 429 ? "Too many attempts. Request a new code before trying again." : "Signing failed. Check the code or request a new one.");
      showApiError(error); setOtp("");
    },
  });
  const busy = resend.isPending || verify.isPending;
  const unavailable = waiting || expired || locked || !signatory.signature_request_uuid;
  return <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
    <DialogContent className={preview ? "sm:max-w-3xl max-h-[90vh] overflow-y-auto" : "sm:max-w-lg max-h-[90vh] overflow-y-auto"}>
      <DialogHeader>
        <DialogTitle className="font-semibold">Sign document</DialogTitle>
        <DialogDescription>{signatory.document?.title ?? "Document awaiting your signature"}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {signatory.document?.uuid ? <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>{preview ? "Hide document" : "View document"}</Button> : <p className="text-sm text-muted-foreground">Document preview is unavailable because this request has no document reference.</p>}
        {preview && signatory.document?.uuid && <DocumentPreview uuid={signatory.document.uuid} />}
        {waiting ? <p role="status" className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">Waiting for earlier signers or for the signing code to be issued. Your code will be sent when it is your turn.</p> : <p className="text-sm text-muted-foreground">Read the document, then enter the six-digit code sent to {signatory.email || "your registered email"}.</p>}
        <SignatureImages value={signatureImage} onChange={setSignatureImage} disabled={busy || waiting} />
        <div className="space-y-2">
          <Label htmlFor="signature-otp">Signing code</Label>
          <Input id="signature-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Enter 6-digit code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} disabled={busy || unavailable} aria-invalid={Boolean(message)} aria-describedby={message ? "signature-error" : undefined} />
          {!waiting && <p className="text-xs text-muted-foreground">{expired ? "Code expired. Request a new code." : seconds === null ? "Enter your latest signing code." : `Code expires in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</p>}
          {message && <p id="signature-error" role="alert" className="text-sm text-destructive">{message}</p>}
        </div>
        <Button variant="link" size="sm" className="px-0" disabled={busy || waiting || cooldown > 0 || !signatory.signature_request_uuid} onClick={() => resend.mutate()}>{resend.isPending ? "Sending…" : cooldown ? `Resend in ${cooldown}s` : "Resend OTP"}</Button>
      </div>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button className="bg-[#1E1B4B] hover:bg-[#2A2675]" disabled={busy || unavailable || !/^\d{6}$/.test(otp)} onClick={() => verify.mutate()}>{verify.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign document</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
