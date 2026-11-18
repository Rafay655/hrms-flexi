import {beforeEach,expect,it,vi} from 'vitest';
import {api} from '@/lib/api';
import {workflowTaskService as service,type WorkflowTaskCard} from './workflow-task.service';
vi.mock('@/lib/api',()=>({api:{get:vi.fn(),post:vi.fn()}}));
const card:WorkflowTaskCard={task_id:3,etag:'"current"',state:'active',allowed_decisions:['approve','reject'],source:{type:'import_batch',uuid:'batch',revision:2}};
beforeEach(()=>{vi.clearAllMocks();vi.mocked(api.get).mockResolvedValue({data:{success:true,data:card}});vi.mocked(api.post).mockResolvedValue({data:{success:true,data:{state:'completed'}}});});
it('uses the platform decision endpoint with concurrency and idempotency headers',async()=>{
 await service.decide(card,'batch','approve','Reviewed',{},'receipt-key');
 expect(api.post).toHaveBeenCalledWith('/system-flex/workflow/tasks/3/decisions',{decision:'approve',expected_revision:2,reason:'Reviewed'},{headers:{'If-Match':'"current"','Idempotency-Key':'receipt-key'}});
});
it('blocks stale tasks and unavailable decisions before writing',async()=>{
 vi.mocked(api.get).mockResolvedValueOnce({data:{success:true,data:{...card,etag:'"changed"'}}});
 await expect(service.decide(card,'batch','approve','',{},'key')).rejects.toThrow('workflow changed');
 await expect(service.decide(card,'another-batch','approve','',{},'key')).rejects.toThrow('no longer available');
 expect(api.post).not.toHaveBeenCalled();
});
