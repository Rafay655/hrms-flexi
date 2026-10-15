"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarCheck, Users, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TEAMS = ["Production Floor A", "Production Floor B", "QC Team", "Warehouse", "Admin"];

const SAMPLE_CALENDAR = [
  { day: 1, shift: "M", color: "bg-amber-100 text-amber-700" },
  { day: 2, shift: "M", color: "bg-amber-100 text-amber-700" },
  { day: 3, shift: "E", color: "bg-orange-100 text-orange-700" },
  { day: 4, shift: "E", color: "bg-orange-100 text-orange-700" },
  { day: 5, shift: "N", color: "bg-indigo-100 text-indigo-700" },
  { day: 6, shift: "OFF", color: "bg-slate-100 text-slate-500" },
  { day: 7, shift: "OFF", color: "bg-slate-100 text-slate-500" },
];

export default function CalendarAssignmentPage() {
  const [month, setMonth] = useState("April 2026");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar Assignment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign shift patterns across calendar dates for teams and departments. Perfect for
            planning public holidays, seasonal schedules, and recurring rotations.
          </p>
        </div>
        <Button className="bg-indigo-900 hover:bg-indigo-800 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save Calendar
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase">Team / Group</label>
            <Select defaultValue={TEAMS[0]}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAMS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase">Template</label>
            <Select defaultValue="standard">
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard 5-Day Rotation</SelectItem>
                <SelectItem value="factory">Factory 3-Shift</SelectItem>
                <SelectItem value="weekend">Weekend-Off 6 Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase">Period</label>
            <div className="flex items-center gap-2 mt-1.5">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center font-semibold text-slate-800 h-9 flex items-center justify-center border border-slate-200 rounded-md bg-white">
                {month}
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-100 border border-amber-200"></div>
          <span className="text-slate-600">Morning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-orange-100 border border-orange-200"></div>
          <span className="text-slate-600">Evening</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-indigo-100 border border-indigo-200"></div>
          <span className="text-slate-600">Night</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-slate-100 border border-slate-200"></div>
          <span className="text-slate-600">Off</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            {month} Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-slate-500 uppercase py-2"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 30 }).map((_, i) => {
              const sample = SAMPLE_CALENDAR[i % 7];
              return (
                <button
                  key={i}
                  className={`aspect-square rounded-md border border-slate-200 p-2 text-left hover:border-indigo-400 transition-colors ${sample.color}`}
                >
                  <div className="text-xs font-semibold">{i + 1}</div>
                  <div className="text-[10px] font-bold mt-1">{sample.shift}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Coverage Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-amber-700 font-medium">Morning</p>
            <p className="text-xl font-bold text-amber-900">8 days</p>
            <p className="text-xs text-amber-600">64 emp-days</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs text-orange-700 font-medium">Evening</p>
            <p className="text-xl font-bold text-orange-900">8 days</p>
            <p className="text-xs text-orange-600">56 emp-days</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs text-indigo-700 font-medium">Night</p>
            <p className="text-xl font-bold text-indigo-900">4 days</p>
            <p className="text-xs text-indigo-600">24 emp-days</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-600 font-medium">Off Days</p>
            <p className="text-xl font-bold text-slate-800">10 days</p>
            <p className="text-xs text-slate-500">weekends + holidays</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
