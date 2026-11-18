import {expect,it} from 'vitest';
import {normalizeImportDashboard} from './flexi-import-dashboard';
it('normalizes relationship objects before React receives dashboard fields',()=>{
 const data=normalizeImportDashboard({recent_batches:[{uuid:'batch',import_type:{id:1,name:'Employee Import'},status:{id:2,name:'Completed'},initiated_by:{id:3,name:'Operator'},total_rows:'4',created_at:'2026-11-18'}]});
 expect(data.recent_batches[0]).toMatchObject({import_type:'Employee Import',status:'completed',initiated_by:'Operator',total_rows:4});
});
it('handles missing and nullable actors without object children',()=>{
 const data=normalizeImportDashboard({recent_batches:[{uuid:'a',initiated_by:null},{uuid:'b',initiated_by:{id:1}},{uuid:'c',initiated_by:'Operator'}]});
 expect(data.recent_batches.map(row=>row.initiated_by)).toEqual([null,null,'Operator']);
});
it('keeps numeric counters safe and supports numeric strings',()=>{
 expect(normalizeImportDashboard({total_imports_month:'3',successful_rows_month:null,failed_rows_month:NaN,pending_approval_count:2})).toMatchObject({total_imports_month:3,successful_rows_month:0,failed_rows_month:0,pending_approval_count:2});
});
