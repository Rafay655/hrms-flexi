import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ExceptionRegularizationModal } from './exception-regularization-modal';
import { myRegularizationsService } from '@/services/my-regularizations.service';
import type { AttendanceException } from '@/types/attendance-exception';
vi.mock('@/services/my-regularizations.service', () => ({ myRegularizationsService: { save: vi.fn() }, correctionOptions: [{ value: 'add_in', label: 'Add clock-in' }, { value: 'add_out', label: 'Add clock-out' }, { value: 'modify_in', label: 'Correct clock-in' }, { value: 'modify_out', label: 'Correct clock-out' }, { value: 'full_replacement', label: 'Replace both punches' }] }));
vi.mock('@/services/employee.service', () => ({ employeeService: { getAllForBatches: vi.fn(async () => []) } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
const row: AttendanceException = { id: 'case-1', date: '2026-10-22', type: 'missing_punch_out', severity: 'high', status: 'pending', employee: { id: '12345678-1234-1234-1234-123456789abc', name: 'Alex Taylor', employee_code: 'E01' } };
let client: QueryClient;
function mount(value = row) { client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); render(<QueryClientProvider client={client}><ExceptionRegularizationModal exception={value} company="company-1" timeZone="Asia/Karachi" onClose={vi.fn()} /></QueryClientProvider>); }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(myRegularizationsService.save).mockResolvedValue({ success: true, message: 'Submitted', data: {} }); });
afterEach(() => { cleanup(); client.clear(); });
it('submits the exception employee and date with the matching correction', async () => {
  mount(); expect(screen.getByLabelText('Correction type *')).toHaveValue('add_out');
  fireEvent.change(screen.getByLabelText('Requested clock-out *'), { target: { value: '18:30' } });
  fireEvent.change(screen.getByLabelText('Reason *'), { target: { value: '  Missed punch  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
  await waitFor(() => expect(myRegularizationsService.save).toHaveBeenCalledWith({ payload: { employee_id: row.employee.id, attendance_date: row.date, correction_type: 'add_out', requested_in: null, requested_out: '2026-10-22 18:30:00', reason: 'Missed punch', supporting_doc_path: null } }, expect.anything()));
});
it('requires a reason and requested time', () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a reason');
  fireEvent.change(screen.getByLabelText('Reason *'), { target: { value: 'Forgot' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
  expect(screen.getByRole('alert')).toHaveTextContent('punch times');
  expect(myRegularizationsService.save).not.toHaveBeenCalled();
});
it('does not submit an internal numeric employee ID', async () => {
  mount({ ...row, employee: { ...row.employee, id: '42' } });
  await screen.findByText('Employee profile unavailable. A request cannot be submitted for this employee.');
  expect(screen.getByRole('button', { name: 'Submit request' })).toBeDisabled();
  expect(myRegularizationsService.save).not.toHaveBeenCalled();
});
