import { expect, it } from 'vitest';
import { mapEmployeeToRow, type ApiOnboardingEmployee } from './employee-directory';
const employee: ApiOnboardingEmployee = {
  id: 'employee-uuid', name: 'API Display Name', employee_code: 'EMP-001', company_id: 1,
  employment_status: 'active', joining_date: '2024-10-21', form_mode: 'detailed',
  user: { id: 'user-uuid', name: 'Account Name', email: 'account@example.test' },
  created_at: '', updated_at: '',
  profile: { steps: [{ step_id: 1, step_name: 'Details', icon: null, order: 1, fields: {
    random_first: { label: 'First Name', type: 'text', value: 'First' },
    random_last: { label: 'Last Name', type: 'text', value: 'Last' },
    random_mobile: { label: 'Mobile#', type: 'phone', value: '+92000000000' },
    random_type: { label: 'Employee Type', type: 'select', value: { id: '1', label: 'Permanent' } },
    random_dept: { label: 'Department', type: 'select', value: { id: '2', label: 'Engineering' } },
    random_role: { label: 'Designation', type: 'select', value: { id: '3', label: 'Developer' } },
    random_manager: { label: 'Reporting Manager', type: 'select', value: { id: '4', label: 'Manager' } },
    random_email: { label: 'Login email', type: 'email', is_login_email: true, value: 'login@example.test' },
  } }] },
};
it('uses the updated top-level name and dynamic profile fields', () => {
  expect(mapEmployeeToRow(employee, 1)).toMatchObject({ id: 'employee-uuid', name: 'API Display Name', phone: '+92000000000', employment_type: 'Permanent', department: 'Engineering', designation: 'Developer', manager: 'Manager', email: 'login@example.test', join_date: '2024-10-21' });
});
it('falls back to dynamic first and last names without fixed field keys', () => {
  expect(mapEmployeeToRow({ ...employee, name: null }, 1).name).toBe('First Last');
});
it('supports employees without profiles and uses their user email', () => {
  expect(mapEmployeeToRow({ ...employee, profile: undefined }, 1)).toMatchObject({ name: 'API Display Name', email: 'account@example.test', phone: '—', department: '—' });
});
it('supports older field keys and nullable lookup values', () => {
  const legacy = { ...employee, name: undefined, user: null, profile: { steps: [{ step_id: 1, step_name: 'Details', icon: null, order: 1, fields: { field_fn1: { label: 'Given', type: 'text', value: 'Legacy' }, field_ln1: { label: 'Family', type: 'text', value: 'Employee' }, field_dp1: { label: 'Department', type: 'select', value: null } } }] } };
  expect(mapEmployeeToRow(legacy, 1)).toMatchObject({ name: 'Legacy Employee', department: '—', email: '—' });
});
