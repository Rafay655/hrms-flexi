"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LeaveEntry = {
  day: number;
  employee: string;
  initials: string;
  type: "Annual" | "Sick" | "Casual" | "Without Pay";
  department: string;
};

const LEAVES: LeaveEntry[] = [
  { day: 3, employee: "Muqadas Mazhar", initials: "MM", type: "Annual", department: "Engineering" },
  { day: 4, employee: "Muqadas Mazhar", initials: "MM", type: "Annual", department: "Engineering" },
  { day: 8, employee: "Bilal Khan", initials: "BK", type: "Sick", department: "Product" },
  { day: 9, employee: "Bilal Khan", initials: "BK", type: "Sick", department: "Product" },
  { day: 10, employee: "Sana Ahmed", initials: "SA", type: "Annual", department: "Engineering" },
  { day: 11, employee: "Sana Ahmed", initials: "SA", type: "Annual", department: "Engineering" },
  { day: 12, employee: "Sana Ahmed", initials: "SA", type: "Annual", department: "Engineering" },
  { day: 15, employee: "Fatima Noor", initials: "FN", type: "Casual", department: "Design" },
  { day: 17, employee: "Usman Tariq", initials: "UT", type: "Annual", department: "Sales" },
  { day: 18, employee: "Hira Malik", initials: "HM", type: "Sick", department: "Finance" },
  { day: 20, employee: "Ahmad Faraz", initials: "AF", type: "Annual", department: "Engineering" },
  { day: 21, employee: "Ahmad Faraz", initials: "AF", type: "Annual", department: "Engineering" },
  { day: 22, employee: "Ahmad Faraz", initials: "AF", type: "Annual", department: "Engineering" },
  { day: 25, employee: "Uswa Ziyad", initials: "UZ", type: "Casual", department: "HR" },
];

const UPCOMING = [
  { name: "Sana Ahmed", type: "Annual", dates: "Apr 10 – Apr 12", days: 3 },
  { name: "Fatima Noor", type: "Casual", dates: "Apr 15", days: 1 },
  { name: "Usman Tariq", type: "Annual", dates: "Apr 17", days: 1 },
  { name: "Hira Malik", type: "Sick", dates: "Apr 18", days: 1 },
  { name: "Ahmad Faraz", type: "Annual", dates: "Apr 20 – Apr 22", days: 3 },
  { name: "Uswa Ziyad", type: "Casual", dates: "Apr 25", days: 1 },
];

const typeColor = (t: string) => {
  if (t === "Annual") return "bg-emerald-500 text-white";
  if (t === "Sick") return "bg-amber-500 text-white";
  if (t === "Casual") return "bg-sky-500 text-white";
  return "bg-red-500 text-white";
};

export default function TeamCalendarPage() {
  const [dept, setDept] = useState("all");

  const filtered = dept === "all" ? LEAVES : LEAVES.filter((l) => l.department === dept);

  // Build month grid (April 2025, 30 days, starts Tuesday)
  const daysInMonth = 30;
  const startOffset = 1; // Tuesday

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Team Leave Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan around your team's availability
          </p>
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="border-brand-300/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-brand-900">April 2025</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Annual
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Sick
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Casual
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Without Pay
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-[10px] font-semibold text-brand-700 text-center pb-2 uppercase">
                  {d}
                </div>
              ))}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayLeaves = filtered.filter((l) => l.day === day);
                const pos = (i + startOffset) % 7;
                const isWeekend = pos === 5 || pos === 6;
                return (
                  <div
                    key={day}
                    className={`min-h-[80px] rounded-md border border-gray-200 p-1.5 ${
                      isWeekend ? "bg-brand-100/30" : "bg-white"
                    }`}
                  >
                    <div className="text-xs font-semibold text-brand-900 mb-1">{day}</div>
                    <div className="space-y-0.5">
                      {dayLeaves.slice(0, 3).map((l, idx) => (
                        <div
                          key={idx}
                          className={`rounded px-1 py-0.5 text-[9px] font-medium truncate ${typeColor(l.type)}`}
                          title={`${l.employee} · ${l.type}`}
                        >
                          {l.initials}
                        </div>
                      ))}
                      {dayLeaves.length > 3 && (
                        <div className="text-[9px] text-muted-foreground">
                          +{dayLeaves.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-300/40 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-base text-brand-900">Upcoming Leaves</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {UPCOMING.map((u, i) => (
              <div
                key={i}
                className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-brand-900 text-sm">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {u.dates} · {u.days} day{u.days !== 1 ? "s" : ""}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-semibold uppercase rounded-md px-1.5 py-0.5 ${typeColor(u.type).replace("text-white", "")}`}
                >
                  {u.type}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
