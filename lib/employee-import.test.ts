import {expect,it} from 'vitest';
import {canConfirmImport,gapIdentity,gapSetupPath,importPollInterval,displayImportValue,observeImportProgress,importWaitingMessage,normalizeGapSuggestion} from './employee-import';
import type {GapReport} from '@/services/employee-import.service';
const gaps:GapReport={status:'validation_complete',has_gaps:false,total_gap_values:0,tables:[]};
it('requires ready validation and never processes an approval-bound batch',()=>{
 expect(canConfirmImport({status:'validation_complete'},undefined)).toBe(false);
 expect(canConfirmImport({status:'validation_complete'},gaps)).toBe(true);
 expect(canConfirmImport({status:'validation_complete',requires_approval:true},gaps)).toBe(false);
 expect(canConfirmImport({status:'pending_approval'},gaps)).toBe(false);
 expect(canConfirmImport({status:'validation_complete',confirmed_at:'now'},gaps)).toBe(false);
});
it('allows skipping gap-invalid rows only after explicit skip-errors opt-in',()=>{
 const batch={status:'validation_complete',has_gaps:true};
 expect(canConfirmImport(batch,{...gaps,has_gaps:true})).toBe(false);
 expect(canConfirmImport(batch,{...gaps,has_gaps:true},{import_mode:'skip_errors',send_welcome_email:false,ignore_gaps:true})).toBe(true);
 expect(canConfirmImport(batch,{...gaps,has_gaps:true},{import_mode:'all_or_nothing',send_welcome_email:false,ignore_gaps:true})).toBe(false);
});
it('distinguishes identical names under different parents',()=>{
 expect(gapIdentity({source_key:'departments',parent_id:7,value:'Payroll'})).not.toBe(gapIdentity({source_key:'departments',parent_id:8,value:'Payroll'}));
});
it('backs off failed polls and stops permanent or terminal states',()=>{
 expect(importPollInterval('uploaded',null,0)).toBe(3000);expect(importPollInterval('pending_approval',null,0)).toBe(3000);expect(importPollInterval('completed',null,0)).toBe(false);
 expect(importPollInterval('uploaded',new Error('Offline'),1)).toBe(6000);
 expect(importPollInterval('uploaded',new Error('Offline'),5)).toBe(30000);
 expect(importPollInterval('uploaded',{response:{status:403}},1)).toBe(false);
 expect(importPollInterval('completed',null,0,true)).toBe(3000);
});
it('preserves text identifiers and routes blocked sources to setup',()=>{
 expect(displayImportValue('000123')).toBe('000123');expect(displayImportValue({label:'Administration'})).toBe('Administration');expect(gapSetupPath({source_key:'departments'})).toBe('/flexi-meta/departments');expect(gapSetupPath({source_key:'timesync_shifts'})).toBe('/time-sync/shift-templates');
});

it('slows unchanged uploaded polling and resets observation when progress changes',()=>{
 let snapshot=observeImportProgress(undefined,{uuid:'batch',status:'uploaded'});
 for(let i=0;i<20;i++)snapshot=observeImportProgress(snapshot,{uuid:'batch',status:'uploaded'});
 expect(importPollInterval('uploaded',null,0,false,snapshot.unchangedChecks)).toBe(10000);
 expect(importWaitingMessage('uploaded',snapshot.unchangedChecks)).toContain('imports queue worker');
 expect(observeImportProgress(snapshot,{uuid:'batch',status:'validating'}).unchangedChecks).toBe(0);
});

it('normalizes actual suggestion names without inventing labels or ids',()=>{
 expect(normalizeGapSuggestion({id:7,name:'Information Technology'})).toEqual({id:7,label:'Information Technology'});
 expect(normalizeGapSuggestion({id:'8',value:'Payroll'})).toEqual({id:8,label:'Payroll'});
 expect(normalizeGapSuggestion({existing_id:9,label:'HBL'})).toEqual({id:9,label:'HBL'});
 expect(normalizeGapSuggestion({id:7})).toBeNull();
 expect(normalizeGapSuggestion({name:'No id'})).toBeNull();
 expect(normalizeGapSuggestion({id:7,label:'undefined'})).toBeNull();
});
