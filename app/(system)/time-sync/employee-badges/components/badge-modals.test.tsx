import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useEmployees } from '@/hooks/useEmployees';
import { BulkBadgeModal, EditBadgeModal, RemoveBadgeModal } from './badge-modals';
import type { EmployeeBadge } from '@/types/employee-badge';
vi.mock('@/lib/api', () => ({ api: { put: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('@/hooks/useEmployees', () => ({ useEmployees: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/ui/searchable-select', () => ({ default: (props: { id?: string; 'aria-label'?: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) => createElement('select', { id: props.id, 'aria-label': props['aria-label'], value: props.value, onChange: (event: { target: { value: string } }) => props.onChange(event.target.value) }, createElement('option', { value: '' }, 'Select'), props.options.map(item => createElement('option', { key: item.value, value: item.value }, item.label))) }));
let root: Root, container: HTMLDivElement, client: QueryClient;
const close = vi.fn();
const employee = { id: 'employee-uuid', full_name: 'Example Employee', employee_code: 'EMP-1', device_badge_id: '0042', has_device_badge: true } as EmployeeBadge;
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers();
  vi.mocked(useEmployees).mockReturnValue({ data: [{ id: 42, uuid: 'lookup-uuid', employee_code: 'EMP-1', name: 'Employee One' }, { id: 43, uuid: 'lookup-uuid-2', employee_code: 'EMP-2', name: 'Employee Two' }], isPending: false, isError: false } as never);
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container); client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });
async function render(mode: 'bulk' | 'edit' | 'remove' = 'bulk') {
  const component = mode === 'bulk' ? createElement(BulkBadgeModal, { onClose: close }) : mode === 'edit' ? createElement(EditBadgeModal, { employee, onClose: close }) : createElement(RemoveBadgeModal, { employee, onClose: close });
  await act(async () => root.render(createElement(QueryClientProvider, { client }, component)));
}
async function click(text: string) { const button = [...document.querySelectorAll('button')].find(item => item.textContent === text); expect(button, text).toBeTruthy(); await act(async () => button!.click()); await act(async () => { await vi.advanceTimersByTimeAsync(10); }); }
async function input(label: string, value: string) {
  const el = document.querySelector(`[aria-label="${label}"]`) as HTMLInputElement | HTMLSelectElement; expect(el).toBeTruthy();
  await act(async () => { Object.getOwnPropertyDescriptor(el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(el, value); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
}
it('loads lightweight employees and requires review before submitting a single zero-padded badge', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { success: true, message: 'Saved' } });
  await render(); expect(useEmployees).toHaveBeenCalledWith({ per_page: 1000, detailed: 0 });
  await input('Assignment 1 employee', 'EMP-1'); await input('Assignment 1 badge ID', '0042'); await click('Review assignments');
  expect(api.post).not.toHaveBeenCalled(); expect(document.body.textContent).toContain('0042'); await click('Apply 1 change');
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/employee-badges/bulk', { assignments: [{ employee_code: 'EMP-1', device_badge_id: '0042' }] }); expect(close).toHaveBeenCalledOnce();
});
it('submits mixed assignments and explicit removals atomically after review', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { success: true, message: 'Saved' } }); await render();
  await input('Assignment 1 employee', 'EMP-1'); await input('Assignment 1 badge ID', '0042'); await click('Add employee'); await input('Assignment 2 employee', 'EMP-2'); await input('Assignment 2 action', 'remove'); await click('Review assignments');
  expect(document.body.textContent).toContain('1 will remove'); expect(api.post).not.toHaveBeenCalled(); await click('Apply 2 changes');
  expect(api.post).toHaveBeenCalledWith('/employee-badges/bulk', { assignments: [{ employee_code: 'EMP-1', device_badge_id: '0042' }, { employee_code: 'EMP-2', device_badge_id: null }] });
});
it('keeps a row-indexed server conflict visible without closing or retrying', async () => {
  vi.mocked(api.post).mockRejectedValue({ response: { status: 422, data: { errors: { 'assignments.0.device_badge_id': ['Badge already assigned.'] } } } }); await render();
  await input('Assignment 1 employee', 'EMP-1'); await input('Assignment 1 badge ID', '0042'); await click('Review assignments'); await click('Apply 1 change');
  expect(document.body.textContent).toContain('Badge already assigned.'); expect(close).not.toHaveBeenCalled(); expect(api.post).toHaveBeenCalledTimes(1);
});
it('updates an existing badge using the badge-list employee UUID', async () => {
  vi.mocked(api.put).mockResolvedValue({ data: { success: true, message: 'Saved' } }); await render('edit');
  expect((document.querySelector('#employee-device-badge') as HTMLInputElement).value).toBe('0042'); await click('Save badge');
  expect(api.put).toHaveBeenCalledExactlyOnceWith('/time-sync/employee-badges/employee-uuid', { device_badge_id: '0042' });
});
it('waits for removal confirmation and invalidates the list after a 204 response', async () => {
  vi.mocked(api.delete).mockResolvedValue({ status: 204 }); const invalidate = vi.spyOn(client, 'invalidateQueries'); await render('remove'); expect(api.delete).not.toHaveBeenCalled(); await click('Remove badge');
  expect(api.delete).toHaveBeenCalledExactlyOnceWith('/time-sync/employee-badges/employee-uuid'); expect(invalidate).toHaveBeenCalledWith({ queryKey: ['employee-badges'] }); expect(close).toHaveBeenCalledOnce();
});
