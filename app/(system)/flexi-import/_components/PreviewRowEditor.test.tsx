import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {employeeImportService as service} from '@/services/employee-import.service';
import {PreviewRowEditor,RowCorrectionDialog} from './PreviewRowEditor';
vi.mock('@/services/employee-import.service',()=>({employeeImportService:{previewFields:vi.fn(),rows:vi.fn(),correctRows:vi.fn()}}));
vi.mock('./import-lookup-input',()=>({ImportLookupInput:({label,parentId,onSelect}:{label:string;parentId?:string;onSelect:(option:{id:number;label:string})=>void})=><div><span>{label} parent: {parentId??'none'}</span><button type="button" onClick={()=>onSelect({id:167,label:'Chosen parent'})}>Choose {label}</button></div>}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('edits invalid rows with labels and sends only changed field keys before awaiting validation',async()=>{
 vi.mocked(service.previewFields).mockResolvedValue([{key:'field_phone',label:'Emergency contact',type:'text',required:true},{key:'field_department',label:'Department',type:'text',required:true}]);
 vi.mocked(service.rows).mockResolvedValue({data:[{row_number:3,status:'invalid',raw_data:{'Emergency contact':'bad',Department:'Payroll'},validation_errors:[{message:'Phone is invalid'}],processing_error:null}],page:1,hasNext:false});
 vi.mocked(service.correctRows).mockResolvedValue({batch_uuid:'batch',status:'validating'});
 const queued=vi.fn(),client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 render(<QueryClientProvider client={client}><PreviewRowEditor uuid="batch" scope="company:user" mode="detailed" revision={0} onQueued={queued} onRefresh={vi.fn()} /></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'Edit row'}));
 fireEvent.change(await screen.findByLabelText('Emergency contact'),{target:{value:'+923001234567'}});
 expect(screen.queryByText('field_phone')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Save and re-check'}));
 await waitFor(()=>expect(service.correctRows).toHaveBeenCalledWith('batch',[{row_number:3,fields:{field_phone:'+923001234567'}}]));
 await waitFor(()=>expect(queued).toHaveBeenCalledWith({batch_uuid:'batch',status:'validating'}));
 expect(service.previewFields).toHaveBeenCalledWith('detailed',expect.any(AbortSignal));
 expect(service.rows).toHaveBeenCalledWith('batch','invalid',1,expect.any(AbortSignal));
 client.clear();
});

it('retains corrections after a 409 and requires comparison before reapplying',async()=>{
 vi.mocked(service.previewFields).mockResolvedValue([{key:'field_phone',label:'Contact',type:'text',required:false}]);
 const item={row_number:3,status:'invalid',raw_data:{Contact:'old'},validation_errors:[],processing_error:null};
 vi.mocked(service.rows).mockResolvedValue({data:[{...item,raw_data:{Contact:'other operator'}}],page:1,hasNext:false});
 vi.mocked(service.correctRows).mockRejectedValueOnce({response:{status:409,data:{success:false,message:'Preview changed'}}}).mockResolvedValueOnce({status:'validating'});
 const refresh=vi.fn(),queued=vi.fn(),client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 render(<QueryClientProvider client={client}><RowCorrectionDialog uuid="batch" scope="company:user" mode="quick" row={item} onClose={vi.fn()} onQueued={queued} onRefresh={refresh} /></QueryClientProvider>);
 fireEvent.change(await screen.findByLabelText('Contact'),{target:{value:'my correction'}});
 fireEvent.click(screen.getByRole('button',{name:'Save and re-check'}));
 await screen.findByText(/Your local edits are retained/);
 expect(screen.getByLabelText('Contact')).toHaveValue('my correction');
 expect(screen.getByRole('button',{name:'Save and re-check'})).toBeDisabled();
 fireEvent.click(await screen.findByRole('checkbox',{name:/I reviewed these changes/}));
 fireEvent.click(screen.getByRole('button',{name:'Save and re-check'}));
 await waitFor(()=>expect(service.correctRows).toHaveBeenCalledTimes(2));
 expect(service.correctRows).toHaveBeenLastCalledWith('batch',[{row_number:3,fields:{field_phone:'my correction'}}]);
 expect(refresh).toHaveBeenCalled();client.clear();
});
it('requires explicit optional-clear confirmation and supports local undo',async()=>{
 vi.mocked(service.previewFields).mockResolvedValue([{key:'notes',label:'Notes',type:'text',required:false}]);
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 render(<QueryClientProvider client={client}><RowCorrectionDialog uuid="batch" scope="company:user" mode="quick" row={{row_number:3,status:'invalid',raw_data:{Notes:'keep'},validation_errors:[],processing_error:null}} onClose={vi.fn()} onQueued={vi.fn()} onRefresh={vi.fn()} /></QueryClientProvider>);
 fireEvent.change(await screen.findByLabelText('Notes'),{target:{value:'{clear}'}});
 expect(screen.getByRole('button',{name:'Save and re-check'})).toBeDisabled();
 fireEvent.click(screen.getByRole('checkbox',{name:/I understand these optional/}));
 expect(screen.getByRole('button',{name:'Save and re-check'})).toBeEnabled();
 fireEvent.click(screen.getByRole('button',{name:'Undo local edit'}));
 expect(screen.getByLabelText('Notes')).toHaveValue('keep');
 expect(screen.getByRole('button',{name:'Save and re-check'})).toBeDisabled();client.clear();
});

it('restores lookup dependencies with local undo and redo',async()=>{
 vi.mocked(service.previewFields).mockResolvedValue([{key:'department',label:'Department',type:'lookup',required:true,source_key:'departments'},{key:'designation',label:'Designation',type:'dependent_lookup',required:false,source_key:'designations',parent_field_key:'department'}]);
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 render(<QueryClientProvider client={client}><RowCorrectionDialog uuid="batch" scope="company:user" mode="quick" row={{row_number:3,status:'invalid',raw_data:{Department:'Original',Designation:'Original title'},validation_errors:[],processing_error:null}} onClose={vi.fn()} onQueued={vi.fn()} onRefresh={vi.fn()} /></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'Choose Department'}));
 expect(screen.getByText('Designation parent: 167')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Undo local edit'}));expect(screen.getByText('Designation parent: none')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Redo local edit'}));expect(screen.getByText('Designation parent: 167')).toBeInTheDocument();client.clear();
});

it('omits dependent edits when a controlling toggle hides the field',async()=>{
 vi.mocked(service.previewFields).mockResolvedValue([{key:'children',label:'Has Children',type:'toggle',required:false},{key:'child_name',label:'Child name',type:'text',required:true,visibility_condition:{field_key:'children',values:['1']}}]);
 vi.mocked(service.correctRows).mockResolvedValue({status:'validating'});
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 render(<QueryClientProvider client={client}><RowCorrectionDialog uuid="batch" scope="company:user" mode="quick" row={{row_number:3,status:'invalid',raw_data:{'Has Children':'1','Child name':''},validation_errors:[],processing_error:null}} onClose={vi.fn()} onQueued={vi.fn()} onRefresh={vi.fn()} /></QueryClientProvider>);
 fireEvent.change(await screen.findByLabelText('Child name'),{target:{value:'Retained locally'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'Has Children'}));
 expect(screen.queryByLabelText('Child name')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Save and re-check'}));
 await waitFor(()=>expect(service.correctRows).toHaveBeenCalledWith('batch',[{row_number:3,fields:{children:'0'}}]));client.clear();
});
