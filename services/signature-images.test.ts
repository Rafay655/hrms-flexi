import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { listSignatureImages, uploadSignatureImage, previewSignatureImage, confirmSignatureImage, revokeSignatureImage } from './signature-images';
import { verifySignatureOtp, verifySignatoryOtp } from './dms.service';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
beforeEach(() => { vi.resetAllMocks(); vi.mocked(api.post).mockResolvedValue({ data: { data: {} } }); });
it.each([
  { data: [{ uuid: 'image-uuid' }] },
  { data: { data: [{ uuid: 'image-uuid' }], current_page: 1 } },
  { data: { data: { data: [{ uuid: 'image-uuid' }], meta: { total: 1 } } } },
])('unwraps signature collection envelopes: %j', async (body) => {
  vi.mocked(api.get).mockResolvedValue({ data: body });
  expect(await listSignatureImages()).toEqual([{ uuid: 'image-uuid' }]);
});
it('reports unsupported responses as a query error instead of passing an object to the UI', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: { unexpected: true } } });
  await expect(listSignatureImages()).rejects.toThrow('unexpected response format');
});
it('uploads the image as multipart data and confirms the exact server hash', async () => {
 const file = new File(['image'], 'signature.png', { type: 'image/png' });
 await uploadSignatureImage(file);
 const [url, form] = vi.mocked(api.post).mock.calls[0];
 expect(url).toBe('/dms/signature-images'); expect((form as FormData).get('image')).toBe(file);
 await confirmSignatureImage({ uuid: 'image-uuid', version: 1, status: 'draft', content_hash: 'server-hash', confirmed_at: null });
 expect(api.post).toHaveBeenLastCalledWith('/dms/signature-images/image-uuid/confirm', { sha256: 'server-hash' });
});
it('uses authenticated listing, blob preview and revocation endpoints', async () => {
 vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } }).mockResolvedValueOnce({ data: new Blob(['png']) });
 expect(await listSignatureImages()).toEqual([]);
 await previewSignatureImage('image-uuid');
 expect(api.get).toHaveBeenLastCalledWith('/dms/signature-images/image-uuid/preview', expect.objectContaining({ responseType: 'blob' }));
 await revokeSignatureImage('image-uuid'); expect(api.delete).toHaveBeenCalledWith('/dms/signature-images/image-uuid');
});
it('binds the optional image on both verify routes but preserves OTP-only payloads', async () => {
 await verifySignatoryOtp('request', 'signer', '123456', 'active-image');
 expect(api.post).toHaveBeenLastCalledWith('/dms/signature-requests/request/signatories/signer/verify', { otp: '123456', signature_image_uuid: 'active-image' });
 await verifySignatureOtp('request', '123456', 'active-image');
 expect(api.post).toHaveBeenLastCalledWith('/dms/signature-requests/request/verify', { otp: '123456', signature_image_uuid: 'active-image' });
 await verifySignatoryOtp('request', 'signer', '123456');
 expect(api.post).toHaveBeenLastCalledWith('/dms/signature-requests/request/signatories/signer/verify', { otp: '123456' });
});
