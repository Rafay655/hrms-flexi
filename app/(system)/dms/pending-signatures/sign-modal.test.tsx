import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { SignModal } from './sign-modal';
import type { DmsEsignSignatory } from '@/types/dms';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/lib/error-toast', () => ({ showApiError: vi.fn() }));
let root: Root, container: HTMLDivElement, client: QueryClient;
const signed = vi.fn();
beforeEach(() => {
 vi.resetAllMocks(); vi.useFakeTimers();
 (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
 container = document.createElement('div'); document.body.append(container); root = createRoot(container);
 client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });
async function render(status = 'notified', expiry = new Date(Date.now() + 600000).toISOString()) {
 const signatory = { uuid: 'signer', signature_request_uuid: 'request', status, name: 'Ahmed', email: 'a@example.com', otp_expires_at: expiry } as DmsEsignSignatory;
 await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(SignModal, { signatory, open: true, onSigned: signed, onOpenChange: vi.fn() }))));
}
async function click(text: string) {
 await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === text)!.click());
 await act(async () => { await vi.advanceTimersByTimeAsync(10); });
}
async function code(value: string) {
 await act(async () => {
 const input = document.querySelector('#signature-otp') as HTMLInputElement;
 Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
 input.dispatchEvent(new Event('input', { bubbles: true }));
 });
}
it('does not send OTP on open and prevents waiting signers from requesting one', async () => {
 await render('pending');
 expect(api.post).not.toHaveBeenCalled();
 expect((document.querySelector('#signature-otp') as HTMLInputElement).disabled).toBe(true);
 await click('Resend OTP'); expect(api.post).not.toHaveBeenCalled();
});
it('verifies with both UUIDs and refreshes both modules on success', async () => {
 vi.mocked(api.post).mockResolvedValue({ data: { data: { status: 'signed' } } });
 const invalidate = vi.spyOn(client, 'invalidateQueries');
 await render(); await code('123456'); await click('Sign document');
 expect(api.post).toHaveBeenCalledWith('/dms/signature-requests/request/signatories/signer/verify', { otp: '123456' });
 expect(signed).toHaveBeenCalledOnce();
 expect(invalidate).toHaveBeenCalledWith({ queryKey: ['letter-forge', 'letters'] });
});
it('keeps failed signing open and enables explicit resend', async () => {
 vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 429 } }).mockResolvedValue({ data: { data: null } });
 await render(); await code('123456'); await click('Sign document');
 expect(signed).not.toHaveBeenCalled(); expect(document.body.textContent).toContain('Too many attempts');
 await click('Resend OTP');
 expect(api.post).toHaveBeenLastCalledWith('/dms/signature-requests/request/signatories/signer/resend-otp');
 expect(document.body.textContent).toContain('Resend in');
});
it('prevents verification of an expired code', async () => {
 await render('notified', new Date(Date.now() - 1000).toISOString());
 expect((document.querySelector('#signature-otp') as HTMLInputElement).disabled).toBe(true);
 expect(document.body.textContent).toContain('Code expired'); expect(api.post).not.toHaveBeenCalled();
});
