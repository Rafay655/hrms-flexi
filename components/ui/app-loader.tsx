import { cn } from '@/lib/utils';

type AppLoaderProps = {
  label?: string;
  description?: string;
  variant?: 'section' | 'page' | 'inline';
  className?: string;
};

/** Shared loading treatment for new screens and progressive migrations. */
export function AppLoader({ label = 'Loading…', description, variant = 'section', className }: AppLoaderProps) {
  const Container = variant === 'inline' ? 'span' : 'div';
  return (
    <Container role="status" aria-live="polite" aria-busy="true" className={cn(
      'flex items-center justify-center gap-3 text-brand-800',
      variant === 'inline' ? 'inline-flex text-xs' : 'flex-col rounded-xl text-center',
      variant === 'section' && 'min-h-40 px-4 py-8',
      variant === 'page' && 'min-h-[45vh] px-6 py-12',
      className,
    )}>
      <span aria-hidden="true" className={cn('relative block shrink-0', variant === 'inline' ? 'h-4 w-4' : 'h-10 w-10')}>
        <span className="absolute inset-0 rounded-full border-2 border-brand-600/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-[#EEC293] border-t-brand-800 motion-reduce:animate-none" />
        {variant !== 'inline' && <span className="absolute inset-3.5 rounded-full bg-[#EEC293]" />}
      </span>
      <span><span className={cn('block font-medium', variant === 'inline' ? 'text-xs' : 'text-sm')}>{label}</span>{description && <span className="mt-1 block text-xs font-normal text-muted-foreground">{description}</span>}</span>
    </Container>
  );
}
