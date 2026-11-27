import {beforeEach,expect,it,vi} from 'vitest';
import {api} from '@/lib/api';
import {stateService} from './state.service';
vi.mock('@/lib/api',()=>({api:{get:vi.fn()}}));
beforeEach(()=>vi.resetAllMocks());
it('loads every page for the chosen country and handles string country IDs',async()=>{
 vi.mocked(api.get).mockResolvedValueOnce({data:{success:true,data:[{id:1,name:'First',country_id:'167'},{id:2,name:'Wrong country',country_id:1}],meta:{current_page:1,last_page:2}}}).mockResolvedValueOnce({data:{success:true,data:[{id:3,name:'Later page',country_id:167}],meta:{current_page:2,last_page:2}}});
 const signal=new AbortController().signal;
 expect((await stateService.getOptions(167,signal)).map(row=>row.id)).toEqual([1,3]);
 expect(api.get).toHaveBeenNthCalledWith(1,'/flexi-meta/company/states',{params:{country_id:167,per_page:100,page:1},signal});
 expect(api.get).toHaveBeenNthCalledWith(2,'/flexi-meta/company/states',{params:{country_id:167,per_page:100,page:2},signal});
});
it('keeps a genuinely empty country empty',async()=>{vi.mocked(api.get).mockResolvedValue({data:{success:true,data:[],meta:{current_page:1,last_page:1}}});expect(await stateService.getOptions(1)).toEqual([]);});
it('reports incomplete pagination instead of silently returning missing options',async()=>{vi.mocked(api.get).mockResolvedValue({data:{success:true,data:[],meta:{current_page:1,last_page:2}}});await expect(stateService.getOptions(1)).rejects.toThrow('Incomplete');});
it('propagates failed requests instead of substituting stale options',async()=>{vi.mocked(api.get).mockRejectedValue(new Error('Request cancelled'));await expect(stateService.getOptions(1)).rejects.toThrow('Request cancelled');});
