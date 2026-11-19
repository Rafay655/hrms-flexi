export type VisibilityCondition = { field_key: string; values: string[] };
export type ConditionalField = {
 system_key?: string; field_key?: string; type: string;
 visibility_condition?: VisibilityCondition | null;
 show_in_quick?: boolean; show_in_detail?: boolean;
 is_core?: boolean; is_login_email?: boolean;
};
export const conditionFieldKey = (field:ConditionalField) => field.system_key || field.field_key || '';
export function conditionValue(value:unknown):string {
 if(typeof value==='boolean')return value?'1':'0';
 if(value&&typeof value==='object'&&!Array.isArray(value)){
  const item=value as {value?:unknown;id?:unknown};
  return conditionValue(item.value??item.id);
 }
 return typeof value==='string'||typeof value==='number'?String(value).trim():'';
}
export function visibleFieldKeys(fields:ConditionalField[],values:Record<string,unknown>,mode:'quick'|'detailed'):Set<string>{
 const byKey=new Map(fields.map(field=>[conditionFieldKey(field),field]));
 const memo=new Map<string,boolean>();
 function visible(key:string,path=new Set<string>()):boolean{
  if(memo.has(key))return memo.get(key)!;
  const field=byKey.get(key);
  if(!field||!key||path.has(key))return false;
  if((mode==='quick'?field.show_in_quick:field.show_in_detail)===false)return false;
  const rule=field.is_core||field.is_login_email?null:field.visibility_condition;
  let result=true;
  if(rule){
   const parent=byKey.get(rule.field_key);
   const next=new Set(path);next.add(key);
   result=!!parent&&['select','radio','checkbox','toggle'].includes(parent.type)&&visible(rule.field_key,next)&&rule.values.some(value=>String(value)===conditionValue(values[rule.field_key]));
  }
  memo.set(key,result);return result;
 }
 return new Set(fields.map(conditionFieldKey).filter(key=>visible(key)));
}
export function createsVisibilityCycle(fields:ConditionalField[],child:string,parent:string):boolean{
 const byKey=new Map(fields.map(field=>[conditionFieldKey(field),field]));
 const seen=new Set<string>([child]);
 let cursor:string|undefined=parent;
 while(cursor){if(seen.has(cursor))return true;seen.add(cursor);cursor=byKey.get(cursor)?.visibility_condition?.field_key;}
 return false;
}
