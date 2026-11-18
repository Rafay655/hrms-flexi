"use client";
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Frame } from '@/components/shared/directory-ui';
import { EmployeeUpload } from '../_components/employee-upload';
import { importPrimary } from '../_components/import-ui';
import LegacyImportWizard from './legacy-import-wizard';
import type { TemplateSelection } from '@/services/employee-import.service';
export default function NewImportPage(){
  const [type,setType]=useState<'employees'|'flexi_meta_entities'|null>(null);
  const [selection,setSelection]=useState<TemplateSelection>({form_mode:'quick',required_only:false});
  const company=useAppSelector(s=>s.auth.company?.id),user=useAppSelector(s=>s.auth.user?.id);
  if(type==='employees')return <EmployeeUpload key={`${company}-${user}-${selection.form_mode}-${selection.required_only}`} selection={selection} onSelectionChange={setSelection} onBack={()=>setType(null)} />;
  if(type==='flexi_meta_entities')return <LegacyImportWizard initialType="flexi_meta_entities" />;
  return <Frame title="New Import" description="Choose the data you want to import."><div className="grid gap-4 sm:grid-cols-2">{[{value:'employees' as const,title:'Employee onboarding',description:'Quick or detailed onboarding with validation, reference resolution, and approval tracking.'},{value:'flexi_meta_entities' as const,title:'Reference data',description:'Use the existing FlexiMeta import flow for reference records.'}].map(item=><div key={item.value} className="space-y-4 rounded-lg border border-gray-200 p-5"><h2 className="font-semibold text-gray-900">{item.title}</h2><p className="text-sm text-gray-500">{item.description}</p><Button className={importPrimary} onClick={()=>setType(item.value)}>Continue</Button></div>)}</div></Frame>;
}
