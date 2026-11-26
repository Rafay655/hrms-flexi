"use client";
import type { ReactNode } from 'react';
import { motion,useReducedMotion } from 'framer-motion';
import { Check,ChevronLeft,ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export const importPrimary='bg-brand-800 text-white hover:bg-brand-700 focus-visible:ring-brand-500';
export const importAccent='bg-brand-500 text-brand-900 hover:bg-brand-300';
export function ImportSteps({active}:{active:number}){
 const labels=['Choose template','Upload file','Review changes','Missing data','Confirm import','Track results'];
 return <ol aria-label="Import progress" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{labels.map((label,index)=><li key={label} aria-current={active===index+1?'step':undefined} className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition-colors duration-200 ${active===index+1?'border-brand-800/20 bg-brand-100 text-brand-800':'border-border bg-card text-muted-foreground'}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${active>index+1?'bg-brand-800 text-white':active===index+1?'bg-brand-500 text-brand-900':'bg-muted'}`}>{active>index+1?<Check className="h-3 w-3" />:index+1}</span><span className="font-medium">{label}</span></li>)}</ol>;
}
export function ImportSection({number,title,description,children,actions}:{number:number;title:string;description?:string;children:ReactNode;actions?:ReactNode}){
 const reduced=useReducedMotion();
 return <motion.section initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.2,ease:'easeOut'}} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_3px_18px_rgba(30,26,58,0.035)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4"><div className="min-w-0"><h2 className="text-base font-semibold tracking-tight text-brand-900"><span className="mr-2 text-brand-700">{String(number).padStart(2,'0')} —</span>{title}</h2>{description&&<p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}</div>{actions}</div><div className="space-y-4 p-4 sm:p-5">{children}</div></motion.section>;

}
export function ImportStat({label,value}:{label:string;value:ReactNode}){return <div className="min-w-0 rounded-xl border border-border/70 bg-muted/30 px-4 py-3.5"><p className="text-[11px] font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-brand-800">{value}</p></div>;}
export function ImportPagination({page,hasNext,total,lastPage,count,size=50,onPage,disabled=false}:{page:number;hasNext:boolean;total?:number;lastPage?:number;count:number;size?:number;onPage:(page:number)=>void;disabled?:boolean}){
 const from=count?(page-1)*size+1:0,to=count?(page-1)*size+count:0;
 return <footer data-table-pagination className="flex flex-wrap items-center justify-between gap-3 rounded-b-lg border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground"><span>Page <strong className="text-foreground">{page}</strong>{lastPage!==undefined?` of ${Math.max(1,lastPage)}`:''}</span><nav aria-label="Table pagination" className="flex items-center gap-2"><Button size="sm" variant="outline" aria-label="Previous page" disabled={disabled||page<=1} onClick={()=>onPage(page-1)}><ChevronLeft className="h-4 w-4" /></Button><span aria-current="page" className="flex h-8 min-w-8 items-center justify-center rounded-md bg-brand-800 px-2 text-white">{page}</span><Button size="sm" variant="outline" aria-label="Next page" disabled={disabled||!hasNext} onClick={()=>onPage(page+1)}><ChevronRight className="h-4 w-4" /></Button></nav><span>{from}–{to}{total!==undefined?` of ${total.toLocaleString()}`:''} rows</span></footer>;
}
