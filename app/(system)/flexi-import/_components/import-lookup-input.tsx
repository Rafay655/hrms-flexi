"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Check,ChevronDown} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Popover,PopoverAnchor,PopoverContent} from '@/components/ui/popover';
import {ApiErrorState} from '@/components/ui/api-error-state';
import {importStudioService} from '@/services/import-studio.service';
export function ImportLookupInput({label,source,value,parentId,requiresParent,scope,disabled,onSelect,onText}:{label:string;source:string;value:string;parentId?:string;requiresParent:boolean;scope:string;disabled:boolean;onSelect:(option:{id:string|number;label:string})=>void;onText:(value:string)=>void}){
 const [open,setOpen]=useState(false),[debounced,setDebounced]=useState(value),[paging,setPaging]=useState({value,page:1}),[highlight,setHighlight]=useState(-1);
 const input=useRef<HTMLInputElement>(null),listId=useId();
 const page=paging.value===value?paging.page:1;
 useEffect(()=>{const timer=setTimeout(()=>setDebounced(value),300);return()=>clearTimeout(timer);},[value]);
 const missingParent=requiresParent&&!parentId;
 const query=useQuery({queryKey:['import-studio',scope,'lookup',source,parentId,debounced,page],queryFn:({signal})=>importStudioService.lookup(source,debounced,page,parentId,signal),enabled:open&&!disabled&&!missingParent&&debounced===value,retry:false,refetchOnWindowFocus:false});
 const options=query.data?.options??[],searching=query.isFetching||debounced!==value;
 function choose(option:{id:string|number;label:string}){onSelect(option);setOpen(false);setHighlight(-1);}
 return <div className="space-y-1.5"><Popover open={open&&!disabled&&!missingParent} onOpenChange={setOpen}><PopoverAnchor asChild><div className="relative"><Input ref={input} aria-label={label} role="combobox" aria-autocomplete="list" aria-expanded={open&&!disabled&&!missingParent} aria-controls={listId} aria-activedescendant={open&&highlight>=0?`${listId}-${highlight}`:undefined} autoComplete="off" value={value} disabled={disabled} className="pr-8" onFocus={()=>{if(!missingParent)setOpen(true);}} onClick={()=>{if(!missingParent)setOpen(true);}} onChange={event=>{onText(event.target.value);setPaging({value:event.target.value,page:1});setHighlight(-1);if(!missingParent)setOpen(true);}} onKeyDown={event=>{
  if(event.key==='Escape'||event.key==='Tab'){setOpen(false);setHighlight(-1);return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){if(missingParent)return;event.preventDefault();setOpen(true);if(options.length)setHighlight(previous=>event.key==='ArrowDown'?Math.min(options.length-1,previous+1):previous<0?options.length-1:Math.max(0,previous-1));}
  if(event.key==='Enter'&&open&&highlight>=0&&!searching&&options[highlight]){event.preventDefault();choose(options[highlight]);}
 }} /><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" /></div></PopoverAnchor><PopoverContent align="start" sideOffset={4} className="w-[var(--radix-popover-trigger-width)] min-w-[220px] max-w-[90vw] p-1" onOpenAutoFocus={event=>event.preventDefault()} onCloseAutoFocus={event=>event.preventDefault()} onInteractOutside={event=>{if(event.target===input.current)event.preventDefault();}}>
 {searching?<p role="status" className="px-3 py-3 text-xs text-muted-foreground">Searching…</p>:query.error?<ApiErrorState error={query.error} onRetry={()=>void query.refetch()} />:<div role="listbox" id={listId} aria-label={`${label} options`} className="max-h-52 overflow-y-auto">{options.map((option,index)=><button id={`${listId}-${index}`} role="option" aria-selected={highlight===index} tabIndex={-1} type="button" key={option.id} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${highlight===index?'bg-brand-100 text-brand-900':'hover:bg-brand-100/60'}`} onMouseDown={event=>event.preventDefault()} onMouseEnter={()=>setHighlight(index)} onClick={()=>choose(option)}><Check aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${value===option.label?'opacity-100':'opacity-0'}`} />{option.label}</button>)}{!options.length&&<p className="px-3 py-3 text-xs text-muted-foreground">No options found.</p>}</div>}
 {(query.data?.has_more||page>1)&&<div className="flex justify-between gap-2 border-t p-1"><Button type="button" size="sm" variant="ghost" disabled={page===1||searching} onMouseDown={event=>event.preventDefault()} onClick={()=>{setPaging({value,page:page-1});setHighlight(-1);}}>Previous</Button><Button type="button" size="sm" variant="ghost" disabled={!query.data?.has_more||searching} onMouseDown={event=>event.preventDefault()} onClick={()=>{setPaging({value,page:page+1});setHighlight(-1);}}>More options</Button></div>}
 </PopoverContent></Popover>{missingParent&&<p className="text-xs text-muted-foreground">Select the controlling field first to search these options.</p>}</div>;
}
