/**
 * Minimal employee shape returned by the people-hub list/lookup endpoints.
 * (Moved out of types/shift-assignment.ts — L-2.)
 */
export interface Employee {
  id: number;
  uuid: string;
  employee_code: string;
  name: string;
  gross_salary?: string;
}
