"use client";

import {Rows3} from 'lucide-react';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {cn} from '@/lib/utils';

export type PageSizeSelectProps={
  value:number;
  onChange:(value:number)=>void;
  options?:readonly number[];
  disabled?:boolean;
  className?:string;
  contentClassName?:string;
  id?:string;
  'aria-label'?:string;
};

export function PageSizeSelect({value,onChange,options=[10,20,50,100],disabled=false,className,contentClassName,id,'aria-label':label='Results per page'}:PageSizeSelectProps){
  const sizes=[...new Set([...options,value])].filter(size=>Number.isInteger(size)&&size>0).sort((a,b)=>a-b);
  return <Select value={String(value)} disabled={disabled} onValueChange={selected=>onChange(Number(selected))}>
    <SelectTrigger id={id} size="sm" aria-label={label} className={cn('h-8 min-w-24 gap-2 rounded-lg border-gray-200 bg-white px-2.5 font-sans text-xs shadow-none hover:border-brand-800/30 focus-visible:ring-brand-800/15',className)}>
      <Rows3 aria-hidden="true" className="size-3.5 text-muted-foreground" />
      <SelectValue>{value}</SelectValue>
    </SelectTrigger>
    <SelectContent position="popper" align="start" className={cn("min-w-24 rounded-lg font-sans",contentClassName)}>
      {sizes.map(size=><SelectItem key={size} value={String(size)} className="text-xs">{size}</SelectItem>)}
    </SelectContent>
  </Select>;
}
