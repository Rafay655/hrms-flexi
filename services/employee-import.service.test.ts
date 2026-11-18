import {beforeEach,expect,it,vi} from 'vitest';
import {api} from '@/lib/api';
import {employeeImportService as service,importData,type GapDecision} from './employee-import.service';
vi.mock('@/lib/api',()=>({api:{get:vi.fn(),post:vi.fn()}}));
beforeEach(()=>{vi.clearAllMocks();vi.mocked(api.post).mockResolvedValue({data:{success:true,data:{uuid:'batch',status:'uploaded'}}});});
it.each([['quick',false],['quick',true],['detailed',false],['detailed',true]] as const)('uses independent form and fields choices for %s/%s',async(mode,required)=>{
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:[{field_key:'dynamic-key',label:'Department',required:true}]}});
 expect((await service.fields(mode,required))[0].key).toBe('dynamic-key');
 expect(api.get).toHaveBeenCalledWith('/flexi-import/fields/employees',{params:{form_mode:mode,required_only:required?1:0},signal:undefined});
});
it('downloads all four template combinations without old mode aliases',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:new Blob(['xlsx'])});
 for(const form_mode of ['quick','detailed'] as const)for(const required_only of [false,true]){
  await service.template({form_mode,required_only});expect(api.get).toHaveBeenLastCalledWith('/flexi-import/templates/employees/download',{params:{form_mode,required_only:required_only?1:0},responseType:'blob'});
 }
});
it('supports update and CSV downloads',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:new Blob(['xlsx'])});
 await service.template({form_mode:'detailed',required_only:false},'xlsx','update');expect(api.get).toHaveBeenLastCalledWith('/flexi-import/templates/employees/download',{params:{form_mode:'detailed',required_only:0,type:'update'},responseType:'blob'});
 await service.template({form_mode:'quick',required_only:true},'csv');expect(api.get).toHaveBeenLastCalledWith('/flexi-import/templates/employees/download',{params:{form_mode:'quick',required_only:1,format:'csv'},responseType:'blob'});
});
it('omits mappings for downloaded templates and saves the upload email option',async()=>{
 await service.upload(new File(['data'],'employees.xlsx'),'detailed',undefined,true);
 const call=vi.mocked(api.post).mock.calls[0],body=call[1] as FormData;
 expect(body.get('form_mode')).toBe('detailed');expect(body.get('auto_process')).toBe('0');expect(body.get('send_welcome_email')).toBe('1');expect([...body.keys()].some(key=>key.startsWith('column_mapping'))).toBe(false);expect(body.has('company_id')).toBe(false);
 expect(call[2]).toEqual({headers:{'Content-Type':undefined}});
});
it('validates and submits custom mappings behind readable labels',async()=>{
 await service.validateMapping('quick',['Staff Number'],{'Staff Number':'employee_code'});
 expect(api.post).toHaveBeenLastCalledWith('/flexi-import/validate-mapping',{import_type:'employees',form_mode:'quick',csv_headers:['Staff Number'],column_mapping:{'Staff Number':'employee_code'}});
 await service.upload(new File(['data'],'employees.csv'),'quick',{'Staff Number':'employee_code'});
 expect((vi.mocked(api.post).mock.calls[1][1] as FormData).get('column_mapping[Staff Number]')).toBe('employee_code');
});
it('submits source/value decisions and retains failures on HTTP success',async()=>{
 const result={created:[],decided:0,failed:[{source_key:'blood_groups',value:'O+ve',message:'Unavailable'}]};vi.mocked(api.post).mockResolvedValue({data:{success:true,data:result}});
 expect(await service.resolve('batch',[{source_key:'blood_groups',value:'O+ve',action:'use_existing',existing_id:23}])).toEqual(result);
 expect(api.post).toHaveBeenLastCalledWith('/flexi-import/batches/batch/gaps/resolve',{decisions:[{source_key:'blood_groups',value:'O+ve',action:'use_existing',existing_id:23}]});
});
it('allows 500 parent-scoped decisions but rejects duplicate identities and 501',async()=>{
 const decisions:GapDecision[]=Array.from({length:500},(_,i)=>({source_key:'departments',value:'Payroll',parent_id:i,action:'create'}));
 await service.resolve('batch',decisions);expect(api.post).toHaveBeenCalledTimes(1);
 await expect(service.resolve('batch',[decisions[0],decisions[0]])).rejects.toThrow('distinct');
 await expect(service.resolve('batch',[...decisions,{...decisions[0],parent_id:501}])).rejects.toThrow('500');
});
it('uses revalidate explicitly and accepts queue acknowledgements with null data',async()=>{
 vi.mocked(api.post).mockResolvedValue({data:{success:true,data:null}});
 await expect(service.process('batch',{import_mode:'skip_errors',send_welcome_email:false,ignore_gaps:true})).resolves.toBeNull();
 expect(api.post).toHaveBeenLastCalledWith('/flexi-import/batches/batch/process',{import_mode:'skip_errors',send_welcome_email:false,ignore_gaps:true});
 await service.revalidate('batch');expect(api.post).toHaveBeenLastCalledWith('/flexi-import/batches/batch/revalidate',{});
});
it('infers the next row page when pagination metadata is absent',async()=>{
 vi.mocked(api.get).mockResolvedValueOnce({data:{success:true,data:Array.from({length:50},(_,i)=>({row_number:i+3}))}}).mockResolvedValueOnce({data:{success:true,data:[{row_number:53}]}});
 expect(await service.rows('batch','',1)).toMatchObject({page:1,hasNext:true});
 expect(await service.rows('batch','invalid',2)).toMatchObject({page:2,hasNext:false});
 expect(api.get).toHaveBeenLastCalledWith('/flexi-import/batches/batch/rows',{params:{status:'invalid',page:2},signal:undefined});
});
it('handles nested history without inventing a total or last page',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:{data:Array.from({length:20},(_,i)=>({uuid:String(i)}))}}});
 const result=await service.history({page:1,per_page:20,date_from:'2026-01-01'});
 expect(result.hasNext).toBe(true);expect(result.total).toBeUndefined();expect(result.lastPage).toBeUndefined();
 expect(api.get).toHaveBeenLastCalledWith('/flexi-import/batches',{params:{import_type:'employees',page:1,per_page:20,date_from:'2026-01-01'},signal:undefined});
});
it('retains error envelopes and support references',()=>{
 const error={success:false,error:{code:'VALIDATION_FAILED',message:'Invalid mapping',request_id:'support-id',field_errors:{file:['Invalid file']}}};
 try{importData(error);throw new Error('Expected failure');}catch(actual){expect(actual).toBe(error);}
});
