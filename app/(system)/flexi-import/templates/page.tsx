"use client";
import {availableImportScopes} from '@/lib/import-scopes';
import {useState} from 'react';
import Link from 'next/link';
import {useMutation,useQuery} from '@tanstack/react-query';
import {useAppSelector} from '@/store/hooks';
import {importStudioService as service} from '@/services/import-studio.service';
import {downloadImportFile} from '@/lib/employee-import';
import {StudioFrame} from '../_components/studio-frame';
import {ImportErrorFeedback} from '../_components/import-error-feedback';
import {ImportPagination,importPrimary} from '../_components/import-ui';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {AppLoader} from '@/components/ui/app-loader';
import {ApiErrorState} from '@/components/ui/api-error-state';
export default function ImporterTemplates(){
 const scope=useAppSelector(state=>`${state.auth.company?.id}:${state.auth.user?.id}`);
 const [search,setSearch]=useState(''),[type,setType]=useState(''),[status,setStatus]=useState(''),[version,setVersion]=useState(''),[page,setPage]=useState(1);
 const params={page,per_page:30,...(search?{q:search}:{}),...(type?{import_type:type}:{}),...(status?{status}:{}),...(version?{version:Number(version)}:{})};
 const scopes=useQuery({queryKey:['import-studio',scope,'scopes'],queryFn:({signal})=>service.scopes(signal),retry:false});
 const query=useQuery({queryKey:['import-studio',scope,'templates',params],queryFn:({signal})=>service.templatePage(params,signal),retry:false,refetchOnWindowFocus:false});
 const download=useMutation({mutationFn:({uuid,version}:{uuid:string;version:number})=>service.downloadSaved(uuid,version),onSuccess:result=>downloadImportFile(result.blob,result.filename),retry:false});
 return <StudioFrame title="Importer templates" description="Reusable, immutable configurations. Export and upload against an exact saved version." actions={<><Button variant="outline" asChild><Link href="/flexi-import/column-maps">Column maps</Link></Button><Button className={importPrimary} asChild><Link href="/flexi-import/templates/new">New template</Link></Button></>}>
 <div className="flex flex-wrap gap-3"><Input aria-label="Search templates" className="sm:w-64" placeholder="Search templates…" value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}} /><select aria-label="Filter template type" className="h-10 rounded-md border bg-background px-3 text-sm" value={type} onChange={event=>{setType(event.target.value);setPage(1);}}><option value="">All types</option>{availableImportScopes(scopes.data??[]).map(item=><option key={item.import_type} value={item.import_type}>{item.title}</option>)}</select><select aria-label="Filter template status" className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}}><option value="">All statuses</option><option value="active">Active</option></select><Input aria-label="Filter latest template version" className="sm:w-44" type="number" min={1} placeholder="Latest version number" value={version} onChange={event=>{setVersion(event.target.value);setPage(1);}} /></div>
 <ImportErrorFeedback error={download.error} />{query.isPending?<AppLoader label="Loading saved templates…" />:query.error?<ApiErrorState error={query.error} onRetry={()=>void query.refetch()} />:<><div className="grid gap-4 md:grid-cols-2">{!query.data?.data.length&&<p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No templates found.</p>}{query.data?.data.map(item=><article key={item.template_uuid} className="space-y-4 rounded-2xl border bg-card p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold text-brand-900">{item.name}</h2><span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-800">Version {item.version}</span></div><p className="text-xs text-muted-foreground">{item.import_type.replaceAll('_',' ')} · {item.selected_field_keys.length} fields · {item.form_mode}</p>{item.download_available!==true&&<p className="text-xs text-muted-foreground">Save a new version to add the field snapshot before exporting or uploading.</p>}<div className="flex flex-wrap gap-2">{item.download_available===true?<Button className={importPrimary} size="sm" asChild><Link href={`/flexi-import/new?template_uuid=${encodeURIComponent(item.template_uuid)}&version=${item.version}`}>Use version {item.version}</Link></Button>:<Button size="sm" disabled>Upload unavailable</Button>}<Button size="sm" variant="outline" disabled={item.download_available!==true||download.isPending} onClick={()=>download.mutate({uuid:item.template_uuid,version:item.version})}>Export selected fields</Button><Button variant="outline" size="sm" asChild><Link href={`/flexi-import/templates/new?template_uuid=${encodeURIComponent(item.template_uuid)}&version=${item.version}`}>View / revise</Link></Button></div></article>)}</div><ImportPagination page={query.data?.current_page??page} lastPage={query.data?.last_page} total={query.data?.total} count={query.data?.data.length??0} size={30} hasNext={page<(query.data?.last_page??1)} onPage={setPage} disabled={query.isFetching} /></>}
 </StudioFrame>;
}
