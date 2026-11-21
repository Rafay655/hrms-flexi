import {expect,it} from 'vitest';
import {previewCell,spreadsheetColumns,editablePreviewRow} from './import-preview';
const row={row_number:2,status:'valid',raw_data:{'Department title':'Finance',status:0,'Extra column':'Retained'},validation_errors:[],processing_error:null};
it('preserves raw uploaded header order and unknown columns',()=>{
 const columns=spreadsheetColumns(Object.keys(row.raw_data),[{key:'name',label:'Name',type:'text',required:true},{key:'status',label:'Status',type:'select',required:false}],{'Department title':'name'});
 expect(columns.map(field=>field.key)).toEqual(['Department title','status','Extra column']);
 expect(columns[0].requestKey).toBe('name');expect(columns[2].editable).toBe(false);
});
it('matches editor values through keys, custom mapping and normalized labels without losing zero',()=>{
 expect(previewCell(row,{key:'name',label:'Name'},{'Department title':'name'})).toBe('Finance');
 expect(previewCell(row,{key:'status',label:'Status'})).toBe(0);
 expect(previewCell(row,{key:'other',label:' extra_column '})).toBe('Retained');
 expect(editablePreviewRow('valid')).toBe(true);expect(editablePreviewRow('invalid')).toBe(true);expect(editablePreviewRow('committed')).toBe(false);
});
