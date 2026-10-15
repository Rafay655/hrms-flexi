"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, Users, Package, CreditCard, CheckCircle2,
  AlertTriangle, CalendarDays, Phone, Settings2,
} from "lucide-react";

/* ── Mock data ── */

const PLAN = {
  name: "Flexi Enterprise",
  billing: "Annual",
  renewal: "2027-04-13",
  totalSeats: 500,
  usedSeats: 347,
  monthlyCost: "PKR 1,250,000",
  nextInvoice: "2026-05-01",
  paymentMethod: "Bank Transfer (HBL Corporate)",
};

const MODULES = [
  { name: "PeopleHub", users: 347, total: 500, licensed: true },
  { name: "LeaveEase", users: 347, total: 500, licensed: true },
  { name: "TimeSync", users: 289, total: 500, licensed: true },
  { name: "PayEdge", users: 347, total: 500, licensed: true },
  { name: "TalentWorks", users: 0, total: 0, licensed: false },
  { name: "PerformPro", users: 0, total: 0, licensed: false },
  { name: "ExpenseEase", users: 0, total: 0, licensed: false },
];

export default function LicensingPage() {
  const [modules] = useState(MODULES);
  const seatPercent = Math.round((PLAN.usedSeats / PLAN.totalSeats) * 100);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
            <Shield className="h-6 w-6" /> Subscription &amp; Licensing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your Flexi HRMS plan, modules, and usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-brand-800 border-brand-800 hover:bg-brand-100">
            <Phone className="h-4 w-4" /> Contact Sales
          </Button>
          <Button className="bg-brand-800 text-white hover:bg-brand-700 gap-2">
            <Settings2 className="h-4 w-4" /> Manage Plan
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-brand-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-800" /> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-bold text-brand-900">{PLAN.name}</h2>
            <Badge className="bg-brand-100 text-brand-800">{PLAN.billing} Billing</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Next Renewal</p>
              <p className="font-semibold text-brand-900 flex items-center gap-1">
                <CalendarDays className="h-4 w-4 text-brand-500" /> {PLAN.renewal}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Seats</p>
              <p className="font-semibold text-brand-900 flex items-center gap-1">
                <Users className="h-4 w-4 text-brand-500" /> {PLAN.totalSeats}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Used Seats</p>
              <p className="font-semibold text-brand-900">{PLAN.usedSeats} / {PLAN.totalSeats}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Utilization</p>
              <p className="font-semibold text-brand-900">{seatPercent}%</p>
            </div>
          </div>
          {/* Seat usage progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Seat Usage</span>
              <span>{PLAN.usedSeats} of {PLAN.totalSeats} seats used</span>
            </div>
            <div className="h-3 w-full rounded-full bg-brand-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-700 transition-all"
                style={{ width: `${seatPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Licenses */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-brand-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-800" /> Module Licenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((mod) => (
              <div
                key={mod.name}
                className={`rounded-xl border p-4 space-y-2 ${
                  mod.licensed ? "border-green-200 bg-green-50/40" : "border-border bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-brand-900">{mod.name}</p>
                  {mod.licensed ? (
                    <Badge className="bg-green-100 text-green-800 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 gap-1">
                      <AlertTriangle className="h-3 w-3" /> Not Licensed
                    </Badge>
                  )}
                </div>
                {mod.licensed ? (
                  <p className="text-sm text-brand-700">{mod.users}/{mod.total} users</p>
                ) : (
                  <Button variant="outline" size="sm" className="w-full text-xs text-brand-800 border-brand-800 hover:bg-brand-100">
                    Request License
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage & Billing */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-brand-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-800" /> Usage &amp; Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Monthly Cost", value: PLAN.monthlyCost, icon: CreditCard, color: "text-green-600" },
              { label: "Next Invoice Date", value: PLAN.nextInvoice, icon: CalendarDays, color: "text-brand-800" },
              { label: "Payment Method", value: PLAN.paymentMethod, icon: Shield, color: "text-blue-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border p-4">
                <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-semibold text-brand-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
