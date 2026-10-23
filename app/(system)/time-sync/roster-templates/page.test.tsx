import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import RosterTemplateListingPage from './page';

vi.mock('@/hooks/useRosterTemplates', () => ({
  useRosterTemplates: () => ({ data: { data: [{ id: 'template-1', name: 'Office', template_type: 'weekly', working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], pattern_data: [], auto_generate: false, is_active: true }], meta: { total: 1, last_page: 1 } }, isLoading: false, isFetching: false, refetch: vi.fn() }),
  useDeleteRosterTemplate: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('./components/roster-template-modal', () => ({ RosterTemplateModal: ({ mode }: { mode: string }) => <div role="dialog">{mode} template</div> }));
afterEach(cleanup);
it('uses compact days and a three-dot menu to open template actions', async () => {
  render(<RosterTemplateListingPage />);
  expect(screen.getByText('mon, tue, wed, thu, fri')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit Office' })).not.toBeInTheDocument();
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions for Office' }), { button: 0, ctrlKey: false, pointerType: 'mouse' });
  expect(await screen.findByRole('menuitem', { name: 'View details' })).toBeVisible();
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('edit template');
});
