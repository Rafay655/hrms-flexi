import {expect,it} from 'vitest';
import {canVisit} from '@/lib/access-control';
it('keeps My Profile available without frontend permission grants',()=>{expect(canVisit('/people-hub/ess-profile',[])).toBe(true);});
