import { Badge } from '@/components/ui/badge';
export function LeaveDemoNotice() {
    return <div role="note" className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs text-amber-900"><Badge variant="outline" className="border-amber-200 bg-white text-amber-800">Demo preview</Badge>Sample data for reviewing the design. Actions here do not change attendance, requests or leave balances.</div>;
}
