"use client";
import {useEffect,useState} from 'react';
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
 const params=useSearchParams();const templateId=params.get('template_uuid');const rawVersion=params.get('version');const version=rawVersion?Number(rawVersion):undefined;
 const scope=useAppSelector(state=>`${state.auth.company?.id}:${state.auth.user?.id}`);
 if(!templateId||version===undefined)return <ChooseTemplate/>;
 if(!Number.isSafeInteger(version)||version<1)return <StudioFrame title="Choose a template version" description="This saved-template link has an invalid version."><Button asChild><Link href="/flexi-import/templates">Open saved templates</Link></Button></StudioFrame>;
 return <SavedTemplateImport key={`${scope}:${templateId}:${version}`} scope={scope} templateId={templateId} version={version}/>;
}
function ChooseTemplate(){const router=useRouter();useEffect(()=>{router.replace('/flexi-import/templates');},[router]);return <AppLoader label="Opening saved templates…"/>;}
function SavedTemplateImport({scope,templateId,version}:{scope:string;templateId:string;version:number}){
 const router=useRouter();const [selection,setSelection]=useState<TemplateSelection|null>(null);
 const saved=useQuery({queryKey:['import-studio',scope,'template',templateId,version],queryFn:({signal})=>service.template(templateId,signal,version),retry:false,refetchOnWindowFocus:false});
 if(saved.isPending)return <AppLoader label="Loading saved template version…"/>;
 if(saved.error)return <ApiErrorState error={saved.error} onRetry={()=>void saved.refetch()}/>;
 const template=saved.data;
 if(!template||template.template_uuid!==templateId||template.version!==version)return <StudioFrame title="Template version unavailable" description="The server did not return the requested saved version."><Button asChild><Link href="/flexi-import/templates">Back to templates</Link></Button></StudioFrame>;
 const activeSelection=selection??{form_mode:template.form_mode,required_only:false};
 return <EmployeeUpload key={`${scope}:${templateId}:${version}`} importType={template.import_type} title={template.name} operation={template.operation} savedMapping={template.column_mapping} savedTemplateName={template.name} savedTemplate={template} selection={activeSelection} onSelectionChange={setSelection} onBack={()=>router.push('/flexi-import/templates')}/>;
}
