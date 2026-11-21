import type {StudioStage} from '@/app/(system)/flexi-import/_components/studio-frame';
export function importGuidance(status:string,invalid:number,valid:number,requiresApproval=false){
 const result=(title:string,body:string,next?:StudioStage,action?:string)=>({title,body,next,action});
 switch(status){
  case 'uploaded':return result('Your file is uploaded','File uploaded. Waiting for the server to start validation.');
  case 'validating':return result('Checking your file','Validation is running. Wait for the row results before confirming an import.');
  case 'validation_complete':if(requiresApproval&&invalid===0)return result('Approval required','Review the spreadsheet, then submit it for approval. Submission freezes the preview; records are not imported before approval.','approval','Review & submit');return result(invalid?`${invalid} rows need attention`:'Your preview is ready',invalid?'Correct the marked rows below. If some rows are valid, you can choose to import only those during confirmation. Nothing is committed yet.':'Review the proposed changes, then continue to confirmation. Nothing is committed yet.',valid>0?'approval':undefined,valid>0?'Continue to confirmation':undefined);
  case 'pending_approval':return result('Waiting for approval','Another eligible approver must review this batch. Uploaded values are frozen.','approval','View approval');
  case 'approved':return result('Approved and queued','Approval is complete. Wait for the import worker to report the actual result.','recovery','Track results');
  case 'processing':return result('Import in progress','Records are being processed. You can leave and reopen this batch to check the result.','recovery','Track results');
  case 'completed':return result('Import finished','Review successful, failed and skipped rows. Completed does not mean every row succeeded.','recovery','View results');
  case 'failed':return result('Import needs attention','Review the server error and affected rows before retrying. Validation corrections and failed-processing retries are separate actions.','recovery','View results');
  case 'rejected':return result('Import was rejected','Read the decision below. A frozen rejected file cannot be rewritten; prepare a corrected import.','recovery','View decision');
  case 'rolled_back':return result('Employee rollback completed','The server recorded the reversal. Reference records created separately remain unchanged.','recovery','View history');
  default:return result('Checking batch status','Refresh to retrieve the current server state.');
 }
}
