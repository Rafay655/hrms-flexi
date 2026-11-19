import {expect,it} from 'vitest';
import {zipSync,strToU8} from 'fflate';
import {checkSavedTemplateFile} from './import-template-file';
import type {SavedImporter} from '@/services/import-studio.service';
const saved:SavedImporter={template_uuid:'tpl',version:1,name:'Team',import_type:'employees',form_mode:'detailed',operation:'create_or_update',schema_version:'s1',selected_field_keys:['code'],fields:[{key:'code',label:'Employee Code',type:'text',required:true}],download_available:true};
function workbook(keys:string[]){const zip=zipSync({'xl/workbook.xml':strToU8('<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" r:id="rId1"/></sheets></workbook>'),'xl/_rels/workbook.xml.rels':strToU8('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),'xl/worksheets/sheet1.xml':strToU8(`<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Employee Code</t></is></c></row><row r="2" hidden="1">${keys.map((key,index)=>`<c r="${String.fromCharCode(65+index)}2" t="inlineStr"><is><t>${key}</t></is></c>`).join('')}</row></sheetData></worksheet>`)});return {name:'team.xlsx',size:zip.length,arrayBuffer:async()=>zip.buffer} as File;}
it('accepts a saved-version workbook by its hidden system keys',async()=>{await expect(checkSavedTemplateFile(workbook(['code']),saved)).resolves.toBeUndefined();});
it('rejects an all-fields workbook against a narrower saved version',async()=>{await expect(checkSavedTemplateFile(workbook(['code','name']),saved)).rejects.toThrow('does not match saved template version 1');});
it('accepts CSV labels or stored mappings without reading employee data as numbers',async()=>{
 await expect(checkSavedTemplateFile(new File(['Employee Code\n000123'],'team.csv'),saved)).resolves.toBeUndefined();
 await expect(checkSavedTemplateFile(new File(['Staff Code\n000123'],'team.csv'),{...saved,column_mapping:{'Staff Code':'code'}},true)).resolves.toBeUndefined();
});
it('rejects extra CSV fields before creating a doomed batch',async()=>{await expect(checkSavedTemplateFile(new File(['Employee Code,Name\n000123,Rafay'],'all.csv'),saved)).rejects.toThrow('Expected 1 column');});
