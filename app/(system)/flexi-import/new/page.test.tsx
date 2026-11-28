import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {render,screen,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import NewImport from './page';
import {importStudioService as service} from '@/services/import-studio.service';
const navigation=vi.hoisted(()=>({params:'',replace:vi.fn(),push:vi.fn()}));
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams(navigation.params),useRouter:()=>({replace:navigation.replace,push:navigation.push})}));
vi.mock('@/store/hooks',()=>({useAppSelector:(select:(state:unknown)=>unknown)=>select({auth:{company:{id:'company'},user:{id:'user'}}})}));
vi.mock('@/services/import-studio.service',()=>({importStudioService:{template:vi.fn()}}));
vi.mock('../_components/employee-upload',()=>({EmployeeUpload:({savedTemplate}:{savedTemplate:{version:number}})=><p>Using saved version {savedTemplate.version}</p>}));
beforeEach(()=>{vi.clearAllMocks();navigation.params='';});afterEach(cleanup);
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={client}><NewImport/></QueryClientProvider>);}
it('redirects standalone imports to the saved template listing without fetching configuration',async()=>{mount();await waitFor(()=>expect(navigation.replace).toHaveBeenCalledWith('/flexi-import/templates'));expect(service.template).not.toHaveBeenCalled();});
it('requires an exact version rather than implicitly using the latest',async()=>{navigation.params='template_uuid=template';mount();await waitFor(()=>expect(navigation.replace).toHaveBeenCalledWith('/flexi-import/templates'));expect(service.template).not.toHaveBeenCalled();});
it('opens only the requested saved template version',async()=>{navigation.params='template_uuid=template&version=2';vi.mocked(service.template).mockResolvedValue({template_uuid:'template',version:2,name:'Team',import_type:'employees',operation:'create_only',form_mode:'detailed',schema_version:'1',selected_field_keys:[]});mount();expect(await screen.findByText('Using saved version 2')).toBeInTheDocument();expect(service.template).toHaveBeenCalledWith('template',expect.any(AbortSignal),2);});
it('does not silently upload with a different server-returned version',async()=>{navigation.params='template_uuid=template&version=2';vi.mocked(service.template).mockResolvedValue({template_uuid:'template',version:3,name:'Team',import_type:'employees',operation:'create_only',form_mode:'detailed',schema_version:'1',selected_field_keys:[]});mount();expect(await screen.findByText('Template version unavailable')).toBeInTheDocument();expect(screen.queryByText('Using saved version 3')).not.toBeInTheDocument();});
