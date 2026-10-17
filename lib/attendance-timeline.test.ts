import { describe, expect, it } from 'vitest';
import { attendanceTime, attendanceDate, minutesDisplay, todayProgress, geofenceLabel, shiftMonth, monthEnd, attendanceLabel } from './attendance-timeline';
import { timelineToday } from '@/tests/fixtures/attendance-timeline';
describe('attendance timeline display rules', () => {
  it('uses API live progress instead of the unfinished daily work total', () => { expect(todayProgress(timelineToday)).toEqual({ worked: 68, target: 540, percentage: 12.6 }); });
  it('falls back to finalized metrics only when progress is unavailable', () => { expect(todayProgress({ ...timelineToday, progress: null, work_minutes: 270 })).toEqual({ worked: 270, target: 540, percentage: 50 }); });
  it('preserves zero minutes and distinguishes absent values', () => { expect(minutesDisplay(0)).toBe('0h 00m'); expect(minutesDisplay(544)).toBe('9h 04m'); expect(minutesDisplay(null)).toBe('—'); });
  it('does not reinterpret timezone-less API wall clocks as browser-local timestamps', () => {
    expect(attendanceTime('2026-10-17 10:03:14', 'America/New_York')).toBe('10:03 AM');
    expect(attendanceTime('09:30:00')).toBe('9:30 AM'); expect(attendanceTime('18:30:00')).toBe('6:30 PM'); expect(attendanceTime(null)).toBe('—');
  });
  it('converts explicitly zoned timestamps to the company timezone', () => { expect(attendanceTime('2026-10-17T10:03:14Z', 'Asia/Karachi')).toBe('3:03 PM'); });
  it('preserves the calendar date and handles month and leap-year boundaries', () => {
    expect(attendanceDate('2026-10-17', 'weekday')).toBe('Sat'); expect(shiftMonth('2026-01', -1)).toBe('2025-12'); expect(shiftMonth('2026-12', 1)).toBe('2027-01'); expect(monthEnd('2024-02')).toBe('2024-02-29');
  });
  it('keeps an unknown location result separate from a failed check', () => { expect(geofenceLabel(null)).toBe('Location not checked'); expect(geofenceLabel(false)).toBe('Outside permitted area'); expect(geofenceLabel(true)).toBe('Location verified'); });
  it('labels known statuses while preserving unknown server statuses', () => { expect(attendanceLabel('out_missing')).toBe('Clock-out missing'); expect(attendanceLabel('custom_status')).toBe('custom status'); });
});
