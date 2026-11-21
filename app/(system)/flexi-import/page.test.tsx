import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,cleanup,fireEvent,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {api} from '@/lib/api';
import type {ImportDashboardData} from '@/types/import-dashboard';
import Page from './page';
vi.mock('@/lib/api',()=>({api:{get:vi.fn()}}));
vi.mock('@/store/hooks',()=>({useAppSelector:(selector:(state:unknown)=>unknown)=>selector({auth:{company:{id:'company'},user:{id:'user'}}})}));
const clients:QueryClient[]=[];
afterEach(()=>{cleanup();clients.forEach(client=>client.clear());clients.length=0;vi.resetAllMocks();});
function data():ImportDashboardData{return {month:'2026-11',month_label:'November 2026',timezone:'Asia/Karachi',snapshot_at:'2026-11-20T17:12:10+05:00',is_current_month:true,kpi:{batches_created:9,successful_rows:2,failed_processing_rows:0,processed_rows:2,pending_approvals:0,saved_templates:2},status_total:9,status_breakdown:[{status:'completed',label:'Completed',count:2}],trend:[],scope_breakdown:[],row_outcomes:{successful:2,failed:0,skipped:0,total:2},needs_attention:[],template_library:{total:2,ready:2,needs_revision:0},active_batches:[],recent_batches:[{uuid:'actual-batch',file_name:'departments.xlsx',import_type:'flexi_meta_departments',import_type_label:'FlexiMeta · Departments',status:'completed',total_rows:1,processed_rows:1,successful_rows:1,failed_rows:0,skipped_rows:0,initiated_by:{id:'actor',name:'Import operator'},created_at:'2026-11-20T16:07:06+05:00'}]};}
function open(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});clients.push(client);return render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);}
it('loads the API using the server default month and renders real batch links',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:data()}});open();
 expect(await screen.findByText('Import operator')).toBeInTheDocument();
 expect(api.get).toHaveBeenCalledWith('/flexi-import/dashboard',{params:undefined,signal:expect.any(AbortSignal)});
 expect(screen.getByRole('link',{name:'departments.xlsx'})).toHaveAttribute('href','/flexi-import/batches/actual-batch');
 expect(screen.queryByText('Demo data')).not.toBeInTheDocument();
 expect(screen.getByText('No imports are currently processing.')).toBeInTheDocument();
 fireEvent.change(screen.getByRole('textbox',{name:'Search recent imports'}),{target:{value:'unmatched-file'}});
 expect(screen.getByText('No imports match your filters.')).toBeInTheDocument();
});
it('handles empty months and hides access-controlled null sections',async()=>{
 const empty=data();empty.kpi.pending_approvals=null;empty.kpi.saved_templates=null;empty.template_library=null;empty.recent_batches=[];empty.status_total=0;empty.status_breakdown=[];
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:empty}});open();
 expect(await screen.findByText('No imports in this month.')).toBeInTheDocument();
 expect(screen.queryByText('Pending approvals')).not.toBeInTheDocument();
 expect(screen.queryByRole('heading',{name:'Template library'})).not.toBeInTheDocument();
});
it('shows an API failure and lets the user retry without sample fallback',async()=>{
 vi.mocked(api.get).mockRejectedValueOnce(new Error('Dashboard unavailable')).mockResolvedValue({data:{success:true,data:data()}});open();
 await screen.findByRole('alert');
 fireEvent.click(screen.getByRole('button',{name:/retry|try again/i}));
 await waitFor(()=>expect(screen.getByText('Import operator')).toBeInTheDocument());
});
