import {expect,it,vi} from 'vitest';
import {api} from '@/lib/api';
import {onboardSettingsService} from './onboard-settings.service';
import type {SaveOnboardFieldPayload} from '@/types/onboard-settings';
vi.mock('@/lib/api',()=>({api:{patch:vi.fn().mockResolvedValue({data:{success:true}})}}));
it('uses PATCH and preserves explicit null versus an omitted condition',async()=>{
 const clear={visibility_condition:null} as SaveOnboardFieldPayload;
 await onboardSettingsService.updateField(1,clear);
 expect(api.patch).toHaveBeenLastCalledWith('/flexi-hq/onboard-settings/fields/1',{visibility_condition:null});
 await onboardSettingsService.updateField(1,{label:'Updated'} as SaveOnboardFieldPayload);
 expect(api.patch).toHaveBeenLastCalledWith('/flexi-hq/onboard-settings/fields/1',{label:'Updated'});
});
