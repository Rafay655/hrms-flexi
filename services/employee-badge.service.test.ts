import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { badgeAssignments, validateBadge } from '@/lib/employee-badges';
import { employeeBadgeService, BULK_BADGE_PATH } from './employee-badge.service';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
describe('employee badge API', () => {
  it('requests server filters and pagination while preserving a zero-padded badge', async () => {
    const response = { success: true, data: [], meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 } };
    vi.mocked(api.get).mockResolvedValue({ data: response }); const signal = new AbortController().signal;
    expect(await employeeBadgeService.list({ status: 'unmapped', badge: '0042', search: '', page: 1, per_page: 50 }, signal)).toEqual(response);
    expect(api.get).toHaveBeenCalledWith('/time-sync/employee-badges', { params: { status: 'unmapped', badge: '0042', page: 1, per_page: 50 }, signal });
  });
  it('updates by employee UUID and preserves leading zeros', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { success: true, message: 'Saved' } });
    await employeeBadgeService.assign('employee-uuid', ' 0042 ');
    expect(api.put).toHaveBeenCalledExactlyOnceWith('/time-sync/employee-badges/employee-uuid', { device_badge_id: '0042' });
  });
  it('removes mappings by UUID and handles a 204 response', async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 }); await employeeBadgeService.remove('employee-uuid');
    expect(api.delete).toHaveBeenCalledExactlyOnceWith('/time-sync/employee-badges/employee-uuid');
  });
  it('supports a single or multiple bulk rows, including explicit unassignment', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, message: 'Saved' } });
    const rows = [{ employee_code: 'FLEXI-IT-0042', device_badge_id: '0042' }, { employee_code: 'FLEXI-IT-0009', device_badge_id: null }];
    await employeeBadgeService.bulk(rows); expect(api.post).toHaveBeenCalledWith(BULK_BADGE_PATH, { assignments: rows });
    await employeeBadgeService.bulk(rows.slice(0, 1)); expect(api.post).toHaveBeenLastCalledWith(BULK_BADGE_PATH, { assignments: rows.slice(0, 1) });
  });
  it('does not accept an analysis object as an employee listing or hide failed envelopes', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { badges: [], summary: {} } } });
    await expect(employeeBadgeService.list({})).rejects.toThrow('different response shape');
    vi.mocked(api.put).mockResolvedValue({ data: { success: false, message: 'Badge already used.' } });
    await expect(employeeBadgeService.assign('uuid', '0042')).rejects.toThrow('Badge already used.');
  });
  it('preserves row-indexed conflict errors', async () => {
    const error = { response: { status: 422, data: { errors: { 'assignments.1.device_badge_id': ['Badge is already assigned.'] } } } };
    vi.mocked(api.post).mockRejectedValue(error);
    await expect(employeeBadgeService.bulk([{ employee_code: 'EMP-1', device_badge_id: '0042' }])).rejects.toBe(error);
  });
});
describe('badge assignment validation', () => {
  it('uses supported employee codes, preserves alphanumeric badges and requires explicit removal', () => {
    expect(badgeAssignments([{ key: '1', employee_code: 'FLEXI-IT-0042', mode: 'assign', badge: ' 0042 ' }, { key: '2', employee_code: 'EMP-2', mode: 'assign', badge: 'A10361' }, { key: '3', employee_code: 'EMP-3', mode: 'remove', badge: '' }])).toEqual([{ employee_code: 'FLEXI-IT-0042', device_badge_id: '0042' }, { employee_code: 'EMP-2', device_badge_id: 'A10361' }, { employee_code: 'EMP-3', device_badge_id: null }]);
    expect(() => badgeAssignments([{ key: '1', employee_code: 'EMP-1', mode: 'assign', badge: '' }])).toThrow('Enter a badge ID');
  });
  it.each(['', 'bad badge', 'badge@42', 'x'.repeat(51)])('rejects invalid badge %s', badge => { expect(validateBadge(badge)).not.toBeNull(); });
  it('allows dots dashes underscores and literal zero', () => { expect(validateBadge('A_42.0-x')).toBeNull(); expect(validateBadge('0')).toBeNull(); });
  it('rejects duplicate employees and duplicate non-null badges', () => {
    const row = { key: '1', employee_code: 'EMP-1', mode: 'assign' as const, badge: '0042' };
    expect(() => badgeAssignments([row, { ...row, key: '2' }])).toThrow('employee is selected more than once');
    expect(() => badgeAssignments([row, { ...row, key: '2', employee_code: 'EMP-2' }])).toThrow('badge is assigned more than once');
  });
  it('allows 1000 removals but rejects empty or oversized batches', async () => {
    const rows = Array.from({ length: 1000 }, (_, index) => ({ key: String(index), employee_code: `EMP-${index}`, mode: 'remove' as const, badge: '' }));
    expect(badgeAssignments(rows)).toHaveLength(1000); expect(() => badgeAssignments([])).toThrow(); expect(() => badgeAssignments([...rows, rows[0]])).toThrow('1 and 1000');
    await expect(employeeBadgeService.bulk([])).rejects.toThrow('1 to 1000'); expect(api.post).not.toHaveBeenCalled();
  });
});
