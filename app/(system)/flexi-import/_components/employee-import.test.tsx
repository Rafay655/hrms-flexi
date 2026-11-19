import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,within,act} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {EmployeeBatchReview} from './employee-batch-review';
import {EmployeeUpload} from './employee-upload';
import {ReferenceGaps} from './reference-gaps';
import {ImportRows} from './import-rows';
import {employeeImportService as service,type EmployeeImportBatch,type GapReport,type ImportSummary} from '@/services/employee-import.service';
const auth=vi.hoisted(()=>({permissions:[] as string[],roles:[] as string[],company:{id:'company'},user:{id:'user'}}));
const push=vi.hoisted(()=>vi.fn());
vi.mock('next/navigation',()=>({useRouter:()=>({push})}));
vi.mock('@/store/hooks',()=>({useAppSelector:(select:(state:{auth:typeof auth})=>unknown)=>select({auth})}));
vi.mock('react-hot-toast',()=>({default:{success:vi.fn(),error:vi.fn(),dismiss:vi.fn()}}));
vi.mock('@/components/ui/searchable-select',()=>({default:({value,options,onChange,allLabel,allowAll=true,disabled,...props}:{value:string;options:{value:string;label:string}[];onChange:(value:string)=>void;allLabel?:string;allowAll?:boolean;disabled?:boolean;'aria-label'?:string})=><select aria-label={props['aria-label']} value={value} disabled={disabled} onChange={event=>onChange(event.target.value)}>{allowAll&&<option value="">{allLabel}</option>}{!allowAll&&!value&&<option value="">Select</option>}{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>}));
vi.mock('@/services/employee-import.service',()=>({employeeImportService:{previewFields:vi.fn(),fields:vi.fn(),template:vi.fn(),upload:vi.fn(),validateMapping:vi.fn(),detail:vi.fn(),status:vi.fn(),gaps:vi.fn(),summary:vi.fn(),rows:vi.fn(),process:vi.fn(),resolve:vi.fn(),revalidate:vi.fn(),rollback:vi.fn(),retryFailed:vi.fn(),approve:vi.fn(),reject:vi.fn()}}));
vi.mock('@/services/flexi-import.service',()=>({flexiImportService:{downloadErrorReport:vi.fn()}}));
let client:QueryClient,batch:EmployeeImportBatch,report:GapReport,summary:ImportSummary;
function mount(node:ReactNode){client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);}
function departmentReport():GapReport{return {status:'validation_complete',has_gaps:true,total_gap_values:1,tables:[{source_key:'departments',source_table:'departments',creatable:false,blocked_reason:'Department needs a Division. Add it in Company → Departments under the correct division, then press Re-check.',warning:null,needs_parent:false,extra_fields:[],values:[{source_key:'departments',field:'Department',value:'Payroll Operations',parent_source_key:'divisions',parent_id:7,parent_label:'Administration',suggestion:null,decision:null}]}]};}
beforeEach(()=>{
 vi.clearAllMocks();auth.permissions=[];auth.roles=[];vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
 batch={uuid:'batch',status:'validation_complete',import_type:'employees',file_name:'employees.xlsx',form_mode:'detailed',total_rows:2,successful_rows:2,failed_rows:0,processed_rows:0,has_gaps:false,requires_approval:false,send_welcome_email:false,workflow:null};
 report={status:'validation_complete',has_gaps:false,total_gap_values:0,tables:[]};summary={status:'validation_complete',total_rows:2,valid_rows:2,invalid_rows:0,new_rows:1,update_rows:1,unchanged_rows:0};
 vi.mocked(service.detail).mockImplementation(async()=>batch);vi.mocked(service.status).mockImplementation(async()=>batch);vi.mocked(service.gaps).mockImplementation(async()=>report);vi.mocked(service.summary).mockImplementation(async()=>summary);
 vi.mocked(service.rows).mockResolvedValue({data:[],page:1,hasNext:false});
 vi.mocked(service.process).mockImplementation(async()=>{batch={...batch,status:'processing'};return null;});
 vi.mocked(service.resolve).mockResolvedValue({created:[],failed:[],decided:1});
 vi.mocked(service.previewFields).mockResolvedValue([{key:'employee_code',label:'Employee ID',required:true,type:'text'}]);
 vi.mocked(service.fields).mockResolvedValue([{key:'employee_code',label:'Employee ID',required:true,type:'text'}]);vi.mocked(service.upload).mockResolvedValue({uuid:'new-batch',status:'uploaded'});
});
afterEach(()=>{cleanup();client.clear();vi.unstubAllGlobals();});
it('uses default-off credentials and explicit process options with a null acknowledgement',async()=>{
 mount(<EmployeeBatchReview uuid="batch" />);fireEvent.click(await screen.findByRole('button',{name:/Approval & commit/}));const button=await screen.findByRole('button',{name:'Review & confirm import'});await waitFor(()=>expect(button).toBeEnabled());
 expect(screen.getByRole('checkbox',{name:/Share welcome credentials/})).not.toBeChecked();fireEvent.click(button);expect(service.process).not.toHaveBeenCalled();fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Confirm import'}));
 await waitFor(()=>expect(service.process).toHaveBeenCalledWith('batch',{import_mode:'skip_errors',send_welcome_email:false,ignore_gaps:false}));
});
it('renders the provided blocked department and parent label without offering create',async()=>{
 report=departmentReport();mount(<ReferenceGaps uuid="batch" report={report} disabled={false} onResolved={vi.fn()} onRefresh={vi.fn()} />);
 expect(screen.getByText(/Department needs a Division/)).toBeInTheDocument();expect(screen.getByText(/Administration/)).toBeInTheDocument();expect(screen.getByRole('link',{name:'Open setup'})).toHaveAttribute('href','/flexi-meta/departments');expect(screen.queryByRole('option',{name:/Create/})).not.toBeInTheDocument();
});
it('permits ignoring gaps only after an explicit skip-affected-rows acknowledgement',async()=>{
 report=departmentReport();batch.has_gaps=true;mount(<EmployeeBatchReview uuid="batch" />);fireEvent.click(await screen.findByRole('button',{name:/Approval & commit/}));const button=await screen.findByRole('button',{name:'Review & confirm import'});expect(button).toBeDisabled();
 fireEvent.click(screen.getByRole('checkbox',{name:/Skip employees with unresolved/}));await waitFor(()=>expect(button).toBeEnabled());fireEvent.click(button);expect(within(screen.getByRole('dialog')).getByText(/This does not import every employee/)).toBeInTheDocument();
});
it('requires all rows valid when the strict policy is selected',async()=>{
 batch.failed_rows=1;summary.invalid_rows=1;mount(<EmployeeBatchReview uuid="batch" />);fireEvent.click(await screen.findByRole('button',{name:/Approval & commit/}));const button=await screen.findByRole('button',{name:'Review & confirm import'});fireEvent.click(screen.getByRole('radio',{name:/Require every row/}));expect(button).toBeDisabled();
});
it('does not offer process or legacy bypasses for a workflow-owned approval batch',async()=>{
 batch.status='pending_approval';batch.requires_approval=true;batch.send_welcome_email=true;batch.workflow={owned:true,owner:'system_flex',state:'running',instance_id:7,task:null,chain:[]};
 mount(<EmployeeBatchReview uuid="batch" />);await screen.findByText('SystemFlex-managed approval');expect(screen.queryByRole('button',{name:'Review & confirm import'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Approve legacy import'})).not.toBeInTheDocument();expect(screen.queryByRole('checkbox',{name:/Share welcome credentials/})).not.toBeInTheDocument();
});
it('keeps partial gap failures visible and never revalidates implicitly',async()=>{
 report=departmentReport();report.tables[0].creatable=true;report.tables[0].blocked_reason=null;report.tables[0].values[0].suggestion={id:23,label:'Payroll'};
 vi.mocked(service.resolve).mockResolvedValue({created:[],decided:0,failed:[{source_key:'departments',value:'Payroll Operations',message:'Parent changed.'}]});
 mount(<ReferenceGaps uuid="batch" report={report} disabled={false} onResolved={vi.fn()} onRefresh={vi.fn()} />);fireEvent.change(screen.getByRole('combobox',{name:'Resolution for Payroll Operations'}),{target:{value:'use_existing'}});fireEvent.click(screen.getByRole('button',{name:'Apply decisions'}));
 await screen.findByText('Payroll Operations: Parent changed.');expect(service.resolve).toHaveBeenCalledWith('batch',[{source_key:'departments',value:'Payroll Operations',parent_id:7,action:'use_existing',existing_id:23}]);expect(service.revalidate).not.toHaveBeenCalled();
});
it('requires explicit confirmation before immediately creating a master record',async()=>{
 report=departmentReport();report.tables[0].creatable=true;report.tables[0].blocked_reason=null;
 mount(<ReferenceGaps uuid="batch" report={report} disabled={false} onResolved={vi.fn()} onRefresh={vi.fn()} />);fireEvent.change(screen.getByRole('combobox',{name:'Resolution for Payroll Operations'}),{target:{value:'create'}});fireEvent.click(screen.getByRole('button',{name:'Apply decisions'}));expect(service.resolve).not.toHaveBeenCalled();fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Create & apply decisions'}));await waitFor(()=>expect(service.resolve).toHaveBeenCalledWith('batch',[{source_key:'departments',value:'Payroll Operations',parent_id:7,action:'create'}]));
});
it('shows server old-to-new differences while preserving text badge ids',async()=>{
 vi.mocked(service.rows).mockResolvedValue({page:1,hasNext:true,data:[{row_number:3,raw_data:{'Employee ID':'EMP-001'},status:'valid',validation_errors:null,processing_error:null,row_action:'update',value_diff:[{key:'device_badge_id',field:'Device Badge ID',old:'000122',new:'000123'}]}]});
 mount(<ImportRows uuid="batch" scope="company" revision={0} />);fireEvent.click(screen.getByRole('tab',{name:'Changes'}));await screen.findByText('000122');expect(screen.getByText('000123')).toBeInTheDocument();expect(screen.getAllByText('Update').length).toBeGreaterThan(0);expect(screen.getByRole('button',{name:'Next page'})).toBeEnabled();
});
it('uploads downloaded templates without asking HR to map keys',async()=>{
 mount(<EmployeeUpload selection={{form_mode:'detailed',required_only:true}} onSelectionChange={vi.fn()} onBack={vi.fn()} />);
 fireEvent.change(screen.getByLabelText('Employee spreadsheet'),{target:{files:[new File(['file'],'employees.xlsx')]}});fireEvent.click(screen.getByRole('checkbox',{name:/Share welcome credentials/}));fireEvent.click(screen.getByRole('button',{name:'Upload & validate'}));
 await waitFor(()=>expect(service.upload).toHaveBeenCalledWith(expect.any(File),'detailed',undefined,true,expect.any(Function)));expect(service.validateMapping).not.toHaveBeenCalled();expect(push).toHaveBeenCalledWith('/flexi-import/batches/new-batch');
});
it('warns before changing a selected form after a file is chosen',()=>{
 const change=vi.fn();mount(<EmployeeUpload selection={{form_mode:'quick',required_only:false}} onSelectionChange={change} onBack={vi.fn()} />);fireEvent.change(screen.getByLabelText('Employee spreadsheet'),{target:{files:[new File(['file'],'employees.xlsx')]}});fireEvent.click(screen.getByRole('radio',{name:/Detailed onboarding/}));expect(change).not.toHaveBeenCalled();fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Return to template selection'}));expect(change).toHaveBeenCalledWith({form_mode:'detailed',required_only:false});
});
it('requires both rollback flags',async()=>{
 batch.status='completed';batch.is_rollbackable=true;batch.rollback_window_open=false;mount(<EmployeeBatchReview uuid="batch" />);await screen.findByRole('heading',{name:'Universal Import Workspace'});expect(screen.queryByRole('button',{name:'Rollback'})).not.toBeInTheDocument();
});
it('preserves confirmation and validation feedback on process failures',async()=>{
 vi.mocked(service.process).mockRejectedValue({response:{status:422,data:{success:false,error:{message:'Invalid rows changed.',field_errors:{import_mode:['Revalidate first.']}}}}});mount(<EmployeeBatchReview uuid="batch" />);fireEvent.click(await screen.findByRole('button',{name:/Approval & commit/}));const button=await screen.findByRole('button',{name:'Review & confirm import'});await waitFor(()=>expect(button).toBeEnabled());fireEvent.click(button);fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Confirm import'}));await within(screen.getByRole('dialog')).findByText('Invalid rows changed.');expect(screen.getByText('Spreadsheet validation workspace')).toBeInTheDocument();
});

it('shows a queued message instead of an endless spinner before validation starts',async()=>{
 batch.status='uploaded';batch.requires_approval=true;
 mount(<EmployeeBatchReview uuid="batch" />);
 await screen.findByText('File uploaded. Waiting for the server to start validation.');
 await waitFor(()=>expect(screen.queryByText('Refreshing status…')).not.toBeInTheDocument());
 expect(screen.queryByText('Checking server progress…')).not.toBeInTheDocument();
 expect(screen.queryByText('Approval is configured for this import')).not.toBeInTheDocument();
});

it('renders a suggestion using its returned name instead of undefined',()=>{
 const raw=departmentReport();raw.tables[0].values[0].suggestion={id:7,name:'Information Technology'} as unknown as NonNullable<typeof raw.tables[0]['values'][0]['suggestion']>;
 mount(<ReferenceGaps uuid="batch" report={raw} disabled={false} onResolved={vi.fn()} onRefresh={vi.fn()} />);
 expect(screen.getByRole('option',{name:'Use existing “Information Technology”'})).toBeInTheDocument();
 expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
});
it('does not offer an existing-reference decision with incomplete suggestion details',()=>{
 const raw=departmentReport();raw.tables[0].values[0].suggestion={id:7} as NonNullable<typeof raw.tables[0]['values'][0]['suggestion']>;
 mount(<ReferenceGaps uuid="batch" report={raw} disabled={false} onResolved={vi.fn()} onRefresh={vi.fn()} />);
 expect(screen.queryByRole('option',{name:/Use existing/})).not.toBeInTheDocument();
 expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
});

it('supports the live banks/divisions/shifts payload without field labels',async()=>{
 const raw:GapReport={batch_uuid:'batch',status:'validation_complete',has_gaps:true,total_gap_values:3,tables:[
  {source_key:'banks',source_table:'banks',creatable:true,blocked_reason:null,warning:null,needs_parent:false,extra_fields:[],values:[{source_key:'banks',source_table:'banks',value:'HBL',parent_source_key:null,parent_id:null,parent_label:null,rows:[1,2],row_count:2,suggestion:null,decision:null}]},
  {source_key:'divisions',source_table:'divisions',creatable:true,blocked_reason:null,warning:null,needs_parent:false,extra_fields:[],values:[{source_key:'divisions',source_table:'divisions',value:'Information Technlogy',parent_source_key:null,parent_id:null,parent_label:null,rows:[1,2],row_count:2,suggestion:{id:8,label:'Information Technology',confidence:98},decision:null}]},
  {source_key:'timesync_shifts',source_table:'timesync_shifts',creatable:false,blocked_reason:'Shift needs timings and working days.',warning:null,needs_parent:false,extra_fields:[],values:[{source_key:'timesync_shifts',source_table:'timesync_shifts',value:'Regular',parent_source_key:null,parent_id:null,parent_label:null,rows:[1,2],row_count:2,suggestion:null,decision:null}]},
 ]};
 mount(<ReferenceGaps uuid="batch" report={raw} disabled={false} onResolved={vi.fn()} onRefresh={vi.fn()} />);
 expect(screen.getByRole('heading',{name:'Banks'})).toBeInTheDocument();expect(screen.getByRole('heading',{name:'Divisions'})).toBeInTheDocument();
 expect(screen.getAllByText('2 affected rows')).toHaveLength(3);expect(screen.getAllByText('Row sample: 1, 2')).toHaveLength(3);
 expect(screen.getByText('98% match')).toBeInTheDocument();expect(screen.getByRole('option',{name:'Create “HBL”'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Open setup'})).toHaveAttribute('href','/time-sync/shift-templates');
 fireEvent.change(screen.getByRole('combobox',{name:'Resolution for Information Technlogy'}),{target:{value:'use_existing'}});
 fireEvent.click(screen.getByRole('button',{name:'Apply decisions'}));
 await waitFor(()=>expect(service.resolve).toHaveBeenCalledWith('batch',[{source_key:'divisions',value:'Information Technlogy',action:'use_existing',existing_id:8}]));
 expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
});

it('queues a retry without reupload and refreshes results when processing finishes',async()=>{
 batch.status='completed';batch.import_mode='skip_errors';batch.failed_rows=1;
 let failed=true;
 vi.mocked(service.rows).mockImplementation(async(_uuid,status)=>({page:1,hasNext:false,data:status==='failed'&&failed?[{row_number:3,status:'failed',raw_data:{'Employee ID':'EMP-001'},processing_error:'Backend error',validation_errors:null,created_record_id:null}]:[]}));
 vi.mocked(service.retryFailed).mockImplementation(async()=>{batch={...batch,status:'validation_complete'};return {batch_uuid:'batch',status:'validation_complete',retry_rows:1};});
 mount(<EmployeeBatchReview uuid="batch" />);
 const retry=await screen.findByRole('button',{name:'Retry failed rows'});await waitFor(()=>expect(retry).toBeEnabled());fireEvent.click(retry);
 expect(within(screen.getByRole('dialog')).getByText(/Deploy the backend fix before retrying/)).toBeInTheDocument();
 fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Queue retry'}));
 await waitFor(()=>expect(service.retryFailed).toHaveBeenCalledWith('batch'));
 await screen.findByText(/Retry is queued or in progress/);
 expect(screen.queryByRole('button',{name:'Retry failed rows'})).not.toBeInTheDocument();expect(service.upload).not.toHaveBeenCalled();expect(service.process).not.toHaveBeenCalled();
 const summaryCalls=vi.mocked(service.summary).mock.calls.length;
 failed=false;batch={...batch,status:'completed',failed_rows:0,successful_rows:2};
 const refresh=screen.getByRole('button',{name:'Refresh'});await waitFor(()=>expect(refresh).toBeEnabled());fireEvent.click(refresh);
 await waitFor(()=>expect(vi.mocked(service.summary).mock.calls.length).toBeGreaterThan(summaryCalls));
 await screen.findByText('The server marked this import completed.');
});
it('refreshes and displays the server conflict when retry is refused',async()=>{
 batch.status='failed';batch.import_mode='skip_errors';batch.failed_rows=1;batch.processed_rows=1;
 vi.mocked(service.rows).mockResolvedValue({page:1,hasNext:false,data:[{row_number:3,status:'failed',raw_data:null,processing_error:'Backend error',validation_errors:null}]});
 vi.mocked(service.retryFailed).mockRejectedValue({response:{status:409,data:{success:false,message:'Retry is already in progress.'}}});
 mount(<EmployeeBatchReview uuid="batch" />);const retry=await screen.findByRole('button',{name:'Retry failed rows'});await waitFor(()=>expect(retry).toBeEnabled());fireEvent.click(retry);
 const calls=vi.mocked(service.status).mock.calls.length;fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Queue retry'}));
 await waitFor(()=>expect(screen.getAllByText('Retry is already in progress.').length).toBeGreaterThan(0));
 await waitFor(()=>expect(vi.mocked(service.status).mock.calls.length).toBeGreaterThan(calls));
});

it('switches the four-stage prototype workspace without changing batch data',async()=>{
 mount(<EmployeeBatchReview uuid="batch" />);
 const staging=await screen.findByRole('heading',{name:/Spreadsheet validation workspace/});
 await waitFor(()=>expect(staging).toBeVisible());
 fireEvent.click(screen.getByRole('button',{name:/Approval & commit/}));
 expect(staging).not.toBeVisible();
 await waitFor(()=>expect(screen.getByRole('heading',{name:/Review, approval and commit/})).toBeVisible());
 fireEvent.click(screen.getByRole('button',{name:/Results & history/}));
 await waitFor(()=>expect(screen.getByRole('heading',{name:/Audit and recovery/})).toBeVisible());
 expect(service.process).not.toHaveBeenCalled();expect(service.rollback).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:/Review & corrections/}));
 await waitFor(()=>expect(staging).toBeVisible());
});

it('never exposes manual processing overrides for loan imports',async()=>{
 batch.import_type='loan_opening_balances';batch.requires_approval=false;batch.can_edit_preview=true;
 mount(<EmployeeBatchReview uuid="batch" />);
 fireEvent.click(await screen.findByRole('button',{name:/Approval & commit/}));
 expect(screen.getByText(/Loan opening balances require all-or-nothing/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Review & confirm import'})).not.toBeInTheDocument();
 expect(screen.queryByRole('radio',{name:/Save valid rows only/})).not.toBeInTheDocument();
 expect(service.process).not.toHaveBeenCalled();
});
it('does not offer generic financial rollback even if obsolete eligibility flags are present',async()=>{
 batch.import_type='expense_claims';batch.status='completed';batch.is_rollbackable=true;batch.rollback_window_open=true;
 mount(<EmployeeBatchReview uuid="batch" />);
 await screen.findByRole('heading',{name:'Universal Import Workspace'});
 expect(screen.queryByRole('button',{name:'Rollback'})).not.toBeInTheDocument();
});

it('refreshes workflow detail when polling moves an uploaded batch to pending approval',async()=>{
 let server={...batch,status:'uploaded',requires_approval:true,workflow:null as EmployeeImportBatch['workflow']};
 vi.mocked(service.status).mockImplementation(async()=>({...server}));
 vi.mocked(service.detail).mockImplementation(async()=>({...server}));
 mount(<EmployeeBatchReview uuid="batch" />);
 await screen.findByText('File uploaded. Waiting for the server to start validation.');
 await waitFor(()=>expect(service.detail).toHaveBeenCalledTimes(1));
 server={...server,status:'pending_approval',workflow:{owned:true,owner:'system_flex',task:null,chain:[]}};
 await act(async()=>{await client.refetchQueries({queryKey:['employee-import','company:user','batch','status']});});
 await screen.findByText('SystemFlex-managed approval');
 expect(vi.mocked(service.detail).mock.calls.length).toBeGreaterThan(1);
});
it('refreshes existing preview rows on an external approved-to-completed transition',async()=>{
 let server={...batch,status:'approved'};
 vi.mocked(service.status).mockImplementation(async()=>({...server}));vi.mocked(service.detail).mockImplementation(async()=>({...server}));
 vi.mocked(service.rows).mockImplementation(async()=>({data:[{row_number:3,raw_data:{'Employee ID':'000123'},status:server.status==='completed'?'committed':'valid',validation_errors:[],processing_error:null}],page:1,hasNext:false}));
 mount(<EmployeeBatchReview uuid="batch" />);await screen.findByRole('heading',{name:'Universal Import Workspace'});
 await waitFor(()=>expect(service.rows).toHaveBeenCalled());
 server={...server,status:'completed'};
 await act(async()=>{await client.refetchQueries({queryKey:['employee-import','company:user','batch','status']});});
 await waitFor(()=>expect(client.getQueryData<{data:{status:string}[]}>(['employee-import','company:user','batch','rows',0,'',1])?.data[0].status).toBe('committed'));
});

it('shows saved-template validation failures in review and retains the correction upload context',async()=>{
 batch.status='failed';batch.template_uuid='saved-template';batch.template_version=2;batch.processed_rows=0;batch.validation_errors=[{row:0,field:'file',message:'The file columns must match the selected template version.'}];summary.invalid_rows=1;summary.valid_rows=0;
 mount(<EmployeeBatchReview uuid="batch" />);
 await screen.findByText('File: The file columns must match the selected template version.');
 expect(screen.getByRole('button',{name:/Review & corrections/})).toHaveAttribute('aria-current','step');
 expect(screen.getByRole('link',{name:'Upload a corrected file'})).toHaveAttribute('href','/flexi-import/new?template_uuid=saved-template&version=2');
 expect(screen.getByRole('heading',{name:/Spreadsheet validation workspace/})).toBeInTheDocument();
 expect(service.process).not.toHaveBeenCalled();
});
