'use client';

import { useEffect } from 'react';
import { showApiError } from '@/lib/error-toast';
import { Button } from '@/components/ui/button';

export function ApiErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  useEffect(() => { showApiError(error); }, [error]);
  if (!onRetry) return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-600/10 bg-brand-100/40 p-4 text-sm text-brand-700">
    <p>This section is unavailable.</p>
    {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>}
  </div>;
}
