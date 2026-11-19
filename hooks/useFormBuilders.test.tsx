import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,renderHook,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {useFormBuilders} from './useFormBuilders';
import {fetchFormBuilders} from '@/services/form-builder';
vi.mock('@/services/form-builder',()=>({fetchFormBuilders:vi.fn()}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('waits for a selected company before requesting forms',async()=>{
 vi.mocked(fetchFormBuilders).mockResolvedValue({success:true,data:[]} as unknown as Awaited<ReturnType<typeof fetchFormBuilders>>);
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 const wrapper=({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>;
 const {result,rerender}=renderHook(({company_uuid}:{company_uuid:string|undefined})=>useFormBuilders({company_uuid}),{wrapper,initialProps:{company_uuid:undefined as string|undefined}});
 expect(result.current.fetchStatus).toBe('idle');expect(fetchFormBuilders).not.toHaveBeenCalled();
 rerender({company_uuid:'company-uuid'});
 await waitFor(()=>expect(result.current.isSuccess).toBe(true));
 expect(fetchFormBuilders).toHaveBeenCalledExactlyOnceWith({company_uuid:'company-uuid'});
 client.clear();
});
