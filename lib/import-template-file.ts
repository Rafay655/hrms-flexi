import type {SavedImporter} from '@/services/import-studio.service';
import {importWorkbookHeaders} from '@/lib/import-workbook';
export async function checkSavedTemplateFile(file:File,template:SavedImporter,custom=false):Promise<void>{
 const xlsx=file.name.toLowerCase().endsWith('.xlsx');
 const headers=await importWorkbookHeaders(file,xlsx&&!custom?{xlsxRow:2}:undefined);
 const expected=template.selected_field_keys;
 const mapped=xlsx&&!custom?headers:headers.map(header=>{
  if(template.column_mapping?.[header])return template.column_mapping[header];
  const matches=(template.fields??[]).filter(field=>field.key===header||field.label===header);
  return matches.length===1?matches[0].key:'';
 });
 if(mapped.length!==expected.length||new Set(mapped).size!==mapped.length||mapped.some(key=>!expected.includes(key))){
  const labels=expected.map(key=>template.fields?.find(field=>field.key===key)?.label).filter(Boolean);
  throw new Error(`This file does not match saved template version ${template.version}. Download and fill that version’s Excel file. Expected ${expected.length} ${expected.length===1?'column':'columns'}${labels.length?`: ${labels.slice(0,8).join(', ')}${labels.length>8?', …':''}`:'.'} To import a standard all-fields workbook, start a standard import instead.`);
 }
}
