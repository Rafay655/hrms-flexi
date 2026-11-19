import {expect,it} from 'vitest';
import {conditionValue,visibleFieldKeys,createsVisibilityCycle,type ConditionalField} from './onboarding-visibility';
const fields:ConditionalField[]=[{system_key:'marital',type:'select'},{system_key:'spouse',type:'text',visibility_condition:{field_key:'marital',values:['42']}},{system_key:'children',type:'toggle',visibility_condition:{field_key:'marital',values:['42']}},{system_key:'child_name',type:'text',visibility_condition:{field_key:'children',values:['1']}}];
it('matches exact trimmed IDs, object values before IDs and boolean toggles',()=>{
 expect(conditionValue({value:' 42 ',id:9})).toBe('42');expect(conditionValue(false)).toBe('0');
 expect(visibleFieldKeys(fields,{marital:{value:42,id:99},children:true},'detailed')).toEqual(new Set(['marital','spouse','children','child_name']));
 expect(visibleFieldKeys(fields,{marital:'042',children:true},'detailed')).toEqual(new Set(['marital']));
});
it('hides descendants when a parent is hidden by mode or condition',()=>{
 expect(visibleFieldKeys([{...fields[0],show_in_quick:false},...fields.slice(1)],{marital:42,children:true},'quick').size).toBe(0);
 expect(visibleFieldKeys(fields,{marital:1,children:true},'detailed')).toEqual(new Set(['marital']));
});
it('rejects cycles, missing parents and unsupported parent types',()=>{
 expect(createsVisibilityCycle(fields,'marital','child_name')).toBe(true);
 expect(createsVisibilityCycle(fields,'spouse','marital')).toBe(false);
 expect(visibleFieldKeys([{system_key:'a',type:'toggle',visibility_condition:{field_key:'b',values:['1']}},{system_key:'b',type:'toggle',visibility_condition:{field_key:'a',values:['1']}}],{a:'1',b:'1'},'detailed').size).toBe(0);
 expect(visibleFieldKeys([{system_key:'x',type:'text',visibility_condition:{field_key:'missing',values:['1']}}],{},'detailed').size).toBe(0);
});
it('accepts OR choices and never conditions a core or login email field',()=>{
 expect(visibleFieldKeys([{system_key:'p',type:'radio'},{system_key:'x',type:'text',visibility_condition:{field_key:'p',values:['a','b']}}],{p:'b'},'quick').has('x')).toBe(true);
 expect(visibleFieldKeys([{system_key:'email',type:'email',is_login_email:true,visibility_condition:{field_key:'missing',values:['1']}}],{},'quick').has('email')).toBe(true);
});
