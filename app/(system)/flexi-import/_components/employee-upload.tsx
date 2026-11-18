"use client";
import { useRef,useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation,useQuery } from '@tanstack/react-query';
import { Download,Upload,ArrowLeft,FileSpreadsheet,ChevronDown,CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import SearchableSelect from '@/components/ui/searchable-select';
import { DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AppLoader } from '@/components/ui/app-loader';
import { ApiErrorState } from '@/components/ui/api-error-state';
import { Frame,Modal } from '@/components/shared/directory-ui';
import { useAppSelector } from '@/store/hooks';
import { employeeImportService as service,type TemplateSelection } from '@/services/employee-import.service';
import { importWorkbookHeaders } from '@/lib/import-workbook';
import { autoMatchColumns } from '@/lib/flexi-import';
import { downloadImportFile } from '@/lib/employee-import';
import { showApiError } from '@/lib/error-toast';
import { parseApiError } from '@/lib/api-error';
import { ImportErrorFeedback } from './import-error-feedback';
import { ImportSteps,ImportSection,importPrimary } from './import-ui';
export function EmployeeUpload({selection,onSelectionChange,onBack}:{selection:TemplateSelection;onSelectionChange:(selection:TemplateSelection)=>void;onBack:()=>void}){
 const router=useRouter();
 const company=useAppSelector(s=>s.auth.company?.id),user=useAppSelector(s=>s.auth.user?.id);
 const [file,setFile]=useState<File|null>(null),[headers,setHeaders]=useState<string[]>([]),[mapping,setMapping]=useState<Record<string,string>>({});
 const [fileKind,setFileKind]=useState<'template'|'custom'>('template');
 const [reading,setReading]=useState(false),[mappingFeedback,setMappingFeedback]=useState<string|null>(null),[downloaded,setDownloaded]=useState(false);
 const [pendingSelection,setPendingSelection]=useState<TemplateSelection|null>(null),[welcome,setWelcome]=useState(false),[dragging,setDragging]=useState(false);
 const readVersion=useRef(0);
 const fields=useQuery({queryKey:['employee-import','fields',company,user,selection.form_mode,selection.required_only],queryFn:({signal})=>service.fields(selection.form_mode,selection.required_only,signal),retry:false});
 const template=useMutation({mutationFn:({format,type}:{format:'xlsx'|'csv';type:'create'|'update'})=>service.template(selection,format,type),onSuccess:(blob,choice)=>{downloadImportFile(blob,`employees-${selection.form_mode}-${choice.type}-${selection.required_only?'required':'all'}.${choice.format}`);setDownloaded(true);},onError:(error:unknown)=>showApiError(error)});
 const upload=useMutation({mutationFn:async()=>{
  if(!file)throw new Error('Choose a workbook first.');
  if(fileKind==='custom'){
   if(!fields.data||!headers.length)throw new Error('Load the available fields and map the file columns first.');
   const report=await service.validateMapping(selection.form_mode,headers,mapping);
   if(!report.valid){setMappingFeedback(`Map these required fields: ${report.unmapped_required_fields.map(key=>fields.data?.find(f=>f.key===key)?.label??'Required field').join(', ')}`);throw new Error('Map every required field before uploading.');}
  }
  return service.upload(file,selection.form_mode,fileKind==='custom'?mapping:undefined,welcome);
 },onSuccess:batch=>{toast.success('File uploaded. Validation is queued.');router.push(`/flexi-import/batches/${batch.uuid}`);},onError:(error:unknown)=>showApiError(error)});
 const missing=(fields.data??[]).filter(field=>field.required&&!Object.values(mapping).includes(field.key));
 const errorBody=(upload.error as {response?:{data?:{errors?:{existing_batch_uuid?:string|string[]}}}})?.response?.data;
 const duplicateValue=errorBody?.errors?.existing_batch_uuid;
 const duplicateUuid=typeof duplicateValue==='string'?duplicateValue:Array.isArray(duplicateValue)?duplicateValue[0]:null;
 function chooseSelection(next:TemplateSelection){if(next.form_mode===selection.form_mode&&next.required_only===selection.required_only)return;if(downloaded||file)setPendingSelection(next);else onSelectionChange(next);}
 async function chooseFile(value:File|undefined){
  const version=++readVersion.current;setFile(null);setHeaders([]);setMapping({});setMappingFeedback(null);upload.reset();if(!value)return;
  if(!value.size||value.size>10*1024*1024||!(/\.(xlsx|csv)$/i.test(value.name))){showApiError(new Error('Choose a non-empty XLSX or CSV file up to 10 MB.'));return;}
  if(fileKind==='template'){setFile(value);return;}
  setReading(true);try{const columns=await importWorkbookHeaders(value);if(version!==readVersion.current)return;setFile(value);setHeaders(columns);setMapping(autoMatchColumns(columns,fields.data??[]));}catch(error){if(version===readVersion.current)showApiError(error);}finally{if(version===readVersion.current)setReading(false);}
 }
 const busy=upload.isPending||reading;
 return <Frame title="Employee Import" description="Bring your people into Flexi. Preview new employees and updates before anything is saved." actions={<Button size="sm" variant="outline" disabled={busy} onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Import types</Button>}>
  <ImportSteps active={file?2:1} />
  <ImportSection number={1} title="Choose your template" description="Your onboarding form and field selection are independent.">
   <div className="grid gap-5 sm:grid-cols-2">
    <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium text-foreground">Onboarding form</legend>{(['quick','detailed'] as const).map(mode=><label key={mode} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-200 ${selection.form_mode===mode?'border-brand-800/30 bg-brand-100':'border-border hover:bg-muted/40'}`}><input type="radio" name="import-form-mode" value={mode} checked={selection.form_mode===mode} disabled={busy} onChange={()=>chooseSelection({...selection,form_mode:mode})} className="mt-1 accent-brand-800" /><span><span className="block text-sm font-medium text-foreground">{mode==='quick'?'Quick onboarding':'Detailed onboarding'}</span><span className="mt-1 block text-xs text-muted-foreground">{mode==='quick'?"Your company’s shorter employee form.":"Your company’s detailed employee form."}</span></span></label>)}</fieldset>
    <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium text-foreground">Template fields</legend>{[{value:false,title:'All visible fields',description:'Include required and optional fields.'},{value:true,title:'Required fields only',description:'Include mandatory columns only.'}].map(item=><label key={String(item.value)} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-200 ${selection.required_only===item.value?'border-brand-800/30 bg-brand-100':'border-border hover:bg-muted/40'}`}><input type="radio" name="import-field-selection" checked={selection.required_only===item.value} disabled={busy} onChange={()=>chooseSelection({...selection,required_only:item.value})} className="mt-1 accent-brand-800" /><span><span className="block text-sm font-medium text-foreground">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.description}</span></span></label>)}</fieldset>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div className="flex flex-wrap gap-2"><Button className={importPrimary} disabled={busy||template.isPending} onClick={()=>template.mutate({format:'xlsx',type:'create'})}><Download className="mr-2 h-4 w-4" />{template.isPending?'Downloading…':'Download XLSX template'}</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={busy||template.isPending}>More formats<ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onClick={()=>template.mutate({format:'csv',type:'create'})}>Download CSV template</DropdownMenuItem><DropdownMenuItem disabled={selection.required_only} onClick={()=>template.mutate({format:'xlsx',type:'update'})}>Existing employee update template</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><span className="text-xs font-medium text-brand-800">{selection.form_mode==='quick'?'Quick':'Detailed'} · {selection.required_only?'Required only':'All visible fields'}</span></div>
   <p className="text-xs leading-5 text-muted-foreground">Use the Data sheet and enter employees from row 3. Keep the header and hidden field-mapping row. The new-employee template is empty. Update templates include all visible fields.</p>
   <div className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-4 py-3 text-xs leading-5 text-brand-800">Device Badge ID is included when configured for your selected form. Format identifiers as Text in Excel to preserve leading zeros such as <strong>000123</strong>.</div>
  </ImportSection>
  <ImportSection number={2} title="Upload your employee file" description="Use the same form selection as your downloaded template.">
   <div className="flex flex-wrap gap-2" role="group" aria-label="Spreadsheet source"><Button variant={fileKind==='template'?'default':'outline'} size="sm" className={fileKind==='template'?importPrimary:''} disabled={busy} onClick={()=>{setFileKind('template');setFile(null);setHeaders([]);setMapping({});}}>Downloaded template</Button><Button variant={fileKind==='custom'?'default':'outline'} size="sm" className={fileKind==='custom'?importPrimary:''} disabled={busy} onClick={()=>{setFileKind('custom');setFile(null);setHeaders([]);setMapping({});}}>My own spreadsheet</Button></div>
   <label onDragOver={event=>{event.preventDefault();if(!busy)setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={event=>{event.preventDefault();setDragging(false);if(!busy)void chooseFile(event.dataTransfer.files[0]);}} className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors duration-200 ${dragging?'border-brand-800 bg-brand-100':'border-brand-800/20 bg-brand-100/40 hover:border-brand-800/50'}`}><FileSpreadsheet className="mb-1 h-8 w-8 text-brand-700" /><span className="text-sm font-semibold text-foreground">Choose your completed spreadsheet</span><span className="text-xs text-muted-foreground">Drop a file here or browse · XLSX or CSV · Up to 10 MB</span><Input aria-label="Employee spreadsheet" type="file" accept=".xlsx,.csv" className="mt-2 max-w-sm bg-background text-xs" disabled={busy} onChange={event=>void chooseFile(event.target.files?.[0])} />{file&&<span className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-brand-800"><CheckCircle2 className="h-4 w-4" />{file.name}</span>}</label>
   {reading&&<AppLoader variant="inline" label="Reading workbook headers…" />}
   {fileKind==='custom'&&(fields.isPending?<AppLoader label="Loading available fields…" />:fields.error?<ApiErrorState error={fields.error} onRetry={()=>void fields.refetch()} />:headers.length>0&&<details open className="rounded-lg border border-border p-4"><summary className="cursor-pointer text-sm font-semibold text-brand-800">Match spreadsheet columns</summary><p className="my-3 text-xs text-muted-foreground">Choose readable onboarding labels. Optional columns may be ignored.</p><div className="grid gap-3 sm:grid-cols-2">{headers.map(header=><div key={header} className="min-w-0 space-y-1.5"><Label>{header}</Label><SearchableSelect aria-label={`Map ${header}`} widthClass="w-full" value={mapping[header]??''} allLabel="Ignore column" disabled={busy} options={(fields.data??[]).map(field=>({value:field.key,label:`${field.label}${field.required?' *':''}`}))} onChange={value=>{setMappingFeedback(null);setMapping(previous=>{const next=Object.fromEntries(Object.entries(previous).filter(([column,key])=>column!==header&&(!value||key!==value)));if(value)next[header]=value;return next;});}} /></div>)}</div>{missing.length>0&&<p className="mt-4 text-xs text-destructive">Required columns to map: {missing.map(f=>f.label).join(', ')}.</p>}</details>)}
   {mappingFeedback&&<p role="alert" className="text-sm text-destructive">{mappingFeedback}</p>}
   <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4"><Checkbox checked={welcome} disabled={busy} onCheckedChange={value=>setWelcome(value===true)} /><span><span className="block text-sm font-medium text-foreground">Share welcome credentials by email</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">New accounts only. Choose now for approval-required imports; this choice may be frozen once submitted for approval.</span></span></label>
   <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-xs text-muted-foreground">Preview first. Employee records are not saved on upload.</p><Button className={importPrimary} disabled={!file||busy||(fileKind==='custom'&&(missing.length>0||!fields.data?.length))} onClick={()=>upload.mutate()}><Upload className="mr-2 h-4 w-4" />{upload.isPending?'Uploading…':'Upload & validate'}</Button></div>
   <ImportErrorFeedback error={upload.error} />
   {duplicateUuid&&parseApiError(upload.error).status===409&&<Button variant="outline" size="sm" onClick={()=>router.push(`/flexi-import/batches/${encodeURIComponent(duplicateUuid)}`)}>Open existing import</Button>}
  </ImportSection>
  {pendingSelection&&<Modal title="Change template selection?" description="Download the matching template before uploading. Changing your selection clears the current file and mapping." onClose={()=>setPendingSelection(null)} footer={<><Button variant="outline" onClick={()=>setPendingSelection(null)}>Keep current selection</Button><Button className={importPrimary} onClick={()=>onSelectionChange(pendingSelection)}>Return to template selection</Button></>}><p className="text-sm text-muted-foreground">{pendingSelection.form_mode==='quick'?'Quick':'Detailed'} · {pendingSelection.required_only?'Required fields only':'All visible fields'}</p></Modal>}
 </Frame>;
}
