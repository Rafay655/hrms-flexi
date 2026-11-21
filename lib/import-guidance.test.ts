import {expect,it} from 'vitest';
import {importGuidance} from './import-guidance';
it('keeps uploaded and validating batches out of confirmation',()=>{
 expect(importGuidance('uploaded',0,0).next).toBeUndefined();expect(importGuidance('validating',0,0).next).toBeUndefined();
});
it('distinguishes approval-required work from direct confirmation',()=>{
 expect(importGuidance('validation_complete',0,3,true)).toMatchObject({title:'Approval required',action:'Review & submit'});
 expect(importGuidance('validation_complete',0,3,false)).toMatchObject({title:'Your preview is ready',action:'Continue to confirmation'});
});
it('does not imply that completion means all rows succeeded',()=>{
 expect(importGuidance('completed',2,3).body).toContain('does not mean every row succeeded');
 expect(importGuidance('approved',0,3)).toMatchObject({next:'recovery',action:'Track results'});
});
