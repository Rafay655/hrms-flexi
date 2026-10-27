import { expect, it } from 'vitest';
import { regularizationTypeForException, validateExceptionRange } from './attendance-exception';
it('accepts ordered inclusive ranges up to 62 days', () => {
  expect(validateExceptionRange('2026-01-01', '2026-03-03')).toBe('');
  expect(validateExceptionRange('2026-01-01', '2026-03-04')).toContain('62 days');
  expect(validateExceptionRange('2026-10-23', '2026-10-22')).toContain('on or after');
  expect(validateExceptionRange('', '2026-10-22')).toContain('both');
});

it('maps only supported missing punch and late/early types to corrections', () => {
  expect(regularizationTypeForException('missing_punch_in')).toBe('add_in');
  expect(regularizationTypeForException('missing_punch_out')).toBe('add_out');
  expect(regularizationTypeForException('late_arrival')).toBe('modify_in');
  expect(regularizationTypeForException('early_departure')).toBe('modify_out');
  expect(regularizationTypeForException('absent')).toBe('full_replacement');
  expect(regularizationTypeForException('geofence_violation')).toBeNull();
  expect(regularizationTypeForException('mock_location')).toBeNull();
});
