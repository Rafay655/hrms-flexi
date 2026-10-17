import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { DeviceActionModal } from './device-detail-modal';
import type { DeviceAction } from './device-detail-modal';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('@/store/hooks', () => ({ useAppSelector: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
let root: Root, container: HTMLDivElement, client: QueryClient;
const device = { id: 'device-uuid', friendly_name: 'Main gate', is_active: true, sync_enabled: true, device_driver: 'db_direct', sync_protocol: 'db_api' };
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers();
  vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { company: { id: 'company' }, user: { id: 'user' } } } as never));
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: device } });
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });
async function render(action: DeviceAction) {
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(DeviceActionModal, { uuid: 'device-uuid', action, onClose: vi.fn() }))));
  await act(async () => { await vi.advanceTimersByTimeAsync(10); });
}
async function click(text: string) {
  const button = [...document.querySelectorAll('button')].find(item => item.textContent === text);
  expect(button, text).toBeTruthy();
  await act(async () => button!.click()); await act(async () => { await vi.advanceTimersByTimeAsync(10); });
}
it('does not rotate on open and shows the one-time key without placing it in query data', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { success: true, message: 'Save the new key.', data: device, one_time_api_key: 'ts_once' } });
  await render('rotate-key'); expect(api.post).not.toHaveBeenCalled();
  await click('Rotate API key');
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/time-sync/devices/device-uuid/rotate-key');
  expect((document.querySelector('[aria-label="New one-time API key"]') as HTMLInputElement).value).toBe('ts_once');
  expect(JSON.stringify(client.getQueryCache().getAll().map(query => query.state.data))).not.toContain('ts_once');
  await act(async () => root.render(null)); await act(async () => { await vi.advanceTimersByTimeAsync(10); });
  expect(client.getMutationCache().getAll()).toHaveLength(0);
});
it('disables sync for an inactive saved device', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { ...device, is_active: false } } });
  await render('sync'); const button = [...document.querySelectorAll('button')].find(item => item.textContent === 'Sync now')!;
  expect(button.disabled).toBe(true); expect(api.post).not.toHaveBeenCalled();
});
it('keeps backend sync validation visible without retrying', async () => {
  vi.mocked(api.post).mockRejectedValue({ response: { status: 422, data: { errors: { sync_enabled: ['Enable the device before syncing.'] } } } });
  await render('sync'); await click('Sync now');
  expect(document.body.textContent).toContain('Enable the device before syncing.');
  expect(api.post).toHaveBeenCalledTimes(1);
});
it('shows a failed probe as a failed connection even when success is true', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { success: true, message: 'Device connection test failed.', data: { connected: false, remote_rows: 0 } } });
  await render('test'); await click('Test connection');
  expect(document.body.textContent).toContain('Device connection test failed.');
  expect(document.body.textContent).toContain('remote_rows');
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/time-sync/devices/device-uuid/test');
});
it('waits for confirmation before deleting and refreshes devices', async () => {
  vi.mocked(api.delete).mockResolvedValue({ status: 204 });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  await render('delete'); expect(api.delete).not.toHaveBeenCalled(); await click('Delete device');
  expect(api.delete).toHaveBeenCalledExactlyOnceWith('/time-sync/devices/device-uuid');
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['attendance-devices'] });
});
