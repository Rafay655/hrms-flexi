import {describe,it,expect} from 'vitest';
import {validateChange,profileSections} from './profile-data';
describe('profile correction validation',()=>{
 const phone={key:'phone',label:'Mobile',value:'+923001234567'};
 it('rejects empty, unchanged and invalid phone values',()=>{expect(validateChange(phone,'','Updated number').value).toBeTruthy();expect(validateChange(phone,phone.value,'Updated number').value).toBeTruthy();expect(validateChange(phone,'abc','Updated number').value).toBeTruthy();});
 it('validates emails and reason length',()=>{expect(validateChange({key:'personal_email',label:'Email',value:null},'bad','ok').value).toBeTruthy();expect(validateChange(phone,'+923009876543','x').reason).toBeTruthy();});
 it('accepts valid corrected values',()=>{expect(validateChange(phone,'+923009876543','Changed my number')).toEqual({});});
 it('keeps sensitive identity and bank fields read only',()=>{expect(profileSections.flatMap(section=>section.fields).filter(field=>field.sensitive).every(field=>!field.editable)).toBe(true);});
});
