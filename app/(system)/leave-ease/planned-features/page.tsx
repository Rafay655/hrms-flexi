import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeaveDemoNotice } from '../components/demo-notice';
import { previewDefinitions } from '../components/preview-definitions';
export default function PlannedLeaveFeatures() {
    const paths = ['delegations', 'balance-ledger', 'short-leave', 'on-behalf'];
    return <div className="p-3"><Card className="border-gray-100 shadow-sm"><CardHeader className="border-b"><CardTitle className="text-2xl font-semibold text-gray-900">Planned Features</CardTitle><p className="text-sm text-gray-500">Explore missing workflows as demo previews, away from everyday operations.</p></CardHeader><CardContent className="space-y-4 p-6"><LeaveDemoNotice /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{paths.map(path => { const item = previewDefinitions[path]; return <Link href={`/leave-ease/${path}`} key={path} className="rounded-xl border border-gray-200 p-5 transition-colors hover:border-[#1E1B4B]/40 hover:bg-gray-50"><div className="flex items-center justify-between gap-2"><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Backend needed</Badge><ArrowUpRight className="h-4 w-4 text-gray-400"/></div><h2 className="mt-4 text-base font-semibold text-[#1E1B4B]">{item.title}</h2><p className="mt-2 text-sm text-gray-500">{item.description}</p></Link>; })}</div><p className="text-xs text-gray-500">Short leave and applying on behalf are design previews only. Their API contracts and business rules still need confirmation; no automation or approval engine is running.</p></CardContent></Card></div>;
}
