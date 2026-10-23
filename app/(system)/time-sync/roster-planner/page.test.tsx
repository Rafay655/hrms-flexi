import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Planner from './page';
const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), publish: vi.fn() }));
vi.mock('@/hooks/useEmployees', () => ({ useEmployees: () => ({ data: [{ uuid: 'emp-1', employee_code: 'E01', name: 'Alex' }], isLoading: false }) }));
vi.mock('@/hooks/useShifts', () => ({ useShifts: () => ({ data: { data: { data: [{ id: 7, name: 'Morning', code: 'AM' }] } }, isLoading: false }) }));
vi.mock('@/hooks/useRosterTemplates', () => ({ useRosterTemplates: () => ({ data: { data: [{ id: 8, name: 'Standard week' }] }, isLoading: false }) }));
vi.mock('@/hooks/useRosters', () => ({
  useRosters: () => ({ data: { data: [{ id: 'row-1', employee_id: 'emp-1', employee: { name: 'Alex', employee_code: 'E01' }, shift_id: 7, template_id: 8, roster_date: '2026-10-23', status: 'draft', notes: 'Saved note', is_weekly_off: false, is_holiday: false }], meta: { total: 1, last_page: 1 } }, isLoading: false, isFetching: false, refetch: vi.fn() }),
  useCreateRoster: () => ({ mutate: mocks.create, isPending: false }), useUpdateRoster: () => ({ mutate: mocks.update, isPending: false }), useDeleteRoster: () => ({ mutate: vi.fn(), isPending: false }), usePublishRosters: () => ({ mutate: mocks.publish, isPending: false }),
}));
vi.mock('@/components/ui/searchable-select', () => ({ default: (props: { id?: string; 'aria-label'?: string; value: string; options: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void }) => <select id={props.id} aria-label={props['aria-label']} value={props.value} disabled={props.disabled} onChange={event => props.onChange(event.target.value)}><option value="">Choose</option>{props.options.filter(option => option.value).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }));
afterEach(cleanup); beforeEach(() => vi.clearAllMocks());
it('creates an assignment through the compact form', () => {
  render(<Planner />);
  fireEvent.click(screen.getByRole('button', { name: /Add Assignment/ }));
  fireEvent.change(screen.getByLabelText('Employee *'), { target: { value: 'emp-1' } });
  fireEvent.change(screen.getByLabelText('Shift'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Date *'), { target: { value: '2026-10-23' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create assignment' }));
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ employee_id: 'emp-1', shift_id: '7', roster_date: '2026-10-23', status: 'draft' }), expect.anything());
});
it('opens edit from the actions menu and retains numeric references', async () => {
  render(<Planner />);
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions for Alex' }), { button: 0, ctrlKey: false, pointerType: 'mouse' });
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
  expect(screen.getByLabelText('Shift')).toHaveValue('7');
  expect(screen.getByLabelText('Template')).toHaveValue('8');
  expect(screen.getByLabelText('Notes')).toHaveValue('Saved note');
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'row-1', data: expect.objectContaining({ shift_id: '7', template_id: '8', notes: 'Saved note' }) }), expect.anything());
});
it('publishes exactly the assignments checked in the table', async () => {
  render(<Planner />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select assignment for Alex' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Publish Selected (1)' }));
  expect(mocks.publish).toHaveBeenCalledWith(['row-1'], expect.anything());
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select assignment for Alex' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: /Publish Selected/ })).not.toBeInTheDocument());
});
