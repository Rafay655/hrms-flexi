import {beforeEach,expect,it,vi} from 'vitest';
import {api} from '@/lib/api';
import {onboardingService} from './onboarding-form.service';
import type {ApiField,StepSubmitPayload} from '@/types/onboarding-form';
vi.mock('@/lib/api',()=>({api:{post:vi.fn()}}));
beforeEach(()=>{vi.clearAllMocks();vi.mocked(api.post).mockResolvedValue({data:{success:true,data:{id:'employee'}}});});
const parent={id:1,system_key:'marital',type:'select',label:'Marital status',is_required:true,is_login_email:false} satisfies ApiField;
const spouse={id:2,system_key:'spouse',type:'text',label:'Spouse',is_required:true,is_login_email:false,visibility_condition:{field_key:'marital',values:['42']}} satisfies ApiField;
const file={...spouse,id:3,system_key:'spouse_document',type:'file'};
const payload:StepSubmitPayload={form_mode:'detailed',step_id:2,fields:[spouse,file],allFields:[parent,spouse,file],values:{marital:'1',spouse:'Retained spouse',spouse_document:new File(['data'],'doc.pdf')}};
it('omits hidden values and uploads from employee saves, keeping visible values when active',async()=>{
 await onboardingService.submitStep(payload,'company');
 let body=vi.mocked(api.post).mock.calls[0][1] as FormData;
 expect(body.has('data[spouse]')).toBe(false);expect(body.has('files[spouse_document]')).toBe(false);
 await onboardingService.submitStep({...payload,values:{...payload.values,marital:'42'}},'company');
 body=vi.mocked(api.post).mock.calls[1][1] as FormData;
 expect(body.get('data[spouse]')).toBe('Retained spouse');expect(body.get('files[spouse_document]')).toBeInstanceOf(File);
});
it('includes controlling values from earlier steps in standalone validation',async()=>{
 await onboardingService.validateStep({...payload,values:{...payload.values,marital:'42'}},'company');
 expect(api.post).toHaveBeenCalledWith('/people-hub/onboarding/validate-step',{form_mode:'detailed',step_id:2,data:{marital:'42',spouse:'Retained spouse'}},{headers:{'X-Company-ID':'company'}});
});
