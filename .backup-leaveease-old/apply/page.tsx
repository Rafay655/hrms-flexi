"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Calendar, Upload, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Casual Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Hajj Leave",
  "Without Pay",
  "Compensatory Off",
];

const BALANCES = [
  { type: "Annual Leave", used: 6, total: 20, color: "bg-emerald-500" },
  { type: "Sick Leave", used: 2, total: 10, color: "bg-amber-500" },
  { type: "Casual Leave", used: 3, total: 5, color: "bg-sky-500" },
  { type: "Maternity Leave", used: 0, total: 90, color: "bg-violet-500" },
];

function workingDays(from: string, to: string) {
  if (!from || !to) return 0;
  const start = new Date(from);
  const end = new Date(to);
  if (end < start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export default function ApplyLeavePage() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [half, setHalf] = useState<"first" | "second">("first");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => {
    if (halfDay) return 0.5;
    return workingDays(from, to);
  }, [from, to, halfDay]);

  const reasonRequired = leaveType === "Sick Leave" || leaveType === "Without Pay";

  const submit = async () => {
    if (!from || !to) {
      toast.error("Please select both From and To dates");
      return;
    }
    if (reasonRequired && !reason.trim()) {
      toast.error(`${leaveType} requires a reason`);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    toast.success(
      "Leave request submitted. Your manager Asad Rehman will be notified."
    );
    router.push("/leaveease");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Apply for Leave</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit a new leave request for manager approval
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-brand-300/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-brand-900">Leave Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">From Date *</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To Date *</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            {days > 0 && (
              <div className="rounded-lg border border-brand-300/40 bg-brand-100/40 p-3 text-sm text-brand-800 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span><strong>{days}</strong> working day{days !== 1 ? "s" : ""}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                id="halfday"
                type="checkbox"
                checked={halfDay}
                onChange={(e) => setHalfDay(e.target.checked)}
                className="h-4 w-4 accent-brand-800"
              />
              <Label htmlFor="halfday" className="text-sm cursor-pointer">
                Half-day leave
              </Label>
            </div>

            {halfDay && (
              <div className="flex gap-2 ml-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="half" checked={half === "first"} onChange={() => setHalf("first")} className="accent-brand-800" />
                  <span className="text-xs">First Half</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="half" checked={half === "second"} onChange={() => setHalf("second")} className="accent-brand-800" />
                  <span className="text-xs">Second Half</span>
                </label>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Reason {reasonRequired && "*"}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonRequired ? "Required for this leave type" : "Optional"}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Supporting Document</Label>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-brand-300 bg-brand-100/30 p-5 cursor-pointer hover:bg-brand-100/50">
                <Upload className="h-6 w-6 text-brand-700" />
                <p className="text-xs font-medium text-brand-800 mt-2">
                  Click to upload medical certificate or supporting document
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PDF, JPG, PNG</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-gray-200 text-brand-800"
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={submitting}
                className="bg-brand-800 text-white hover:bg-brand-900 gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Leave Request"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-300/40 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-base text-brand-900">Your Leave Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {BALANCES.map((b) => {
              const remaining = b.total - b.used;
              const pct = (b.used / b.total) * 100;
              return (
                <div key={b.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-brand-900">{b.type}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {remaining}/{b.total}
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                    <div className={`h-full ${b.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 mt-3">
              <Info className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900">
                Annual leave expires Dec 31, 2025. Up to 10 days can be carried forward.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
