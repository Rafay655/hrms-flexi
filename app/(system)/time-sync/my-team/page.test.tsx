import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { teamAttendance, teamDetail, teamLocations, teamSummary } from '@/tests/fixtures/team-attendance';
import MyTeamPage from './page';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
vi.mock('@/store/hooks', () => ({ useAppSelector: vi.fn() }));
vi.mock('framer-motion', () => {
  const tag = (name: string) => function MotionTestElement(props: Record<string, unknown>) { return createElement(name, Object.fromEntries(Object.entries(props).filter(([key]) => !['initial', 'animate', 'exit', 'transition'].includes(key))), props.children as ReactNode); };
  return { motion: { div: tag('div'), li: tag('li'), article: tag('article') }, useReducedMotion: () => true };
});
vi.mock('@/components/ui/searchable-select', () => ({ default: (props: { id?: string; 'aria-label'?: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) => createElement('select', { id: props.id, 'aria-label': props['aria-label'], value: props.value, onChange: (event: { target: { value: string } }) => props.onChange(event.target.value) }, createElement('option', { value: '' }, 'My team'), props.options.map(option => createElement('option', { key: option.value, value: option.value }, option.label))) }));
vi.mock('@/components/ui/switch', () => ({ Switch: (props: { id: string; checked: boolean; onCheckedChange: (value: boolean) => void }) => createElement('button', { id: props.id, role: 'switch', 'aria-checked': props.checked, onClick: () => props.onCheckedChange(!props.checked) }, 'Include indirect reports') }));

let root: Root, container: HTMLDivElement, client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T07:00:00Z'));
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(useAppSelector).mockImplementation(selector => selector({ auth: { user: { id: 'user' }, company: { id: 'company', timezone: 'Asia/Karachi' } } } as never));
  vi.mocked(api.get).mockImplementation(async url => {
    if (url === '/time-sync/attendance/team') return { data: teamAttendance };
    if (url === '/time-sync/attendance/team/summary') return { data: teamSummary };
    if (url === '/time-sync/attendance/team/locations') return { data: teamLocations };
    if (url === '/time-sync/attendance/team/employee-uuid') return { data: teamDetail };
    throw new Error('Unexpected request');
  });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); vi.useRealTimers(); });
async function settle() { await act(async () => { await vi.advanceTimersByTimeAsync(20); }); }
async function render() { await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(MyTeamPage)))); await settle(); }
async function click(selector: string) { const button = document.querySelector(selector) as HTMLButtonElement; expect(button).toBeTruthy(); await act(async () => button.click()); await settle(); }
async function input(selector: string, value: string) {
  const element = document.querySelector(selector) as HTMLInputElement | HTMLSelectElement;
  await act(async () => { Object.getOwnPropertyDescriptor(element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); await settle();
}

it('loads the three overview APIs without a hardcoded employee and defers detail until opened', async () => {
  await render(); expect(api.get).toHaveBeenCalledTimes(3);
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/team', expect.objectContaining({ params: { date: '2026-10-17', recursive: false } }));
  expect(document.body.textContent).toContain('Example Engineer'); expect(document.body.textContent).toContain('Location not checked');
  expect(document.body.textContent).toContain('0h 00m'); expect(document.body.textContent).not.toContain('Live tracking');
});
it('refetches all scopes for indirect reports and dates, but manager changes only attendance', async () => {
  await render(); await click('#team-recursive');
  for (const suffix of ['', '/summary', '/locations']) expect(api.get).toHaveBeenCalledWith(`/time-sync/attendance/team${suffix}`, expect.objectContaining({ params: { date: '2026-10-17', recursive: true } }));
  const summaryCalls = vi.mocked(api.get).mock.calls.filter(([url]) => url === '/time-sync/attendance/team/summary').length;
  await input('#team-manager', 'manager-other');
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/team', expect.objectContaining({ params: { date: '2026-10-17', recursive: true, employee_uuid: 'manager-other' } }));
  expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/time-sync/attendance/team/summary')).toHaveLength(summaryCalls);
  expect(document.body.textContent).toContain('Summary and locations cover your team');
  await input('#team-date', '2026-08-24');
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/team/locations', expect.objectContaining({ params: { date: '2026-08-24', recursive: true } }));
});
it('loads actual punch detail for the row date and preserves unknown geofence state', async () => {
  await render(); await click('[aria-label="View attendance for Example Engineer"]');
  expect(api.get).toHaveBeenCalledWith('/time-sync/attendance/team/employee-uuid', expect.objectContaining({ params: { date: '2026-10-17' } }));
  const modal = document.querySelector('[role="dialog"]')!;
  expect(modal.textContent).toContain('Recorded punches'); expect(modal.textContent).toContain('Coordinates not recorded');
  expect(modal.textContent).not.toContain('Location verified'); expect(modal.querySelector('a')).toBeNull();
});
it('shows honest location cards without generating map links for missing coordinates', async () => {
  await render(); const button = [...document.querySelectorAll('button')].find(button => button.textContent === 'Locations')!;
  await act(async () => button.click()); await settle();
  expect(document.body.textContent).toContain('Coordinates not recorded');
  expect(document.querySelector('a[href*="openstreetmap"]')).toBeNull();
  expect(document.body.textContent).toContain('not live tracking');
});
it('keeps attendance visible when summary fails and reports a returned-date mismatch', async () => {
  const original = vi.mocked(api.get).getMockImplementation()!;
  vi.mocked(api.get).mockImplementation(async (url, config) => {
    if (url === '/time-sync/attendance/team/summary') throw new Error('Summary unavailable');
    if (url === '/time-sync/attendance/team') return { data: { ...teamAttendance, meta: { ...teamAttendance.meta, date: '2026-08-24' } } };
    return original(url, config);
  });
  await render(); expect(document.body.textContent).toContain('Example Engineer'); expect(document.querySelector('[role="alert"]')).toBeTruthy();
  expect(document.body.textContent).toContain('The API returned');
});
it('searches returned people without changing server summaries', async () => {
  await render(); const count = vi.mocked(api.get).mock.calls.length;
  await input('[aria-label="Search displayed team members"]', 'no such person');
  expect(document.body.textContent).toContain('No matching team members'); expect(api.get).toHaveBeenCalledTimes(count);
});
