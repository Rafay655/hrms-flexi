"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileBarChart, Search, Plus, Clock, Play, Pause,
  Mail, Calendar, Settings, Users, BarChart3,
} from "lucide-react";

/* ── Mock data ─────────────────────────────────────────────────────────────── */

const modules = ["All", "LeaveEase", "TimeSync", "PayEdge", "PeopleHub"] as const;

const moduleBadgeClass: Record<string, string> = {
  LeaveEase: "bg-purple-100 text-purple-700 border-purple-200",
  TimeSync:  "bg-blue-100 text-blue-700 border-blue-200",
  PayEdge:   "bg-green-100 text-green-700 border-green-200",
  PeopleHub: "bg-amber-100 text-amber-700 border-amber-200",
};

const schedules = [
  { id: 1,  name: "Monthly Attendance Summary", module: "TimeSync",  freq: "Monthly",    recipients: 5,  nextRun: "2026-05-01 08:00", lastRun: "2026-04-01 08:00", status: "Active"  },
  { id: 2,  name: "Leave Balance Report",       module: "LeaveEase", freq: "Weekly",      recipients: 3,  nextRun: "2026-04-17 09:00", lastRun: "2026-04-10 09:00", status: "Active"  },
  { id: 3,  name: "Payroll Register",           module: "PayEdge",   freq: "Monthly",     recipients: 4,  nextRun: "2026-05-01 07:00", lastRun: "2026-04-01 07:00", status: "Active"  },
  { id: 4,  name: "Headcount Report",           module: "PeopleHub", freq: "Quarterly",   recipients: 6,  nextRun: "2026-07-01 10:00", lastRun: "2026-04-01 10:00", status: "Active"  },
  { id: 5,  name: "Overtime Summary",           module: "TimeSync",  freq: "Bi-weekly",   recipients: 2,  nextRun: "2026-04-27 08:30", lastRun: "2026-04-13 08:30", status: "Active"  },
  { id: 6,  name: "Leave Trend Analysis",       module: "LeaveEase", freq: "Monthly",     recipients: 3,  nextRun: "2026-05-01 11:00", lastRun: "2026-04-01 11:00", status: "Paused"  },
  { id: 7,  name: "Tax Computation Sheet",      module: "PayEdge",   freq: "Monthly",     recipients: 2,  nextRun: "2026-05-01 06:00", lastRun: "2026-04-01 06:00", status: "Active"  },
  { id: 8,  name: "Employee Directory",         module: "PeopleHub", freq: "Monthly",     recipients: 1,  nextRun: "2026-05-01 12:00", lastRun: "2026-04-01 12:00", status: "Active"  },
  { id: 9,  name: "Late Arrivals Report",       module: "TimeSync",  freq: "Daily",       recipients: 1,  nextRun: "2026-04-14 07:00", lastRun: "2026-04-13 07:00", status: "Active"  },
  { id: 10, name: "Encashment Liability",       module: "LeaveEase", freq: "Quarterly",   recipients: 1,  nextRun: "2026-07-01 09:00", lastRun: "2026-04-01 09:00", status: "Paused"  },
];

const stats = [
  { label: "Active Schedules",   value: "12",             icon: FileBarChart, color: "text-brand-700" },
  { label: "Reports Generated",  value: "156 this month", icon: BarChart3,    color: "text-brand-700" },
  { label: "Recipients",         value: "28",             icon: Mail,         color: "text-brand-700" },
  { label: "Next Run",           value: "in 2 hours",     icon: Clock,        color: "text-brand-700" },
];

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function ScheduledReportsPage() {
  const [activeModule, setActiveModule] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = schedules.filter((s) => {
    const matchModule = activeModule === "All" || s.module === activeModule;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchModule && matchSearch;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-900">
            <FileBarChart className="h-6 w-6 text-brand-700" />
            Scheduled Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automated report generation and distribution across all modules
          </p>
        </div>
        <Button className="bg-brand-700 hover:bg-brand-800 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Schedule
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-brand-100 p-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-lg font-semibold text-brand-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <Button
              key={m}
              size="sm"
              variant={activeModule === m ? "default" : "outline"}
              className={
                activeModule === m
                  ? "bg-brand-700 hover:bg-brand-800 text-white"
                  : "text-brand-700 border-brand-200 hover:bg-brand-100"
              }
              onClick={() => setActiveModule(m)}
            >
              {m}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-brand-900 text-base">
            Scheduled Reports ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-brand-100/50 text-left text-xs font-medium text-brand-700">
                <th className="px-4 py-3">Report Name</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3">Next Run</th>
                <th className="px-4 py-3">Last Run</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-brand-900">{r.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={moduleBadgeClass[r.module]}>
                      {r.module}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.freq}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.recipients}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.nextRun}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.lastRun}</td>
                  <td className="px-4 py-3">
                    {r.status === "Active" ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                        <Play className="mr-1 h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                        <Pause className="mr-1 h-3 w-3" /> Paused
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-500 hover:text-brand-700">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No scheduled reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
