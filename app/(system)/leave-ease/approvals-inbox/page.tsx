'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLoader } from '@/components/ui/app-loader';
import toast from 'react-hot-toast';
import { Check, X, Eye, MoreVertical, Search } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect from '@/components/ui/searchable-select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LeaveDemoNotice } from '../components/demo-notice';
import { previewApprovals, type PreviewApproval } from '../components/team-demo-data';
import { demoStatusClass } from '../components/demo-data';
export default function LeaveApprovalsInbox() {
  return <Suspense fallback={<AppLoader label="Loading approvals…" />}><InboxRoute /></Suspense>;
}
function InboxRoute() {
  const params = useSearchParams();
  const value = params.get('type') || '';
  const initialType = ['Leave','Comp off','Encashment'].includes(value) ? value : '';
  return <InboxContent key={initialType} initialType={initialType} />;
}
function InboxContent({initialType}:{initialType:string}) {
    const [rows, setRows] = useState(previewApprovals);
    const [type, setType] = useState(initialType);
    const [status, setStatus] = useState('Pending');
    const [search, setSearch] = useState('');
    const [selection, setSelection] = useState<{
        row: PreviewApproval;
        action: 'View' | 'Approve' | 'Reject';
    } | null>(null);
    const [reason, setReason] = useState('');
    const visible = rows.filter(r => (!type || r.type === type) && (!status || r.status === status) && `${r.employee} ${r.detail}`.toLowerCase().includes(search.toLowerCase()));
    function choose(row: PreviewApproval, action: 'View' | 'Approve' | 'Reject') { setReason(''); setSelection({ row, action }); }
    function confirm() { if (!selection || selection.action === 'View')
        return; if (selection.action === 'Reject' && !reason.trim()) {
        toast.error('Please provide a rejection reason');
        return;
    } setRows(p => p.map(r => r.id === selection.row.id ? { ...r, status: selection.action === 'Approve' ? 'Approved' : 'Rejected', reason: reason.trim() || r.reason } : r)); setSelection(null); toast.success('Demo decision applied locally. No request was sent.'); }
    return <div className="p-3"><Card className="border-gray-100 shadow-sm"><CardHeader className="border-b"><CardTitle className="text-2xl font-semibold text-gray-900">Approvals Inbox</CardTitle><p className="text-sm text-gray-500">One review list for leave, comp-off and encashment.</p></CardHeader><CardContent className="space-y-4 p-6"><LeaveDemoNotice /><p className="text-xs text-gray-500">Manager access and the final approval path require backend confirmation. This preview uses fictional team records and sends no approval API calls.</p>
 <div className="flex flex-wrap gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><Input aria-label="Search approvals" className="pl-10" placeholder="Search employee or request…" value={search} onChange={e => setSearch(e.target.value)}/></div><SearchableSelect aria-label="Approval type" widthClass="w-44" allLabel="All types" value={type} onChange={setType} options={['Leave', 'Comp off', 'Encashment'].map(v => ({ value: v, label: v }))}/><SearchableSelect aria-label="Approval status" widthClass="w-40" allLabel="All statuses" value={status} onChange={setStatus} options={['Pending', 'Approved', 'Rejected'].map(v => ({ value: v, label: v }))}/></div>
 <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600">{visible.length} demo requests · {rows.filter(r => r.status === 'Pending').length} awaiting a sample decision</div>
 <div className="overflow-hidden rounded-lg border border-gray-200"><div className="overflow-x-auto"><table className="w-full min-w-[950px]"><thead className="border-b bg-gray-50"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">{['Employee', 'Request', 'Dates', 'Days / amount', 'Status', 'Actions'].map(t => <th className="px-6 py-3" key={t}>{t}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{visible.map(row => <tr key={row.id} className="text-sm hover:bg-gray-50"><td className="px-6 py-4 font-medium">{row.employee}</td><td className="px-6 py-4"><p>{row.type}</p><p className="mt-1 text-xs text-gray-500">{row.detail}</p></td><td className="px-6 py-4">{row.date}</td><td className="px-6 py-4">{row.quantity}</td><td className="px-6 py-4"><Badge variant="outline" className={demoStatusClass[row.status]}>{row.status}</Badge></td><td className="px-6 py-4"><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Actions for ${row.employee}`}><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => choose(row, 'View')}><Eye className="mr-2 h-4 w-4"/>View details</DropdownMenuItem>{row.status === 'Pending' && <><DropdownMenuItem onClick={() => choose(row, 'Approve')}><Check className="mr-2 h-4 w-4"/>Approve demo</DropdownMenuItem><DropdownMenuItem className="text-red-600" onClick={() => choose(row, 'Reject')}><X className="mr-2 h-4 w-4"/>Reject demo</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu></td></tr>)}{!visible.length && <tr><td colSpan={6} className="p-12 text-center text-sm text-gray-500">No requests match these filters.</td></tr>}</tbody></table></div><div className="border-t bg-gray-50 px-6 py-4 text-sm text-gray-500">Showing {visible.length} of {rows.length} sample requests</div></div>
 </CardContent></Card><Dialog open={!!selection} onOpenChange={open => { if (!open)
        setSelection(null); }}><DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl"><DialogHeader className="border-b bg-gray-50/70 p-6"><DialogTitle>{selection?.action} {selection?.row.type.toLowerCase()}</DialogTitle><DialogDescription>Demo decision only; the live approval workflow is unchanged.</DialogDescription></DialogHeader><div className="space-y-4 p-6"><dl className="space-y-3 text-sm">{selection && Object.entries({ Employee: selection.row.employee, Request: selection.row.detail, Dates: selection.row.date, Quantity: selection.row.quantity, Reason: selection.row.reason }).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-gray-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>{selection?.action === 'Reject' && <div className="space-y-2"><Label htmlFor="demo-reject">Rejection reason *</Label><Textarea id="demo-reject" maxLength={2000} value={reason} onChange={e => setReason(e.target.value)}/></div>}</div><DialogFooter className="border-t bg-gray-50/70 px-6 py-4"><Button variant="outline" onClick={() => setSelection(null)}>{selection?.action === 'View' ? 'Close' : 'Cancel'}</Button>{selection?.action !== 'View' && <Button className="bg-[#1E1B4B] hover:bg-[#2A2675]" onClick={confirm}>Confirm demo {selection?.action.toLowerCase()}</Button>}</DialogFooter></DialogContent></Dialog></div>;
}
