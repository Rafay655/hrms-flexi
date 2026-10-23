import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Page from './page';
const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));
vi.mock('@/hooks/useEmployees', () => ({ useEmployees: () => ({ data: [{ uuid: 'emp-1', employee_code: 'E01', name: 'Alex' }], isLoading: false }) }));
vi.mock('@/hooks/useShifts', () => ({ useShifts: () => ({ data: { data: { data: [{ id: 7, name: 'Morning', code: 'AM' }] } }, isLoading: false }) }));
vi.mock('@/hooks/useShiftAssignments', () => ({
  useShiftAssignments: () => ({ data: { data: [{ id: 'assignment-1', employee_id: 'emp-1', employee: { name: 'Alex', employee_code: 'E01' }, shift_id: 7, valid_from: '2026-10-23T00:00:00Z', valid_to: null, is_active: true }], meta: { total: 1, last_page: 1 } }, isLoading: false, isFetching: false, refetch: vi.fn() }),
  useCreateShiftAssignment: () => ({ mutate: mocks.create, isPending: false }), useUpdateShiftAssignment: () => ({ mutate: mocks.update, isPending: false }), useDeleteShiftAssignment: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/components/ui/searchable-select', () => ({ default: (props: { id?: string; 'aria-label'?: string; value: string; options: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void }) => <select id={props.id} aria-label={props['aria-label']} value={props.value} disabled={props.disabled} onChange={event => props.onChange(event.target.value)}><option value="">Choose</option>{props.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); }); beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }); });
it('validates the date range and creates an ongoing assignment', () => {
  render(<Page />); fireEvent.click(screen.getByRole('button', { name: 'Assign Shift' }));
  fireEvent.click(screen.getByRole('button', { name: 'Assign shift' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Choose an employee');
  fireEvent.change(screen.getByLabelText('Employee *'), { target: { value: 'emp-1' } });
  fireEvent.change(screen.getByLabelText('Shift *'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Start date *'), { target: { value: '2026-10-23' } });
  fireEvent.change(screen.getByLabelText('End date (optional)'), { target: { value: '2026-10-22' } });
  fireEvent.click(screen.getByRole('button', { name: 'Assign shift' }));
  expect(screen.getByRole('alert')).toHaveTextContent('End date must be on or after');
  expect(mocks.create).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('End date (optional)'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Assign shift' }));
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ employee_id: 'emp-1', shift_id: '7', valid_from: '2026-10-23', valid_to: null }), expect.anything());
});
it('opens edit through the three-dot menu with saved numeric IDs', async () => {
  render(<Page />); fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions for Alex' }), { button: 0, ctrlKey: false, pointerType: 'mouse' });
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
  expect(screen.getByLabelText('Shift *')).toHaveValue('7');
  expect(screen.getByLabelText('Start date *')).toHaveValue('2026-10-23');
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ uuid: 'assignment-1', data: expect.objectContaining({ shift_id: '7', valid_to: null }) }), expect.anything());
});
it('keeps view details read only', async () => {
  render(<Page />); fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions for Alex' }), { button: 0, ctrlKey: false, pointerType: 'mouse' });
  fireEvent.click(await screen.findByRole('menuitem', { name: 'View details' }));
  expect(screen.getByLabelText('Employee *')).toBeDisabled();
  expect(screen.getByLabelText('Start date *')).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
});
