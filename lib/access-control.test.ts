import {describe,it,expect} from 'vitest';
import {canVisit,hasPermission} from './access-control';
import matrix from './permission-matrix.json';
describe('permission matrix access',()=>{
 it('retains all workbook roles and permission names',()=>{expect(matrix.permissions).toHaveLength(582);expect(Object.keys(matrix.roles)).toHaveLength(12);expect(new Set(matrix.permissions).size).toBe(582);});
 it('requires exact permissions and explicit wildcard grants',()=>{expect(hasPermission(['comp_off.approve'],'comp_off.approve')).toBe(true);expect(hasPermission(['comp-off.approve'],'comp_off.approve')).toBe(false);expect(hasPermission(['device.*'],'device.delete')).toBe(true);expect(hasPermission(['device.view'],'device.delete')).toBe(false);});
 it('uses the most specific route and prevents direct unauthorized visits',()=>{expect(canVisit('/connect-central/access/permissions',['view-roles'])).toBe(false);expect(canVisit('/connect-central/access/permissions',['manage-roles'])).toBe(true);expect(canVisit('/leave-ease/year-end',[])).toBe(false);});
 it('keeps employee self access separate from team access',()=>{expect(canVisit('/time-sync/my-team',matrix.roles.employee)).toBe(false);expect(canVisit('/time-sync/my-timelines',matrix.roles.employee)).toBe(true);});
});
