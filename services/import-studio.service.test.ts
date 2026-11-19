import {beforeEach,expect,it,vi} from 'vitest';
import {api} from '@/lib/api';
import {attachmentName,importStudioService as service} from './import-studio.service';
vi.mock('@/lib/api',()=>({api:{get:vi.fn(),post:vi.fn(),patch:vi.fn()}}));
beforeEach(()=>vi.clearAllMocks());
it('discovers only server scopes and normalizes schema field metadata',async()=>{
 vi.mocked(api.get).mockResolvedValueOnce({data:{success:true,data:[{import_type:'leave_adjustments',title:'Leave adjustments',operations:['create_only']}]}});
 expect((await service.scopes())[0].import_type).toBe('leave_adjustments');
 vi.mocked(api.get).mockResolvedValueOnce({data:{success:true,data:{import_type:'employees',schema_version:'schema-2',fields:[{field_key:'random-key',label:'Department',type:'lookup',required:true,parent_field_key:'division'},{field_key:'secret',label:'Forbidden',visible:false}]}}});
 const schema=await service.schema('employees','create_or_update','detailed');expect(schema.fields).toEqual([expect.objectContaining({key:'random-key',label:'Department',parent_field_key:'division'})]);
 expect(api.get).toHaveBeenLastCalledWith('/flexi-import/schemas/employees',{params:{operation:'create_or_update',form_mode:'detailed'},signal:undefined});
});
it('creates and versions templates using selected_field_keys and expected_version',async()=>{
 vi.mocked(api.post).mockResolvedValue({data:{success:true,data:{template_uuid:'template',version:1}}});vi.mocked(api.post).mockResolvedValue({data:{success:true,data:{template_uuid:'template',version:2}}});
 const payload={name:'Employees',import_type:'employees',operation:'create_or_update',form_mode:'detailed' as const,schema_version:'s1',selected_field_keys:['code','name']};
 await service.save(payload);expect(api.post).toHaveBeenCalledWith('/flexi-import/importer-templates',payload);
 await service.update('template',{name:'Updated',expected_version:1,schema_version:'s2'});expect(api.post).toHaveBeenCalledWith('/flexi-import/importer-templates/template/versions',{name:'Updated',expected_version:1,schema_version:'s2'});
});
it('uploads other scopes review-first without employee email or invented template pinning',async()=>{
 vi.mocked(api.post).mockResolvedValue({data:{success:true,data:{uuid:'batch',status:'uploaded'}}});
 await service.upload(new File(['csv'],'leave.csv'),'leave_adjustments','detailed',{'Days':'adjustment_days'},vi.fn());
 const body=vi.mocked(api.post).mock.calls[0][1] as FormData;
 expect(body.get('auto_process')).toBe('0');expect(body.get('import_type')).toBe('leave_adjustments');expect(body.has('send_welcome_email')).toBe(false);expect(body.has('template_uuid')).toBe(false);expect(body.get('column_mapping[Days]')).toBe('adjustment_days');
});
it('downloads real blobs using the server attachment name',async()=>{
 const blob=new Blob(['PKfile'],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 vi.mocked(api.get).mockResolvedValue({data:blob,headers:{'content-disposition':'attachment; filename="leave-2026.xlsx"'}});
 expect(await service.download('leave_adjustments','detailed',false)).toEqual({blob,filename:'leave-2026.xlsx'});
 expect(attachmentName("attachment; filename*=UTF-8''Company%20Template.xlsx",'fallback')).toBe('Company Template.xlsx');
});
it('preserves download validation errors instead of treating JSON as Excel',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:new Blob([JSON.stringify({success:false,message:'Forbidden'})],{type:'application/json'})});
 await expect(service.download('employees','quick',false)).rejects.toMatchObject({message:'Forbidden'});
});
it('paginates lookups and audit through authenticated endpoints',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:{options:[{id:167,label:'Punjab'}],has_more:false}}});await service.lookup('states','pun',2,'12');
 expect(api.get).toHaveBeenLastCalledWith('/flexi-import/lookups/states',{params:{q:'pun',page:2,parent_id:'12'},signal:undefined});
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:{events:[],has_more:true}}});await service.audit('batch',2);expect(api.get).toHaveBeenLastCalledWith('/flexi-import/batches/batch/audit',{params:{page:2},signal:undefined});
});

it('preserves a 409 version conflict for UI reload rather than silently retrying',async()=>{
 vi.mocked(api.post).mockRejectedValue({response:{status:409,data:{success:false,message:'Template changed',error:{request_id:'support-id'}}}});
 await expect(service.update('template',{expected_version:1,schema_version:'s1',name:'My version'})).rejects.toMatchObject({response:{status:409}});
 expect(api.post).toHaveBeenCalledTimes(1);
});

it('uses paged template filters and reads an exact immutable version',async()=>{
 vi.mocked(api.get).mockResolvedValueOnce({data:{success:true,data:{data:[{template_uuid:'tpl',version:2,name:'Team',selected_field_keys:['name']}],current_page:2,last_page:3,total:61}}});
 const result=await service.templatePage({q:'standard',import_type:'employees',owner_id:'10',status:'active',page:2,per_page:30});
 expect(result.current_page).toBe(2);expect(result.total).toBe(61);
 expect(api.get).toHaveBeenLastCalledWith('/flexi-import/importer-templates',{params:{q:'standard',import_type:'employees',owner_id:'10',status:'active',page:2,per_page:30},signal:undefined});
 vi.mocked(api.get).mockResolvedValueOnce({data:{success:true,data:{template_uuid:'tpl',version:1,selected_field_keys:['second','first'],fields:[{field_key:'second',label:'Second',type:'text'},{field_key:'first',label:'First',type:'text'}],download_available:true}}});
 const template=await service.template('tpl',undefined,1);
 expect(template.fields?.map(field=>field.key)).toEqual(['second','first']);
 expect(api.get).toHaveBeenLastCalledWith('/flexi-import/importer-templates/tpl',{signal:undefined,params:{version:1}});
});
it('exports the exact saved version instead of the standard scope workbook',async()=>{
 const blob=new Blob(['PKworkbook']);vi.mocked(api.get).mockResolvedValue({data:blob,headers:{'content-disposition':'attachment; filename="Team-v2.xlsx"'}});
 expect(await service.downloadSaved('tpl',2)).toEqual({blob,filename:'Team-v2.xlsx'});
 expect(api.get).toHaveBeenCalledWith('/flexi-import/importer-templates/tpl/download',{params:{version:2},responseType:'blob'});
});
it('pins both identifiers and omits mapping overrides on saved-version uploads',async()=>{
 vi.mocked(api.post).mockResolvedValue({data:{success:true,data:{uuid:'batch'}}});
 await service.upload(new File(['csv'],'team.csv'),'employees','detailed',{Name:'wrong-live-key'},vi.fn(),{template_uuid:'tpl',template_version:2,send_welcome_email:true});
 const body=vi.mocked(api.post).mock.calls[0][1] as FormData;
 expect(body.get('template_uuid')).toBe('tpl');expect(body.get('template_version')).toBe('2');expect(body.get('form_mode')).toBe('detailed');expect(body.get('auto_process')).toBe('0');expect(body.get('send_welcome_email')).toBe('1');
 expect([...body.keys()].some(key=>key.startsWith('column_mapping'))).toBe(false);expect(body.has('column_map_id')).toBe(false);
});
