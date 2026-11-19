"use client";
import {useQuery} from '@tanstack/react-query';
import type {OnboardSettingField} from '@/types/onboard-settings';
import type {VisibilityCondition} from '@/lib/onboarding-visibility';
import {createsVisibilityCycle} from '@/lib/onboarding-visibility';
import {onboardingService} from '@/services/onboarding-form.service';
import SearchSelect from '@/components/ui/searchable-select';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {AppLoader} from '@/components/ui/app-loader';
import {ApiErrorState} from '@/components/ui/api-error-state';

export function FieldVisibilityEditor({field,fields,companyUuid,onChange}:{field:OnboardSettingField;fields:OnboardSettingField[];companyUuid:string;onChange:(rule:VisibilityCondition|null)=>void}){
 const key=field.system_key??'';
 const parents=fields.filter(parent=>parent.system_key&&parent!==field&&(field.id===0||parent.id!==field.id)&&['select','radio','checkbox','toggle'].includes(parent.type)&&!createsVisibilityCycle(fields,key,parent.system_key!));
 const rule=field.visibility_condition;
 const parent=parents.find(item=>item.system_key===rule?.field_key);
 const dynamic=parent?.source_type==='dynamic'&&parent.type==='select';
 const options=useQuery({queryKey:['onboarding-condition-options',companyUuid,parent?.source_table],queryFn:()=>onboardingService.getLookupOptions({companyUuid,sourceKey:parent!.source_table!}),enabled:!!dynamic&&!!parent?.source_table,retry:false});
 const choices=parent&&['checkbox','toggle'].includes(parent.type)?[{label:'Yes',value:'1'},{label:'No',value:'0'}]:dynamic?(options.data??[]).map(item=>{const raw=item as unknown as {value?:string|number;id?:string|number;label?:string;name?:string};return {value:String(raw.value??raw.id??''),label:raw.label??raw.name??''};}):parent?.options??[];
 if(field.is_core||field.is_login_email)return <p className="text-xs text-muted-foreground">Core fields and the login email are always shown in their configured mode.</p>;
 return <div className="space-y-3"><p className="text-xs text-muted-foreground">Show this field only when another field matches any selected value. Required Quick and Required Detail still apply independently.</p><SearchSelect value={rule?.field_key??''} options={parents.map(item=>({value:item.system_key!,label:item.label}))} onChange={value=>onChange(value?{field_key:String(value),values:[]}:null)} placeholder="Choose a controlling field" allLabel="Always visible in configured mode" widthClass="w-full" />{rule&&<><Button size="sm" variant="ghost" onClick={()=>onChange(null)}>Clear condition</Button>{!parent?<p className="text-xs text-destructive">Choose an available controlling field from this form.</p>:dynamic&&options.isPending?<AppLoader variant="inline" label="Loading parent options…" />:dynamic&&options.error?<ApiErrorState error={options.error} onRetry={()=>void options.refetch()} />:<div className="space-y-2">{choices.filter(item=>String(item.value)!=='').map(item=>{const value=String(item.value);return <Label key={value} className="flex items-center gap-2 text-sm"><Checkbox checked={rule.values.includes(value)} onCheckedChange={checked=>onChange({...rule,values:checked?[...rule.values,value]:rule.values.filter(selected=>selected!==value)})} />{item.label}</Label>;})}{!choices.length&&<p className="text-xs text-muted-foreground">Configure options for the controlling field before saving this rule.</p>}</div>}</>}</div>;
}
