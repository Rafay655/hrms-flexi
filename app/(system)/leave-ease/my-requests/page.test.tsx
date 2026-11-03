import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within, fireEvent, cleanup, waitFor } from '@testing-library/react';
import Page from './page';
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams()}));
import { LeaveRequestEditor } from './components/request-editor';
import { leaveRequestService as service } from '@/services/leave-request.service';
import type { LeaveRequest, LeaveRequestList } from '@/types/leave-request';
vi.mock('@/store/hooks',()=>({useAppSelector:(select:(state:unknown)=>unknown)=>select({auth:{company:{id:'company',timezone:'Asia/Karachi'},user:{id:'user',roles:[],permissions:[],user_type:'employee'},permissions:[]}})}));
vi.mock('@/services/leave-request.service',()=>({leaveRequestValues:(value:unknown)=>value,leaveRequestService:{getAll:vi.fn(),getPending:vi.fn(),getById:vi.fn(),getApproverDetail:vi.fn(),options:vi.fn(),lookupBalances:vi.fn(),balances:vi.fn(),preview:vi.fn(),draft:vi.fn(),capabilities:vi.fn(),nominees:vi.fn(),create:vi.fn(),update:vi.fn(),action:vi.fn()}}));
vi.mock('@/hooks/useLeaveTypes',()=>({useLeaveTypes:()=>({data:{data:{data:[{uuid:'type-uuid',id:'type-uuid',name:'Annual leave',code:'AL'}]}},isLoading:false,isError:false})}));
vi.mock('@/components/ui/searchable-select',()=>({default:(props:{id?:string;'aria-label'?:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void;allowAll?:boolean;allLabel?:string;disabled?:boolean})=><select id={props.id} aria-label={props['aria-label']} value={props.value} disabled={props.disabled} onChange={e=>props.onChange(e.target.value)}><option value="">{props.allLabel||'Select'}</option>{props.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>}));
const row={uuid:'request-uuid',id:'request-uuid',company_id:1,employee_id:23,employee_name:'Example Employee',leave_type:{uuid:'type-uuid',id:'type-uuid',name:'Annual leave',code:'AL',is_paid:true},from_date:'2026-11-10',to_date:'2026-11-11',total_days:2,total_days_decimal:'2.00',is_half_day:false,half_day_session:null,reason:'Family time',status:'pending',row_version:0,revision:0,requires_correction:false,can_resubmit:false,attachment_path:null} as LeaveRequest;
const list:LeaveRequestList={success:true,message:'OK',data:{data:[row],meta:{current_page:1,last_page:1,per_page:10,total:1,from:1,to:1}}};
let client:QueryClient;
function mount(){client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);}
beforeEach(()=>{vi.stubGlobal('ResizeObserver',class {observe(){} unobserve(){} disconnect(){}});vi.clearAllMocks();vi.mocked(service.getAll).mockResolvedValue(list);vi.mocked(service.getPending).mockResolvedValue({...list,data:{...list.data,data:[{...row,employee_name:'Pending Employee'}]}});vi.mocked(service.nominees).mockResolvedValue([{id:'nominee-employee',employee_code:'EMP-2',name:'Nominee Name',user_id:'nominee-user'}]);vi.mocked(service.create).mockResolvedValue(row);vi.mocked(service.options).mockResolvedValue({employee:{id:'self-uuid',name:'Applicant'},leave_types:[{id:'type-uuid',name:'Annual leave',code:'AL',is_paid:true,request_unit:'days',allow_half_day:true}],half_day_sessions:['morning','afternoon'],can_nominate_approver:true});vi.mocked(service.lookupBalances).mockResolvedValue([{id:'type-uuid',remaining:9}]);vi.mocked(service.balances).mockResolvedValue({items:[]});vi.mocked(service.preview).mockResolvedValue({request_unit:'days',total_days:2,valid:true});vi.mocked(service.capabilities).mockResolvedValue({is_temporary_approver:false,can_approve_team_leave:false,can_approve_team_regularization:false,can_approve_team_shift_swap:false});vi.mocked(service.getById).mockResolvedValue(row);});
afterEach(()=>{cleanup();client.clear();vi.unstubAllGlobals();});
it('uses the Regularizations tab wording and bottom navigation, and loads pending approvals for Team Requests',async()=>{
 mount();await screen.findByText('Family time');expect(screen.getByRole('tab',{name:'My Requests'})).toHaveAttribute('aria-selected','true');expect(screen.getByRole('navigation',{name:'Leave request pagination'})).toBeVisible();fireEvent.click(screen.getByRole('tab',{name:'Team Requests'}));await screen.findByText('Pending Employee');expect(service.getPending).toHaveBeenCalled();expect(screen.queryByText('Return for correction')).not.toBeInTheDocument();
});
it('creates a request with nominee employee UUID and no manual employee selection',async()=>{
 mount();await screen.findByText('Family time');fireEvent.click(screen.getByRole('button',{name:'Create request'}));const dialog=await screen.findByRole('dialog');fireEvent.change(within(dialog).getByLabelText('Leave type *'),{target:{value:'type-uuid'}});await waitFor(()=>expect(within(dialog).getByRole('option',{name:'Nominee Name (EMP-2)'})).toBeInTheDocument());
 fireEvent.change(within(dialog).getByLabelText('Leave type *'),{target:{value:'type-uuid'}});fireEvent.change(within(dialog).getByLabelText('Start date *'),{target:{value:'2099-11-10'}});fireEvent.change(within(dialog).getByLabelText('End date *'),{target:{value:'2099-11-11'}});fireEvent.change(within(dialog).getByLabelText('Approval nominee'),{target:{value:'nominee-employee'}});fireEvent.click(within(dialog).getByRole('button',{name:'Preview'}));await within(dialog).findByText('Request preview');await waitFor(()=>expect(within(dialog).getByRole('button',{name:'Submit application'})).toBeEnabled());fireEvent.click(within(dialog).getByRole('button',{name:'Submit application'}));
 await waitFor(()=>expect(service.create).toHaveBeenCalledWith(expect.objectContaining({nominee_employee_id:'nominee-employee',leave_type_id:'type-uuid'}),expect.any(String)));expect(vi.mocked(service.create).mock.calls[0][0]).not.toHaveProperty('employee_id');
});

it('blocks editing when the fresh record is no longer editable',async()=>{
 vi.mocked(service.getById).mockResolvedValue({...row,status:'approved'});
 client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 render(<QueryClientProvider client={client}><LeaveRequestEditor item={row} onClose={()=>{}} onChanged={()=>{}} /></QueryClientProvider>);
 await screen.findByText(/cannot be edited/);
 expect(screen.queryByRole('button',{name:'Save changes'})).not.toBeInTheDocument();
 expect(service.update).not.toHaveBeenCalled();
});
