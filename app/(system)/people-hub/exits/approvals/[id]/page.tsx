"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LogOut,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  Briefcase,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Types for exit request (define locally or import)
type ExitType = "Resignation" | "Termination" | "Retirement" | "Contract-End";
type ExitStage = "Exit Review" | "Clearance Review" | "FnF Review" | "Final Closure";
type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Sent Back";

type ExitRequest = {
  id: number;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  manager: string;
  exit_type: ExitType;
  stage: ExitStage;
  status: ApprovalStatus;
  submitted_on: string;
  last_working_day: string;
  reason: string;
  clearance_status?: {
    it: boolean;
    admin: boolean;
    finance: boolean;
    hr: boolean;
  };
};

/* -------------------------------------------------------------------------- */
/*  Mock data helper (replace with real API)                                  */
/* -------------------------------------------------------------------------- */
function getMockExitById(id: string): ExitRequest | null {
  const numericId = Number(id) || 1;
  const employees = [
    { name: "Muqadas Mazhar", code: "EMP-1043", desig: "Team Lead", dept: "Product", mgr: "Yousaf Chaudhry" },
    { name: "Aisha Khan", code: "EMP-1044", desig: "Officer", dept: "HR", mgr: "Ahmed Raza" },
    { name: "Bilal Ahmed", code: "EMP-1045", desig: "Executive", dept: "Finance", mgr: "Omar Farooq" },
    { name: "Fatima Noor", code: "EMP-1046", desig: "Senior Executive", dept: "Operations", mgr: "Zara Tariq" },
    { name: "Usman Tariq", code: "EMP-1047", desig: "Assistant Manager", dept: "Sales", mgr: "Bilal Hussain" },
    { name: "Hira Malik", code: "EMP-1048", desig: "Manager", dept: "Engineering", mgr: "Sana Malik" },
  ];
  const emp = employees[(numericId - 1) % employees.length];
  const exitTypes: ExitType[] = ["Resignation", "Termination", "Retirement", "Contract-End"];
  const stages: ExitStage[] = ["Exit Review", "Clearance Review", "FnF Review", "Final Closure"];
  const statuses: ApprovalStatus[] = ["Pending", "Approved", "Rejected", "Sent Back"];

  return {
    id: numericId,
    employee_name: emp.name,
    employee_code: emp.code,
    designation: emp.desig,
    department: emp.dept,
    manager: emp.mgr,
    exit_type: exitTypes[(numericId - 1) % exitTypes.length],
    stage: stages[(numericId - 1) % stages.length],
    status: statuses[(numericId - 1) % statuses.length],
    submitted_on: "2026-04-10",
    last_working_day: "2026-05-10",
    reason: "Personal reasons / better opportunity.",
    clearance_status: {
      it: numericId % 3 === 0,
      admin: numericId % 4 === 0,
      finance: numericId % 5 === 0,
      hr: numericId % 2 === 0,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function ExitApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<ExitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: "approve" | "reject" | "sendback"; reason: string }>({
    open: false,
    action: "approve",
    reason: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRequest(getMockExitById(id));
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleAction = (action: "approve" | "reject" | "sendback") => {
    setActionDialog({ open: true, action, reason: "" });
  };

  const submitAction = async () => {
    toast.success(
      actionDialog.action === "approve"
        ? "Request approved"
        : actionDialog.action === "reject"
        ? "Request rejected"
        : "Request sent back",
      {
        description: `The exit request has been ${actionDialog.action}d.`,
      }
    );
    setActionDialog({ open: false, action: "approve", reason: "" });
    router.push("/people-hub/approvals");
  };

  if (loading) {
    return (
      <div className="p-3 bg-white min-h-screen flex items-center justify-center">
        <div className="text-brand-800">Loading exit request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-3 bg-white min-h-screen">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-brand-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brand-900">Exit request not found</h2>
            <p className="text-brand-700 mt-2">The approval request you're looking for doesn't exist.</p>
            <Button
              className="mt-4 bg-brand-800 text-white hover:bg-brand-900"
              onClick={() => router.push("/people-hub/approvals")}
            >
              Back to Approvals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const approvalProgress =
    request.status === "Approved"
      ? 100
      : request.status === "Rejected"
      ? 55
      : request.stage === "Exit Review"
      ? 20
      : request.stage === "Clearance Review"
      ? 40
      : request.stage === "FnF Review"
      ? 70
      : 90;

  return (
    <div className="p-3 bg-white min-h-screen">
      <div className="space-y-4">
        {/* Header */}
        <Card className="bg-linear-to-r from-brand-900 via-[#3D355D] to-[#8379ad] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <LogOut className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">Exit Approval</h1>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      Exit Management
                    </Badge>
                    <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                      ID: {id}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-white/80">
                    Review and take action on this exit request.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => router.push("/people-hub/approvals")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Approvals
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Body */}
        <div className="grid gap-4 xl:grid-cols-[1fr_350px]">
          <div className="space-y-4">
            {/* Employee & exit info */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-brand-900">
                  Exit Request Details
                </CardTitle>
                <CardDescription className="text-brand-700">
                  Information submitted by employee/HR.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-brand-800">Employee</label>
                  <div className="mt-1 font-semibold text-brand-900">{request.employee_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-800">Employee Code</label>
                  <div className="mt-1 text-brand-900">{request.employee_code}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-800">Designation</label>
                  <div className="mt-1 text-brand-900">{request.designation}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-800">Department</label>
                  <div className="mt-1 text-brand-900">{request.department}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-800">Reporting Manager</label>
                  <div className="mt-1 text-brand-900">{request.manager}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-800">Exit Type</label>
                  <div className="mt-1">
                    <Badge className="bg-brand-100 text-brand-800 border-gray-200">
                      {request.exit_type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-800">Submitted On</label>
                  <div className="mt-1 text-brand-900">{request.submitted_on}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-800">Last Working Day</label>
                  <div className="mt-1 text-brand-900">{request.last_working_day}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-brand-800">Reason</label>
                  <div className="mt-1 p-3 bg-brand-100/50 rounded-md text-brand-900 text-sm">
                    {request.reason}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clearance Status */}
            {request.clearance_status && (
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-bold text-brand-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-800" />
                    Clearance Status
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-brand-800">IT Clearance</span>
                    <Badge className={request.clearance_status.it ? "bg-brand-700 text-white" : "bg-brand-200 text-brand-600"}>
                      {request.clearance_status.it ? "Cleared" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-brand-800">Admin Clearance</span>
                    <Badge className={request.clearance_status.admin ? "bg-brand-700 text-white" : "bg-brand-200 text-brand-600"}>
                      {request.clearance_status.admin ? "Cleared" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-brand-800">Finance Clearance</span>
                    <Badge className={request.clearance_status.finance ? "bg-brand-700 text-white" : "bg-brand-200 text-brand-600"}>
                      {request.clearance_status.finance ? "Cleared" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-brand-800">HR Clearance</span>
                    <Badge className={request.clearance_status.hr ? "bg-brand-700 text-white" : "bg-brand-200 text-brand-600"}>
                      {request.clearance_status.hr ? "Cleared" : "Pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-brand-900">Approval Progress</CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-brand-700">Status</span>
                  <Badge className={
                    request.status === "Pending"
                      ? "bg-brand-800 text-white"
                      : request.status === "Approved"
                      ? "bg-brand-700 text-white"
                      : request.status === "Rejected"
                      ? "bg-brand-600 text-white"
                      : "bg-brand-500 text-white"
                  }>
                    {request.status}
                  </Badge>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-brand-700">Stage</span>
                    <span className="font-semibold text-brand-900">{request.stage}</span>
                  </div>
                  <Progress value={approvalProgress} className="h-2" />
                  <div className="mt-1 text-xs text-brand-700 text-right">{approvalProgress}% complete</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-brand-900">Approval Chain</CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-3">
                {[
                  { label: "Reporting Manager", status: "Pending", icon: Users },
                  { label: "HR Manager", status: "Pending", icon: ShieldCheck },
                  { label: "Finance", status: "Pending", icon: Briefcase },
                  { label: "GM / Director", status: "Pending", icon: CheckCircle2 },
                ].map(({ label, status, icon: Icon }, index) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-gray-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-brand-100 p-2">
                        <Icon className="h-4 w-4 text-brand-800" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-brand-900">{label}</div>
                        <div className="text-[11px] text-brand-700">Step {index + 1}</div>
                      </div>
                    </div>

                    <Badge className="bg-brand-100 text-brand-800 border-gray-200">
                      {status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action buttons */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <Button
                  className="w-full bg-brand-800 text-white hover:bg-brand-900 gap-2"
                  onClick={() => handleAction("approve")}
                  disabled={request.status !== "Pending"}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-brand-600 text-brand-600 hover:bg-brand-50 gap-2"
                  onClick={() => handleAction("reject")}
                  disabled={request.status !== "Pending"}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-brand-500 text-brand-500 hover:bg-brand-50 gap-2"
                  onClick={() => handleAction("sendback")}
                  disabled={request.status !== "Pending"}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Send Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Action confirmation dialog (same as career) */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent className="sm:max-w-md border border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-brand-900">
              {actionDialog.action === "approve"
                ? "Approve Exit Request"
                : actionDialog.action === "reject"
                ? "Reject Exit Request"
                : "Send Back for Revision"}
            </DialogTitle>
            <DialogDescription className="text-brand-700">
              {actionDialog.action === "approve"
                ? "This request will be marked as approved and move to the next step."
                : actionDialog.action === "reject"
                ? "This request will be rejected and closed."
                : "This request will be sent back to the submitter with your comments."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-brand-800">Comments (optional)</label>
            <Textarea
              value={actionDialog.reason}
              onChange={(e) => setActionDialog({ ...actionDialog, reason: e.target.value })}
              placeholder="Add any remarks..."
              className="mt-2 border-gray-200 text-brand-900"
              rows={4}
            />
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setActionDialog({ ...actionDialog, open: false, reason: "" })}
              className="border-gray-200 text-brand-800"
            >
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              className={
                actionDialog.action === "approve"
                  ? "bg-brand-800 hover:bg-brand-900 text-white"
                  : actionDialog.action === "reject"
                  ? "bg-brand-600 hover:bg-brand-700 text-white"
                  : "bg-brand-500 hover:bg-brand-600 text-white"
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}