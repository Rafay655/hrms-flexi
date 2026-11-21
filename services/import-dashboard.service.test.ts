import {beforeEach,expect,it,vi} from 'vitest';
import {api} from '@/lib/api';
import {getImportDashboard} from './import-dashboard.service';
vi.mock('@/lib/api',()=>({api:{get:vi.fn()}}));
beforeEach(()=>vi.resetAllMocks());
it('sends the selected month and cancellation signal through the shared client',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:{month:'2026-11',kpi:{batches_created:9},row_outcomes:{total:2}}}});
 const signal=new AbortController().signal;
 const result=await getImportDashboard('2026-11',signal);
 expect(api.get).toHaveBeenCalledWith('/flexi-import/dashboard',{params:{month:'2026-11'},signal});
 expect(result.month).toBe('2026-11');expect(result.active_batches).toEqual([]);
});
it('preserves structured API failures instead of falling back to demo counts',async()=>{
 const failure={success:false,error:{code:'FORBIDDEN',message:'Access denied'}};
 vi.mocked(api.get).mockResolvedValue({data:failure});
 await expect(getImportDashboard()).rejects.toEqual(failure);
});
