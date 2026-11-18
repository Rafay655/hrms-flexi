import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {api} from '@/lib/api';
import Page from './page';
vi.mock('@/lib/api',()=>({api:{get:vi.fn()}}));
afterEach(()=>cleanup());
it('renders a dashboard containing id/name relationships without React error 31',async()=>{
 vi.mocked(api.get).mockResolvedValue({data:{success:true,data:{total_imports_month:1,successful_rows_month:2,failed_rows_month:0,pending_approval_count:0,recent_batches:[{uuid:'batch',import_type:{id:1,name:'Employee records'},status:{id:2,name:'Completed'},total_rows:2,successful_rows:2,failed_rows:0,initiated_by:{id:3,name:'Import operator'},created_at:'2026-11-18T10:00:00Z',completed_at:null}]}}});
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
 expect(await screen.findByText('Import operator')).toBeInTheDocument();expect(screen.getByText('Employee records')).toBeInTheDocument();client.clear();
});
