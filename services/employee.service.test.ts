import { beforeEach, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { employeeService } from './employee.service';
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('collects every employee page with detailed mode and cancellation preserved', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [{ id: 'one' }], meta: { last_page: 2 } } }).mockResolvedValueOnce({ data: { success: true, data: [{ id: 'two' }], meta: { last_page: 2 } } });
  const signal = new AbortController().signal;
  expect(await employeeService.getAll({ per_page: 1000, detailed: 1 }, signal)).toEqual([{ id: 'one' }, { id: 'two' }]);
  expect(api.get).toHaveBeenLastCalledWith('/people-hub/onboarding', { params: { per_page: 1000, detailed: 1, page: 2 }, signal });
});
it('supports nested paginated employee responses', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { data: [{ id: 'one' }], meta: { last_page: 1 } } } });
  expect(await employeeService.getAll()).toEqual([{ id: 'one' }]);
});
it('rejects failed listings instead of showing an empty directory', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: false, message: 'Unavailable' } });
  await expect(employeeService.getAll()).rejects.toThrow('Unavailable');
});
