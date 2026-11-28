import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import Page from './page';
import {employeeImportService as service} from '@/services/employee-import.service';
import {importStudioService as studio} from '@/services/import-studio.service';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock('@/store/hooks',()=>({useAppSelector:(select:(state:unknown)=>unknown)=>select({auth:{company:{id:'company'},user:{id:'user'}}})}));
vi.mock('@/services/employee-import.service',()=>({employeeImportService:{history:vi.fn()}}));
vi.mock('@/services/import-studio.service',()=>({importStudioService:{scopes:vi.fn()}}));
beforeEach(()=>{vi.clearAllMocks();vi.mocked(studio.scopes).mockResolvedValue([{import_type:'employees',title:'Employee onboarding',operations:['create_only']}]);vi.mocked(service.history).mockImplementation(async params=>({data:[{uuid:'batch',file_name:'team.xlsx',status:'completed',total_rows:24,successful_rows:23,failed_rows:1,form_mode:'detailed'}],page:params.page,hasNext:params.page<2,total:21,lastPage:2}));});afterEach(cleanup);
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><Page/></QueryClientProvider>);return client;}
it('renders the reusable listing and preserves the template-only entry',async()=>{const client=mount();expect(await screen.findByRole('link',{name:'team.xlsx'})).toHaveAttribute('href','/flexi-import/batches/batch');expect(screen.getByRole('link',{name:'Choose template'})).toHaveAttribute('href','/flexi-import/templates');expect(service.history).toHaveBeenCalledWith(expect.objectContaining({import_type:'employees',page:1,per_page:20}),expect.any(AbortSignal));client.clear();});
it('labels page-local search honestly and never sends an unsupported search parameter',async()=>{const client=mount();await screen.findByText('team.xlsx');fireEvent.change(screen.getByRole('textbox',{name:'Search files on this page…'}),{target:{value:'missing'}});expect(screen.getByText('No files match your search on this page.')).toBeInTheDocument();expect(service.history).toHaveBeenCalledTimes(1);client.clear();});
it('requests server pages rather than slicing the current page locally',async()=>{const client=mount();await screen.findByText('team.xlsx');fireEvent.click(screen.getByRole('button',{name:'Next page'}));await waitFor(()=>expect(service.history).toHaveBeenLastCalledWith(expect.objectContaining({page:2}),expect.any(AbortSignal)));client.clear();});
