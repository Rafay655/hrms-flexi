"use client";

import { useState } from "react";
import {
  Calendar,
  Landmark,
  FileText,
  GitBranch,
  Bell,
  Edit,
  Save,
  Mail,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function PayEdgeSettingsPage() {
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [sapSync, setSapSync] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PayEdge Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure payroll processing, integrations, payslip templates, approvals, and
            notifications for the entire organization.
          </p>
        </div>
        <Button className="bg-indigo-900 hover:bg-indigo-800 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payroll Cycle */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-indigo-900" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Payroll Cycle</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  How often payroll runs and when cutoffs are applied
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Cycle Frequency</Label>
              <Select defaultValue="monthly">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="semimonthly">Semi-Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cut-off Day</Label>
                <Select defaultValue="25">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[20, 25, 28, 30].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d}
                        {d === 25 ? "th" : "th"} of month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pay Date</Label>
                <Select defaultValue="1">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st of next month</SelectItem>
                    <SelectItem value="5">5th of next month</SelectItem>
                    <SelectItem value="7">7th of next month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs">
              <p className="text-slate-600">
                Current cycle:{" "}
                <span className="font-semibold text-slate-900">
                  Monthly · 26th–25th · Paid on 1st
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Integration */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Bank Integration</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct bank transfer file generation and API sync
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Connected</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Primary Bank</Label>
              <Select defaultValue="hbl">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hbl">Habib Bank Limited (HBL)</SelectItem>
                  <SelectItem value="mcb">MCB Bank Limited</SelectItem>
                  <SelectItem value="ubl">United Bank Limited</SelectItem>
                  <SelectItem value="meezan">Meezan Bank</SelectItem>
                  <SelectItem value="scb">Standard Chartered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Advice Format</Label>
              <Select defaultValue="iban_csv">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iban_csv">IBAN-based CSV</SelectItem>
                  <SelectItem value="account_csv">Account Number CSV</SelectItem>
                  <SelectItem value="xml">ISO 20022 XML</SelectItem>
                  <SelectItem value="api">Real-time API Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-submit to bank</p>
                <p className="text-xs text-slate-500">Send advice file on pay date</p>
              </div>
              <Switch checked={sapSync} onCheckedChange={setSapSync} />
            </div>
          </CardContent>
        </Card>

        {/* Payslip Template */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Payslip Template</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual design and fields shown on employee payslips
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Active Template</Label>
              <Select defaultValue="standard_pk">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_pk">Standard Pakistan</SelectItem>
                  <SelectItem value="detailed">Detailed Breakdown</SelectItem>
                  <SelectItem value="compact">Compact Single-Page</SelectItem>
                  <SelectItem value="arabic">Bilingual (EN / UR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded p-2">
                <p className="text-xs text-slate-500">Paper Size</p>
                <p className="text-sm font-semibold text-slate-800">A4</p>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <p className="text-xs text-slate-500">Language</p>
                <p className="text-sm font-semibold text-slate-800">English</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-900">Show YTD totals</p>
                <p className="text-xs text-slate-500">Include year-to-date figures</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="h-3 w-3 mr-2" />
              Open Template Designer
            </Button>
          </CardContent>
        </Card>

        {/* Approval Workflow */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Approval Workflow</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Who needs to approve before payroll is finalized
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {[
                { step: 1, role: "HR Manager", status: "Required" },
                { step: 2, role: "Finance Controller", status: "Required" },
                { step: 3, role: "CFO", status: "Required > 5M PKR" },
              ].map((lvl) => (
                <div
                  key={lvl.step}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="h-6 w-6 rounded-full bg-indigo-900 text-white text-xs font-bold flex items-center justify-center">
                    {lvl.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{lvl.role}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {lvl.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-approve below threshold</p>
                <p className="text-xs text-slate-500">Skip workflow for small adjustments</p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <Bell className="h-5 w-5 text-rose-700" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Notifications</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  How and when to notify employees and managers about payroll events
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-semibold">Email</p>
                  </div>
                  <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                </div>
                <p className="text-xs text-slate-500">Payslip delivery, approvals, errors</p>
              </div>

              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-semibold">SMS</p>
                  </div>
                  <Switch checked={notifSms} onCheckedChange={setNotifSms} />
                </div>
                <p className="text-xs text-slate-500">Critical alerts only (PKR 2/SMS)</p>
              </div>

              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-semibold">Push</p>
                  </div>
                  <Switch checked={notifPush} onCheckedChange={setNotifPush} />
                </div>
                <p className="text-xs text-slate-500">Mobile app notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
