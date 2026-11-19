import {expect,it} from 'vitest';
import {initialBatchStage} from './import-batch-stage';
it('shows failures before processing in review instead of jumping to results',()=>{
 expect(initialBatchStage({status:'failed',processed_rows:0})).toBe('staging');expect(initialBatchStage({status:'failed'})).toBe('staging');
 expect(initialBatchStage({status:'failed',processed_rows:1})).toBe('recovery');
});
it.each(['uploaded','validating','validation_complete'])('keeps %s in the review path',status=>{expect(initialBatchStage({status})).toBe('staging');});
