"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import toast from 'react-hot-toast';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import SearchableSelect from '@/components/ui/searchable-select';
import {AppLoader} from '@/components/ui/app-loader';
import {employeeProfileApi} from '@/services/employee-profile.service';
import {parseApiError} from '@/lib/api-error';
import type {CreateEmployeeProfilePayload,EmployeeProfile,EmployeeProfileCreateDefaults} from '@/types/employee-profile.types';

type Choice={value:string;label:string};
type Props={employees:Choice[];states:Choice[];initialEmployee?:Choice|null;onClose:()=>void;onCreated:(profile:EmployeeProfile)=>void};
export function CreateProfileModal({employees,states,initialEmployee,onClose,onCreated}:Props){
 const [employee,setEmployee]=useState(initialEmployee?.value??''),[saving,setSaving]=useState(false);
 const choices=initialEmployee&&!employees.some(item=>item.value===initialEmployee.value)?[initialEmployee,...employees]:employees;
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create Employee Statutory Profile</DialogTitle><DialogDescription>Employee defaults are filled automatically. Review them before creating the profile.</DialogDescription></DialogHeader>
 <div className="space-y-1.5"><Label htmlFor="statutory-employee">Employee *</Label><SearchableSelect id="statutory-employee" aria-label="Employee" widthClass="w-full" allowAll={false} placeholder="Select employee" value={employee} options={choices} disabled={saving} onChange={setEmployee} /></div>
 <ProfileForm key={employee} employee={employee} states={states} onClose={onClose} onCreated={onCreated} onSaving={setSaving} />
 </DialogContent></Dialog>;
}
function Field({name,label,errors,children}:{name:string;label:string;errors:Record<string,string[]>;children:ReactNode}){
 return <div className="space-y-1.5"><Label htmlFor={`statutory-${name}`}>{label}</Label>{children}{errors[name]?.map((error,index)=><p key={index} id={`statutory-${name}-error`} role="alert" className="text-xs text-red-600">{error}</p>)}</div>;
}
function ProfileForm({employee,states,onClose,onCreated,onSaving}:{employee:string;states:Choice[];onClose:()=>void;onCreated:(profile:EmployeeProfile)=>void;onSaving:(saving:boolean)=>void}){
 // Defaults (including CNIC) stay in this mounted form, never in a query cache or browser storage.
 const [form,setForm]=useState<CreateEmployeeProfilePayload>({employee_uuid:employee,cnic:'',state_id:undefined,effective_from:'',ntn:'',eobi_number:'',ss_number:'',eobi_applicable:true,social_security_applicable:true,provident_fund_applicable:false,gratuity_applicable:false,is_filer:false,filer_status:'non_filer'});
 const [stateOption,setStateOption]=useState<Choice|null>(null),[loading,setLoading]=useState(!!employee),[loadError,setLoadError]=useState<string|null>(null),[retry,setRetry]=useState(0),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState<string|null>(null),[errors,setErrors]=useState<Record<string,string[]>>({});
 const submitting=useRef(false);
 useEffect(()=>{
  if(!employee)return;
  const controller=new AbortController();let active=true;
  employeeProfileApi.getCreateDefaults(employee,controller.signal).then((defaults:EmployeeProfileCreateDefaults)=>{
   if(!active||controller.signal.aborted)return;
   if(defaults.employee_uuid!==employee){setLoadError('Defaults did not match the selected employee. Try again.');return;}
   setForm(previous=>({...previous,cnic:typeof defaults.cnic==='string'?defaults.cnic:'',state_id:defaults.state_id??undefined}));
   setStateOption(defaults.state&&defaults.state_id!==null?{value:String(defaults.state_id),label:defaults.state.name}:null);
  }).catch(error=>{if(active&&!controller.signal.aborted){const parsed=parseApiError(error);if(!parsed.cancelled)setLoadError(parsed.message);}}).finally(()=>{if(active&&!controller.signal.aborted)setLoading(false);});
  return()=>{active=false;controller.abort();};
 },[employee,retry]);
 const provinceOptions=stateOption?[stateOption,...states.filter(item=>item.value!==stateOption.value)]:states;
 function change<K extends keyof CreateEmployeeProfilePayload>(key:K,value:CreateEmployeeProfilePayload[K]){setForm(previous=>({...previous,[key]:value}));setErrors(previous=>({...previous,[key]:[]}));}
 async function save(){
  if(!employee||loading||loadError||submitting.current)return;
  submitting.current=true;setSaving(true);onSaving(true);setSaveError(null);setErrors({});
  const payload={...form,employee_uuid:employee};
  if(!payload.cnic?.trim())delete payload.cnic;else payload.cnic=payload.cnic.trim();
  if(!payload.effective_from?.trim())delete payload.effective_from;
  if(payload.state_id===undefined||payload.state_id===null)delete payload.state_id;else payload.state_id=Number(payload.state_id);
  try{
   const response=await employeeProfileApi.createProfile(payload);
   const envelope=response.data as {success?:boolean;data:EmployeeProfile};
   if(envelope.success===false)throw envelope;
   toast.success(envelope.data.state?.name?`Profile created · ${envelope.data.state.name}`:'Profile created.');
   onCreated(envelope.data);
  }catch(error){const parsed=parseApiError(error);setErrors(parsed.fieldErrors);setSaveError(parsed.message);}
  finally{submitting.current=false;setSaving(false);onSaving(false);}
 }
 const disabled=loading||saving||!employee||!!loadError;
 return <><form id="statutory-create-form" onSubmit={event=>{event.preventDefault();void save();}} className="space-y-4 py-2">
 {loading&&<AppLoader variant="inline" label="Loading employee defaults…" />}
 {loadError&&<div role="alert" className="space-y-2 rounded-lg border border-red-200 p-3 text-sm text-red-700"><p>{loadError}</p><Button type="button" variant="outline" size="sm" onClick={()=>{setLoadError(null);setLoading(true);setRetry(value=>value+1);}}>Try again</Button></div>}
 {errors.employee_uuid?.map((message,index)=><p key={index} role="alert" className="text-xs text-red-600">{message}</p>)}
 <fieldset disabled={disabled} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <Field name="state_id" label="Province" errors={errors}><SearchableSelect id="statutory-state_id" aria-label="Province" widthClass="w-full" allowAll={false} placeholder="Select province" value={form.state_id==null?'':String(form.state_id)} options={provinceOptions} disabled={disabled} onChange={value=>change('state_id',value?Number(value):undefined)} /></Field>
 <Field name="cnic" label="CNIC (13 digits)" errors={errors}><Input id="statutory-cnic" aria-invalid={!!errors.cnic?.length} aria-describedby={errors.cnic?.length?'statutory-cnic-error':undefined} value={form.cnic??''} onChange={event=>change('cnic',event.target.value)} inputMode="numeric" maxLength={13} autoComplete="off" placeholder="0000012345678" /></Field>
 {([{key:'ntn',label:'NTN'},{key:'eobi_number',label:'EOBI Number'},{key:'ss_number',label:'Social Security Number'}] as const).map(item=><Field key={item.key} name={item.key} label={item.label} errors={errors}><Input id={`statutory-${item.key}`} value={form[item.key]??''} onChange={event=>change(item.key,event.target.value)} /></Field>)}
 <Field name="effective_from" label="Effective From" errors={errors}><Input id="statutory-effective_from" type="date" value={form.effective_from??''} onChange={event=>change('effective_from',event.target.value)} /><p className="text-xs text-muted-foreground">Leave blank to use today’s date.</p></Field>
 <Field name="filer_status" label="Filer Status" errors={errors}><SearchableSelect id="statutory-filer_status" aria-label="Filer Status" widthClass="w-full" allowAll={false} value={form.filer_status??'non_filer'} disabled={disabled} options={[{value:'active_filer',label:'Active Filer'},{value:'non_filer',label:'Non-Filer'},{value:'unknown',label:'Unknown'}]} onChange={value=>change('filer_status',value as CreateEmployeeProfilePayload['filer_status'])} /></Field>
 <div className="col-span-1 grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-3">{([{key:'is_filer',label:'Is Filer'},{key:'eobi_applicable',label:'EOBI Applicable'},{key:'social_security_applicable',label:'SS Applicable'},{key:'provident_fund_applicable',label:'PF Applicable'},{key:'gratuity_applicable',label:'Gratuity Applicable'}] as const).map(item=><Field key={item.key} name={item.key} label={item.label} errors={errors}><Checkbox id={`statutory-${item.key}`} aria-label={item.label} checked={!!form[item.key]} disabled={disabled} onCheckedChange={value=>change(item.key,value===true)} /></Field>)}</div>
 </fieldset>
 {saveError&&<p role="alert" className="text-sm text-red-600">{saveError}</p>}
 </form><DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" form="statutory-create-form" disabled={disabled}>{saving?'Creating…':'Create'}</Button></DialogFooter></>;
}
