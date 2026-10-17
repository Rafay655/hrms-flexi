import type { BadgeAssignment, BadgeAssignmentRow } from '@/types/employee-badge';
export const MAX_BADGE_ASSIGNMENTS = 1000;
export function validateBadge(value: string): string | null {
  const badge = value.trim();
  if (!badge) return 'Enter a badge ID.';
  if (badge.length > 50) return 'Badge IDs must be 50 characters or fewer.';
  if (!/^[A-Za-z0-9._-]+$/.test(badge)) return 'Badge IDs may only contain letters, numbers, dots, dashes and underscores.';
  return null;
}
export function badgeAssignments(rows: BadgeAssignmentRow[]): BadgeAssignment[] {
  if (!rows.length || rows.length > MAX_BADGE_ASSIGNMENTS) throw new Error('Select between 1 and 1000 employees.');
  const employees = new Set<string>(); const badges = new Set<string>();
  return rows.map((row, index) => {
    const code = row.employee_code.trim();
    if (!code || code.length > 100) throw new Error(`Row ${index + 1}: select an employee.`);
    if (employees.has(code)) throw new Error(`Row ${index + 1}: the employee is selected more than once.`);
    employees.add(code);
    if (row.mode === 'remove') return { employee_code: code, device_badge_id: null };
    const error = validateBadge(row.badge); if (error) throw new Error(`Row ${index + 1}: ${error}`);
    const badge = row.badge.trim();
    if (badges.has(badge)) throw new Error(`Row ${index + 1}: the badge is assigned more than once in this batch.`);
    badges.add(badge);
    return { employee_code: code, device_badge_id: badge };
  });
}
