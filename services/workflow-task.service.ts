import { api } from '@/lib/api';
export type WorkflowDecision='approve'|'reject'|'return';
export type WorkflowTaskCard={
 task_id:number;etag:string;state:string;allowed_decisions:WorkflowDecision[];
 source:{type:string;uuid:string;revision:number};redacted?:boolean;
 needs_data?:{decision:WorkflowDecision;fields:{field:string;type:string;required:boolean}[]}[];
};
export const workflowTaskService={
 async get(id:number,signal?:AbortSignal):Promise<WorkflowTaskCard>{const {data}=await api.get(`/system-flex/workflow/tasks/${id}`,{signal});if(data.success===false)throw data;return data.data;},
 async decide(card:WorkflowTaskCard,sourceUuid:string,decision:WorkflowDecision,reason:string,extra:Record<string,unknown>,key:string){
  const fresh=await workflowTaskService.get(card.task_id);
  if(fresh.etag!==card.etag||fresh.source.revision!==card.source.revision)throw new Error('The workflow changed. Reload the task and review it before submitting again.');
  if(fresh.redacted||fresh.source.type!=='import_batch'||fresh.source.uuid!==sourceUuid||!fresh.allowed_decisions.includes(decision))throw new Error('This workflow decision is no longer available for the import.');
  const {data}=await api.post(`/system-flex/workflow/tasks/${card.task_id}/decisions`,{decision,expected_revision:card.source.revision,...(reason.trim()?{reason:reason.trim()}:{}),...(Object.keys(extra).length?{data:extra}:{})},{headers:{'If-Match':card.etag,'Idempotency-Key':key}});
  if(data.success===false)throw data;return data.data;
 },
};
