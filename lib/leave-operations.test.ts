import { it,expect } from 'vitest';
import { monthCells } from './leave-operations';
it('builds a complete Monday-first leap-year calendar',()=>{const cells=monthCells('2028-02');expect(cells.filter(c=>c.inMonth)).toHaveLength(29);expect(cells.some(c=>c.date==='2028-02-29')).toBe(true);expect(cells.length%7).toBe(0);expect(new Date(cells[0].date+'T12:00:00Z').getUTCDay()).toBe(1);});
