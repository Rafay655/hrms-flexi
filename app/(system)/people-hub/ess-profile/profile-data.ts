export type ProfileField = {key:string;label:string;value:string|null;sensitive?:boolean;editable?:boolean};
export type ProfileSection = {id:string;title:string;description:string;fields:ProfileField[]};
export const profileSections:ProfileSection[]=[
 {id:'personal',title:'Personal details',description:'Your identity and personal information.',fields:[{key:'date_of_birth',label:'Date of birth',value:'1997-08-12'},{key:'gender',label:'Gender',value:'Male'},{key:'marital_status',label:'Marital status',value:'Single'},{key:'nationality',label:'Nationality',value:'Pakistani'},{key:'cnic',label:'CNIC',value:'35202-0000000-0',sensitive:true},{key:'blood_group',label:'Blood group',value:'B+'}]},
 {id:'contact',title:'Contact & emergency',description:'Keep your contact information up to date.',fields:[{key:'personal_email',label:'Personal email',value:'rafay@example.com',editable:true},{key:'phone',label:'Mobile number',value:'+923001234567',editable:true},{key:'current_address',label:'Current address',value:'Lahore, Punjab, Pakistan',editable:true},{key:'permanent_address',label:'Permanent address',value:'Lahore, Punjab, Pakistan',editable:true},{key:'emergency_contact_name',label:'Emergency contact',value:'Ahmed',editable:true},{key:'emergency_contact_relationship',label:'Relationship',value:'Brother',editable:true},{key:'emergency_contact_number',label:'Emergency phone',value:null,editable:true}]},
 {id:'employment',title:'Employment',description:'Managed by HR through People Hub and company settings.',fields:[{key:'employee_code',label:'Employee code',value:'FLEXI-IT-0009'},{key:'designation',label:'Designation',value:'Software Engineer'},{key:'department',label:'Department',value:'Software Development'},{key:'division',label:'Division',value:'Technology'},{key:'branch',label:'Branch',value:'Lahore head office'},{key:'reporting_manager',label:'Reporting manager',value:'Muhammad Yousaf'},{key:'employment_type',label:'Employment type',value:'Permanent'},{key:'joining_date',label:'Joining date',value:'2025-01-06'},{key:'grade_band',label:'Grade band',value:'G-4'},{key:'shift',label:'Shift',value:'Regular shift · 09:30–18:30'}]},
 {id:'bank',title:'Bank details',description:'Payment details are managed by HR. Request a correction when needed.',fields:[{key:'bank_name',label:'Bank',value:'HBL'},{key:'account_title',label:'Account title',value:'Abdul Rafay'},{key:'account_number',label:'Account number',value:'00001234567890',sensitive:true},{key:'iban',label:'IBAN',value:'PK00HABB0000000000000000',sensitive:true}]}
];
export const profileDocuments=[{id:'cnic-front',name:'CNIC front',category:'Identity',status:'Verified',uploaded:'2026-10-14'},{id:'cnic-back',name:'CNIC back',category:'Identity',status:'Missing',uploaded:null},{id:'contract',name:'Employment contract',category:'Employment',status:'Verified',uploaded:'2025-01-06'},{id:'qualification',name:'Degree certificate',category:'Education',status:'Under review',uploaded:'2026-10-15'}];
export function validateChange(field:ProfileField,value:string,reason:string){
 const errors:{value?:string;reason?:string}={};const next=value.trim();
 if(!next)errors.value='Enter a new value.';
 else if(next===field.value)errors.value='Enter a different value.';
 else if(next.length>500)errors.value='Use 500 characters or fewer.';
 else if(field.key.includes('email')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next))errors.value='Enter a valid email address.';
 else if((field.key==='phone'||field.key==='emergency_contact_number')&&!/^\+?[0-9 ()-]{7,25}$/.test(next))errors.value='Enter a valid phone number.';
 if(reason.trim().length<3||reason.trim().length>1000)errors.reason='Enter a reason between 3 and 1,000 characters.';
 return errors;
}
