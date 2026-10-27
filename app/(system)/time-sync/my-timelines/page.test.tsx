import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { timelineToday, timelineDay, timelineSummary } from '@/tests/fixtures/attendance-timeline';
import MyTimelinePage from './page';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
vi.mock('@/store/hooks', () => ({ useAppSelector: vi.fn() }));
vi.mock('framer-motion', () => {
  const tag = (name: string) => function MotionTestElement(props: Record<string, unknown>) { return createElement(name, Object.fromEntries(Object.entries(props).filter(([key]) => !['initial', 'animate', 'exit', 'transition', 'whileHover', 'layout'].includes(key))), props.children as ReactNode); };
  return { motion: { div: tag('div'), li: tag('li'), p: tag('p'), button: tag('button') }, AnimatePresence: ({ children }: { children: ReactNode }) => children, useReducedMotion: () => true };
});
vi.mock('@/components/ui/searchable-select', () => ({ default: (props: { id?: string; 'aria-label'?: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; allowAll?: boolean }) => createElement('select', { id: props.id, 'aria-label': props['aria-label'], value: props.value, onChange: (event: { target: { value: string } }) => props.onChange(event.target.value) }, props.allowAll !== false && createElement('option', { value: '' }, 'All statuses'), props.options.map(option => createElement('option', { key: option.value, value: option.value }, option.label))) }));
let root: Root, container: HTMLDivElement, client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T07:00:00Z'));
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { user: { id: 'user' }, company: { id: 'company', timezone: 'Asia/Karachi' } } } as never));
  vi.mocked(api.get).mockImplementation(async (url, config) => {
    const params = config?.params as Record<string, string | number> | undefined;
    if (url === '/time-sync/attendance/today') return { data: { success: true, data: timelineToday } };
    if (url === '/time-sync/attendance/my/summary') return { data: { success: true, data: { ...timelineSummary, month: params?.month } } };
    if (url === '/time-sync/attendance/my') return { data: { success: true, employee: timelineToday.employee, data: [timelineDay], meta: { current_page: params?.page ?? 1, total: 31, per_page: params?.per_page ?? 10, last_page: 4 } } };
    throw Error('Unexpected request');
  });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container); client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });
async function render() { await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(MyTimelinePage)))); await act(async () => { await vi.advanceTimersByTimeAsync(20); }); }
async function click(text: string) { const button = [...document.querySelectorAll('button')].find(item => item.textContent === text || item.getAttribute('aria-label') === `${text} view`); expect(button, text).toBeTruthy(); await act(async () => button!.click()); await act(async () => { await vi.advanceTimersByTimeAsync(20); }); }
async function input(selector: string, value: string) {
  const element = document.querySelector(selector) as HTMLInputElement | HTMLSelectElement; expect(element).toBeTruthy();
  await act(async () => { Object.getOwnPropertyDescriptor(element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
  await act(async () => { await vi.advanceTimersByTimeAsync(20); });
}
it('renders the three real responses with live progress and honest unknown location state', async () => {
  await render(); expect(document.body.textContent).toContain('1h 08m'); expect(document.body.textContent).toContain('Still on duty'); expect(document.body.textContent).toContain('Location not checked'); expect(document.body.textContent).toContain('25');
  expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('12.6'); expect(document.body.textContent).not.toContain('Generate');
});
it('replaces list with a full-month calendar and opens recorded days', async () => {
  await render(); await click('Calendar');
  expect(document.querySelector('[aria-label="October 2026 attendance calendar"]')).toBeTruthy();
  expect(document.querySelector('[aria-label="Records per page"]')).toBeNull();
  expect(document.querySelector('[aria-label="Next page"]')).toBeNull();
  expect(document.querySelector('[aria-current="date"]')?.textContent).toContain('17');
  expect(document.querySelector('[aria-label="Calendar days"]')?.children).toHaveLength(35);
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/my', expect.objectContaining({ params: { month: '2026-10', page: 4, per_page: 50 } }));
  const day = document.querySelector('[aria-label^="View attendance for"]') as HTMLButtonElement;
  await act(async () => day.click());
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Attendance details');
});
it('aligns leap February and keeps an empty filtered calendar visible without inventing attendance', async () => {
  await render();
  const original = vi.mocked(api.get).getMockImplementation()!;
  vi.mocked(api.get).mockImplementation(async (url, config) => url === '/time-sync/attendance/my' ? { data: { success: true, data: [], meta: { current_page: 1, per_page: 50, total: 0, last_page: 1 } } } : original(url, config));
  await click('Calendar'); await input('[aria-label="Attendance month"]', '2024-02');
  await click('Filters'); await input('[aria-label="Attendance status"]', 'absent');
  const grid = document.querySelector('[aria-label="Calendar days"]')!;
  expect(grid.children).toHaveLength(35);
  expect(grid.children[0].getAttribute('aria-hidden')).toBe('true');
  expect(grid.children[3].textContent).toContain('1');
  expect(grid.querySelectorAll('button')).toHaveLength(0);
  expect(grid.textContent).toContain('No matching record');
  expect(grid.textContent).not.toContain('Absent');
});
it('keeps today independent when changing month and requests the new month summary', async () => {
  await render(); const todayCalls = vi.mocked(api.get).mock.calls.filter(([url]) => url === '/time-sync/attendance/today').length;
  await input('[aria-label="Attendance month"]', '2026-08');
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/my', expect.objectContaining({ params: { month: '2026-08', page: 1, per_page: 10 } }));
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/my/summary', expect.objectContaining({ params: { month: '2026-08' } }));
  expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/time-sync/attendance/today')).toHaveLength(todayCalls);
});
it('filters server history and resets pagination without narrowing monthly totals', async () => {
  await render(); const summaryCalls = vi.mocked(api.get).mock.calls.filter(([url]) => url === '/time-sync/attendance/my/summary').length;
  const next = document.querySelector('[aria-label="Next page"]') as HTMLButtonElement; await act(async () => next.click()); await act(async () => { await vi.advanceTimersByTimeAsync(20); });
  await click('Filters'); await input('[aria-label="Attendance status"]', 'out_missing');
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/my', expect.objectContaining({ params: { month: '2026-10', page: 1, per_page: 10, status: 'out_missing' } }));
  expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/time-sync/attendance/my/summary')).toHaveLength(summaryCalls);
});
it('rejects inverted custom dates without sending an invalid request', async () => {
  await render(); await click('Filters'); await input('#timeline-from', '2026-10-20'); await input('#timeline-to', '2026-10-10'); const count = vi.mocked(api.get).mock.calls.length;
  await click('Apply dates'); expect(document.body.textContent).toContain('start date must be on or before'); expect(api.get).toHaveBeenCalledTimes(count);
});
it('opens a day in a modal with recorded endpoints and no invented break punches', async () => {
  await render(); const button = document.querySelector('[aria-label^="View attendance for"]') as HTMLButtonElement;
  await act(async () => button.click());
  const modal = document.querySelector('[role="dialog"]')!; expect(modal.textContent).toContain('Attendance details'); expect(modal.textContent).toContain('9h 04m'); expect(modal.textContent).toContain('Location not checked'); expect(modal.textContent).not.toContain('Break Out');
  expect(modal.querySelector('a')?.getAttribute('href')).toBe('/time-sync/my-regularizations');
});
it('retains today and history when only the monthly summary fails', async () => {
  const implementation = vi.mocked(api.get).getMockImplementation()!;
  vi.mocked(api.get).mockImplementation(async (url, config) => { if (url === '/time-sync/attendance/my/summary') throw { response: { status: 403, data: { message: 'Summary permission denied.' } } }; return implementation(url, config); });
  await render(); expect(document.body.textContent).toContain('Summary permission denied.'); expect(document.body.textContent).toContain('Still on duty'); expect(document.body.textContent).toContain('Regular shift');
});
