import {Loader2} from 'lucide-react';
import {cn} from '@/lib/utils';

type AppLoaderProps={label?:string;description?:string;variant?:'section'|'page'|'inline';className?:string};

/** One loading treatment for page, section and inline states. */
export function AppLoader({label='Loading…',description,variant='section',className}:AppLoaderProps){
 const Container=variant==='inline'?'span':'div';
 return <Container role="status" aria-live="polite" aria-busy="true" className={cn(
  'flex items-center justify-center gap-2.5 font-sidebar text-brand-800',
  variant==='inline'?'inline-flex text-[12px]':'flex-col text-center',
  variant==='section'&&'min-h-40 px-4 py-8',
  variant==='page'&&'min-h-[45vh] px-6 py-12',
  className,
 )}>
  <Loader2 aria-hidden="true" strokeWidth={1.75} className={cn('shrink-0 animate-spin motion-reduce:animate-none',variant==='inline'?'h-3.5 w-3.5':variant==='page'?'h-7 w-7':'h-6 w-6')}/>
  <span className="min-w-0"><span className={cn('block font-medium',variant==='inline'?'text-[12px]':'text-[13px]')}>{label}</span>{description&&<span className="mt-1 block text-[12px] font-normal leading-5 text-muted-foreground">{description}</span>}</span>
 </Container>;
}
