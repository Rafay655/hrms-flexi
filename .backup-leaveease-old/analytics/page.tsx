"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Users, Clock } from "lucide-react";

const KPI = [
  { label: "Total Leave Days (YTD)", value: "847", icon: Calendar, delta: "+12%", positive: false },
  { label: "Average per Employee", value: "6.8", sub: "days", icon: Users, delta: "+0.5", positive: false },
  { label: "Sick Leave Rate", value: "12.3%", icon: TrendingUp, delta: "-2.1%", positive: true },
  { label: "Pending Requests", value: "23", icon: Clock, delta: "+5", positive: false },
];

const MONTHLY_TREND = [
  { month: "Jan", annual: 45, sick: 18, casual: 12 },
  { month: "Feb", annual: 52, sick: 14, casual: 15 },
  { month: "Mar", annual: 68, sick: 22, casual: 18 },
  { month: "Apr", annual: 75, sick: 28, casual: 14 },
  { month: "May", annual: 62, sick: 19, casual: 16 },
  { month: "Jun", annual: 58, sick: 17, casual: 11 },
  { month: "Jul", annual: 89, sick: 15, casual: 13 },
  { month: "Aug", annual: 71, sick: 20, casual: 17 },
  { month: "Sep", annual: 64, sick: 24, casual: 19 },
  { month: "Oct", annual: 55, sick: 26, casual: 14 },
  { month: "Nov", annual: 48, sick: 18, casual: 12 },
  { month: "Dec", annual: 96, sick: 14, casual: 10 },
];

const DEPT_LEAVE = [
  { dept: "Engineering", days: 187 },
  { dept: "Sales", days: 142 },
  { dept: "Operations", days: 134 },
  { dept: "Finance", days: 98 },
  { dept: "Marketing", days: 86 },
  { dept: "HR", days: 72 },
  { dept: "Design", days: 58 },
  { dept: "Legal", days: 34 },
];

const TYPE_DIST = [
  { name: "Annual", value: 783, color: "#322E53" },
  { name: "Sick", value: 235, color: "#EEC293" },
  { name: "Casual", value: 171, color: "#F3AB9D" },
  { name: "Compensatory", value: 64, color: "#49426E" },
];

const TOP_EMPLOYEES = [
  { name: "Muqadas Mazhar", days: 18, dept: "Engineering" },
  { name: "Ali Nawab", days: 16, dept: "Sales" },
  { name: "Asra Arif", days: 15, dept: "Finance" },
  { name: "Ahmad Faraz", days: 14, dept: "Engineering" },
  { name: "Husnain Arshad", days: 13, dept: "Operations" },
  { name: "Uswa Ziyad", days: 12, dept: "HR" },
  { name: "Rana Humza Yousaf", days: 12, dept: "Product" },
  { name: "Syed Wafa Abbas", days: 11, dept: "Engineering" },
  { name: "Agha Umer", days: 11, dept: "Sales" },
  { name: "Ayesha Malik", days: 10, dept: "Marketing" },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Leave Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Workforce availability and leave utilization insights
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-brand-300/40 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <Icon className="h-4 w-4 text-brand-800" />
                  </div>
                  <Badge
                    className={
                      k.positive
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }
                  >
                    {k.delta}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold text-brand-900 mt-1">
                  {k.value}
                  {k.sub && <span className="text-sm font-normal text-muted-foreground ml-1">{k.sub}</span>}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-brand-300/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-brand-900">
              Monthly Leave Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={MONTHLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="annual" stackId="a" fill="#322E53" name="Annual" />
                <Bar dataKey="sick" stackId="a" fill="#EEC293" name="Sick" />
                <Bar dataKey="casual" stackId="a" fill="#F3AB9D" name="Casual" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-brand-300/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-brand-900">
              Leave by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={DEPT_LEAVE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="days" fill="#322E53" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-brand-300/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-brand-900">
              Leave Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={TYPE_DIST}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {TYPE_DIST.map((e, i) => (
                    <Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-brand-300/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-brand-900">
              Top 10 Employees by Leave Taken
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {TOP_EMPLOYEES.map((e, i) => (
              <div
                key={e.name}
                className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-800">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-brand-900">{e.name}</p>
                    <p className="text-[11px] text-muted-foreground">{e.dept}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-brand-900">
                  {e.days} days
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
