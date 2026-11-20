"use client";
import {availableImportScopes} from '@/lib/import-scopes';
import {useState} from 'react';
import Link from 'next/link';
import {useSearchParams,useRouter} from 'next/navigation';
import {useQuery} from '@tanstack/react-query';
import {useAppSelector} from '@/store/hooks';
import {Button} from '@/components/ui/button';
import {AppLoader} from '@/components/ui/app-loader';
import {ApiErrorState} from '@/components/ui/api-error-state';
import {StudioFrame} from '../_components/studio-frame';
import {EmployeeUpload} from '../_components/employee-upload';
import {importStudioService as service} from '@/services/import-studio.service';
import type {TemplateSelection} from '@/services/employee-import.service';
export default function NewImportPage(){
 const params=useSearchParams(),templateId=params.get('template_uuid'),version=params.get('version')?Number(params.get('version')):undefined;
 const scope=useAppSelector(state=>`${state.auth.company?.id}:${state.auth.user?.id}`);
 if(version!==undefined&&(!Number.isInteger(version)||version<1))return <StudioFrame title="Choose a template version" description="This saved-template link has an invalid version."><Button asChild><Link href="/flexi-import/templates">Open saved templates</Link></Button></StudioFrame>;
 return <NewImportFlow key={`${scope}:${templateId??'standard'}:${version??'latest'}`} scope={scope} templateId={templateId} version={version} />;
}
function NewImportFlow({scope,templateId,version}:{scope:string;templateId:string|null;version?:number}){
 const router=useRouter();
 const [type,setType]=useState<string|null>(null),[selection,setSelection]=useState<TemplateSelection|null>(null),[useSaved,setUseSaved]=useState(true);
 const scopes=useQuery({queryKey:['import-studio',scope,'scopes'],queryFn:({signal})=>service.scopes(signal),retry:false,refetchOnWindowFocus:false});
 const saved=useQuery({queryKey:['import-studio',scope,'template',templateId,version],queryFn:({signal})=>service.template(templateId!,signal,version),enabled:!!templateId,retry:false,refetchOnWindowFocus:false});
 if(scopes.isPending||templateId&&saved.isPending)return <AppLoader label="Loading import configuration…" />;
 if(scopes.error)return <ApiErrorState error={scopes.error} onRetry={()=>void scopes.refetch()} />;
 if(saved.error)return <ApiErrorState error={saved.error} onRetry={()=>void saved.refetch()} />;
 const chosen=availableImportScopes(scopes.data??[]).find(item=>item.import_type===(type??(useSaved?saved.data?.import_type:undefined)));
 const appliedTemplate=useSaved&&chosen?.import_type===saved.data?.import_type?saved.data:undefined;
 const activeSelection=selection??{form_mode:appliedTemplate?.form_mode??(chosen?.import_type==='employees'?'quick':'detailed'),required_only:false};
 if(chosen?.destinations?.length&&!appliedTemplate)return <StudioFrame title="Choose a FlexiMeta destination" description="Select the master table for this import. Parent records must already exist." actions={<Button variant="outline" onClick={()=>{setType(null);setUseSaved(false);}}>Import types</Button>}><div className="space-y-5">{[...new Set(chosen.destinations.map(item=>item.group))].map(group=><section key={group} className="space-y-2"><h2 className="text-sm font-semibold text-brand-900">{group}</h2><div className="grid gap-3 sm:grid-cols-3">{chosen.destinations!.filter(item=>item.group===group).map(item=><button key={item.import_type} type="button" className="rounded-xl border bg-card p-4 text-left text-sm transition-colors hover:border-brand-800/30 hover:bg-brand-100/30" onClick={()=>{setType(item.import_type);setSelection(null);}}>{item.title}</button>)}</div></section>)}</div></StudioFrame>;
 if(chosen)return <EmployeeUpload key={`${scope}-${chosen.import_type}-${appliedTemplate?.version??0}-${activeSelection.form_mode}-${activeSelection.required_only}`} importType={chosen.import_type} title={chosen.title} operation={appliedTemplate?.operation??chosen.operations[0]} savedMapping={appliedTemplate?.column_mapping} savedTemplateName={appliedTemplate?.name} savedTemplate={appliedTemplate} selection={activeSelection} onSelectionChange={setSelection} onBack={()=>{setType(null);setUseSaved(false);setSelection(null);router.replace('/flexi-import/new');}} />;
 return <StudioFrame title="New Import" description="Start with a standard template, or reuse a saved template with your chosen columns." actions={<><Button variant="outline" asChild><Link href="/flexi-import/templates">Use saved template</Link></Button><Button variant="outline" asChild><Link href="/flexi-import/templates/new">Design a template</Link></Button></>}>{!scopes.data?.length?<p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No import scopes are currently available.</p>:<div className="grid gap-4 sm:grid-cols-2">{scopes.data.map(item=><button key={item.import_type} type="button" className="space-y-3 rounded-2xl border bg-card p-5 text-left transition-colors hover:border-brand-800/30 hover:bg-brand-100/30" onClick={()=>{setType(item.import_type);setSelection(null);}}><h2 className="font-semibold text-brand-900">{item.title}</h2><p className="text-xs text-muted-foreground">{item.operations.map(operation=>operation==='create_only'?'Add records':operation==='update_only'?'Update records':'Add & Update').join(' · ')}</p></button>)}</div>}<p className="text-xs text-muted-foreground">Import using an Excel or CSV file. You can correct invalid employee rows after validation.</p></StudioFrame>;
}
