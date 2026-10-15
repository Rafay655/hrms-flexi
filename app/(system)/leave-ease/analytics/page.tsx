// app/flexi-hq/analytics/leave/page.tsx
"use client";

import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  DollarSign,
  Download,
  Users,
  Filter,
  Calendar,
  Target,
  Info,
  Search,
  X,
  ChevronRight,
  TrendingDown,
  LayoutDashboard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const LeaveAnalytics = () => {
  const [drillDown, setDrillDown] = useState<string | null>(null);

  const kpis = [
    {
      label: "Avg Days / Employee",
      value: "8.5",
      icon: Users,
      trend: "+0.4",
      trendUp: true,
    },
    {
      label: "Most Used Type",
      value: "Annual",
      sub: "45% of total",
      icon: PieChart,
    },
    {
      label: "Avg Approval Time",
      value: "6.2h",
      icon: Clock,
      trend: "-1.2h",
      trendUp: false,
    },
    {
      label: "Pending Encashment",
      value: "PKR 450k",
      icon: DollarSign,
    },
  ];

  return (
    <div className="p-3 bg-white min-h-screen">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-brand-900">
                  Leave Analytics
                </CardTitle>
                <p className="text-sm text-brand-700 mt-0.5">
                  Strategic insights into workforce availability and leave
                  liabilities.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select defaultValue="2025">
                <SelectTrigger className="w-[120px] border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">Year 2025</SelectItem>
                  <SelectItem value="2024">Year 2024</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] border-gray-200 text-brand-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quarters</SelectItem>
                  <SelectItem value="q1">Q1</SelectItem>
                  <SelectItem value="q2">Q2</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="border-gray-200 text-brand-800 hover:bg-brand-100"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button className="bg-brand-800 hover:bg-brand-900 text-white gap-2">
                <Download className="h-4 w-4" /> Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <Card
                key={i}
                className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-brand-100 text-brand-800 rounded-lg">
                      <kpi.icon size={20} />
                    </div>
                    {kpi.trend && (
                      <Badge
                        className={
                          kpi.trendUp
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }
                      >
                        {kpi.trendUp ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {kpi.trend}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-xl font-bold text-brand-900">
                      {kpi.value}
                    </h4>
                    {kpi.sub && (
                      <span className="text-xs font-medium text-brand-600">
                        {kpi.sub}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Utilization Donut */}
            <Card className="lg:col-span-4 border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider">
                    Utilization by Type
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-brand-600 hover:text-brand-900"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="relative w-48 h-48 mb-6 cursor-pointer"
                    onClick={() => setDrillDown("Utilization Breakdown")}
                  >
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        fill="transparent"
                        stroke="#E2E8F0"
                        strokeWidth="24"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        fill="transparent"
                        stroke="currentColor"
                        className="text-brand-800"
                        strokeWidth="24"
                        strokeDasharray="502"
                        strokeDashoffset="276"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        fill="transparent"
                        stroke="currentColor"
                        className="text-brand-600"
                        strokeWidth="24"
                        strokeDasharray="502"
                        strokeDashoffset="410"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        fill="transparent"
                        stroke="currentColor"
                        className="text-amber-500"
                        strokeWidth="24"
                        strokeDasharray="502"
                        strokeDashoffset="460"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-brand-900">
                        45%
                      </span>
                      <span className="text-xs font-semibold text-brand-600 uppercase">
                        Annual
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-800" />
                      <span className="text-xs font-medium text-brand-700">
                        Annual (45%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-600" />
                      <span className="text-xs font-medium text-brand-700">
                        Casual (25%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-medium text-brand-700">
                        Sick (15%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-300" />
                      <span className="text-xs font-medium text-brand-700">
                        Other (15%)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="lg:col-span-8 border border-gray-200 shadow-sm">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider">
                    Monthly Leave Trend
                  </h3>
                  <div className="flex gap-2">
                    {["All", "Annual", "Sick"].map((f) => (
                      <Button
                        key={f}
                        variant={f === "All" ? "default" : "outline"}
                        size="sm"
                        className={
                          f === "All"
                            ? "bg-brand-800 hover:bg-brand-900 text-white"
                            : "border-gray-200 text-brand-600 hover:bg-brand-50"
                        }
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex items-end justify-between gap-1 relative px-2">
                  <div className="absolute inset-x-4 top-1/2 h-px bg-gray-100 z-0" />
                  <div className="absolute inset-x-4 top-1/4 h-px bg-gray-100 z-0" />
                  <div className="absolute inset-x-4 top-3/4 h-px bg-gray-100 z-0" />

                  {[40, 60, 45, 70, 90, 85, 60, 75, 40, 50, 65, 80].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-2 z-10 group relative"
                      >
                        <div className="w-full max-w-[12px] bg-brand-100 rounded-full h-[180px] relative overflow-hidden">
                          <div
                            className="absolute bottom-0 w-full bg-brand-800 rounded-full transition-all duration-1000"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-brand-600 uppercase">
                          {["J","F","M","A","M","J","J","A","S","O","N","D"][i]}
                        </span>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-900 text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {h} days
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Department Benchmarking */}
            <Card className="lg:col-span-7 border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider">
                    Department Benchmarking
                  </h3>
                  <span className="text-xs font-medium text-brand-600">
                    Avg Days per Employee
                  </span>
                </div>
                <div className="space-y-4">
                  {[
                    { dept: "Sales & Marketing", val: 12.4 },
                    { dept: "Operations", val: 9.8 },
                    { dept: "Engineering", val: 8.5 },
                    { dept: "Product", val: 7.2 },
                    { dept: "Finance", val: 5.4 },
                    { dept: "HR & Admin", val: 4.8 },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className="space-y-2 cursor-pointer group"
                      onClick={() => setDrillDown(`Dept Analysis: ${d.dept}`)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-brand-800 group-hover:text-brand-900 transition-colors">
                          {d.dept}
                        </span>
                        <span className="text-sm font-semibold text-brand-900">
                          {d.val} d
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-800 transition-all duration-1000"
                          style={{ width: `${(d.val / 15) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SLA Gauge & Liability Forecast */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 flex flex-col items-center">
                  <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider mb-6 self-start">
                    Approval Compliance
                  </h3>
                  <div className="relative w-48 h-32 overflow-hidden mb-4">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        fill="transparent"
                        stroke="#E2E8F0"
                        strokeWidth="24"
                        strokeDasharray="251 251"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        fill="transparent"
                        stroke="currentColor"
                        className="text-brand-700"
                        strokeWidth="24"
                        strokeDasharray="236 502"
                      />
                    </svg>
                    <div className="absolute inset-0 top-12 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-brand-900">
                        94%
                      </span>
                      <span className="text-xs font-semibold text-brand-600 uppercase">
                        Within SLA
                      </span>
                    </div>
                  </div>
                  <div className="w-full flex justify-between px-4">
                    <div className="text-center">
                      <p className="text-xs font-medium text-brand-600 uppercase">
                        Current
                      </p>
                      <p className="text-sm font-bold text-brand-900">94%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-brand-600 uppercase">
                        Target
                      </p>
                      <p className="text-sm font-bold text-brand-800">90%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-900 border-0 shadow-lg relative overflow-hidden">
                <CardContent className="p-6 text-white relative z-10 space-y-4">
                  <div className="flex items-center gap-3 text-brand-200">
                    <Target className="h-5 w-5" />
                    <h4 className="font-semibold uppercase tracking-wider text-xs">
                      Liability Forecast
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Based on current trends,{" "}
                    <span className="font-semibold text-brand-200">
                      ~1,200 leave days
                    </span>{" "}
                    will lapse at year-end, reducing corporate liability by{" "}
                    <span className="font-semibold text-brand-200">
                      PKR 2.4M
                    </span>
                    .
                  </p>
                  <Button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white">
                    Run Full Liability Report
                  </Button>
                </CardContent>
                <BarChart3 className="absolute -bottom-10 -right-10 opacity-5 -rotate-12 h-40 w-40" />
              </Card>
            </div>
<div className=" bg-orange-100  lg:col-span-12">

            {/* Top Leave Takers Table */}
            <Card className="  w-full border border-gray-200 shadow-sm overflow-hidden">
                <CardContent>
              <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-700" /> Top Leave
                  Utilization (YTD)
                </h3>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700" />
                  <Input
                    placeholder="Search employee..."
                    className="pl-10 border-gray-200 focus:border-brand-800 text-sm"
                  />
                </div>
              </div>
              <div className="w-full overflow-x-auto bg-black">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                        Days Taken
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                        Primary Types
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-brand-800 uppercase tracking-wider">
                        Trend
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                        {
                            name: "Usman Ali",
                            dept: "Sales",
                            days: 22,
                            types: ["Annual", "Unpaid"],
                        trend: "+15%",
                      },
                      {
                        name: "Sana Khan",
                        dept: "Engineering",
                        days: 18.5,
                        types: ["Sick", "Casual"],
                        trend: "+4%",
                      },
                      {
                        name: "Raza Javeed",
                        dept: "Marketing",
                        days: 16,
                        types: ["Annual"],
                        trend: "-2%",
                      },
                      {
                        name: "Fatima Noor",
                        dept: "Product",
                        days: 15,
                        types: ["Annual", "Maternity"],
                        trend: "+100%",
                      },
                      {
                        name: "Kamran Akmal",
                        dept: "Sales",
                        days: 14.5,
                        types: ["Casual"],
                        trend: "+8%",
                      },
                    ].map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-brand-50 transition-colors cursor-pointer"
                        onClick={() => setDrillDown(`User Focus: ${row.name}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-800 text-xs font-bold uppercase">
                              {row.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="text-sm font-semibold text-brand-900">
                              {row.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-brand-700">
                            {row.dept}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-brand-900">
                            {row.days} d
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5">
                            {row.types.map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="bg-brand-50 text-brand-800 border-brand-200 text-xs"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-xs font-semibold ${
                              row.trend.includes("+")
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {row.trend}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="h-4 w-4 text-brand-400 group-hover:text-brand-800 transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                            </CardContent>
            </Card>
</div>

          </div>
        </CardContent>
      </Card>

      {/* Drill-down Dialog */}
      <Dialog open={!!drillDown} onOpenChange={() => setDrillDown(null)}>
        <DialogContent className="sm:max-w-[500px] border border-gray-200 bg-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-brand-900 px-6 py-4 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 opacity-80" />
                Drill-down Detail
              </DialogTitle>
              <DialogDescription className="text-brand-300 text-xs mt-1">
                {drillDown}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-100 text-brand-800 mx-auto">
                <PieChart className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-brand-900">
                  Dynamic Analysis Ready
                </h4>
                <p className="text-sm text-brand-600 mt-2">
                  In a production environment, this would display filtered
                  lists, correlation metrics, or raw data contributing to the
                  selected chart element.
                </p>
              </div>
              <Button className="bg-brand-800 hover:bg-brand-900 text-white gap-2">
                <Download className="h-4 w-4" /> Export Raw Dataset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveAnalytics;