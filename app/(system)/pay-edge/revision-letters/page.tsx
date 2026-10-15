"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Download,
  Send,
  Eye,
  Calendar,
  TrendingUp,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const REVISION_REASONS = [
  "Annual Increment",
  "Promotion",
  "Performance Bonus Adjustment",
  "Market Correction",
  "Role Change",
  "Confirmation After Probation",
  "Other",
];

export default function RevisionLettersPage() {
  const [employeeCode, setEmployeeCode] = useState("EMP-1034");
  const [employeeName, setEmployeeName] = useState("Fatima Sheikh");
  const [oldSalary, setOldSalary] = useState("185000");
  const [newSalary, setNewSalary] = useState("215000");
  const [effectiveDate, setEffectiveDate] = useState("2026-05-01");
  const [reason, setReason] = useState("Annual Increment");

  const diff = Number(newSalary) - Number(oldSalary);
  const pct = Number(oldSalary) > 0 ? (diff / Number(oldSalary)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salary Revision Letters</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate formal salary revision letters with automatic calculation and template-based
            formatting. Supports single and bulk issuance.
          </p>
        </div>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Employee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Search Employee</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Enter code or name..."
                    className="pl-9"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-900">
                    FS
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{employeeName}</p>
                    <p className="text-xs text-slate-500">
                      {employeeCode} · QC Inspector · Quality Control
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Salary Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Current Salary (Gross, PKR)</Label>
                <Input
                  type="number"
                  value={oldSalary}
                  onChange={(e) => setOldSalary(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Revised Salary (Gross, PKR)</Label>
                <Input
                  type="number"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
              {diff !== 0 && (
                <div
                  className={`rounded-lg p-3 ${
                    diff > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p className="text-xs text-slate-600">Change</p>
                  <p
                    className={`text-lg font-bold ${
                      diff > 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {diff > 0 ? "+" : ""}
                    PKR {diff.toLocaleString()}{" "}
                    <span className="text-sm font-medium">({pct.toFixed(1)}%)</span>
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs">Effective Date</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVISION_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Any remarks to include in the letter..."
                  className="mt-1 h-20"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Preview */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Letter Preview
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Template: Standard Revision
              </Badge>
            </CardHeader>
            <CardContent>
              {/* A4-styled preview */}
              <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm min-h-[600px] text-sm text-slate-800 font-serif">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold">BATA GROUP PAKISTAN</h2>
                    <p className="text-xs text-slate-600">
                      Head Office · Korangi Industrial Area, Karachi
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>Ref: HR/REV/2026/0412</p>
                    <p>
                      Date:{" "}
                      {new Date(effectiveDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <p className="mb-4">
                  <strong>{employeeName}</strong>
                  <br />
                  {employeeCode}
                  <br />
                  QC Inspector, Quality Control Department
                </p>

                <p className="mb-4 font-bold underline">Subject: Salary Revision</p>

                <p className="mb-4">Dear {employeeName.split(" ")[0]},</p>

                <p className="mb-4 leading-relaxed">
                  We are pleased to inform you that based on your performance and contribution to
                  the organization, your monthly gross salary has been revised as follows, with
                  effect from{" "}
                  <strong>
                    {new Date(effectiveDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  .
                </p>

                <div className="bg-slate-50 rounded p-4 mb-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Previous Gross Salary:</span>
                    <span className="font-mono font-semibold">
                      PKR {Number(oldSalary).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revised Gross Salary:</span>
                    <span className="font-mono font-semibold">
                      PKR {Number(newSalary).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                    <span>Increase:</span>
                    <span className="font-mono font-bold text-green-700">
                      PKR {diff.toLocaleString()} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <p className="mb-4 leading-relaxed">
                  This revision is granted on account of <strong>{reason.toLowerCase()}</strong>.
                  All other terms and conditions of your employment remain unchanged.
                </p>

                <p className="mb-6 leading-relaxed">
                  We appreciate your continued dedication and look forward to your ongoing
                  contributions to the company's success.
                </p>

                <div className="mt-12">
                  <p className="font-semibold">Sincerely,</p>
                  <div className="mt-8 border-t border-slate-300 pt-1 w-48">
                    <p className="font-semibold text-xs">Head of Human Resources</p>
                    <p className="text-xs text-slate-600">Bata Group Pakistan</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button className="bg-indigo-900 hover:bg-indigo-800">
                  <Send className="h-4 w-4 mr-2" />
                  Generate &amp; Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
