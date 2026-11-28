import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {employeeImportService as service} from '@/services/employee-import.service';
import {importStudioService} from '@/services/import-studio.service';
import {ImportRows} from './import-rows';
vi.mock('@/services/employee-import.service',()=>({employeeImportService:{previewFields:vi.fn(),rows:vi.fn(),correctRows:vi.fn()}}));
vi.mock('@/services/import-studio.service',()=>({importStudioService:{template:vi.fn()}}));
let client:QueryClient;
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(service.previewFields).mockResolvedValue([{key:'badge',label:'Device Badge ID',type:'text',required:true},{key:'notes',label:'Notes',type:'text',required:false}]);
 vi.mocked(service.rows).mockResolvedValue({data:[{row_number:3,status:'invalid',raw_data:{badge:'000123',notes:'A'},validation_errors:[{field:'badge',message:'Badge is already assigned',code:'duplicate_identity'}],processing_error:null}],page:1,hasNext:true});
 client=new QueryClient({defaultOptions:{queries:{retry:false}}});
});
afterEach(()=>{cleanup();client.clear();});
function mount(canEdit=false,pinned=false){render(<QueryClientProvider client={client}><ImportRows uuid="batch" scope="company:user" revision={1} mode="detailed" canEdit={canEdit} previewFields={canEdit?[{key:'badge',label:'Device Badge ID',type:'text',required:true},{key:'notes',label:'Notes',type:'text',required:false}]:undefined} templateUuid={pinned?'tpl':undefined} templateVersion={pinned?1:undefined} onQueued={vi.fn()} /></QueryClientProvider>);}
it('renders friendly schema columns and zero-preserving values with bounded server pagination',async()=>{
 mount();expect(await screen.findByText('000123')).toBeInTheDocument();expect(screen.queryByText('badge')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Edit row'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Next page'}));
 await waitFor(()=>expect(service.rows).toHaveBeenLastCalledWith('batch','',2,expect.any(AbortSignal)));
});
it('locks required column selection and exposes current invalid row correction only when enabled',async()=>{
 mount(true);await screen.findByText('000123');fireEvent.click(screen.getByRole('button',{name:'Columns'}));
 expect(screen.getByRole('checkbox',{name:'Device Badge ID'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Edit row'})).toBeEnabled();
});
it('provides textual issue categories in the Issues pane',async()=>{
 mount();await screen.findByText('000123');fireEvent.click(screen.getByRole('tab',{name:'Issues'}));
 expect(screen.getByText('Duplicate identity: Badge is already assigned')).toBeInTheDocument();
});

it('uses pinned metadata labels while preserving uploaded column order',async()=>{
 vi.mocked(importStudioService.template).mockResolvedValue({template_uuid:'tpl',version:1,download_available:true,fields:[{key:'notes',label:'Pinned Notes',type:'text',required:false},{key:'badge',label:'Pinned Badge',type:'text',required:true}]} as Awaited<ReturnType<typeof importStudioService.template>>);
 mount(false,true);
 await screen.findByText('Pinned Notes');
 expect(service.previewFields).not.toHaveBeenCalled();
 expect(importStudioService.template).toHaveBeenCalledWith('tpl',expect.any(AbortSignal),1);
 const headers=screen.getAllByRole('columnheader');expect(headers[1]).toHaveTextContent('Pinned Badge');expect(headers[2]).toHaveTextContent('Pinned Notes');
});

it('edits a valid FlexiMeta row using status fields and saved column mapping',async()=>{
 const previewFields=[{key:'name',label:'Name',type:'text',required:true}];
 vi.mocked(service.rows).mockResolvedValue({data:[{row_number:2,status:'valid',raw_data:{'Department title':'Finance',Count:0,Extra:'Keep me'},validation_errors:[],processing_error:null},{row_number:3,status:'invalid',raw_data:{Extra:'Another value',Count:1,'Department title':''},validation_errors:[],processing_error:null}],page:1,hasNext:false});
 vi.mocked(service.correctRows).mockResolvedValue({status:'validating'});const queued=vi.fn();
 render(<QueryClientProvider client={client}><ImportRows uuid="batch" scope="company:user" revision={1} mode="detailed" importType="flexi_meta_departments" canEdit previewFields={previewFields} columnMapping={{'Department title':'name'}} onQueued={queued} totalRows={51} /></QueryClientProvider>);
 expect(await screen.findByText('Keep me')).toBeInTheDocument();expect(screen.getByText('0')).toBeInTheDocument();
 expect(screen.getAllByRole('button',{name:'Edit row'})).toHaveLength(2);
 expect(screen.getByRole('button',{name:'Next page'})).toBeEnabled();
 fireEvent.click(screen.getAllByRole('button',{name:'Edit row'})[0]);
 const name=await screen.findByRole('textbox',{name:'Name'});expect(name).toHaveValue('Finance');
 fireEvent.change(name,{target:{value:'Finance Operations'}});fireEvent.click(screen.getByRole('button',{name:'Save correction'}));
 await waitFor(()=>expect(service.correctRows).toHaveBeenCalledWith('batch',[{row_number:2,fields:{name:'Finance Operations'}}]));
 expect(service.previewFields).not.toHaveBeenCalled();expect(importStudioService.template).not.toHaveBeenCalled();
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());expect(queued).toHaveBeenCalledWith({status:'validating'});
});
it('keeps all uploaded columns visible when editing metadata cannot be loaded',async()=>{
 vi.mocked(service.previewFields).mockRejectedValue({response:{status:403}});
 vi.mocked(service.rows).mockResolvedValue({data:[{row_number:2,status:'valid',raw_data:{'First column':0,'Last column':'Visible'},validation_errors:[],processing_error:null}],page:1,hasNext:false});
 render(<QueryClientProvider client={client}><ImportRows uuid="batch" scope="company:user" revision={1} mode="detailed" canEdit /></QueryClientProvider>);
 expect(await screen.findByText('Visible')).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Edit row'})).not.toBeInTheDocument();
 expect(screen.getByRole('columnheader',{name:/First column/})).toBeInTheDocument();
});

it('keeps earlier headers aligned when a later server page adds a column',async()=>{
 vi.mocked(service.rows).mockImplementation(async(_uuid,_status,page)=>({page,hasNext:false,data:[{row_number:page===1?1:51,status:'valid',raw_data:page===1?{B:0,A:'First'}:{A:'Later',C:'New column'},validation_errors:[],processing_error:null}]}));
 render(<QueryClientProvider client={client}><ImportRows uuid="batch" scope="company:user" revision={1} totalRows={51} /></QueryClientProvider>);
 await screen.findByText('First');fireEvent.click(screen.getByRole('button',{name:'Next page'}));
 await screen.findByText('Later');
 const headers=screen.getAllByRole('columnheader');expect(headers[1]).toHaveTextContent('B');expect(headers[2]).toHaveTextContent('A');expect(headers[3]).toHaveTextContent('C');
 expect(screen.getByRole('button',{name:'Next page'})).toBeDisabled();
});

// The deployed preview uses raw HTTP for page-size/row-jump and deferred edits.
// Bridge those HTTP calls to the service fixtures used by this legacy suite.
vi.mock('@/lib/api',()=>({api:{
 get:vi.fn(async(url:string,config?:{params?:{status?:string;page?:number;row_number?:number;per_page?:number};signal?:AbortSignal})=>{
  const uuid=url.split('/').at(-2)!;const params=config?.params;
  const result=await service.rows(uuid,params?.status??'',params?.page??1,config?.signal);
  return {data:{success:true,data:result.data,...(params?.row_number!==undefined?{meta:{current_page:1,last_page:1,total:result.data.length,per_page:params.per_page??50}}:{})}};
 }),
 patch:vi.fn(async(url:string,body:{changes:{row_number:number;fields:Record<string,string|null>}[]})=>({data:{success:true,data:await service.correctRows(url.split('/').at(-2)!,body.changes)}}))
}}));
