import { api } from "@/lib/api";

export interface SignatureImage {
  uuid: string;
  version: number;
  status: "draft" | "active" | "revoked";
  content_hash: string;
  confirmed_at: string | null;
}
export function normalizeSignatureImages(payload: unknown): SignatureImage[] {
  let value = payload;
  // Accept a plain collection, an API envelope, or a paginated resource envelope.
  for (let depth = 0; depth < 4; depth++) {
    if (Array.isArray(value)) return value as SignatureImage[];
    if (!value || typeof value !== "object" || !("data" in value)) break;
    value = (value as { data: unknown }).data;
  }
  throw new Error("Unable to load saved signatures: unexpected response format.");
}
export async function listSignatureImages(signal?: AbortSignal): Promise<SignatureImage[]> {
  const { data } = await api.get("/dms/signature-images", { signal });
  return normalizeSignatureImages(data);
}
export async function uploadSignatureImage(image: File): Promise<SignatureImage> {
  const payload = new FormData();
  payload.append("image", image);
  const { data } = await api.post("/dms/signature-images", payload, { headers: { "Content-Type": "multipart/form-data" } });
  return data.data;
}
export async function previewSignatureImage(uuid: string, signal?: AbortSignal): Promise<Blob> {
  const { data } = await api.get(`/dms/signature-images/${uuid}/preview`, { responseType: "blob", signal, headers: { "Cache-Control": "no-store" } });
  return data;
}
export async function confirmSignatureImage(image: SignatureImage) {
  const { data } = await api.post(`/dms/signature-images/${image.uuid}/confirm`, { sha256: image.content_hash });
  return data.data as SignatureImage;
}
export async function revokeSignatureImage(uuid: string) {
  await api.delete(`/dms/signature-images/${uuid}`);
}
