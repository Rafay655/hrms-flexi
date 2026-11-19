import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {importStudioService as service} from '@/services/import-studio.service';
import TemplateDesigner from './page';
const push=vi.hoisted(()=>vi.fn());
let queryString='';
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams(queryString),useRouter:()=>({push})}));
vi.mock('@/services/import-studio.service',()=>({importStudioService:{scopes:vi.fn(),schema:vi.fn(),save:vi.fn(),template:vi.fn(),downloadSaved:vi.fn()}}));
vi.mock('@/store/hooks',()=>({useAppSelector:(selector:(state:unknown)=>unknown)=>selector({auth:{company:{id:'company'},user:{id:'user'}}})}));
vi.mock('@/lib/employee-import',()=>({downloadImportFile:vi.fn()}));
afterEach(()=>{cleanup();vi.clearAllMocks();queryString='';});
it('saves a real schema-backed selection with required fields locked',async()=>{
 vi.mocked(service.scopes).mockResolvedValue([{import_type:'employees',title:'Employee onboarding',operations:['create_or_update']}]);
 vi.mocked(service.schema).mockResolvedValue({import_type:'employees',schema_version:'schema-1',fields:[{key:'random-key-1',label:'Employee Code',type:'text',required:true},{key:'random-key-2',label:'Notes',type:'text',required:false}]});
 vi.mocked(service.save).mockResolvedValue({template_uuid:'template',version:1} as Awaited<ReturnType<typeof service.save>>);
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><TemplateDesigner /></QueryClientProvider>);
 expect(await screen.findByRole('checkbox',{name:'Select Employee Code'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Template name'),{target:{value:'Team template'}});fireEvent.click(screen.getByRole('checkbox',{name:'Select Notes'}));
 fireEvent.click(screen.getByRole('button',{name:'Save template'}));
 await waitFor(()=>expect(service.save).toHaveBeenCalledWith({name:'Team template',import_type:'employees',operation:'create_or_update',form_mode:'detailed',schema_version:'schema-1',selected_field_keys:['random-key-1']}));
 await waitFor(()=>expect(push).toHaveBeenCalledWith('/flexi-import/templates'));
 expect(screen.getByRole('button',{name:/Export selected fields/})).toBeDisabled();client.clear();
});

it('enables exact-version export for a saved field snapshot',async()=>{
 queryString='template_uuid=template&version=1';
 vi.mocked(service.template).mockResolvedValue({template_uuid:'template',version:1,name:'Saved team',import_type:'employees',operation:'create_or_update',form_mode:'detailed',schema_version:'s1',selected_field_keys:['code'],fields:[{key:'code',label:'Code',type:'text',required:true}],download_available:true});
 vi.mocked(service.scopes).mockResolvedValue([{import_type:'employees',title:'Employees',operations:['create_or_update']}]);
 vi.mocked(service.schema).mockResolvedValue({import_type:'employees',schema_version:'s1',fields:[{key:'code',label:'Code',type:'text',required:true}]});
 vi.mocked(service.downloadSaved).mockResolvedValue({blob:new Blob(['PK']),filename:'saved.xlsx'});
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><TemplateDesigner /></QueryClientProvider>);
 const button=await screen.findByRole('button',{name:'Export selected fields'});expect(button).toBeEnabled();fireEvent.click(button);
 await waitFor(()=>expect(service.downloadSaved).toHaveBeenCalledWith('template',1));
 expect(service.template).toHaveBeenCalledWith('template',expect.any(AbortSignal),1);client.clear();
});
