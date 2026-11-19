"use client";
import { useRef,useState } from 'react';
import { useQuery,useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/shared/directory-ui';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { workflowTaskService,type WorkflowDecision } from '@/services/workflow-task.service';
import { showApiError } from '@/lib/error-toast';
import { displayImportValue } from '@/lib/employee-import';
import { ImportErrorFeedback } from './import-error-feedback';
import { importPrimary } from './import-ui';
const labels={approve:'Approve',reject:'Reject',return:'Return for correction'};
export function ImportWorkflow({readOnly=false,workflow,uuid,scope,onChanged}:{readOnly?:boolean;workflow:Record<string,unknown>;uuid:string;scope:string;onChanged:()=>void}){
 const [decision,setDecision]=useState<WorkflowDecision|null>(null);
 const task=workflow.task as {id?:number;allowed_decisions?:WorkflowDecision[]}|null;
 const owned=workflow.owned===true||workflow.owner==='system_flex';
 const chain=Array.isArray(workflow.chain)?workflow.chain as {node?:string;state?:string;by?:string;decision?:string}[]:[];
 return <div className="space-y-4 rounded-lg border border-brand-800/15 bg-brand-100 p-4"><h3 className="text-sm font-semibold text-brand-800">SystemFlex-managed approval</h3><dl className="grid gap-3 text-sm sm:grid-cols-2">{['state','process','instance_id'].filter(key=>workflow[key]!=null).map(key=><div key={key}><dt className="text-xs capitalize text-muted-foreground">{key.replaceAll('_',' ')}</dt><dd className="mt-1 text-foreground">{displayImportValue(workflow[key])}</dd></div>)}</dl>
 {chain.length>0&&<ol className="space-y-2">{chain.map((step,index)=><li key={`${step.node}-${index}`} className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-800/10 pt-2 text-xs"><span className="font-medium text-brand-800">{step.node?.replaceAll('_',' ')??`Step ${index+1}`}</span><span className="text-muted-foreground">{[step.state,step.by,step.decision].filter(Boolean).join(' · ')}</span></li>)}</ol>}
 {!readOnly&&owned&&task?.id&&<div className="flex flex-wrap gap-2">{task.allowed_decisions?.filter(value=>Object.hasOwn(labels,value)).map(value=><Button key={value} size="sm" variant={value==='approve'?'default':'outline'} className={value==='approve'?importPrimary:''} onClick={()=>setDecision(value)}>{labels[value]}</Button>)}</div>}
 {!task?.id&&<p className="text-xs leading-5 text-muted-foreground">Waiting for an eligible approver or the next workflow step. No direct legacy approval is available for this workflow-owned import.</p>}
 {decision&&task?.id&&<WorkflowDecisionModal key={`${task.id}-${decision}`} uuid={uuid} taskId={task.id} scope={scope} decision={decision} onClose={()=>setDecision(null)} onChanged={onChanged} />}
 </div>;
}
function WorkflowDecisionModal({uuid,taskId,scope,decision,onClose,onChanged}:{uuid:string;taskId:number;scope:string;decision:WorkflowDecision;onClose:()=>void;onChanged:()=>void}){
 const task=useQuery({queryKey:['import-workflow',scope,taskId],queryFn:({signal})=>workflowTaskService.get(taskId,signal),retry:false,staleTime:0});
 const [reason,setReason]=useState(''),[values,setValues]=useState<Record<string,string|boolean>>({});
 const receipt=useRef({fingerprint:'',key:''});
 const fields=task.data?.needs_data?.find(item=>item.decision===decision)?.fields??[];
 const supported=fields.every(field=>['int','numeric','string','boolean','date'].includes(field.type));
 const mutation=useMutation({mutationFn:()=>{
  if(!task.data)throw new Error('Reload the workflow task first.');
  if(decision!=='approve'&&reason.trim().length<5)throw new Error('Enter a reason of at least 5 characters.');
  const extra:Record<string,unknown>={};
  for(const field of fields){const value=values[field.field];if(field.required&&(value===undefined||value===''))throw new Error(`${field.field.replaceAll('_',' ')} is required.`);if(value!==undefined&&value!=='')extra[field.field]=['int','numeric'].includes(field.type)?Number(value):value;}
  const fingerprint=JSON.stringify([task.data.etag,decision,reason,extra]);if(receipt.current.fingerprint!==fingerprint)receipt.current={fingerprint,key:crypto.randomUUID()};
  return workflowTaskService.decide(task.data,uuid,decision,reason,extra,receipt.current.key);
 },retry:false,onSuccess:()=>{toast.success('Workflow decision submitted.');onChanged();onClose();},onError:(error:unknown)=>{showApiError(error);onChanged();}});
 const allowed=task.data?.allowed_decisions.includes(decision)&&!task.data.redacted&&task.data.source.uuid===uuid;
 return <Modal title={`${labels[decision]} import`} description="This decision is submitted through SystemFlex with the current task version." onClose={onClose} busy={mutation.isPending} footer={<><Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button className={importPrimary} disabled={mutation.isPending||task.isFetching||!allowed||!supported||(decision!=='approve'&&reason.trim().length<5)} onClick={()=>mutation.mutate()}>{mutation.isPending?'Submitting…':'Submit workflow decision'}</Button></>}>
 {task.isPending?<AppLoader label="Loading workflow task…" />:task.error?<ApiErrorState error={task.error} onRetry={()=>void task.refetch()} />:<><p className="text-xs text-muted-foreground">{task.data?.state} · Source revision {task.data?.source.revision}</p>{fields.map(field=><div key={field.field} className="space-y-1.5"><Label htmlFor={`workflow-${field.field}`} className="capitalize">{field.field.replaceAll('_',' ')}{field.required?' *':''}</Label>{field.type==='boolean'?<Checkbox id={`workflow-${field.field}`} checked={values[field.field]===true} onCheckedChange={value=>setValues(previous=>({...previous,[field.field]:value===true}))} />:<Input id={`workflow-${field.field}`} type={['int','numeric'].includes(field.type)?'number':field.type==='date'?'date':'text'} step={field.type==='int'?1:'any'} disabled={mutation.isPending} value={String(values[field.field]??'')} onChange={event=>setValues(previous=>({...previous,[field.field]:event.target.value}))} />}</div>)}<div className="space-y-1.5"><Label htmlFor="workflow-decision-reason">{decision==='approve'?'Comments':'Reason *'}</Label><Textarea id="workflow-decision-reason" value={reason} maxLength={1000} disabled={mutation.isPending} onChange={event=>setReason(event.target.value)} /></div>{!supported&&<p className="text-xs text-destructive">This task requires an additional platform form. Open it through SystemFlex to complete the requested data.</p>}</>}
 <ImportErrorFeedback error={mutation.error} />{!!mutation.error&&<Button variant="outline" size="sm" disabled={task.isFetching} onClick={()=>{mutation.reset();void task.refetch();}}>Reload workflow task</Button>}
 </Modal>;
}
