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

it('keeps a seventy-field schema searchable without dropping hidden selections',async()=>{
 const fields=Array.from({length:70},(_,index)=>({key:`field-${index}`,label:`Profile Field ${index+1}`,type:'text',required:index===0}));
 vi.mocked(service.scopes).mockResolvedValue([{import_type:'employees',title:'Employees',operations:['create_or_update']}]);
 vi.mocked(service.schema).mockResolvedValue({import_type:'employees',schema_version:'s70',fields});
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});const view=render(<QueryClientProvider client={client}><TemplateDesigner/></QueryClientProvider>);
 await screen.findByRole('checkbox',{name:'Select Profile Field 70'});
 expect(screen.getByText('70 / 70 selected')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Search field labels'),{target:{value:'Field 70'}});
 expect(screen.getAllByRole('checkbox')).toHaveLength(1);expect(screen.getByText('70 / 70 selected')).toBeInTheDocument();
 expect(view.container.querySelector('.overscroll-contain')?.className).toContain('46vh');
 fireEvent.click(screen.getByRole('button',{name:'Required only'}));expect(screen.getByText('1 / 70 selected')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear field search'}));expect(screen.getByRole('checkbox',{name:'Select Profile Field 1'})).toBeDisabled();client.clear();
});

it('provides drag handles for selected columns, including required ones',async()=>{
 vi.mocked(service.scopes).mockResolvedValue([{import_type:'employees',title:'Employees',operations:['create_or_update']}]);
 vi.mocked(service.schema).mockResolvedValue({import_type:'employees',schema_version:'drag',fields:[{key:'code',label:'Employee Code',type:'text',required:true},{key:'notes',label:'Notes',type:'text',required:false}]});
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><TemplateDesigner/></QueryClientProvider>);
 expect(await screen.findByRole('button',{name:'Reorder Employee Code'})).toBeEnabled();expect(screen.getByRole('button',{name:'Reorder Notes'})).toBeEnabled();
 expect(screen.queryByRole('button',{name:'Move Notes up'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('checkbox',{name:'Select Notes'}));expect(screen.queryByRole('button',{name:'Reorder Notes'})).not.toBeInTheDocument();expect(screen.getByRole('checkbox',{name:'Select Employee Code'})).toBeDisabled();client.clear();
});
