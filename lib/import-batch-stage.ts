import type {EmployeeImportBatch} from '@/services/employee-import.service';
import type {StudioStage} from '@/app/(system)/flexi-import/_components/studio-frame';
export function initialBatchStage(batch:Pick<EmployeeImportBatch,'status'|'processed_rows'>):StudioStage{
 if(batch.status==='failed'&&!(Number(batch.processed_rows)>0))return 'staging';
 if(['completed','failed','rejected','rolled_back','approved','processing'].includes(batch.status))return 'recovery';
 if(batch.status==='pending_approval')return 'approval';
 return 'staging';
}
