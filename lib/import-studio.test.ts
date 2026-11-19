import {expect,it} from 'vitest';
import {studioFields,studioRows,studioFieldVisibility,issueCategory,TARGET_IMPORT_FEATURES} from './import-studio';
import {autoMatchColumns} from './flexi-import';
it('honors server visibility and editability without treating sensitivity as a denial',()=>{
 const fields=studioFields([{key:'a',label:'Badge',type:'text',required:false},{key:'b',label:'Unknown',type:'widget',required:false},{key:'c',label:'Salary',type:'number',sensitive:true,required:false},{key:'d',label:'Hidden',type:'text',visible:false,required:false}]);
 expect(fields.map(field=>field.key)).toEqual(['a','b','c']);expect(fields.map(field=>field.editable)).toEqual([true,false,true]);
});
it('uses view-only IDs and leaves source identifiers as text without inventing revisions',()=>{
 const rows=studioRows([{row_number:3,status:'invalid',raw_data:{badge:'000123'},validation_errors:[],processing_error:null}]);
 expect(rows[0].viewId).toBe('preview-row-3');expect(rows[0].source.raw_data?.badge).toBe('000123');expect(rows[0]).not.toHaveProperty('row_revision');
});
it('does not auto-match ambiguous labels or duplicate target assignments',()=>{
 const fields=[{key:'a',label:'Employee',type:'text',required:true},{key:'b',label:'Employee',type:'text',required:true}];
 expect(autoMatchColumns(['Employee'],fields)).toEqual({});
 expect(autoMatchColumns(['a','Employee'],[fields[0]])).toEqual({});
});
it('distinguishes reference problems and keeps target mutation features unavailable',()=>{
 expect(issueCategory({code:'lookup_not_found'})).toBe('Missing reference');expect(issueCategory({code:'lookup_scope_mismatch'})).toBe('Wrong parent or company');expect(issueCategory({severity:'warning'})).toBe('Warning');
 expect(TARGET_IMPORT_FEATURES.templates).toBe(true);expect(TARGET_IMPORT_FEATURES.directEntry).toBe(false);expect(TARGET_IMPORT_FEATURES.allRowEditing).toBe(false);expect(TARGET_IMPORT_FEATURES.recoveryPreview).toBe(false);
});

it('distinguishes known conditional visibility from unresolved spreadsheet lookups',()=>{
 const fields=studioFields([{key:'children',label:'Has Children',type:'toggle',required:false},{key:'child_name',label:'Child name',type:'text',required:true,visibility_condition:{field_key:'children',values:['1']}},{key:'marital',label:'Marital status',type:'lookup',source_key:'marital_statuses',required:false},{key:'spouse',label:'Spouse',type:'text',required:true,visibility_condition:{field_key:'marital',values:['42']}}]);
 const visibility=studioFieldVisibility(fields,{children:'0',marital:'Married'},{});
 expect(visibility.get('child_name')).toBe(false);expect(studioFieldVisibility(fields,{children:'Yes'},{}).get('child_name')).toBeUndefined();expect(visibility.get('spouse')).toBeUndefined();
 expect(studioFieldVisibility(fields,{children:'1',marital:'Married'},{marital:'42'}).get('spouse')).toBe(true);
});
