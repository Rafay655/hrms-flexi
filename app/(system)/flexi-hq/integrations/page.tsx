"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plug, Search, Settings2, CheckCircle2, AlertTriangle, RefreshCw,
  Wifi, Globe, Smartphone, Mail, MessageSquare, Calendar, Fingerprint,
  MapPin, CreditCard, Building2, ShieldCheck, Clock, CloudOff,
} from "lucide-react";

const ACTIVE_INTEGRATIONS = [
  { id: 1, name: "EOBI Portal", module: "PayEdge", status: "Active", icon: Building2, lastSync: "2 min ago", desc: "EOBI contribution auto-submission" },
  { id: 2, name: "Provincial Social Security", module: "PayEdge", status: "Active", icon: ShieldCheck, lastSync: "5 min ago", desc: "PESSI / SESSI contribution filing" },
  { id: 3, name: "Bank Transfer API", module: "PayEdge", status: "Active", icon: CreditCard, lastSync: "12 min ago", desc: "Salary disbursement via bank APIs" },
  { id: 4, name: "Biometric Devices", module: "TimeSync", status: "Active", icon: Fingerprint, lastSync: "1 min ago", desc: "ZKTeco & Suprema device sync" },
  { id: 5, name: "GPS Tracking", module: "TimeSync", status: "Active", icon: MapPin, lastSync: "3 min ago", desc: "Field staff location tracking" },
  { id: 6, name: "Email / SMTP", module: "PeopleHub", status: "Active", icon: Mail, lastSync: "8 min ago", desc: "Transactional email delivery" },
  { id: 7, name: "WhatsApp Notifications", module: "PeopleHub", status: "Warning", icon: MessageSquare, lastSync: "45 min ago", desc: "Employee notification via WhatsApp" },
  { id: 8, name: "Calendar Sync", module: "LeaveEase", status: "Active", icon: Calendar, lastSync: "4 min ago", desc: "Google & Outlook calendar sync" },
];

const AVAILABLE_INTEGRATIONS = [
  { id: 9, name: "FBR Tax Portal", module: "PayEdge", icon: Globe, desc: "Automated tax return e-filing" },
  { id: 10, name: "SAP Finance", module: "PayEdge", icon: Building2, desc: "Journal voucher export to SAP FICO" },
  { id: 11, name: "Slack Notifications", module: "PeopleHub", icon: MessageSquare, desc: "Team notifications via Slack" },
  { id: 12, name: "Zoom Meetings", module: "TimeSync", icon: Wifi, desc: "Virtual meeting attendance tracking" },
  { id: 13, name: "Oracle HCM", module: "PeopleHub", icon: Globe, desc: "Employee data import from Oracle" },
  { id: 14, name: "Mobile App SDK", module: "LeaveEase", icon: Smartphone, desc: "Native mobile leave requests" },
];

const SYNC_LOGS = [
  { id: 1, integration: "Biometric Devices", event: "Sync completed", status: "Success", time: "09:12 AM", records: 342 },
  { id: 2, integration: "EOBI Portal", event: "Monthly submission sent", status: "Success", time: "09:10 AM", records: 485 },
  { id: 3, integration: "WhatsApp Notifications", event: "Rate limit warning", status: "Warning", time: "09:05 AM", records: 0 },
  { id: 4, integration: "Bank Transfer API", event: "Salary batch processed", status: "Success", time: "08:45 AM", records: 485 },
  { id: 5, integration: "Calendar Sync", event: "Leave events pushed", status: "Success", time: "08:30 AM", records: 28 },
  { id: 6, integration: "GPS Tracking", event: "Location data synced", status: "Success", time: "08:15 AM", records: 156 },
  { id: 7, integration: "Email / SMTP", event: "Batch delivery completed", status: "Success", time: "08:00 AM", records: 73 },
  { id: 8, integration: "Provincial Social Security", event: "Contribution filed", status: "Success", time: "07:30 AM", records: 485 },
];

const moduleColor: Record<string, string> = {
  PayEdge: "bg-green-100 text-green-800",
  TimeSync: "bg-blue-100 text-blue-800",
  PeopleHub: "bg-amber-100 text-amber-800",
  LeaveEase: "bg-purple-100 text-purple-800",
};

const statusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Warning: "bg-yellow-100 text-yellow-700",
  Success: "bg-green-100 text-green-700",
};

const statusIcon: Record<string, React.ReactNode> = {
  Active: <CheckCircle2 className="h-3.5 w-3.5" />,
  Warning: <AlertTriangle className="h-3.5 w-3.5" />,
};

export default function IntegrationHubPage() {
  const [search, setSearch] = useState("");

  const filteredActive = ACTIVE_INTEGRATIONS.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.module.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAvailable = AVAILABLE_INTEGRATIONS.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.module.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Active Integrations", value: 8, icon: Plug, color: "text-green-600" },
    { label: "Modules Connected", value: 4, icon: Wifi, color: "text-brand-800" },
    { label: "Sync Errors", value: 1, icon: AlertTriangle, color: "text-yellow-600" },
    { label: "Last Sync", value: "2 min ago", icon: Clock, color: "text-blue-600" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <Plug className="h-6 w-6" /> Integration Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all third-party connections across Flexi HRMS modules
          </p>
        </div>
        <Button className="bg-brand-800 text-white hover:bg-brand-700 gap-2">
          <RefreshCw className="h-4 w-4" /> Sync All
        </Button>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search integrations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-brand-100">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Active Tab */}
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredActive.map((intg) => (
              <Card key={intg.id} className="border-border shadow-none hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                      <intg.icon className="h-5 w-5 text-brand-700" />
                    </div>
                    <Badge className={`gap-1 ${statusColor[intg.status]}`}>
                      {statusIcon[intg.status]} {intg.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-brand-900 mt-2">{intg.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{intg.desc}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={moduleColor[intg.module]}>{intg.module}</Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {intg.lastSync}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-brand-800 border-brand-500 hover:bg-brand-100 gap-1">
                    <Settings2 className="h-3.5 w-3.5" /> Configure
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Available Tab */}
        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailable.map((intg) => (
              <Card key={intg.id} className="border-border shadow-none border-dashed hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <intg.icon className="h-5 w-5 text-gray-500" />
                    </div>
                    <Badge variant="outline" className="text-muted-foreground gap-1">
                      <CloudOff className="h-3 w-3" /> Not Connected
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-brand-900 mt-2">{intg.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{intg.desc}</p>
                  <Badge className={moduleColor[intg.module]}>{intg.module}</Badge>
                  <Button size="sm" className="w-full bg-brand-800 text-white hover:bg-brand-700 gap-1">
                    <Plug className="h-3.5 w-3.5" /> Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-brand-900">Recent Sync Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brand-100/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-brand-900">Integration</th>
                      <th className="px-4 py-3 text-left font-semibold text-brand-900">Event</th>
                      <th className="px-4 py-3 text-center font-semibold text-brand-900">Status</th>
                      <th className="px-4 py-3 text-right font-semibold text-brand-900">Records</th>
                      <th className="px-4 py-3 text-right font-semibold text-brand-900">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {SYNC_LOGS.map((log) => (
                      <tr key={log.id} className="hover:bg-brand-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-brand-900">{log.integration}</td>
                        <td className="px-4 py-3 text-muted-foreground">{log.event}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`gap-1 ${statusColor[log.status]}`}>
                            {log.status === "Success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-brand-700">{log.records.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
