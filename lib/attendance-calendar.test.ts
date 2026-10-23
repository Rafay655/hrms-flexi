import { describe, expect, it } from 'vitest';
import { monthDates, monthRange, duration, statusTone } from './attendance-calendar';
describe('attendance calendar dates', () => {
  it('uses full month bounds and includes leap day', () => {
    expect(monthRange('2024-02')).toEqual({ date_from: '2024-02-01', date_to: '2024-02-29' });
    expect(monthDates('2024-02')).toHaveLength(29);
    expect(monthDates('2026-09')[0]).toBe('2026-09-01');
    expect(monthDates('2026-09').at(-1)).toBe('2026-09-30');
  });
  it('distinguishes missing time from zero time', () => {
    expect(duration(null)).toBe('—'); expect(duration(0)).toBe('0h 0m'); expect(duration(13244)).toBe('220h 44m');
    expect(statusTone('weekend')).not.toBe(statusTone('absent'));
  });
});
