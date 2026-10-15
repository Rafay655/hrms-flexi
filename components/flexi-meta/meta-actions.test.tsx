import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { MetaActions, MetaAction } from './meta-actions';
let root: Root, container: HTMLDivElement;
beforeEach(() => {
 (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
 container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it('opens an accessible menu and calls only the selected existing action', async () => {
 const view = vi.fn(), edit = vi.fn(), remove = vi.fn();
 await act(async () => root.render(<MetaActions><MetaAction label="View" onSelect={view}>{null}</MetaAction><MetaAction label="Edit" onSelect={edit}>{null}</MetaAction><MetaAction label="Delete" onSelect={remove}>{null}</MetaAction></MetaActions>));
 const trigger = container.querySelector('button')!;
 expect(trigger.getAttribute('aria-label')).toBe('Row actions');
 await act(async () => trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
 expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(3);
 await act(async () => (document.querySelectorAll('[role="menuitem"]')[1] as HTMLElement).click());
 expect(edit).toHaveBeenCalledOnce(); expect(view).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
});
