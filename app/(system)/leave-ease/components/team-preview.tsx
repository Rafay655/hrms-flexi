'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LeaveDemoNotice } from './demo-notice';
import { previewPeople } from './team-demo-data';
export function LeaveTeamPreview({ calendar = false }: {
    calendar?: boolean;
}) {
    const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [search, setSearch] = useState('');
    const [event, setEvent] = useState<{
        employee: string;
        date: string;
        type: string;
    } | null>(null);
    const people = previewPeople.filter(p => `${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase()));
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    function move(n: number) { setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); }
    return <div className="p-3"><Card className="border-gray-100 shadow-sm"><CardHeader className="border-b"><CardTitle className="text-2xl font-semibold text-gray-900">{calendar ? 'Team Leave Calendar' : 'Team Balances'}</CardTitle><p className="text-sm text-gray-500">{calendar ? 'Approved leave and company holidays, without attendance or punch data.' : 'A sample manager team with balances by leave type.'}</p></CardHeader><CardContent className="space-y-4 p-6"><LeaveDemoNotice /><p className="text-xs text-gray-500">Demo team only. Real team membership and employee access must be enforced by the backend before connecting this screen.</p><div className="flex flex-wrap justify-between gap-3"><Input className="max-w-sm" aria-label="Search team" placeholder="Search team member…" value={search} onChange={e => setSearch(e.target.value)}/>{calendar && <div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4"/></Button><span className="min-w-32 text-center text-sm font-semibold">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span><Button variant="outline" size="icon" aria-label="Next month" onClick={() => move(1)}><ChevronRight className="h-4 w-4"/></Button></div>}</div><div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-600">{people.length} sample team members{calendar ? ' · Green: approved leave · Violet: sample company holiday · Empty cells: no leave event' : ''}</div>
 <div className="overflow-hidden rounded-lg border border-gray-200"><div className="overflow-x-auto"><table className={`w-full ${calendar ? 'min-w-[1500px]' : 'min-w-[800px]'}`}><thead className="border-b bg-gray-50"><tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700"><th className="sticky left-0 z-10 min-w-48 bg-gray-50 px-6 py-3">Employee</th>{calendar ? Array.from({ length: count }, (_, i) => <th key={i} className="min-w-10 px-1 py-3 text-center">{i + 1}</th>) : ['Department', 'Annual', 'Casual', 'Sick', 'Total remaining'].map(t => <th key={t} className="px-6 py-3">{t}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{people.map((p, index) => <tr key={p.id} className="text-sm hover:bg-gray-50"><td className="sticky left-0 z-10 bg-white px-6 py-4"><p className="font-medium">{p.name}</p><p className="mt-1 text-xs text-gray-500">{p.code}</p></td>{calendar ? Array.from({ length: count }, (_, i) => { const day = i + 1; const holiday = day === 23; const onLeave = day === 10 + index * 3 || day === 11 + index * 3; const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return <td key={day} className="border-l border-gray-100 p-1 text-center">{(holiday || onLeave) && <button className={`w-full rounded px-1 py-2 text-xs font-medium ${holiday ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`} aria-label={`${p.name}, ${date}, ${holiday ? 'company holiday' : 'approved annual leave'}`} onClick={() => setEvent({ employee: p.name, date, type: holiday ? 'Sample company holiday' : 'Approved annual leave' })}>{holiday ? 'H' : 'AL'}</button>}</td>; }) : <><td className="px-6 py-4 text-gray-500">{p.department}</td>{[p.annual, p.casual, p.sick].map((n, i) => <td key={i} className="px-6 py-4">{n} days</td>)}<td className="px-6 py-4"><Badge variant="outline">{p.annual + p.casual + p.sick} days</Badge></td></>}</tr>)}{!people.length && <tr><td colSpan={calendar ? count + 1 : 6} className="p-12 text-center text-gray-500">No team members match your search.</td></tr>}</tbody></table></div></div></CardContent></Card><Dialog open={!!event} onOpenChange={open => { if (!open)
        setEvent(null); }}><DialogContent><DialogHeader><DialogTitle>{event?.type}</DialogTitle><DialogDescription>Sample team calendar event.</DialogDescription></DialogHeader><p className="text-sm">{event?.employee} · {event?.date}</p></DialogContent></Dialog></div>;
}
