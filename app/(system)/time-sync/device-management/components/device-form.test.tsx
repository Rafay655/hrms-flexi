import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { branchService } from '@/services/branch.service';
import { DeviceFormModal } from './device-form-modal';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock('@/store/hooks', () => ({ useAppSelector: vi.fn() }));
vi.mock('@/services/branch.service', () => ({ branchService: { getAll: vi.fn().mockResolvedValue({ data: { data: [], meta: { last_page: 1 } } }) } }));
vi.mock('@/services/device-type.service', () => ({ deviceTypeService: { getAll: vi.fn().mockResolvedValue({ data: { data: [], meta: { last_page: 1 } } }) } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
let root: Root, container: HTMLDivElement, client: QueryClient;
const close = vi.fn();
const branch = '54be7468-3a09-4f26-9f7d-df59717cb1bc';
const type = '19d2b0fa-d06f-4289-87f1-3c5970b7154e';
const device = { id: 'device-uuid', friendly_name: 'Main gate', hardware_device_id: '1959743', branch_id: branch, branch: { name: 'Lahore' }, device_type_id: type, device_type: { name: 'EZFace' }, is_active: true, sync_enabled: true, device_driver: 'db_direct', sync_protocol: 'db_api', db_name: 'ezface', db_port: 3306, db_password_set: true, sync_cursor: 0, mappings: [{ system_attribute: 'employee_id', device_key: 'userid', is_required: true, default_value: null, notes: null }] };
beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { company: { id: 'company' }, user: { id: 'user' } } } as never));
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: device } });
  vi.mocked(api.put).mockResolvedValue({ data: { success: true, data: device } });
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function render() {
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(DeviceFormModal, { uuid: 'device-uuid', onClose: close }))));
  await act(async () => { await vi.advanceTimersByTimeAsync(20); });
}
async function click(text: string) {
  const button = [...document.querySelectorAll('button')].find(item => item.textContent === text);
  expect(button).toBeTruthy(); await act(async () => button!.click()); await act(async () => { await vi.advanceTimersByTimeAsync(20); });
}
it('loads fresh details for editing and leaves saved credentials and mappings untouched', async () => {
  await render();
  expect(branchService.getAll).toHaveBeenCalledWith({ per_page: 1000 });
  expect((document.querySelector('#device-db_password') as HTMLInputElement).value).toBe('');
  expect((document.querySelector('#device-sync_cursor') as HTMLInputElement).value).toBe('0');
  await click('Save changes');
  expect(api.put).toHaveBeenCalledExactlyOnceWith('/time-sync/devices/device-uuid', expect.objectContaining({ branch_id: branch, device_type_id: type, db_port: 3306, sync_cursor: 0 }));
  expect(vi.mocked(api.put).mock.calls[0][1]).not.toHaveProperty('db_password');
  expect(vi.mocked(api.put).mock.calls[0][1]).not.toHaveProperty('mappings');
  expect(close).toHaveBeenCalledOnce();
});
it('sends an empty mapping array only after explicitly removing all mappings', async () => {
  await render();
  await act(async () => (document.querySelector('[aria-label="Remove mapping 1"]') as HTMLButtonElement).click());
  await click('Save changes');
  expect(api.put).toHaveBeenCalledWith('/time-sync/devices/device-uuid', expect.objectContaining({ mappings: [] }));
});
it('keeps server validation errors visible and does not close the form', async () => {
  vi.mocked(api.put).mockRejectedValue({ response: { status: 422, data: { errors: { db_host: ['Database host is invalid.'] } } } });
  await render(); await click('Save changes');
  expect(document.body.textContent).toContain('Database host is invalid.'); expect(close).not.toHaveBeenCalled();
});
