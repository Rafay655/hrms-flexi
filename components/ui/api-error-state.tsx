'use client';

import { useEffect } from 'react';
import { parseApiError } from '@/lib/api-error';
import { showApiError } from '@/lib/error-toast';
import { Button } from '@/components/ui/button';

export function ApiErrorState({ error, onRetry, showDetails = false }: { error: unknown; onRetry?: () => void; showDetails?: boolean }) {
  useEffect(() => { showApiError(error); }, [error]);
  if (!onRetry) return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-600/10 bg-brand-100/40 p-4 text-sm text-brand-700">
    <div><p>{showDetails ? parseApiError(error).message : "This section is unavailable."}</p>{showDetails && parseApiError(error).status && <p className="mt-1 text-xs text-muted-foreground">Request failed (HTTP {parseApiError(error).status}).</p>}</div>
    {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>}
  </div>;
}
