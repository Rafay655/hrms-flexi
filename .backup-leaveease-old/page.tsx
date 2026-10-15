"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  PlusCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TAB_LIST_CLS, TAB_TRIGGER_CLS } from "@/lib/ui-constants";
import { toast } from "sonner";

const KPI = [
  { label: "My Leave Balance", value: "14 days", sub: "Annual remaining", icon: Calendar, color: "bg-brand-800" },
  { label: "Pending Requests", value: "2", sub: "Awaiting approval", icon: Clock, color: "bg-brand-700" },
  { label: "Team on Leave Today", value: "3", sub: "Out of office", icon: Users, color: "bg-brand-600" },
  { label: "Leaves Taken YTD", value: "6 days", sub: "Year to date", icon: CheckCircle2, color: "bg-brand-500" },
];

const PENDING_APPROVALS = [
  { id: 1, name: "Sana Ahmed", type: "Annual Leave", from: "Apr 10", to: "Apr 12", days: 3, reason: "Family wedding" },
  { id: 2, name: "Bilal Khan", type: "Sick Leave", from: "Apr 8", to: "Apr 9", days: 2, reason: "Medical rest" },
];

const UPCOMING = [
  { name: "Fatima Noor", type: "Annual", dates: "Apr 15 - Apr 19" },
  { name: "Usman Tariq", type: "Casual", dates: "Apr 17" },
  { name: "Hira Malik", type: "Sick", dates: "Apr 18 - Apr 19" },
];

const MY_REQUESTS = [
  { type: "Annual Leave", from: "Feb 12", to: "Feb 14", days: 3, status: "Approved", applied: "Feb 1" },
  { type: "Casual Leave", from: "Mar 5", to: "Mar 5", days: 1, status: "Approved", applied: "Mar 3" },
  { type: "Sick Leave", from: "Mar 20", to: "Mar 20", days: 1, status: "Approved", applied: "Mar 20" },
  { type: "Annual Leave", from: "Apr 10", to: "Apr 12", days: 3, status: "Pending", applied: "Apr 2" },
  { type: "Annual Leave", from: "May 1", to: "May 1", days: 1, status: "Pending", applied: "Apr 4" },
];

const DEPT_UTIL = [
  { dept: "Engineering", days: 124 },
  { dept: "HR", days: 48 },
  { dept: "Finance", days: 67 },
  { dept: "Sales", days: 89 },
  { dept: "Operations", days: 102 },
];

const TYPE_DIST = [
  { name: "Annual", value: 420, color: "#322E53" },
  { name: "Sick", value: 180, color: "#EEC293" },
  { name: "Casual", value: 140, color: "#F3AB9D" },
  { name: "Others", value: 60, color: "#49426E" },
];

const statusClass = (s: string) =>
  s === "Approved"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
    : s === "Pending"
    ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
    : s === "Rejected"
    ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";

export default function LeaveEaseDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">LeaveEase</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Leave management and workforce availability
          </p>
        </div>
        <Button className="bg-brand-800 text-white hover:bg-brand-900 gap-2">
          <PlusCircle className="h-4 w-4" /> Apply for Leave
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-brand-300/40 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className="text-2xl font-bold text-brand-900 mt-1">{k.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={TAB_LIST_CLS}>
          <TabsTrigger value="overview"  className={TAB_TRIGGER_CLS}>Overview</TabsTrigger>
          <TabsTrigger value="my"        className={TAB_TRIGGER_CLS}>My Requests</TabsTrigger>
          <TabsTrigger value="team"      className={TAB_TRIGGER_CLS}>Team</TabsTrigger>
          <TabsTrigger value="analytics" className={TAB_TRIGGER_CLS}>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5 pt-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="border-brand-300/40">
              <CardHeader>
                <CardTitle className="text-base text-brand-900">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PENDING_APPROVALS.map((p) => (
                  <div key={p.id} className="rounded-lg border border-gray-200 p-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-brand-900">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.type} · {p.from} – {p.to} ({p.days} days)</p>
                        <p className="text-xs text-brand-700 mt-1">{p.reason}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" onClick={() => toast.success(`Approved ${p.name}'s leave`)} className="bg-emerald-600 text-white hover:bg-emerald-700 h-7 px-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" onClick={() => toast.error(`Rejected ${p.name}'s leave`)} className="bg-red-600 text-white hover:bg-red-700 h-7 px-2">
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-brand-300/40">
              <CardHeader>
                <CardTitle className="text-base text-brand-900">Upcoming Leaves</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {UPCOMING.map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-brand-900 text-sm">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground">{u.dates}</p>
                    </div>
                    <Badge className="bg-brand-100 text-brand-800 border-brand-300 hover:bg-brand-100">{u.type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-5 pt-5">
          <Card className="border-brand-300/40">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-brand-50 border-b border-gray-200">
                  <tr className="text-left text-[11px] font-semibold text-brand-700 uppercase tracking-wider">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3">To</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Applied On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {MY_REQUESTS.map((r, i) => (
                    <tr key={i} className="hover:bg-brand-50/50">
                      <td className="px-4 py-3 font-medium text-brand-900">{r.type}</td>
                      <td className="px-4 py-3">{r.from}</td>
                      <td className="px-4 py-3">{r.to}</td>
                      <td className="px-4 py-3">{r.days}</td>
                      <td className="px-4 py-3"><Badge className={statusClass(r.status)}>{r.status}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{r.applied}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="pt-5">
          <Card className="border-brand-300/40">
            <CardHeader>
              <CardTitle className="text-base text-brand-900">Team Calendar — April 2025</CardTitle>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Annual Leave</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Sick</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Casual</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Without Pay</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
                  <div key={d} className="text-[10px] font-semibold text-brand-700 text-center pb-2 uppercase">{d}</div>
                ))}
                {Array.from({length:30}).map((_,i)=>{
                  const dayNum = i+1;
                  const isWeekend = (i%7===5)||(i%7===6);
                  const dots = [];
                  if(dayNum===10||dayNum===11||dayNum===12) dots.push("bg-emerald-500");
                  if(dayNum===8||dayNum===9) dots.push("bg-amber-500");
                  if(dayNum===15) dots.push("bg-sky-500");
                  return (
                    <div key={i} className={`h-16 rounded-md border border-gray-200 p-1.5 ${isWeekend?"bg-brand-100/30":"bg-white"}`}>
                      <div className="text-xs font-semibold text-brand-900">{dayNum}</div>
                      <div className="flex gap-0.5 mt-1">
                        {dots.map((c,idx)=><div key={idx} className={`h-1.5 w-1.5 rounded-full ${c}`}/>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-5 pt-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="border-brand-300/40">
              <CardHeader>
                <CardTitle className="text-base text-brand-900">Leave Utilization by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={DEPT_UTIL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="days" fill="#322E53" radius={[4,4,0,0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-brand-300/40">
              <CardHeader>
                <CardTitle className="text-base text-brand-900">Leave Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={TYPE_DIST} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {TYPE_DIST.map((e,i)=><Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize:11}} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
