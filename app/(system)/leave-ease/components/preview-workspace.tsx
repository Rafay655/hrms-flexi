'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Download, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import SearchableSelect from '@/components/ui/searchable-select';
import { LeaveDemoNotice } from './demo-notice';
import { previewDefinitions } from './preview-definitions';
export function LeavePreviewWorkspace({ kind }: {
    kind: string;
}) {
    const config = previewDefinitions[kind];
    const [rows, setRows] = useState(() => config.rows);
    const [form, setForm] = useState<Record<string, string>>({});
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<Record<string, string> | null>(null);
    const [reportType, setReportType] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [result, setResult] = useState<Record<string, string> | null>(null);
    const filtered = rows.filter(r => (!reportType || r.Report === reportType) && Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase()));
    const pages = Math.max(1, Math.ceil(filtered.length / perPage));
    const current = Math.min(page, pages);
    const visible = filtered.slice((current - 1) * perPage, current * perPage);
    function save() {
        for (const field of config.fields) {
            const value = form[field.key]?.trim() || '';
            if (field.required && !value) {
                toast.error(`${field.label} is required`);
                return;
            }
            if (field.type === 'number' && value) {
                const n = Number(value);
                if (!Number.isFinite(n) || (field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max) || (field.step === 1 && !Number.isInteger(n))) {
                    toast.error(`Enter a valid value for ${field.label}`);
                    return;
                }
            }
        }
        if (form.Reason && form.Reason.trim().length < 10) {
            toast.error('Please enter a reason of at least 10 characters');
            return;
        }
        if (form.From && form.To && form.To < form.From) {
            toast.error('The end date must be on or after the start date');
            return;
        }
        if (kind === 'short-leave' && form['End time'] <= form['Start time']) { toast.error('End time must be after start time on the same day'); return; }
        const row = { ...form };
        if (kind === 'short-leave') {
          const minutes=(time:string)=>{const [h,m]=time.split(':').map(Number);return h*60+m;};
          row.Minutes=String(minutes(row['End time'])-minutes(row['Start time']));
        }

        if (kind === 'encashment') {
            row.Amount = (Number(form.Days) * Number(form['Rate per day'])).toFixed(2);
            row.Status = 'Pending';
            row['Payroll included'] = 'No';
        }
        if (kind === 'delegations')
            row.Status = 'Preview only';
        setRows(previous => [row, ...previous]);
        setResult(row);
        setPage(1);
        setOpen(false);
        toast.success('Demo preview updated. No server changes were made.');
    }
    function download() { const quote = (s: string) => `"${s.replaceAll('"', '""')}"`; const text = [config.columns, ...filtered.map(row => config.columns.map(c => row[c] || ''))].map(row => row.map(value => quote(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value)).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' })); const a = document.createElement('a'); a.href = url; a.download = `leaveease-${kind}-DEMO.csv`; a.click(); URL.revokeObjectURL(url); }
    return <div className="p-3"><Card className="border-gray-100 shadow-sm"><CardHeader className="border-b"><div className="flex flex-wrap items-center justify-between gap-4"><div><CardTitle className="text-2xl font-semibold text-gray-900">{config.title}</CardTitle><p className="mt-1 text-sm text-gray-500">{config.description}</p></div><div className="flex gap-2">{kind === 'reports' && <Button variant="outline" size="sm" onClick={download}><Download className="mr-2 h-4 w-4"/>Export demo CSV</Button>}{config.action && <Button size="sm" className="bg-[#1E1B4B] hover:bg-[#2A2675]" onClick={() => { setForm({}); setOpen(true); }}><Plus className="mr-2 h-4 w-4"/>{config.action}</Button>}</div></div></CardHeader><CardContent className="space-y-4 p-6"><LeaveDemoNotice />{config.dependency && <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600"><strong>Backend needed:</strong> {config.dependency}</p>}
 {kind === 'encashment' && <p className="text-xs text-gray-500">Sample annual balance: 9 days. The entered rate is illustrative; the backend must provide the payable rate and validate eligibility.</p>}
 {result && <div role="status" className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700"><strong>Latest local preview</strong><p className="mt-1">{Object.entries(result).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p><p className="mt-1 text-xs">Not saved to the server. Refreshing resets these changes.</p></div>}
 <div className="flex flex-wrap items-center gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><Input aria-label="Search preview records" placeholder="Search records…" className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></div>{kind === 'reports' && <SearchableSelect aria-label="Report type" allLabel="All reports" widthClass="w-48" value={reportType} onChange={v => { setReportType(v); setPage(1); }} options={['Balance summary', 'Leave taken'].map(v => ({ value: v, label: v }))}/>}<span className="text-sm text-gray-500">Show</span><SearchableSelect aria-label="Records per page" allowAll={false} widthClass="w-24" value={String(perPage)} options={[10, 25, 50].map(n => ({ value: String(n), label: String(n) }))} onChange={v => { setPerPage(Number(v)); setPage(1); }}/></div>
 <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600">{filtered.length} demo {filtered.length === 1 ? 'record' : 'records'}</div>
 <div className="overflow-hidden rounded-lg border border-gray-200"><div className="overflow-x-auto"><table className="w-full min-w-[700px]"><thead className="border-b bg-gray-50"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">{config.columns.map(c => <th key={c} className="px-6 py-3">{c}</th>)}<th className="px-6 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{visible.map((row, i) => <tr key={i} className="text-sm hover:bg-gray-50">{config.columns.map(c => <td key={c} className="px-6 py-4">{row[c] || '—'}</td>)}<td className="px-6 py-4 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Record actions"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setView(row)}><Eye className="mr-2 h-4 w-4"/>View details</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}{!visible.length && <tr><td colSpan={config.columns.length + 1} className="p-12 text-center text-sm text-gray-500">{search ? 'No matching records.' : config.action ? 'No demo records yet. Create a preview to explore the form.' : 'No demo records available.'}</td></tr>}</tbody></table></div><div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4 text-sm"><span>Page {current} of {pages}</span><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft className="h-4 w-4"/></Button><Button variant="outline" size="icon" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight className="h-4 w-4"/></Button></div></div></div>
 </CardContent></Card><Dialog open={open} onOpenChange={setOpen}><DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]"><DialogHeader className="border-b bg-gray-50/70 p-6"><DialogTitle>{config.action}</DialogTitle><DialogDescription>Demo only. No payroll, leave balance or approval changes will be submitted.</DialogDescription></DialogHeader><form className="flex min-h-0 flex-col" onSubmit={e => { e.preventDefault(); save(); }}><div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">{config.fields.map(field => <div key={field.key} className={`space-y-1.5 ${field.key === 'Reason' ? 'sm:col-span-2' : ''}`}><Label htmlFor={`preview-${field.key}`}>{field.label}{field.required ? ' *' : ''}</Label>{field.type === 'select' ? <SearchableSelect id={`preview-${field.key}`} widthClass="w-full" allowAll={false} value={form[field.key] || ''} options={(field.options || []).map(value => ({ value, label: value }))} onChange={value => setForm(p => ({ ...p, [field.key]: value }))}/> : <Input id={`preview-${field.key}`} type={field.type || 'text'} required={field.required} min={field.min} max={field.max} step={field.step} maxLength={field.type === 'text' || !field.type ? 2000 : undefined} value={form[field.key] || ''} onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}/>}</div>)}</div><DialogFooter className="border-t bg-gray-50/70 px-6 py-4"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-[#1E1B4B] hover:bg-[#2A2675]">Preview locally</Button></DialogFooter></form></DialogContent></Dialog>
 <Dialog open={!!view} onOpenChange={v => { if (!v)
        setView(null); }}><DialogContent><DialogHeader><DialogTitle>Demo record</DialogTitle><DialogDescription>Sample data for design review.</DialogDescription></DialogHeader><dl className="space-y-3">{Object.entries(view || {}).map(([key, value]) => <div key={key} className="flex justify-between gap-4 text-sm"><dt className="text-gray-500">{key}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl></DialogContent></Dialog></div>;
}
