import {api} from '@/lib/api';
import type {EssProfile,EssRequest,EssDocument,EssList} from '@/types/ess-profile';
const BASE='/people-hub/ess/profile';
function checked<T>(body:{success?:boolean;data:T}):T{if(body.success===false)throw body;return body.data;}
function list<T>(body:{success?:boolean;data:T[]|{data:T[];meta?:EssList<T>['meta']};meta?:EssList<T>['meta']}):EssList<T>{const data=checked(body);const rows=Array.isArray(data)?data:data.data;const meta=body.meta??(!Array.isArray(data)?data.meta:undefined);if(!Array.isArray(rows)||!meta)throw new Error('Invalid paginated ESS response.');return {rows,meta};}
export function attachmentFilename(disposition?:string){let value='document';const utf=disposition?.match(/filename\*=UTF-8''([^;]+)/i);const plain=disposition?.match(/filename="([^"]+)"|filename=([^;]+)/i);try{value=utf?decodeURIComponent(utf[1]):plain?.[1]??plain?.[2]?.trim()??value;}catch{value=plain?.[1]??value;}return value.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,180)||'document';}
export const essProfileService={
 profile:async(signal?:AbortSignal):Promise<EssProfile>=>{const {data}=await api.get(BASE,{signal});const result=checked<EssProfile>(data);if(!result?.employee?.uuid||!Array.isArray(result.sections))throw new Error('Invalid employee profile response.');return result;},
 requests:async(params:{page:number;per_page:number;status?:string},signal?:AbortSignal)=>{const {data}=await api.get(BASE+'/change-requests',{params,signal});return list<EssRequest>(data);},
 submit:async(payload:{field_key:string;requested_value:string|null;reason:string})=>{const {data}=await api.post(BASE+'/change-requests',payload);return checked<EssRequest>(data);},
 cancel:async(uuid:string,reason?:string)=>{const {data}=await api.post(BASE+'/change-requests/'+encodeURIComponent(uuid)+'/cancel',reason?{reason}:{});return checked<EssRequest>(data);},
 documents:async(params:{page:number;per_page:number},signal?:AbortSignal)=>{const {data}=await api.get(BASE+'/documents',{params,signal});return list<EssDocument>(data);},
 download:async(uuid:string)=>{const response=await api.get(BASE+'/documents/'+encodeURIComponent(uuid)+'/download',{responseType:'blob'});return {blob:response.data as Blob,filename:attachmentFilename(response.headers['content-disposition'])};},
 review:async(params:{page:number;per_page:number;status?:string},signal?:AbortSignal)=>{const {data}=await api.get('/people-hub/profile-change-requests',{params,signal});return list<EssRequest>(data);},
 decide:async(uuid:string,payload:{decision:'approved'|'rejected';decision_note:string})=>{const {data}=await api.post('/people-hub/profile-change-requests/'+encodeURIComponent(uuid)+'/decision',payload);return checked<EssRequest>(data);},
};
