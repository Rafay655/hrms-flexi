"use client";

import { DoorOpen, AlertCircle, Clock, MapPin, Users, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type OpenShift = {
  id: string;
  title: string;
  shift: string;
  date: string;
  time: string;
  location: string;
  department: string;
  reason: string;
  claimsCount: number;
  urgency: "high" | "medium" | "low";
};

const MOCK_OPEN_SHIFTS: OpenShift[] = [
  {
    id: "OS-8012",
    title: "Line A Supervisor Cover",
    shift: "Morning Shift",
    date: "Sat, 05 Apr 2026",
    time: "06:00 – 14:00",
    location: "Plant 1 · Floor A",
    department: "Production",
    reason: "Sick leave coverage",
    claimsCount: 3,
    urgency: "high",
  },
  {
    id: "OS-8013",
    title: "QC Inspector — Night",
    shift: "Night Shift",
    date: "Sat, 05 Apr 2026",
    time: "22:00 – 06:00",
    location: "Plant 1 · QC Lab",
    department: "Quality Control",
    reason: "Extra headcount for audit",
    claimsCount: 1,
    urgency: "medium",
  },
  {
    id: "OS-8014",
    title: "Warehouse Operator",
    shift: "Evening Shift",
    date: "Sun, 06 Apr 2026",
    time: "14:00 – 22:00",
    location: "Warehouse 2",
    department: "Warehouse",
    reason: "Weekend inventory",
    claimsCount: 5,
    urgency: "low",
  },
  {
    id: "OS-8015",
    title: "Security Post Guard",
    shift: "General Shift",
    date: "Mon, 07 Apr 2026",
    time: "09:00 – 18:00",
    location: "Main Gate",
    department: "Security",
    reason: "Annual leave coverage",
    claimsCount: 0,
    urgency: "medium",
  },
];

const urgencyColors = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

const urgencyLabels = {
  high: "Urgent",
  medium: "Needed",
  low: "Optional",
};

export default function OpenShiftsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Open Shifts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Unfilled shifts posted by managers that eligible employees can claim. Approvals are
            routed through the configured workflow.
          </p>
        </div>
        <Button className="bg-indigo-900 hover:bg-indigo-800 text-white">
          <DoorOpen className="h-4 w-4 mr-2" />
          Post New Open Shift
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Open</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">24</p>
            <p className="text-xs text-slate-500 mt-1">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 uppercase">Urgent</p>
            <p className="text-2xl font-bold text-red-700 mt-1">6</p>
            <p className="text-xs text-slate-500 mt-1">Need filling today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 uppercase">Pending Claims</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">18</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 uppercase">Filled This Week</p>
            <p className="text-2xl font-bold text-green-700 mt-1">41</p>
            <p className="text-xs text-slate-500 mt-1">92% fill rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_OPEN_SHIFTS.map((shift) => (
          <Card key={shift.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {shift.title}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    {shift.id} · {shift.department}
                  </p>
                </div>
                <Badge variant="outline" className={urgencyColors[shift.urgency]}>
                  {urgencyLabels[shift.urgency]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{shift.date}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono text-xs">{shift.time}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {shift.location}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <span className="text-xs italic">{shift.reason}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium">{shift.claimsCount}</span>
                  <span>claim{shift.claimsCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View Claims
                  </Button>
                  <Button size="sm" className="bg-indigo-900 hover:bg-indigo-800">
                    <Check className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
