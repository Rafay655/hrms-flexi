import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {EmployeeUpload} from './employee-upload';
import {employeeImportService} from '@/services/employee-import.service';
import {importStudioService,type SavedImporter} from '@/services/import-studio.service';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock('@/store/hooks',()=>({useAppSelector:(selector:(state:unknown)=>unknown)=>selector({auth:{company:{id:'company'},user:{id:'user'}}})}));
vi.mock('@/services/employee-import.service',()=>({employeeImportService:{upload:vi.fn(),fields:vi.fn()}}));
vi.mock('@/services/import-studio.service',()=>({importStudioService:{upload:vi.fn(),downloadSaved:vi.fn()}}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const saved:SavedImporter={template_uuid:'tpl',version:2,name:'Pinned team',import_type:'employees',operation:'create_or_update',form_mode:'detailed',schema_version:'s1',selected_field_keys:['code'],fields:[{key:'code',label:'Employee Code',type:'text',required:true}],download_available:true};
function mount(template:SavedImporter){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><EmployeeUpload selection={{form_mode:'detailed',required_only:false}} onSelectionChange={vi.fn()} onBack={vi.fn()} savedTemplate={template} savedTemplateName={template.name} /></QueryClientProvider>);return client;}
it('uploads using the selected immutable version without the unpinned employee path',async()=>{
 vi.mocked(importStudioService.upload).mockResolvedValue({uuid:'batch',status:'uploaded'});
 const client=mount(saved);
 expect(screen.getByRole('radio',{name:/Quick onboarding/})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Employee spreadsheet'),{target:{files:[new File(['code\n001'],'team.csv')]}});
 await waitFor(()=>expect(screen.getByRole('button',{name:'Upload & validate'})).toBeEnabled());
 fireEvent.click(screen.getByRole('button',{name:'Upload & validate'}));
 await waitFor(()=>expect(importStudioService.upload).toHaveBeenCalledWith(expect.any(File),'employees','detailed',undefined,expect.any(Function),{template_uuid:'tpl',template_version:2,send_welcome_email:false}));
 expect(employeeImportService.upload).not.toHaveBeenCalled();expect(employeeImportService.fields).not.toHaveBeenCalled();client.clear();
});
it('blocks old saved versions with no field snapshot',()=>{
 const client=mount({...saved,download_available:false,fields:undefined});
 expect(screen.getByRole('alert')).toHaveTextContent('needs to be saved as a new version');
 expect(screen.getByRole('button',{name:'Download XLSX template'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Upload & validate'})).toBeDisabled();client.clear();
});

it('blocks a standard all-fields CSV before sending it as a saved-version upload',async()=>{
 const client=mount(saved);
 fireEvent.change(screen.getByLabelText('Employee spreadsheet'),{target:{files:[new File(['Employee Code,Full Name\n000123,Rafay'],'all.csv')]}});
 await screen.findByText(/does not match saved template version 2/);
 expect(screen.getByRole('button',{name:'Upload & validate'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Use standard import instead'})).toBeEnabled();
 expect(importStudioService.upload).not.toHaveBeenCalled();client.clear();
});
