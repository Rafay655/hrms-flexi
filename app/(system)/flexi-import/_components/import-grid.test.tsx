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
function mount(canEdit=false,pinned=false){render(<QueryClientProvider client={client}><ImportRows uuid="batch" scope="company:user" revision={1} mode="detailed" canEdit={canEdit} templateUuid={pinned?'tpl':undefined} templateVersion={pinned?1:undefined} onQueued={vi.fn()} /></QueryClientProvider>);}
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

it('loads pinned columns in saved order without requesting the current live fields',async()=>{
 vi.mocked(importStudioService.template).mockResolvedValue({template_uuid:'tpl',version:1,download_available:true,fields:[{key:'notes',label:'Pinned Notes',type:'text',required:false},{key:'badge',label:'Pinned Badge',type:'text',required:true}]} as Awaited<ReturnType<typeof importStudioService.template>>);
 mount(false,true);
 await screen.findByText('Pinned Notes');
 expect(service.previewFields).not.toHaveBeenCalled();
 expect(importStudioService.template).toHaveBeenCalledWith('tpl',expect.any(AbortSignal),1);
 const headers=screen.getAllByRole('columnheader');expect(headers[1]).toHaveTextContent('Pinned Notes');expect(headers[2]).toHaveTextContent('Pinned Badge');
});
