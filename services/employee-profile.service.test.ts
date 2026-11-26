import {beforeEach,expect,it,vi} from 'vitest';
import {api} from '@/lib/api';
import {employeeProfileApi} from './employee-profile.service';
vi.mock('@/lib/api',()=>({api:{get:vi.fn(),post:vi.fn(),put:vi.fn()}}));
beforeEach(()=>vi.resetAllMocks());
it('reads defaults without creating a profile and preserves string CNIC and null values',async()=>{
 const defaults={employee_uuid:'example-uuid',cnic:'0000012345678',state_id:null,state:null};
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:defaults}});const signal=new AbortController().signal;
 expect(await employeeProfileApi.getCreateDefaults('example-uuid',signal)).toEqual(defaults);
 expect(api.get).toHaveBeenCalledWith('/compliance/employee-profiles/example-uuid/create-defaults',{signal});expect(api.post).not.toHaveBeenCalled();
});
it('preserves a structured defaults failure for the modal',async()=>{
 const failure={success:false,error:{status:403,message:'Not permitted'}};
 vi.mocked(api.get).mockResolvedValue({data:failure});
 await expect(employeeProfileApi.getCreateDefaults('example-uuid')).rejects.toEqual(failure);
});
