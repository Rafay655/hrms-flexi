import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Page from './page';
import { timeSyncDashboardService } from '@/services/time-sync-dashboard.service';
import fixture from '@/tests/fixtures/time-sync-dashboard.json';
vi.mock('@/store/hooks', () => ({ useAppSelector: (select: (state: unknown) => unknown) => select({ auth: { company: { id: 'company-1', timezone: 'Asia/Karachi' } } }) }));
vi.mock('@/services/time-sync-dashboard.service', () => ({ timeSyncDashboardService: { get: vi.fn() } }));
vi.mock('recharts', () => {
  const Container = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { ResponsiveContainer: Container, AreaChart: Container, BarChart: Container, PieChart: Container, Pie: Container, Bar: Container, Cell: () => null, Area: () => null, CartesianGrid: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null };
});
vi.mock('@/components/ui/searchable-select', () => ({ default: (props: { 'aria-label'?: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) => <select aria-label={props['aria-label']} value={props.value} onChange={event => props.onChange(event.target.value)}>{props.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }));
let client: QueryClient;
function mount() { client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); render(<QueryClientProvider client={client}><Page /></QueryClientProvider>); }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(timeSyncDashboardService.get).mockResolvedValue(fixture); });
afterEach(() => { cleanup(); client.clear(); });
it('renders live metrics and activity without demo values', async () => {
  mount(); await screen.findByText('Live dashboard');
  expect(screen.queryByText(/illustrative|sample|demo dashboard/i)).not.toBeInTheDocument();
  expect(screen.getByText('84%')).toBeVisible();
  expect(screen.getByText('Example Employee')).toBeVisible();
  expect(screen.getByText('4 / 6')).toBeVisible();
  expect(screen.getByText('1 / 1')).toBeVisible();
});
it('fetches the newly selected month and refreshes', async () => {
  mount(); await screen.findByText('Live dashboard');
  const select = screen.getByLabelText('Dashboard month') as HTMLSelectElement;
  const previousMonth = select.options[1].value;
  fireEvent.change(select, { target: { value: previousMonth } });
  await waitFor(() => expect(timeSyncDashboardService.get).toHaveBeenLastCalledWith(previousMonth, expect.any(AbortSignal)));
  await screen.findByText('Live dashboard');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(timeSyncDashboardService.get).toHaveBeenCalledTimes(3));
});
it('renders a team-scoped response with restricted sections null', async () => {
  const team = { ...fixture, scope: { type: 'team', label: 'My records and reporting team' }, kpi: { ...fixture.kpi, attendance_rate: 84.620000000000004, open_shift_swaps: null, published_roster_days: null, active_devices: null }, shift_swaps: null, roster_coverage: null, devices: null, employee_badges: null, configuration: { attendance_policies: null, shift_templates: null, roster_templates: null, calendar_assignments: null }, needs_attention: { ...fixture.needs_attention, swaps_awaiting_approval: null, unmapped_employee_badges: null, attendance_exceptions: null } };
  vi.mocked(timeSyncDashboardService.get).mockResolvedValue(team);
  mount(); await screen.findByText('Live dashboard');
  expect(screen.getByText('84.62%')).toBeVisible();
  expect(screen.queryByText('Devices & badge mapping')).not.toBeInTheDocument();
  expect(screen.queryByText('Roster coverage')).not.toBeInTheDocument();
  expect(screen.queryByText('Policy & shift library')).not.toBeInTheDocument();
  expect(screen.queryByText('Open shift swaps')).not.toBeInTheDocument();
  expect(screen.queryByText('Active devices')).not.toBeInTheDocument();
  expect(screen.getByText('Regularization requests')).toBeVisible();
});

it('renders unavailable percentages without crashing when the backend returns null', async () => {
  vi.mocked(timeSyncDashboardService.get).mockResolvedValue({
    ...fixture,
    kpi: { ...fixture.kpi, attendance_rate: null },
    attendance: { ...fixture.attendance, attendance_rate: null },
    roster_coverage: { ...fixture.roster_coverage, total: 0, published: 0, published_percentage: null, ready_percentage: null },
    employee_badges: { ...fixture.employee_badges, mapped_percentage: null },
  });
  mount();
  await screen.findByText('Live dashboard');
  const attendanceCard = screen.getByText('Attendance rate').parentElement!;
  expect(within(attendanceCard).getByText('—')).toBeVisible();
  expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
});
it('preserves a real zero attendance and roster percentage', async () => {
  vi.mocked(timeSyncDashboardService.get).mockResolvedValue({
    ...fixture,
    kpi: { ...fixture.kpi, attendance_rate: 0 },
    roster_coverage: { ...fixture.roster_coverage, published_percentage: 0 },
  });
  mount();
  await screen.findByText('Live dashboard');
  const attendanceCard = screen.getByText('Attendance rate').parentElement!;
  expect(within(attendanceCard).getByText('0%')).toBeVisible();
  expect(screen.getAllByText('0%')).toHaveLength(2);
});
