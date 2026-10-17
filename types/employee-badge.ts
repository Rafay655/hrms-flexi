export interface EmployeeBadge {
  id: string;
  internal_id: number;
  employee_code: string;
  device_badge_id: string | null;
  has_device_badge: boolean;
  first_name: string;
  last_name: string;
  full_name: string;
  employment_status: string;
  updated_at: string | null;
}
export interface EmployeeBadgeFilters { page?: number; per_page?: number; status?: 'mapped' | 'unmapped'; badge?: string; search?: string }
export interface BadgeEnvelope<T> { success: boolean; message: string; data?: T }
export interface EmployeeBadgeList extends BadgeEnvelope<EmployeeBadge[]> {
  data: EmployeeBadge[];
  meta: { current_page: number; last_page: number; per_page: number; total: number; from?: number | null; to?: number | null };
}
export type BadgeAssignment = { employee_id?: string; employee_code?: string; device_badge_id: string | null };
export interface BadgeAssignmentRow { key: string; employee_code: string; mode: 'assign' | 'remove'; badge: string }
