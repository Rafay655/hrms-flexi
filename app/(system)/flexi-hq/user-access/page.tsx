"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  ShieldCheck, Search, Plus, Users, Settings2, Eye, Edit, Trash2,
  Clock, UserCheck, Mail, Activity, KeyRound, LayoutGrid,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const roles = [
  { name: "Super Admin", desc: "Full system access", users: 3, modules: ["PeopleHub", "LeaveEase", "PayEdge", "TimeSync"], status: "Active" },
  { name: "HR Manager", desc: "HR operations & approvals", users: 12, modules: ["PeopleHub", "LeaveEase", "PayEdge"], status: "Active" },
  { name: "Department Head", desc: "Team oversight & leave approvals", users: 28, modules: ["LeaveEase", "TimeSync"], status: "Active" },
  { name: "Payroll Officer", desc: "Salary processing & reports", users: 5, modules: ["PayEdge"], status: "Active" },
  { name: "Employee", desc: "Self-service portal access", users: 289, modules: ["PeopleHub", "LeaveEase", "PayEdge", "TimeSync"], status: "Active" },
  { name: "TimeSync Admin", desc: "Attendance & shift management", users: 4, modules: ["TimeSync"], status: "Active" },
  { name: "Leave Admin", desc: "Leave policy & quota management", users: 3, modules: ["LeaveEase"], status: "Active" },
  { name: "Auditor", desc: "Read-only access across modules", users: 3, modules: ["PeopleHub", "LeaveEase", "PayEdge", "TimeSync"], status: "Active" },
];

const users = [
  { name: "Sana Ahmed", email: "sana.ahmed@company.pk", role: "Super Admin", dept: "IT", lastActive: "2 min ago", status: "Online" },
  { name: "Muhammad Ali", email: "m.ali@company.pk", role: "HR Manager", dept: "Human Resources", lastActive: "15 min ago", status: "Online" },
  { name: "Ayesha Malik", email: "ayesha.malik@company.pk", role: "Department Head", dept: "Finance", lastActive: "1 hr ago", status: "Away" },
  { name: "Bilal Hassan", email: "bilal.hassan@company.pk", role: "Payroll Officer", dept: "Finance", lastActive: "3 hrs ago", status: "Offline" },
  { name: "Hira Khan", email: "hira.khan@company.pk", role: "Employee", dept: "Marketing", lastActive: "30 min ago", status: "Online" },
  { name: "Umar Farooq", email: "umar.farooq@company.pk", role: "TimeSync Admin", dept: "Operations", lastActive: "5 hrs ago", status: "Offline" },
  { name: "Fatima Zahra", email: "fatima.zahra@company.pk", role: "Leave Admin", dept: "Human Resources", lastActive: "45 min ago", status: "Away" },
  { name: "Asad Raza", email: "asad.raza@company.pk", role: "Auditor", dept: "Compliance", lastActive: "1 day ago", status: "Offline" },
];

const activityLog = [
  { time: "Today 09:15", user: "Sana Ahmed", action: "Assigned Super Admin role to new user", type: "Role Change" },
  { time: "Today 08:42", user: "Muhammad Ali", action: "Updated HR Manager permissions for PayEdge module", type: "Permission" },
  { time: "Yesterday 17:30", user: "Sana Ahmed", action: "Revoked access for former employee Kamran Sheikh", type: "Access Revoked" },
  { time: "Yesterday 14:10", user: "Fatima Zahra", action: "Created new Leave Admin role with custom policy", type: "Role Created" },
  { time: "12 Apr 2026", user: "Muhammad Ali", action: "Sent 5 invitation emails to new hires", type: "Invite" },
  { time: "11 Apr 2026", user: "Sana Ahmed", action: "Enabled two-factor authentication for all admins", type: "Security" },
  { time: "10 Apr 2026", user: "Ayesha Malik", action: "Exported user access report for Q1 audit", type: "Export" },
];

const stats = [
  { label: "Total Roles", value: 8, icon: KeyRound, color: "text-brand-700" },
  { label: "Active Users", value: 347, icon: Users, color: "text-brand-500" },
  { label: "Pending Invites", value: 5, icon: Mail, color: "text-amber-600" },
  { label: "Modules", value: 4, icon: LayoutGrid, color: "text-brand-900" },
];

const moduleBadgeColor: Record<string, string> = {
  PeopleHub: "bg-brand-100 text-brand-800",
  LeaveEase: "bg-emerald-100 text-emerald-800",
  PayEdge: "bg-amber-100 text-amber-800",
  TimeSync: "bg-sky-100 text-sky-800",
};

const statusDot: Record<string, string> = {
  Online: "bg-emerald-500",
  Away: "bg-amber-400",
  Offline: "bg-gray-300",
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function UserAccessPage() {
  const [search, setSearch] = useState("");

  const filteredRoles = roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-900">
          <ShieldCheck className="h-7 w-7 text-brand-700" /> User Access &amp; Roles
        </h1>
        <p className="text-sm text-muted-foreground">Manage roles, permissions, and access control across all modules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search roles or users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="bg-brand-700 hover:bg-brand-800 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* ---------- Roles Tab ---------- */}
        <TabsContent value="roles">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Role Name</th><th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-center">Users</th><th className="px-4 py-3">Modules</th>
                    <th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((r) => (
                    <tr key={r.name} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.desc}</td>
                      <td className="px-4 py-3 text-center">{r.users}</td>
                      <td className="flex flex-wrap gap-1 px-4 py-3">
                        {r.modules.map((m) => (
                          <Badge key={m} variant="secondary" className={moduleBadgeColor[m]}>{m}</Badge>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="border-brand-500 text-brand-700">{r.status}</Badge>
                      </td>
                      <td className="flex justify-end gap-1 px-4 py-3">
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Users Tab ---------- */}
        <TabsContent value="users">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th><th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Last Active</th><th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.email} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3"><Badge className="bg-brand-100 text-brand-800">{u.role}</Badge></td>
                      <td className="px-4 py-3">{u.dept}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.lastActive}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`h-2 w-2 rounded-full ${statusDot[u.status]}`} /> {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- Activity Log Tab ---------- */}
        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Access Events</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {activityLog.map((log, i) => (
                <div key={i} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <Activity className="mt-0.5 h-4 w-4 text-brand-500" />
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-medium">{log.user}</span> &mdash; {log.action}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {log.time}
                      <Badge variant="outline" className="ml-1 text-[10px]">{log.type}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
