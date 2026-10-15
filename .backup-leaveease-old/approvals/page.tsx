"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Request = {
  id: number;
  name: string;
  designation: string;
  initials: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  balance: string;
  status: "Pending" | "Approved" | "Rejected";
};

const INITIAL: Request[] = [
  { id: 1, name: "Sana Ahmed", designation: "Sr. Software Engineer", initials: "SA", leaveType: "Annual Leave", from: "Apr 10", to: "Apr 12", days: 3, reason: "Family wedding in Karachi", balance: "Has 14 days remaining", status: "Pending" },
  { id: 2, name: "Bilal Khan", designation: "Product Manager", initials: "BK", leaveType: "Sick Leave", from: "Apr 8", to: "Apr 9", days: 2, reason: "Medical rest advised by physician", balance: "Has 8 days remaining", status: "Pending" },
  { id: 3, name: "Fatima Noor", designation: "UX Designer", initials: "FN", leaveType: "Casual Leave", from: "Apr 15", to: "Apr 15", days: 1, reason: "Personal work", balance: "Has 2 days remaining", status: "Pending" },
  { id: 4, name: "Usman Tariq", designation: "Account Executive", initials: "UT", leaveType: "Annual Leave", from: "Apr 20", to: "Apr 24", days: 5, reason: "Eid vacation with family", balance: "Has 11 days remaining", status: "Pending" },
  { id: 5, name: "Hira Malik", designation: "Finance Analyst", initials: "HM", leaveType: "Sick Leave", from: "Apr 11", to: "Apr 11", days: 1, reason: "Flu symptoms", balance: "Has 9 days remaining", status: "Pending" },
  { id: 6, name: "Ahmad Faraz", designation: "DevOps Engineer", initials: "AF", leaveType: "Annual Leave", from: "May 1", to: "May 5", days: 5, reason: "International trip", balance: "Has 17 days remaining", status: "Pending" },
  { id: 7, name: "Uswa Ziyad", designation: "HR Officer", initials: "UZ", leaveType: "Casual Leave", from: "Apr 18", to: "Apr 18", days: 1, reason: "Family function", balance: "Has 3 days remaining", status: "Pending" },
  { id: 8, name: "Abdul Rafay", designation: "Backend Developer", initials: "AR", leaveType: "Annual Leave", from: "Apr 25", to: "Apr 26", days: 2, reason: "Personal matters", balance: "Has 12 days remaining", status: "Pending" },
];

const typeClass = (t: string) => {
  if (t.includes("Annual")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (t.includes("Sick")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (t.includes("Casual")) return "bg-sky-100 text-sky-700 border-sky-200";
  return "bg-brand-100 text-brand-800 border-brand-300";
};

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<Request[]>(INITIAL);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState<{
    ids: number[];
    action: "approve" | "reject";
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const byStatus = (s: Request["status"]) => requests.filter((r) => r.status === s);
  const pending = byStatus("Pending");

  const handleSingle = (id: number, action: "approve" | "reject") => {
    setConfirming({ ids: [id], action });
    setRejectReason("");
  };

  const handleBulk = (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;
    setConfirming({ ids: Array.from(selectedIds), action });
    setRejectReason("");
  };

  const confirmAction = () => {
    if (!confirming) return;
    const { ids, action } = confirming;
    setRequests((prev) =>
      prev.map((r) =>
        ids.includes(r.id)
          ? { ...r, status: action === "approve" ? "Approved" : "Rejected" }
          : r
      )
    );
    setSelectedIds(new Set());
    setConfirming(null);
    toast.success(
      `${ids.length} request${ids.length !== 1 ? "s" : ""} ${action === "approve" ? "approved" : "rejected"}`
    );
  };

  const RequestCard = ({ r }: { r: Request }) => (
    <Card className="border-brand-300/40 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {r.status === "Pending" && (
            <input
              type="checkbox"
              checked={selectedIds.has(r.id)}
              onChange={(e) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (e.target.checked) next.add(r.id);
                  else next.delete(r.id);
                  return next;
                });
              }}
              className="mt-1.5 h-4 w-4 accent-brand-800"
            />
          )}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-800 text-white text-xs font-bold">
            {r.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-brand-900">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.designation}</p>
              </div>
              <Badge variant="outline" className={typeClass(r.leaveType)}>
                {r.leaveType}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-brand-900">
              <Clock className="h-3.5 w-3.5 text-brand-700" />
              <span className="font-semibold">
                {r.from} – {r.to}
              </span>
              <span className="text-muted-foreground">({r.days} day{r.days !== 1 ? "s" : ""})</span>
            </div>
            {r.reason && (
              <p className="mt-1 text-xs text-brand-700 italic">{r.reason}</p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">{r.balance}</p>
            {r.status === "Pending" && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSingle(r.id, "approve")}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 h-8"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSingle(r.id, "reject")}
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 h-8"
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Leave Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pending leave requests from your team
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-brand-100">
          <TabsTrigger value="pending" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
            Approved ({byStatus("Approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
            Rejected ({byStatus("Rejected").length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-brand-800 data-[state=active]:text-white">
            All ({requests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 pt-5">
          {pending.map((r) => <RequestCard key={r.id} r={r} />)}
        </TabsContent>
        <TabsContent value="approved" className="space-y-3 pt-5">
          {byStatus("Approved").map((r) => <RequestCard key={r.id} r={r} />)}
        </TabsContent>
        <TabsContent value="rejected" className="space-y-3 pt-5">
          {byStatus("Rejected").map((r) => <RequestCard key={r.id} r={r} />)}
        </TabsContent>
        <TabsContent value="all" className="space-y-3 pt-5">
          {requests.map((r) => <RequestCard key={r.id} r={r} />)}
        </TabsContent>
      </Tabs>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-2xl">
          <span className="text-sm font-semibold text-brand-900">
            {selectedIds.size} request{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="h-5 w-px bg-gray-200" />
          <Button size="sm" onClick={() => handleBulk("approve")} className="bg-emerald-600 text-white hover:bg-emerald-700">
            Approve All Selected
          </Button>
          <Button size="sm" onClick={() => handleBulk("reject")} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
            Reject All Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={confirming !== null} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming?.action === "approve"
                ? `Approve ${confirming.ids.length} leave request${confirming.ids.length !== 1 ? "s" : ""}?`
                : `Reject ${confirming?.ids.length} leave request${confirming?.ids.length !== 1 ? "s" : ""}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.action === "approve"
                ? "Employees will be notified and leave balances will be updated."
                : "Please provide a reason. The employee will be notified."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirming?.action === "reject" && (
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                confirming?.action === "approve"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
