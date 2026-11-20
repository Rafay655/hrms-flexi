import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {importStudioService} from '@/services/import-studio.service';
import NewImport from './page';
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams('template_uuid=tpl&version=1'),useRouter:()=>({replace:vi.fn()})}));
vi.mock('@/store/hooks',()=>({useAppSelector:(selector:(state:unknown)=>unknown)=>selector({auth:{company:{id:'company'},user:{id:'user'}}})}));
vi.mock('@/services/import-studio.service',()=>({importStudioService:{scopes:vi.fn(),template:vi.fn()}}));
vi.mock('../_components/employee-upload',()=>({EmployeeUpload:({savedTemplate,importType,onBack}:{savedTemplate?:unknown;importType:string;onBack:()=>void})=><div><h2>{savedTemplate?'Pinned':'Standard'} {importType}</h2><button onClick={onBack}>Import types</button></div>}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('does not silently reuse a saved template after returning to standard imports',async()=>{
 vi.mocked(importStudioService.scopes).mockResolvedValue([{import_type:'employees',title:'Employees',operations:['create_or_update']}]);
 vi.mocked(importStudioService.template).mockResolvedValue({template_uuid:'tpl',version:1,import_type:'employees',form_mode:'detailed'} as Awaited<ReturnType<typeof importStudioService.template>>);
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><NewImport /></QueryClientProvider>);
 await screen.findByRole('heading',{name:'Pinned employees'});fireEvent.click(screen.getByRole('button',{name:'Import types'}));
 fireEvent.click(await screen.findByRole('button',{name:/Employees/}));
 expect(screen.getByRole('heading',{name:'Standard employees'})).toBeInTheDocument();client.clear();
});

it('chooses a grouped FlexiMeta destination and passes its exact key to upload',async()=>{
 vi.mocked(importStudioService.scopes).mockResolvedValue([{import_type:'flexi_meta_entities',title:'FlexiMeta',operations:['create_only'],destinations:[{entity:'departments',title:'Departments',group:'Organization',import_type:'flexi_meta_departments',operations:['create_only']}]}]);
 vi.mocked(importStudioService.template).mockResolvedValue({template_uuid:'tpl',version:1,import_type:'flexi_meta_departments',form_mode:'detailed'} as Awaited<ReturnType<typeof importStudioService.template>>);
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><NewImport /></QueryClientProvider>);
 await screen.findByRole('heading',{name:'Pinned flexi_meta_departments'});
 fireEvent.click(screen.getByRole('button',{name:'Import types'}));
 fireEvent.click(await screen.findByRole('button',{name:/FlexiMeta/}));
 expect(screen.getByRole('heading',{name:'Organization'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Departments'}));
 expect(screen.getByRole('heading',{name:'Standard flexi_meta_departments'})).toBeInTheDocument();client.clear();
});
