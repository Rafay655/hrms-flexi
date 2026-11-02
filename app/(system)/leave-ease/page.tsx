'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, CalendarDays, Clock3, WalletCards, Palmtree, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeaveDemoNotice } from './components/demo-notice';
import { demoBalances, demoMonthEvents, demoStatusClass } from './components/demo-data';
export default function LeaveDashboard() {
    const [now] = useState(() => new Date());
    const events = demoMonthEvents(now.getFullYear(), now.getMonth());
    const requests = events.filter(event => !event.holiday);
    const remaining = demoBalances.reduce((sum, b) => sum + b.entitlement + b.carried - b.used, 0);
    const pending = requests.filter(r => r.status === 'Pending');
    const holiday = events.find(event => event.holiday)!;
    const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return <div className="space-y-4 p-3">
    <Card className="border-gray-100 shadow-sm"><CardHeader className="border-b"><div className="flex flex-wrap items-center justify-between gap-4"><div><CardTitle className="text-2xl font-semibold text-gray-900">My Leave</CardTitle><p className="mt-1 text-sm text-gray-500">A little room to recharge. Your leave, all in one place.</p></div><Button asChild className="bg-[#1E1B4B] hover:bg-[#2A2675]"><Link href="/leave-ease/my-requests">My requests<ArrowUpRight className="ml-2 h-4 w-4"/></Link></Button></div></CardHeader><CardContent className="space-y-5 p-6"><LeaveDemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">{[{ label: 'Available balance', value: `${remaining} days`, note: 'Across four leave types', icon: WalletCards }, { label: 'Pending requests', value: String(pending.length), note: `${pending.reduce((n, r) => n + r.days, 0)} days awaiting approval`, icon: Clock3 }, { label: 'Sample holiday', value: '23 ' + now.toLocaleDateString('en-US', { month: 'short' }), note: 'Company holiday · illustrative', icon: CalendarDays }].map((item, i) => <div key={item.label} className={`rounded-xl border p-4 ${i === 0 ? 'border-[#1E1B4B] bg-[#1E1B4B] text-white' : 'border-gray-200 bg-white text-gray-900'}`}><div className="flex justify-between"><p className={`text-sm ${i === 0 ? 'text-white/70' : 'text-gray-500'}`}>{item.label}</p><item.icon className={`h-5 w-5 ${i === 0 ? 'text-[#EEC293]' : 'text-[#1E1B4B]'}`}/></div><p className="mt-3 text-2xl font-semibold">{item.value}</p><p className={`mt-1 text-xs ${i === 0 ? 'text-white/60' : 'text-gray-500'}`}>{item.note}</p></div>)}</div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]"><section className="rounded-xl border border-gray-200"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-semibold text-gray-900">Your balances</h2><Link className="text-xs font-medium text-[#1E1B4B]" href="/leave-ease/my-balance">View all →</Link></div><div className="space-y-5 p-5">{demoBalances.map(b => <div key={b.code}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-gray-700">{b.name}</span><span><strong>{b.entitlement - b.used + b.carried}</strong><span className="text-gray-400"> / {b.entitlement + b.carried} days</span></span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${(b.entitlement - b.used + b.carried) / (b.entitlement + b.carried) * 100}%`, background: b.color }}/></div></div>)}</div></section>
      <section className="rounded-xl border border-gray-200"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-semibold text-gray-900">This month</h2><span className="text-xs text-gray-500">{month}</span></div><div className="divide-y divide-gray-100">{requests.slice(0, 3).map(r => <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-medium text-gray-900">{r.type}</p><p className="mt-1 text-xs text-gray-500">{r.start.slice(8)} {now.toLocaleDateString('en-US', { month: 'short' })} · {r.days} {r.days === 1 ? 'day' : 'days'}</p></div><Badge variant="outline" className={demoStatusClass[r.status]}>{r.status}</Badge></div>)}</div><Link href="/leave-ease/my-calendar" className="flex items-center justify-between border-t px-5 py-4 text-sm font-medium text-[#1E1B4B]">Open my calendar<ChevronRight className="h-4 w-4"/></Link></section></div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#EEC293]/40 bg-[#EEC293]/10 p-5"><div className="flex items-center gap-3"><Palmtree className="h-6 w-6 text-[#1E1B4B]"/><div><h2 className="text-sm font-semibold text-gray-900">Plan a little time for yourself</h2><p className="mt-1 text-xs text-gray-500">Review your calendar before making your next request.</p></div></div><Button asChild variant="outline"><Link href="/leave-ease/my-calendar">Explore calendar</Link></Button></div>
      <p className="text-xs text-gray-400">Preview holiday: {holiday.start}. Demo requests are separate from the live My Requests page.</p>
    </CardContent></Card>
  </div>;
}
