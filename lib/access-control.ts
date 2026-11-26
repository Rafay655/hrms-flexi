// Permission names are exact backend keys. Role grants remain server-owned.
export function hasPermission(grants: readonly string[], permission: string): boolean {
  return grants.includes(permission) || grants.includes('*') || grants.some(grant => grant.endsWith('.*') && permission.startsWith(grant.slice(0, -1)));
}
export const routePermissions: Record<string, readonly string[]> = {
 '/connect-central/security':['view-audit-security'],
 '/connect-central/sessions':['view-company-sessions'],
 '/connect-central/sessions/company':['view-company-sessions'],
 '/connect-central/authentication':['manage-2fa'],
 '/connect-central/authentication/oauth':['manage-oauth'],
 '/connect-central/access':['view-roles'],
 '/connect-central/access/permissions':['manage-roles'],
 '/connect-central/access/locks':['manage-account-locks'],
 '/connect-central/policies':['manage-session-policies'],
 '/connect-central/policies/password':['manage-password-policy'],
 '/time-sync/attendance-policies':['policy.view'],
 '/time-sync/my-timelines':['attendance.view_self'],
 '/time-sync/punch-attendance':['attendance_punch.web','attendance_punch.view'],
 '/time-sync/my-regularizations':['regularization.view_self','regularization.view'],
 '/time-sync/my-shift-swap':['shift_swap.view_self','shift_swap.view'],
 '/time-sync/my-schedule':['roster_assignment.view'],
 '/time-sync/my-team':['attendance.view_team'],
 '/time-sync/shift-templates':['shift.view'],
 '/time-sync/shift-assignment':['shift_assignment.view'],
 '/time-sync/roster-templates':['roster_template.view'],
 '/time-sync/roster-planner':['roster_assignment.view'],
 '/time-sync/calendar-assignment':['roster_assignment.view'],
 '/time-sync/device-management':['device.view'],
 '/time-sync/attendance-reprocessing':['attendance.reprocess'],
 '/leave-ease/my-balance':['leave-balance.view'],
 '/leave-ease/my-requests':['leave-request.view'],
 '/leave-ease/encashment':['encashment.view'],
 '/leave-ease/comp-off':['comp_off.view_self','comp_off.view'],
 '/leave-ease/leave-types':['leave-types.manage'],
 '/leave-ease/leave-policies':['leave-policies.manage'],
 '/leave-ease/holiday-calendar':['holidays.manage'],
 '/leave-ease/accrual-rules':['accrual-rule.view'],
 '/leave-ease/carry-forward':['carry-forward.view'],
 '/leave-ease/blackout':['blackout-dates.view'],
 '/leave-ease/balance-adjustments':['balance-adjustments.view'],
 '/leave-ease/opening-balances':['opening-balances.view'],
 '/leave-ease/year-end':['year-end-close.view'],
 '/flexi-import/new':['bulk-import'],
 '/flexi-import/templates':['manage-import-templates'],
 '/flexi-import/batches':['view-import-history'],
 '/letter-forge/templates':['view-letter-templates'],
 '/people-hub/onboarding':['manage-employees','employees.create'],
 '/flexi-hq/form-builder':['manage-onboarding-form','onboard_settings.view'],
};
export function canVisit(path: string, grants: readonly string[]): boolean {
 const clean = path.split('?')[0];
 const match = Object.keys(routePermissions).sort((a,b)=>b.length-a.length).find(route=>clean===route || clean.startsWith(route+'/'));
 return !match || routePermissions[match].some(permission=>hasPermission(grants,permission));
}
