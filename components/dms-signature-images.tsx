"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { showApiError } from "@/lib/error-toast";
import { listSignatureImages, normalizeSignatureImages, uploadSignatureImage, previewSignatureImage, confirmSignatureImage, revokeSignatureImage, type SignatureImage } from "@/services/signature-images";

function ImageReview({ image, onClose, onChanged }: { image: SignatureImage; onClose: () => void; onChanged: () => void }) {
  const img = useRef<HTMLImageElement>(null);
  const [consent, setConsent] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { data, error, isPending } = useQuery({ queryKey: ["dms", "signature-image-preview", image.uuid], queryFn: ({ signal }) => previewSignatureImage(image.uuid, signal), gcTime: 0, staleTime: 0, retry: false });
  useEffect(() => {
    if (!data) return;
    const url = URL.createObjectURL(data);
    if (img.current) img.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [data]);
  useEffect(() => { if (error) showApiError(error); }, [error]);
  const confirm = useMutation({ mutationFn: () => confirmSignatureImage(image), onSuccess: () => { toast.success("Signature image activated."); onChanged(); onClose(); }, onError: (error) => showApiError(error) });
  return <Dialog open onOpenChange={(open) => { if (!open && !confirm.isPending) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Review signature image</DialogTitle><DialogDescription>Review the processed image that will appear on your documents.</DialogDescription></DialogHeader>
    {isPending ? <p>Loading preview…</p> : error ? <p role="alert">Preview unavailable. Close and try again.</p> : <div className="rounded-lg border bg-white p-6">
      {/* Processed private blob; do not send this image through an optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); toast.error("Unable to display this signature image."); }} alt="Your processed signature" className="mx-auto max-h-48 object-contain" /></div>}
    {image.status === "draft" && <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I confirm this is my signature and approve this processed image.</label>}
    <DialogFooter><Button variant="outline" disabled={confirm.isPending} onClick={onClose}>Close</Button>{image.status === "draft" && <Button disabled={!consent || !loaded || !data || !!error || confirm.isPending} onClick={() => confirm.mutate()}>Confirm signature</Button>}</DialogFooter>
  </DialogContent></Dialog>;
}

export function SignatureImages({ value, onChange, disabled = false }: { value: string; onChange: (uuid: string) => void; disabled?: boolean }) {
  const client = useQueryClient();
  const [review, setReview] = useState<SignatureImage | null>(null);
  const [revoke, setRevoke] = useState<SignatureImage | null>(null);
  const { data: images = [], error, isPending, refetch } = useQuery({ queryKey: ["dms", "signature-images"], queryFn: ({ signal }) => listSignatureImages(signal), select: normalizeSignatureImages });
  useEffect(() => { if (error) showApiError(error); }, [error]);
  const refresh = () => { void client.invalidateQueries({ queryKey: ["dms", "signature-images"] }); };
  const upload = useMutation({ mutationFn: uploadSignatureImage, onSuccess: (image) => { refresh(); setReview(image); }, onError: (error) => showApiError(error) });
  const remove = useMutation({ mutationFn: (uuid: string) => revokeSignatureImage(uuid), onSuccess: () => { if (value === revoke?.uuid) onChange(""); setRevoke(null); refresh(); toast.success("Signature image revoked."); }, onError: (error) => showApiError(error) });
  const busy = disabled || upload.isPending || remove.isPending;
  return <fieldset disabled={busy} className="space-y-3 rounded-lg border p-3">
    <legend className="px-1 text-sm font-semibold">Signature image (optional)</legend>
    <label className="flex gap-2 text-sm"><input type="radio" checked={!value} onChange={() => onChange("")} />OTP only — no image stamp</label>
    {isPending && <p className="text-xs">Loading saved signatures…</p>}
    {error && <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>Retry loading signatures</Button>}
    {images.map((image) => <div key={image.uuid} className="flex flex-wrap items-center gap-2 text-sm">
      <label className="mr-auto flex gap-2"><input type="radio" checked={value === image.uuid} disabled={image.status !== "active"} onChange={() => onChange(image.uuid)} />Version {image.version} · {image.status}</label>
      {image.status !== "revoked" && <><Button type="button" size="sm" variant="ghost" onClick={() => setReview(image)}>{image.status === "draft" ? "Review & confirm" : "Preview"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setRevoke(image)}>Revoke</Button></>}
    </div>)}
    <label className="block space-y-1 text-xs text-muted-foreground">Upload a signature scan (maximum 2 MB)<Input type="file" accept="image/*" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (!file.type.startsWith("image/") || file.size > 2048 * 1024) { toast.error("Choose an image no larger than 2 MB."); return; } upload.mutate(file); }} /></label>
    {upload.isPending && <p role="status" className="text-xs">Uploading and processing signature…</p>}
    <p className="text-xs text-muted-foreground">An image adds a visual signature. OTP verification is still required. PDF stamping may finish after signing.</p>
    {review && <ImageReview key={review.uuid} image={review} onClose={() => setReview(null)} onChanged={refresh} />}
    {revoke && <Dialog open onOpenChange={(open) => { if (!open && !remove.isPending) setRevoke(null); }}><DialogContent><DialogHeader><DialogTitle>Revoke signature image?</DialogTitle><DialogDescription>This cannot be undone. This image will no longer be available for signing.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setRevoke(null)}>Cancel</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(revoke.uuid)}>Revoke image</Button></DialogFooter></DialogContent></Dialog>}
  </fieldset>;
}
