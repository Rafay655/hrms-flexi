"use client";

import React from "react";
import { Calendar, Heart, CoffeeIcon, Baby, Clock, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Balance = {
  type: string;
  icon: any;
  used: number;
  total: number;
  carryForward?: number;
  expires?: string;
  color: string;
  iconBg: string;
};

const BALANCES: Balance[] = [
  {
    type: "Annual Leave",
    icon: Calendar,
    used: 6,
    total: 20,
    carryForward: 4,
    expires: "Dec 31 2025",
    color: "bg-emerald-500",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    type: "Sick Leave",
    icon: Heart,
    used: 2,
    total: 10,
    color: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-700",
  },
  {
    type: "Casual Leave",
    icon: CoffeeIcon,
    used: 3,
    total: 5,
    color: "bg-sky-500",
    iconBg: "bg-sky-100 text-sky-700",
  },
  {
    type: "Compensatory Off",
    icon: Clock,
    used: 0,
    total: 3,
    color: "bg-violet-500",
    iconBg: "bg-violet-100 text-violet-700",
  },
  {
    type: "Maternity/Paternity",
    icon: Baby,
    used: 0,
    total: 90,
    color: "bg-pink-500",
    iconBg: "bg-pink-100 text-pink-700",
  },
  {
    type: "Hajj Leave",
    icon: Award,
    used: 0,
    total: 30,
    color: "bg-brand-600",
    iconBg: "bg-brand-100 text-brand-700",
  },
];

const RECENT = [
  { type: "Annual Leave", dates: "Feb 12 – Feb 14", days: 3, status: "Approved" },
  { type: "Casual Leave", dates: "Mar 5", days: 1, status: "Approved" },
  { type: "Sick Leave", dates: "Mar 20", days: 1, status: "Approved" },
  { type: "Annual Leave", dates: "Apr 10 – Apr 12", days: 3, status: "Pending" },
  { type: "Annual Leave", dates: "May 1", days: 1, status: "Pending" },
];

const statusClass = (s: string) =>
  s === "Approved"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : s === "Pending"
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-gray-100 text-gray-700 border-gray-200";

export default function BalancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">My Leave Balance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Current entitlement and utilization
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {BALANCES.map((b) => {
          const Icon = b.icon;
          const remaining = b.total - b.used;
          const pct = (b.used / b.total) * 100;
          return (
            <Card key={b.type} className="border-brand-300/40 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${b.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-brand-900">{b.type}</p>
                    {b.expires && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Expires {b.expires}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-2xl font-bold text-brand-900">{remaining}</span>
                    <span className="text-xs text-muted-foreground">/ {b.total} days</span>
                  </div>
                  <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                    <div className={`h-full ${b.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{b.used} used</span>
                  <span>{remaining} remaining</span>
                </div>

                {b.carryForward !== undefined && b.carryForward > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Badge variant="outline" className="text-[10px] border-brand-300 text-brand-700">
                      +{b.carryForward} carried forward
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-brand-300/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-brand-900">Recent Leave History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 border-b border-gray-200">
              <tr className="text-left text-[11px] font-semibold text-brand-700 uppercase tracking-wider">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {RECENT.map((r, i) => (
                <tr key={i} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-medium text-brand-900">{r.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.dates}</td>
                  <td className="px-4 py-3">{r.days}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusClass(r.status)}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
