import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Page from './page';
import { attendanceCalendarService } from '@/services/attendance-calendar.service';
import type { AttendanceCalendarResponse } from '@/types/attendance-calendar';
vi.mock('@/store/hooks', () => ({ useAppSelector: () => 'company-1' }));
vi.mock('@/services/attendance-calendar.service', () => ({ attendanceCalendarService: { get: vi.fn() } }));
vi.mock('@/components/ui/searchable-select', () => ({ default: (props: { 'aria-label'?: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) => <select aria-label={props['aria-label']} value={props.value} onChange={event => props.onChange(event.target.value)}>{props.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }));
const day = { date: '2026-09-04', weekday: 'friday', shift_code: 'FS', display_code: 'FS', day_type: 'holiday', is_working_day: false, shift: { id: 'shift-1', name: 'Friday shift', code: 'FS', start_time: '09:30:00', end_time: '18:30:00', is_night_shift: false }, shift_source: 'roster', roster: { id: 'roster-1', status: 'published', is_weekly_off: false, is_holiday: false, notes: 'Saved note' }, holiday: { name: 'Sample holiday', is_optional: true }, leave: null, attendance: { id: 'att-1', status: 'late_in', first_in: '09:56:19', last_out: '18:33:31', work_minutes: 517, late_minutes: 11, early_out_minutes: 0, overtime_minutes: 37, break_minutes: 0, is_regularized: false, is_geofence_valid: null, is_locked: false }, status: 'late_in', anomalies: ['late_arrival', 'holiday_worked'] };
const response: AttendanceCalendarResponse = { success: true, message: 'OK', data: { from: '2026-09-01', to: '2026-09-30', shift_legend: [day.shift], employees: [{ employee: { id: 'emp-1', employee_code: 'E01', name: 'Alex Taylor', department: 'Engineering' }, days: [day], summary: { shift_code_counts: { FS: 1 }, working_days: 1, present_days: 1, absent_days: 0, leave_days: 0, holiday_days: 1, weekly_off_days: 0, half_days: 0, total_work_minutes: 517, anomaly_count: 2, status_counts: { late_in: 1 } } }] }, meta: { total: 11, current_page: 1, per_page: 10, last_page: 2 } };
let client: QueryClient;
function mount() { client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); render(<QueryClientProvider client={client}><Page /></QueryClientProvider>); fireEvent.change(screen.getByLabelText('Calendar month'), { target: { value: '2026-09' } }); }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(attendanceCalendarService.get).mockResolvedValue(response); });
afterEach(() => { cleanup(); client.clear(); });
it('renders the real month and opens attendance plus holiday details', async () => {
  mount();
  await screen.findByRole('button', { name: '2026-09-04: Late In' });
  expect(screen.getByRole('button', { name: '2026-09-01: No record' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '2026-09-04: Late In' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Friday, 4 September 2026');
  expect(screen.getByRole('dialog')).toHaveTextContent('8h 37m');
  expect(screen.getByRole('dialog')).toHaveTextContent('Holiday Worked');
  expect(screen.getByRole('dialog')).toHaveTextContent('Sample holiday');
});
it('uses server pagination and navigates months with correct bounds', async () => {
  mount(); await screen.findByText('Alex Taylor');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(attendanceCalendarService.get).toHaveBeenLastCalledWith({ date_from: '2026-09-01', date_to: '2026-09-30', page: 2, per_page: 10 }, expect.any(AbortSignal)));
  fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  await waitFor(() => expect(attendanceCalendarService.get).toHaveBeenLastCalledWith({ date_from: '2026-10-01', date_to: '2026-10-31', page: 1, per_page: 10 }, expect.any(AbortSignal)));
});
it('shows team overview with the same day details', async () => {
  mount(); await screen.findByText('Alex Taylor');
  fireEvent.click(screen.getByRole('button', { name: 'Team overview' }));
  fireEvent.click(screen.getByRole('button', { name: 'Alex Taylor, 2026-09-04: Late In' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Saved note');
});
it('shows an empty state without invented shifts', async () => {
  vi.mocked(attendanceCalendarService.get).mockResolvedValue({ ...response, data: { ...response.data, employees: [] }, meta: { ...response.meta, total: 0, last_page: 1 } });
  mount(); expect(await screen.findByText('No calendar records for this month')).toBeVisible();
});
