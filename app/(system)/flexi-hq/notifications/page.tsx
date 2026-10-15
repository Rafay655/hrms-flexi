"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, Search, Send, CheckCircle2, XCircle, Clock,
  Mail, Smartphone, MessageSquare, Volume2, Settings2,
  ToggleLeft, ToggleRight, FileText, AlertTriangle,
} from "lucide-react";

/* ── Mock data ── */

const CATEGORIES = [
  { name: "Leave", module: "LeaveEase", enabled: true, email: true, push: true, inApp: true, sms: false },
  { name: "Attendance", module: "TimeSync", enabled: true, email: true, push: true, inApp: true, sms: true },
  { name: "Payroll", module: "PayEdge", enabled: true, email: true, push: false, inApp: true, sms: false },
  { name: "HR", module: "PeopleHub", enabled: true, email: true, push: true, inApp: true, sms: false },
];

const TEMPLATES = [
  { id: "TPL-001", event: "Leave Request Submitted", module: "LeaveEase", channels: ["Email", "Push", "In-App"], status: "Active" },
  { id: "TPL-002", event: "Leave Approved", module: "LeaveEase", channels: ["Email", "In-App"], status: "Active" },
  { id: "TPL-003", event: "Shift Change Alert", module: "TimeSync", channels: ["Push", "SMS"], status: "Active" },
  { id: "TPL-004", event: "Late Arrival Warning", module: "TimeSync", channels: ["Email", "In-App"], status: "Active" },
  { id: "TPL-005", event: "Payslip Generated", module: "PayEdge", channels: ["Email", "Push", "In-App"], status: "Active" },
  { id: "TPL-006", event: "Salary Revision Notice", module: "PayEdge", channels: ["Email"], status: "Draft" },
  { id: "TPL-007", event: "Onboarding Welcome", module: "PeopleHub", channels: ["Email", "In-App"], status: "Active" },
  { id: "TPL-008", event: "Probation Reminder", module: "PeopleHub", channels: ["Email", "Push"], status: "Active" },
  { id: "TPL-009", event: "EOBI Contribution Alert", module: "PayEdge", channels: ["Email"], status: "Draft" },
  { id: "TPL-010", event: "Hajj Leave Approved", module: "LeaveEase", channels: ["Email", "Push", "SMS"], status: "Active" },
];

const LOGS = [
  { id: 1, recipient: "Ahmed Raza", event: "Leave Approved", channel: "Email", status: "Delivered", timestamp: "2026-04-13 09:15:22" },
  { id: 2, recipient: "Fatima Khan", event: "Payslip Generated", channel: "Push", status: "Delivered", timestamp: "2026-04-13 09:10:45" },
  { id: 3, recipient: "Omar Farooq", event: "Shift Change Alert", channel: "SMS", status: "Failed", timestamp: "2026-04-13 09:05:11" },
  { id: 4, recipient: "Sana Malik", event: "Onboarding Welcome", channel: "Email", status: "Delivered", timestamp: "2026-04-13 08:55:30" },
  { id: 5, recipient: "Bilal Ahmed", event: "Late Arrival Warning", channel: "In-App", status: "Delivered", timestamp: "2026-04-13 08:45:18" },
  { id: 6, recipient: "Hira Noor", event: "Probation Reminder", channel: "Email", status: "Pending", timestamp: "2026-04-13 08:30:00" },
  { id: 7, recipient: "Zain Abbas", event: "Leave Request Submitted", channel: "Push", status: "Delivered", timestamp: "2026-04-13 08:22:14" },
  { id: 8, recipient: "Ayesha Siddiqui", event: "Salary Revision Notice", channel: "Email", status: "Delivered", timestamp: "2026-04-13 08:10:05" },
  { id: 9, recipient: "Hamza Tariq", event: "EOBI Contribution Alert", channel: "Email", status: "Failed", timestamp: "2026-04-13 07:55:42" },
  { id: 10, recipient: "Nadia Bashir", event: "Hajj Leave Approved", channel: "SMS", status: "Delivered", timestamp: "2026-04-13 07:40:33" },
];

const moduleBadgeColor: Record<string, string> = {
  LeaveEase: "bg-purple-100 text-purple-800",
  TimeSync: "bg-blue-100 text-blue-800",
  PayEdge: "bg-green-100 text-green-800",
  PeopleHub: "bg-amber-100 text-amber-800",
};

const channelIcon: Record<string, React.ReactNode> = {
  Email: <Mail className="h-3.5 w-3.5" />,
  Push: <Smartphone className="h-3.5 w-3.5" />,
  "In-App": <MessageSquare className="h-3.5 w-3.5" />,
  SMS: <Volume2 className="h-3.5 w-3.5" />,
};

const statusBadge: Record<string, string> = {
  Delivered: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Active: "bg-green-100 text-green-800",
  Draft: "bg-gray-100 text-gray-600",
};

export default function NotificationCenterPage() {
  const [search, setSearch] = useState("");
  const [masterToggle, setMasterToggle] = useState(true);
  const [categories, setCategories] = useState(CATEGORIES);

  const toggleCategory = (idx: number) => {
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, enabled: !c.enabled } : c)));
  };

  const toggleChannel = (idx: number, channel: "email" | "push" | "inApp" | "sms") => {
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, [channel]: !c[channel] } : c)));
  };

  const stats = [
    { label: "Total Sent (24h)", value: "1,247", icon: Send, color: "text-brand-800" },
    { label: "Delivery Rate", value: "97.2%", icon: CheckCircle2, color: "text-green-600" },
    { label: "Failed", value: "35", icon: XCircle, color: "text-red-600" },
    { label: "Active Templates", value: TEMPLATES.filter((t) => t.status === "Active").length, icon: FileText, color: "text-blue-600" },
  ];

  const filteredTemplates = TEMPLATES.filter(
    (t) => t.event.toLowerCase().includes(search.toLowerCase()) || t.module.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = LOGS.filter(
    (l) => l.recipient.toLowerCase().includes(search.toLowerCase()) || l.event.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notification Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage notification preferences, templates, and delivery tracking across all modules
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-900">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-brand-900">Master Notification Toggle</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMasterToggle(!masterToggle)}
                  className={masterToggle ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-500"}
                >
                  {masterToggle ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {masterToggle ? "All notifications are enabled. Configure per-category settings below." : "All notifications are currently disabled system-wide."}
              </p>
            </CardContent>
          </Card>

          {masterToggle && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider">Category & Channel Settings</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brand-100/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-brand-900">Category</th>
                      <th className="px-4 py-3 text-left font-semibold text-brand-900">Module</th>
                      <th className="px-4 py-3 text-center font-semibold text-brand-900">Enabled</th>
                      <th className="px-4 py-3 text-center font-semibold text-brand-900">Email</th>
                      <th className="px-4 py-3 text-center font-semibold text-brand-900">Push</th>
                      <th className="px-4 py-3 text-center font-semibold text-brand-900">In-App</th>
                      <th className="px-4 py-3 text-center font-semibold text-brand-900">SMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categories.map((cat, idx) => (
                      <tr key={cat.name} className="hover:bg-brand-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-brand-900">{cat.name}</td>
                        <td className="px-4 py-3">
                          <Badge className={moduleBadgeColor[cat.module]}>{cat.module}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => toggleCategory(idx)}
                            className={cat.enabled ? "text-green-600" : "text-gray-400"}>
                            {cat.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </Button>
                        </td>
                        {(["email", "push", "inApp", "sms"] as const).map((ch) => (
                          <td key={ch} className="px-4 py-3 text-center">
                            <Button variant="ghost" size="sm" onClick={() => toggleChannel(idx, ch)}
                              disabled={!cat.enabled}
                              className={cat[ch] && cat.enabled ? "text-brand-800" : "text-gray-300"}>
                              {cat[ch] && cat.enabled ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button className="bg-brand-800 text-white hover:bg-brand-700 gap-2">
              <Settings2 className="h-4 w-4" /> New Template
            </Button>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-100/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Event</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Module</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Channels</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-900">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-brand-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTemplates.map((t) => (
                  <tr key={t.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-900">{t.event}</p>
                      <p className="text-xs text-muted-foreground">{t.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={moduleBadgeColor[t.module]}>{t.module}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {t.channels.map((ch) => (
                          <span key={ch} className="inline-flex items-center gap-1 rounded-full bg-brand-100 text-brand-800 px-2 py-0.5 text-xs">
                            {channelIcon[ch]} {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={statusBadge[t.status]}>{t.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm"><Settings2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search delivery logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-100/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Recipient</th>
                  <th className="px-4 py-3 text-left font-semibold text-brand-900">Event</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-900">Channel</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-900">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-brand-900">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-brand-800 text-white text-[10px] font-bold flex items-center justify-center">
                          {l.recipient.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="font-medium text-brand-900">{l.recipient}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-700">{l.event}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-brand-800">
                        {channelIcon[l.channel]} {l.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={statusBadge[l.status]}>
                        {l.status === "Delivered" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {l.status === "Failed" && <XCircle className="h-3 w-3 mr-1" />}
                        {l.status === "Pending" && <Clock className="h-3 w-3 mr-1" />}
                        {l.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs text-brand-700">
                        <Clock className="h-3 w-3 text-brand-500" />
                        {l.timestamp}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
