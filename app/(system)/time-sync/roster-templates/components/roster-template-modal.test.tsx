import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RosterTemplateModal } from './roster-template-modal';
import { rosterTemplateService } from '@/services/roster-template.service';
import type { RosterTemplate } from '@/types/roster-template';

vi.mock('@/services/shift.service', () => ({ shiftService: { getAll: vi.fn(async () => ({ data: { data: [{ id: 'shift-1', name: 'Morning', code: 'AM' }], meta: { last_page: 1 } } })) } }));
vi.mock('@/services/roster-template.service', () => ({ rosterTemplateService: { create: vi.fn(async () => ({})), update: vi.fn(async () => ({})) } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
// Keep interaction tests focused on the form rather than the shared popover implementation.
vi.mock('@/components/ui/searchable-select', () => ({ default: (props: { id?: string; 'aria-label'?: string; value: string; options: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void }) => <select id={props.id} aria-label={props['aria-label']} value={props.value} disabled={props.disabled} onChange={event => props.onChange(event.target.value)}><option value="">Choose</option>{props.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }));
const item: RosterTemplate = { id: 'template-1', name: 'Office', template_type: 'fortnightly', working_days: ['monday'], pattern_data: [{ day: 'monday', shift_id: 'shift-1', is_off: false }, { day: 'monday', shift_id: null, is_off: true }], auto_generate: true, is_active: true };
let client: QueryClient;
function mount(mode: 'create' | 'edit' | 'view', value?: RosterTemplate) { client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); return render(<QueryClientProvider client={client}><RosterTemplateModal mode={mode} item={value} onClose={vi.fn()} /></QueryClientProvider>); }
beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); client.clear(); });

it('validates details and requires shifts before creating a pattern', async () => {
  mount('create');
  fireEvent.click(screen.getByRole('button', { name: 'Next: shift pattern' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a name');
  fireEvent.change(screen.getByLabelText('Template name *'), { target: { value: '  Office week  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next: shift pattern' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add working days' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create template' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a shift');
  expect(rosterTemplateService.create).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByLabelText('Shift to apply to working rows')).not.toBeDisabled());
  fireEvent.change(screen.getByLabelText('Shift to apply to working rows'), { target: { value: 'shift-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply to working rows' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create template' }));
  await waitFor(() => expect(rosterTemplateService.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Office week', template_type: 'weekly', pattern_data: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => ({ day, shift_id: 'shift-1', is_off: false })) })));
});

it('preserves repeated weekdays and days off when updating', async () => {
  mount('edit', item);
  fireEvent.click(screen.getByRole('button', { name: 'Next: shift pattern' }));
  await waitFor(() => expect(screen.getByLabelText('Shift to apply to working rows')).not.toBeDisabled());
  fireEvent.change(screen.getByLabelText('Shift to apply to working rows'), { target: { value: 'shift-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply to working rows' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(rosterTemplateService.update).toHaveBeenCalledWith(item.id, expect.objectContaining({ pattern_data: item.pattern_data, template_type: 'fortnightly', auto_generate: true })));
});

it('keeps view mode read only', () => {
  mount('view', item);
  expect(screen.getByLabelText('Template name *')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Next: shift pattern' }));
  expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add day' })).not.toBeInTheDocument();
  expect(rosterTemplateService.update).not.toHaveBeenCalled();
});

it.each(['edit', 'view'] as const)('opens %s with numeric saved shift IDs', async mode => {
  const numericItem = { ...item, pattern_data: [{ day: 'monday', shift_id: 42, is_off: false }] } as unknown as RosterTemplate;
  mount(mode, numericItem);
  fireEvent.click(screen.getByRole('button', { name: 'Next: shift pattern' }));
  expect(screen.getByLabelText('Shift *')).toHaveValue('42');
  expect(screen.getByLabelText('Shift *')).toHaveTextContent('Saved shift (42…)');
  if (mode === 'edit') {
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(rosterTemplateService.update).toHaveBeenCalledWith(item.id, expect.objectContaining({ pattern_data: numericItem.pattern_data })));
  }
});
