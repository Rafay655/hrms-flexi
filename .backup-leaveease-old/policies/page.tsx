"use client";

import React from "react";
import {
  Calendar,
  Heart,
  CoffeeIcon,
  Baby,
  Award,
  Clock,
  Edit,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Policy = {
  type: string;
  icon: any;
  entitlement: string;
  carryForward: string;
  probationEligible: boolean;
  certificateRequired: string;
  noticeRequired: string;
  encashable: boolean;
  approvers: string;
  iconBg: string;
};

const POLICIES: Policy[] = [
  {
    type: "Annual Leave",
    icon: Calendar,
    entitlement: "20 days per year",
    carryForward: "Yes (max 10 days)",
    probationEligible: false,
    certificateRequired: "N/A",
    noticeRequired: "7 days",
    encashable: true,
    approvers: "Direct Manager",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    type: "Sick Leave",
    icon: Heart,
    entitlement: "10 days per year",
    carryForward: "No",
    probationEligible: true,
    certificateRequired: "After 2 consecutive days",
    noticeRequired: "Same day",
    encashable: false,
    approvers: "Direct Manager",
    iconBg: "bg-amber-100 text-amber-700",
  },
  {
    type: "Casual Leave",
    icon: CoffeeIcon,
    entitlement: "5 days per year",
    carryForward: "No",
    probationEligible: false,
    certificateRequired: "N/A",
    noticeRequired: "3 days",
    encashable: false,
    approvers: "Direct Manager",
    iconBg: "bg-sky-100 text-sky-700",
  },
  {
    type: "Maternity Leave",
    icon: Baby,
    entitlement: "90 days (fully paid)",
    carryForward: "No",
    probationEligible: true,
    certificateRequired: "Medical certificate required",
    noticeRequired: "30 days",
    encashable: false,
    approvers: "HR + Direct Manager",
    iconBg: "bg-pink-100 text-pink-700",
  },
  {
    type: "Hajj Leave",
    icon: Award,
    entitlement: "30 days (once in service)",
    carryForward: "No",
    probationEligible: false,
    certificateRequired: "Hajj booking proof",
    noticeRequired: "60 days",
    encashable: false,
    approvers: "HR + Direct Manager",
    iconBg: "bg-brand-100 text-brand-800",
  },
  {
    type: "Compensatory Off",
    icon: Clock,
    entitlement: "Earned (per overtime day)",
    carryForward: "3 months",
    probationEligible: true,
    certificateRequired: "N/A",
    noticeRequired: "3 days",
    encashable: false,
    approvers: "Direct Manager",
    iconBg: "bg-violet-100 text-violet-700",
  },
];

export default function PoliciesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Leave Policies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Entitlements and rules configured for your company
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {POLICIES.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.type} className="border-brand-300/40 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.iconBg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base text-brand-900">
                      {p.type}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Annual Entitlement
                  </p>
                  <p className="text-sm font-semibold text-brand-900">
                    {p.entitlement}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Carry Forward</p>
                    <p className="font-medium text-brand-900">{p.carryForward}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Notice Required</p>
                    <p className="font-medium text-brand-900">{p.noticeRequired}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Probation Eligible</p>
                    <div className="flex items-center gap-1">
                      {p.probationEligible ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="font-medium text-brand-900">Yes</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span className="font-medium text-brand-900">No</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Encashable</p>
                    <div className="flex items-center gap-1">
                      {p.encashable ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="font-medium text-brand-900">Yes</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span className="font-medium text-brand-900">No</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Medical Certificate
                  </p>
                  <p className="text-xs text-brand-900">{p.certificateRequired}</p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Approvers
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-brand-300 text-brand-800"
                  >
                    {p.approvers}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1 border-brand-300 text-brand-800 hover:bg-brand-100"
                  >
                    <Edit className="h-3 w-3" />
                    Edit Policy
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
