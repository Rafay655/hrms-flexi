import {expect,it} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {ProfileSummaries} from './profile-summaries';
import {createDemoProfileService} from './demo-profile';
import {canVisit} from '@/lib/access-control';
it('renders every requested workspace summary',()=>{render(<ProfileSummaries/>);for(const name of ['LeaveEase · Leave balances','TimeSync','PayEdge · Payroll','Loan Hub','Expense Hub'])expect(screen.getByRole('heading',{name})).toBeInTheDocument();cleanup();});
it('allows profile viewing without ESS grants',()=>{expect(canVisit('/people-hub/ess-profile',[])).toBe(true);});
it('keeps dummy corrections isolated and leaves official preview values unchanged',async()=>{const first=createDemoProfileService();const second=createDemoProfileService();const row=await first.submit({field_key:'phone',requested_value:'+923009999999',reason:'Changed number'});expect((await first.profile()).sections.flatMap(s=>s.fields).find(f=>f.field_key==='phone')?.pending_request_uuid).toBe(row.uuid);expect((await second.profile()).sections.flatMap(s=>s.fields).find(f=>f.field_key==='phone')?.pending_request_uuid).toBeNull();await first.cancel(row.uuid);expect((await first.profile()).sections.flatMap(s=>s.fields).find(f=>f.field_key==='phone')?.value).toBe('+923001234567');});
