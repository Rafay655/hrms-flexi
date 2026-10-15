// app/flexi-hq/plan/page.tsx
"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Zap,
  Users,
  Layers,
  GitMerge,
  Bot,
  Rocket,
  ArrowUpRight,
  ChevronRight,
  Info,
  AlertTriangle,
  Database,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

interface UsageMeterProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
}

const UsageMeter = ({ label, current, max, unit = "" }: UsageMeterProps) => {
  const percentage = (current / max) * 100;
  const getColor = () => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 70) return "bg-amber-500";
    return "bg-brand-800";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <p className="text-xs font-medium text-brand-700 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-brand-900">
          {current}{" "}
          <span className="text-brand-700 font-normal">
            / {max} {unit}
          </span>
        </p>
      </div>
      <Progress value={percentage} className="h-2" color={getColor()} />
    </div>
  );
};

const tiers = [
  {
    name: "CORE",
    status: "included",
    features: [
      "Leave Types & Requests",
      "Basic Approvals",
      "Basic Accrual",
      "Basic Reports",
      "Notifications",
    ],
  },
  {
    name: "PRO",
    status: "active",
    features: [
      "Sandwich Policy",
      "Comp-Off Management",
      "Encashment",
      "Policy Simulator",
      "Official Duty/Travel",
      "Earned Leave Incentives",
      "AI Assistant",
    ],
  },
  {
    name: "ENTERPRISE",
    status: "locked",
    features: [
      "Parallel Approvals",
      "Retro After Lock",
      "Adjustment Approvals",
      "Advanced Audit Export",
      "SSO Integration",
      "Custom Integrations",
    ],
  },
];

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function LeaveEntitlements() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedEmployeeSlots, setSelectedEmployeeSlots] = useState("none");
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const handleManageBilling = () => {
    toast.info("Billing Portal", {
      description: "Redirecting to secure billing portal...",
    });
    // In a real app: window.location.href = "/billing"
  };

  const handleSendUpgradeRequest = () => {
    toast.success("Request Sent", {
      description: "Your upgrade request has been submitted. Sales will contact you shortly.",
    });
    setIsUpgradeModalOpen(false);
    setSelectedEmployeeSlots("none");
    setUpgradeMessage("");
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Plan & Entitlements</h1>
            <p className="text-sm text-brand-700">
              Manage your LeaveEase subscription and monitor resource limits.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Tiers Section */}
        <div className="lg:col-span-8 space-y-8">
          {/* Plan Card */}
          <Card className="bg-brand-900 border-0 shadow-lg overflow-hidden">
            <CardContent className="p-8 lg:p-10 relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-200 rounded-xl text-white">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">LeaveEase Pro</h3>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        Subscription Valid Until
                      </p>
                      <p className="text-lg font-bold text-white">Dec 31, 2025</p>
                    </div>
                    <div className="hidden md:block w-px h-10 bg-white/20" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        Active Employees
                      </p>
                      <p className="text-lg font-bold text-white">245 / 500</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="bg-white text-brand-900 hover:bg-white font-semibold"
                >
                  Upgrade Plan <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <Zap className="absolute -bottom-10 -right-10 h-48 w-48 text-white/5 -rotate-12" />
            </CardContent>
          </Card>

          {/* Features Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`border ${
                  tier.status === "active"
                    ? "border-brand-800 shadow-md ring-2 ring-brand-800/10"
                    : "border-gray-200 shadow-sm"
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle
                      className={`text-sm font-bold uppercase tracking-wider ${
                        tier.status === "locked" ? "text-brand-700" : "text-brand-900"
                      }`}
                    >
                      {tier.name}
                    </CardTitle>
                    {tier.status === "locked" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-brand-700 hover:text-brand-900 hover:bg-brand-100"
                        onClick={() => setIsUpgradeModalOpen(true)}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    )}
                    {tier.status === "active" && (
                      <Badge className="bg-brand-800 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-3 text-sm ${
                          tier.status === "locked" ? "text-brand-700" : "text-brand-800"
                        }`}
                      >
                        {tier.status === "locked" ? (
                          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                        )}
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {tier.status === "locked" && (
                    <Button
                      variant="outline"
                      className="w-full border-gray-200 text-brand-800 hover:bg-brand-100"
                      onClick={() => setIsUpgradeModalOpen(true)}
                    >
                      Unlock Features
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Usage Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-brand-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-brand-800" />
                Resource Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <UsageMeter label="Licensed Employees" current={245} max={500} unit="Staff" />
              <UsageMeter label="Leave Type Configs" current={8} max={20} />
              <UsageMeter label="Workflow Builder Slots" current={5} max={10} />
              <UsageMeter label="AI Copilot Queries" current={600} max={1000} unit="/ mo" />

              <div className="pt-4 border-t border-gray-200">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    You have reached <span className="font-bold">60% of your AI query quota</span> for
                    February. Quota resets in 18 days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                Next Billing Cycle
              </h4>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-lg font-bold text-brand-900">Jan 01, 2026</p>
                  <p className="text-xs text-brand-700">Annual Standard Renewal</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-900">$4,800.00</p>
                  <Button
                    variant="link"
                    className="text-xs text-brand-800 p-0 h-auto"
                    onClick={handleManageBilling}
                  >
                    Manage Billing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-brand-50 rounded-lg border border-brand-200 flex items-start gap-3">
            <Info className="h-4 w-4 text-brand-800 shrink-0 mt-0.5" />
            <p className="text-xs text-brand-800 leading-relaxed">
              Enterprise features like Parallel Approvals and Custom Integrations require manual
              activation by our implementation team.
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Modal (Dialog) */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="sm:max-w-xl border-gray-200 p-0 overflow-hidden">
          <div className="bg-brand-900 px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Request Upgrade
              </DialogTitle>
              <DialogDescription className="text-brand-200">
                Elevate to LeaveEase Enterprise
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 bg-brand-50 rounded-lg border border-brand-200 space-y-3">
              <h4 className="text-sm font-semibold text-brand-900">
                What's included in Enterprise?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "SSO/SAML Login",
                  "Parallel Approvals",
                  "API Webhooks",
                  "Unlimited AI",
                  "Dedicated Support",
                  "Custom Reporting",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-brand-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-800">
                  Additional Employee Slots
                </label>
                <Select value={selectedEmployeeSlots} onValueChange={setSelectedEmployeeSlots}>
                  <SelectTrigger className="border-gray-200 text-brand-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Current 500)</SelectItem>
                    <SelectItem value="500">Add 500 (+ $1,200/yr)</SelectItem>
                    <SelectItem value="unlimited">Unlimited (+ $4,500/yr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-800">
                  Add a message for your account manager
                </label>
                <Textarea
                  placeholder="Let us know your requirements..."
                  value={upgradeMessage}
                  onChange={(e) => setUpgradeMessage(e.target.value)}
                  className="border-gray-200 focus:border-brand-800 text-brand-900 min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button
              variant="outline"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="border-gray-200 text-brand-800 hover:bg-brand-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendUpgradeRequest}
              className="bg-brand-800 hover:bg-brand-900 text-white"
            >
              Send Request to Sales <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}